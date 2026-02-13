import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';

export type UserRole = 'citizen' | 'official' | null;

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  is_active_counter?: boolean;
  current_counter_number?: string | null;
  assigned_office_id?: string | null;
  assigned_department_id?: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, role: UserRole, additionalData?: any) => Promise<void>;
  logout: () => Promise<void>;
  selectedRole: UserRole;
  setSelectedRole: (role: UserRole) => void;
  devLogin?: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);

  const fetchProfile = async (userId: string) => {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    setProfile(profileData);
  };

  const fetchRole = async (userId: string) => {
    const { data: roleData, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Failed to fetch role:', error);
      setRole(null);
      return;
    }

    setRole((roleData?.role as UserRole) ?? null);
  };

  // Records are created by database trigger (handle_new_user) with SECURITY DEFINER
  // No client-side upserts needed - trigger handles profiles + user_roles creation

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Use setTimeout to avoid potential deadlock with Supabase client
          setTimeout(async () => {
            await Promise.all([
              fetchProfile(session.user.id),
              fetchRole(session.user.id),
            ]);
            setIsLoading(false);
          }, 0);
        } else {
          setProfile(null);
          setRole(null);
          setIsLoading(false);
        }
      }
    );

    // THEN check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        setTimeout(async () => {
          await Promise.all([
            fetchProfile(session.user.id),
            fetchRole(session.user.id),
          ]);
          setIsLoading(false);
        }, 0);
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  };

  const register = async (email: string, password: string, fullName: string, role: UserRole, additionalData?: any) => {
    // The database trigger (handle_new_user) will automatically create
    // profile and user_roles records using SECURITY DEFINER
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: fullName,
          role,
          ...additionalData,
        },
      },
    });

    if (error) throw error;
  };

  const logout = async () => {
    // Clear local state first to prevent UI issues
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
    setSelectedRole(null);

    // Then sign out from Supabase (ignore errors if session already expired)
    try {
      await supabase.auth.signOut();
    } catch (error) {
      // Ignore session_not_found errors - user is already logged out

    }
  };

  const devLogin = async () => {
    // Mock User
    const mockUser: User = {
      id: 'dev-user-id',
      aud: 'authenticated',
      role: 'authenticated',
      email: 'dev@citizen.com',
      email_confirmed_at: new Date().toISOString(),
      phone: '',
      confirmed_at: new Date().toISOString(),
      last_sign_in_at: new Date().toISOString(),
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: { full_name: 'Dev Citizen' },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Mock Session
    const mockSession: Session = {
      access_token: 'dev-token',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'dev-refresh-token',
      user: mockUser,
    };

    setUser(mockUser);
    setSession(mockSession);
    setRole('citizen');
    setProfile({ id: 'dev-profile-id', user_id: 'dev-user-id', full_name: 'Dev Citizen', phone: '9999999999' });
    setIsLoading(false);
    toast.success("Dev Mode: Logged in locally (No Supabase)");
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      role,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
      selectedRole,
      setSelectedRole,
      // @ts-ignore
      devLogin,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
