import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Grid,
  Typography,
  Paper,
  IconButton,
  Alert,
  CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

const ShipmentEntryForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [clients, setClients] = useState([]);
  const [zones, setZones] = useState([]);
  const [validPincodes, setValidPincodes] = useState([]);
  const [cftMultiplier, setCftMultiplier] = useState(1);
  const [odaStatus, setOdaStatus] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    vendor_id: '',
    client_id: '',
    zone_id: '',
    wfl_number: '',
    vendor_name: '',
    vendor_awb_number: '',
    mode: '',
    invoice_number: '',
    invoice_value: '',
    consignor_from_location: '',
    consignee: '',
    destination: '',
    pin_code: '',
    total_box: 0,
    actual_weight: 0,
    shipment_date: new Date().toISOString().split('T')[0],
  });

  const [boxes, setBoxes] = useState([
    {
      number_of_pieces: 1,
      length_cm: 0,
      breadth_cm: 0,
      height_cm: 0,
      actual_weight_per_piece: 0,
      volumetric_weight_per_piece: 0,
      total_volumetric_weight: 0
    }
  ]);

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [vendorsRes, clientsRes, zonesRes] = await Promise.all([
          fetch('http://localhost:4000/api/vendors'),
          fetch('http://localhost:4000/api/clients'),
          fetch('http://localhost:4000/api/zones')
        ]);

        const [vendorsData, clientsData, zonesData] = await Promise.all([
          vendorsRes.json(),
          clientsRes.json(),
          zonesRes.json()
        ]);

        setVendors(vendorsData);
        setClients(clientsData);
        setZones(zonesData);
      } catch (error) {
        setError('Error loading initial data');
        console.error('Error:', error);
      }
    };

    fetchInitialData();
  }, []);

  // Fetch vendor pincodes when vendor changes
  useEffect(() => {
    const fetchVendorPincodes = async () => {
      if (!formData.vendor_id) return;
      
      try {
        const response = await fetch(`http://localhost:4000/api/vendor-pincodes/${formData.vendor_id}`);
        const data = await response.json();
        setValidPincodes(data);
      } catch (error) {
        setError('Error fetching vendor pincodes');
        console.error('Error:', error);
      }
    };

    fetchVendorPincodes();
  }, [formData.vendor_id]);

  // Fetch client CFT multiplier when client changes
  useEffect(() => {
    const fetchClientCftMultiplier = async () => {
      if (!formData.client_id) return;
      
      try {
        const response = await fetch(`http://localhost:4000/api/clients/${formData.client_id}/cft-multiplier`);
        const data = await response.json();
        setCftMultiplier(data.cft_multiplier);
        // Recalculate box weights with new multiplier
        recalculateBoxWeights();
      } catch (error) {
        setError('Error fetching client CFT multiplier');
        console.error('Error:', error);
      }
    };

    fetchClientCftMultiplier();
  }, [formData.client_id]);

  // Validate pincode and get ODA status
  const validatePincode = async (pincode) => {
    if (!formData.vendor_id || !pincode) return;
    
    try {
      const response = await fetch(
        `http://localhost:4000/api/validate-pincode/${formData.vendor_id}/${pincode}`
      );
      
      if (!response.ok) {
        setOdaStatus(null);
        setError('Invalid pincode for this vendor');
        return;
      }

      const data = await response.json();
      setOdaStatus(data.oda);
      setError(null);
    } catch (error) {
      setOdaStatus(null);
      setError('Error validating pincode');
      console.error('Error:', error);
    }
  };

  // Calculate volumetric weight for a box
  const calculateVolumetricWeight = (length, breadth, height) => {
    return (length * breadth * height / 27000) * cftMultiplier;
  };

  // Recalculate weights for all boxes
  const recalculateBoxWeights = () => {
    const updatedBoxes = boxes.map(box => {
      const volumetricWeight = calculateVolumetricWeight(
        box.length_cm,
        box.breadth_cm,
        box.height_cm
      );
      return {
        ...box,
        volumetric_weight_per_piece: volumetricWeight,
        total_volumetric_weight: volumetricWeight * box.number_of_pieces
      };
    });
    setBoxes(updatedBoxes);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // If pincode changes, validate it
    if (name === 'pin_code') {
      validatePincode(value);
    }

    // If vendor changes, update vendor name
    if (name === 'vendor_id') {
      const selectedVendor = vendors.find(v => v.id === value);
      setFormData(prev => ({
        ...prev,
        vendor_name: selectedVendor ? selectedVendor.name : ''
      }));
    }
  };

  // Handle box input changes
  const handleBoxChange = (index, field, value) => {
    const updatedBoxes = [...boxes];
    updatedBoxes[index] = {
      ...updatedBoxes[index],
      [field]: value
    };

    // Recalculate weights if dimensions or pieces change
    if (['length_cm', 'breadth_cm', 'height_cm', 'number_of_pieces'].includes(field)) {
      const { length_cm, breadth_cm, height_cm, number_of_pieces } = updatedBoxes[index];
      const volumetricWeight = calculateVolumetricWeight(length_cm, breadth_cm, height_cm);
      updatedBoxes[index] = {
        ...updatedBoxes[index],
        volumetric_weight_per_piece: volumetricWeight,
        total_volumetric_weight: volumetricWeight * number_of_pieces
      };
    }

    setBoxes(updatedBoxes);
    setFormData(prev => ({
      ...prev,
      total_box: updatedBoxes.length
    }));
  };

  // Add new box
  const addBox = () => {
    setBoxes([...boxes, {
      number_of_pieces: 1,
      length_cm: 0,
      breadth_cm: 0,
      height_cm: 0,
      actual_weight_per_piece: 0,
      volumetric_weight_per_piece: 0,
      total_volumetric_weight: 0
    }]);
  };

  // Remove box
  const removeBox = (index) => {
    const updatedBoxes = boxes.filter((_, i) => i !== index);
    setBoxes(updatedBoxes);
    setFormData(prev => ({
      ...prev,
      total_box: updatedBoxes.length
    }));
  };

  // Calculate total actual weight
  const calculateTotalActualWeight = () => {
    return boxes.reduce((sum, box) => sum + (box.actual_weight_per_piece * box.number_of_pieces), 0);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Calculate total actual weight
      const totalActualWeight = calculateTotalActualWeight();

      const response = await fetch('http://localhost:4000/api/shipments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          actual_weight: totalActualWeight,
          boxes: boxes.map(box => ({
            number_of_pieces: box.number_of_pieces,
            length_cm: box.length_cm,
            breadth_cm: box.breadth_cm,
            height_cm: box.height_cm,
            actual_weight_per_piece: box.actual_weight_per_piece
          }))
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error saving shipment');
      }

      const result = await response.json();
      // Show success message or redirect
      navigate('/shipments'); // Redirect to shipments list
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, m: 2 }}>
      <Typography variant="h5" gutterBottom>
        New Shipment Entry
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Vendor Selection */}
          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              label="Vendor"
              name="vendor_id"
              value={formData.vendor_id}
              onChange={handleInputChange}
              required
            >
              {vendors.map((vendor) => (
                <MenuItem key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Client Selection */}
          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              label="Client"
              name="client_id"
              value={formData.client_id}
              onChange={handleInputChange}
              required
            >
              {clients.map((client) => (
                <MenuItem key={client.id} value={client.id}>
                  {client.client_name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Zone Selection */}
          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              label="Zone"
              name="zone_id"
              value={formData.zone_id}
              onChange={handleInputChange}
              required
            >
              {zones.map((zone) => (
                <MenuItem key={zone.id} value={zone.id}>
                  {zone.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* WFL Number */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="WFL Number"
              name="wfl_number"
              value={formData.wfl_number}
              onChange={handleInputChange}
              required
            />
          </Grid>

          {/* Vendor AWB Number */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Vendor AWB Number"
              name="vendor_awb_number"
              value={formData.vendor_awb_number}
              onChange={handleInputChange}
              required
            />
          </Grid>

          {/* Mode */}
          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              label="Mode"
              name="mode"
              value={formData.mode}
              onChange={handleInputChange}
              required
            >
              <MenuItem value="Air">Air</MenuItem>
              <MenuItem value="Surface">Surface</MenuItem>
              <MenuItem value="Express">Express</MenuItem>
            </TextField>
          </Grid>

          {/* Invoice Details */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Invoice Number"
              name="invoice_number"
              value={formData.invoice_number}
              onChange={handleInputChange}
              required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Invoice Value"
              name="invoice_value"
              type="number"
              value={formData.invoice_value}
              onChange={handleInputChange}
              required
            />
          </Grid>

          {/* Location Details */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Consignor From Location"
              name="consignor_from_location"
              value={formData.consignor_from_location}
              onChange={handleInputChange}
              required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Consignee"
              name="consignee"
              value={formData.consignee}
              onChange={handleInputChange}
              required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Destination"
              name="destination"
              value={formData.destination}
              onChange={handleInputChange}
              required
            />
          </Grid>

          {/* Pincode with ODA Status */}
          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              label="Pincode"
              name="pin_code"
              value={formData.pin_code}
              onChange={handleInputChange}
              required
              error={formData.pin_code && !odaStatus}
              helperText={odaStatus ? `ODA: ${odaStatus}` : 'Select a valid pincode'}
            >
              {validPincodes.map((pincode) => (
                <MenuItem key={pincode.pincode} value={pincode.pincode}>
                  {pincode.pincode}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Shipment Date */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Shipment Date"
              name="shipment_date"
              type="date"
              value={formData.shipment_date}
              onChange={handleInputChange}
              required
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* Boxes Section */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Boxes
            </Typography>
            {boxes.map((box, index) => (
              <Paper key={index} elevation={1} sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12}>
                    <Typography variant="subtitle1">
                      Box {index + 1}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={2}>
                    <TextField
                      fullWidth
                      label="Number of Pieces"
                      type="number"
                      value={box.number_of_pieces}
                      onChange={(e) => handleBoxChange(index, 'number_of_pieces', Number(e.target.value))}
                      required
                      inputProps={{ min: 1 }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={2}>
                    <TextField
                      fullWidth
                      label="Length (cm)"
                      type="number"
                      value={box.length_cm}
                      onChange={(e) => handleBoxChange(index, 'length_cm', Number(e.target.value))}
                      required
                      inputProps={{ min: 0, step: 0.01 }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={2}>
                    <TextField
                      fullWidth
                      label="Breadth (cm)"
                      type="number"
                      value={box.breadth_cm}
                      onChange={(e) => handleBoxChange(index, 'breadth_cm', Number(e.target.value))}
                      required
                      inputProps={{ min: 0, step: 0.01 }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={2}>
                    <TextField
                      fullWidth
                      label="Height (cm)"
                      type="number"
                      value={box.height_cm}
                      onChange={(e) => handleBoxChange(index, 'height_cm', Number(e.target.value))}
                      required
                      inputProps={{ min: 0, step: 0.01 }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={2}>
                    <TextField
                      fullWidth
                      label="Weight per Piece (kg)"
                      type="number"
                      value={box.actual_weight_per_piece}
                      onChange={(e) => handleBoxChange(index, 'actual_weight_per_piece', Number(e.target.value))}
                      required
                      inputProps={{ min: 0, step: 0.01 }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={2}>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="caption" color="textSecondary">
                        Volumetric Weight per Piece
                      </Typography>
                      <Typography variant="body2">
                        {box.volumetric_weight_per_piece.toFixed(2)} kg
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Total Volumetric Weight
                      </Typography>
                      <Typography variant="body2">
                        {box.total_volumetric_weight.toFixed(2)} kg
                      </Typography>
                    </Box>
                  </Grid>

                  {boxes.length > 1 && (
                    <Grid item xs={12} sm={6} md={1}>
                      <IconButton
                        color="error"
                        onClick={() => removeBox(index)}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            ))}

            <Button
              startIcon={<AddIcon />}
              onClick={addBox}
              variant="outlined"
              sx={{ mt: 2 }}
            >
              Add Box
            </Button>
          </Grid>

          {/* Submit Button */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/shipments')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                Save Entry
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

export default ShipmentEntryForm; 