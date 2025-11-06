
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Stethoscope, Search, DollarSign, Calendar as CalendarIcon, CheckCircle, UserPlus, Trash2, Edit, Info, FileText } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { apiRequest } from '@/components/CustomComponents/apiRequest';




const PhysioManagement = () => {
  const [physios, setPhysios] = useState([]);
  const [filteredPhysios, setFilteredPhysios] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [viewingPhysio, setViewingPhysio] = useState(null);
  const [editingPhysio, setEditingPhysio] = useState(null);
  const [gender, setGender] = useState([]);

  const initialFormState = {
    _id: '',
    physioName: '',
    physioGenderId: '',
    genderName: '',
    physioAge: '',
    physioExp: '',
    physioQulifi: '',
    physioSpcl: '',
    physioPAN: '',
    physioAadhar: '',
    physioSalary: '',
    physioProbation: '',
    physioINCRDate: null,
    physioPetrolAlw: '',
    physioContactNo: '',
    physioVehicleMTC: '',
    physioIncentive: '',
    isActive: true,
  };
  const [physioForm, setPhysioForm] = useState(initialFormState);
  // ✅ Load Genders on Mount
  useEffect(() => {
    getGender();
    getPhysio();
  }, []);

  const getGender = async () => {
    try {
      const res = await apiRequest('Gender/getAllGender', { method: 'POST', body: JSON.stringify({}) });
      setGender(res || []);
    } catch (error) {
      console.error('Error loading Gender:', error);
    }
  };

  // ✅ Fetch All Physios
  const getPhysio = async () => {
    try {
      const response = await apiRequest('Physio/getAllPhysio', { method: 'POST', body: JSON.stringify({}) });
      setPhysios(response.physios || []);
      setFilteredPhysios(response.physios || []);
    } catch (error) {
      console.error('Error loading physios:', error);
    }
  };

  // ✅ Create Physio
  const createPhysio = async (data) => {
    try {
      await apiRequest('Physio/createPhysio', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      toast({ title: 'Success', description: 'Physio created successfully.' });
      getPhysio();
      setIsFormOpen(false);
    } catch (error) {
      console.error('Error creating physio:', error);
    }
  };

  // ✅ Update Physio
  const updatePhysio = async (data) => {
    try {
      await apiRequest('Physio/updatePhysio', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      toast({ title: 'Updated', description: 'Physio updated successfully.' });
      getPhysio();
      setIsFormOpen(false);
    } catch (error) {
      console.error('Error updating physio:', error);
    }
  };

  // ✅ Delete Physio
  const deletePhysio = async (id) => {
    try {
      await apiRequest('Physio/deletePhysio', {
        method: 'POST',
        body: JSON.stringify({ _id: id }),
      });
      toast({ title: 'Deleted', description: 'Physio deleted successfully.', variant: 'destructive' });
      getPhysio();
    } catch (error) {
      console.error('Error deleting physio:', error);
    }
  };

  // ✅ Search filter
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredPhysios(physios);
    } else {
      const filtered = physios.filter((p) =>
        p.physioName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.physioSpcl.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPhysios(filtered);
    }
  }, [searchTerm, physios]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setPhysioForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date) => {
    setPhysioForm((prev) => ({ ...prev, physioINCRDate: date }));
  };

  const handleSelectChange = (field, value) => {
    setPhysioForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (editingPhysio) {
      // updatePhysio({ ...physioForm, _id: editingPhysio._id });
      updatePhysio(physioForm)
    } else {
      createPhysio(physioForm);
    }
  };

  const handleEdit = (physio) => {
    setEditingPhysio(true);
    setPhysioForm({
      _id : physio._id,
      physioName: physio.physioName,
      physioGenderId: physio.physioGenderId._id,
      genderName: physio.physioGenderId.genderName,
      physioAge: physio.physioAge,
      physioExp: physio.physioExp,
      physioQulifi: physio.physioQulifi,
      physioSpcl: physio.physioSpcl,
      physioPAN: physio.physioPAN,
      physioAadhar: physio.physioAadhar,
      physioSalary: physio.physioSalary,
      physioProbation: physio.physioProbation,
      physioINCRDate: new Date(physio.physioINCRDate),
      physioPetrolAlw: physio.physioPetrolAlw,
      physioContactNo: physio.physioContactNo,
      physioVehicleMTC: physio.physioVehicleMTC,
      physioIncentive: physio.physioIncentive,
      isActive: physio.isActive
    });
    setIsFormOpen(true);
  };

  const handleViewDetails = (physio) => {
    setViewingPhysio(physio);
    setIsDetailsOpen(true);
  };

 const handleToggleStatus = async (physio) => {
  try {
    const newStatus = !physio.isActive;
   console.log(newStatus,"isACtive")
    // Confirm action
    const confirmAction = window.confirm(
      `Are you sure you want to ${newStatus ? 'activate' : 'deactivate'} ${physio.physioName}?`
    );
    if (!confirmAction) return;

    // Call backend API to toggle status
    const res = await apiRequest('Physio/updatePhysio', {
      method: 'POST',
      body: JSON.stringify({
        _id: physio._id,
        isActive: newStatus,
      }),
    });
    

    if (res) {
      toast({
        title: 'Status Updated',
        description: `${physio.physioName} is now ${newStatus ? 'Active' : 'Inactive'}.`,
      })
 
      
      // Update UI instantly
      setPhysios((prev) =>
        prev.map((p) =>
          p._id === physio._id ? { ...p, isActive: newStatus } : p
        )
      );

     
    }
  } catch (error) {
    console.error('Error toggling status:', error);
    toast({
      title: 'Error',
      description: 'Failed to update physiotherapist status.',
      variant: 'destructive',
    });
  }
};
  const renderDetailRow = (label, value, isDate = false) => (
    <div className="grid grid-cols-2 py-2 border-b">
      <p className="font-semibold text-gray-600">{label}</p>
      <p className="text-gray-800">
        {value ? (isDate ? format(new Date(value), 'PPP') : value) : 'N/A'}
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Physiotherapist Management</h1>
          <p className="text-gray-600">Manage physiotherapists and track their performance</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}><UserPlus className="mr-2 h-4 w-4" /> Add New Physio</Button>
      </motion.div>

      <Card className="medical-card">
        <CardHeader><CardTitle>Search Physiotherapists</CardTitle><CardDescription>Find physiotherapists by name or specialization</CardDescription></CardHeader>
        <CardContent><div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" /><Input placeholder="Search by name or specialization..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" /></div></CardContent>
      </Card>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
        <Card className="medical-card">
          <CardHeader><CardTitle>Physiotherapists ({filteredPhysios.length})</CardTitle><CardDescription>All physiotherapists in the system</CardDescription></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPhysios.map((physio) => {
                // const stats = getPhysioStats(physio._id);
                return (
                  <motion.div key={physio.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="border rounded-lg p-6 hover:shadow-md transition-shadow flex flex-col">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${physio.isActive ? 'bg-green-100' : 'bg-gray-100'}`}><Stethoscope className={`${physio.isActive ? 'text-green-600' : 'text-gray-400'}`} size={20} /></div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{physio.physioName}</h3>
                        <p className="text-sm text-gray-600">{physio.physioSpcl}</p>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${physio.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>{physio.isActive ? 'Active' : 'Inactive'}</span>
                      </div>
                    </div>
                    <div className="space-y-3 mb-4 flex-grow">
                      <div className="flex items-center justify-between"><span className="text-sm text-gray-600">Experience:</span><span className="text-sm font-medium">{physio.physioExp}</span></div>
                      <div className="flex items-center justify-between"><span className="text-sm text-gray-600">Contact:</span><span className="text-sm font-medium">{physio.physioContactNo}</span></div>
                    </div>
                    <div className="border-t pt-4 mb-4">
                      <h4 className="font-medium text-gray-800 mb-2">Performance Stats</h4>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        {/* <div><div className="flex items-center justify-center mb-1"><CalendarIcon className="text-blue-600" size={16} /></div><p className="text-xs text-gray-600">Sessions</p><p className="font-semibold">{stats.totalSessions}</p></div>
                        <div><div className="flex items-center justify-center mb-1"><CheckCircle className="text-green-600" size={16} /></div><p className="text-xs text-gray-600">Completed</p><p className="font-semibold">{stats.completedSessions}</p></div>
                        <div><div className="flex items-center justify-center mb-1"><DollarSign className="text-emerald-600" size={16} /></div><p className="text-xs text-gray-600">Revenue</p><p className="font-semibold">₹{stats.monthlyRevenue.toLocaleString()}</p></div> */}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleViewDetails(physio)} className="flex-1"><Info size={14} className="mr-1" /> Details</Button>
                      <Button size="sm" variant="outline" onClick={() => handleEdit(physio)} className="flex-1"><Edit size={14} className="mr-1" /> Edit</Button>
                    </div>
                    <div className="flex space-x-2 mt-2">
                      <Button size="sm" variant={physio.isActive ? "secondary" : "default"} onClick={() => handleToggleStatus(physio)} className="flex-1">{physio.isActive ? 'Deactivate' : 'Activate'}</Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button size="sm" variant="destructive" className="flex-1"><Trash2 size={14} className="mr-1" /> Delete</Button></AlertDialogTrigger>
                        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the physiotherapist.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deletePhysio(physio._id)}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-3xl max-h-[95vh] flex flex-col">
          <DialogHeader><DialogTitle>{editingPhysio ? 'Edit Physiotherapist' : 'Add New Physiotherapist'}</DialogTitle><DialogDescription>{editingPhysio ? 'Update the details below.' : 'Fill in the details to add a new physio.'}</DialogDescription></DialogHeader>
          <div className="flex-1 overflow-y-auto pr-6 -mr-6">
            <form onSubmit={handleFormSubmit} className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Name</Label><Input name="physioName" value={physioForm.physioName} onChange={handleFormChange} required /></div>
                <div className="space-y-2"><Label>Age</Label><Input name="physioAge" type="number" value={physioForm.physioAge} onChange={handleFormChange} required /></div>
                <div>
                  <Label>Gender</Label>
                  <Select value={physioForm.physioGenderId} onValueChange={(v) => handleSelectChange('physioGenderId', v)}>
                    <SelectTrigger><SelectValue placeholder="Select Gender" /></SelectTrigger>
                    <SelectContent>
                      {gender.map((g) => (
                        <SelectItem key={g.GenderIDPK} value={g.GenderIDPK}>{g.genderName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Contact No</Label><Input name="physioContactNo" value={physioForm.physioContactNo} onChange={handleFormChange} required /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Specialization</Label><Input name="physioSpcl" value={physioForm.physioSpcl} onChange={handleFormChange} required /></div>
                <div className="space-y-2"><Label>Qualifications</Label><Input name="physioQulifi" value={physioForm.physioQulifi} onChange={handleFormChange} required /></div>
                <div className="space-y-2"><Label>Experience</Label><Input name="physioExp" value={physioForm.physioExp} onChange={handleFormChange} required /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2"><Label>PAN</Label><Input name="physioPAN" value={physioForm.physioPAN} onChange={handleFormChange} /></div>
                <div className="space-y-2"><Label>Aadhar</Label><Input name="physioAadhar" value={physioForm.physioAadhar} onChange={handleFormChange} /></div>
              </div>
              <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Salary (₹)</Label><Input name="physioSalary" type="number" value={physioForm.physioSalary} onChange={handleFormChange} required /></div>
                <div className="space-y-2"><Label>Probation Period (months)</Label><Input name="physioProbation" type="number" value={physioForm.physioProbation} onChange={handleFormChange} /></div>
                <div className="space-y-2"><Label>Next Increment Date</Label><Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !physioForm.physioINCRDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{physioForm.physioINCRDate ? format(physioForm.physioINCRDate, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={physioForm.physioINCRDate} onSelect={handleDateChange} initialFocus /></PopoverContent></Popover></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Petrol Allowance (₹/km)</Label><Input name="physioPetrolAlw" type="number" step="0.01" value={physioForm.physioPetrolAlw} onChange={handleFormChange} /></div>
                <div className="space-y-2"><Label>Vehicle Maintenance (₹)</Label><Input name="physioVehicleMTC" type="number" step="0.01" value={physioForm.physioVehicleMTC} onChange={handleFormChange} /></div>
                <div className="space-y-2"><Label>Incentive (%)</Label><Input name="physioIncentive" type="number" step="0.01" value={physioForm.physioIncentive} onChange={handleFormChange} /></div>
              </div>
              <DialogFooter className="pt-4"><Button type="button" variant="secondary" onClick={() => setIsFormOpen(false)}>Cancel</Button><Button type="submit">{editingPhysio ? 'Save Changes' : 'Create Physio'}</Button></DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>
  


<Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
  <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
    {/* Fixed header without border */}
    <DialogHeader className="sticky top-0 z-10 pb-2">
      <DialogTitle className="flex items-center gap-2">
        <FileText /> Physiotherapist Details
      </DialogTitle>
      <DialogDescription>
        Full profile for {viewingPhysio?.physioName}.
      </DialogDescription>
    </DialogHeader>

    {/* Scrollable section (includes all details + footer) */}
    <div className="overflow-y-auto max-h-[70vh] mt-2 pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
      {viewingPhysio && (
        <div className="space-y-2">
          {renderDetailRow("Name", viewingPhysio.physioName)}
          {renderDetailRow("Age", viewingPhysio.physioAge)}
          {renderDetailRow("Contact", viewingPhysio.physioContactNo)}
          {renderDetailRow("Specialization", viewingPhysio.physioSpcl)}
          {renderDetailRow("Qualifications", viewingPhysio.physioQulifi)}
          {renderDetailRow("Experience", viewingPhysio.physioExp)}
          {renderDetailRow("PAN", viewingPhysio.physioPAN)}
          {renderDetailRow("Aadhar", viewingPhysio.physioAadhar)}
          {renderDetailRow("Salary", `₹${viewingPhysio.physioSalary?.toLocaleString()}`)}
          {renderDetailRow("Probation Period", `${viewingPhysio.physioProbation} months`)}
          {renderDetailRow("Next Increment Date", viewingPhysio.physioINCRDate, true)}
          {renderDetailRow("Petrol Allowance", `₹${viewingPhysio.physioPetrolAlw}/km`)}
          {renderDetailRow("Vehicle Maintenance", `₹${viewingPhysio.physioVehicleMTC?.toLocaleString()}`)}
          {renderDetailRow("Incentive", `${viewingPhysio.physioIncentive}%`)}
          {renderDetailRow("Status", viewingPhysio.isActive ? "Active" : "Inactive")}
        </div>
      )}

{/*        
      <DialogFooter className="mt-4">
        <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
          Close
        </Button>
      </DialogFooter> */}
    </div>
  </DialogContent>
</Dialog>



    </div>
  );
};

export default PhysioManagement;























