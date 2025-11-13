
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Share2, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { apiRequest } from '@/components/CustomComponents/apiRequest';

const ReferenceMaster = () => {
  const [references, setReferences] = useState([]);
  console.log(references)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReference, setEditingReference] = useState(null);
  const initialFormState = {

    _id:'',
    sourceName: '',
    commissionValue: '',
    commissionCategory: '',
    commissionType: ' ',
    CommissionPercentage: '',
    commissionAmount: ''
  };
  const [referenceForm, setReferenceForm] = useState(initialFormState);
  // console.log(referenceForm)

  // useEffect(() => {
  //   fetch('/mockdata/references.json')
  //     .then(res => res.json())
  //     .then(data => {
  //       // Adapt old data structure for backward compatibility
  //       const adaptedData = data.map(ref => {
  //           if (typeof ref.commission === 'number') {
  //               return {
  //                   ...ref,
  //                   commissionCategory: 'patient',
  //                   commissionType: 'percentage',
  //                   commissionValue: ref.commission
  //               }
  //           }
  //           return ref;
  //       });
  //       setReferences(adaptedData);
  //     })
  //     .catch(err => console.error('Error loading references:', err));
  // }, []);


  //api for getAllReference

  useEffect(() => {
    getAllReference()
  }, [])
  const getAllReference = async (data) => {
    try {
      const res = await apiRequest("References/getALLReferences",
        {
          method: 'POST',
          body: JSON.stringify(data)
        });
      setReferences(res);
     

    } catch (error) {
      console.error("not able to getall Reference:", error);
    }
  };

  //api for create Reference
  const createReference = async (data) => {
    try {
      const res = await apiRequest("References/createReferences",
        {
          method: 'POST',
          body: JSON.stringify(data)
        });
      getAllReference()
    } catch (error) {
      console.error("Not able to Create Reference:", error);
    }
  };

  //api for update the Reference
  const updateReference = async (data) => {
    try {
      const res = await apiRequest("References/updateReferences",
        {
          method: 'POST',
          body: JSON.stringify(data)
        });
   
      getAllReference()
    } catch (error) {
      console.error("Not able to update Reference:", error);
    }
  };


  //api for delete
  const deleteReference = async (id) => {
    try {
      
      const response = await apiRequest("References/deleteReferences", {
        method: 'POST',
        body: JSON.stringify({ _id: id }),
      });
      toast({ title: "Deleted", description: "Reference has been removed.", variant: "destructive" });
      getAllReference()
      return response;
    } catch (error) {

      console.error('Error:', error);
      throw error;
    }
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setReferenceForm(prev => ({ ...prev, [name]: value }));
  };

  const handleRadioChange = (name, value) => {
    setReferenceForm(prev => ({ ...prev, [name]: value }));
  }

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const newReferenceData = {
      ...referenceForm,
      commissionValue: parseFloat(referenceForm.commissionValue)
    };

    if (editingReference) {
      // setReferences(prev => prev.map(ref => ref._id === editingReference._id ? { ...ref, ...newReferenceData } : ref));
      updateReference(referenceForm)
      toast({ title: "Success", description: "Reference source updated." });
    } else {
      // const newReference = { _id: Date.now(), ...newReferenceData };
      // setReferences(prev => [newReference, ...prev]);
      createReference(referenceForm)
      toast({ title: "Success", description: "New reference source added." });
    }
    setIsFormOpen(false);
    setEditingReference(null);
    setReferenceForm(initialFormState);
  };



  

  const handleEdit = (reference) => {
        

    setEditingReference(true);
    setReferenceForm({
      // name: reference.name,
      // commissionValue: reference.commissionValue.toString(),
      // commissionCategory: reference.commissionCategory || 'patient',
      // commissionType: reference.commissionType || 'percentage'
       _id:reference._id?reference._id : null,
      sourceName: reference.sourceName ? reference.sourceName : null,
      commissionCategory: reference.commissionCategory? reference.commissionCategory:null,
      commissionType: reference.commissionType? reference.commissionType:null,
      CommissionPercentage: reference.CommissionPercentage ? reference.CommissionPercentage : null,
      commissionAmount: reference.commissionAmount ? reference.commissionAmount : null
    });
    setIsFormOpen(true);
  };

  const handleDelete = (id) => {
    // setReferences(prev => prev.filter(ref => ref.id !== Id));
    deleteReference(id)
     
  };

  const openNewDialog = () => {
    setEditingReference(null);
    setReferenceForm(initialFormState);
    setIsFormOpen(true);
  };

  const getCommissionDisplay = (ref) => {
    const category = ref.commissionCategory === 'patient' ? 'Per Patient' : 'Per Session';
    const value = ref.commissionType === 'percentage' ? `${ref.CommissionPercentage}%` : `₹${ref.commissionAmount}`;
    return `${value} (${category})`;
  }

  

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3"><Share2 size={30} /> Reference Master</h1>
          <p className="text-gray-600 mt-1">Manage all referral sources and their commission rates.</p>
        </div>
        <Button onClick={openNewDialog} className="shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-shadow">
          <PlusCircle size={18} className="mr-2" /> Add New Reference
        </Button>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
        <Card className="medical-card">
          <CardHeader>
            <CardTitle>Reference Sources ({references.length})</CardTitle>
            <CardDescription>List of all registered referral sources.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="table-responsive-wrapper">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold text-gray-600">Source Name</th>
                    <th className="text-left p-3 font-semibold text-gray-600">Commission Details</th>
                    <th className="text-right p-3 font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {references.map((ref) => (
                    <tr key={ref._id} className="border-b hover:bg-gray-50/50 transition-colors">
                      <td className="p-3 font-medium text-gray-800">{ref.sourceName}</td>
                      <td className="p-3 text-gray-600">{getCommissionDisplay(ref)}</td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(ref)}><Edit size={14} /></Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild><Button size="sm" variant="destructive"><Trash2 size={14} /></Button></AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>This will permanently delete the reference source.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(ref._id)}>Delete</AlertDialogAction>
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingReference ? 'Edit Reference Source' : 'Add New Reference Source'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-6 pt-4">
            <div className="space-y-2">
              <Label htmlFor="sourceName">Source Name</Label>
              <Input id="sourceName" name="sourceName" value={referenceForm.sourceName} onChange={handleFormChange} required placeholder="e.g., Dr. Smith" />
            </div>

            <div className="space-y-3">
              <Label>Commission Category</Label>
              {/* <RadioGroup name="commissionCategory" value={referenceForm.commissionCategory} onValueChange={(val) => handleRadioChange('commissionCategory', val)} className="flex gap-4">
                <div className="flex items-center space-x-2"><RadioGroupItem value="patient" id="cat-patient" /><Label htmlFor="cat-patient">Per Patient</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="session" id="cat-session" /><Label htmlFor="cat-session">Per Session</Label></div>
              </RadioGroup> */}
              <RadioGroup name="commissionCategory" value={referenceForm.commissionCategory} onValueChange={(val) => handleRadioChange('commissionCategory', val)} className="flex gap-4">
                <div className="flex items-center space-x-2"><RadioGroupItem value="perPatient" id="perPatient" /><Label htmlFor="perPatient">Per Patient</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="perSession" id="perSession" /><Label htmlFor="perSession">Per Session</Label></div>
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label>Commission Type</Label>
              <RadioGroup name="commissionType" value={referenceForm.commissionType} onValueChange={(val) => handleRadioChange('commissionType', val)} className="flex gap-4">
                <div className="flex items-center space-x-2"><RadioGroupItem value="percentage" id="percentage" /><Label htmlFor="percentage">Percentage (%)</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="rupees" id="rupees" /><Label htmlFor="rupees">Rupees (₹)</Label></div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor={'percentage'? 'CommissionPercentage' :'commissionAmount'}>
                Commission Value ({referenceForm.commissionType === 'percentage' ? '%' : '₹'})
              </Label>
              {
                referenceForm.commissionType === 'percentage' ? 
              <Input id="CommissionPercentage" name="CommissionPercentage" type="number" step="0.01" min="0" value={referenceForm.CommissionPercentage} onChange={handleFormChange} required placeholder= "e.g., 15" /> :
              <Input id="commissionAmount" name="commissionAmount" type="number" step="0.01" min="0" value={referenceForm.commissionAmount} onChange={handleFormChange} required placeholder="e.g., 500"/>

              }
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
              <Button type="submit">{editingReference ? 'Save Changes' : 'Add Source'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReferenceMaster;
