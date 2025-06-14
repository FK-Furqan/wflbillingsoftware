import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Users, Loader2 } from 'lucide-react';
import { User } from '@/pages/Index';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { supabase } from '@/supabaseClient';

interface ClientsPageProps {
  user: User;
}

interface Client {
  id: string;
  client_code: string;
  client_name: string;
  contact_number: string;
  email_id: string;
  address: string;
  pin_code: string;
  gst_number: string;
  created_by: string;
  created_at: string;
}

export function ClientsPage({ user }: ClientsPageProps) {
  const [showForm, setShowForm] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [formData, setFormData] = useState({
    client_name: '',
    contact_number: '',
    email_id: '',
    address: '',
    pin_code: '',
    gst_number: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch clients on mount
  useEffect(() => {
    const fetchClients = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
        if (error) throw new Error(error.message || 'Failed to fetch clients');
        setClients(data || []);
      } catch (err: any) {
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  const generateClientCode = () => {
    const timestamp = Date.now().toString();
    return `CL${timestamp.slice(-6)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const client = {
        ...formData,
        client_code: generateClientCode(),
        created_by: user.id,
      };
      const { data, error } = await supabase.from('clients').insert([client]).select().single();
      if (error) throw new Error(error.message || 'Failed to add client');
      setClients([data, ...clients]);
      setFormData({
        client_name: '',
        contact_number: '',
        email_id: '',
        address: '',
        pin_code: '',
        gst_number: '',
      });
      setShowForm(false);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6 w-full px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2 text-logistics-primary" />
              Client Management
            </CardTitle>
            <CardDescription>
              Manage your client database and information
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Add Client Form */}
        {showForm && (
          <div className="mb-6 w-full bg-white/5 rounded-xl border border-border/30 p-6 shadow-md">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <Label htmlFor="client-name">Client Name</Label>
                <Input
                  id="client-name"
                  value={formData.client_name}
                  onChange={(e) => handleInputChange('client_name', e.target.value)}
                  placeholder="Enter client name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="contact">Contact Number</Label>
                <Input
                  id="contact"
                  value={formData.contact_number}
                  onChange={(e) => handleInputChange('contact_number', e.target.value)}
                  placeholder="Enter contact number"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email ID</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email_id}
                  onChange={(e) => handleInputChange('email_id', e.target.value)}
                  placeholder="Enter email address"
                  required
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter complete address"
                  required
                />
              </div>
              <div>
                <Label htmlFor="pin-code">Pin Code</Label>
                <Input
                  id="pin-code"
                  value={formData.pin_code}
                  onChange={(e) => handleInputChange('pin_code', e.target.value)}
                  placeholder="Enter pin code"
                  required
                />
              </div>
              <div>
                <Label htmlFor="gst">GST Number</Label>
                <Input
                  id="gst"
                  value={formData.gst_number}
                  onChange={(e) => handleInputChange('gst_number', e.target.value)}
                  placeholder="Enter GST number"
                  required
                />
              </div>
              <div className="flex gap-2 col-span-full">
                <Button type="submit" size="sm" className="logistics-gradient flex-none min-w-[110px]" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="animate-spin w-4 h-4 mr-2" />
                      Saving...
                    </span>
                  ) : (
                    'Save Client'
                  )}
                </Button>
                <Button type="button" size="sm" variant="outline" className="flex-none min-w-[90px]" onClick={() => setShowForm(false)} disabled={loading}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Add Client Button */}
        {!showForm && (
          <div className="mb-4">
            <Button onClick={() => setShowForm(true)} className="logistics-gradient">
              <Plus className="w-4 h-4 mr-2" /> Add Client
            </Button>
          </div>
        )}

        {/* Client Table */}
        <div className="w-full bg-white/5 rounded-xl border border-border/30 p-4 shadow-md overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client Code</TableHead>
                <TableHead>Client Name</TableHead>
                <TableHead>Contact Number</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Pin Code</TableHead>
                <TableHead>GST Number</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>{client.client_code}</TableCell>
                  <TableCell>{client.client_name}</TableCell>
                  <TableCell>{client.contact_number}</TableCell>
                  <TableCell>{client.email_id}</TableCell>
                  <TableCell>{client.address}</TableCell>
                  <TableCell>{client.pin_code}</TableCell>
                  <TableCell>{client.gst_number}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
