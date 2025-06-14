
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { User } from '@/pages/Index';

interface MyEntriesPageProps {
  user: User;
}

export function MyEntriesPage({ user }: MyEntriesPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-poppins">My Entries</h1>
        <p className="text-muted-foreground mt-2">
          View and manage your data entries
        </p>
      </div>

      <Card className="glass-effect border-2">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2 text-logistics-primary" />
            Your Data Entries
          </CardTitle>
          <CardDescription>
            Track your shipment data submissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No entries yet</h3>
            <p className="text-muted-foreground">
              Your submitted data entries will appear here
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
