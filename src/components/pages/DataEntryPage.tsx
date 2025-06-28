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

  // Add new state for WFL boxes and 'same as vendor' option
  const [wflWeightEntries, setWflWeightEntries] = useState<WeightEntry[]>([
    { id: 'wfl-1', noOfPcs: 0, length: 0, breadth: 0, height: 0, actualWeight: 0 }
  ]);
  const [sameAsVendor, setSameAsVendor] = useState(false);

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
      if (!selectedClientId || !formData.mode) return;
      try {
        // Map form mode to DB mode value
        let modeForQuery = formData.mode;
        if (formData.mode.toLowerCase() === 'surface') modeForQuery = 'sfc';
        if (formData.mode.toLowerCase() === 'air') modeForQuery = 'air'; // add more mappings if needed
        console.log('Fetching cft for:', { client_id: selectedClientId, mode: modeForQuery });
        const { data: dataCft, error: errorCft } = await supabase
          .from('client_rates')
          .select('cft')
          .eq('client_id', selectedClientId)
          .eq('mode', modeForQuery)
          .maybeSingle();
        if (errorCft) throw new Error(errorCft.message || 'Failed to fetch client CFT');
        setCftMultiplier(dataCft?.cft || 1);
      } catch (error) {
        console.error('Error fetching client CFT:', error);
        toast.error('Failed to fetch client CFT');
      }
    };
    fetchClientCftMultiplier();
  }, [selectedClientId, formData.mode]);

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

  // Update volumetric weight calculation for each box
  // Calculate WFL volumetric weight
  const calculateVolumetricWeightPerPiece = (length: number, breadth: number, height: number) => {
    if (!formData.mode || !cftMultiplier) return 0;
    const cft = cftMultiplier;
    console.log('Volumetric Calculation:', { length, breadth, height, cft });
    if (formData.mode.toLowerCase() === 'surface') {
      return (length * breadth * height * cft) / 27000;
    } else if (formData.mode.toLowerCase() === 'air') {
      return (length * breadth * height * cft) / 5000;
    }
    return 0;
  };

  // Recalculate WFL box weights
  const recalculateWflBoxWeights = (boxesToUse = wflWeightEntries) => {
    const updatedBoxes = boxesToUse.map(box => {
      const volumetricWeightPerPiece = calculateVolumetricWeightPerPiece(box.length, box.breadth, box.height);
      return {
        ...box,
        volumetricWeightPerPiece,
        totalVolumetricWeight: volumetricWeightPerPiece * box.noOfPcs
      };
    });
    setWflWeightEntries(updatedBoxes);
  };

  // Handle WFL box input changes
  const handleWflBoxChange = (id: string, field: keyof WeightEntry, value: string) => {
    const updatedBoxes = wflWeightEntries.map(entry =>
      entry.id === id
        ? {
            ...entry,
            [field]: field === 'noOfPcs' ? parseInt(value) || 0 : parseFloat(value) || 0
          }
        : entry
    );
    setWflWeightEntries(updatedBoxes);
    recalculateWflBoxWeights(updatedBoxes);
  };

  // Add/remove WFL box
  const addWflBox = () => {
    setWflWeightEntries([...wflWeightEntries, { id: `wfl-${Date.now()}`, noOfPcs: 0, length: 0, breadth: 0, height: 0, actualWeight: 0 }]);
  };
  const removeWflBox = (id: string) => {
    if (wflWeightEntries.length > 1) {
      setWflWeightEntries(wflWeightEntries.filter(entry => entry.id !== id));
    }
  };

  // Handle 'Same as Vendor Weight' toggle
  useEffect(() => {
    if (sameAsVendor) {
      // Copy vendor boxes to WFL and recalculate
      const copied = weightEntries.map(box => ({ ...box, id: `wfl-${box.id}` }));
      setWflWeightEntries(copied);
      recalculateWflBoxWeights(copied);
    }
  }, [sameAsVendor, weightEntries, formData.mode, cftMultiplier]);

  // Calculate totals for backend
  const calculateTotal = (boxesArr: any[], field: string) => {
    return boxesArr.reduce((sum, box) => sum + (box[field] * box.noOfPcs), 0);
  };
  const calculateTotalVolumetric = (boxesArr: any[]) => {
    return boxesArr.reduce((sum, box) => sum + (box.totalVolumetricWeight || 0), 0);
  };

  // Update the handleSubmit function
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Vendor weights
      const calculatedWeightEntries = weightEntries.map(entry => {
        const volumetricWeightPerPiece = calculateVolumetricWeightPerPiece(entry.length, entry.breadth, entry.height);
        return {
          ...entry,
          volumetricWeightPerPiece,
          totalVolumetricWeight: volumetricWeightPerPiece * entry.noOfPcs
        };
      });
      const vendorActualWeight = calculateTotal(calculatedWeightEntries, 'actualWeight');
      const vendorVolumetricWeight = calculateTotalVolumetric(calculatedWeightEntries);
      // WFL weights
      const calculatedWflWeightEntries = wflWeightEntries.map(entry => {
        const volumetricWeightPerPiece = calculateVolumetricWeightPerPiece(entry.length, entry.breadth, entry.height);
        return {
          ...entry,
          volumetricWeightPerPiece,
          totalVolumetricWeight: volumetricWeightPerPiece * entry.noOfPcs
        };
      });
      const wflActualWeight = calculateTotal(calculatedWflWeightEntries, 'actualWeight');
      const wflVolumetricWeight = calculateTotalVolumetric(calculatedWflWeightEntries);

      // Prepare the shipment data
      const shipmentData = {
        user_id: user.id,
        client_id: selectedClientId,
        vendor_id: selectedVendorId,
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
        total_box: weightEntries.length,
        actual_weight: vendorActualWeight,
        actual_volumetric_weight: vendorVolumetricWeight,
        wfl_weight: wflActualWeight,
        wfl_volumetric_weight: wflVolumetricWeight,
        oda: selectedOda,
        shipment_date: new Date().toISOString().split('T')[0],
      };

      // Insert into shipments table
      const { data: shipment, error: shipmentError } = await supabase
        .from('shipments')
        .insert([shipmentData])
        .select()
        .single();
      if (shipmentError) throw shipmentError;

      // Insert boxes into shipment_boxes table
      const allBoxes = [
        ...calculatedWeightEntries.map(entry => ({
          shipment_id: shipment.id,
          number_of_pieces: entry.noOfPcs,
          length_cm: entry.length,
          breadth_cm: entry.breadth,
          height_cm: entry.height,
          actual_weight_per_piece: entry.actualWeight,
          volumetric_weight_per_piece: entry.volumetricWeightPerPiece,
          total_volumetric_weight: entry.totalVolumetricWeight
        })),
        ...calculatedWflWeightEntries.map(entry => ({
          shipment_id: shipment.id,
          number_of_pieces: entry.noOfPcs,
          length_cm: entry.length,
          breadth_cm: entry.breadth,
          height_cm: entry.height,
          actual_weight_per_piece: entry.actualWeight,
          volumetric_weight_per_piece: entry.volumetricWeightPerPiece,
          total_volumetric_weight: entry.totalVolumetricWeight
        }))
      ];
      if (allBoxes.length > 0) {
        const { error: boxesError } = await supabase
          .from('shipment_boxes')
          .insert(allBoxes);
        if (boxesError) throw boxesError;
      }

      // Reset form and show success
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
      setWflWeightEntries([{ id: 'wfl-1', noOfPcs: 0, length: 0, breadth: 0, height: 0, actualWeight: 0 }]);
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
                        onChange={e => handleWeightInputChange(entry.id, 'noOfPcs', e.target.value)}
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
                        onChange={e => handleWeightInputChange(entry.id, 'length', e.target.value)}
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
                        onChange={e => handleWeightInputChange(entry.id, 'breadth', e.target.value)}
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
                        onChange={e => handleWeightInputChange(entry.id, 'height', e.target.value)}
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
                        onChange={e => handleWeightInputChange(entry.id, 'actualWeight', e.target.value)}
                        placeholder="Enter actual weight"
                        required
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      {index > 0 && (
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => removeWeightEntry(entry.id)}
                          className="w-8 h-8 p-0 flex items-center justify-center"
                          title="Remove"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        type="button"
                        onClick={addWeightEntry}
                        variant="outline"
                        size="icon"
                        className="w-8 h-8 p-0 flex items-center justify-center"
                        title="Add Box"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* WFL Weight Entries Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium">WFL Weight Entries</h3>
                <label className="flex items-center text-base font-normal">
                  <input
                    type="checkbox"
                    checked={sameAsVendor}
                    onChange={e => setSameAsVendor(e.target.checked)}
                    className="mr-2"
                  />
                  Weight is same as Vendor
                </label>
              </div>
              <div className="space-y-4">
                {wflWeightEntries.map((entry, index) => (
                  <div key={entry.id} className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border rounded-lg">
                    <div>
                      <Label htmlFor={`pcs-${entry.id}`}>No. of Pcs</Label>
                      <Input
                        id={`pcs-${entry.id}`}
                        type="number"
                        value={entry.noOfPcs}
                        onChange={e => handleWflBoxChange(entry.id, 'noOfPcs', e.target.value)}
                        placeholder="Enter number of pieces"
                        required
                        disabled={sameAsVendor}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`length-${entry.id}`}>Length (cm)</Label>
                      <Input
                        id={`length-${entry.id}`}
                        type="number"
                        value={entry.length}
                        onChange={e => handleWflBoxChange(entry.id, 'length', e.target.value)}
                        placeholder="Enter length"
                        required
                        disabled={sameAsVendor}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`breadth-${entry.id}`}>Breadth (cm)</Label>
                      <Input
                        id={`breadth-${entry.id}`}
                        type="number"
                        value={entry.breadth}
                        onChange={e => handleWflBoxChange(entry.id, 'breadth', e.target.value)}
                        placeholder="Enter breadth"
                        required
                        disabled={sameAsVendor}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`height-${entry.id}`}>Height (cm)</Label>
                      <Input
                        id={`height-${entry.id}`}
                        type="number"
                        value={entry.height}
                        onChange={e => handleWflBoxChange(entry.id, 'height', e.target.value)}
                        placeholder="Enter height"
                        required
                        disabled={sameAsVendor}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`weight-${entry.id}`}>Actual Weight (kg)</Label>
                      <Input
                        id={`weight-${entry.id}`}
                        type="number"
                        value={entry.actualWeight}
                        onChange={e => handleWflBoxChange(entry.id, 'actualWeight', e.target.value)}
                        placeholder="Enter actual weight"
                        required
                        disabled={sameAsVendor}
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      {index > 0 && !sameAsVendor && (
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => removeWflBox(entry.id)}
                          className="w-8 h-8 p-0 flex items-center justify-center"
                          title="Remove"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        type="button"
                        onClick={addWflBox}
                        variant="outline"
                        size="icon"
                        className="w-8 h-8 p-0 flex items-center justify-center"
                        disabled={sameAsVendor}
                        title="Add Box"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
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
    </div>
  );
}
