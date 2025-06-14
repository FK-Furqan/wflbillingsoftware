
import { useState } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { ThemeProvider } from '@/components/providers/ThemeProvider';

export type UserRole = 'admin' | 'data-entry';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

const Index = () => {
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gradient-to-br from-background via-logistics-surface/30 to-background">
        {!user ? (
          <LoginForm onLogin={handleLogin} />
        ) : (
          <Dashboard user={user} onLogout={handleLogout} />
        )}
      </div>
    </ThemeProvider>
  );
};

export default Index;
