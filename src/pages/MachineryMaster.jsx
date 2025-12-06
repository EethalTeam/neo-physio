
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Settings, Search, Wrench, CheckCircle, XCircle, PlusCircle, Trash2, Edit, Package, PackageCheck, PackageSearch, Users, Wrench as Tool } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '@/components/CustomComponents/apiRequest';

const MachineryMaster = () => {
  const navigate = useNavigate()
  const [machines, setMachines] = useState([]);
  // const [physios, setPhysios] = useState([]);
  const [filteredMachines, setFilteredMachines] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState(null);
  const [managingMachine, setManagingMachine] = useState(null);

  const initialFormState = {
    _id:'',
    machineName: '',
    machineDescription: '',
    machineCategoryID: '',
    Manufacturer: '',
    machineModel: '',
    TotalStockCount: '',
    // physioName: '',
    categoryName:''

  };
  const [machineForm, setMachineForm] = useState(initialFormState);

  const [assignPhysioId, setAssignPhysioId] = useState('');
  const [assignCount, setAssignCount] = useState(1);
  const [machineCategory, setMachineCategory] = useState([])
console.log(machineCategory,"machineCategory")

 const { getPermissionsByPath } = useAuth();
  const [Permissions, setPermissions] = useState({ isAdd: false, isView: false, isEdit: false, isDelete: false })
  // console.log(Permissions,"Permissions")
  useEffect(() => {
    getPermissionsByPath(window.location.pathname).then(res => {
      if (res) {
        console.log(res, "res")
        setPermissions(res)
      } else {
        navigate('/dashboard')
      }
    })

  }, [])

useEffect(()=>{
    if (Permissions.isView) {
      
      getAllMachine()
    }
},[Permissions])



  useEffect(() => {
    
      MachineCategory()
     
  }, [])
  //get all All Machine
  const getAllMachine = async(data) => {
    try {
      const res = await apiRequest("Machinery/getAllMachinery",
        {
          method: 'POST',
          body: JSON.stringify(data)
        });
        setMachines(res)
      setFilteredMachines(res);


    } catch (error) {
      console.error("not able to getall Machine", error);
    }
  };


  //create the Machine


  const createMachine = async (data) => {
    try {
      const res = await apiRequest("Machinery/createMachinery",
        {
          method: 'POST',
          body: JSON.stringify(data)
        });
      getAllMachine();


    } catch (error) {
      console.error("not able to create Machine:", error);
    }
  };

  // update the Machine

  const updateMachine = async (data) => {
    try {
      const res = await apiRequest("Machinery/updateMachinery",
        {
          method: 'POST',
          body: JSON.stringify(data)
        });
      getAllMachine();


    } catch (error) {
      console.error("not able to update Machine:", error);
    }
  };


  //api for delete
  const deleteMachine = async (id) => {
    try {

      const response = await apiRequest("Machinery/deleteMachinery", {
        method: 'POST',
        body: JSON.stringify({ _id: id }),
      });
      toast({ title: "Deleted", description: "Machine has been removed.", variant: "destructive" });
      getAllMachine()
      return response;
    } catch (error) {

      console.error('Error:', error);
      throw error;
    }
  }


  //api for machine Category

  const MachineCategory = async (data) => {
    try {
      const res =await apiRequest("MachineCategory/getAllMachineCategory", {
        method: 'POST',
        body: JSON.stringify(data),
      })
     setMachineCategory(res)


    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }

  //api for phsio 

  // const getAllPhysio = async (data) => {
  //   try {
  //     const res = await apiRequest("Physio/getAllPhysio", {
  //       method: 'POST',
  //       body: JSON.stringify(data)
  //     })
  //     setPhysios(res)
  //   } catch (error) {
  //     console.error('Error:', error);
  //     throw error;
  //   }
  // }


  useEffect(() => {
    let filtered = machines
    if (searchTerm) {
       filtered = filtered.filter(machine =>
        machine.machineName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        machine.machineCategoryID?.categoryName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMachines(filtered);
    } else {
      setFilteredMachines(machines);
    }
  }, [machines, searchTerm]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setMachineForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setMachineForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (editingMachine) {
      updateMachine(machineForm)
      // setMachines(prev => prev.map(m => {
      //   if (m.id === editingMachine.id) {
      //     const countDifference = machineForm.totalCount - m.totalCount;
      //     return {
      //       ...m,
      //       ...machineForm,
      //       inventory: {
      //         ...m.inventory,
      //         available: Math.max(0, m.inventory.available + countDifference)
      //       }
      //     };
      //   }
      //   return m;
      // }));
       toast({ title: "Success", description: "Equipment updated successfully." });
    } else {
      // const newMachine = {
      //   id: Date.now(),
      //   ...machineForm,
      //   active: true,
      //   inventory: {
      //     available: parseInt(machineForm.totalCount, 10) || 0,
      //     inUse: [],
      //     underMaintenance: 0,
      //   }
      // };
      // setMachines(prev => [newMachine, ...prev]);
      createMachine(machineForm)
      toast({ title: "Success", description: "New equipment added." });
    }
    setIsFormOpen(false);
    setEditingMachine(null);
    setMachineForm(initialFormState);
  };

  const handleEditMachine = (machine) => {
    setEditingMachine(true);
    setMachineForm({
      _id:machine._id?machine._id: null,
      machineName: machine.machineName ? machine.machineName : null,
      machineDescription: machine.machineDescription ? machine.machineDescription : null,
      machineCategoryID: machine.machineCategoryID ? machine.machineCategoryID : null,
      Manufacturer: machine.Manufacturer ? machine.Manufacturer : null,
      machineModel: machine.machineModel ? machine.machineModel : null,
      TotalStockCount: machine.TotalStockCount ? machine.TotalStockCount : null,
      categoryName:machine.categoryName ? machine.categoryName : null
    
    });
    setIsFormOpen(true);
  };

  const handleDeleteMachine = (id) => {
    // setMachines(prev => prev.filter(m => m.id !== machineId));
    deleteMachine(id)
    toast({ title: "Deleted", description: "Equipment has been removed.", variant: "destructive" });
  };

  const openNewMachineDialog = () => {
    setEditingMachine(null);
    setMachineForm(initialFormState);
    setIsFormOpen(true);
  };

  const openInventoryDialog = (machine) => {
    setManagingMachine(machine);
    setIsInventoryOpen(true);
  };

  const handleAssignToPhysio = () => {
    if (!assignPhysioId || assignCount <= 0) {
      toast({ title: "Invalid Input", description: "Please select a physio and enter a valid count.", variant: "destructive" });
      return;
    }

    setMachines(prev => prev.map(m => {
      if (m.id === managingMachine.id) {
        if (m.inventory.available < assignCount) {
          toast({ title: "Not enough stock", description: `Only ${m.inventory.available} units available.`, variant: "destructive" });
          return m;
        }

        // const newInUse = [...m.inventory.inUse];
        // const physioIndex = newInUse.findIndex(item => item.physioId === parseInt(assignPhysioId));

        // if (physioIndex > -1) {
        //   newInUse[physioIndex].count += parseInt(assignCount);
        // } else {
        //   newInUse.push({ physioId: parseInt(assignPhysioId), count: parseInt(assignCount) });
        // }

        // const updatedMachine = {
        //   ...m,
        //   inventory: {
        //     ...m.inventory,
        //     available: m.inventory.available - parseInt(assignCount),
        //     inUse: newInUse,
        //   }
        // };
        // setManagingMachine(updatedMachine); // Update the dialog state
        // return updatedMachine;
      }
      return m;
    }));
    toast({ title: "Success", description: "Equipment assigned to physio." });
    setAssignPhysioId('');
    setAssignCount(1);
  };

  // const handleReturnFromPhysio = (physioId, returnCount) => {
  //   setMachines(prev => prev.map(m => {
  //     if (m.id === managingMachine.id) {
  //       const newInUse = [...m.inventory.inUse];
  //       const physioIndex = newInUse.findIndex(item => item.physioId === physioId);

  //       if (physioIndex === -1) return m;

  //       const currentCount = newInUse[physioIndex].count;
  //       const actualReturnCount = Math.min(returnCount, currentCount);

  //       if (currentCount - actualReturnCount <= 0) {
  //         newInUse.splice(physioIndex, 1);
  //       } else {
  //         newInUse[physioIndex].count -= actualReturnCount;
  //       }

  //       const updatedMachine = {
  //         ...m,
  //         inventory: {
  //           ...m.inventory,
  //           available: m.inventory.available + actualReturnCount,
  //           inUse: newInUse,
  //         }
  //       };
  //       setManagingMachine(updatedMachine);
  //       return updatedMachine;
  //     }
  //     return m;
  //   }));
  //   toast({ title: "Success", description: "Equipment returned to stock." });
  // };

  const handleSetMaintenance = (count) => {
    setMachines(prev => prev.map(m => {
      if (m.id === managingMachine.id) {
        if (m.inventory.available < count) {
          toast({ title: "Not enough stock", description: `Only ${m.inventory.available} units available for maintenance.`, variant: "destructive" });
          return m;
        }
        const updatedMachine = {
          ...m,
          inventory: {
            ...m.inventory,
            available: m.inventory.available - count,
            underMaintenance: m.inventory.underMaintenance + count,
          }
        };
        setManagingMachine(updatedMachine);
        return updatedMachine;
      }
      return m;
    }));
    toast({ title: "Success", description: `${count} unit(s) moved to maintenance.` });
  };

  const handleReturnFromMaintenance = (count) => {
    setMachines(prev => prev.map(m => {
      if (m.id === managingMachine.id) {
        const actualReturnCount = Math.min(count, m.inventory.underMaintenance);
        const updatedMachine = {
          ...m,
          inventory: {
            ...m.inventory,
            available: m.inventory.available + actualReturnCount,
            underMaintenance: m.inventory.underMaintenance - actualReturnCount,
          }
        };
        setManagingMachine(updatedMachine);
        return updatedMachine;
      }
      return m;
    }));
    toast({ title: "Success", description: `${count} unit(s) returned from maintenance.` });
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

  return (
    <div className="space-y-6 ">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col md:flex-row  md:justify-between items-start space-y-5">
        <div>
          <h1 className="md:text-3xl text-lg font-bold text-gray-800 mb-2">Equipment Inventory</h1>
          <p className="text-gray-600">Manage and track all physiotherapy equipment.</p>
        </div>
        {
          Permissions.isAdd &&
        <Button onClick={openNewMachineDialog}><PlusCircle className="mr-2 h-4 w-4" /> Add New Equipment</Button>

        }
      </motion.div>

      <Card className="medical-card">
        <CardHeader><CardTitle className="text-xl md:text-2xl">Search Equipment</CardTitle></CardHeader>
        <CardContent><div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" /><Input placeholder="Search by name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" /></div></CardContent>
      </Card>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
        <Card className="medical-card">
          <CardHeader><CardTitle className="text-xl md:text-2xl">Equipment ({filteredMachines.length})</CardTitle><CardDescription>Overview of all equipment inventory.</CardDescription></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMachines.map((machine) => {
                // const inUseCount = machine.inventory.inUse.reduce((sum, item) => sum + item.count, 0);
                return (
                  <motion.div key={machine._id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="border rounded-lg p-6 hover:shadow-lg transition-shadow flex flex-col bg-white">
                    <div className="md:flex  items-start md:space-x-4 mb-2  md:mb-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${machine.active ? 'bg-blue-100' : 'bg-gray-100'}`}>{getCategoryIcon(machine.category)}</div>
                      <div className="flex-1 space-y-3 ">
                        <h3 className="font-bold md:text-lg text-sm mt-5 md:mt-0 text-gray-800">{machine.machineName}</h3>
                        <p className="text-sm text-gray-500">{machine.Manufacturer} {machine.machineModel}</p>
                      <span className={`px-2 py-1 text-xs rounded-full font-semibold ${machine.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{machine.active ? 'Active' : 'Inactive'}</span>

                      </div>
                    </div>

                    <div className="space-y-4 mb-6 flex-grow">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-center text-gray-700 mb-3">Inventory Status</h4>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          {/* <div><p className="text-2xl font-bold text-green-600">{machine.inventory.available}</p><p className="text-xs text-gray-500">Available</p></div>
                          <div><p className="text-2xl font-bold text-orange-600">{inUseCount}</p><p className="text-xs text-gray-500">In Use</p></div>
                          <div><p className="text-2xl font-bold text-red-600">{machine.inventory.underMaintenance}</p><p className="text-xs text-gray-500">Maintenance</p></div> */}
                        </div>
                        <div className="text-center mt-3 pt-2 border-t"><p className="text-sm text-gray-600">Total Stock: <span className="font-bold">{machine.TotalStockCount}</span></p></div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Button onClick={() => openInventoryDialog(machine)} className="w-full"><Package className="mr-2 h-4 w-4" /> Manage Inventory</Button>
                      <div className="flex space-x-2">
                       {
                        Permissions.isEdit && 
                        <Button size="sm" variant="outline" onClick={() => handleEditMachine(machine)} className="flex-1"><Edit size={14} className="mr-1" /> Edit</Button>

                       }
                       {
                        Permissions.isDelete && 
                         <AlertDialog>
                          <AlertDialogTrigger asChild><Button size="sm" variant="destructive" className="flex-1"><Trash2 size={14} className="mr-1" /> Delete</Button></AlertDialogTrigger>
                          <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the equipment and its inventory records.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteMachine(machine._id)}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                        </AlertDialog>
                       }
                       
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editingMachine ? 'Edit Equipment' : 'Add New Equipment'}</DialogTitle></DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Name</Label><Input name="machineName" value={machineForm.machineName} onChange={handleFormChange} required /></div>
              {/* <div className="space-y-1"><Label>Category</Label><Select onValueChange={(v) => handleSelectChange('machineCategoryID', v)} value={machineForm.machineCategoryID}><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent><SelectItem value="therapy">Therapy</SelectItem><SelectItem value="exercise">Exercise</SelectItem><SelectItem value="pain_management">Pain Management</SelectItem><SelectItem value="mobility">Mobility</SelectItem></SelectContent></Select></div> */}
               <div>
                                <Label>Category</Label>
                                <Select value={machineForm.machineCategoryID} onValueChange={(v) => handleSelectChange('machineCategoryID', v)}>
                                  <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                                  <SelectContent>
                                    {machineCategory.length && machineCategory.map((category) => (
                                      <SelectItem key={category.MachcateIDPK} value={category.MachcateIDPK}>{category.categoryName}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
            </div>
            <div className="space-y-1"><Label>Description</Label><Input name="machineDescription" value={machineForm.machineDescription} onChange={handleFormChange} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Manufacturer</Label><Input name="Manufacturer" value={machineForm.Manufacturer} onChange={handleFormChange} /></div>
              <div className="space-y-1"><Label>Model</Label><Input name="machineModel" value={machineForm.machineModel} onChange={handleFormChange} /></div>
            </div>
            <div className="space-y-1"><Label>Total Stock Count</Label><Input name="TotalStockCount" type="number" min="1" value={machineForm.TotalStockCount} onChange={handleFormChange}  required /></div>
            <DialogFooter><Button type="button" variant="secondary" onClick={() => setIsFormOpen(false)}>Cancel</Button><Button type="submit">{editingMachine ? 'Save Changes' : 'Create Equipment'}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isInventoryOpen} onOpenChange={setIsInventoryOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Manage Inventory: {managingMachine?.name}</DialogTitle>
            <DialogDescription>Assign, return, or manage maintenance for this equipment.</DialogDescription>
          </DialogHeader>
          {managingMachine && (
            <div className="flex-1 overflow-y-auto pr-4 -mr-4 space-y-6">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Users />In Use by Physios</CardTitle></CardHeader>
                <CardContent>
                  {managingMachine.inventory.inUse.length > 0 ? (
                    <ul className="space-y-2">
                      {managingMachine.inventory.inUse.map(item => {
                        const physio = physios.find(p => p.id === item.physioId);
                        return (
                          <li key={item.physioId} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                            <div><span className="font-semibold">{physio?.name || 'Unknown Physio'}</span>: <span className="text-blue-600 font-bold">{item.count}</span> unit(s)</div>
                            <Button size="sm" variant="outline" onClick={() => handleReturnFromPhysio(item.physioId, 1)}>Return 1</Button>
                          </li>
                        );
                      })}
                    </ul>
                  ) : <p className="text-sm text-gray-500">Not currently in use by any physio.</p>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><PackageCheck />Assign to Physio</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <p>Available to assign: <span className="font-bold text-green-600">{managingMachine.inventory.available}</span></p>
                  <div className="flex items-end gap-2">
                    <div className="flex-1"><Label>Physiotherapist</Label><Select value={assignPhysioId} onValueChange={setAssignPhysioId}><SelectTrigger><SelectValue placeholder="Select a physio" /></SelectTrigger><SelectContent>{physios.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}</SelectContent></Select></div>
                    <div className="w-24"><Label>Count</Label><Input type="number" min="1" max={managingMachine.inventory.available} value={assignCount} onChange={(e) => setAssignCount(e.target.value)} /></div>
                    <Button onClick={handleAssignToPhysio}>Assign</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Tool />Under Maintenance</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <p>Currently in maintenance: <span className="font-bold text-red-600">{managingMachine.inventory.underMaintenance}</span></p>
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => handleSetMaintenance(1)} disabled={managingMachine.inventory.available < 1}>Move 1 to Maintenance</Button>
                    <Button size="sm" variant="secondary" onClick={() => handleReturnFromMaintenance(1)} disabled={managingMachine.inventory.underMaintenance < 1}>Return 1 from Maintenance</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MachineryMaster;
