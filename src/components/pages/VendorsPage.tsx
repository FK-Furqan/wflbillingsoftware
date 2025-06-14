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

interface VendorsPageProps {
  user: User;
}

interface Vendor {
  id: string;
  name: string;
  contact_numt: string;
  email: string;
  address: string;
  pincode: string;
  gst_number: string;
  created_at?: string;
}

export function VendorsPage({ user }: VendorsPageProps) {
  const [showForm, setShowForm] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    contact_numt: '',
    email: '',
    address: '',
    pincode: '',
    gst_number: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch vendors on mount
  useEffect(() => {
    const fetchVendors = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase.from('vendors').select('*').order('created_at', { ascending: false });
        if (error) throw new Error(error.message || 'Failed to fetch vendors');
        setVendors(data || []);
      } catch (err: any) {
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchVendors();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const vendor = {
        ...formData,
        created_by: user.id,
      };
      const { data, error } = await supabase.from('vendors').insert([vendor]).select().single();
      if (error) throw new Error(error.message || 'Failed to add vendor');
      setVendors([data, ...vendors]);
      setFormData({
        name: '',
        contact_numt: '',
        email: '',
        address: '',
        pincode: '',
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
              Vendor Management
            </CardTitle>
            <CardDescription>
              Manage your vendor database and information
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Add Vendor Form */}
        {showForm && (
          <div className="mb-6 w-full bg-white/5 rounded-xl border border-border/30 p-6 shadow-md">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <Label htmlFor="vendor-name">Vendor Name</Label>
                <Input
                  id="vendor-name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter vendor name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="contact">Contact Number</Label>
                <Input
                  id="contact"
                  value={formData.contact_numt}
                  onChange={(e) => handleInputChange('contact_numt', e.target.value)}
                  placeholder="Enter contact number"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email ID</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
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
                <Label htmlFor="pincode">Pin Code</Label>
                <Input
                  id="pincode"
                  value={formData.pincode}
                  onChange={(e) => handleInputChange('pincode', e.target.value)}
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
                    'Save Vendor'
                  )}
                </Button>
                <Button type="button" size="sm" variant="outline" className="flex-none min-w-[90px]" onClick={() => setShowForm(false)} disabled={loading}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Add Vendor Button */}
        {!showForm && (
          <div className="mb-4">
            <Button onClick={() => setShowForm(true)} className="logistics-gradient">
              <Plus className="w-4 h-4 mr-2" /> Add Vendor
            </Button>
          </div>
        )}

        {/* Vendor Table */}
        <div className="w-full bg-white/5 rounded-xl border border-border/30 p-4 shadow-md overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor Name</TableHead>
                <TableHead>Contact Number</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Pin Code</TableHead>
                <TableHead>GST Number</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground last:border-r-0">
                    No vendors found.
                  </TableCell>
                </TableRow>
              ) : (
                vendors.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell>{vendor.name}</TableCell>
                    <TableCell>{vendor.contact_numt}</TableCell>
                    <TableCell>{vendor.email}</TableCell>
                    <TableCell>{vendor.address}</TableCell>
                    <TableCell>{vendor.pincode}</TableCell>
                    <TableCell>{vendor.gst_number}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
} 