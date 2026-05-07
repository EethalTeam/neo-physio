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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Stethoscope,
  Search,
  Calendar as CalendarIcon,
  UserPlus,
  Trash2,
  Edit,
  Info,
  FileText,
  EyeOff,
  Eye,
  User2,
  UserCheck,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "@/components/CustomComponents/apiRequest";

const PhysioManagement = () => {
  const navigate = useNavigate();

  const [physios, setPhysios] = useState([]);
  const [filteredPhysios, setFilteredPhysios] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [viewingPhysio, setViewingPhysio] = useState(null);
  const [editingPhysio, setEditingPhysio] = useState(null);
  const [gender, setGender] = useState([]);
  const [Roles, setRoles] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [completedSessions, setCompletedSessions] = useState([]);
  const [activeTab, setActiveTab] = useState("physiodetails");
  const [expandedPatient, setExpandedPatient] = useState(null);

  const { getPermissionsByPath } = useAuth();

  const [Permissions, setPermissions] = useState({
    isAdd: false,
    isView: false,
    isEdit: false,
    isDelete: false,
  });

  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [selectedPhysio, setSelectedPhysio] = useState(null);

  const initialFormState = {
    _id: "",
    physioName: "",
    sessionPerDay: "",
    EmpCode: "",
    physioGenderId: "",
    genderName: "",
    physioDob: "",
    physioExp: "",
    physioQulifi: "",
    physioSpcl: "",
    physioPAN: "",
    physioAadhar: "",
    physioSalary: "",
    JoiningDate: "",
    physioProbation: "",
    physioINCRDate: null,
    physioPetrolAlw: "",
    physioContactNo: "",
    physioAltno: "",
    physioAltno2: "",
    physiorelationAltno: "",
    physiorelationAltno2: "",
    physioVehicleMTC: "",
    physioIncentive: "",
    isActive: true,
    password: "",
    roleId: "",
  };
  const normalizeDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return new Date(
      Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()),
    ).toISOString();
  };
  const [physioForm, setPhysioForm] = useState(initialFormState);
  const [physioPic, setPhysioPic] = useState(null);

  const TabButton = ({ id, label, icon: Icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`relative flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all rounded-md ${
        activeTab === id
          ? "bg-blue-600 text-white shadow-md"
          : "text-slate-400 hover:text-white hover:bg-blue-900"
      }`}
      type="button"
    >
      {Icon && <Icon className="w-4 h-4" />}
      {label}
      {activeTab === id && (
        <motion.div
          layoutId="activetabphysiodetails"
          className="absolute inset-0 rounded-md bg-blue-600 -z-10"
        />
      )}
    </button>
  );

  useEffect(() => {
    getGender();
    getAllRole();
  }, []);

  useEffect(() => {
    getPermissionsByPath(window.location.pathname).then((res) => {
      if (res) {
        setPermissions(res);
      } else {
        navigate("/dashboard");
      }
    });
  }, [getPermissionsByPath, navigate]);

  useEffect(() => {
    if (Permissions.isView) {
      getPhysio();
    }
  }, [Permissions]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredPhysios(physios);
    } else {
      const filtered = physios.filter(
        (p) =>
          p.physioName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.physioSpcl?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setFilteredPhysios(filtered);
    }
  }, [searchTerm, physios]);

  const getGender = async () => {
    try {
      const res = await apiRequest("Gender/getAllGender", {
        method: "POST",
        body: JSON.stringify({}),
      });
      setGender(res || []);
    } catch (error) {
      console.error("Error loading Gender:", error);
    }
  };

  const getPhysio = async () => {
    try {
      const response = await apiRequest("Physio/getAllPhysio", {
        method: "POST",
        body: JSON.stringify({ type: "master" }),
      });
      setPhysios(response.physios || []);
      setFilteredPhysios(response.physios || []);
    } catch (error) {
      console.error("Error loading physios:", error);
    }
  };

  const getAllRole = async () => {
    try {
      const response = await apiRequest("RoleBased/getAllRoles", {
        method: "POST",
        body: JSON.stringify(),
      });
      setRoles(response.data || []);
    } catch (error) {
      console.error("Error on get all role:", error);
    }
  };

  const updatePhysio = async (data) => {
    try {
      const formData = new FormData();

      Object.keys(data).forEach((key) => {
        if (key !== "physioPic") {
          // ✅ HANDLE DATES PROPERLY
          if (key === "JoiningDate" || key === "physioINCRDate") {
            formData.append(key, normalizeDate(data[key]));
          } else {
            formData.append(key, data[key] ?? "");
          }
        }
      });

      if (physioPic) {
        formData.append("physioPic", physioPic);
      }

      await apiRequest("Physio/updatePhysio", {
        method: "POST",
        body: formData,
      });

      toast({ title: "Updated", description: "Physio updated successfully." });
      getPhysio();
      setIsFormOpen(false);
    } catch (error) {
      console.error("Error updating physio:", error);
    }
  };

  const createPhysio = async (data) => {
    try {
      const formData = new FormData();

      Object.keys(data).forEach((key) => {
        if (key !== "physioPic" && key !== "_id") {
          // ✅ HANDLE DATES PROPERLY
          if (key === "JoiningDate" || key === "physioINCRDate") {
            formData.append(key, normalizeDate(data[key]));
          } else {
            formData.append(key, data[key] ?? "");
          }
        }
      });

      if (physioPic) {
        formData.append("physioPic", physioPic);
      }

      await apiRequest("Physio/createPhysio", {
        method: "POST",
        body: formData,
      });

      toast({ title: "Success", description: "Physio created successfully." });
      getPhysio();
      setIsFormOpen(false);
    } catch (error) {
      console.error("Error creating physio:", error);
    }
  };

  const deletePhysio = async (id) => {
    try {
      await apiRequest("Physio/deletePhysio", {
        method: "POST",
        body: JSON.stringify({ _id: id }),
      });
      toast({
        title: "Deleted",
        description: "Physio deleted successfully.",
        variant: "destructive",
      });
      getPhysio();
    } catch (error) {
      console.error("Error deleting physio:", error);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setPhysioForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date) => {
    setPhysioForm((prev) => ({ ...prev, physioINCRDate: date }));
  };

  const handleSelectChange = (field, value) => {
    setPhysioForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();

    if (!physioForm.physioName) {
      toast({
        title: "Alert",
        description: "Enter the Name",
        variant: "destructive",
      });
    } else if (!physioForm.EmpCode) {
      toast({
        title: "Alert",
        description: "Enter the Employee code",
        variant: "destructive",
      });
    } else if (!physioForm.physioDob) {
      toast({
        title: "Alert",
        description: "Enter the Date of Birth",
        variant: "destructive",
      });
    } else if (!physioForm?.physioGenderId) {
      toast({
        title: "Alert",
        description: "Select Gender",
        variant: "destructive",
      });
    } else if (!physioForm.physioContactNo) {
      toast({
        title: "Alert",
        description: "Enter Contact Number",
        variant: "destructive",
      });
    } else if (!physioForm.password) {
      toast({
        title: "Alert",
        description: "Enter Password",
        variant: "destructive",
      });
    } else if (!physioForm?.roleId) {
      toast({
        title: "Alert",
        description: "Select Role",
        variant: "destructive",
      });
    } else if (!physioForm.physioSpcl) {
      toast({
        title: "Alert",
        description: "Enter Designation",
        variant: "destructive",
      });
    } else if (!physioForm.physioQulifi) {
      toast({
        title: "Alert",
        description: "Enter Qualifications",
        variant: "destructive",
      });
    } else if (!physioForm.physioExp) {
      toast({
        title: "Alert",
        description: "Enter Experience",
        variant: "destructive",
      });
    } else if (!physioForm.physioPAN) {
      toast({
        title: "Alert",
        description: "Enter PAN Number",
        variant: "destructive",
      });
    } else if (!physioForm.physioAadhar) {
      toast({
        title: "Alert",
        description: "Enter Aadhar Number",
        variant: "destructive",
      });
    } else if (!physioForm.physioSalary) {
      toast({
        title: "Alert",
        description: "Enter Salary",
        variant: "destructive",
      });
    } else if (!physioForm.JoiningDate) {
      toast({
        title: "Alert",
        description: "Enter JoiningDate",
        variant: "destructive",
      });
    } else if (!physioForm.physioProbation) {
      toast({
        title: "Alert",
        description: "Enter Probation Period",
        variant: "destructive",
      });
    } else if (!physioForm.physioINCRDate) {
      toast({
        title: "Alert",
        description: "Enter Increment",
        variant: "destructive",
      });
    } else if (!physioForm.physioPetrolAlw) {
      toast({
        title: "Alert",
        description: "Enter Petrol Allowance",
        variant: "destructive",
      });
    } else if (!physioForm.physioVehicleMTC) {
      toast({
        title: "Alert",
        description: "Enter Vehicle Maintenance",
        variant: "destructive",
      });
    } else if (!physioForm.physioIncentive) {
      toast({
        title: "Alert",
        description: "Enter Incentive",
        variant: "destructive",
      });
    } else {
      if (editingPhysio) {
        updatePhysio(physioForm);
      } else {
        createPhysio(physioForm);
      }
    }

    setShowPassword(false);
  };

  const handleEdit = (physio) => {
    setEditingPhysio(true);

    setPhysioForm({
      _id: physio._id,
      physioCode: physio.physioCode || "",
      EmpCode: physio.EmpCode || "",
      sessionPerDay: physio.sessionPerDay || "",
      physioName: physio.physioName || "",
      physioGenderId: physio.physioGenderId?._id || "",
      genderName: physio.physioGenderId?.genderName || "",
      physioDob: physio.physioDob
        ? new Date(physio.physioDob).toISOString().split("T")[0]
        : "",
      physioExp: physio.physioExp || "",
      physioQulifi: physio.physioQulifi || "",
      physioSpcl: physio.physioSpcl || "",
      physioPAN: physio.physioPAN || "",
      physioAadhar: physio.physioAadhar || "",
      physioSalary: physio.physioSalary || "",
      JoiningDate: physio.JoiningDate || "",
      physioProbation: physio.physioProbation || "",
      physioINCRDate: physio.physioINCRDate
        ? new Date(physio.physioINCRDate)
        : null,
      physioPetrolAlw: physio.physioPetrolAlw || "",
      physioAltno: physio.physioAltno || "",
      physioAltno2: physio.physioAltno2 || "",
      physiorelationAltno: physio.physiorelationAltno || "",
      physiorelationAltno2: physio.physiorelationAltno2 || "",
      physioContactNo: physio.physioContactNo || "",
      physioVehicleMTC: physio.physioVehicleMTC || "",
      physioIncentive: physio.physioIncentive || "",
      isActive: physio.isActive,
      password: physio.password || "",
      roleId: physio.roleId?._id || "",
    });

    setIsFormOpen(true);
    setShowPassword(false);
  };

  const handleViewDetails = async (physio) => {
    setViewingPhysio(physio);
    setIsDetailsOpen(true);
    setActiveTab("physiodetails");
    setExpandedPatient(null);

    try {
      const roleName = physio.roleId?.RoleName?.toLowerCase();

      if (roleName === "hod") {
        const response = await apiRequest("Review/getAllReviewDownload", {
          method: "POST",
          body: JSON.stringify({}),
        });

        const reviews = Array.isArray(response?.report) ? response.report : [];

        const sortedReviews = reviews.sort(
          (a, b) =>
            new Date(b.reviewDate || b.createdAt) -
            new Date(a.reviewDate || a.createdAt),
        );

        setCompletedSessions(sortedReviews);
      } else {
        const response = await apiRequest("Session/getAllSession", {
          method: "POST",
          body: JSON.stringify({ physioId: physio._id }),
        });

        const sessions = Array.isArray(response)
          ? response
          : response?.data || response?.sessions || [];

        const filtered = sessions
          .filter((s) => {
            const sessionPhysioId =
              typeof s.physioId === "string"
                ? s.physioId
                : s.physioId?._id || s.physioId?.PhysioIDPK;

            return sessionPhysioId === physio._id;
          })
          .filter(
            (s) =>
              s.sessionStatusId?.sessionStatusName?.toLowerCase() ===
              "completed",
          )
          .sort((a, b) => new Date(b.sessionDate) - new Date(a.sessionDate));

        setCompletedSessions(filtered);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setCompletedSessions([]);
    }
  };
  const handleToggleStatus = async (physio) => {
    if (!physio) return;

    try {
      const newStatus = !physio.isActive;

      const res = await apiRequest("Physio/updatePhysio", {
        method: "POST",
        body: JSON.stringify({
          _id: physio._id,
          isActive: newStatus,
        }),
      });

      if (res) {
        toast({
          title: "Status Updated",
          description: `${physio.physioName} is now ${
            newStatus ? "Active" : "Inactive"
          }.`,
        });

        setPhysios((prev) =>
          prev.map((p) =>
            p._id === physio._id ? { ...p, isActive: newStatus } : p,
          ),
        );
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update physiotherapist status.",
        variant: "destructive",
      });
    }
  };

  const groupedSessions = (completedSessions || []).reduce((acc, session) => {
    const patientId = session.patientId?._id || "unknown";

    if (!acc[patientId]) {
      acc[patientId] = {
        patientName: session.patientId?.patientName || "Unknown Patient",
        sessions: [],
      };
    }

    acc[patientId].sessions.push(session);
    return acc;
  }, {});

  return (
    <div className="space-y-6 ">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="md:flex md:justify-between md:items-center space-y-5"
      >
        <div>
          <h1 className="md:text-3xl text-xl font-bold text-gray-800 mb-2">
            Physiotherapist Management
          </h1>
          <p className="text-gray-600">
            Manage physiotherapists and track their performance
          </p>
        </div>

        {Permissions.isAdd && (
          <Button onClick={() => setIsFormOpen(true)}>
            <UserPlus className="md:mr-2 md:h-4 md:w-4 max-w-fit" /> Add New
            Physio
          </Button>
        )}
      </motion.div>

      <Card className="medical-card">
        <CardHeader>
          <CardTitle className="font-bold text-xl">
            Search Physiotherapists
          </CardTitle>
          <CardDescription>
            Find physiotherapists by name or Designation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name or Designation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="medical-card">
          <CardHeader>
            <CardTitle className="text-lg md:text-2xl">
              Physiotherapists ({filteredPhysios.length})
            </CardTitle>
            <CardDescription>
              All physiotherapists in the system
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPhysios.map((physio) => (
                <motion.div
                  key={physio._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="border rounded-lg p-6 hover:shadow-md transition-shadow flex flex-col"
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        physio.isActive ? "bg-green-100" : "bg-gray-100"
                      }`}
                    >
                      <Stethoscope
                        className={
                          physio.isActive ? "text-green-600" : "text-gray-400"
                        }
                        size={20}
                      />
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {physio.physioName}
                      </h3>
                      <p className="text-xs text-gray-400">
                        {physio.physioCode}
                      </p>
                      <p className="text-sm text-gray-600">{physio.EmpCode}</p>
                      <p className="text-sm text-gray-600">
                        {physio.physioSpcl}
                      </p>
                      <span
                        className={`inline-block px-2 py-1 text-xs rounded-full ${
                          physio.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {physio.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4 flex-grow">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Experience:</span>
                      <span className="text-sm font-medium">
                        {physio.physioExp}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Contact:</span>
                      <span className="text-sm font-medium">
                        {physio.physioContactNo}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Role</span>
                      <span className="text-sm font-medium">
                        {physio.roleId?.RoleName || "No Role"}
                      </span>
                    </div>
                  </div>

                  <div className="border-t pt-4 mb-4">
                    <h4 className="font-medium text-gray-800 mb-2">
                      Performance Stats
                    </h4>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDetails(physio)}
                      className="flex-1"
                    >
                      <Info size={14} className="mr-1" /> Details
                    </Button>

                    {Permissions.isEdit && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(physio)}
                        className="flex-1"
                      >
                        <Edit size={14} className="mr-1" /> Edit
                      </Button>
                    )}
                  </div>

                  <AlertDialog
                    open={openStatusDialog}
                    onOpenChange={setOpenStatusDialog}
                  >
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Action</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to{" "}
                          <strong>
                            {selectedPhysio?.isActive
                              ? "deactivate"
                              : "activate"}
                          </strong>{" "}
                          <strong>{selectedPhysio?.physioName}</strong>?
                        </AlertDialogDescription>
                      </AlertDialogHeader>

                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            handleToggleStatus(selectedPhysio);
                            setOpenStatusDialog(false);
                          }}
                        >
                          Confirm
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <div className="flex space-x-2 mt-2">
                    <Button
                      size="sm"
                      variant={physio.isActive ? "secondary" : "default"}
                      onClick={() => {
                        setSelectedPhysio(physio);
                        setOpenStatusDialog(true);
                      }}
                      className="flex-1"
                    >
                      {physio.isActive ? "Deactivate" : "Activate"}
                    </Button>

                    {Permissions.isDelete && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1"
                          >
                            <Trash2 size={14} className="mr-1" /> Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will
                              permanently delete the physiotherapist.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deletePhysio(physio._id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog
        open={isFormOpen}
        onOpenChange={(e) => {
          setIsFormOpen(e);
          if (!e) {
            setEditingPhysio(false);
            setPhysioForm(initialFormState);
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[95vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {editingPhysio
                ? "Edit Physiotherapist"
                : "Add New Physiotherapist"}
            </DialogTitle>
            <DialogDescription>
              {editingPhysio
                ? "Update the details below."
                : "Fill in the details to add a new physio."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-6 -mr-6">
            <form onSubmit={handleFormSubmit} className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {editingPhysio == true && (
                  <div className="space-y-2">
                    <Label>Physio Code</Label>
                    <Input
                      name="physioCode"
                      value={physioForm.physioCode}
                      onChange={handleFormChange}
                      disabled
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>
                    Emp Code<span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    name="EmpCode"
                    type="text"
                    value={physioForm.EmpCode}
                    onChange={handleFormChange}
                  />
                </div>{" "}
                <div className="space-y-2">
                  <Label>
                    Session Per Day
                    {/* <span className="text-red-500 ml-1">*</span> */}
                  </Label>
                  <Input
                    name="sessionPerDay"
                    type="text"
                    value={physioForm.sessionPerDay}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    Physio Pic<span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    name="physioPic"
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      setPhysioPic(file);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    Name<span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    name="physioName"
                    value={physioForm.physioName}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    Date Of Birth<span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    name="physioDob"
                    type="date"
                    value={physioForm.physioDob}
                    onChange={handleFormChange}
                  />
                </div>
                <div>
                  <Label>
                    Gender<span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Select
                    value={physioForm.physioGenderId}
                    onValueChange={(v) =>
                      handleSelectChange("physioGenderId", v)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      {gender.map((g) => (
                        <SelectItem key={g.GenderIDPK} value={g.GenderIDPK}>
                          {g.genderName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>
                    Contact No<span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    type="tel"
                    name="physioContactNo"
                    value={physioForm.physioContactNo}
                    onChange={handleFormChange}
                    maxLength={10}
                    pattern="[0-9]{10}"
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    Alt No<span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    type="tel"
                    name="physioAltno"
                    value={physioForm.physioAltno}
                    maxLength={10}
                    required
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      if (value.length <= 10) {
                        setPhysioForm({
                          ...physioForm,
                          physioAltno: value,
                        });
                      }
                    }}
                    placeholder="Enter 10-digit number"
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    Relation with Alt No
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    type="text"
                    name="physiorelationAltno"
                    value={physioForm.physiorelationAltno}
                    required
                    onChange={(e) =>
                      setPhysioForm({
                        ...physioForm,
                        physiorelationAltno: e.target.value,
                      })
                    }
                    placeholder="Enter relation"
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    Alt No 2<span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    type="tel"
                    name="physioAltno2"
                    value={physioForm.physioAltno2}
                    maxLength={10}
                    required
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      if (value.length <= 10) {
                        setPhysioForm({
                          ...physioForm,
                          physioAltno2: value,
                        });
                      }
                    }}
                    placeholder="Enter 10-digit number"
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    Relation with Alt No 2
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    type="text"
                    name="physiorelationAltno2"
                    value={physioForm.physiorelationAltno2}
                    required
                    onChange={(e) =>
                      setPhysioForm({
                        ...physioForm,
                        physiorelationAltno2: e.target.value,
                      })
                    }
                    placeholder="Enter relation"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">
                    Password<span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    autoComplete="new-password"
                    value={physioForm.password}
                    onChange={(e) =>
                      setPhysioForm({ ...physioForm, password: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="relative left-40 bottom-9 transform translate-y text-gray-400 hover:text-white"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <div className="space-y-2">
                  <Label>
                    Role<span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Select
                    value={physioForm.roleId}
                    onValueChange={(v) => handleSelectChange("roleId", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Role" />
                    </SelectTrigger>
                    <SelectContent>
                      {Roles.map((role) => (
                        <SelectItem key={role._id} value={role._id}>
                          {role.RoleName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>
                    Designation<span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    name="physioSpcl"
                    value={physioForm.physioSpcl}
                    onChange={handleFormChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    Qualifications<span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    name="physioQulifi"
                    value={physioForm.physioQulifi}
                    onChange={handleFormChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    Experience<span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    name="physioExp"
                    value={physioForm.physioExp}
                    onChange={handleFormChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>
                    PAN<span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    name="physioPAN"
                    value={physioForm.physioPAN}
                    onChange={handleFormChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    Aadhaar<span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    name="physioAadhar"
                    value={physioForm.physioAadhar}
                    onChange={(e) => {
                      let value = e.target.value;
                      value = value.replace(/\D/g, "");
                      value = value.slice(0, 12);
                      setPhysioForm({ ...physioForm, physioAadhar: value });
                    }}
                    placeholder="1234 5678 9012"
                  />
                </div>
              </div>
              <div className="pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Joining Date
                    <span className="text-red-500 ml-1">*</span>
                  </Label>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full h-11 justify-start rounded-xl border-gray-300 bg-white text-left font-normal shadow-sm hover:bg-gray-50",
                          !physioForm.JoiningDate && "text-gray-400",
                        )}
                      >
                        <CalendarIcon className="mr-3 h-4 w-4 text-gray-500" />

                        {physioForm.JoiningDate ? (
                          format(physioForm.JoiningDate, "dd MMM yyyy")
                        ) : (
                          <span>Select joining date</span>
                        )}
                      </Button>
                    </PopoverTrigger>

                    <PopoverContent
                      className="w-auto rounded-2xl border border-gray-200 p-3 shadow-xl"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={physioForm.JoiningDate}
                        onSelect={(date) =>
                          setPhysioForm((prev) => ({
                            ...prev,
                            JoiningDate: date,
                          }))
                        }
                        captionLayout="dropdown"
                        fromYear={2000}
                        toYear={new Date().getFullYear()}
                        disabled={(date) => date > new Date()}
                        initialFocus
                        classNames={{
                          caption_label: "hidden",
                          nav: "hidden",
                          caption_dropdowns: "flex gap-2 justify-center",
                          dropdown:
                            "h-9 rounded-md border border-gray-300 bg-white px-3 text-sm",
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* ================= SALARY ================= */}
                <div className="space-y-2">
                  <Label>
                    Salary (₹)<span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    name="physioSalary"
                    type="number"
                    onWheel={(e) => e.target.blur()}
                    value={physioForm.physioSalary}
                    onChange={handleFormChange}
                  />
                </div>

                {/* ================= PROBATION ================= */}
                <div className="space-y-2">
                  <Label>
                    Probation Period (months)
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    name="physioProbation"
                    type="number"
                    onWheel={(e) => e.target.blur()}
                    value={physioForm.physioProbation}
                    onChange={handleFormChange}
                  />
                </div>

                {/* ================= INCREMENT DATE ================= */}
                <div className="space-y-2">
                  <Label>
                    Next Increment Date
                    <span className="text-red-500 ml-1">*</span>
                  </Label>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !physioForm.physioINCRDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {physioForm.physioINCRDate ? (
                          format(physioForm.physioINCRDate, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>

                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={physioForm.physioINCRDate}
                        onSelect={(date) =>
                          setPhysioForm((prev) => ({
                            ...prev,
                            physioINCRDate: date,
                          }))
                        }
                        initialFocus
                        // ✅ Allow future dates only
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>
                    Petrol Allowance (₹/km)
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    name="physioPetrolAlw"
                    type="number"
                    onWheel={(e) => e.target.blur()}
                    step="0.01"
                    value={physioForm.physioPetrolAlw}
                    onChange={handleFormChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    Vehicle Maintenance (₹)
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    name="physioVehicleMTC"
                    type="number"
                    onWheel={(e) => e.target.blur()}
                    step="100"
                    value={physioForm.physioVehicleMTC}
                    onChange={handleFormChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    Incentive (%)<span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    name="physioIncentive"
                    type="number"
                    onWheel={(e) => e.target.blur()}
                    step="0.01"
                    value={physioForm.physioIncentive}
                    onChange={handleFormChange}
                  />
                </div>
              </div>

              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsFormOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingPhysio ? "Save Changes" : "Create Physio"}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isDetailsOpen}
        onOpenChange={(open) => {
          setIsDetailsOpen(open);
          if (!open) {
            setActiveTab("physiodetails");
            setExpandedPatient(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2">
              <FileText /> Physiotherapist Details
            </DialogTitle>

            <div className="flex gap-2 mt-3">
              <TabButton
                id="physiodetails"
                label={
                  viewingPhysio?.roleId?.RoleName === "HOD"
                    ? "Reviews"
                    : "Completed Sessions"
                }
                icon={User2}
              />
              <TabButton
                id="completed"
                label="Grouped by Patient"
                icon={UserCheck}
              />
            </div>

            <DialogDescription>
              Full profile for {viewingPhysio?.physioName}
            </DialogDescription>
          </DialogHeader>

          {activeTab === "physiodetails" && (
            <div className="mt-4">
              <h2 className="font-semibold text-lg mb-3">
                {viewingPhysio?.roleId?.RoleName === "HOD"
                  ? `Reviews (${completedSessions.length})`
                  : `Completed Sessions (${completedSessions.length})`}
              </h2>

              {completedSessions.length === 0 ? (
                <p>No completed sessions yet.</p>
              ) : (
                <div className="max-h-[55vh] overflow-y-auto space-y-3 pr-2">
                  {completedSessions.map((session) => (
                    <div
                      key={session._id}
                      className="p-3 border rounded shadow-sm bg-white"
                    >
                      <p>
                        <strong>Session Code:</strong>{" "}
                        {session.sessionCode || "-"}
                      </p>
                      <p>
                        <strong>Patient Name:</strong>{" "}
                        {session.patientId?.patientName || "-"}
                      </p>
                      <p>
                        <strong>Date:</strong>{" "}
                        {session.sessionDate
                          ? new Date(session.sessionDate).toLocaleDateString(
                              "en-IN",
                            )
                          : "-"}
                      </p>
                      <p>
                        <strong>Time:</strong> {session.sessionTime || "-"}
                      </p>
                      <p>
                        <strong>Status:</strong>{" "}
                        {session.sessionStatusId?.sessionStatusName || "-"}
                      </p>
                      <p>
                        <strong>Feedback:</strong>{" "}
                        {session.sessionFeedbackPros || session.feedback || "-"}
                      </p>
                      <p>
                        <strong>Goal:</strong>{" "}
                        {session.patientId?.InitialShorttermGoal ||
                          session.patientId?.shortTermGoals ||
                          "N/A"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "completed" && (
            <div className="mt-4">
              <h2 className="font-semibold text-lg mb-3">
                Patients ({Object.keys(groupedSessions).length})
              </h2>

              <div className="max-h-[55vh] overflow-y-auto space-y-3 pr-2">
                {Object.keys(groupedSessions).length === 0 ? (
                  <p>No completed sessions found.</p>
                ) : (
                  Object.entries(groupedSessions).map(([patientId, group]) => (
                    <div key={patientId} className="border rounded-lg">
                      <div
                        onClick={() =>
                          setExpandedPatient(
                            expandedPatient === patientId ? null : patientId,
                          )
                        }
                        className="flex justify-between items-center p-3 cursor-pointer bg-gray-50 hover:bg-gray-100"
                      >
                        <div>
                          <p className="font-semibold">{group.patientName}</p>
                          <p className="text-xs text-gray-500">
                            {group.sessions.length} Session
                            {group.sessions.length > 1 ? "s" : ""}
                          </p>
                        </div>

                        <div>
                          {expandedPatient === patientId ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </div>
                      </div>

                      {expandedPatient === patientId && (
                        <div className="p-3 space-y-2">
                          {group.sessions.map((session) => (
                            <div
                              key={session._id}
                              className="border rounded p-2 bg-white"
                            >
                              <p>
                                <strong>Session:</strong>{" "}
                                {session.sessionCode || "-"}
                              </p>
                              <p>
                                <strong>Date:</strong>{" "}
                                {session.sessionDate
                                  ? new Date(
                                      session.sessionDate,
                                    ).toLocaleDateString("en-IN")
                                  : "-"}
                              </p>
                              <p>
                                <strong>Time:</strong>{" "}
                                {session.sessionTime || "-"}
                              </p>
                              <p>
                                <strong>Status:</strong>{" "}
                                {session.sessionStatusId?.sessionStatusName ||
                                  "-"}
                              </p>
                              <p>
                                <strong>Feedback:</strong>{" "}
                                {session.sessionFeedbackPros ||
                                  session.feedback ||
                                  "-"}
                              </p>
                              <p>
                                <strong>Goal:</strong>{" "}
                                {session.patientId?.InitialShorttermGoal ||
                                  session.patientId?.shortTermGoals ||
                                  "N/A"}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PhysioManagement;
