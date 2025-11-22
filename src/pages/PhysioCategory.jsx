 
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

const PhysioCategory = () => {
  const [physio, setPhysio] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPhysio, setEditingPhysio] = useState(null);
  const initialFormPhysio = { 
    physioCateCode: '', 
    physioCateName: '', 
    isActive: true,
  };
  const [physioForm, setPhysioForm] = useState(initialFormPhysio);

  useEffect(() => {
    // fetch('/mockdata/categories.json')
    //   .then(res => res.json())
    //   .then(data => setCategories(data))
    //   .catch(err => console.error('Error loading categories:', err));
    getPhysio()
  }, []);

    const getPhysio = async () => {
    try {
      const response = await apiRequest("PhysioCategory/getAllPhysioCategory", {
        method: 'POST',
        body: JSON.stringify({}),
      });
      setPhysio(response)
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }
    const deletePhysio = async(id)=>{
    try {
        console.log("Deleting ID:", id); 
      const response = await apiRequest("PhysioCategory/deletePhysioCategory", {
        method: 'POST',
        body: JSON.stringify({_id:id}),
      });
        toast({ title: "Deleted", description: "PhysioCategory has been removed.", variant: "destructive" });
      getPhysio();
      return response;
    } catch (error) {0
      console.error('Error:', error);
      throw error;    
    }
  }

  const handleChangePhysio = (e) => {
    console.log(e.target.name, e.target.value,e, "e in change ")
    const { name, value } = e.target;
    setPhysioForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleRadioChange = (name, value) => {
      setPhysioForm(prev => ({ ...prev, [name]: value }));
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
    if(editingPhysio){
      updatePhysio(physioForm)
    }else{
      createPhysio(physioForm)
    }
     setIsFormOpen(false)
  };
    const createPhysio = async (data) => {
      try {
        const response = await apiRequest("PhysioCategory/createPhysioCategory", {
          method: 'POST',
          body: JSON.stringify(data),
        });
         toast({ title: "Success", description: "PhysioCategory Create successfully." });
        getPhysio()
        setIsFormOpen(false)
        return response;
      } catch (error) {
        console.error('Error:', error);
        throw error;
      }
    };
   const updatePhysio = async(data)=>{
 try {
      const response = await apiRequest("PhysioCategory/updatePhysioCategory", {
        method: 'POST',
        body: JSON.stringify(data),
      });
        toast({ title: "Success", description: "PhysioCategory updated successfully." });
        getPhysio()
       setIsFormOpen(false)
      return response;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
   }
  const handleEdit = (physioCate) => {
    setEditingPhysio(true);
   setPhysioForm({
  physioCateCode: physioCate.physioCateCode,
    physioCateName: physioCate.physioCateName,
    isActive: physioCate.isActive,
    PhysioCateIDPK: physioCate.PhysioCateIDPK,
   })

    // setCountry(countryData);
    setIsFormOpen(true);
  };

  const handleDelete = (id) => {
    // setCategories(prev => prev.filter(cat => cat.id !== categoryId));
    deletePhysio(id)
    // toast({ title: "Deleted", description: "Country has been removed.", variant: "destructive" });
  };

  const openNewDialog = () => {
    setEditingPhysio(null);
    setPhysioForm(initialFormPhysio);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3"><Layers size={30} /> Physio Category </h1>
          {/* <p className="text-gray-600 mt-1">Manage income and expense categories.</p> */}
        </div>
        <Button onClick={openNewDialog} className="shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-shadow">
          <PlusCircle size={18} className="mr-2" /> Add New Physio Category
        </Button>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
        <Card className="medical-card">
          <CardHeader>
            <CardTitle>All Physio Category ({physio.length})</CardTitle>
            <CardDescription>List of all defined transaction Physio Category.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="table-responsive-wrapper">
              <table className="w-full text-sm">
                <thead>
                  {/* <tr className="border-b">
                    <th className="text-left p-3 font-semibold text-gray-600">Expense Category Name</th>
                    <th className="text-left p-3 font-semibold text-gray-600">Expense Category Type</th>
                    <th className="text-left p-3 font-semibold text-gray-600">Status</th>
                    <th className="text-right p-3 font-semibold text-gray-600">Actions</th>
                  </tr> */}
                </thead>
                <tbody>
                  {physio.map((physiocate) => (
                    <tr key={physiocate._id} className="border-b hover:bg-gray-50/50 transition-colors">
                      <td className="p-3 font-medium text-gray-800">{physiocate.physioCateName}</td>
                      {/* <td className="p-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${cat.ExpenseCategoryType === 'Income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {cat.ExpenseCategoryType}
                        </span>
                      </td> */}
                      {/* <td className="p-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${cat.isActive ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                          {cat.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td> */}
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(physiocate)}><Edit size={14} /></Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild><Button size="sm" variant="destructive"><Trash2 size={14} /></Button></AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>This will permanently delete the Physio Category.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(physiocate.PhysioCateIDPK)}>Delete</AlertDialogAction>
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
            <DialogTitle>{editingPhysio ? 'Edit Physio' : 'Add New Physio'}</DialogTitle>
            <DialogDescription>Define a new Physio for tracking transactions.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-6 pt-4">
            <div className="space-y-2">
              <Label htmlFor="physioCateCode"> Physio Code</Label>
              <Input id="physioCateCode" name="physioCateCode" value={physioForm.physioCateCode} onChange={(e)=>{handleChangePhysio(e)}} required placeholder="e.g., PH001" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="physioCateName"> Physio Category Name</Label>
              <Input id="physioCateName" name="physioCateName" value={physioForm.physioCateName} onChange={handleChangePhysio} required placeholder="e.g.,  Orthopedic Physiotherapy" />
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
              <RadioGroup name="isActive" value={physioForm.isActive} onValueChange={(val) => handleRadioChange('isActive', val)} className="flex gap-4">
                <div className="flex items-center space-x-2"><RadioGroupItem value={true} id="status-active" /><Label htmlFor="status-active">Active</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value={false} id="status-inactive" /><Label htmlFor="status-inactive">Inactive</Label></div>
              </RadioGroup>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
              <Button type="submit">{editingPhysio ? 'Save Changes' : 'Add PhysioCategory'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PhysioCategory;
