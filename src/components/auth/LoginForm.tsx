import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Truck, ShieldCheck, User, Lock, Eye, EyeOff } from 'lucide-react';
import { User as UserType } from '@/pages/Index';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Link } from 'react-router-dom';
import { supabase } from '@/supabaseClient';

interface LoginFormProps {
  onLogin: (user: UserType) => void;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMsg, setResetMsg] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      setIsLoading(false);
      if (error || !data.user) {
        setError(error?.message || 'Login failed.');
        return;
      }
      onLogin({
        id: data.user.id,
        name: data.user.user_metadata?.name || data.user.email,
        email: data.user.email,
        role: data.user.user_metadata?.role || 'user',
      });
    } catch (err: any) {
      setIsLoading(false);
      setError('Network error');
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetMsg(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail);
      setResetLoading(false);
      if (error) {
        setResetMsg(error.message || 'Failed to send reset email.');
        return;
      }
      setResetMsg('Password reset email sent! Please check your inbox.');
    } catch (err: any) {
      setResetLoading(false);
      setResetMsg('Network error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-logistics-primary/10 rounded-full blur-3xl animate-pulse-glow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-logistics-accent/10 rounded-full blur-3xl animate-pulse-glow delay-1000"></div>
      </div>

      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md glass-effect border-0 shadow-logistics-lg animate-scale-in">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-logistics-primary to-logistics-accent rounded-2xl flex items-center justify-center mb-4 shadow-logistics">
            <Truck className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold font-poppins bg-gradient-to-r from-logistics-primary to-logistics-accent bg-clip-text text-transparent">
            WFL PVT LTD
          </CardTitle>
          <CardDescription className="text-lg">
            Advanced Billing & Data Management Platform
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {!showForgot ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 border-2 transition-all duration-200 focus:border-logistics-primary"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12 border-2 transition-all duration-200 focus:border-logistics-primary"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-2 h-8 w-8 p-0"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-xs text-logistics-primary hover:underline"
                  onClick={() => setShowForgot(true)}
                >
                  Forgot Password?
                </button>
              </div>

              {error && <div className="text-red-500 text-sm text-center">{error}</div>}

              <Button 
                type="submit" 
                className="w-full h-12 text-lg font-medium logistics-gradient hover:shadow-logistics transition-all duration-200 hover:scale-[1.02]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Signing In...</span>
                  </div>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5 mr-2" />
                    Sign In
                  </>
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleForgot} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email" className="text-sm font-medium">Enter your email to reset password</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="Enter your email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                />
              </div>
              {resetMsg && <div className={`text-sm text-center ${resetMsg.includes('sent') ? 'text-green-600' : 'text-red-500'}`}>{resetMsg}</div>}
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowForgot(false)}>
                  Back to Login
                </Button>
                <Button type="submit" className="flex-1" disabled={resetLoading}>
                  {resetLoading ? 'Sending...' : 'Send Reset Email'}
                </Button>
              </div>
            </form>
          )}
          <div className="text-center mt-4">
            <span className="text-sm">Don't have an account? </span>
            <Link to="/register" className="text-logistics-primary hover:underline font-medium">
              Register
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
