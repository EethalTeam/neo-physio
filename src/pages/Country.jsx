 
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


const Country = () => {
  const navigate = useNavigate()
  const [country, setCountry] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCountry, setEditingCountry] = useState(null);
  const initialFormCountry = { 
    countryName: '', 
    countryCode: '', 
    isActive: true,
  };
  const [countryForm, setCountryForm] = useState(initialFormCountry);

  

   const { getPermissionsByPath } = useAuth();
      const [Permissions,setPermissions]=useState({isAdd:false,isView:false,isEdit:false,isDelete:false})
  // console.log(Permissions,"Permissions")
      useEffect(()=>{
          getPermissionsByPath(window.location.pathname).then(res=>{
              if(res){
                  setPermissions(res)
              }else{
                  navigate('/dashboard')
              }
          })
        
      },[])

        useEffect(()=>{
          if (Permissions.isView) {
        getCountry()
          }
      },[Permissions])

    const getCountry = async () => {
    try {
      const response = await apiRequest("Country/getAllCountry", {
        method: 'POST',
        body: JSON.stringify({}),
      });
      setCountry(response)
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }
    const deleteCountry = async(id)=>{
    try {
      const response = await apiRequest("Country/deleteCountry", {
        method: 'POST',
        body: JSON.stringify({_id:id}),
      });
        toast({ title: "Deleted", description: "Country has been removed.", variant: "destructive" });
      getCountry();
      return response;
    } catch (error) {0
      console.error('Error:', error);
      throw error;    
    }
  }

  const handleChangeCountry = (e) => {
    const { name, value } = e.target;
    setCountryForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleRadioChange = (name, value) => {
      setCountryForm(prev => ({ ...prev, [name]: value }));
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
    if(editingCountry){
      updateCountry(countryForm)
    }else{
      createCountry(countryForm)
    }
     setIsFormOpen(false)
  };
    const createCountry = async (data) => {
      try {
        const response = await apiRequest("Country/CreateCountry", {
          method: 'POST',
          body: JSON.stringify(data),
        });
         toast({ title: "Success", description: "Country Create successfully." });
        getCountry()
        setIsFormOpen(false)
        return response;
      } catch (error) {
        console.error('Error:', error);
        throw error;
      }
    };
   const updateCountry = async(data)=>{
 try {
      const response = await apiRequest("Country/updateCountry", {
        method: 'POST',
        body: JSON.stringify(data),
      });
        toast({ title: "Success", description: "Country updated successfully." });
        getCountry()
       setIsFormOpen(false)
      return response;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
   }
  const handleEdit = (countryData) => {
    setEditingCountry(true);
   setCountryForm({
  countryName: countryData.countryName,
    countryCode: countryData.countryCode,
    isActive: countryData.isActive,
    CountryIDPK: countryData.CountryIDPK,
   })

    // setCountry(countryData);
    setIsFormOpen(true);
  };

  const handleDelete = (id) => {
    // setCategories(prev => prev.filter(cat => cat.id !== categoryId));
    deleteCountry(id)
    // toast({ title: "Deleted", description: "Country has been removed.", variant: "destructive" });
  };

  const openNewDialog = () => {
    setEditingCountry(null);
    setCountryForm(initialFormCountry);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col md:flex-row md:justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3"><Layers size={30} /> Country </h1>
          <p className="text-gray-600 mt-1">Manage the list of Country for session feedback.</p>
        </div>
        {
          Permissions.isAdd && <Button onClick={openNewDialog} className="shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-shadow">
          <PlusCircle size={18} className="mr-2" /> Add New Country
        </Button>
        }
        
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
        <Card className="medical-card">
          <CardHeader>
            <CardTitle>All Country ({country.length})</CardTitle>
            <CardDescription>List of all defined transaction Country.</CardDescription>
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
                  {country.map((count) => (
                    <tr key={count._id} className="border-b hover:bg-gray-50/50 transition-colors">
                      <td className="p-3 font-medium text-gray-800">{count.countryName}</td>
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
                          <Button size="sm" variant="outline" onClick={() => handleEdit(count)}><Edit size={14} /></Button>

                          }
                          {
                              Permissions.isDelete && 
                               <AlertDialog>
                            <AlertDialogTrigger asChild><Button size="sm" variant="destructive"><Trash2 size={14} /></Button></AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>This will permanently delete the Country.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(count.CountryIDPK)}>Delete</AlertDialogAction>
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
            <DialogTitle>{editingCountry ? 'Edit Country' : 'Add New Country'}</DialogTitle>
            <DialogDescription>Define a new Country for tracking transactions.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-6 pt-4">
            <div className="space-y-2">
              <Label htmlFor="countryCode"> Country Code</Label>
              <Input id="countryCode" name="countryCode" value={countryForm.countryCode} onChange={(e)=>{handleChangeCountry(e)}} required placeholder="e.g., CO001" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="countryName"> Country Name</Label>
              <Input id="countryName" name="countryName" value={countryForm.countryName} onChange={handleChangeCountry} required placeholder="e.g., India" />
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
              <RadioGroup name="isActive" value={countryForm.isActive} onValueChange={(val) => handleRadioChange('isActive', val)} className="flex gap-4">
                <div className="flex items-center space-x-2"><RadioGroupItem value={true} id="status-active" /><Label htmlFor="status-active">Active</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value={false} id="status-inactive" /><Label htmlFor="status-inactive">Inactive</Label></div>
              </RadioGroup>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
              <Button type="submit">{editingCountry ? 'Save Changes' : 'Add Country'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Country;
