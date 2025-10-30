
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Stethoscope, Search, DollarSign, Calendar as CalendarIcon, CheckCircle, UserPlus, Trash2, Edit, Info, FileText } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const PhysioManagement = () => {
  const [physios, setPhysios] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [filteredPhysios, setFilteredPhysios] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [viewingPhysio, setViewingPhysio] = useState(null);
  const [editingPhysio, setEditingPhysio] = useState(null);

  const initialFormState = {
    name: '',
    age: '',
    experience: '',
    qualifications: '',
    specialization: '',
    pan: '',
    aadhar: '',
    salary: '',
    probationPeriod: '',
    nextIncrementDate: null,
    petrolAllowancePerKm: '',
    contact: '',
    vehicleMaintenanceCharge: '',
    incentive: '',
    active: true,
  };
  const [physioForm, setPhysioForm] = useState(initialFormState);

  useEffect(() => {
    Promise.all([
      fetch('/mockdata/physios.json').then(res => res.json()),
      fetch('/mockdata/sessions.json').then(res => res.json())
    ]).then(([physiosData, sessionsData]) => {
      setPhysios(physiosData);
      setSessions(sessionsData);
      setFilteredPhysios(physiosData);
    }).catch(err => console.error('Error loading data:', err));
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = physios.filter(physio =>
        physio.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        physio.specialization.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPhysios(filtered);
    } else {
      setFilteredPhysios(physios);
    }
  }, [physios, searchTerm]);

  const getPhysioStats = (physioId) => {
    const physioSessions = sessions.filter(s => s.physioId === physioId);
    const completedSessions = physioSessions.filter(s => s.status === 'completed');
    const physio = physios.find(p => p.id === physioId);
    const monthlyRevenue = completedSessions.length * (physio?.ratePerSession || 0);

    return {
      totalSessions: physioSessions.length,
      completedSessions: completedSessions.length,
      monthlyRevenue
    };
  };

  const handleToggleStatus = (physioId) => {
    setPhysios(prev => prev.map(physio =>
      physio.id === physioId ? { ...physio, active: !physio.active } : physio
    ));
    toast({ title: "Status Updated", description: "Physiotherapist status has been updated" });
  };
  
  const handleDateChange = (date) => {
    setPhysioForm(prev => ({ ...prev, nextIncrementDate: date }));
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setPhysioForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (editingPhysio) {
      setPhysios(prev => prev.map(p => p.id === editingPhysio.id ? { ...p, ...physioForm } : p));
      toast({ title: "Success", description: "Physiotherapist updated successfully." });
    } else {
      const newPhysio = {
        id: Date.now(),
        ...physioForm,
        role: 'physio',
        salary: parseFloat(physioForm.salary),
        petrolAllowancePerKm: parseFloat(physioForm.petrolAllowancePerKm),
        vehicleMaintenanceCharge: parseFloat(physioForm.vehicleMaintenanceCharge),
        incentive: parseFloat(physioForm.incentive),
      };
      setPhysios(prev => [newPhysio, ...prev]);
      toast({ title: "Success", description: "New physiotherapist added." });
    }
    setIsFormOpen(false);
    setEditingPhysio(null);
    setPhysioForm(initialFormState);
  };

  const handleEditPhysio = (physio) => {
    setEditingPhysio(physio);
    const formData = { ...initialFormState, ...physio };
    if(physio.nextIncrementDate) formData.nextIncrementDate = new Date(physio.nextIncrementDate);
    setPhysioForm(formData);
    setIsFormOpen(true);
  };

  const handleDeletePhysio = (physioId) => {
    setPhysios(prev => prev.filter(p => p.id !== physioId));
    toast({ title: "Deleted", description: "Physiotherapist has been removed.", variant: "destructive" });
  };

  const openNewPhysioDialog = () => {
    setEditingPhysio(null);
    setPhysioForm(initialFormState);
    setIsFormOpen(true);
  };

  const handleViewDetails = (physio) => {
    setViewingPhysio(physio);
    setIsDetailsOpen(true);
  }

  const renderDetailRow = (label, value, isDate = false) => (
    <div className="grid grid-cols-2 py-2 border-b">
        <p className="font-semibold text-gray-600">{label}</p>
        <p className="text-gray-800">{value ? (isDate ? format(new Date(value), 'PPP') : value) : 'N/A'}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Physiotherapist Management</h1>
          <p className="text-gray-600">Manage physiotherapists and track their performance</p>
        </div>
        <Button onClick={openNewPhysioDialog}><UserPlus className="mr-2 h-4 w-4" /> Add New Physio</Button>
      </motion.div>

      <Card className="medical-card">
        <CardHeader><CardTitle>Search Physiotherapists</CardTitle><CardDescription>Find physiotherapists by name or specialization</CardDescription></CardHeader>
        <CardContent><div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" /><Input placeholder="Search by name or specialization..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10"/></div></CardContent>
      </Card>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
        <Card className="medical-card">
          <CardHeader><CardTitle>Physiotherapists ({filteredPhysios.length})</CardTitle><CardDescription>All physiotherapists in the system</CardDescription></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPhysios.map((physio) => {
                const stats = getPhysioStats(physio.id);
                return (
                  <motion.div key={physio.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="border rounded-lg p-6 hover:shadow-md transition-shadow flex flex-col">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${physio.active ? 'bg-green-100' : 'bg-gray-100'}`}><Stethoscope className={`${physio.active ? 'text-green-600' : 'text-gray-400'}`} size={20} /></div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{physio.name}</h3>
                        <p className="text-sm text-gray-600">{physio.specialization}</p>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${physio.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>{physio.active ? 'Active' : 'Inactive'}</span>
                      </div>
                    </div>
                    <div className="space-y-3 mb-4 flex-grow">
                      <div className="flex items-center justify-between"><span className="text-sm text-gray-600">Experience:</span><span className="text-sm font-medium">{physio.experience}</span></div>
                      <div className="flex items-center justify-between"><span className="text-sm text-gray-600">Contact:</span><span className="text-sm font-medium">{physio.contact}</span></div>
                    </div>
                    <div className="border-t pt-4 mb-4">
                      <h4 className="font-medium text-gray-800 mb-2">Performance Stats</h4>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div><div className="flex items-center justify-center mb-1"><CalendarIcon className="text-blue-600" size={16} /></div><p className="text-xs text-gray-600">Sessions</p><p className="font-semibold">{stats.totalSessions}</p></div>
                        <div><div className="flex items-center justify-center mb-1"><CheckCircle className="text-green-600" size={16} /></div><p className="text-xs text-gray-600">Completed</p><p className="font-semibold">{stats.completedSessions}</p></div>
                        <div><div className="flex items-center justify-center mb-1"><DollarSign className="text-emerald-600" size={16} /></div><p className="text-xs text-gray-600">Revenue</p><p className="font-semibold">₹{stats.monthlyRevenue.toLocaleString()}</p></div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                       <Button size="sm" variant="outline" onClick={() => handleViewDetails(physio)} className="flex-1"><Info size={14} className="mr-1" /> Details</Button>
                       <Button size="sm" variant="outline" onClick={() => handleEditPhysio(physio)} className="flex-1"><Edit size={14} className="mr-1" /> Edit</Button>
                    </div>
                    <div className="flex space-x-2 mt-2">
                       <Button size="sm" variant={physio.active ? "secondary" : "default"} onClick={() => handleToggleStatus(physio.id)} className="flex-1">{physio.active ? 'Deactivate' : 'Activate'}</Button>
                       <AlertDialog>
                        <AlertDialogTrigger asChild><Button size="sm" variant="destructive" className="flex-1"><Trash2 size={14} className="mr-1" /> Delete</Button></AlertDialogTrigger>
                        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the physiotherapist.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeletePhysio(physio.id)}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
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
                <div className="space-y-2"><Label>Name</Label><Input name="name" value={physioForm.name} onChange={handleFormChange} required /></div>
                <div className="space-y-2"><Label>Age</Label><Input name="age" type="number" value={physioForm.age} onChange={handleFormChange} required /></div>
                <div className="space-y-2"><Label>Contact No</Label><Input name="contact" value={physioForm.contact} onChange={handleFormChange} required /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Specialization</Label><Input name="specialization" value={physioForm.specialization} onChange={handleFormChange} required /></div>
                <div className="space-y-2"><Label>Qualifications</Label><Input name="qualifications" value={physioForm.qualifications} onChange={handleFormChange} required /></div>
                <div className="space-y-2"><Label>Experience</Label><Input name="experience" value={physioForm.experience} onChange={handleFormChange} required /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2"><Label>PAN</Label><Input name="pan" value={physioForm.pan} onChange={handleFormChange} /></div>
                <div className="space-y-2"><Label>Aadhar</Label><Input name="aadhar" value={physioForm.aadhar} onChange={handleFormChange} /></div>
              </div>
              <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Salary (₹)</Label><Input name="salary" type="number" value={physioForm.salary} onChange={handleFormChange} required /></div>
                <div className="space-y-2"><Label>Probation Period (months)</Label><Input name="probationPeriod" type="number" value={physioForm.probationPeriod} onChange={handleFormChange} /></div>
                <div className="space-y-2"><Label>Next Increment Date</Label><Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !physioForm.nextIncrementDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{physioForm.nextIncrementDate ? format(physioForm.nextIncrementDate, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={physioForm.nextIncrementDate} onSelect={handleDateChange} initialFocus /></PopoverContent></Popover></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Petrol Allowance (₹/km)</Label><Input name="petrolAllowancePerKm" type="number" step="0.01" value={physioForm.petrolAllowancePerKm} onChange={handleFormChange} /></div>
                <div className="space-y-2"><Label>Vehicle Maintenance (₹)</Label><Input name="vehicleMaintenanceCharge" type="number" step="0.01" value={physioForm.vehicleMaintenanceCharge} onChange={handleFormChange} /></div>
                <div className="space-y-2"><Label>Incentive (%)</Label><Input name="incentive" type="number" step="0.01" value={physioForm.incentive} onChange={handleFormChange} /></div>
              </div>
              <DialogFooter className="pt-4"><Button type="button" variant="secondary" onClick={() => setIsFormOpen(false)}>Cancel</Button><Button type="submit">{editingPhysio ? 'Save Changes' : 'Create Physio'}</Button></DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-2xl">
              <DialogHeader>
                  <DialogTitle className="flex items-center gap-2"><FileText /> Physiotherapist Details</DialogTitle>
                  <DialogDescription>Full profile for {viewingPhysio?.name}.</DialogDescription>
              </DialogHeader>
              {viewingPhysio && (
                  <div className="mt-4 space-y-2">
                    {renderDetailRow("Name", viewingPhysio.name)}
                    {renderDetailRow("Age", viewingPhysio.age)}
                    {renderDetailRow("Contact", viewingPhysio.contact)}
                    {renderDetailRow("Specialization", viewingPhysio.specialization)}
                    {renderDetailRow("Qualifications", viewingPhysio.qualifications)}
                    {renderDetailRow("Experience", viewingPhysio.experience)}
                    {renderDetailRow("PAN", viewingPhysio.pan)}
                    {renderDetailRow("Aadhar", viewingPhysio.aadhar)}
                    {renderDetailRow("Salary", `₹${viewingPhysio.salary?.toLocaleString()}`)}
                    {renderDetailRow("Probation Period", `${viewingPhysio.probationPeriod} months`)}
                    {renderDetailRow("Next Increment Date", viewingPhysio.nextIncrementDate, true)}
                    {renderDetailRow("Petrol Allowance", `₹${viewingPhysio.petrolAllowancePerKm}/km`)}
                    {renderDetailRow("Vehicle Maintenance", `₹${viewingPhysio.vehicleMaintenanceCharge?.toLocaleString()}`)}
                    {renderDetailRow("Incentive", `${viewingPhysio.incentive}%`)}
                    {renderDetailRow("Status", viewingPhysio.active ? 'Active' : 'Inactive')}
                  </div>
              )}
               <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>Close</Button>
               </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
};

export default PhysioManagement;
