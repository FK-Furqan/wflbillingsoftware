import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/supabaseClient';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setMsg('Passwords do not match.');
      return;
    }
    setLoading(true);
    setMsg('');
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (error || !data.user) {
        setMsg(error?.message || 'Registration failed.');
        return;
      }
      setMsg('Registration successful! Please check your email to confirm your account.');
    } catch (err) {
      setLoading(false);
      setMsg('Network error.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-logistics-primary/10 rounded-full blur-3xl animate-pulse-glow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-logistics-accent/10 rounded-full blur-3xl animate-pulse-glow delay-1000"></div>
      </div>
      <Card className="w-full max-w-md glass-effect border-0 shadow-logistics-lg animate-scale-in">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-logistics-primary to-logistics-accent rounded-2xl flex items-center justify-center mb-4 shadow-logistics">
            <Truck className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold font-poppins bg-gradient-to-r from-logistics-primary to-logistics-accent bg-clip-text text-transparent">
            Register
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="h-12 border-2 transition-all duration-200 focus:border-logistics-primary"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="h-12 border-2 transition-all duration-200 focus:border-logistics-primary"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm" className="text-sm font-medium">Confirm Password</Label>
              <Input
                id="confirm"
                type="password"
                placeholder="Confirm your password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className="h-12 border-2 transition-all duration-200 focus:border-logistics-primary"
                required
              />
            </div>
            {msg && <div className={`text-center text-sm ${msg.includes('successful') ? 'text-green-600' : 'text-red-500'}`}>{msg}</div>}
            <Button
              type="submit"
              className="w-full h-12 text-lg font-medium logistics-gradient hover:shadow-logistics transition-all duration-200 hover:scale-[1.02]"
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register'}
            </Button>
          </form>
          <div className="text-center mt-4">
            <span className="text-sm">Already have an account? </span>
            <Link to="/" className="text-logistics-primary hover:underline font-medium">
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 