 
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Layers, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '@/components/CustomComponents/apiRequest'

const State = () => {
  navigate = useNavigate()
const [countries,setCountries] = useState([])
  const [state, setState] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingState, setEditingState] = useState(null);
  const initialFormState = { 
    StateName: '', 
    StateCode: '', 
    CountryId:'',
    isActive: true,
    countryName:'',
  };
  const [stateForm, setStateForm] = useState(initialFormState);
  const { getPermissionsByPath } = useAuth();
    const [Permissions, setPermissions] = useState({ isAdd: false, isView: false, isEdit: false, isDelete: false })
    // console.log(Permissions,"Permissions")



  useEffect(() => {
  getCountries();
}, []);

const getCountries = async () => {
  try {
    const res = await apiRequest("Country/getAllCountry",
 { 
    method: 'POST',
     body: JSON.stringify({}) 
    });
    setCountries(res);
  } catch (error) {
    console.error("Error loading countries:", error);
  }
};
 
      
   
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
          getState()
        }
    },[Permissions])


    const getState = async (data) => {
    try {
      const response = await apiRequest("State/getAllState", {
        method: 'POST',
        body: JSON.stringify(data),
      });
      setState(response)
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }
    const deleteState = async(id)=>{
    try {
        console.log("Deleting ID:", id); 
      const response = await apiRequest("State/deleteState", {
        method: 'POST',
        body: JSON.stringify({_id:id}),
      });
        toast({ title: "Deleted", description: "State has been removed.", variant: "destructive" });
      getState();
      return response;
    } catch (error) {0
      console.error('Error:', error);
      throw error;    
    }
  }

  const handleChangeState = (e) => {
    console.log(e.target.name, e.target.value,e, "e in change ")
    const { name, value } = e.target;
    setStateForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleRadioChange = (name, value) => {
      setStateForm(prev => ({ ...prev, [name]: value }));
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
    if(editingState){
      updateState(stateForm)
    }else{
      createState(stateForm)
    }
     setIsFormOpen(false)
  };
    const createState = async (data) => {
      try {
        const response = await apiRequest("State/CreateState", {
          method: 'POST',
          body: JSON.stringify(data),
        });
         toast({ title: "Success", description: "State Create successfully." });
        getState()
        setIsFormOpen(false)
        return response;
      } catch (error) {
        console.error('Error:', error);
        throw error;
      }
    };
   const updateState = async(data)=>{
 try {
      const response = await apiRequest("State/updateState", {
        method: 'POST',
        body: JSON.stringify(data),
      });
        toast({ title: "Success", description: "State updated successfully." });
        getState()
       setIsFormOpen(false)
      return response;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
   }
  const handleEdit = (StateData) => {
    setEditingState(true);
   setStateForm({
  StateName: StateData.StateName,
    StateCode: StateData.StateCode,
    isActive: StateData.isActive,
    StateIDPK: StateData.StateIDPK,
    CountryId :StateData.CountryId,
    countryName: StateData.countryName?StateData.countryName:null
     
   })

    // setCountry(countryData);
    setIsFormOpen(true);
  };

  const handleDelete = (id) => {
    // setCategories(prev => prev.filter(cat => cat.id !== categoryId));
    deleteState(id)
    // toast({ title: "Deleted", description: "Country has been removed.", variant: "destructive" });
  };

  const openNewDialog = () => {
    setEditingState(null);
    setStateForm(initialFormState);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3"><Layers size={30} /> State </h1>
          {/* <p className="text-gray-600 mt-1">Manage income and expense categories.</p> */}
        </div>
        {
          Permissions.isAdd && 
           <Button onClick={openNewDialog} className="shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-shadow">
          <PlusCircle size={18} className="mr-2" /> Add New State
        </Button>
        }
       
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
        <Card className="medical-card">
          <CardHeader>
            <CardTitle>All State ({state.length})</CardTitle>
            <CardDescription>List of all defined transaction State.</CardDescription>
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
                  {state.map((states) => (
                    <tr key={states._id} className="border-b hover:bg-gray-50/50 transition-colors">
                      <td className="p-3 font-medium text-gray-800">{states.StateName}</td>
                      {/* <td className="p-3 font-medium text-gray-800">{states.CountryId}</td> */}
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
                          <Button size="sm" variant="outline" onClick={() => handleEdit(states)}><Edit size={14} /></Button>

                          }
                          {
                            Permissions.isDelete && 
                                   <AlertDialog>
                            <AlertDialogTrigger asChild><Button size="sm" variant="destructive"><Trash2 size={14} /></Button></AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>This will permanently delete the State.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(states.StateIDPK)}>Delete</AlertDialogAction>
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
            <DialogTitle>{editingState ? 'Edit State' : 'Add New State'}</DialogTitle>
            <DialogDescription>Define a new State for tracking transactions.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-6 pt-4">
            <div className="space-y-2">
              <Label htmlFor="StateCode"> State Code</Label>
              <Input id="StateCode" name="StateCode" value={stateForm.StateCode} onChange={(e)=>{handleChangeState(e)}} required placeholder="e.g., ST001" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="StateName"> State Name</Label>
              <Input id="StateName" name="StateName" value={stateForm.StateName} onChange={handleChangeState} required placeholder="e.g., TamilNadu" />
            </div>
             <div className="space-y-2">
  <Label htmlFor="CountryId">Country</Label>
  <Select
  onValueChange={(v) => setStateForm((prev) => ({ ...prev, CountryId: v }))}
  value={stateForm.CountryId}
>
  <SelectTrigger>
    <SelectValue placeholder="Select Country" />
  </SelectTrigger>
  <SelectContent>
    {countries.map((country) => (
      <SelectItem key={country.CountryIDPK} value={country.CountryIDPK}>
        {country.countryName}
      </SelectItem>
    ))}
  </SelectContent>
</Select>

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
              <RadioGroup name="isActive" value={stateForm.isActive} onValueChange={(val) => handleRadioChange('isActive', val)} className="flex gap-4">
                <div className="flex items-center space-x-2"><RadioGroupItem value={true} id="status-active" /><Label htmlFor="status-active">Active</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value={false} id="status-inactive" /><Label htmlFor="status-inactive">Inactive</Label></div>
              </RadioGroup>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
              <Button type="submit">{editingState ? 'Save Changes' : 'Add State'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default State;
