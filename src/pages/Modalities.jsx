import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Layers, PlusCircle, Edit, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "@/components/CustomComponents/apiRequest";

const FeesType = () => {
  const navigate = useNavigate();
  const [modalities, setModalities] = useState([]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingModalities, setEditingModalities] = useState(null);
  const initialFormState = {
    modalitiesName: "",
    modalitiesCode: "",
    modalitiestype: "",
    isActive: true,
  };
  const [modalitiesForm, setModalitiesForm] = useState(initialFormState);

  const { getPermissionsByPath } = useAuth();
  const [Permissions, setPermissions] = useState({
    isAdd: false,
    isView: false,
    isEdit: false,
    isDelete: false,
  });
  useEffect(() => {
    getPermissionsByPath(window.location.pathname).then((res) => {
      if (res) {
        setPermissions(res);
      } else {
        navigate("/dashboard");
      }
    });
  }, []);

  useEffect(() => {
    if (Permissions.isView) {
      getModalities();
    }
  }, [Permissions]);

  const getModalities = async (data) => {
    try {
      const response = await apiRequest("Modalities/getAllModalities", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setModalities(response);
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  };
  const deleteModalities = async (id) => {
    try {
      const response = await apiRequest("Modalities/deleteModalities", {
        method: "POST",
        body: JSON.stringify({ _id: id }),
      });
      toast({ title: "Deleted", description: response.message, variant: "destructive" });
      getModalities();
      return response;
    } catch (error) {
      toast({ title: "Error", description: error?.message, variant: "destructive" });
      console.error("Error:", error);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setModalitiesForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRadioChange = (name, value) => {
    setModalitiesForm((prev) => ({ ...prev, [name]: value }));
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
    if (editingModalities) {
      updateModalities(modalitiesForm);
    } else {
      createModalities(modalitiesForm);
    }
    // setOpen(false);
  };
  const createModalities = async (data) => {
    try {
      const response = await apiRequest("Modalities/createModalities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (response.message?.includes("already exists")) {
        throw new Error(response.message);
      }

      toast({
        title: "Success",
        description: response.message,
      });

      getModalities();
      setIsFormOpen(false);
      return response;
    } catch (error) {
      console.error("Error:", error);

      toast({
        title: "Error",
        description: error?.message,
        variant: "destructive",
      });

      return null;
    }
  };

  const updateModalities = async (data) => {
    try {
      const response = await apiRequest("Modalities/updateModalities", {
        method: "POST",
        body: JSON.stringify(data),
      });
      toast({ title: "Success", description: response.message });
      getModalities();
      setIsFormOpen(false);
      return response;
    } catch (error) {
      toast({ title: "Error", description: error?.message, variant: "destructive" });
      console.error("Error:", error);
    }
  };
  const handleEdit = (modalities) => {
    setEditingModalities(modalities);
    setModalitiesForm(modalities);
    setIsFormOpen(true);
  };

  const handleDelete = (id) => {
    deleteModalities(id);
  };

  const openNewDialog = () => {
    setEditingModalities(null);
    setModalitiesForm(initialFormState);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:justify-between items-start gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Layers size={30} /> Modalities{" "}
          </h1>
          <p className="text-gray-600 mt-1">Manage Modalities.</p>
        </div>
        {Permissions.isAdd && (
          <Button
            onClick={openNewDialog}
            className="shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-shadow"
          >
            <PlusCircle size={18} className="mr-2" /> Add New Modalities
          </Button>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="medical-card hidden md:block">
          <CardHeader>
            <CardTitle className="text-lg md:text-2xl">
              All Modalities ({modalities.length})
            </CardTitle>
            <CardDescription>
              List of all defined transaction Modalities.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="table-responsive-wrapper">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold text-gray-600">
                      Modalities Name
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-600">
                      Modalities Type
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-600">
                      Status
                    </th>

                    {/* <th className="text-left p-3 font-semibold text-gray-600">Status</th> */}
                    <th className="text-right p-3 font-semibold text-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {modalities.map((mod) => (
                    <tr
                      key={mod._id}
                      className="border-b hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="p-3 font-medium text-gray-800">
                        {mod.modalitiesName}
                      </td>
                      {/* <td className="p-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${cat.ExpenseCategoryType === 'Income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {cat.ExpenseCategoryType}
                        </span>
                      </td> */}
                      <td className="p-3 font-medium text-gray-800">
                        {mod.modalitiestype}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${mod.isActive ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}`}
                        >
                          {mod.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-2">
                          {Permissions.isEdit && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(mod)}
                            >
                              <Edit size={14} />
                            </Button>
                          )}

                          {Permissions.isDelete && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="destructive">
                                  <Trash2 size={14} />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Are you sure?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete the Modalities.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(mod._id)}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* //card for mobile view */}
        <Card className="medical-card md:hidden">
          <CardHeader>
            <CardTitle className="text-lg md:text-2xl">
              All Modalities ({modalities.length})
            </CardTitle>
            <CardDescription>
              List of all defined transaction Modalities.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {modalities.map((mod) => (
                <div
                  key={mod._id}
                  className="border rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition"
                >
                  {/* Title */}
                  <h3 className="text-lg font-semibold text-gray-900">
                    {mod.modalitiesName}
                  </h3>

                  {/* Status */}
                  <p className="mt-2">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        mod.isActive
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {mod.isActive ? "Active" : "Inactive"}
                    </span>
                  </p>

                  {/* Actions */}
                  <div className="flex items-center justify-start gap-2 mt-4">
                    {Permissions.isEdit && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(mod)}
                        className="flex items-center gap-1"
                      >
                        <Edit size={14} />
                      </Button>
                    )}

                    {Permissions.isDelete && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive">
                            <Trash2 size={14} />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the modality.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(mod._id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingModalities ? "Edit Modalities" : "Add New Modalities"}
            </DialogTitle>
            <DialogDescription>
              Define a new Modalities for tracking transactions.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-6 pt-4">
            <div className="space-y-2">
              <Label htmlFor="modalitiesCode">
                {" "}
                Modalities Code<span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="modalitiesCode"
                name="modalitiesCode"
                value={modalitiesForm.modalitiesCode}
                onChange={handleFormChange}
                required
                placeholder="e.g., MD001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modalitiesName">
                {" "}
                Modalities Name<span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="modalitiesName"
                name="modalitiesName"
                value={modalitiesForm.modalitiesName}
                onChange={handleFormChange}
                required
                placeholder="e.g., TENS"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modalitiestype">
                {" "}
                Modalities Type<span className="text-red-500 ml-1">*</span>
              </Label>

              <Select
                value={modalitiesForm.modalitiestype}
                onValueChange={(val) =>
                  setModalitiesForm((prev) => ({
                    ...prev,
                    modalitiestype: val,
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Modalities Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Exercise Therapy">
                    Exercise Therapy
                  </SelectItem>
                  <SelectItem value="Electrotherapy">Electrotherapy</SelectItem>
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
              <Label>
                Status<span className="text-red-500 ml-1">*</span>
              </Label>
              <RadioGroup
                name="isActive"
                value={modalitiesForm.isActive}
                onValueChange={(val) => handleRadioChange("isActive", val)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={true} id="status-active" />
                  <Label htmlFor="status-active">Active</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={false} id="status-inactive" />
                  <Label htmlFor="status-inactive">Inactive</Label>
                </div>
              </RadioGroup>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingModalities ? "Save Changes" : "Add Modalities"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FeesType;
