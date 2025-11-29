 
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
import { apiRequest } from '@/components/CustomComponents/apiRequest'
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const City = () => {
  const navigate = useNavigate();
const [state,setState] = useState([])
  const [city, setCity] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCity, setEditingCity] = useState(null);
  const initialFormCity = { 
    CityCode: '', 
    CityName: '', 
    StateID:'',
    isActive: true,
    // StateName:'',
  };
  const [cityForm, setCityForm] = useState(initialFormCity);
   const { getPermissionsByPath } = useAuth();
      const [Permissions,setPermissions]=useState({isAdd:false,isView:false,isEdit:false,isDelete:false})



  useEffect(() => {
  getState();
}, []);

const getState = async () => {
  try {
    const res = await apiRequest("State/getAllState",
 { 
    method: 'POST',
     body: JSON.stringify({}) 
    });
    setState(res);
  } catch (error) {
    console.error("Error loading countries:", error);
  }
};

  // useEffect(() => {
  //   // fetch('/mockdata/categories.json')
  //   //   .then(res => res.json())
  //   //   .then(data => setCategories(data))
  //   //   .catch(err => console.error('Error loading categories:', err));
  //   getCity()
  // }, []);

    
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
         getCity()
          }
      },[Permissions])
      

    const getCity = async () => {
    try {
      const response = await apiRequest("City/getAllCity", {
        method: 'POST',
        body: JSON.stringify({}),
      });
      setCity(response)
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }
    const deleteCity = async(id)=>{
    try {
        console.log("Deleting ID:", id); 
      const response = await apiRequest("City/deleteCity", {
        method: 'POST',
        body: JSON.stringify({_id:id}),
      });
        toast({ title: "Deleted", description: "City has been removed.", variant: "destructive" });
      getCity();
      return response;
    } catch (error) {0
      console.error('Error:', error);
      throw error;    
    }
  }

  const handleChangeCity = (e) => {
    console.log(e.target.name, e.target.value,e, "e in change ")
    const { name, value } = e.target;
    setCityForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleRadioChange = (name, value) => {
      setCityForm(prev => ({ ...prev, [name]: value }));
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
    if(editingCity){
      updateCity(cityForm)
    }else{
      createCity(cityForm)
    }
     setIsFormOpen(false)
  };
    const createCity = async (data) => {
      try {
        const response = await apiRequest("City/CreateCity", {
          method: 'POST',
          body: JSON.stringify(data),
        });
         toast({ title: "Success", description: "City Create successfully." });
        getCity()
        setIsFormOpen(false)
        return response;
      } catch (error) {
        console.error('Error:', error);
        throw error;
      }
    };
   const updateCity = async(data)=>{
 try {
      const response = await apiRequest("City/updateCity", {
        method: 'POST',
        body: JSON.stringify(data),
      });
        toast({ title: "Success", description: "City updated successfully." });
        getCity()
       setIsFormOpen(false)
      return response;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
   }
  const handleEdit = (CityData) => {
    setEditingCity(true);
   setCityForm({
  CityCode: CityData.CityCode,
  CityName: CityData.CityName,
    isActive: CityData.isActive,
    CityIDPK: CityData.CityIDPK,
    StateID :CityData.StateID,
    // countryName: CityData.countryName
     
   })

    // setCountry(countryData);
    setIsFormOpen(true);
  };

  const handleDelete = (id) => {
    // setCategories(prev => prev.filter(cat => cat.id !== categoryId));
    deleteCity(id)
    // toast({ title: "Deleted", description: "Country has been removed.", variant: "destructive" });
  };

  const openNewDialog = () => {
    setEditingCity(null);
    setCityForm(initialFormCity);
    setIsFormOpen(true);
  };

  return (
    <div className="md:space-y-6 lg:space-y-6 space-y-10">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col sm:flex-row justify-between sm:items-center gap-10">
        <div className='ms-20 md:ms-0 lg:ms-0'>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3"><Layers size={30} /> City </h1>
          {/* <p className="text-gray-600 mt-1">Manage income and expense categories.</p> */}
        </div>
        {
         Permissions.isAdd &&
           <Button onClick={openNewDialog} className="shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-shadow max-w-fit ms-20 md:ms-0 lg:ms-0">
          <PlusCircle size={18} className="mr-2" /> Add New City
        </Button>
        }
        {/* <Button onClick={openNewDialog} className="shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-shadow">
          <PlusCircle size={18} className="mr-2" /> Add New City
        </Button> */}
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
        <Card className="medical-card md:max-w-full lg:max-w-full max-w-full ms-20 md:ms-0 lg:ms-0">
          <CardHeader>
            <CardTitle>All City ({city.length})</CardTitle>
            <CardDescription>List of all defined transaction City.</CardDescription>
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
                  {city.map((cities) => (
                    <tr key={cities._id} className="border-b hover:bg-gray-50/50 transition-colors">
                      <td className="p-3 font-medium text-gray-800">{cities.CityName}</td>
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
                             Permissions.isEdit && <Button size="sm" variant="outline" onClick={() => handleEdit(cities)}><Edit size={14} /></Button>
                          }
                          {/* <Button size="sm" variant="outline" onClick={() => handleEdit(cities)}><Edit size={14} /></Button> */}
                          {
                              Permissions.isDelete &&        <AlertDialog>
                            <AlertDialogTrigger asChild><Button size="sm" variant="destructive"><Trash2 size={14} /></Button></AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>This will permanently delete the City.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(cities.CityIDPK)}>Delete</AlertDialogAction>
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
            <DialogTitle>{editingCity ? 'Edit City' : 'Add New City'}</DialogTitle>
            <DialogDescription>Define a new City for tracking transactions.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-6 pt-4">
            <div className="space-y-2">
              <Label htmlFor="CityCode"> City Code</Label>
              <Input id="CityCode" name="CityCode" value={cityForm.CityCode} onChange={(e)=>{handleChangeCity(e)}} required placeholder="e.g., CT001" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="CityName"> City Name</Label>
              <Input id="CityName" name="CityName" value={cityForm.CityName} onChange={handleChangeCity} required placeholder="e.g., Coimbatore" />
            </div>
             <div className="space-y-2">
  <Label htmlFor="StateID">State</Label>
  <Select
  onValueChange={(v) => setCityForm((prev) => ({ ...prev, StateID: v }))}
  value={cityForm.StateID}
>
  <SelectTrigger>
    <SelectValue placeholder="Select State" />
  </SelectTrigger>
  <SelectContent>
    {state.map((states) => (
      <SelectItem key={states.StateIDPK} value={states.StateIDPK}>
        {states.StateName}
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
              <RadioGroup name="isActive" value={cityForm.isActive} onValueChange={(val) => handleRadioChange('isActive', val)} className="flex gap-4">
                <div className="flex items-center space-x-2"><RadioGroupItem value={true} id="status-active" /><Label htmlFor="status-active">Active</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value={false} id="status-inactive" /><Label htmlFor="status-inactive">Inactive</Label></div>
              </RadioGroup>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
              <Button type="submit">{editingCity ? 'Save Changes' : 'Add City'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default City;
