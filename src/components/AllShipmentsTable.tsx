import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { supabase } from '@/supabaseClient';

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

export default function AllShipmentsTable() {
  const [shipments, setShipments] = useState<ShipmentEntry[]>([]);

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
          vendorName: savedShipment.vendors?.name || '-',
          vendorAwb: savedShipment.vendor_awb_number,
          mode: savedShipment.mode,
          invoiceNumber: savedShipment.invoice_number || '',
          invoiceValue: savedShipment.invoice_value?.toString() || '',
          consignor: savedShipment.clients?.client_name || '-',
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
          createdBy: '',
          wfl_weight: savedShipment.wfl_weight,
          wfl_volumetric_weight: savedShipment.wfl_volumetric_weight,
          actual_weight: savedShipment.actual_weight,
          actual_volumetric_weight: savedShipment.actual_volumetric_weight,
        }));
        setShipments(transformed);
      } catch (err: any) {
        // eslint-disable-next-line no-console
        console.error('Error fetching shipments:', err.message);
      }
    };
    fetchShipments();
  }, []);

  return (
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
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shipments.map((entry) => (
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
              <TableCell>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <span role="img" aria-label="edit">✏️</span>
                  </Button>
                  <Button variant="destructive" size="sm">
                    <span role="img" aria-label="delete">🗑️</span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 