
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

const CategoryMaster = () => {
  const [categories, setCategories] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const initialFormState = { 
    name: '', 
    type: 'Expense',
    status: 'Active'
  };
  const [categoryForm, setCategoryForm] = useState(initialFormState);

  useEffect(() => {
    // fetch('/mockdata/categories.json')
    //   .then(res => res.json())
    //   .then(data => setCategories(data))
    //   .catch(err => console.error('Error loading categories:', err));
    getExpenseCategory()
  }, []);

    const getExpenseCategory = async () => {
    try {
      const response = await apiRequest("ExpenseCategory/getAllExpenseCategory", {
        method: 'POST',
        body: JSON.stringify({}),
      });
      setCategories(response)
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }
    const deleteExpenseCategory = async(id)=>{
    try {
      const response = await apiRequest("ExpenseCategory/deleteExpenseCategory", {
        method: 'POST',
        body: JSON.stringify({_id:id}),
      });

      getExpenseCategory();
      return response;
    } catch (error) {0
      console.error('Error:', error);
      throw error;
    }
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setCategoryForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleRadioChange = (name, value) => {
      setCategoryForm(prev => ({ ...prev, [name]: value }));
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
    if(editingCategory){
      updateProjectStatus(categoryForm)
    }else{
      createProjectStatus(categoryForm)
    }
    setOpen(false);
  };
    const createProjectStatus = async (data) => {
      try {
        const response = await apiRequest("ExpenseCategory/createExpenseCategory", {
          method: 'POST',
          body: JSON.stringify(data),
        });
        getExpenseCategory()
        return response;
      } catch (error) {
        console.error('Error:', error);
        throw error;
      }
    };
   const updateProjectStatus = async(data)=>{
 try {
      const response = await apiRequest("ExpenseCategory/updateExpenseCategory", {
        method: 'POST',
        body: JSON.stringify(data),
      });
   getExpenseCategory()
      return response;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
   }
  const handleEdit = (category) => {
    setEditingCategory(category);
    setCategoryForm(category);
    setIsFormOpen(true);
  };

  const handleDelete = (categoryId) => {
    // setCategories(prev => prev.filter(cat => cat.id !== categoryId));
    deleteExpenseCategory(categoryId)
    toast({ title: "Deleted", description: "Category has been removed.", variant: "destructive" });
  };

  const openNewDialog = () => {
    setEditingCategory(null);
    setCategoryForm(initialFormState);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3"><Layers size={30} /> Category Master</h1>
          <p className="text-gray-600 mt-1">Manage income and expense categories.</p>
        </div>
        <Button onClick={openNewDialog} className="shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-shadow">
          <PlusCircle size={18} className="mr-2" /> Add New Category
        </Button>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
        <Card className="medical-card">
          <CardHeader>
            <CardTitle>All Categories ({categories.length})</CardTitle>
            <CardDescription>List of all defined transaction categories.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="table-responsive-wrapper">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold text-gray-600">Category Name</th>
                    <th className="text-left p-3 font-semibold text-gray-600">Type</th>
                    <th className="text-left p-3 font-semibold text-gray-600">Status</th>
                    <th className="text-right p-3 font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => (
                    <tr key={cat.id} className="border-b hover:bg-gray-50/50 transition-colors">
                      <td className="p-3 font-medium text-gray-800">{cat.name}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${cat.type === 'Income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {cat.type}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${cat.status === 'Active' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                          {cat.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(cat)}><Edit size={14} /></Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild><Button size="sm" variant="destructive"><Trash2 size={14} /></Button></AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>This will permanently delete the category.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(cat._id)}>Delete</AlertDialogAction>
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
            <DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
            <DialogDescription>Define a new category for tracking transactions.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-6 pt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Category Name</Label>
              <Input id="name" name="name" value={categoryForm.name} onChange={handleFormChange} required placeholder="e.g., Office Rent" />
            </div>
            
            <div className="space-y-3">
              <Label>Type</Label>
              <RadioGroup name="type" value={categoryForm.type} onValueChange={(val) => handleRadioChange('type', val)} className="flex gap-4">
                <div className="flex items-center space-x-2"><RadioGroupItem value="Income" id="type-income" /><Label htmlFor="type-income">Income</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="Expense" id="type-expense" /><Label htmlFor="type-expense">Expense</Label></div>
              </RadioGroup>
            </div>
            
             <div className="space-y-3">
              <Label>Status</Label>
              <RadioGroup name="status" value={categoryForm.status} onValueChange={(val) => handleRadioChange('status', val)} className="flex gap-4">
                <div className="flex items-center space-x-2"><RadioGroupItem value="Active" id="status-active" /><Label htmlFor="status-active">Active</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="Inactive" id="status-inactive" /><Label htmlFor="status-inactive">Inactive</Label></div>
              </RadioGroup>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
              <Button type="submit">{editingCategory ? 'Save Changes' : 'Add Category'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoryMaster;
