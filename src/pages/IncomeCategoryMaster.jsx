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

// Income Category Master - manages the Income-typed rows of the shared
// ExpenseCategory master collection (single source of truth, no duplicate
// master). Expense-typed rows are managed from the Expense Category
// page (/categories).
const IncomeCategoryMaster = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const initialFormState = {
    ExpenseCategoryName: "",
    ExpenseCategoryCode: "",
    ExpenseCategoryType: "Income",
    isActive: true,
  };
  const [categoryForm, setCategoryForm] = useState(initialFormState);

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
      getIncomeCategory();
    }
  }, [Permissions]);

  const getIncomeCategory = async () => {
    try {
      const response = await apiRequest(
        "ExpenseCategory/getAllExpenseCategory",
        {
          method: "POST",
          body: JSON.stringify({}),
        },
      );
      const list = Array.isArray(response) ? response : [];
      setCategories(list.filter((c) => c.ExpenseCategoryType === "Income"));
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  };
  const deleteIncomeCategory = async (id) => {
    try {
      const response = await apiRequest(
        "ExpenseCategory/deleteExpenseCategory",
        {
          method: "POST",
          body: JSON.stringify({ _id: id }),
        },
      );
      toast({
        title: "Deleted",
        description: response.message,
        variant: "destructive",
      });
      getIncomeCategory();
      return response;
    } catch (error) {
      toast({
        title: "Error",
        description: error?.message,
        variant: "destructive",
      });
      console.error("Error:", error);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setCategoryForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRadioChange = (name, value) => {
    setCategoryForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    // this master only creates/edits Income-typed categories
    const data = { ...categoryForm, ExpenseCategoryType: "Income" };
    if (editingCategory) {
      updateIncomeCategory(data);
    } else {
      createIncomeCategory(data);
    }
  };
  const createIncomeCategory = async (data) => {
    try {
      const response = await apiRequest(
        "ExpenseCategory/createExpenseCategory",
        {
          method: "POST",
          body: JSON.stringify(data),
        },
      );
      toast({ title: "Success", description: response.message });
      getIncomeCategory();
      setIsFormOpen(false);
      return response;
    } catch (error) {
      toast({
        title: "Error",
        description: error?.message,
        variant: "destructive",
      });
      console.error("Error:", error);
    }
  };
  const updateIncomeCategory = async (data) => {
    try {
      const response = await apiRequest(
        "ExpenseCategory/updateExpenseCategory",
        {
          method: "POST",
          body: JSON.stringify(data),
        },
      );
      toast({ title: "Success", description: response.message });
      getIncomeCategory();
      setIsFormOpen(false);
      return response;
    } catch (error) {
      toast({
        title: "Error",
        description: error?.message,
        variant: "destructive",
      });
      console.error("Error:", error);
    }
  };
  const handleEdit = (category) => {
    setEditingCategory(category);
    setCategoryForm(category);
    setIsFormOpen(true);
  };

  const handleDelete = (id) => {
    deleteIncomeCategory(id);
  };

  const openNewDialog = () => {
    setEditingCategory(null);
    setCategoryForm(initialFormState);
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
            <Layers size={30} /> Income Category Master
          </h1>
          <p className="text-gray-600 mt-1">
            Manage income categories. Used wherever an income category selection
            is required.
          </p>
        </div>
        {Permissions.isAdd && (
          <Button
            onClick={openNewDialog}
            className="shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-shadow"
          >
            <PlusCircle size={18} className="mr-2" /> Add New Income Category
          </Button>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className=""
      >
        <Card className="medical-card hidden md:block">
          <CardHeader>
            <CardTitle>All Income Categories ({categories.length})</CardTitle>
            <CardDescription>
              List of all defined income categories.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="table-responsive-wrapper">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold text-gray-600">
                      Income Category Name
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-600">
                      Income Category Code
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-600">
                      Status
                    </th>
                    <th className="text-right p-3 font-semibold text-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => (
                    <tr
                      key={cat._id}
                      className="border-b hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="p-3 font-medium text-gray-800">
                        {cat.ExpenseCategoryName}
                      </td>
                      <td className="p-3 text-gray-600">
                        {cat.ExpenseCategoryCode}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${cat.isActive ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}`}
                        >
                          {cat.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-2">
                          {Permissions.isEdit && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(cat)}
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
                                    This will permanently delete the income
                                    category.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(cat._id)}
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
        {/* //Card for mobile view */}
        <Card className="medical-card  md:hidden">
          <CardHeader>
            <CardTitle>All Income Categories ({categories.length})</CardTitle>
            <CardDescription>
              List of all defined income categories.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((cat) => (
                <div
                  key={cat._id}
                  className="border rounded-xl p-4 shadow-sm bg-white hover:shadow-md transition-all"
                >
                  <h3 className="text-md font-semibold text-gray-800">
                    {cat.ExpenseCategoryName}
                  </h3>

                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      {cat.ExpenseCategoryCode}
                    </span>

                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        cat.isActive
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {cat.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-start gap-2">
                    {Permissions.isEdit && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(cat)}
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
                              This will permanently delete the income category.
                            </AlertDialogDescription>
                          </AlertDialogHeader>

                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(cat._id)}
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
              {editingCategory
                ? "Edit Income Category"
                : "Add New Income Category"}
            </DialogTitle>
            <DialogDescription>
              Define a new income category for tracking transactions.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-6 pt-4">
            <div className="space-y-2">
              <Label htmlFor="ExpenseCategoryCode">Income Category Code</Label>
              <Input
                id="ExpenseCategoryCode"
                name="ExpenseCategoryCode"
                value={categoryForm.ExpenseCategoryCode}
                onChange={handleFormChange}
                required
                placeholder="e.g., IC001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ExpenseCategoryName">Income Category Name</Label>
              <Input
                id="ExpenseCategoryName"
                name="ExpenseCategoryName"
                value={categoryForm.ExpenseCategoryName}
                onChange={handleFormChange}
                required
                placeholder="e.g., Consultation Fees"
              />
            </div>

            <div className="space-y-3">
              <Label>Status</Label>
              <RadioGroup
                name="isActive"
                value={categoryForm.isActive}
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
                {editingCategory ? "Save Changes" : "Add Income Category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IncomeCategoryMaster;
