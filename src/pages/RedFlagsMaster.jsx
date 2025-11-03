import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { PlusCircle, Edit, Trash2, Flag } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
// import { json } from 'stream/consumers';

const RedFlagsMaster = () => {
  const [redFlags, setRedFlags] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFlag, setEditingFlag] = useState(null);
  const [flagName, setFlagName] = useState({
    flagdescription: ""
  });

  console.log(redFlags)

  // useEffect(() => {
  //   fetch('/mockdata/redflags.json')
  //     .then(res => res.json())
  //     .then(data => setRedFlags(data))
  //     .catch(err => console.error('Error loading red flags:', err));
  // }, []);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    console.log(flagName)
    try {

      const res = await fetch("http://localhost:8001/api/Redflag/createRedflag", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({redflagName :flagName,isActive:true,redflagCode:"rf001"})
      })
      if (res.ok) {
        const red = await res.json()
        setRedFlags([...redFlags, red])
        setFlagName({
          flagdescription: ""
        })
      }

    } catch (error) {
      console.log(error)
    }

    if (editingFlag) {
      setRedFlags(prev => prev.map(flag => flag.id === editingFlag.id ? { ...flag, name: flagName } : flag));
      toast({ title: "Success", description: "Red flag updated." });
    } else {
      const newFlag = { id: Date.now(), name: flagName };
      setRedFlags(prev => [...prev, newFlag]);
      toast({ title: "Success", description: "New red flag added." });
    }
    setIsFormOpen(false);
    setEditingFlag(null);
    setFlagName('');
  };

  const handleEdit = (flag) => {
    setEditingFlag(flag);
    setFlagName(flag.name);
    setIsFormOpen(true);
  };

  const handleNew = () => {
    setEditingFlag(null);
    setFlagName('');
    setIsFormOpen(true);
  };

  const handleDelete = async (flagId) => {
   
    try {
      const res = await fetch(`http://localhost:8001/api/Redflag/deleteRedflag/${flagId}`, {
        method: 'DELETE'
      })
      if (!res.ok) {
        setRedFlags(prev => prev.filter(flag => flag.id !== flagId));
        toast({ title: "Deleted", description: "Red flag has been removed.", variant: "destructive" });
      }
    } catch (error) {
      console.log(error)
    }


  };

  const handleget = async () => {
    try {
    
      const res = await fetch("http://localhost:8001/api/Redflag/getAllRedflag",{
        method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body : JSON.stringify({})
      })
      const result=await res.json()
      setRedFlags(result)

      

    } catch (error) {
      console.log(error)
    }
  
  }
     useEffect(() => {
    handleget()
  }, [])


 

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Red Flags Master</h1>
          <p className="text-gray-600">Manage the list of red flags for session feedback.</p>
        </div>
        <Button onClick={handleNew}><PlusCircle className="mr-2 h-4 w-4" /> Add Red Flag</Button>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
        <Card className="medical-card">
          <CardHeader>
            <CardTitle>Red Flags List</CardTitle>
            <CardDescription>These flags will appear in the session feedback form.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {redFlags.map((flag) => (
                <div key={flag.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <Flag className="text-red-500" size={16} />
                    <span className="text-gray-800">{flag.redflagName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(flag)}><Edit size={14} /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button size="sm" variant="destructive"><Trash2 size={14} /></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>This action cannot be undone. This will permanently delete the red flag.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(flag.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFlag ? 'Edit Red Flag' : 'Add New Red Flag'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="flagName">Flag Description</Label>
              <Input id="flagName" value={flagName} onChange={(e) => setFlagName(e.target.value)} placeholder="e.g., Severe night pain" required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
              <Button type="submit">{editingFlag ? 'Save Changes' : 'Add Flag'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RedFlagsMaster;