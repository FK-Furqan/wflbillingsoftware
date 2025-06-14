
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, CreditCard } from 'lucide-react';
import { User } from '@/pages/Index';

interface BillingPageProps {
  user: User;
}

export function BillingPage({ user }: BillingPageProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-poppins">Billing Management</h1>
          <p className="text-muted-foreground mt-2">
            Generate and manage customer invoices
          </p>
        </div>
        <Button className="logistics-gradient hover:shadow-logistics transition-all duration-200">
          <Plus className="w-4 h-4 mr-2" />
          Generate Bill
        </Button>
      </div>

      <Card className="glass-effect border-2">
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="w-5 h-5 mr-2 text-logistics-primary" />
            Invoice Management
          </CardTitle>
          <CardDescription>
            Create and track customer billing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <CreditCard className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No bills generated</h3>
            <p className="text-muted-foreground mb-4">
              Generate your first customer invoice based on shipment data
            </p>
            <Button variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Create Invoice
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
