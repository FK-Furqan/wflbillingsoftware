import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  FileText, 
  TrendingUp, 
  Package, 
  DollarSign, 
  Clock,
  Truck,
  Calculator
} from 'lucide-react';
import { User } from '@/pages/Index';
import { useEffect, useState } from 'react';

interface OverviewPageProps {
  user: User;
}

export function OverviewPage({ user }: OverviewPageProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock data for dashboard stats
  const mockStats = {
    totalClients: 12,
    monthlyRevenue: 150000,
    pendingBills: 5,
    courierPartners: 4,
    activeShipments: 8,
    dataEntries: 120,
    userEntries: 15,
  };

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      setError(null);
      try {
        // Commented out backend fetch, use mock data for now
        // const res = await fetch('http://localhost:4000/api/dashboard-stats');
        // if (!res.ok) throw new Error('Failed to fetch dashboard stats');
        // const data = await res.json();
        // setStats(data);
        setStats(mockStats); // Use mock data
      } catch (err: any) {
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading dashboard...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold font-poppins bg-gradient-to-r from-logistics-primary to-logistics-accent bg-clip-text text-transparent">
            Welcome back, {user.name}!
          </h1>
          <p className="text-xl text-muted-foreground mt-2">
            Here's what's happening with your logistics operations today.
          </p>
        </div>
        <Badge variant="outline" className="px-4 py-2 text-sm capitalize border-2 border-logistics-primary/30">
          {user.role.replace('-', ' ')} Dashboard
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {user.role === 'admin' && (
          <>
            <Card className="glass-effect border-2 border-logistics-primary/20 hover:border-logistics-primary/40 transition-all duration-200 hover:shadow-logistics">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
                <Users className="h-4 w-4 text-logistics-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalClients ?? '-'}</div>
                <p className="text-xs text-muted-foreground">
                  {/* Optionally show change from last month */}
                </p>
              </CardContent>
            </Card>

            <Card className="glass-effect border-2 border-logistics-accent/20 hover:border-logistics-accent/40 transition-all duration-200 hover:shadow-logistics">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-logistics-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{stats?.monthlyRevenue?.toLocaleString() ?? '-'}</div>
                <p className="text-xs text-muted-foreground">
                  {/* Optionally show change from last month */}
                </p>
              </CardContent>
            </Card>

            <Card className="glass-effect border-2 border-logistics-warning/20 hover:border-logistics-warning/40 transition-all duration-200 hover:shadow-logistics">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Bills</CardTitle>
                <Clock className="h-4 w-4 text-logistics-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.pendingBills ?? '-'}</div>
                <p className="text-xs text-muted-foreground">
                  {/* Optionally show more info */}
                </p>
              </CardContent>
            </Card>

            <Card className="glass-effect border-2 border-logistics-success/20 hover:border-logistics-success/40 transition-all duration-200 hover:shadow-logistics">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Courier Partners</CardTitle>
                <Truck className="h-4 w-4 text-logistics-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.courierPartners ?? '-'}</div>
                <p className="text-xs text-muted-foreground">
                  {/* Optionally show more info */}
                </p>
              </CardContent>
            </Card>
          </>
        )}

        <Card className="glass-effect border-2 border-logistics-primary/20 hover:border-logistics-primary/40 transition-all duration-200 hover:shadow-logistics">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Shipments</CardTitle>
            <Package className="h-4 w-4 text-logistics-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeShipments ?? '-'}</div>
            <p className="text-xs text-muted-foreground">
              {/* Optionally show more info */}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-effect border-2 border-logistics-accent/20 hover:border-logistics-accent/40 transition-all duration-200 hover:shadow-logistics">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Entries</CardTitle>
            <FileText className="h-4 w-4 text-logistics-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.role === 'admin' ? stats?.dataEntries ?? '-' : stats?.userEntries ?? '-'}</div>
            <p className="text-xs text-muted-foreground">
              {user.role === 'admin' ? 'Total entries' : 'Your entries'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="glass-effect border-2 border-border/50">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Quick Actions</CardTitle>
          <CardDescription>
            Commonly used features for faster workflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {user.role === 'admin' && (
              <>
                <div className="flex items-center space-x-3 p-4 bg-logistics-primary/10 rounded-xl hover:bg-logistics-primary/20 transition-colors cursor-pointer">
                  <Users className="w-8 h-8 text-logistics-primary" />
                  <div>
                    <p className="font-medium">Add Client</p>
                    <p className="text-sm text-muted-foreground">Create new client</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-logistics-accent/10 rounded-xl hover:bg-logistics-accent/20 transition-colors cursor-pointer">
                  <Calculator className="w-8 h-8 text-logistics-accent" />
                  <div>
                    <p className="font-medium">Rate Master</p>
                    <p className="text-sm text-muted-foreground">Manage rates</p>
                  </div>
                </div>
              </>
            )}
            <div className="flex items-center space-x-3 p-4 bg-logistics-success/10 rounded-xl hover:bg-logistics-success/20 transition-colors cursor-pointer">
              <FileText className="w-8 h-8 text-logistics-success" />
              <div>
                <p className="font-medium">New Entry</p>
                <p className="text-sm text-muted-foreground">Add shipment data</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-logistics-warning/10 rounded-xl hover:bg-logistics-warning/20 transition-colors cursor-pointer">
              <TrendingUp className="w-8 h-8 text-logistics-warning" />
              <div>
                <p className="font-medium">Calculator</p>
                <p className="text-sm text-muted-foreground">Calculate rates</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
