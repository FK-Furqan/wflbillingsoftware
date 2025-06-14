
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator } from 'lucide-react';
import { User } from '@/pages/Index';

interface RateCalculatorPageProps {
  user: User;
}

export function RateCalculatorPage({ user }: RateCalculatorPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-poppins">Rate Calculator</h1>
        <p className="text-muted-foreground mt-2">
          Calculate shipping costs based on zone and weight
        </p>
      </div>

      <Card className="glass-effect border-2">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="w-5 h-5 mr-2 text-logistics-primary" />
            Shipping Cost Calculator
          </CardTitle>
          <CardDescription>
            Estimate freight charges for shipments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Calculator className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Rate Calculator Tool</h3>
            <p className="text-muted-foreground">
              Calculate shipping costs based on configured rate masters
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
