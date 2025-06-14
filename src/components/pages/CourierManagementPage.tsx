
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Truck } from 'lucide-react';
import { User } from '@/pages/Index';

interface CourierManagementPageProps {
  user: User;
}

export function CourierManagementPage({ user }: CourierManagementPageProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-poppins">Courier Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage courier partners and track shipments
          </p>
        </div>
        <Button className="logistics-gradient hover:shadow-logistics transition-all duration-200">
          <Plus className="w-4 h-4 mr-2" />
          Add Courier
        </Button>
      </div>

      <Card className="glass-effect border-2">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Truck className="w-5 h-5 mr-2 text-logistics-primary" />
            Courier Partners
          </CardTitle>
          <CardDescription>
            Manage third-party courier services and tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Truck className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No courier partners</h3>
            <p className="text-muted-foreground mb-4">
              Add courier services to manage shipment tracking
            </p>
            <Button variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Partner
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
