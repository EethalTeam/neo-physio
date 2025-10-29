import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Stethoscope, Search, DollarSign, Calendar, CheckCircle, UserPlus, Trash2, Edit } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const PhysioManagement = () => {
  const [physios, setPhysios] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [filteredPhysios, setFilteredPhysios] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPhysio, setEditingPhysio] = useState(null);

  const initialFormState = {
    name: '',
    specialization: '',
    ratePerSession: '',
    experience: '',
    qualifications: '',
    contact: ''
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

    toast({
      title: "Status Updated",
      description: "Physiotherapist status has been updated"
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setPhysioForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (editingPhysio) {
      // Update existing physio
      setPhysios(prev => prev.map(p => p.id === editingPhysio.id ? { ...p, ...physioForm } : p));
      toast({ title: "Success", description: "Physiotherapist updated successfully." });
    } else {
      // Add new physio
      const newPhysio = {
        id: Date.now(),
        ...physioForm,
        ratePerSession: parseInt(physioForm.ratePerSession),
        active: true
      };
      setPhysios(prev => [newPhysio, ...prev]);
      toast({ title: "Success", description: "New physiotherapist added." });
    }
    setIsDialogOpen(false);
    setEditingPhysio(null);
    setPhysioForm(initialFormState);
  };

  const handleEditPhysio = (physio) => {
    setEditingPhysio(physio);
    setPhysioForm({
      name: physio.name,
      specialization: physio.specialization,
      ratePerSession: physio.ratePerSession,
      experience: physio.experience,
      qualifications: physio.qualifications,
      contact: physio.contact
    });
    setIsDialogOpen(true);
  };

  const handleDeletePhysio = (physioId) => {
    setPhysios(prev => prev.filter(p => p.id !== physioId));
    toast({
      title: "Deleted",
      description: "Physiotherapist has been removed.",
      variant: "destructive"
    });
  };

  const openNewPhysioDialog = () => {
    setEditingPhysio(null);
    setPhysioForm(initialFormState);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Physiotherapist Management</h1>
          <p className="text-gray-600">Manage physiotherapists and track their performance</p>
        </div>
        <Button onClick={openNewPhysioDialog}>
          <UserPlus className="mr-2 h-4 w-4" /> Add New Physio
        </Button>
      </motion.div>

      <Card className="medical-card">
        <CardHeader>
          <CardTitle>Search Physiotherapists</CardTitle>
          <CardDescription>Find physiotherapists by name or specialization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name or specialization..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="medical-card">
          <CardHeader>
            <CardTitle>Physiotherapists ({filteredPhysios.length})</CardTitle>
            <CardDescription>All physiotherapists in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPhysios.map((physio) => {
                const stats = getPhysioStats(physio.id);
                return (
                  <motion.div
                    key={physio.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="border rounded-lg p-6 hover:shadow-md transition-shadow flex flex-col"
                  >
                    <div className="flex items-center space-x-3 mb-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${physio.active ? 'bg-green-100' : 'bg-gray-100'}`}>
                        <Stethoscope className={`${physio.active ? 'text-green-600' : 'text-gray-400'}`} size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{physio.name}</h3>
                        <p className="text-sm text-gray-600">{physio.specialization}</p>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${physio.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                          {physio.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4 flex-grow">
                      <div className="flex items-center justify-between"><span className="text-sm text-gray-600">Experience:</span><span className="text-sm font-medium">{physio.experience}</span></div>
                      <div className="flex items-center justify-between"><span className="text-sm text-gray-600">Rate/Session:</span><span className="text-sm font-medium">₹{physio.ratePerSession}</span></div>
                      <div className="flex items-center justify-between"><span className="text-sm text-gray-600">Contact:</span><span className="text-sm font-medium">{physio.contact}</span></div>
                    </div>

                    <div className="border-t pt-4 mb-4">
                      <h4 className="font-medium text-gray-800 mb-2">Performance Stats</h4>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div><div className="flex items-center justify-center mb-1"><Calendar className="text-blue-600" size={16} /></div><p className="text-xs text-gray-600">Sessions</p><p className="font-semibold">{stats.totalSessions}</p></div>
                        <div><div className="flex items-center justify-center mb-1"><CheckCircle className="text-green-600" size={16} /></div><p className="text-xs text-gray-600">Completed</p><p className="font-semibold">{stats.completedSessions}</p></div>
                        <div><div className="flex items-center justify-center mb-1"><DollarSign className="text-emerald-600" size={16} /></div><p className="text-xs text-gray-600">Revenue</p><p className="font-semibold">₹{stats.monthlyRevenue.toLocaleString()}</p></div>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleEditPhysio(physio)} className="flex-1"><Edit size={14} className="mr-1" /> Edit</Button>
                      <Button size="sm" variant={physio.active ? "destructive" : "default"} onClick={() => handleToggleStatus(physio.id)} className="flex-1">{physio.active ? 'Deactivate' : 'Activate'}</Button>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive" className="w-full mt-2"><Trash2 size={14} className="mr-1" /> Delete</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the physiotherapist.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeletePhysio(physio.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingPhysio ? 'Edit Physiotherapist' : 'Add New Physiotherapist'}</DialogTitle>
            <DialogDescription>{editingPhysio ? 'Update the details below.' : 'Fill in the details to add a new physio.'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFormSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="name" className="text-right">Name</Label><Input id="name" name="name" value={physioForm.name} onChange={handleFormChange} className="col-span-3" required /></div>
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="specialization" className="text-right">Specialization</Label><Input id="specialization" name="specialization" value={physioForm.specialization} onChange={handleFormChange} className="col-span-3" required /></div>
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="ratePerSession" className="text-right">Rate/Session</Label><Input id="ratePerSession" name="ratePerSession" type="number" value={physioForm.ratePerSession} onChange={handleFormChange} className="col-span-3" required /></div>
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="experience" className="text-right">Experience</Label><Input id="experience" name="experience" value={physioForm.experience} onChange={handleFormChange} className="col-span-3" required /></div>
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="qualifications" className="text-right">Qualifications</Label><Input id="qualifications" name="qualifications" value={physioForm.qualifications} onChange={handleFormChange} className="col-span-3" required /></div>
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="contact" className="text-right">Contact</Label><Input id="contact" name="contact" value={physioForm.contact} onChange={handleFormChange} className="col-span-3" required /></div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
              <Button type="submit">{editingPhysio ? 'Save Changes' : 'Create Physio'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PhysioManagement;