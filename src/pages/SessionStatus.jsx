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

const SessionStatus = () => {
  const navigate = useNavigate();
  const [sessionStatus, setSessionStatus] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSessionStatus, setEditingSessionStatus] = useState(null);
  const initialFormState = {
    sessionStatusName: "",
    sessionStatusCode: "",
    isActive: true,
    sessionStatusColor: "",
    sessionStatusTextColor: "",
  };
  const [sessionStatusForm, setSessionStatusForm] = useState(initialFormState);

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
      getSessionStatus();
    }
  }, [Permissions]);

  const getSessionStatus = async (data) => {
    try {
      const response = await apiRequest("SessionStatus/getAllSessionStatus", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setSessionStatus(response);
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  };
  const deleteSessionStatus = async (id) => {
    try {
      const response = await apiRequest("SessionStatus/deleteSessionStatus", {
        method: "POST",
        body: JSON.stringify({ _id: id }),
      });
      toast({ title: "Deleted", description: response.message, variant: "destructive" });
      getSessionStatus();
      return response;
    } catch (error) {
      toast({ title: "Error", description: error?.message, variant: "destructive" });
      console.error("Error:", error);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setSessionStatusForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRadioChange = (name, value) => {
    setSessionStatusForm((prev) => ({ ...prev, [name]: value }));
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
    if (editingSessionStatus) {
      updateSessionStatus(sessionStatusForm);
    } else {
      createSessionStatus(sessionStatusForm);
    }
    // setOpen(false);
  };
  const createSessionStatus = async (data) => {
    try {
      const response = await apiRequest("SessionStatus/createSessionStatus", {
        method: "POST",
        body: JSON.stringify(data),
      });
      toast({ title: "Success", description: response.message });
      getSessionStatus();
      setIsFormOpen(false);
      return response;
    } catch (error) {
      toast({ title: "Error", description: error?.message, variant: "destructive" });
      console.error("Error:", error);
    }
  };
  const updateSessionStatus = async (data) => {
    try {
      const response = await apiRequest("SessionStatus/updateSessionStatus", {
        method: "POST",
        body: JSON.stringify(data),
      });
      toast({ title: "Success", description: response.message });
      getSessionStatus();
      setIsFormOpen(false);
      return response;
    } catch (error) {
      toast({ title: "Error", description: error?.message, variant: "destructive" });
      console.error("Error:", error);
    }
  };
  const handleEdit = (session) => {
    setEditingSessionStatus(session);
    setSessionStatusForm(session);
    setIsFormOpen(true);
  };

  const handleDelete = (id) => {
    deleteSessionStatus(id);
  };

  const openNewDialog = () => {
    setEditingSessionStatus(null);
    setSessionStatusForm(initialFormState);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6 ">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:justify-between items-start gap-4"
      >
        <div>
          <h1 className="md:text-3xl text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Layers size={30} /> Session Status
          </h1>
          <p className="text-gray-600 mt-1">Manage Session Status.</p>
        </div>
        {Permissions.isAdd && (
          <Button
            onClick={openNewDialog}
            className="shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-shadow"
          >
            <PlusCircle size={18} className="mr-2" /> Add New Session Status
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
              All Session Status ({sessionStatus.length})
            </CardTitle>
            <CardDescription>
              List of all defined transaction Session status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="table-responsive-wrapper">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold text-gray-600">
                      Session Status Color
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-600">
                      Session Status Text Color
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-600">
                      Session Status Name
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-600">
                      {" "}
                      Status
                    </th>
                    {/* <th className="text-left p-3 font-semibold text-gray-600">Status</th> */}
                    <th className="text-right p-3 font-semibold text-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sessionStatus.map((session) => (
                    <tr
                      key={session._id}
                      className="border-b hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="p-3">
                        <input
                          type="color"
                          value={session.sessionStatusColor}
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="color"
                          value={session.sessionStatusTextColor || "#ffffff"}
                        />
                      </td>
                      <td className="p-3 font-medium text-gray-800">
                        {session.sessionStatusName}
                      </td>

                      <td className="p-3">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${session.isActive ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}`}
                        >
                          {session.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-2">
                          {Permissions.isEdit && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(session)}
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
                                    This will permanently delete the Session
                                    Status.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(session._id)}
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

        {/* //card for mobile view  */}
        <Card className="medical-card md:hidden">
          <CardHeader>
            <CardTitle className="text-lg md:text-2xl">
              All Session Status ({sessionStatus.length})
            </CardTitle>
            <CardDescription>
              List of all defined transaction Session status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* GRID CARD LAYOUT */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sessionStatus.map((session) => (
                <div
                  key={session._id}
                  className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition"
                >
                  {/* Color Pickers Row */}
                  <div className="flex items-center justify-start gap-4 mb-3">
                    <input type="color" value={session.sessionStatusColor} />
                    <input
                      type="color"
                      value={session.sessionStatusTextColor || "#ffffff"}
                    />
                  </div>

                  {/* Status Name */}
                  <h2 className="text-lg font-semibold text-gray-800">
                    {session.sessionStatusName}
                  </h2>

                  {/* Active / Inactive Badge */}
                  <div className="mt-2">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        session.isActive
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {session.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-start gap-2 mt-4">
                    {Permissions.isEdit && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(session)}
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
                              This will permanently delete the Session Status.
                            </AlertDialogDescription>
                          </AlertDialogHeader>

                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(session._id)}
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
              {editingSessionStatus
                ? "Edit SessionStatus"
                : "Add New SessionStatus"}
            </DialogTitle>
            <DialogDescription>
              Define a new Session Status for tracking transactions.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-6 pt-4">
            <div className="gap-10 grid grid-cols-2">
              <div>
                <Label htmlFor="sessionStatusColor">
                  {" "}
                  Session Status Color
                </Label>
                <Input
                  type="color"
                  id="sessionStatusColor"
                  name="sessionStatusColor"
                  value={sessionStatusForm.sessionStatusColor}
                  onChange={handleFormChange}
                  required
                  className="max-w-sm "
                />
              </div>
              <div>
                <Label htmlFor="sessionStatusTextColor">
                  {" "}
                  Session Status Text Color
                </Label>
                <Input
                  type="color"
                  id="sessionStatusTextColor"
                  name="sessionStatusTextColor"
                  value={sessionStatusForm.sessionStatusTextColor}
                  onChange={handleFormChange}
                  required
                  className="max-w-sm "
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sessionStatusCode"> Session Status Code</Label>
              <Input
                id="sessionStatusCode"
                name="sessionStatusCode"
                value={sessionStatusForm.sessionStatusCode}
                onChange={handleFormChange}
                required
                placeholder="e.g., ST001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sessionStatusName"> Session Status Name</Label>
              <Input
                id="sessionStatusName"
                name="sessionStatusName"
                value={sessionStatusForm.sessionStatusName}
                onChange={handleFormChange}
                required
                placeholder="e.g., compeleted"
              />
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
              <RadioGroup
                name="isActive"
                value={sessionStatusForm.isActive}
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
                {editingSessionStatus ? "Save Changes" : "Add SessionStatus"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SessionStatus;
