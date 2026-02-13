import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AshokaLoader from '@/components/ui/AshokaLoader';
import { useToast } from "@/components/ui/use-toast";

interface ProtectedRouteProps {
    children: React.ReactNode;
    role?: 'citizen' | 'official';
}

const ProtectedRoute = ({ children, role }: ProtectedRouteProps) => {
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [authenticated, setAuthenticated] = useState(false);
    const location = useLocation();
    const { toast } = useToast();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (!session) {
                    setAuthenticated(false);
                    setLoading(false);
                    return;
                }

                setAuthenticated(true);

                // Fetch user role from database
                const { data: userData, error } = await supabase
                    .from('user_roles')
                    .select('role')
                    .eq('user_id', session.user.id)
                    .single();

                if (error) {
                    console.error('Error fetching user role:', error);
                    toast({
                        variant: "destructive",
                        title: "Authentication Error",
                        description: "Could not verify user permissions."
                    });
                    setAuthenticated(false);
                } else {
                    setUserRole(userData?.role || null);
                }
            } catch (error) {
                console.error('Auth check error:', error);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (!session) {
                setAuthenticated(false);
                setUserRole(null);
                setLoading(false);
            } else {
                // Re-check role on auth change if needed, effectively handled by initial check usually
                // but for robustness we could re-fetch. For now, rely on initial check.
            }
        });

        return () => subscription.unsubscribe();
    }, [toast]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-background">
                <AshokaLoader size="xl" />
            </div>
        );
    }

    if (!authenticated) {
        // Redirect to login based on attempted role access or default
        if (location.pathname.startsWith('/official')) {
            return <Navigate to="/official/login" state={{ from: location }} replace />;
        }
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (role && userRole !== role) {
        // Role mismatch
        toast({
            variant: "destructive",
            title: "Unauthorized",
            description: `You do not have permission to access this area. Required: ${role}, Found: ${userRole}`
        });

        // Redirect to appropriate dashboard
        if (userRole === 'official') {
            return <Navigate to="/official/dashboard" replace />;
        } else {
            return <Navigate to="/citizen/dashboard" replace />;
        }
    }

    return <>{children}</>;
};

export default ProtectedRoute;
