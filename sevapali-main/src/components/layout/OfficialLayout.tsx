import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
    LayoutDashboard,
    Users,
    QrCode,
    FileText,
    BarChart,
    Settings,
    LogOut,
    Menu,
    X,
    Bell,
    ChevronRight,
    Power
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface OfficialLayoutProps {
    children: React.ReactNode;
}

const OfficialLayout: React.FC<OfficialLayoutProps> = ({ children }) => {
    const { user, profile, logout, role, isLoading } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isActiveCounter, setIsActiveCounter] = useState(false);
    const [isToggling, setIsToggling] = useState(false);

    // Strict Role Check (Redundant but safe)
    useEffect(() => {
        if (!isLoading && user && role !== 'official') {
            navigate('/citizen/dashboard', { replace: true });
        }
    }, [user, role, navigate, isLoading]);

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>; // Or AshokaLoader
    }

    // Fetch initial counter status
    useEffect(() => {
        if (profile?.is_active_counter !== undefined) {
            setIsActiveCounter(profile.is_active_counter);
        } else if (user) {
            // Fallback fetch if profile context is stale or incomplete
            const fetchStatus = async () => {
                const { data } = await supabase
                    .from('profiles')
                    .select('is_active_counter')
                    .eq('id', user.id)
                    .eq('id', user.id)
                    .single();
                if (data) setIsActiveCounter((data as any).is_active_counter || false);
            };
            fetchStatus();
        }
    }, [profile, user]);

    // Real-time Notifications for New Bookings
    useEffect(() => {
        if (!process.env.NODE_ENV || !profile?.office_id) return;

        const channel = supabase
            .channel('official-notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'tokens',
                    filter: `office_id=eq.${profile.office_id}`
                },
                (payload: any) => {
                    const newToken = payload.new;
                    toast.info(
                        "New Booking Received",
                        {
                            description: `Token: ${newToken.token_number} for ${newToken.service_name}`,
                            duration: 5000,
                            action: {
                                label: "View",
                                onClick: () => navigate('/official/dashboard')
                            }
                        }
                    );
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [profile?.office_id, navigate]);

    const handleToggleStatus = async (checked: boolean) => {
        if (!user) return;
        setIsToggling(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ is_active_counter: checked })
                .eq('id', user.id);

            if (error) throw error;
            setIsActiveCounter(checked);
            toast.success(checked ? "Counter Opened (Active)" : "Counter Closed (Inactive)");
        } catch (error) {
            toast.error("Failed to update status");
            setIsActiveCounter(!checked); // Revert UI
        } finally {
            setIsToggling(false);
        }
    };

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/official/dashboard' },
        { icon: QrCode, label: 'QR Scanner', path: '/official/scan' },
        { icon: Users, label: 'Queue Management', path: '/official/queue' },
        { icon: FileText, label: 'Verify Documents', path: '/official/verify/placeholder' }, // Placeholder link
        { icon: BarChart, label: 'Analytics', path: '/official/analytics' },
        { icon: Settings, label: 'Settings', path: '/official/settings' },
    ];

    const handleLogout = async () => {
        if (isLoggingOut) return;
        setIsLoggingOut(true);
        try {
            await logout();
            navigate('/official/login', { replace: true });
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
          fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border
          transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="h-16 flex items-center justify-between px-4 border-b border-border">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                                <span className="text-primary-foreground font-bold">SP</span>
                            </div>
                            <span className="font-bold text-lg">Official Portal</span>
                        </div>
                        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* User Profile */}
                    <div className="p-4 border-b border-border">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-semibold">
                                {profile?.full_name?.charAt(0) || 'O'}
                            </div>
                            <div className="overflow-hidden">
                                <p className="font-medium truncate">{profile?.full_name || 'Official'}</p>
                                <div className="flex items-center gap-1">
                                    <div className={`w-2 h-2 rounded-full ${isActiveCounter ? 'bg-green-500' : 'bg-red-500'}`} />
                                    <p className="text-xs text-muted-foreground uppercase">{isActiveCounter ? 'Active' : 'Inactive'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                        {/* Status Toggle in Sidebar for Mobile/Easy Access */}
                        <div className="mb-4 p-3 bg-muted/50 rounded-lg flex items-center justify-between lg:hidden">
                            <span className="text-sm font-medium">Counter Status</span>
                            <Switch
                                checked={isActiveCounter}
                                onCheckedChange={handleToggleStatus}
                                disabled={isToggling}
                            />
                        </div>

                        {menuItems.map((item) => {
                            const isActive = location.pathname === item.path || (item.path.includes('verify') && location.pathname.includes('verify'));
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${isActive
                                            ? 'bg-primary text-primary-foreground'
                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                        }
                  `}
                                >
                                    <item.icon className="h-4 w-4" />
                                    {item.label}
                                    {isActive && <ChevronRight className="h-3 w-3 ml-auto" />}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Footer */}
                    <div className="p-4 border-t border-border">
                        <Button
                            variant="outline"
                            className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                        >
                            <LogOut className="h-4 w-4" />
                            {isLoggingOut ? 'Logging out...' : 'Logout'}
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
                {/* Mobile Header */}
                <header className="h-16 flex items-center justify-between px-4 border-b border-border bg-card">
                    <div className="flex items-center gap-2 lg:hidden">
                        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
                            <Menu className="h-5 w-5" />
                        </Button>
                        <span className="font-bold">JanSeva Official</span>
                    </div>

                    {/* Desktop Header Content (Right Side) */}
                    <div className="flex-1 flex justify-end items-center gap-4">
                        {/* Desktop Status Toggle */}
                        <div className="hidden lg:flex items-center gap-3 px-4 border-r border-border h-8">
                            <span className={`text-sm font-medium ${isActiveCounter ? 'text-green-600' : 'text-muted-foreground'}`}>
                                {isActiveCounter ? 'Counter Open' : 'Counter Closed'}
                            </span>
                            <Switch
                                checked={isActiveCounter}
                                onCheckedChange={handleToggleStatus}
                                disabled={isToggling}
                            />
                        </div>

                        <Button variant="ghost" size="icon">
                            <Bell className="h-5 w-5" />
                        </Button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 bg-muted/10">
                    <div className="max-w-7xl mx-auto">
                        {!isActiveCounter && (
                            <div className="bg-warning/20 border border-warning text-warning-foreground px-4 py-2 rounded-lg mb-4 flex items-center justify-center gap-2">
                                <Power className="h-4 w-4" />
                                <span className="font-medium text-sm">Counter is currently closed. You will not receive new assignments.</span>
                            </div>
                        )}
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default OfficialLayout;
