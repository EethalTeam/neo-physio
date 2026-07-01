import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet";
// Updated Icons to match new design style
import {
  Plus,
  Search,
  Menu as MenuIcon,
  Edit,
  Trash2,
  Link as LinkIcon,
  FolderTree,
  Layers,
  MoreHorizontal,
} from "lucide-react";
// Updated Paths to Shadcn UI
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/use-toast";
// Preserved Contexts
// import { useData } from '@/contexts/DataContext';
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/components/CustomComponents/apiRequest";

// --- MenuForm Component (Functionality Preserved) ---
const MenuForm = ({ open, setOpen, menu, onSave, getAllMenus }) => {
  const { user } = useAuth();
  // Using local state exactly as before
  const [formData, setFormData] = useState(
    menu || {
      _id: "",
      label: "",
      id: "",
      path: "",
      icon: "",
      parentId: "",
      parent: "",
      order: 0,
      isActive: true,
    },
  );
  const [Data, SetData] = useState([]);

  useEffect(() => {
    if (menu) {
      setFormData({
        _id: menu._id,
        label: menu.label,
        id: menu.id,
        path: menu.path,
        icon: menu.icon,
        parentId: menu.parentId?._id || "",
        parent: menu.parentId?.label || "",
        order: menu.order,
        isActive: menu.isActive,
      });
    }
  }, [menu]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSelectChange = (id, name, key, value) => {
    if (key && name) {
      setFormData((prev) => ({
        ...prev,
        [id]: key,
        [name]: value,
      }));
      SetData([]);
    }
  };

  const getParentMenuList = async () => {
    try {
      SetData([]);
      const response = await apiRequest("Menu/getAllMenus", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const filteredMenus = response.data.filter((m) => m.parentId === null);
      SetData(filteredMenus);
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  };

  const createMenu = async (data) => {
    const res = await apiRequest("Menu/createMenu/", {
      method: "POST",
      body: JSON.stringify(data),
    });
    SetData([]);
    getAllMenus();
    return res;
  };

  const updateMenu = async (data) => {
    const res = await apiRequest("Menu/updateMenu/", {
      method: "POST",
      body: JSON.stringify(data),
    });
    SetData([]);
    getAllMenus();
    return res;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (formData._id) {
        const res = await updateMenu({
          ...formData,
          order: parseInt(formData.order),
          _id: formData._id,
          parentId: formData.parentId || null,
        });
        toast({ title: "Menu Updated", description: res.message });
      } else {
        const res = await createMenu({
          ...formData,
          order: parseInt(formData.order),
          parentId: formData.parentId || null,
        });
        toast({ title: "Menu Added", description: res.message });
      }
      setOpen(false);
    } catch (error) {
      console.error("Error:", error);
      toast({ title: "Error", description: error?.message, variant: "destructive" });
    }
  };

  // NEW DESIGN: Shadcn Dialog Layout
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[95vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{menu ? "Edit Menu" : "Add New Menu"}</DialogTitle>
          <DialogDescription>
            {menu
              ? "Update the details for this menu item."
              : "Enter the details for the new menu item."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Label</Label>
                <Input
                  name="label"
                  value={formData.label}
                  onChange={handleChange}
                  placeholder="e.g., Dashboard"
                  required
                  disabled={user.role !== "SuperAdmin" && user.role !== "Admin"}
                />
              </div>
              <div className="space-y-2">
                <Label>Menu ID</Label>
                <Input
                  name="id"
                  value={formData.id}
                  onChange={handleChange}
                  placeholder="e.g., dashboard.main"
                  required
                  disabled={user.role !== "SuperAdmin" && user.role !== "Admin"}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Path</Label>
                <Input
                  name="path"
                  value={formData.path}
                  onChange={handleChange}
                  placeholder="e.g., dashboard"
                  required
                  disabled={user.role !== "SuperAdmin" && user.role !== "Admin"}
                />
              </div>
              <div className="space-y-2">
                <Label>Icon</Label>
                <Input
                  name="icon"
                  value={formData.icon}
                  onChange={handleChange}
                  placeholder="e.g., Users"
                  disabled={user.role !== "SuperAdmin" && user.role !== "Admin"}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Parent Menu</Label>
                <Select
                  name="parent"
                  value={formData.parentId}
                  onOpenChange={async (open) => {
                    if (open && (!Data || Data.length === 0)) {
                      await getParentMenuList();
                    }
                  }}
                  onValueChange={(id) => {
                    if (id === "none") {
                      handleSelectChange("parentId", "parent", "", "None");
                      return;
                    }
                    if (!id) return;
                    const parentMenu = Data.find((d) => d._id === id);
                    if (parentMenu) {
                      handleSelectChange(
                        "parentId",
                        "parent",
                        parentMenu._id,
                        parentMenu.label,
                      );
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Parent Menu">
                      {formData.parent || "None"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Top Level)</SelectItem>
                    {(Data || []).map((parentMenu) => (
                      <SelectItem key={parentMenu._id} value={parentMenu._id}>
                        {parentMenu.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Order</Label>
                <Input
                  name="order"
                  type="number"
                  onWheel={(e) => {
                    e.target.blur();
                  }}
                  value={formData.order}
                  onChange={handleChange}
                  placeholder="e.g., 1"
                  disabled={user.role !== "SuperAdmin" && user.role !== "Admin"}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isActive: checked }))
                }
                disabled={user.role !== "SuperAdmin" && user.role !== "Admin"}
              />
              <Label
                htmlFor="isActive"
                className="text-sm font-medium leading-none"
              >
                Active
              </Label>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save Menu</Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// --- Main Page Component ---
const MenusPage = () => {
  const { user } = useAuth();
  // const { deleteMenu } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [menus, setMenus] = useState([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Logic Preserved
  const filteredMenus = useMemo(
    () =>
      menus.filter((menu) => {
        const matchesSearch =
          menu.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          menu.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          menu.path.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "active" && menu.isActive) ||
          (statusFilter === "inactive" && !menu.isActive);
        return matchesSearch && matchesStatus;
      }),
    [menus, searchTerm, statusFilter],
  );

  const handleAddMenu = () => {
    setSelectedMenu(null);
    setIsFormOpen(true);
  };

  useEffect(() => {
    getAllMenus();
  }, []);

  const getAllMenus = async () => {
    try {
      const response = await apiRequest("Menu/getAllMenus", {
        method: "POST",
        body: JSON.stringify({ _id: user._id, role: user.role }),
      });
      setMenus(response.data || response);
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  };

  const handleEditMenu = (menu) => {
    setSelectedMenu(menu);
    setIsFormOpen(true);
  };

  // const handleDeleteMenu = (menu) => {
  //   setSelectedMenu(menu);
  //   setIsConfirmOpen(true);
  // };

  // const confirmDelete = () => {
  //   deleteMenu(selectedMenu._id);
  //   toast({
  //     title: "Menu Deleted",
  //     description: `${selectedMenu.label} has been deleted.`
  //   });
  //   setIsConfirmOpen(false);
  //   setSelectedMenu(null);
  // };

  // NOTE: This was defined in your old code, but the Form handled its own submission.
  // I am keeping this to ensure no logic is lost, even if unused by the current Form implementation.
  const handleSaveMenu = (menuData) => {
    // Logic managed inside MenuForm as per previous code structure,
    // but keeping this function reference valid.
  };

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Menu Management - ENIS-HRMS</title>
        <meta
          name="description"
          content="Comprehensive menu management system for organizing navigation structure and menu hierarchy."
        />
      </Helmet>

      {/* Form Dialog */}
      <AnimatePresence>
        {isFormOpen && (
          <MenuForm
            open={isFormOpen}
            setOpen={setIsFormOpen}
            menu={selectedMenu}
            onSave={handleSaveMenu}
            getAllMenus={getAllMenus}
          />
        )}
      </AnimatePresence>

      {/* Confirmation Dialog - Replaced Custom Dialog with Shadcn AlertDialog but kept logic */}
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete Menu: {selectedMenu?.label}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              menu item.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsConfirmOpen(false)}>
              Cancel
            </AlertDialogCancel>
            {/* <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction> */}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex md:flex-row flex-col md:justify-between items-start space-y-5"
      >
        <div>
          <h1 className="md:text-3xl text-lg font-bold text-gray-800 mb-2">
            Menu Management
          </h1>
          <p className="text-gray-600">
            Manage navigation menus and hierarchy structure.
          </p>
        </div>
        <Button onClick={handleAddMenu}>
          <Plus className="mr-2 h-4 w-4" /> Add New Menu
        </Button>
      </motion.div>

      {/* Search & Filter Section (New Design) */}
      <Card className="medical-card">
        <CardHeader>
          <CardTitle>Search Menus</CardTitle>
          <CardDescription>Filter by name, ID, or path</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search menus..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Grid Display Section (Replacing Table) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="border-none shadow-none bg-transparent">
          <CardHeader className="px-0 pt-0">
            <CardTitle>All Menus ({filteredMenus.length})</CardTitle>
            <CardDescription>View and manage all system menus</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMenus.map((menu) => (
                <>
                  <motion.div
                    key={menu._id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="border bg-card rounded-lg p-6 hover:shadow-md transition-shadow flex flex-col"
                  >
                    <div className="flex items-center space-x-3 mb-4">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${menu.isActive ? "bg-green-100" : "bg-gray-100"}`}
                      >
                        <MenuIcon
                          className={`${menu.isActive ? "text-green-600" : "text-gray-400"}`}
                          size={20}
                        />
                      </div>
                      <div className="overflow-hidden">
                        <h3
                          className="font-semibold text-gray-800 truncate"
                          title={menu.label}
                        >
                          {menu.label}
                        </h3>
                        <p
                          className="text-xs text-gray-500 font-mono truncate"
                          title={menu.id}
                        >
                          {menu.id}
                        </p>
                        <span
                          className={`inline-block px-2 py-0.5 mt-1 text-xs rounded-full ${menu.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}
                        >
                          {menu.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-3 mb-4 flex-grow">
                      <div className="flex items-center justify-between border-b pb-2">
                        <span className="text-sm text-gray-600 flex items-center gap-2">
                          <LinkIcon size={14} /> Path:
                        </span>
                        <span
                          className="text-sm font-medium truncate max-w-[120px]"
                          title={menu.path}
                        >
                          {menu.path}
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-b pb-2">
                        <span className="text-sm text-gray-600 flex items-center gap-2">
                          <FolderTree size={14} /> Parent:
                        </span>
                        <span
                          className="text-sm font-medium truncate max-w-[120px]"
                          title={menu.parentTitle}
                        >
                          {menu.parentTitle || "Top Level"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 flex items-center gap-2">
                          <Layers size={14} /> Order:
                        </span>
                        <span className="text-sm font-medium">
                          {menu.order}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditMenu(menu)}
                        className="flex-1"
                      >
                        <Edit size={14} className="mr-1" /> Edit
                      </Button>
                      {/* <Button size="sm" variant="destructive" onClick={() => handleDeleteMenu(menu)} className="flex-1">
                      <Trash2 size={14} className="mr-1" /> Delete
                    </Button> */}
                    </div>
                  </motion.div>
                </>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default MenusPage;
