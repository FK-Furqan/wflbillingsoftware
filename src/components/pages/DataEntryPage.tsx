import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Database, X, Eye, Check, ChevronsUpDown } from 'lucide-react';
import { User } from '@/pages/Index';
import { ActiveView } from '@/components/dashboard/Dashboard';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/supabaseClient';

interface DataEntryPageProps {
  user: User;
  onViewChange: (view: ActiveView) => void;
}

interface WeightEntry {
  id: string;
  noOfPcs: number;
  length: number;
  breadth: number;
  height: number;
  actualWeight: number;
}

interface ShipmentEntry {
  id: string;
  wflAwb: string;
  vendorName: string;
  vendorAwb: string;
  mode: string;
  invoiceNumber: string;
  invoiceValue: string;
  consignor: string;
  fromLocation: string;
  consignee: string;
  destination: string;
  pinCode: string;
  oda: string;
  weightEntries: WeightEntry[];
  createdAt: string;
  createdBy: string;
  wfl_weight?: number;
  wfl_volumetric_weight?: number;
  actual_weight?: number;
  actual_volumetric_weight?: number;
}

interface Vendor {
  id: string;
  vendor_code: string;
  name: string;
  contact_number: string;
  email_id: string;
  address: string;
  pin_code: string;
  gst_number: string;
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
}

interface VendorPincode {
  pincode: string;
  oda: string;
}

interface ClientCftMultiplier {
  cft_multiplier: number;
}

// Add this interface to match the backend response
interface SavedShipment {
  id: string;
  wfl_number: string;
  vendor_awb_number: string;
  mode: string;
  consignor_from_location: string;
  consignee: string;
  destination: string;
  created_at: string;
  vendors: { name: string };
  clients: { client_name: string };
  shipment_boxes: Array<{
    number_of_pieces: number;
    length_cm: number;
    breadth_cm: number;
    height_cm: number;
    actual_weight_per_piece: number;
  }>;
}

export function DataEntryPage({ user, onViewChange }: DataEntryPageProps) {
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([
    { id: '1', noOfPcs: 0, length: 0, breadth: 0, height: 0, actualWeight: 0 }
  ]);

  const [shipmentEntries, setShipmentEntries] = useState<ShipmentEntry[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [vendorOpen, setVendorOpen] = useState(false);
  const [consignorOpen, setConsignorOpen] = useState(false);

  const [formData, setFormData] = useState({
    wflAwb: '',
    vendorName: '',
    vendorAwb: '',
    mode: '',
    invoiceNumber: '',
    invoiceValue: '',
    consignor: '',
    fromLocation: '',
    consignee: '',
    destination: '',
    pinCode: '',
    oda: '',
  });

  const [loading, setLoading] = useState(false);
  const [validPincodes, setValidPincodes] = useState<VendorPincode[]>([]);
  const [cftMultiplier, setCftMultiplier] = useState<number>(1);
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [pincodeOpen, setPincodeOpen] = useState(false);
  const [selectedOda, setSelectedOda] = useState<string>('');

  // Fetch vendors and clients on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [{ data: vendorsData, error: vendorsError }, { data: clientsData, error: clientsError }] = await Promise.all([
          supabase.from('vendors').select('*').order('created_at', { ascending: false }),
          supabase.from('clients').select('*').order('created_at', { ascending: false })
        ]);
        if (vendorsError) throw new Error(vendorsError.message || 'Failed to fetch vendors');
        if (clientsError) throw new Error(clientsError.message || 'Failed to fetch clients');
        setVendors(vendorsData || []);
        setClients(clientsData || []);
      } catch (err: any) {
        console.error('Error fetching data:', err.message);
      }
    };
    fetchData();
  }, []);

  // Fetch vendor pincodes when vendor is selected
  useEffect(() => {
    const fetchVendorPincodes = async () => {
      if (!selectedVendorId) return;
      try {
        const { data, error } = await supabase.from('vendor_pincodes').select('pincode, oda').eq('vendor_id', selectedVendorId);
        if (error) throw new Error(error.message || 'Failed to fetch vendor pincodes');
        setValidPincodes(data || []);
      } catch (error) {
        console.error('Error fetching vendor pincodes:', error);
        toast.error('Failed to fetch vendor pincodes');
      }
    };
    fetchVendorPincodes();
  }, [selectedVendorId]);

  // Fetch client CFT multiplier when client is selected
  useEffect(() => {
    const fetchClientCftMultiplier = async () => {
      if (!selectedClientId) return;
      try {
        const { data, error } = await supabase.from('clients').select('cft_multiplier').eq('id', selectedClientId).single();
        if (error) throw new Error(error.message || 'Failed to fetch client CFT multiplier');
        setCftMultiplier(data?.cft_multiplier || 1);
      } catch (error) {
        console.error('Error fetching client CFT multiplier:', error);
        toast.error('Failed to fetch client CFT multiplier');
      }
    };
    fetchClientCftMultiplier();
  }, [selectedClientId]);

  // Fetch all shipments on mount
  useEffect(() => {
    const fetchShipments = async () => {
      try {
        const { data, error } = await supabase
          .from('shipments')
          .select(`*, shipment_boxes (*), vendors:vendor_id (name), clients:client_id (client_name)`) 
          .order('created_at', { ascending: false });
        if (error) throw new Error(error.message || 'Failed to fetch shipments');
        const transformed = (data || []).map((savedShipment: any) => ({
          id: savedShipment.id,
          wflAwb: savedShipment.wfl_number,
          vendorName: savedShipment.vendors?.name || '',
          vendorAwb: savedShipment.vendor_awb_number,
          mode: savedShipment.mode,
          invoiceNumber: savedShipment.invoice_number || '',
          invoiceValue: savedShipment.invoice_value?.toString() || '',
          consignor: savedShipment.clients?.client_name || '',
          fromLocation: savedShipment.consignor_from_location,
          consignee: savedShipment.consignee,
          destination: savedShipment.destination,
          pinCode: savedShipment.pin_code || '',
          oda: savedShipment.oda || '',
          weightEntries: (savedShipment.shipment_boxes || []).map((box: any, idx: number) => ({
            id: `${savedShipment.id}-box-${idx}`,
            noOfPcs: box.number_of_pieces,
            length: box.length_cm,
            breadth: box.breadth_cm,
            height: box.height_cm,
            actualWeight: box.actual_weight_per_piece
          })),
          createdAt: savedShipment.created_at,
          createdBy: user.name || user.email,
          wfl_weight: savedShipment.wfl_weight,
          wfl_volumetric_weight: savedShipment.wfl_volumetric_weight,
          actual_weight: savedShipment.actual_weight,
          actual_volumetric_weight: savedShipment.actual_volumetric_weight,
        }));
        setShipmentEntries(transformed);
      } catch (err: any) {
        console.error('Error fetching shipments:', err.message);
      }
    };
    fetchShipments();
  }, []);

  const addWeightEntry = () => {
    const newEntry: WeightEntry = {
      id: Date.now().toString(),
      noOfPcs: 0,
      length: 0,
      breadth: 0,
      height: 0,
      actualWeight: 0
    };
    setWeightEntries([...weightEntries, newEntry]);
  };

  const removeWeightEntry = (id: string) => {
    if (weightEntries.length > 1) {
      setWeightEntries(weightEntries.filter(entry => entry.id !== id));
    }
  };

  const handleWeightInputChange = (id: string, field: keyof WeightEntry, value: string) => {
    setWeightEntries(entries =>
      entries.map(entry =>
        entry.id === id
          ? {
              ...entry,
              [field]: field === 'noOfPcs' ? parseInt(value) || 0 : parseFloat(value) || 0
            }
          : entry
      )
    );
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Add this function to handle pincode selection
  const handlePincodeSelect = (pincode: string) => {
    const selectedPincode = validPincodes.find(p => p.pincode === pincode);
    if (selectedPincode) {
      handleInputChange('pinCode', pincode);
      setSelectedOda(selectedPincode.oda);
      handleInputChange('oda', selectedPincode.oda);
    }
    setPincodeOpen(false);
  };

  // Modify the vendor selection handler to reset pincode and ODA
  const handleVendorSelect = (vendorName: string) => {
    const selectedVendor = vendors.find(v => v.name === vendorName);
    if (selectedVendor) {
      setSelectedVendorId(selectedVendor.id);
      handleInputChange('vendorName', vendorName);
      // Reset pincode and ODA when vendor changes
      handleInputChange('pinCode', '');
      handleInputChange('oda', '');
      setSelectedOda('');
    }
  };

  // Modify the client selection handler
  const handleClientSelect = (clientName: string) => {
    const selectedClient = clients.find(c => c.client_name === clientName);
    if (selectedClient) {
      setSelectedClientId(selectedClient.id);
      handleInputChange('consignor', clientName);
    }
  };

  // Add this function to calculate volumetric weight
  const calculateVolumetricWeight = (length: number, breadth: number, height: number) => {
    return (length * breadth * height / 27000) * cftMultiplier;
  };

  // Update the handleSubmit function
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate vendor pincode
      if (!selectedVendorId || !formData.pinCode) {
        throw new Error('Please select a vendor and enter a pincode');
      }

      const pincodeResponse = await fetch(
        `http://localhost:4000/api/validate-pincode/${selectedVendorId}/${formData.pinCode}`
      );

      if (!pincodeResponse.ok) {
        throw new Error('Invalid pincode for the selected vendor');
      }

      const pincodeData = await pincodeResponse.json();
      
      // Calculate volumetric weights for all boxes
      const calculatedWeightEntries = weightEntries.map(entry => {
        const volumetricWeight = calculateVolumetricWeight(entry.length, entry.breadth, entry.height);
        return {
          ...entry,
          volumetricWeight,
          totalVolumetricWeight: volumetricWeight * entry.noOfPcs
        };
      });

      // Calculate total weights
      const totalActualWeight = calculatedWeightEntries.reduce(
        (sum, entry) => sum + (entry.actualWeight * entry.noOfPcs), 
        0
      );
      const totalVolumetricWeight = calculatedWeightEntries.reduce(
        (sum, entry) => sum + entry.totalVolumetricWeight, 
        0
      );

      // Prepare the shipment data according to the current table structure
      const shipmentData = {
        user_id: user.id,
        client_id: selectedClientId,
        vendor_id: selectedVendorId, // Using vendor_id instead of vendor_name
        zone_id: null, // Add this if you have zone selection
        wfl_number: formData.wflAwb,
        vendor_awb_number: formData.vendorAwb,
        mode: formData.mode,
        invoice_number: formData.invoiceNumber,
        invoice_value: parseFloat(formData.invoiceValue) || 0,
        consignor_from_location: formData.fromLocation,
        consignee: formData.consignee,
        destination: formData.destination,
        pin_code: formData.pinCode,
        total_box: calculatedWeightEntries.length,
        actual_weight: totalActualWeight,
        actual_volumetric_weight: totalVolumetricWeight,
        wfl_weight: totalActualWeight,
        wfl_volumetric_weight: totalVolumetricWeight,
        oda: pincodeData.oda,
        shipment_date: new Date().toISOString().split('T')[0],
        boxes: calculatedWeightEntries.map(entry => ({
          number_of_pieces: entry.noOfPcs,
          length_cm: entry.length,
          breadth_cm: entry.breadth,
          height_cm: entry.height,
          actual_weight_per_piece: entry.actualWeight,
          volumetric_weight_per_piece: entry.volumetricWeight,
          total_volumetric_weight: entry.totalVolumetricWeight
        }))
      };

      // Send the data to the backend
      const response = await fetch('http://localhost:4000/api/shipments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shipmentData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save shipment');
      }

      const savedShipment: SavedShipment = await response.json();

      // Transform the saved shipment to match the expected structure
      const transformedShipment: ShipmentEntry = {
        id: savedShipment.id,
        wflAwb: savedShipment.wfl_number,
        vendorName: savedShipment.vendors.name,
        vendorAwb: savedShipment.vendor_awb_number,
        mode: savedShipment.mode,
        invoiceNumber: '', // These fields are not in the table display
        invoiceValue: '',
        consignor: savedShipment.clients.client_name,
        fromLocation: savedShipment.consignor_from_location,
        consignee: savedShipment.consignee,
        destination: savedShipment.destination,
        pinCode: '', // These fields are not in the table display
        oda: '',
        weightEntries: savedShipment.shipment_boxes.map((box, idx) => ({
          id: `${savedShipment.id}-box-${idx}`,
          noOfPcs: box.number_of_pieces,
          length: box.length_cm,
          breadth: box.breadth_cm,
          height: box.height_cm,
          actualWeight: box.actual_weight_per_piece
        })),
        createdAt: savedShipment.created_at,
        createdBy: user.name || user.email,
        wfl_weight: (savedShipment as any).wfl_weight,
        wfl_volumetric_weight: (savedShipment as any).wfl_volumetric_weight,
        actual_weight: (savedShipment as any).actual_weight,
        actual_volumetric_weight: (savedShipment as any).actual_volumetric_weight,
      };

      // Update local state with the transformed shipment
      setShipmentEntries([transformedShipment, ...shipmentEntries]);
      
      // Reset form
      setFormData({
        wflAwb: '',
        vendorName: '',
        vendorAwb: '',
        mode: '',
        invoiceNumber: '',
        invoiceValue: '',
        consignor: '',
        fromLocation: '',
        consignee: '',
        destination: '',
        pinCode: '',
        oda: '',
      });
      
      setWeightEntries([{ 
        id: Date.now().toString(), 
        noOfPcs: 0, 
        length: 0, 
        breadth: 0, 
        height: 0, 
        actualWeight: 0 
      }]);

      setSelectedVendorId('');
      setSelectedClientId('');
      setValidPincodes([]);
      setCftMultiplier(1);
      setSelectedOda('');

      toast.success('Shipment saved successfully');
    } catch (error: any) {
      console.error('Error saving shipment:', error);
      toast.error(error.message || 'Failed to save shipment');
    } finally {
      setLoading(false);
    }
  };

  const getTotalPieces = () => {
    return weightEntries.reduce((total, entry) => total + entry.noOfPcs, 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-poppins">Data Entry</h1>
          <p className="text-muted-foreground mt-2">
            Input and manage shipment data
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center"
          onClick={() => typeof onViewChange === 'function' && onViewChange('all-shipments' as ActiveView)}
        >
          <Database className="w-4 h-4 mr-2" />
          All Shipments
        </Button>
      </div>

      {/* Data Entry Form */}
      <Card className="glass-effect border-2">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Plus className="w-5 h-5 mr-2 text-logistics-primary" />
            New Shipment Entry
          </CardTitle>
          <CardDescription>
            Fill in the shipment details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="wfl-awb">WFL AWB Number</Label>
                <Input 
                  id="wfl-awb" 
                  value={formData.wflAwb}
                  onChange={(e) => handleInputChange('wflAwb', e.target.value)}
                  placeholder="Enter WFL AWB number" 
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vendor-name">Vendor Name</Label>
                <Popover open={vendorOpen} onOpenChange={setVendorOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={vendorOpen}
                      className="w-full justify-between"
                    >
                      {formData.vendorName || "Select vendor..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search vendor..." />
                      <CommandList>
                        <CommandEmpty>No vendor found.</CommandEmpty>
                        <CommandGroup>
                          {vendors.map((vendor) => (
                            <CommandItem
                              key={vendor.id}
                              value={vendor.name}
                              onSelect={(currentValue) => {
                                handleVendorSelect(currentValue);
                                setVendorOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.vendorName === vendor.name ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {vendor.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="vendor-awb">Vendor AWB Number</Label>
                <Input 
                  id="vendor-awb" 
                  value={formData.vendorAwb}
                  onChange={(e) => handleInputChange('vendorAwb', e.target.value)}
                  placeholder="Enter vendor AWB number" 
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mode">Mode</Label>
                <Select value={formData.mode} onValueChange={(value) => handleInputChange('mode', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="air">Air</SelectItem>
                    <SelectItem value="surface">Surface</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoice-number">Invoice Number</Label>
                <Input 
                  id="invoice-number" 
                  value={formData.invoiceNumber}
                  onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                  placeholder="Enter invoice number" 
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoice-value">Invoice Value</Label>
                <Input 
                  id="invoice-value" 
                  value={formData.invoiceValue}
                  onChange={(e) => handleInputChange('invoiceValue', e.target.value)}
                  placeholder="Enter invoice value" 
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="consignor">Consignor</Label>
                <Popover open={consignorOpen} onOpenChange={setConsignorOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={consignorOpen}
                      className="w-full justify-between"
                    >
                      {formData.consignor || "Select consignor..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search consignor..." />
                      <CommandList>
                        <CommandEmpty>No consignor found.</CommandEmpty>
                        <CommandGroup>
                          {clients.map((client) => (
                            <CommandItem
                              key={client.id}
                              value={client.client_name}
                              onSelect={(currentValue) => {
                                handleClientSelect(currentValue);
                                setConsignorOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.consignor === client.client_name ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {client.client_name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="from-location">From Location</Label>
                <Input 
                  id="from-location" 
                  value={formData.fromLocation}
                  onChange={(e) => handleInputChange('fromLocation', e.target.value)}
                  placeholder="Enter from location" 
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="consignee">Consignee</Label>
                <Input 
                  id="consignee" 
                  value={formData.consignee}
                  onChange={(e) => handleInputChange('consignee', e.target.value)}
                  placeholder="Enter consignee" 
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="destination">Destination</Label>
                <Input 
                  id="destination" 
                  value={formData.destination}
                  onChange={(e) => handleInputChange('destination', e.target.value)}
                  placeholder="Enter destination" 
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pin-code">Pin Code</Label>
                <Popover open={pincodeOpen} onOpenChange={setPincodeOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={pincodeOpen}
                      className="w-full justify-between"
                      disabled={!selectedVendorId}
                    >
                      {formData.pinCode || "Select pincode..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search pincode..." />
                      <CommandList>
                        <CommandEmpty>No pincode found.</CommandEmpty>
                        <CommandGroup>
                          {validPincodes.map((pincode) => (
                            <CommandItem
                              key={pincode.pincode}
                              value={pincode.pincode}
                              onSelect={handlePincodeSelect}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.pinCode === pincode.pincode ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {pincode.pincode}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="oda">ODA</Label>
                <Input
                  id="oda"
                  value={selectedOda}
                  readOnly
                  placeholder="ODA will be set automatically"
                  className="bg-muted"
                />
              </div>
            </div>

            {/* Weight Entries Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Weight Entries</h3>
                <Button
                  type="button"
                  onClick={addWeightEntry}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Box
                </Button>
              </div>

              <div className="space-y-4">
                {weightEntries.map((entry, index) => (
                  <div key={entry.id} className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border rounded-lg">
                    <div>
                      <Label htmlFor={`pcs-${entry.id}`}>No. of Pcs</Label>
                      <Input
                        id={`pcs-${entry.id}`}
                        type="number"
                        value={entry.noOfPcs}
                        onChange={(e) => handleWeightInputChange(entry.id, 'noOfPcs', e.target.value)}
                        placeholder="Enter number of pieces"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor={`length-${entry.id}`}>Length (cm)</Label>
                      <Input
                        id={`length-${entry.id}`}
                        type="number"
                        value={entry.length}
                        onChange={(e) => handleWeightInputChange(entry.id, 'length', e.target.value)}
                        placeholder="Enter length"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor={`breadth-${entry.id}`}>Breadth (cm)</Label>
                      <Input
                        id={`breadth-${entry.id}`}
                        type="number"
                        value={entry.breadth}
                        onChange={(e) => handleWeightInputChange(entry.id, 'breadth', e.target.value)}
                        placeholder="Enter breadth"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor={`height-${entry.id}`}>Height (cm)</Label>
                      <Input
                        id={`height-${entry.id}`}
                        type="number"
                        value={entry.height}
                        onChange={(e) => handleWeightInputChange(entry.id, 'height', e.target.value)}
                        placeholder="Enter height"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor={`weight-${entry.id}`}>Actual Weight (kg)</Label>
                      <Input
                        id={`weight-${entry.id}`}
                        type="number"
                        value={entry.actualWeight}
                        onChange={(e) => handleWeightInputChange(entry.id, 'actualWeight', e.target.value)}
                        placeholder="Enter actual weight"
                        required
                      />
                    </div>
                    {index > 0 && (
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => removeWeightEntry(entry.id)}
                          className="w-full"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => {
                setFormData({
                  wflAwb: '',
                  vendorName: '',
                  vendorAwb: '',
                  mode: '',
                  invoiceNumber: '',
                  invoiceValue: '',
                  consignor: '',
                  fromLocation: '',
                  consignee: '',
                  destination: '',
                  pinCode: '',
                  oda: '',
                });
                setWeightEntries([{ id: Date.now().toString(), noOfPcs: 0, length: 0, breadth: 0, height: 0, actualWeight: 0 }]);
              }}>
                Clear
              </Button>
              <Button 
                type="submit" 
                size="sm" 
                className="logistics-gradient min-w-[120px]"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Entry'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* All Entries Display */}
      <Card className="glass-effect border-2">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="w-5 h-5 mr-2 text-logistics-primary" />
            All Shipment Entries
          </CardTitle>
          <CardDescription>
            View all submitted shipment data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {shipmentEntries.length === 0 ? (
            <div className="text-center py-12">
              <Database className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No entries found</h3>
              <p className="text-muted-foreground">
                Submit your first shipment entry using the form above
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>WFL AWB Number</TableHead>
                    <TableHead>Vendor Name</TableHead>
                    <TableHead>Vendor AWB Number</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Invoice Number</TableHead>
                    <TableHead>Invoice Value</TableHead>
                    <TableHead>Consignor</TableHead>
                    <TableHead>From Location</TableHead>
                    <TableHead>Consignee</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Pin Code</TableHead>
                    <TableHead>ODA</TableHead>
                    <TableHead>WFL Weight</TableHead>
                    <TableHead>WFL Volumetric Weight</TableHead>
                    <TableHead>Actual Weight</TableHead>
                    <TableHead>Actual Volumetric Weight</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shipmentEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.wflAwb}</TableCell>
                      <TableCell>{entry.vendorName}</TableCell>
                      <TableCell>{entry.vendorAwb}</TableCell>
                      <TableCell>{entry.mode}</TableCell>
                      <TableCell>{entry.invoiceNumber}</TableCell>
                      <TableCell>{entry.invoiceValue}</TableCell>
                      <TableCell>{entry.consignor}</TableCell>
                      <TableCell>{entry.fromLocation}</TableCell>
                      <TableCell>{entry.consignee}</TableCell>
                      <TableCell>{entry.destination}</TableCell>
                      <TableCell>{entry.pinCode}</TableCell>
                      <TableCell>{entry.oda}</TableCell>
                      <TableCell>{entry.wfl_weight || '-'}</TableCell>
                      <TableCell>{entry.wfl_volumetric_weight || '-'}</TableCell>
                      <TableCell>{entry.actual_weight || '-'}</TableCell>
                      <TableCell>{entry.actual_volumetric_weight || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
