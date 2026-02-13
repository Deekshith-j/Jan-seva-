
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useRealtimeNotifications = () => {
    const { user } = useAuth();

    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel('public:tokens')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'tokens',
                    filter: `user_id=eq.${user.id}`,
                },
                (payload: any) => {
                    const newToken = payload.new;
                    const oldToken = payload.old;

                    if (newToken.status !== oldToken.status) {
                        if (newToken.status === 'serving') {
                            toast.success(`Token ${newToken.token_number} is now being served! Please proceed to the counter.`);
                        } else if (newToken.status === 'completed') {
                            toast.success(`Service for Token ${newToken.token_number} completed.`);
                        } else if (newToken.status === 'cancelled') {
                            toast.error(`Token ${newToken.token_number} has been cancelled.`);
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);
};

export const useOfficialRealtime = (officeId: string | undefined, departmentId: string | undefined) => {
    const { user } = useAuth();

    useEffect(() => {
        if (!user || !officeId) return;

        const channel = supabase
            .channel(`official:tokens:${officeId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'tokens',
                    filter: `office_id=eq.${officeId}`, // optimize filtering
                },
                (payload: any) => {
                    const newToken = payload.new;
                    // Filter by department if applicable
                    if (departmentId && newToken.department_id !== departmentId) return;

                    toast.info(`New Token: ${newToken.token_number} - ${newToken.service_name}`);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, officeId, departmentId]);
};
