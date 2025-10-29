import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Settings, Search, Wrench, CheckCircle, XCircle, PlusCircle, Trash2, Edit } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const MachineryMaster = () => {
  const [machines, setMachines] = useState([]);
  const [filteredMachines, setFilteredMachines] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState(null);

  const initialFormState = {
    name: '',
    description: '',
    category: '',
    manufacturer: '',
    model: ''
  };
  const [machineForm, setMachineForm] = useState(initialFormState);

  useEffect(() => {
    fetch('/mockdata/machines.json')
      .then(res => res.json())
      .then(data => {
        setMachines(data);
        setFilteredMachines(data);
      })
      .catch(err => console.error('Error loading machines:', err));
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = machines.filter(machine =>
        machine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        machine.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMachines(filtered);
    } else {
      setFilteredMachines(machines);
    }
  }, [machines, searchTerm]);

  const handleToggleStatus = (machineId) => {
    setMachines(prev => prev.map(machine =>
      machine.id === machineId ? { ...machine, active: !machine.active } : machine
    ));
    toast({
      title: "Machine Status Updated",
      description: "Machine status has been updated successfully"
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setMachineForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value) => {
    setMachineForm(prev => ({ ...prev, category: value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (editingMachine) {
      setMachines(prev => prev.map(m => m.id === editingMachine.id ? { ...m, ...machineForm } : m));
      toast({ title: "Success", description: "Equipment updated successfully." });
    } else {
      const newMachine = {
        id: Date.now(),
        ...machineForm,
        active: true
      };
      setMachines(prev => [newMachine, ...prev]);
      toast({ title: "Success", description: "New equipment added." });
    }
    setIsDialogOpen(false);
    setEditingMachine(null);
    setMachineForm(initialFormState);
  };

  const handleEditMachine = (machine) => {
    setEditingMachine(machine);
    setMachineForm({
      name: machine.name,
      description: machine.description,
      category: machine.category,
      manufacturer: machine.manufacturer,
      model: machine.model
    });
    setIsDialogOpen(true);
  };

  const handleDeleteMachine = (machineId) => {
    setMachines(prev => prev.filter(m => m.id !== machineId));
    toast({
      title: "Deleted",
      description: "Equipment has been removed.",
      variant: "destructive"
    });
  };

  const openNewMachineDialog = () => {
    setEditingMachine(null);
    setMachineForm(initialFormState);
    setIsDialogOpen(true);
  };

  const handleMaintenanceSchedule = (machineId) => {
    toast({
      title: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀"
    });
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'therapy': return <Wrench className="text-blue-600" size={20} />;
      case 'exercise': return <Settings className="text-green-600" size={20} />;
      case 'pain_management': return <Settings className="text-purple-600" size={20} />;
      case 'mobility': return <Settings className="text-orange-600" size={20} />;
      default: return <Settings className="text-gray-600" size={20} />;
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'therapy': return 'bg-blue-100 text-blue-800';
      case 'exercise': return 'bg-green-100 text-green-800';
      case 'pain_management': return 'bg-purple-100 text-purple-800';
      case 'mobility': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Machinery Master</h1>
          <p className="text-gray-600">Manage physiotherapy equipment and machinery</p>
        </div>
        <Button onClick={openNewMachineDialog}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Equipment
        </Button>
      </motion.div>

      <Card className="medical-card">
        <CardHeader>
          <CardTitle>Search Equipment</CardTitle>
          <CardDescription>Find equipment by name or category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name or category..."
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
            <CardTitle>Equipment ({filteredMachines.length})</CardTitle>
            <CardDescription>All physiotherapy equipment in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMachines.map((machine) => (
                <motion.div
                  key={machine.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="border rounded-lg p-6 hover:shadow-md transition-shadow flex flex-col"
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${machine.active ? 'bg-green-100' : 'bg-gray-100'}`}>
                      {getCategoryIcon(machine.category)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{machine.name}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(machine.category)}`}>{machine.category.replace('_', ' ')}</span>
                        {machine.active ? <CheckCircle className="text-green-600" size={16} /> : <XCircle className="text-red-600" size={16} />}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4 flex-grow">
                    <p className="text-sm text-gray-600">{machine.description}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between"><span className="text-sm text-gray-600">Manufacturer:</span><span className="text-sm font-medium">{machine.manufacturer}</span></div>
                      <div className="flex justify-between"><span className="text-sm text-gray-600">Model:</span><span className="text-sm font-medium">{machine.model}</span></div>
                      <div className="flex justify-between"><span className="text-sm text-gray-600">Status:</span><span className={`text-sm font-medium ${machine.active ? 'text-green-600' : 'text-red-600'}`}>{machine.active ? 'Active' : 'Inactive'}</span></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleEditMachine(machine)} className="flex-1"><Edit size={14} className="mr-1" /> Edit</Button>
                      <Button size="sm" variant={machine.active ? "destructive" : "default"} onClick={() => handleToggleStatus(machine.id)} className="flex-1">{machine.active ? 'Deactivate' : 'Activate'}</Button>
                    </div>
                    <div className="flex space-x-2 mt-2">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive" className="flex-1"><Trash2 size={14} className="mr-1" /> Delete</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the equipment.</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteMachine(machine.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <Button size="sm" variant="outline" onClick={() => handleMaintenanceSchedule(machine.id)} className="flex-1">Maintenance</Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingMachine ? 'Edit Equipment' : 'Add New Equipment'}</DialogTitle>
            <DialogDescription>{editingMachine ? 'Update the details below.' : 'Fill in the details to add new equipment.'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFormSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="name" className="text-right">Name</Label><Input id="name" name="name" value={machineForm.name} onChange={handleFormChange} className="col-span-3" required /></div>
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="description" className="text-right">Description</Label><Input id="description" name="description" value={machineForm.description} onChange={handleFormChange} className="col-span-3" required /></div>
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="category" className="text-right">Category</Label>
                <Select onValueChange={handleSelectChange} value={machineForm.category}>
                  <SelectTrigger className="col-span-3"><SelectValue placeholder="Select a category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="therapy">Therapy</SelectItem>
                    <SelectItem value="exercise">Exercise</SelectItem>
                    <SelectItem value="pain_management">Pain Management</SelectItem>
                    <SelectItem value="mobility">Mobility</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="manufacturer" className="text-right">Manufacturer</Label><Input id="manufacturer" name="manufacturer" value={machineForm.manufacturer} onChange={handleFormChange} className="col-span-3" required /></div>
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="model" className="text-right">Model</Label><Input id="model" name="model" value={machineForm.model} onChange={handleFormChange} className="col-span-3" required /></div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
              <Button type="submit">{editingMachine ? 'Save Changes' : 'Create Equipment'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MachineryMaster;