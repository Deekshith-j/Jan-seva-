import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { Bell, Check, Trash2, Clock, Ticket, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useMyTokens, Token } from '@/hooks/useTokens';
import { formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';

interface Notification {
  id: string;
  type: 'token' | 'alert' | 'success' | 'info';
  title: string;
  message: string;
  time: string;
  read: boolean;
  data?: Token;
}

const Notifications: React.FC = () => {
  const { language } = useLanguage();
  const { data: tokens, isLoading } = useMyTokens();

  // Derive notifications from real tokens
  // In a real app with a dedicated notifications table, we would fetch that.
  // Here we simulate "notifications" based on the status of tokens.
  const notifications: Notification[] = React.useMemo(() => {
    if (!tokens) return [];

    return tokens.map(token => {
      let type: Notification['type'] = 'info';
      let title = '';
      let message = '';

      const isMarathi = language === 'mr';

      switch (token.status) {
        case 'pending':
        case 'waiting':
          type = 'alert';
          title = isMarathi ? 'रांग अपडेट' : 'Queue Update';
          message = isMarathi
            ? `तुमचे टोकन ${token.token_number} रांगेत आहे. कृपया प्रतीक्षा करा.`
            : `Your token ${token.token_number} is in the queue. Please wait.`;
          break;
        case 'serving':
          type = 'token';
          title = isMarathi ? 'टोकन तयार' : 'Token Ready';
          message = isMarathi
            ? `तुमचे टोकन ${token.token_number} आता सेवेसाठी तयार आहे!`
            : `Your token ${token.token_number} is now ready for service!`;
          break;
        case 'completed':
          type = 'success';
          title = isMarathi ? 'सेवा पूर्ण' : 'Service Completed';
          message = isMarathi
            ? `तुमचे टोकन ${token.token_number} साठी सेवा यशस्वीरित्या पूर्ण झाली.`
            : `Service for token ${token.token_number} has been completed successfully.`;
          break;
        case 'cancelled':
          type = 'alert';
          title = isMarathi ? 'टोकन रद्द' : 'Token Cancelled';
          message = isMarathi
            ? `तुमचे टोकन ${token.token_number} रद्द करण्यात आले आहे.`
            : `Your token ${token.token_number} has been cancelled.`;
          break;
        default:
          type = 'info';
          title = isMarathi ? 'टोकन स्थिती' : 'Token Status';
          message = isMarathi
            ? `टोकन ${token.token_number}: ${token.status}`
            : `Token ${token.token_number}: ${token.status}`;
      }

      return {
        id: token.id,
        type,
        title,
        message,
        time: formatDistanceToNow(new Date(token.created_at), { addSuffix: true }),
        read: token.status === 'completed' || token.status === 'cancelled', // Auto-read completed/cancelled
        data: token
      };
    }).sort((a, b) => {
      // Sort by "unread" (active) first, then mock time
      if (a.read === b.read) return 0;
      return a.read ? 1 : -1;
    });
  }, [tokens, language]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'token': return Ticket;
      case 'alert': return Clock;
      case 'success': return CheckCircle;
      default: return AlertCircle;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'token': return 'bg-primary text-primary-foreground';
      case 'alert': return 'bg-warning text-warning-foreground';
      case 'success': return 'bg-success text-success-foreground';
      default: return 'bg-accent text-accent-foreground';
    }
  };

  const markAllAsRead = () => {
    toast.info(language === 'mr' ? 'हे फक्त प्रदर्शनासाठी आहे (अद्यतने थेट डेटावर आधारित आहेत)' : 'This is just for display (updates are based on live data)');
  };

  const clearAll = () => {
    toast.info(language === 'mr' ? 'तुम्ही थेट डेटाच्या सूचना पुसल्या शकत नाही' : 'You cannot clear live data notifications');
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
              <Bell className="h-7 w-7" />
              {language === 'mr' ? 'सूचना' : 'Notifications'}
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">{unreadCount}</Badge>
              )}
            </h1>
            <p className="text-muted-foreground mt-1">
              {language === 'mr' ? 'तुमच्या सर्व सूचना येथे पहा' : 'View all your notifications here'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={markAllAsRead} disabled={unreadCount === 0}>
              <Check className="h-4 w-4 mr-2" />
              {language === 'mr' ? 'सर्व वाचा' : 'Mark All Read'}
            </Button>
            <Button variant="outline" onClick={clearAll} disabled={notifications.length === 0}>
              <Trash2 className="h-4 w-4 mr-2" />
              {language === 'mr' ? 'सर्व हटवा' : 'Clear All'}
            </Button>
          </div>
        </div>

        <Card variant="elevated">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-12 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {language === 'mr' ? 'कोणत्याही सूचना नाहीत' : 'No notifications'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((notification) => {
                  const Icon = getIcon(notification.type);
                  return (
                    <div
                      key={notification.id}
                      className={`p-4 flex items-start gap-4 hover:bg-muted/50 transition-colors ${!notification.read ? 'bg-primary/5' : ''}`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getIconColor(notification.type)}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-foreground flex items-center gap-2">
                              {notification.title}
                              {!notification.read && (
                                <Badge variant="default" className="text-xs">
                                  {language === 'mr' ? 'सक्रिय' : 'Active'}
                                </Badge>
                              )}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                            <p className="text-xs text-muted-foreground mt-2">{notification.time}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Notifications;