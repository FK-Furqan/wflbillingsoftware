import { useState } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { User } from '@/pages/Index';

export type ActiveView = 
  | 'overview' 
  | 'clients' 
  | 'vendors'
  | 'rate-master' 
  | 'data-entry' 
  | 'billing' 
  | 'rate-calculator' 
  | 'courier-management'
  | 'my-entries'
  | 'all-shipments';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

export function Dashboard({ user, onLogout }: DashboardProps) {
  const [activeView, setActiveView] = useState<ActiveView>('overview');

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-logistics-surface/20 to-background">
        <AppSidebar 
          user={user} 
          activeView={activeView} 
          onViewChange={setActiveView} 
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader user={user} onLogout={onLogout} />
          <main className="flex-1 overflow-auto p-6 pt-2">
            <DashboardContent user={user} activeView={activeView} onViewChange={setActiveView} />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
