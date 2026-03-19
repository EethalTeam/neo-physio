// ✔️ Only syntax/backtick fixes done — no logic changes

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet";
import {
  Plus,
  Edit,
  Trash2,
  Settings,
  Save,
  Eye,
  UserPlus,
  FileEdit,
  Trash,
  ShieldCheck,
  Lock,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "@/components/CustomComponents/apiRequest";
import { cn } from "@/lib/utils";

// ------------------ API FUNCTIONS ------------------
// const navigate = useNavigate()

// const { getPermissionsByPath } = useAuth();
//   const [Permissions, setPermissions] = useState({ isAdd: false, isView: false, isEdit: false, isDelete: false })
//   // console.log(Permissions,"Permissions")
//   useEffect(() => {
//     getPermissionsByPath(window.location.pathname).then(res => {
//       if (res) {
//         
//         setPermissions(res)
//       } else {
//         navigate('/dashboard')
//       }
//     })

//   }, [])

// useEffect(()=>{
//     if (Permissions.isView) {
//       getRole()
//     }
// },[Permissions])

const getRole = async (setRoles) => {
  try {
    const response = await apiRequest("RoleBased/getAllRoles", {
      method: "POST",
      body: JSON.stringify({}),
    });
    setRoles(response.data || []);
  } catch (error) {
    console.error("Failed to fetch roles", error);
    setRoles([]);
  }
};

const getAllMenus = async () => {
  try {
    const response = await apiRequest("RoleBased/getAllMenus", {
      method: "POST",
      body: JSON.stringify({}),
    });
    return response.data || {};
  } catch (error) {
    console.error("Failed to fetch menus", error);
    return {};
  }
};

const updateMenusAndAccess = async (roleId, menus) => {
  try {
    const response = await apiRequest("RoleBased/updateMenusAndAccess", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        _id: roleId,
        menus: menus,
      }),
    });

    return response;
  } catch (error) {
    console.error("Failed to update permissions", error);
    throw error;
  }
};

const createRole = async (data, setRoles) => {
  const response = await apiRequest("RoleBased/createRole", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  await getRole(setRoles);
  return response;
};

const updateRoleApi = async (data, setRoles) => {
  const response = await apiRequest("RoleBased/updateRole", {
    method: "POST",
    body: JSON.stringify(data),
  });
  await getRole(setRoles);
  return response;
};

const deleteRoleApi = async (id, setRoles) => {
  const response = await apiRequest("RoleBased/deleteRole", {
    method: "POST",
    body: JSON.stringify({ _id: id }),
  });
  await getRole(setRoles);
  return response;
};

// ------------------ ROLE FORM ------------------
const RoleForm = ({ open, setOpen, role, onSave }) => {
  const [RoleName, setRoleName] = useState("");

  useEffect(() => {
    if (open) {
      setRoleName(role ? role.RoleName : "");
    }
  }, [role, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (RoleName.trim()) {
      onSave({ ...role, RoleName: RoleName.trim() });
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{role ? "Edit Role" : "Add New Role"}</DialogTitle>
          <DialogDescription>
            {role
              ? "Modify the role name below."
              : "Create a new role to assign to users."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Role Name</Label>
            <Input
              id="name"
              value={RoleName}
              onChange={(e) => setRoleName(e.target.value)}
              required
              placeholder="e.g. HR Manager"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Save Role</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ------------------ PERMISSIONS DIALOG ------------------
const PermissionsDialog = ({ open, setOpen, role, onSave }) => {
  const [menus, setMenus] = useState([]);
  const [currentPermissions, setCurrentPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const isSuperAdmin = role?.RoleName === "SuperAdmin";

  useEffect(() => {
    if (open && role) {
      loadMenusAndPermissions();
    }
  }, [role, open]);

  const loadMenusAndPermissions = async () => {
    try {
      setLoading(true);
      const menusResponse = await getAllMenus();
      const flatMenus = menusResponse || [];

      const parentMenus = flatMenus.filter((m) => !m.parentId);
      const hierarchicalMenus = parentMenus.map((parent) => ({
        ...parent,
        subMenus: flatMenus.filter((child) => child.parentId === parent._id),
      }));

      setMenus(hierarchicalMenus);

      const permissions = {};
      if (role?.permissions) {
        role.permissions.forEach((perm) => {
          permissions[perm.menuId] = {
            isView: perm.isView || false,
            isAdd: perm.isAdd || false,
            isEdit: perm.isEdit || false,
            isDelete: perm.isDelete || false,
          };
        });
      }
      setCurrentPermissions(permissions);
    } catch (error) {
      console.error("Error loading menus:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (menuId, permission, checked) => {
    setCurrentPermissions((prev) => {
      const updated = {
        ...prev,
        [menuId]: {
          ...prev[menuId],
          [permission]: checked,
        },
      };

      const perms = updated[menuId];
      if (!perms.isView && !perms.isAdd && !perms.isEdit && !perms.isDelete) {
        delete updated[menuId];
      }

      return updated;
    });
  };

  const handleSelectAllForMenu = (menuId, checked) => {
    if (isSuperAdmin) return;

    if (checked) {
      setCurrentPermissions((prev) => ({
        ...prev,
        [menuId]: {
          isView: true,
          isAdd: true,
          isEdit: true,
          isDelete: true,
        },
      }));
    } else {
      setCurrentPermissions((prev) => {
        const updated = { ...prev };
        delete updated[menuId];
        return updated;
      });
    }
  };

  const isMenuFullySelected = (menuId) => {
    const perms = currentPermissions[menuId];
    return (
      perms && (perms.isView || perms.isAdd || perms.isEdit || perms.isDelete)
    );
  };

  const handleSave = async () => {
    try {
      const menusToUpdate = Object.entries(currentPermissions)
        .filter(
          ([_, perms]) =>
            perms.isView || perms.isAdd || perms.isEdit || perms.isDelete,
        )
        .map(([menuId, perms]) => ({
          menuId,
          ...perms,
        }));

      await updateMenusAndAccess(role._id, menusToUpdate);
      onSave();
      setOpen(false);
    } catch (error) {
      console.error("Error saving permissions:", error);
      throw error;
    }
  };

  const renderPermissionIcon = (type) => {
    const iconProps = { className: "w-3 h-3 md:w-4 md:h-4 text-gray-500" };
    switch (type) {
      case "isView":
        return <Eye {...iconProps} />;
      case "isAdd":
        return <UserPlus {...iconProps} />;
      case "isEdit":
        return <FileEdit {...iconProps} />;
      case "isDelete":
        return <Trash {...iconProps} />;
      default:
        return null;
    }
  };

  const getPermissionLabel = (type) => {
    switch (type) {
      case "isView":
        return "View";
      case "isAdd":
        return "Add";
      case "isEdit":
        return "Edit";
      case "isDelete":
        return "Delete";
      default:
        return type;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            {`Permissions: ${role?.RoleName || "Role"}`}
          </DialogTitle>
          <DialogDescription>
            Configure specific access rights for this role.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-4 py-2">
          {loading ? (
            <div className="flex items-center justify-center p-8 text-gray-500">
              Loading configuration...
            </div>
          ) : (
            <>
              {menus.map((parentMenu) => (
                <Card key={parentMenu._id} className="border-border shadow-sm">
                  <CardHeader className="py-3 px-4 bg-gray-50 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id={`select-all-${parentMenu._id}`}
                          checked={isMenuFullySelected(parentMenu._id)}
                          onCheckedChange={(checked) =>
                            handleSelectAllForMenu(parentMenu._id, checked)
                          }
                        />
                        <Label
                          htmlFor={`select-all-${parentMenu._id}`}
                          className="font-semibold text-base cursor-pointer"
                        >
                          {parentMenu.label}
                        </Label>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 mt-2 pl-7">
                      {["isView", "isAdd", "isEdit", "isDelete"].map(
                        (permission) => (
                          <div
                            key={permission}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`${parentMenu._id}-${permission}`}
                              checked={
                                currentPermissions[parentMenu._id]?.[
                                  permission
                                ] || false
                              }
                              onCheckedChange={(checked) =>
                                handlePermissionChange(
                                  parentMenu._id,
                                  permission,
                                  checked,
                                )
                              }
                            />
                            <Label
                              htmlFor={`${parentMenu._id}-${permission}`}
                              className="flex items-center space-x-1 text-sm text-gray-600 font-normal cursor-pointer"
                            >
                              {renderPermissionIcon(permission)}
                              <span>{getPermissionLabel(permission)}</span>
                            </Label>
                          </div>
                        ),
                      )}
                    </div>
                  </CardHeader>

                  {parentMenu.subMenus?.length > 0 && (
                    <CardContent className="p-4 space-y-3">
                      {parentMenu.subMenus.map((subMenu) => (
                        <div
                          key={subMenu._id}
                          className="pl-4 md:pl-6 border-l-2 border-gray-100"
                        >
                          <div className="flex items-center space-x-3 mb-2">
                            <Checkbox
                              id={`select-all-${subMenu._id}`}
                              checked={isMenuFullySelected(subMenu._id)}
                              onCheckedChange={(checked) =>
                                handleSelectAllForMenu(subMenu._id, checked)
                              }
                            />
                            <Label
                              htmlFor={`select-all-${subMenu._id}`}
                              className="font-medium cursor-pointer"
                            >
                              {subMenu.label}
                            </Label>
                          </div>

                          <div className="flex flex-wrap gap-4 ml-7">
                            {["isView", "isAdd", "isEdit", "isDelete"].map(
                              (permission) => (
                                <div
                                  key={permission}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={`${subMenu._id}-${permission}`}
                                    checked={
                                      currentPermissions[subMenu._id]?.[
                                        permission
                                      ] || false
                                    }
                                    onCheckedChange={(checked) =>
                                      handlePermissionChange(
                                        subMenu._id,
                                        permission,
                                        checked,
                                      )
                                    }
                                  />
                                  <Label
                                    htmlFor={`${subMenu._id}-${permission}`}
                                    className="flex items-center space-x-1 text-sm text-gray-500 font-normal cursor-pointer"
                                  >
                                    {renderPermissionIcon(permission)}
                                    <span>
                                      {getPermissionLabel(permission)}
                                    </span>
                                  </Label>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  )}
                </Card>
              ))}
            </>
          )}
        </div>

        <DialogFooter className="pt-2 border-t">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Save className="w-4 h-4" /> Save Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ------------------ MAIN COMPONENT ------------------
const RolesPage = () => {
  const { toast } = useToast();
  const [roles, setRoles] = useState([]);
  const [isRoleFormOpen, setIsRoleFormOpen] = useState(false);
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [roleToEdit, setRoleToEdit] = useState(null);
  const [roleForPermissions, setRoleForPermissions] = useState(null);
  // console.log(roleForPermissions,"roleForPermissions")

  useEffect(() => {
    getRole(setRoles);
  }, []);

  useEffect(() => {
    const rolepath = roles.reduce((acc, curr) => {
      if (!acc[curr.RoleName]) {
        return {
          ...acc,
          [curr.RoleName]: curr.permissions?.map((val) => val.menuDetails.path),
        };
      } else {
        return acc;
      }
    }, {});
  }, [roles]);

  const handleAddNewRole = () => {
    setRoleToEdit(null);
    setIsRoleFormOpen(true);
  };

  const handleEditRole = (role) => {
    if (role.RoleName === "SuperAdmin") {
      toast({
        title: "Restricted",
        description: "The SuperAdmin role is locked.",
        variant: "destructive",
      });
      return;
    }
    setRoleToEdit(role);
    setIsRoleFormOpen(true);
  };

  const handleDeleteRole = (role) => {
    if (role.RoleName === "SuperAdmin") {
      toast({
        title: "Restricted",
        description: "The SuperAdmin role is protected.",
        variant: "destructive",
      });
      return;
    }
    setRoleToEdit(role);
    setIsConfirmOpen(true);
  };

  const handleManagePermissions = (role) => {
    setRoleForPermissions(role);
    setIsPermissionsOpen(true);
  };

  const confirmDeleteRole = async () => {
    try {
      await deleteRoleApi(roleToEdit._id, setRoles);
      toast({ title: "Role Deleted" });
      setIsConfirmOpen(false);
      setRoleToEdit(null);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSaveRole = async (roleData) => {
    try {
      if (roleToEdit) {
        await updateRoleApi({ ...roleData, _id: roleToEdit._id }, setRoles);
        toast({ title: "Role Updated" });
      } else {
        const newRole = await createRole(roleData, setRoles);
        if (newRole) {
          toast({ title: "Role Added" });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handlePermissionsSaved = () => {
    toast({
      title: "Permissions Saved",
      description: `Permissions for ${roleForPermissions?.RoleName} have been updated.`,
    });
    getRole(setRoles);
  };
  const { getPermissionsByPath } = useAuth();
  const navigate = useNavigate();

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
      getRole(setRoles);
    }
  }, [Permissions]);

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Roles & Permissions</title>
        <meta
          name="description"
          content="Manage user roles and their access permissions across the application."
        />
      </Helmet>

      <AnimatePresence>
        {isRoleFormOpen && (
          <RoleForm
            open={isRoleFormOpen}
            setOpen={setIsRoleFormOpen}
            role={roleToEdit}
            onSave={handleSaveRole}
          />
        )}
        {isPermissionsOpen && (
          <PermissionsDialog
            open={isPermissionsOpen}
            setOpen={setIsPermissionsOpen}
            role={roleForPermissions}
            onSave={handlePermissionsSaved}
          />
        )}
      </AnimatePresence>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role?</AlertDialogTitle>
            <AlertDialogDescription>
              {`Are you sure you want to delete the role "${roleToEdit?.RoleName}"? This action cannot be undone and may affect users assigned to this role.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsConfirmOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteRole}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="md:text-3xl text-xl font-bold text-gray-800 mb-2">
            Roles & Permissions
          </h1>
          <p className="text-gray-600">
            Define roles and control access to different modules
          </p>
        </div>
        {Permissions.isAdd && (
          <Button onClick={handleAddNewRole} className="bg-primary">
            <Plus className="w-4 h-4 mr-2" /> Add Role
          </Button>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="border-none shadow-none bg-transparent">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map((role) => {
              const isSuperAdmin = role.RoleName === "SuperAdmin";
              return (
                <motion.div
                  key={role._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card
                    className={cn(
                      "hover:shadow-md transition-all duration-200 border-l-4",
                      isSuperAdmin ? "border-l-blue-500" : "border-l-gray-300",
                    )}
                  >
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                      <div>
                        <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                          {isSuperAdmin && (
                            <Lock size={18} className="text-blue-500" />
                          )}
                          {role.RoleName}
                        </CardTitle>
                        <CardDescription className="font-mono text-xs text-gray-500 mt-1">
                          {`Code: ${role.RoleCode}`}
                        </CardDescription>
                      </div>
                      <span
                        className={cn(
                          "px-2.5 py-0.5 rounded-full text-xs font-medium",
                          role.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800",
                        )}
                      >
                        {role.isActive ? "Active" : "Inactive"}
                      </span>
                    </CardHeader>

                    <CardContent className="pt-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <ShieldCheck className="mr-2 h-4 w-4 text-gray-400" />
                        <span>{`${role.totalPermissions || 0} module${
                          (role.totalPermissions || 0) !== 1 ? "s" : ""
                        } configured`}</span>
                      </div>
                    </CardContent>

                    <CardFooter className="flex justify-between gap-2 pt-2 border-t bg-gray-50/50">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 text-gray-600 hover:text-primary hover:bg-blue-50"
                        onClick={() => handleManagePermissions(role)}
                      >
                        <Settings className="w-4 h-4 mr-2" /> Access
                      </Button>

                      {!isSuperAdmin && (
                        <>
                          {Permissions.isEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="px-2 text-gray-500 hover:text-gray-900"
                              onClick={() => handleEditRole(role)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          {Permissions.isDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="px-2 text-gray-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => handleDeleteRole(role)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </>
                      )}
                    </CardFooter>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default RolesPage;
