import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { PlusCircle, Edit, Trash2, FileSearch } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { id } from 'date-fns/locale';
// import { json } from 'stream/consumers';

const ReviewType = () => {
  const navigate = useNavigate()
  const [reviewTypes, setReviewTypes] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const initialReviewType = {
    id: '',
    reviewTypeName: '',
    reviewTypeCode: '',
    isActive: true
  }

  const [reviewTypeData, setReviewTypeData] = useState(initialReviewType);
   const { getPermissionsByPath } = useAuth();
    const [Permissions, setPermissions] = useState({ isAdd: false, isView: false, isEdit: false, isDelete: false })
 

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
         handleGetReviewTypes()
        }
    },[Permissions])


  



  const handleFormSubmit = async (e) => {
    e.preventDefault();


    const createReviewType = async () => {
      try {

        const res = await fetch("http://localhost:8001/api/ReviewType/createReviewType", {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reviewTypeName: reviewTypeData.reviewTypeName, isActive: true, reviewTypeCode: reviewTypeData.reviewTypeCode })
        })
        if (res.ok) {
          const newType = await res.json()
          // setRedFlags([...redFlags, red])
          handleGetReviewTypes()
          setReviewTypeData({
            initialReviewType: ""
          })
          toast({ title: "Success", description: "New review type added." });

        }

      } catch (error) {
        console.log(error)
      }
    }


    if (editingType) {
      updateReviewType(reviewTypeData)
      setReviewTypes(prev => prev.map(type => type.id === editingType.id ? { ...type, name: reviewTypeData.reviewTypeName } : type));
    } else {
      createReviewType(reviewTypeData)
      const newType = { id: Date.now(), name: reviewTypeData.reviewTypeName };
      setReviewTypes(prev => [...prev, newType]);
    }
    setIsFormOpen(false);
    setEditingType(null);
    setReviewTypeData(initialReviewType);
  };
const handleEdit = (type) => {
  setEditingType(type);
  setReviewTypeData({
    _id: type._id || type.ReviewTypeIDPK,   
    reviewTypeName: type.reviewTypeName,
    reviewTypeCode: type.reviewTypeCode,
    isActive: type.isActive
  });
  setIsFormOpen(true);
};


  const handleNew = () => {
    setEditingType(null);
    setReviewTypeData(initialReviewType);
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {

    try {
      const res = await fetch('http://localhost:8001/api/ReviewType/deleteReviewType', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id: id })
      })
      handleGetReviewTypes()
      if (res.ok) {
        // setRedFlags(prev => prev.filter(flag => flag.id !== _id));
        toast({ title: "Deleted", description: "Review Type has been removed.", variant: "destructive" });
      }
    } catch (error) {
      console.log(error)
    }


  };

  const handleGetReviewTypes = async () => {
    try {

      const res = await fetch("http://localhost:8001/api/ReviewType/getAllReviewType", {
        method: 'POST',
        body: JSON.stringify({})
      })
      const result = await res.json()
      setReviewTypes(result)



    } catch (error) {
      console.log(error)
    }

  }
  // useEffect(() => {
  //   handleget()
  // }, [])


  // const updateReviewType = async () => {
  //   try {
  //     const response = await fetch("http://localhost:8001/api/ReviewType/updateReviewType", {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ reviewTypeName: reviewTypeData.reviewTypeName,
  //          isActive: true,
  //           reviewTypeCode: reviewTypeData.reviewTypeCode ,
  //           _id:reviewTypeData.ReviewTypeIDPK })
  //     });
  //     toast({ title: "Success", description: "Category updated successfully." });
  //     handleGetReviewTypes()
  //     setIsFormOpen(false)
  //     return response;
  //   } catch (error) {
  //     console.error('Error:', error);
  //     throw error;
  //   }
  // }
const updateReviewType = async () => {
  try {
    console.log("Updating ReviewType ID:", reviewTypeData._id); // check ID
    const response = await fetch("http://localhost:8001/api/ReviewType/updateReviewType", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        _id: reviewTypeData._id, 
        reviewTypeName: reviewTypeData.reviewTypeName,
        reviewTypeCode: reviewTypeData.reviewTypeCode,
        isActive: reviewTypeData.isActive
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message);

    toast({ title: "Success", description: "Category updated successfully." });
    handleGetReviewTypes();
    setIsFormOpen(false);
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

    const handleChangeReviewType = (e) => {
    const { name, value } = e.target;
    setReviewTypeData(prev => ({ ...prev, [name]: value }));
    }
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex md:flex-row flex-col md:justify-between items-start  space-y-5">
        <div>
          <h1 className="md:text-3xl text-xl font-bold text-gray-800 mb-2">Review Types Master</h1>
          <p className="text-gray-600">Manage the list of review types for session feedback.</p>
        </div>
        {
          Permissions.isAdd && 
            <Button onClick={handleNew}><PlusCircle className="mr-2 h-4 w-4" /> Add Review Type</Button>
        }
      
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}  >
        <Card className="medical-card">
          <CardHeader>
            <CardTitle>Review Types List</CardTitle>
            <CardDescription className=''>These types will appear in the session feedback form.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {reviewTypes.map((type) => (
                <div key={type.ReviewTypeIDPK} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    {/* <Flag className="text-red-500" size={16} /> */}
                    <FileSearch className="text-blue-500" size={16} />
                    <span className="text-gray-800">{type.reviewTypeName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {
                      Permissions.isEdit && 
                       <Button size="sm" variant="outline" onClick={() => handleEdit(type)}><Edit size={14} /></Button>
                    }

                    {
                      Permissions.isDelete && 
                       <AlertDialog>
                      <AlertDialogTrigger asChild><Button size="sm" variant="destructive"><Trash2 size={14} /></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>This action cannot be undone. This will permanently delete the review type.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(type.ReviewTypeIDPK || type._id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    }
                   
                   
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
            <DialogTitle>{editingType ? 'Edit Review Type' : 'Add New Review Type'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="reviewTypeCode">Review Type Code</Label>
              <Input id="reviewTypeCode" name='reviewTypeCode' value={reviewTypeData.reviewTypeCode} onChange={handleChangeReviewType} placeholder="e.g., RT001" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reviewTypeName">Review Type Name</Label>
              <Input id="reviewTypeName" name="reviewTypeName" value={reviewTypeData.reviewTypeName} onChange={handleChangeReviewType}  placeholder="e.g., Severe night pain" required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
              <Button type="submit">{editingType ? 'Save Changes' : 'Add Review Type'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReviewType;