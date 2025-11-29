
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
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '@/components/CustomComponents/apiRequest'

const Gender = () => {
    const navigate = useNavigate();
  const [gender, setGender] = useState([]);
  console.log(gender)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGender, setEditingGender] = useState(null);
  const initialFormGender = {
    genderCode: '',
    genderName: '',
    isActive: true,
  };
  const [genderForm, setGenderForm] = useState(initialFormGender);

   

     const { getPermissionsByPath } = useAuth();
      const [Permissions,setPermissions]=useState({isAdd:false,isView:false,isEdit:false,isDelete:false})
  // console.log(Permissions,"Permissions")
      useEffect(()=>{
          getPermissionsByPath(window.location.pathname).then(res=>{
              if(res){
                console.log(res,"res")
                  setPermissions(res)
              }else{
                  navigate('/dashboard')
              }
          })
       
      },[])

      useEffect(()=>{
          if (Permissions.isView) {
          getGender()
          }
      },[Permissions])

  const getGender = async () => {
    try {
      const response = await apiRequest("Gender/getAllGender", {
        method: 'POST',
        body: JSON.stringify({}),
      });
      
      setGender(response)
    
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }
  const deleteGender = async (id) => {
    try {
      console.log("Deleting ID:", id);
      const response = await apiRequest("Gender/deleteGender", {
        method: 'POST',
        body: JSON.stringify({ _id: id }),
      });
      toast({ title: "Deleted", description: "Gender has been removed.", variant: "destructive" });
      getGender();
      return response;
    } catch (error) {
      0
      console.error('Error:', error);
      throw error;
    }
  }

  const handleChangeGender = (e) => {
    console.log(e.target.name, e.target.value, e, "e in change ")
    const { name, value } = e.target;
    setGenderForm(prev => ({ ...prev, [name]: value }));
  };

  const handleRadioChange = (name, value) => {
    setGenderForm(prev => ({ ...prev, [name]: value }));
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
    if (editingGender) {
      updateGender(genderForm)
    } else {
      createGender(genderForm)
    }
    setIsFormOpen(false)
  };
  const createGender = async (data) => {
    try {
      const response = await apiRequest("Gender/createGender", {
        method: 'POST',
        body: JSON.stringify(data),
      });
      toast({ title: "Success", description: "Gender Create successfully." });
      getGender()
      setIsFormOpen(false)
      return response;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  };
  const updateGender = async (data) => {
    try {
      const response = await apiRequest("Gender/updateGender", {
        method: 'POST',
        body: JSON.stringify(data),
      });
      toast({ title: "Success", description: "Gender updated successfully." });
      getGender()
      setIsFormOpen(false)
      return response;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }
  const handleEdit = (gender) => {
    setEditingGender(true);
    setGenderForm({
      genderName: gender.genderName,
      genderCode: gender.genderCode,
      isActive: gender.isActive,
      GenderIDPK: gender.GenderIDPK,
    })

    // setCountry(countryData);
    setIsFormOpen(true);
  };

  const handleDelete = (id) => {
    // setCategories(prev => prev.filter(cat => cat.id !== categoryId));
    deleteGender(id)
    // toast({ title: "Deleted", description: "Country has been removed.", variant: "destructive" });
  };

  const openNewDialog = () => {
    setEditingGender(null);
    setGenderForm(initialFormGender);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6 ms-10 p-10 md:p-0 md:ms-0 lg:ms-0 lg:p-0">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3"><Layers size={30} /> Gender </h1>
          {/* <p className="text-gray-600 mt-1">Manage income and expense categories.</p> */}
        </div>
        {
          Permissions.isAdd &&
           <Button onClick={openNewDialog} className="shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-shadow">
          <PlusCircle size={18} className="mr-2" /> Add New Gender
        </Button>
        }
       
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
        <Card className="medical-card">
          <CardHeader>
            <CardTitle>All Gender ({gender.length})</CardTitle>
            <CardDescription>List of all defined transaction Gender.</CardDescription>
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
                  {gender.map((gen) => (
                    <tr key={gen._id} className="border-b hover:bg-gray-50/50 transition-colors">
                      <td className="p-3 font-medium text-gray-800">{gen.genderName}</td>
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
                          {
                            Permissions.isEdit && 
                          <Button size="sm" variant="outline" onClick={() => handleEdit(gen)}><Edit size={14} /></Button>

                          }
                          {
                             Permissions.isDelete && 
                              <AlertDialog>
                            <AlertDialogTrigger asChild><Button size="sm" variant="destructive"><Trash2 size={14} /></Button></AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>This will permanently delete the Gender.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(gen.GenderIDPK)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          }
                         
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
            <DialogTitle>{editingGender ? 'Edit Gender' : 'Add New Gender'}</DialogTitle>
            {/* <DialogDescription>Define a new Gender  for tracking transactions.</DialogDescription> */}
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-6 pt-4">
            <div className="space-y-2">
              <Label htmlFor="genderCode"> Gender Code</Label>
              <Input id="genderCode" name="genderCode" value={genderForm.genderCode} onChange={(e) => { handleChangeGender(e) }} required placeholder="e.g., PH001" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="genderName"> Gender Name</Label>
              <Input id="genderName" name="genderName" value={genderForm.genderName} onChange={handleChangeGender} required placeholder="e.g., India" />
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
              <RadioGroup name="isActive" value={genderForm.isActive} onValueChange={(val) => handleRadioChange('isActive', val)} className="flex gap-4">
                <div className="flex items-center space-x-2"><RadioGroupItem value={true} id="status-active" /><Label htmlFor="status-active">Active</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value={false} id="status-inactive" /><Label htmlFor="status-inactive">Inactive</Label></div>
              </RadioGroup>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
              <Button type="submit">{editingGender ? 'Save Changes' : 'Add LeadSource'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Gender;
