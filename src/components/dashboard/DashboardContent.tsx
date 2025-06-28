import { User } from '@/pages/Index';
import { ActiveView } from '@/components/dashboard/Dashboard';
import { OverviewPage } from '@/components/pages/OverviewPage';
import { ClientsPage } from '@/components/pages/ClientsPage';
import { VendorsPage } from '@/components/pages/VendorsPage';
import { RateMasterPage } from '@/components/pages/RateMasterPage';
import { DataEntryPage } from '@/components/pages/DataEntryPage';
import { BillingPage } from '@/components/pages/BillingPage';
import { RateCalculatorPage } from '@/components/pages/RateCalculatorPage';
import { CourierManagementPage } from '@/components/pages/CourierManagementPage';
import { MyEntriesPage } from '@/components/pages/MyEntriesPage';
import { AllShipmentsPage } from '@/components/pages/AllShipmentsPage';

interface DashboardContentProps {
  user: User;
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
}

export function DashboardContent({ user, activeView, onViewChange }: DashboardContentProps) {
  const renderContent = () => {
    switch (activeView) {
      case 'overview':
        return <OverviewPage user={user} />;
      case 'clients':
        return <ClientsPage user={user} />;
      case 'vendors':
        return <VendorsPage user={user} />;
      case 'rate-master':
        return <RateMasterPage user={user} />;
      case 'data-entry':
        return <DataEntryPage user={user} onViewChange={onViewChange} />;
      case 'all-shipments':
        return <AllShipmentsPage user={user} onViewChange={onViewChange} />;
      case 'billing':
        return <BillingPage />;
      case 'rate-calculator':
        return <RateCalculatorPage user={user} />;
      case 'courier-management':
        return <CourierManagementPage user={user} />;
      case 'my-entries':
        return <MyEntriesPage user={user} />;
      default:
        return <OverviewPage user={user} />;
    }
  };

  return (
    <div className="animate-fade-in">
      {renderContent()}
    </div>
  );
}
