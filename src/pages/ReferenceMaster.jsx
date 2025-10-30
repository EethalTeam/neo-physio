
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

const ReferenceMaster = () => {
  const [references, setReferences] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReference, setEditingReference] = useState(null);
  const initialFormState = { 
    name: '', 
    commissionValue: '',
    commissionCategory: 'patient',
    commissionType: 'percentage'
  };
  const [referenceForm, setReferenceForm] = useState(initialFormState);

  useEffect(() => {
    fetch('/mockdata/references.json')
      .then(res => res.json())
      .then(data => {
        // Adapt old data structure for backward compatibility
        const adaptedData = data.map(ref => {
            if (typeof ref.commission === 'number') {
                return {
                    ...ref,
                    commissionCategory: 'patient',
                    commissionType: 'percentage',
                    commissionValue: ref.commission
                }
            }
            return ref;
        });
        setReferences(adaptedData);
      })
      .catch(err => console.error('Error loading references:', err));
  }, []);

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
      setReferences(prev => prev.map(ref => ref.id === editingReference.id ? { ...ref, ...newReferenceData } : ref));
      toast({ title: "Success", description: "Reference source updated." });
    } else {
      const newReference = { id: Date.now(), ...newReferenceData };
      setReferences(prev => [newReference, ...prev]);
      toast({ title: "Success", description: "New reference source added." });
    }
    setIsFormOpen(false);
    setEditingReference(null);
    setReferenceForm(initialFormState);
  };

  const handleEdit = (reference) => {
    setEditingReference(reference);
    setReferenceForm({ 
        name: reference.name, 
        commissionValue: reference.commissionValue.toString(),
        commissionCategory: reference.commissionCategory || 'patient',
        commissionType: reference.commissionType || 'percentage'
    });
    setIsFormOpen(true);
  };

  const handleDelete = (referenceId) => {
    setReferences(prev => prev.filter(ref => ref.id !== referenceId));
    toast({ title: "Deleted", description: "Reference source has been removed.", variant: "destructive" });
  };

  const openNewDialog = () => {
    setEditingReference(null);
    setReferenceForm(initialFormState);
    setIsFormOpen(true);
  };

  const getCommissionDisplay = (ref) => {
    const category = ref.commissionCategory === 'patient' ? 'Per Patient' : 'Per Session';
    const value = ref.commissionType === 'percentage' ? `${ref.commissionValue}%` : `₹${ref.commissionValue}`;
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
                    <tr key={ref.id} className="border-b hover:bg-gray-50/50 transition-colors">
                      <td className="p-3 font-medium text-gray-800">{ref.name}</td>
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
                                <AlertDialogAction onClick={() => handleDelete(ref.id)}>Delete</AlertDialogAction>
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
              <Label htmlFor="name">Source Name</Label>
              <Input id="name" name="name" value={referenceForm.name} onChange={handleFormChange} required placeholder="e.g., Dr. Smith" />
            </div>
            
            <div className="space-y-3">
              <Label>Commission Category</Label>
              <RadioGroup name="commissionCategory" value={referenceForm.commissionCategory} onValueChange={(val) => handleRadioChange('commissionCategory', val)} className="flex gap-4">
                <div className="flex items-center space-x-2"><RadioGroupItem value="patient" id="cat-patient" /><Label htmlFor="cat-patient">Per Patient</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="session" id="cat-session" /><Label htmlFor="cat-session">Per Session</Label></div>
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label>Commission Type</Label>
              <RadioGroup name="commissionType" value={referenceForm.commissionType} onValueChange={(val) => handleRadioChange('commissionType', val)} className="flex gap-4">
                <div className="flex items-center space-x-2"><RadioGroupItem value="percentage" id="type-percentage" /><Label htmlFor="type-percentage">Percentage (%)</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="rupees" id="type-rupees" /><Label htmlFor="type-rupees">Rupees (₹)</Label></div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="commissionValue">
                Commission Value ({referenceForm.commissionType === 'percentage' ? '%' : '₹'})
              </Label>
              <Input id="commissionValue" name="commissionValue" type="number" step="0.01" min="0" value={referenceForm.commissionValue} onChange={handleFormChange} required placeholder={referenceForm.commissionType === 'percentage' ? "e.g., 15" : "e.g., 500"} />
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
