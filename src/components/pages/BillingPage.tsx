import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, CreditCard } from 'lucide-react';
import { supabase } from '@/supabaseClient';
import { format } from 'date-fns';

interface Bill {
  id: string;
  client_id: string;
  period_start: string;
  period_end: string;
  total_amount: number;
  created_at: string;
  client_name?: string;
}

interface ClientOption {
  value: string;
  label: string;
}

export function BillingPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch bills
  useEffect(() => {
    const fetchBills = async () => {
      const { data, error } = await supabase
        .from('bills')
        .select('*, clients:client_id (client_name)')
        .order('created_at', { ascending: false });
      if (error) return setError(error.message);
      setBills(
        (data || []).map((b: any) => ({
          ...b,
          client_name: b.clients?.client_name || '',
        }))
      );
    };
    fetchBills();
  }, []);

  // Fetch clients for dropdown
  useEffect(() => {
    const fetchClients = async () => {
      const { data } = await supabase.from('clients').select('id, client_name');
      setClients(
        (data || []).map((c: any) => ({ value: c.id, label: c.client_name }))
      );
    };
    fetchClients();
  }, []);

  // Handle bill creation
  const handleCreateBill = async () => {
    setLoading(true);
    setError(null);
    try {
      // Parse month to get start/end
      const [year, month] = selectedMonth.split('-');
      const period_start = `${year}-${month}-01`;
      const period_end = format(new Date(Number(year), Number(month), 0), 'yyyy-MM-dd');
      // Fetch shipments for client and month
      const { data: shipments, error: shipErr } = await supabase
        .from('shipments')
        .select('id, zone_id')
        .eq('client_id', selectedClient)
        .gte('created_at', period_start)
        .lte('created_at', period_end);
      if (shipErr) throw new Error(shipErr.message);
      if (!shipments || shipments.length === 0) throw new Error('No shipments found for this client and month.');
      // Fetch rates for all zones for this client
      const zoneIds = [...new Set(shipments.map((s: any) => s.zone_id))];
      const { data: rates, error: rateErr } = await supabase
        .from('rates')
        .select('zone_id, rate')
        .eq('client_id', selectedClient)
        .in('zone_id', zoneIds);
      if (rateErr) throw new Error(rateErr.message);
      // Calculate total
      let total = 0;
      for (const shipment of shipments) {
        const rateObj = rates.find((r: any) => r.zone_id === shipment.zone_id);
        if (rateObj) total += Number(rateObj.rate);
      }
      // Insert bill
      const { error: billErr } = await supabase.from('bills').insert([
        {
          client_id: selectedClient,
          period_start,
          period_end,
          total_amount: total,
        },
      ]);
      if (billErr) throw new Error(billErr.message);
      setShowModal(false);
      setSelectedClient('');
      setSelectedMonth('');
      // Refetch bills
      const { data, error } = await supabase
        .from('bills')
        .select('*, clients:client_id (client_name)')
        .order('created_at', { ascending: false });
      if (!error) {
        setBills(
          (data || []).map((b: any) => ({
            ...b,
            client_name: b.clients?.client_name || '',
          }))
        );
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-poppins">Billing Management</h1>
          <p className="text-muted-foreground mt-2">
            Generate and manage customer invoices
          </p>
        </div>
        <Button className="logistics-gradient hover:shadow-logistics transition-all duration-200" onClick={() => setShowModal(true)}>
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
          {bills.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No bills generated</h3>
              <p className="text-muted-foreground mb-4">
                Generate your first customer invoice based on shipment data
              </p>
              <Button variant="outline" onClick={() => setShowModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Invoice
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th className="px-4 py-2">Bill #</th>
                    <th className="px-4 py-2">Client</th>
                    <th className="px-4 py-2">Period</th>
                    <th className="px-4 py-2">Total Amount</th>
                    <th className="px-4 py-2">Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.map((bill) => (
                    <tr key={bill.id}>
                      <td className="px-4 py-2">{bill.id.slice(0, 8)}</td>
                      <td className="px-4 py-2">{bill.client_name}</td>
                      <td className="px-4 py-2">{bill.period_start} to {bill.period_end}</td>
                      <td className="px-4 py-2">₹{bill.total_amount}</td>
                      <td className="px-4 py-2">{format(new Date(bill.created_at), 'yyyy-MM-dd')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {error && <div className="text-red-500 mt-2">{error}</div>}
        </CardContent>
      </Card>

      {/* Modal for creating a new bill */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <Card className="glass-effect border-2 shadow-xl w-full max-w-md p-0">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Create New Bill</CardTitle>
              <CardDescription>Select a client and month to generate a bill.</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleCreateBill();
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block mb-1 font-medium text-sm">Client</label>
                  <select
                    className="w-full border rounded px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-logistics-primary transition"
                    value={selectedClient}
                    onChange={e => setSelectedClient(e.target.value)}
                    required
                  >
                    <option value="">Select client</option>
                    {clients.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-medium text-sm">Month</label>
                  <input
                    type="month"
                    className="w-full border rounded px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-logistics-primary transition"
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(e.target.value)}
                    required
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" type="button" onClick={() => setShowModal(false)} disabled={loading}>Cancel</Button>
                  <Button type="submit" disabled={loading || !selectedClient || !selectedMonth}>
                    {loading ? 'Generating...' : 'Generate Bill'}
                  </Button>
                </div>
                {error && <div className="text-red-500 mt-2 text-sm font-medium">{error}</div>}
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
