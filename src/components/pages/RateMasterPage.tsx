import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Calculator, Check, ChevronsUpDown, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { User } from '@/pages/Index';
import { supabase } from '@/supabaseClient';

interface RateMasterPageProps {
  user: User;
}

interface ClientOption {
  value: string;
  label: string;
  code: string;
  name: string;
}

interface ZoneOption {
  id: string;
  name: string;
}

interface RateZoneEntry {
  zoneId: string;
  ratePerKg: string;
}

interface RateEntry {
  id: string;
  clientCode: string;
  clientName: string;
  zone: string;
  mode: string;
  minimumChargeableWeight: string;
  minimumFreight: string;
  odaRate: string;
  perKgRate: string;
  createdAt: string;
}

export function RateMasterPage({ user }: RateMasterPageProps) {
  const [showForm, setShowForm] = useState(false);
  const [open, setOpen] = useState(false);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [zones, setZones] = useState<ZoneOption[]>([]);
  const [newZone, setNewZone] = useState('');
  const [selectedClient, setSelectedClient] = useState<ClientOption | null>(null);
  const [selectedViewClient, setSelectedViewClient] = useState<ClientOption | null>(null);
  const [clientRates, setClientRates] = useState([]);
  const [zoneRatesMap, setZoneRatesMap] = useState({}); // { client_rate_id: [zoneRate, ...] }

  // Fixed fields state
  const [formData, setFormData] = useState({
    mode: '',
    minimumChargeableWeight: '',
    minimumFreight: '',
    docketCharges: '',
    fuel: '', // percentage
    fov: '', // percentage
    oda: '',
    otherCharges: '',
    cft: '',
  });

  // Dynamic zone-rate pairs
  const [zoneRates, setZoneRates] = useState<RateZoneEntry[]>([]);

  // Add a state to track which dropdown is open (for real-time fetch)
  const [zoneDropdownOpen, setZoneDropdownOpen] = useState<number | null>(null);

  // Add a state to track which rate is being edited
  const [editingRateId, setEditingRateId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<any>({});
  const [editZoneRates, setEditZoneRates] = useState<any[]>([]);

  // Fetch clients and zones from Supabase
  useEffect(() => {
    const fetchClientsAndZones = async () => {
      // Fetch clients
      const { data: clientData } = await supabase.from('clients').select('id, client_code, client_name');
      setClients(
        (clientData || []).map((c: any) => ({
          value: c.id,
          label: `${c.client_code} - ${c.client_name}`,
          code: c.client_code,
          name: c.client_name,
        }))
      );
      // Fetch zones
      const { data } = await supabase.from('zones').select('*').order('name');
      setZones(data || []);
    };
    fetchClientsAndZones();
  }, []);

  // Fetch all client_rates and their zone rates for the selected client
  useEffect(() => {
    if (!selectedViewClient) return;
    const fetchRates = async () => {
      const { data: rates } = await supabase
        .from('client_rates')
        .select('*')
        .eq('client_id', selectedViewClient.value);
      setClientRates(rates || []);
      // Fetch all zone rates for each client_rate
      const allZoneRates = {};
      for (const rate of rates || []) {
        const { data: zoneRates } = await supabase
          .from('client_zone_rates')
          .select('rate_per_kg, zone_id')
          .eq('client_rate_id', rate.id);
        // Fetch zone names for these zone_ids
        const zoneIds = (zoneRates || []).map(zr => zr.zone_id);
        let zones = [];
        if (zoneIds.length > 0) {
          const { data: zoneData } = await supabase
            .from('client_zones')
            .select('id, name')
            .in('id', zoneIds);
          zones = zoneData || [];
        }
        // Map zone_id to name
        const zoneNameMap = {};
        (zones || []).forEach(z => { zoneNameMap[z.id] = z.name; });
        // Attach zone name to each zoneRate
        allZoneRates[rate.id] = (zoneRates || []).map(zr => ({
          ...zr,
          zone_name: zoneNameMap[zr.zone_id] || zr.zone_id
        }));
      }
      setZoneRatesMap(allZoneRates);
    };
    fetchRates();
  }, [selectedViewClient]);

  // Handle input changes for fixed fields
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle zone-rate changes
  const handleZoneRateChange = (index: number, field: string, value: string) => {
    setZoneRates(prev => prev.map((z, i) => i === index ? { ...z, [field]: value } : z));
  };

  // Add new zone-rate pair
  const addZoneRate = () => {
    setZoneRates(prev => [...prev, { zoneId: '', ratePerKg: '' }]);
  };

  // Remove zone-rate pair
  const removeZoneRate = (index: number) => {
    setZoneRates(prev => prev.filter((_, i) => i !== index));
  };

  // Fetch zones from client_zones (id, name)
  const fetchZones = async () => {
    const { data } = await supabase
      .from('client_zones')
      .select('id, name')
      .order('name');
    setZones(data || []);
  };

  useEffect(() => { fetchZones(); }, []);

  // Add new zone to client_zones (only name)
  const handleAddZone = async () => {
    if (!newZone.trim()) return;
    // Check if zone already exists
    const { data: existing } = await supabase
      .from('client_zones')
      .select('name')
      .eq('name', newZone.trim());
    if (existing && existing.length > 0) {
      alert('Zone already exists!');
      return;
    }
    const { error } = await supabase
      .from('client_zones')
      .insert([{ name: newZone.trim() }]);
    if (!error) {
      setNewZone('');
      fetchZones();
    } else {
      alert('Error: ' + error.message);
    }
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    // 1. Insert into client_rates
    const { data: clientRateData, error: clientRateError } = await supabase
      .from('client_rates')
      .insert([
        {
          client_id: selectedClient.value,
          mode: formData.mode,
          cft: formData.cft,
          minimum_weight: formData.minimumChargeableWeight,
          minimum_freight: formData.minimumFreight,
          docket_charges: formData.docketCharges,
          fuel: formData.fuel,
          fov: formData.fov,
          oda: formData.oda,
          other_charges: formData.otherCharges,
        },
      ])
      .select('id')
      .single();

    if (clientRateError) {
      alert('Error saving client rate: ' + clientRateError.message);
      return;
    }

    const clientRateId = clientRateData.id;

    // 2. Insert all zone rates into client_zone_rates
    if (zoneRates.length > 0) {
      const zoneRateRows = zoneRates.map(zr => ({
        client_rate_id: clientRateId,
        zone_id: zr.zoneId, // This is the id from client_zones
        rate_per_kg: zr.ratePerKg,
      }));
      const { error: zoneError } = await supabase
        .from('client_zone_rates')
        .insert(zoneRateRows);
      if (zoneError) {
        alert('Error saving zone rates: ' + zoneError.message);
        return;
      }
    }

    // Reset form
    setShowForm(false);
    setSelectedClient(null);
    setFormData({
      mode: '',
      cft: '',
      minimumChargeableWeight: '',
      minimumFreight: '',
      docketCharges: '',
      fuel: '',
      fov: '',
      oda: '',
      otherCharges: '',
    });
    setZoneRates([]);
    // Optionally, refetch rates for the selected client
  };

  // Get rates for selected client
  const getClientRates = () => {
    if (!selectedViewClient) return [];
    return clientRates.filter(rate => rate.clientCode === selectedViewClient.code);
  };

  // Group clients by their rate count
  const getClientSummary = () => {
    const clientRateCounts = clients.map(client => {
      const ratesForClient = clientRates.filter(rate => rate.clientCode === client.code);
      return {
        client,
        rateCount: ratesForClient.length,
        zones: [...new Set(ratesForClient.map(rate => rate.zone))]
      };
    });
    return clientRateCounts;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Client List */}
      <div className="w-full lg:w-1/3 max-w-xs">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calculator className="w-5 h-5 mr-2 text-logistics-primary" />
              Clients
            </CardTitle>
            <CardDescription>Click a client to view or add rates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {clients.map(client => (
                <div
                  key={client.code}
                  className="border rounded p-3 text-sm cursor-pointer hover:bg-muted/50 transition"
                  onClick={() => {
                    setSelectedViewClient(client);
                    setShowForm(false);
                  }}
                >
                  <div className="font-semibold">{client.name}</div>
                  <div className="text-xs text-muted-foreground">{client.code}</div>
                </div>
              ))}
              {clients.length === 0 && (
                <div className="text-center py-12">
                  <Calculator className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No clients available</h3>
                  <p className="text-muted-foreground mb-4">
                    Add clients first in Client Management
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rate Master Details/Form */}
      <div className="flex-1 min-w-0">
        {/* Show Create Rate button when a client is selected and form is not open */}
        {selectedViewClient && !showForm && (
          <div className="flex justify-end mb-4">
            <Button
              onClick={() => setShowForm(true)}
              className="logistics-gradient hover:shadow-logistics transition-all duration-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Rate
            </Button>
          </div>
        )}
        {/* Create Rate Form */}
        {showForm && (
          <Card className="glass-effect border-2 mb-6">
            <CardHeader>
              <CardTitle>Create Rate Master</CardTitle>
              <CardDescription>
                Set up zone-wise rates for a client
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Client</Label>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                      >
                        {selectedClient ? selectedClient.label : "Search and select client..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search clients..." />
                        <CommandList>
                          <CommandEmpty>No client found.</CommandEmpty>
                          <CommandGroup>
                            {clients.map((client) => (
                              <CommandItem
                                key={client.value}
                                value={client.value}
                                onSelect={() => {
                                  setSelectedClient(client);
                                  setOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedClient?.value === client.value ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {client.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mode">Mode</Label>
                    <Select value={formData.mode} onValueChange={(value) => handleInputChange('mode', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="air">Air</SelectItem>
                        <SelectItem value="sfc">SFC (Surface)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cft">CFT</Label>
                    <Input
                      id="cft"
                      type="number"
                      value={formData.cft || ''}
                      onChange={(e) => handleInputChange('cft', e.target.value)}
                      placeholder="Enter CFT"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="min-weight">Minimum Chargeable Weight (kg)</Label>
                    <Input
                      id="min-weight"
                      type="number"
                      value={formData.minimumChargeableWeight}
                      onChange={(e) => handleInputChange('minimumChargeableWeight', e.target.value)}
                      placeholder="Enter minimum weight"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="min-freight">Minimum Freight (₹)</Label>
                    <Input
                      id="min-freight"
                      type="number"
                      value={formData.minimumFreight}
                      onChange={(e) => handleInputChange('minimumFreight', e.target.value)}
                      placeholder="Enter minimum freight"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="docket-charges">Docket Charges (₹)</Label>
                    <Input
                      id="docket-charges"
                      type="number"
                      value={formData.docketCharges}
                      onChange={(e) => handleInputChange('docketCharges', e.target.value)}
                      placeholder="Enter docket charges"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fuel">Fuel (%)</Label>
                    <Input
                      id="fuel"
                      type="number"
                      value={formData.fuel}
                      onChange={(e) => handleInputChange('fuel', e.target.value)}
                      placeholder="Enter fuel percentage"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fov">FOV (%)</Label>
                    <Input
                      id="fov"
                      type="number"
                      value={formData.fov}
                      onChange={(e) => handleInputChange('fov', e.target.value)}
                      placeholder="Enter FOV percentage"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="oda">ODA (₹)</Label>
                    <Input
                      id="oda"
                      type="number"
                      value={formData.oda}
                      onChange={(e) => handleInputChange('oda', e.target.value)}
                      placeholder="Enter ODA charges"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="other-charges">Other Charges (₹)</Label>
                    <Input
                      id="other-charges"
                      type="number"
                      value={formData.otherCharges}
                      onChange={(e) => handleInputChange('otherCharges', e.target.value)}
                      placeholder="Enter other charges"
                      required
                    />
                  </div>
                </div>

                {/* Dynamic Zone + Rate per Kg Section */}
                <div className="space-y-2">
                  <Label>Zone-wise Per Kg Rates</Label>
                  {/* Add new zone input/button above the list */}
                  <div className="flex gap-2 items-center mb-2">
                    <Input
                      value={newZone}
                      onChange={e => setNewZone(e.target.value)}
                      placeholder="New zone"
                      className="w-40"
                    />
                    <Button type="button" onClick={handleAddZone} variant="secondary">Add</Button>
                  </div>
                  <div className="flex flex-col gap-2">
                    {zoneRates.map((zoneRate, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <Select
                          value={zoneRate.zoneId}
                          onValueChange={(value) => handleZoneRateChange(idx, 'zoneId', value)}
                          open={zoneDropdownOpen === idx}
                          onOpenChange={(open) => {
                            if (open) fetchZones();
                            setZoneDropdownOpen(open ? idx : null);
                          }}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="Select zone" />
                          </SelectTrigger>
                          <SelectContent>
                            {zones.map((zone) => (
                              <SelectItem key={zone.id} value={zone.id}>{zone.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          placeholder="Rate per Kg"
                          value={zoneRate.ratePerKg}
                          onChange={(e) => handleZoneRateChange(idx, 'ratePerKg', e.target.value)}
                          className="w-32"
                          required
                        />
                        <Button type="button" variant="destructive" size="icon" onClick={() => removeZoneRate(idx)}>
                          -
                        </Button>
                        {idx === zoneRates.length - 1 && (
                          <Button type="button" variant="outline" onClick={addZoneRate} className="ml-2">
                            + Add Zone Rate
                          </Button>
                        )}
                      </div>
                    ))}
                    {zoneRates.length === 0 && (
                      <Button type="button" variant="outline" onClick={addZoneRate}>
                        + Add Zone Rate
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="logistics-gradient flex-1" disabled={!selectedClient}>
                    Save Rate
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Show rates for selected client below the form */}
        {selectedViewClient && clientRates.length > 0 && !showForm && (
          <div className="space-y-8">
            <h3 className="text-xl font-semibold mb-2 border-b pb-2">Rate Masters for {selectedViewClient.name}</h3>
            {clientRates.map(rate => {
              const isEditing = editingRateId === rate.id;
              return (
                <div key={rate.id} className="mb-6 border rounded-lg p-6 bg-muted/10 shadow">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-semibold">Rate Details</span>
                    {!isEditing ? (
                      <Button size="sm" variant="outline" onClick={() => {
                        setEditingRateId(rate.id);
                        setEditFields({ ...rate });
                        setEditZoneRates((zoneRatesMap[rate.id] || []).map(zr => ({ ...zr })));
                      }}>Edit</Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button size="sm" variant="default" onClick={async () => {
                          // Update client_rates
                          await supabase.from('client_rates').update({
                            mode: editFields.mode,
                            cft: editFields.cft,
                            minimum_weight: editFields.minimum_weight,
                            minimum_freight: editFields.minimum_freight,
                            docket_charges: editFields.docket_charges,
                            fuel: editFields.fuel,
                            fov: editFields.fov,
                            oda: editFields.oda,
                            other_charges: editFields.other_charges,
                          }).eq('id', rate.id);
                          // Update each zone rate
                          for (const zr of editZoneRates) {
                            await supabase.from('client_zone_rates').update({
                              rate_per_kg: zr.rate_per_kg
                            }).eq('client_rate_id', rate.id).eq('zone_id', zr.zone_id);
                          }
                          setEditingRateId(null);
                          // Optionally, refetch rates
                          const { data: rates } = await supabase
                            .from('client_rates')
                            .select('*')
                            .eq('client_id', selectedViewClient.value);
                          setClientRates(rates || []);
                          // Fetch all zone rates for each client_rate
                          const allZoneRates = {};
                          for (const rateObj of rates || []) {
                            const { data: zoneRates } = await supabase
                              .from('client_zone_rates')
                              .select('rate_per_kg, zone_id')
                              .eq('client_rate_id', rateObj.id);
                            // Fetch zone names for these zone_ids
                            const zoneIds = (zoneRates || []).map(zr => zr.zone_id);
                            let zones = [];
                            if (zoneIds.length > 0) {
                              const { data: zoneData } = await supabase
                                .from('client_zones')
                                .select('id, name')
                                .in('id', zoneIds);
                              zones = zoneData || [];
                            }
                            // Map zone_id to name
                            const zoneNameMap = {};
                            (zones || []).forEach(z => { zoneNameMap[z.id] = z.name; });
                            // Attach zone name to each zoneRate
                            allZoneRates[rateObj.id] = (zoneRates || []).map(zr => ({
                              ...zr,
                              zone_name: zoneNameMap[zr.zone_id] || zr.zone_id
                            }));
                          }
                          setZoneRatesMap(allZoneRates);
                        }}>Save</Button>
                        <Button size="sm" variant="secondary" onClick={() => setEditingRateId(null)}>Cancel</Button>
                      </div>
                    )}
                  </div>
                  <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {[
                      { label: 'Mode', field: 'mode' },
                      { label: 'CFT', field: 'cft' },
                      { label: 'Min Weight', field: 'minimum_weight' },
                      { label: 'Min Freight', field: 'minimum_freight' },
                      { label: 'Docket', field: 'docket_charges' },
                      { label: 'Fuel %', field: 'fuel' },
                      { label: 'FOV %', field: 'fov' },
                      { label: 'ODA', field: 'oda' },
                      { label: 'Other', field: 'other_charges' },
                    ].map(({ label, field }) => (
                      <div key={field}>
                        <span className="font-semibold text-muted-foreground">{label}:</span>{' '}
                        {isEditing ? (
                          <Input
                            className="w-20 inline-block"
                            value={editFields[field]}
                            onChange={e => setEditFields((prev: any) => ({ ...prev, [field]: e.target.value }))}
                          />
                        ) : (
                          field === 'mode' ? String(rate[field]).toUpperCase() : rate[field]
                        )}
                      </div>
                    ))}
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="bg-muted font-semibold">Zone</TableHead>
                        <TableHead className="bg-muted font-semibold">Rate per Kg</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(isEditing ? editZoneRates : (zoneRatesMap[rate.id] || [])).map((zr, idx) => (
                        <TableRow key={zr.zone_id} className="hover:bg-muted/30">
                          <TableCell>{zr.zone_name}</TableCell>
                          <TableCell>
                            {isEditing ? (
                              <Input
                                className="w-24"
                                value={editZoneRates[idx].rate_per_kg}
                                onChange={e => setEditZoneRates((prev: any[]) => prev.map((z, i) => i === idx ? { ...z, rate_per_kg: e.target.value } : z))}
                              />
                            ) : (
                              zr.rate_per_kg
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
