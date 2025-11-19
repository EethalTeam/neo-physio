
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Layers, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { apiRequest } from '@/components/CustomComponents/apiRequest'

const LeadStatus = () => {
  const [leadStatus, setLeadStatus] = useState([]);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLeadStatus, setEditingLeadStatus] = useState(null);
  const initialFormState = { 
    leadStatusName: '', 
    leadStatusCode: '',
    isActive: true,
    leadStatusColor:'',
    leadStatusTextColor:''
  };
  const [leadStatusForm, setLeadStatusForm] = useState(initialFormState);

  useEffect(() => {
    // fetch('/mockdata/categories.json')
    //   .then(res => res.json())
    //   .then(data => setCategories(data))
    //   .catch(err => console.error('Error loading categories:', err));
    getLeadStatus()
  }, []);

    const getLeadStatus = async (data) => {
    try {
      const response = await apiRequest("LeadStatus/getAllLeadStatus", {
        method: 'POST',
        body: JSON.stringify(data),
      });
      setLeadStatus(response)
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }
    const deleteLeadStatus = async(id)=>{
    try {
      const response = await apiRequest("LeadStatus/deleteLeadStatus", {
        method: 'POST',
        body: JSON.stringify({_id:id}),
      });
        toast({ title: "Deleted", description: "LeadStatus has been removed.", variant: "destructive" });
      getLeadStatus();
      return response;
    } catch (error) {0
      console.error('Error:', error);
      throw error;    
    }
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setLeadStatusForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleRadioChange = (name, value) => {
      setLeadStatusForm(prev => ({ ...prev, [name]: value }));
  };

  // const handleFormSubmit = (e) => {
  //   e.preventDefault();
    
  //   if (editingCategory) {
  //     setCategories(prev => prev.map(cat => cat.id === editingCategory.id ? { ...cat, ...categoryForm } : cat));
  //     toast({ title: "Success", description: "Category updated successfully." });
  //   } else {
  //     const newCategory = { id: Date.now(), ...categoryForm };
  //     setCategories(prev => [newCategory, ...prev]);
  //     toast({ title: "Success", description: "New category added." });
  //   }
  //   setIsFormOpen(false);
  //   setEditingCategory(null);
  //   setCategoryForm(initialFormState);
  // };

    const handleFormSubmit = (e) => {
    e.preventDefault();
    if(editingLeadStatus){
      updateLeadStatus(leadStatusForm)
    }else{
      createLeadStatus(leadStatusForm)
    }
    // setOpen(false);
  };
    const createLeadStatus = async (data) => {
      try {
        const response = await apiRequest("LeadStatus/createLeadStatus", {
          method: 'POST',
          body: JSON.stringify(data),
        });
         toast({ title: "Success", description: "LeadStatus Create successfully." });
        getLeadStatus()
        setIsFormOpen(false)
        return response;
      } catch (error) {
        console.error('Error:', error);
        throw error;
      }
    };
   const updateLeadStatus = async(data)=>{
 try {
      const response = await apiRequest("LeadStatus/updateLeadStatus", {
        method: 'POST',
        body: JSON.stringify(data),
      });
        toast({ title: "Success", description: "ExpenseType updated successfully." });
   getLeadStatus()
     setIsFormOpen(false)
      return response;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
   }
  const handleEdit = (lead) => {
    setEditingLeadStatus(lead);
    setLeadStatusForm(lead);
    setIsFormOpen(true);
  };

  const handleDelete = (id) => {
    // setCategories(prev => prev.filter(cat => cat.id !== categoryId));
    deleteLeadStatus(id)
    toast({ title: "Deleted", description: "leadStatus has been removed.", variant: "destructive" });
  };

  const openNewDialog = () => {
    setEditingLeadStatus(null);
    setLeadStatusForm(initialFormState);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3"><Layers size={30} /> Lead Status</h1>
          <p className="text-gray-600 mt-1">Manage Lead Status.</p>
        </div>
        <Button onClick={openNewDialog} className="shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-shadow">
          <PlusCircle size={18} className="mr-2" /> Add New LeadStatus
        </Button>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
        <Card className="medical-card">
          <CardHeader>
            <CardTitle>All Lead Status ({leadStatus.length})</CardTitle>
            <CardDescription>List of all defined transaction Lead status.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="table-responsive-wrapper">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold text-gray-600">Lead Status Color</th>
                    <th className="text-left p-3 font-semibold text-gray-600">Lead Status Text Color</th>
                    <th className="text-left p-3 font-semibold text-gray-600">Lead Status Name</th>
                    <th className="text-left p-3 font-semibold text-gray-600"> Status</th>
                    {/* <th className="text-left p-3 font-semibold text-gray-600">Status</th> */}
                    <th className="text-right p-3 font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leadStatus.map((lead) => (
                    <tr key={lead._id} className="border-b hover:bg-gray-50/50 transition-colors">
                      <td><input type='color' value={lead.leadStatusColor} /></td>
                      <td><input type='color' value={lead.leadStatusTextColor || '#ffffff'} /></td>
                      <td className="p-3 font-medium text-gray-800">{lead.leadStatusName}</td>
 
                      <td className="p-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${lead.isActive ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                          {lead.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(lead)}><Edit size={14} /></Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild><Button size="sm" variant="destructive"><Trash2 size={14} /></Button></AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>This will permanently delete the LeadStatus.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(lead._id)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingLeadStatus ? 'Edit LeadStatus' : 'Add New LeadStatus'}</DialogTitle>
            <DialogDescription>Define a new LeadStatus for tracking transactions.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-6 pt-4">
            <div className='gap-10 grid grid-cols-2'>
              <div>
                <Label htmlFor="leadStatusCode"> Lead Status Color</Label>
              <Input type='color' id="leadStatusColor" name="leadStatusColor" value={leadStatusForm.leadStatusColor} onChange={handleFormChange} required className='max-w-sm '  />
              </div>
              <div>
                <Label htmlFor="leadStatusTextColor"> Lead Status Text Color</Label>
              <Input type='color' id="leadStatusTextColor" name="leadStatusTextColor" value={leadStatusForm.leadStatusTextColor} onChange={handleFormChange} required className='max-w-sm '  />
              </div>
              
            
            </div>
            <div className="space-y-2">
              <Label htmlFor="leadStatusCode"> Lead Status Code</Label>
              <Input id="leadStatusCode" name="leadStatusCode" value={leadStatusForm.leadStatusCode} onChange={handleFormChange} required placeholder="e.g., LS001" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="leadStatusName"> Lead Status Name</Label>
              <Input id="leadStatusName" name="leadStatusName" value={leadStatusForm.leadStatusName} onChange={handleFormChange} required placeholder="e.g., pending" />
            </div>
            
            {/* <div className="space-y-3">
              <Label>Expense Category Type</Label>
              <RadioGroup name="ExpenseCategoryType" value={categoryForm.ExpenseCategoryType} onValueChange={(val) => handleRadioChange('ExpenseCategoryType', val)} className="flex gap-4">
                <div className="flex items-center space-x-2"><RadioGroupItem value="Income" id="type-income" /><Label htmlFor="type-income">Income</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="Expense" id="type-expense" /><Label htmlFor="type-expense">Expense</Label></div>
              </RadioGroup>
            </div> */}
            
             <div className="space-y-3">
              <Label>Status</Label>
              <RadioGroup name="isActive" value={leadStatusForm.isActive} onValueChange={(val) => handleRadioChange('isActive', val)} className="flex gap-4">
                <div className="flex items-center space-x-2"><RadioGroupItem value={true} id="status-active" /><Label htmlFor="status-active">Active</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value={false} id="status-inactive" /><Label htmlFor="status-inactive">Inactive</Label></div>
              </RadioGroup>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
              <Button type="submit">{editingLeadStatus ? 'Save Changes' : 'Add ExpenseType'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeadStatus;
