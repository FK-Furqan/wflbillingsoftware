import express from 'express';
import cors from 'cors';
import supabase from './supabaseClient.js';

const app = express();
app.use(cors());
app.use(express.json());

// Example: Get all clients
app.get('/api/clients', async (req, res) => {
  const { data, error } = await supabase.from('clients').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/api/forgot-password', async (req, res) => {
  const { email } = req.body;
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'http://localhost:8080/reset-password' // Updated to match frontend port
  });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Password reset email sent.' });
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return res.status(401).json({ error: error.message });
  res.json({
    id: data.user.id,
    name: data.user.user_metadata?.name || data.user.email,
    email: data.user.email,
    role: data.user.user_metadata?.role || 'user',
  });
});

app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return res.status(400).json({ error: error.message });
  res.json({
    id: data.user.id,
    email: data.user.email,
  });
});

// Create a new client
app.post('/api/clients', async (req, res) => {
  const { client_code, client_name, contact_number, email_id, address, pin_code, gst_number, created_by } = req.body;
  const { data, error } = await supabase.from('clients').insert([{
    client_code,
    client_name,
    contact_number,
    email_id,
    address,
    pin_code,
    gst_number,
    created_by,
    // created_at will be set automatically
  }]).select();
  if (error) {
    console.error('Error inserting client:', error);
    return res.status(400).json({ error: error.message });
  }
  res.json(data[0]);
});

// Update a client
app.put('/api/clients/:id', async (req, res) => {
  const { id } = req.params;
  const { client_code, client_name, contact_number, email_id, address, pin_code, gst_number } = req.body;
  const { data, error } = await supabase.from('clients').update({
    client_code,
    client_name,
    contact_number,
    email_id,
    address,
    pin_code,
    gst_number,
  }).eq('id', id).select();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data[0]);
});

// Delete a client
app.delete('/api/clients/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('clients').delete().eq('id', id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

// Get all vendors
app.get('/api/vendors', async (req, res) => {
  const { data, error } = await supabase.from('vendors').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Create a new vendor
app.post('/api/vendors', async (req, res) => {
  const { name, contact_number, email, address, pincode, gst_number } = req.body;
  const { data, error } = await supabase.from('vendors').insert([{
    name,
    contact_number,
    email,
    address,
    pincode,
    gst_number,
    // created_at will be set automatically
  }]).select();
  if (error) {
    console.error('Error inserting vendor:', error);
    return res.status(400).json({ error: error.message });
  }
  res.json(data[0]);
});

// Update a vendor
app.put('/api/vendors/:id', async (req, res) => {
  const { id } = req.params;
  const { name, contact_number, email, address, pincode, gst_number } = req.body;
  const { data, error } = await supabase.from('vendors').update({
    name,
    contact_number,
    email,
    address,
    pincode,
    gst_number,
  }).eq('id', id).select();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data[0]);
});

// Delete a vendor
app.delete('/api/vendors/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('vendors').delete().eq('id', id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

// Get vendor pincodes and ODA status
app.get('/api/vendor-pincodes/:vendorId', async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { data, error } = await supabase
      .from('vendor_pincodes')
      .select('pincode, oda')
      .eq('vendor_id', vendorId);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching vendor pincodes:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get client CFT multiplier
app.get('/api/clients/:clientId/cft-multiplier', async (req, res) => {
  try {
    const { clientId } = req.params;
    const { data, error } = await supabase
      .from('clients')
      .select('cft_multiplier')
      .eq('id', clientId)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Client not found' });
    }
    res.json({ cft_multiplier: data.cft_multiplier });
  } catch (error) {
    console.error('Error fetching client CFT multiplier:', error);
    res.status(500).json({ error: error.message });
  }
});

// Validate vendor pincode and get ODA status
app.get('/api/validate-pincode/:vendorId/:pincode', async (req, res) => {
  try {
    const { vendorId, pincode } = req.params;
    const { data, error } = await supabase
      .from('vendor_pincodes')
      .select('oda')
      .eq('vendor_id', vendorId)
      .eq('pincode', pincode)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Invalid pincode for this vendor' });
    }
    res.json({ oda: data.oda });
  } catch (error) {
    console.error('Error validating pincode:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all shipments with their boxes
app.get('/api/shipments', async (req, res) => {
  try {
    const { data: shipments, error: shipmentsError } = await supabase
      .from('shipments')
      .select(`
        *,
        shipment_boxes (*),
        vendors:vendor_id (name),
        clients:client_id (client_name)
      `)
      .order('created_at', { ascending: false });

    if (shipmentsError) throw shipmentsError;
    res.json(shipments);
  } catch (error) {
    console.error('Error fetching shipments:', error);
    res.status(500).json({ error: error.message });
  }
});

// Modify the existing shipment creation endpoint to include validations
app.post('/api/shipments', async (req, res) => {
  const {
    user_id,
    client_id,
    vendor_id,
    zone_id,
    wfl_number,
    vendor_awb_number,
    mode,
    invoice_number,
    invoice_value,
    consignor_from_location,
    consignee,
    destination,
    pin_code,
    total_box,
    actual_weight,
    actual_volumetric_weight,
    wfl_weight,
    wfl_volumetric_weight,
    oda,
    shipment_date,
    boxes
  } = req.body;

  try {
    // Validate vendor pincode
    const { data: pincodeData, error: pincodeError } = await supabase
      .from('vendor_pincodes')
      .select('oda')
      .eq('vendor_id', vendor_id)
      .eq('pincode', pin_code)
      .single();

    if (pincodeError || !pincodeData) {
      return res.status(400).json({ 
        error: 'Invalid pincode for the selected vendor' 
      });
    }

    // Validate client exists and get CFT multiplier
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('cft_multiplier')
      .eq('id', client_id)
      .single();

    if (clientError || !clientData) {
      return res.status(400).json({ 
        error: 'Invalid client selected' 
      });
    }

    // Start a transaction by inserting the shipment
    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .insert([{
        user_id,
        client_id,
        vendor_id,
        zone_id,
        wfl_number,
        vendor_awb_number,
        mode,
        invoice_number,
        invoice_value,
        consignor_from_location,
        consignee,
        destination,
        pin_code,
        total_box,
        actual_weight,
        actual_volumetric_weight,
        wfl_weight,
        wfl_volumetric_weight,
        oda: pincodeData.oda,
        shipment_date
      }])
      .select()
      .single();

    if (shipmentError) throw shipmentError;

    // Insert boxes with calculated weights
    if (boxes && boxes.length > 0) {
      const boxesWithShipmentId = boxes.map(box => ({
        ...box,
        shipment_id: shipment.id
      }));

      const { error: boxesError } = await supabase
        .from('shipment_boxes')
        .insert(boxesWithShipmentId);

      if (boxesError) throw boxesError;
    }

    // Fetch and return the complete shipment with boxes
    const { data: completeShipment, error: fetchError } = await supabase
      .from('shipments')
      .select(`
        *,
        shipment_boxes (*),
        vendors:vendor_id (name),
        clients:client_id (client_name)
      `)
      .eq('id', shipment.id)
      .single();

    if (fetchError) throw fetchError;

    res.json(completeShipment);
  } catch (error) {
    console.error('Error creating shipment:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get a single shipment with its boxes
app.get('/api/shipments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('shipments')
      .select(`
        *,
        shipment_boxes (*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching shipment:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update a shipment and its boxes
app.put('/api/shipments/:id', async (req, res) => {
  const { id } = req.params;
  const {
    user_id,
    client_id,
    zone_id,
    wfl_number,
    vendor_name,
    vendor_awb_number,
    mode,
    invoice_number,
    invoice_value,
    consignor_from_location,
    consignee,
    destination,
    pin_code,
    total_box,
    actual_weight,
    actual_volumetric_weight,
    wfl_weight,
    wfl_volumetric_weight,
    oda,
    shipment_date,
    boxes // Array of box objects
  } = req.body;

  try {
    // Update the shipment
    const { error: shipmentError } = await supabase
      .from('shipments')
      .update({
        user_id,
        client_id,
        zone_id,
        wfl_number,
        vendor_name,
        vendor_awb_number,
        mode,
        invoice_number,
        invoice_value,
        consignor_from_location,
        consignee,
        destination,
        pin_code,
        total_box,
        actual_weight,
        actual_volumetric_weight,
        wfl_weight,
        wfl_volumetric_weight,
        oda,
        shipment_date
      })
      .eq('id', id);

    if (shipmentError) throw shipmentError;

    // If boxes are provided, delete existing boxes and insert new ones
    if (boxes && boxes.length > 0) {
      // Delete existing boxes
      const { error: deleteError } = await supabase
        .from('shipment_boxes')
        .delete()
        .eq('shipment_id', id);

      if (deleteError) throw deleteError;

      // Insert new boxes
      const boxesWithShipmentId = boxes.map(box => ({
        ...box,
        shipment_id: id
      }));

      const { error: boxesError } = await supabase
        .from('shipment_boxes')
        .insert(boxesWithShipmentId);

      if (boxesError) throw boxesError;
    }

    // Fetch and return the updated shipment with boxes
    const { data: updatedShipment, error: fetchError } = await supabase
      .from('shipments')
      .select(`
        *,
        shipment_boxes (*)
      `)
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    res.json(updatedShipment);
  } catch (error) {
    console.error('Error updating shipment:', error);
    res.status(400).json({ error: error.message });
  }
});

// Delete a shipment (this will automatically delete associated boxes due to ON DELETE CASCADE)
app.delete('/api/shipments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('shipments')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting shipment:', error);
    res.status(400).json({ error: error.message });
  }
});

// Add more routes as needed...

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
}); 