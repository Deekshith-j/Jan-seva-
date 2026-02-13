import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { User, Briefcase, Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

const Login: React.FC = () => {
  const { t, language } = useLanguage();
  const { login, devLogin, role, isAuthenticated, isLoading: authLoading } = useAuth();
  // ... existing code ...
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated based on role (wait for auth to finish loading)
  React.useEffect(() => {
    if (!authLoading && isAuthenticated && role) {
      navigate(role === 'official' ? '/official/dashboard' : '/citizen/dashboard', { replace: true });
    }
  }, [authLoading, isAuthenticated, role, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (email === 'dev@citizen.com' && password === 'dev123') {
        if (devLogin) {
          await devLogin();
          // Navigate manually since useEffect might not pick up the local state change immediately if strict mode doubles it
          // but AuthContext state update should trigger re-render.
          // Let's rely on the useEffect redirect or manual one.
          navigate('/citizen/dashboard');
        }
      } else {
        await login(email, password);
        toast.success(t.login.loginSuccess);
      }
    } catch (error: any) {
      console.error(error);
      if (error.message?.includes('Rate limit')) {
        toast.error("Rate limit hit. Please wait or use a different IP/Email.");
      } else {
        toast.error(error.message || t.login.loginFailed);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <Header />

      <main className="container mx-auto px-4 pt-28 pb-20 min-h-screen flex items-center justify-center">
        <div className="w-full max-w-lg">
          <Card variant="elevated" className="animate-fade-in">
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-lg">
                <User className="h-8 w-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl">
                {t.login.citizen} {t.nav.login}
              </CardTitle>
              <CardDescription>
                {t.login.signinToAccount}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t.login.email}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">{t.login.password}</Label>
                    <a href="#" className="text-xs text-primary hover:underline">
                      {t.login.forgotPassword}
                    </a>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      {t.common.loading}
                    </span>
                  ) : (
                    <>
                      {t.login.signIn}
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                {t.login.noAccount}{' '}
                <Link to="/register" className="text-primary font-medium hover:underline">
                  {t.login.register}
                </Link>
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <Link to="/official/login">
                  <Button variant="outline" className="w-full" size="lg">
                    <Briefcase className="h-4 w-4 mr-2" />
                    {t.login.official} {t.nav.login}
                    <ShieldCheck className="h-4 w-4 ml-2 text-accent" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Login;
