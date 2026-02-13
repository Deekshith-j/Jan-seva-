import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { TrendingUp, Users, Clock, CheckCircle, Calendar, ArrowUp, ArrowDown } from 'lucide-react';

const Analytics: React.FC = () => {
  const { language } = useLanguage();

  const { user } = useAuth();

  // 1. Get Official's Office
  const { data: userRole } = useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles' as any)
        .select('office_id')
        .eq('user_id', user?.id)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!user?.id,
  });

  const officeId = (userRole as any)?.office_id;

  // 2. Fetch Analytics
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics', officeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_analytics' as any, { p_office_id: officeId });

      if (error) throw error;
      return data as any;
    },
    enabled: !!officeId,
    refetchInterval: 30000, // Refresh every 30s
  });

  const stats = [
    {
      label: language === 'mr' ? 'आज सेवित' : 'Served Today',
      value: analytics?.served?.toString() || '0',
      change: 'Today',
      positive: true,
      icon: CheckCircle,
      color: 'bg-success'
    },
    {
      label: language === 'mr' ? 'सरासरी प्रतीक्षा वेळ' : 'Avg. Wait Time',
      value: `${analytics?.avg_wait || 0} min`,
      change: 'Avg',
      positive: true,
      icon: Clock,
      color: 'bg-accent'
    },
    {
      label: language === 'mr' ? 'प्रलंबित टोकन' : 'Waiting Tokens',
      value: analytics?.waiting?.toString() || '0',
      change: 'Live',
      positive: false,
      icon: Users,
      color: 'bg-primary'
    },
    {
      label: language === 'mr' ? 'एकूण' : 'Total Tokens',
      value: analytics?.total?.toString() || '0',
      change: 'Today',
      positive: true,
      icon: TrendingUp,
      color: 'bg-warning'
    },
  ];

  const weeklyData = [
    { name: language === 'mr' ? 'सोम' : 'Mon', tokens: 145, wait: 15 }, // Placeholder for now as RPC returns today only
    { name: language === 'mr' ? 'मंगळ' : 'Tue', tokens: 168, wait: 12 },
    { name: language === 'mr' ? 'बुध' : 'Wed', tokens: 132, wait: 18 },
    { name: language === 'mr' ? 'गुरू' : 'Thu', tokens: 189, wait: 10 },
    { name: language === 'mr' ? 'शुक्र' : 'Fri', tokens: 156, wait: 14 },
    { name: language === 'mr' ? 'शनि' : 'Sat', tokens: 98, wait: 8 },
  ];

  const serviceData = analytics?.services?.map((s: any, i: number) => ({
    name: s.name,
    value: parseInt(s.value),
    color: `hsl(var(--${['primary', 'accent', 'success', 'warning'][i % 4]}))`
  })) || [];

  const hourlyData = analytics?.hourly?.map((h: any) => ({
    hour: `${h.hour}:00`,
    count: parseInt(h.count)
  })) || [];

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {language === 'mr' ? 'विश्लेषण' : 'Analytics'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {language === 'mr' ? 'सेवा कार्यप्रदर्शन आणि आकडेवारी' : 'Service performance and statistics'}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {language === 'mr' ? 'या आठवड्यातील डेटा' : 'This week\'s data'}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <Card key={i} variant="stat">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                    <div className={`flex items-center gap-1 text-sm mt-1 ${stat.positive ? 'text-success' : 'text-destructive'}`}>
                      {stat.positive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                      {stat.change}
                    </div>
                  </div>
                  <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="h-5 w-5 text-primary-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Weekly Tokens Chart */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>{language === 'mr' ? 'साप्ताहिक टोकन' : 'Weekly Tokens'}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="tokens" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Service Distribution */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>{language === 'mr' ? 'सेवा वितरण' : 'Service Distribution'}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={serviceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {serviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {serviceData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-muted-foreground">{item.name} ({item.value}%)</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Hourly Pattern */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>{language === 'mr' ? 'तासानुसार पॅटर्न' : 'Hourly Pattern'}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--accent))"
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--accent))', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;