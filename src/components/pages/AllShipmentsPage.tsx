import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Database } from 'lucide-react';
import { User } from '@/pages/Index';
import { ActiveView } from '@/components/dashboard/Dashboard';
import AllShipmentsTable from '@/components/AllShipmentsTable'; // <-- Add this import

interface AllShipmentsPageProps {
  user: User;
  onViewChange: (view: ActiveView) => void;
}

export function AllShipmentsPage({ user, onViewChange }: AllShipmentsPageProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-poppins">All Shipments</h1>
          <p className="text-muted-foreground mt-2">
            View and manage all shipment entries
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center"
          onClick={() => onViewChange('data-entry' as ActiveView)}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Entry
        </Button>
      </div>
      <Card className="glass-effect border-2">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="w-5 h-5 mr-2 text-logistics-primary" />
            All Shipments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AllShipmentsTable /> {/* <-- Show the table here */}
        </CardContent>
      </Card>
    </div>
  );
}