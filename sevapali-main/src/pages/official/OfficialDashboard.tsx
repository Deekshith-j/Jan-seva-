import React, { useEffect } from 'react';
import OfficialLayout from '@/components/layout/OfficialLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQueueTokens, useTodayStats, useCallNextToken, useUpdateTokenStatus } from '@/hooks/useTokens';
import { useOfficialRealtime } from '@/hooks/useRealtime';
import { supabase } from '@/integrations/supabase/client';
import { Users, Ticket, Clock, TrendingUp, Play, SkipForward, CheckCircle, CalendarClock } from 'lucide-react';
import AshokaLoader from '@/components/ui/AshokaLoader';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

const OfficialDashboard: React.FC = () => {
  const { language } = useLanguage();
  const { user, profile, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  // Wait for profile to load to avoid undefined queries
  if (authLoading) {
    return <OfficialLayout><AshokaLoader /></OfficialLayout>;
  }

  // Use assigned office and department for filtering
  const officeId = profile?.assigned_office_id || undefined;
  const departmentId = profile?.assigned_department_id || undefined;

  const { data: queueTokens, isLoading: queueLoading } = useQueueTokens(officeId, departmentId);
  const { data: stats, isLoading: statsLoading } = useTodayStats();
  const callNextMutation = useCallNextToken();
  const updateStatusMutation = useUpdateTokenStatus();

  // Subscribe to official realtime updates
  useOfficialRealtime(officeId, departmentId);

  // Cleaned up manual subscription since hook handles it
  /* 
  useEffect(() => { ... } // Removed old manual subscription 
  */

  const handleCallNext = async () => {
    try {
      const nextToken = await callNextMutation.mutateAsync();
      if (nextToken) {
        toast.success(
          language === 'mr'
            ? `पुढील टोकन: ${nextToken.token_number}`
            : `Next token: ${nextToken.token_number}`
        );
      } else {
        toast.info(
          language === 'mr'
            ? 'रांगेत कोणी नाही'
            : 'No one in queue'
        );
      }
    } catch (error) {
      toast.error(language === 'mr' ? 'त्रुटी आली' : 'Error occurred');
    }
  };

  const handleSkip = async (tokenId: string) => {
    try {
      await updateStatusMutation.mutateAsync({ tokenId, status: 'skipped' });
      toast.info(language === 'mr' ? 'टोकन वगळला' : 'Token skipped');
    } catch (error) {
      toast.error(language === 'mr' ? 'त्रुटी आली' : 'Error occurred');
    }
  };

  const currentlyServing = queueTokens?.find(t => t.status === 'serving');
  const liveQueue = queueTokens?.filter(t => t.status === 'waiting') || [];
  const checkedIn = queueTokens?.filter(t => t.status === 'checked_in') || []; // Checked in but not verified yet (if separate step) or just checked in
  // Actually, 'waiting' means verified and in live queue. 'checked_in' means scanned but maybe not verified? 
  // Let's assume:
  // 1. Pending -> (Scan) -> Checked_in -> (Verify) -> Waiting -> (Call) -> Serving
  // So 'Live Queue' for calling next should be 'waiting'.
  // 'Checked-in' are those at the desk being verified? Or just arrived.

  const pendingReservations = queueTokens?.filter(t => t.status === 'pending') || [];
  const missedTokens = queueTokens?.filter(t => t.status === 'skipped') || [];

  const statCards = [
    {
      label: language === 'mr' ? 'एकूण टोकन' : "Total Booked",
      value: statsLoading ? '...' : stats?.total || 0,
      icon: Ticket,
      color: 'bg-primary'
    },
    {
      label: language === 'mr' ? 'चेक-इन' : 'Checked-In (Arrived)',
      value: checkedIn.length + liveQueue.length + (currentlyServing ? 1 : 0), // All who arrived
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      label: language === 'mr' ? 'रांगेत' : 'Live Queue (Waiting)',
      value: liveQueue.length,
      icon: Clock,
      color: 'bg-orange-500' // Warning color
    },
    {
      label: language === 'mr' ? 'सेवित' : 'Served',
      value: statsLoading ? '...' : stats?.served || 0,
      icon: CheckCircle,
      color: 'bg-green-500'
    },
    {
      label: language === 'mr' ? 'वगळलेले' : 'Missed/Skipped',
      value: missedTokens.length, // Or stats.skipped if we add that to hook
      icon: SkipForward,
      color: 'bg-red-500'
    },
  ];

  return (
    <OfficialLayout>
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {language === 'mr' ? 'नमस्कार' : 'Welcome'}, {profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0]}! 👋
          </h1>
          <p className="text-muted-foreground">{language === 'mr' ? 'रांग व्यवस्थापन डॅशबोर्ड' : 'Queue Management Dashboard'}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {statCards.map((stat, i) => (
            <Card key={i} variant="stat">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="h-5 w-5 text-primary-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Quick Action & Currently Serving */}
          <div className="space-y-6">
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>{language === 'mr' ? 'त्वरित कृती' : 'Quick Action'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  <div className="p-4 rounded-xl bg-accent/10 border border-accent/20 flex flex-col justify-center items-center text-center">
                    <h3 className="text-lg font-semibold text-accent mb-1">{language === 'mr' ? 'सध्या सेवेत' : 'Now Serving'}</h3>
                    {currentlyServing ? (
                      <div className="space-y-2">
                        <span className="text-4xl font-bold">{currentlyServing.token_number}</span>
                        <p className="text-sm text-muted-foreground">{currentlyServing.service_name}</p>
                        <Button size="sm" variant="ghost" className="mt-2 text-destructive" onClick={() => handleSkip(currentlyServing.id)}>
                          Skip <SkipForward className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    ) : (
                      <p className="text-muted-foreground italic">Counter is free</p>
                    )}
                  </div>

                  <Button
                    variant="hero"
                    size="lg"
                    className="w-full py-8 text-xl"
                    onClick={handleCallNext}
                    disabled={callNextMutation.isPending}
                  >
                    {callNextMutation.isPending ? (
                      <AshokaLoader size="sm" className="mr-2" />
                    ) : (
                      <Play className="h-6 w-6 mr-2" />
                    )}
                    {language === 'mr' ? 'पुढील टोकन कॉल करा' : 'Call Next Token'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Live Queue */}
          <div>
            <Card variant="elevated" className="h-full">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{language === 'mr' ? 'थेट रांग' : 'Live Queue'}</span>
                  <Badge variant="outline">{liveQueue.length} Waiting</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
                {queueLoading ? (
                  <div className="flex justify-center py-8">
                    <AshokaLoader size="lg" />
                  </div>
                ) : liveQueue.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    {language === 'mr' ? 'रांगेत कोणी नाही' : 'No one checked-in yet'}
                  </p>
                ) : (
                  liveQueue.map((item, i) => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl hover:bg-muted transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
                          {item.position_in_queue || i + 1}
                        </div>
                        <div>
                          <p className="font-bold text-lg">{item.token_number}</p>
                          <p className="text-sm text-muted-foreground">{item.service_name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{language === 'mr' ? 'अंदाजे' : 'Est.'} {item.estimated_wait_minutes}m</p>
                        <p className="text-xs text-muted-foreground">Wait</p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Upcoming Reservations - Full Width */}
        <div className="w-full">
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>{language === 'mr' ? 'आजचे बुकिंग (येणारे)' : "Today's Bookings (Pending)"}</span>
                <Badge variant="secondary">{pendingReservations.length} Pending</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                    <tr>
                      <th className="px-4 py-3">Token</th>
                      <th className="px-4 py-3">Time Slot</th>
                      <th className="px-4 py-3">Service</th>
                      <th className="px-4 py-3">Platform</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Combine Pending and Checked In for this view, or separate? Let's combine but highlight Checked In */}
                    {[...checkedIn, ...pendingReservations].length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-4 text-center text-muted-foreground">
                          No pending bookings for today.
                        </td>
                      </tr>
                    ) : (
                      [...checkedIn, ...pendingReservations].map((token) => (
                        <tr key={token.id} className={`border-b hover:bg-muted/50 ${token.status === 'checked_in' ? 'bg-primary/5' : ''}`}>
                          <td className="px-4 py-3 font-medium">
                            {token.token_number}
                            {token.status === 'checked_in' && (
                              <Badge className="ml-2 bg-primary text-white hover:bg-primary/90">Arrived</Badge>
                            )}
                          </td>
                          <td className="px-4 py-3">{token.appointment_time}</td>
                          <td className="px-4 py-3">{token.service_name}</td>
                          <td className="px-4 py-3">
                            App
                          </td>
                          <td className="px-4 py-3">
                            {token.status === 'checked_in' ? (
                              <Button size="sm" variant="outline" className="h-7 border-primary text-primary" onClick={() => window.location.href = `/official/verify/${token.id}`}>
                                Verify
                              </Button>
                            ) : (
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                Pending Arrival
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </OfficialLayout>
  );
};

export default OfficialDashboard;
