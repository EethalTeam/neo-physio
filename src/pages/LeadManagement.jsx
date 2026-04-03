import React, { useState, useEffect, useRef, useMemo } from "react";
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
  UserPlus,
  Search,
  Filter,
  Edit,
  Trash2,
  Paperclip,
  User,
  Eye,
  CheckCircle,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "@/components/CustomComponents/apiRequest";

const LeadManagement = () => {
  const navigate = useNavigate();
  const { user, getPermissionsByPath } = useAuth();
  const fileInputRef = useRef(null);

  const [leadSource, setLeadSource] = useState([]);
  const [physioCate, setPhysioCate] = useState([]);
  const [gender, setGender] = useState([]);
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [reference, setReference] = useState([]);
  const [leadStatus, setLeadStatus] = useState([]);
  const [isDocViewOpen, setIsDocViewOpen] = useState(false);
  const [selectedLeadDocs, setSelectedLeadDocs] = useState([]);
  const [selectedLeadName, setSelectedLeadName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [ConsultationDate, setConsultationDate] = useState("");
  const [open, setOpen] = useState(false);
  const [LeadQualify, setLeadQualify] = useState({});

  const initialFormState = {
    leadName: "",
    leadAge: "",
    leadGenderId: "",
    leadContactNo: "",
    leadAddress: "",
    physioCategoryId: "",
    leadSourceId: "",
    leadMedicalHistory: "",
    genderName: "",
    leadSourceName: "",
    leadDocuments: [],
    removedDocuments: [],
    leadId: "",
    ReferenceId: "",
    sourceName: "",
    isQualified: true,
    LeadStatusId: "691c06c97abd26fd38437215",
    leadStatusName: "Pending",
    cbDate: "",
  };

  const [leadForm, setLeadForm] = useState(initialFormState);

  const [Permissions, setPermissions] = useState({
    isAdd: false,
    isView: false,
    isEdit: false,
    isDelete: false,
  });

  const referenceLeadSource = useMemo(() => {
    return leadSource.find(
      (item) => (item?.leadSourceName || "").toLowerCase() === "reference",
    );
  }, [leadSource]);

  useEffect(() => {
    getLeadSource();
    getPhysio();
    getGender();
    getLead();
    getReference();
    getLeadStatus();
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
      getLead();
    }
  }, [Permissions]);

  const getLeadStatus = async () => {
    try {
      const res = await apiRequest("LeadStatus/getAllLeadStatus", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const list = Array.isArray(res)
        ? res
        : res?.leadStatus || res?.data || [];

      setLeadStatus(list);
    } catch (error) {
      console.error("Error loading leadStatus:", error);
      setLeadStatus([]);
    }
  };
  const handleViewDocuments = (lead) => {
    setSelectedLeadDocs(lead?.leadDocuments || []);
    setSelectedLeadName(lead?.leadName || "");
    setIsDocViewOpen(true);
  };
  const getReference = async () => {
    try {
      const res = await apiRequest("References/getALLReferences", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const list = Array.isArray(res)
        ? res
        : res?.reference || res?.references || res?.data || [];

      setReference(list);
    } catch (error) {
      console.error("Error loading Reference:", error);
      setReference([]);
    }
  };

  const QualifyLead = async (lead) => {
    try {
      const payload = {
        ...lead,
        ConsultationDate,
        fromEmployeeId: user?._id,
      };

      const res = await apiRequest("Lead/QualifyLead", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res) {
        getLead();
        toast({
          title: "Success",
          description: "Lead qualified successfully.",
        });
      } else {
        toast({
          title: "Failed",
          description: "Lead qualify failed.",
        });
      }
    } catch (error) {
      console.error("Error qualifying lead:", error);
    }
  };

  const getLeadSource = async () => {
    try {
      const res = await apiRequest("LeadSource/getAllLeadSource", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const list = Array.isArray(res)
        ? res
        : res?.leadSource || res?.leadSources || res?.data || [];

      setLeadSource(list);
    } catch (error) {
      console.error("Error loading LeadSource:", error);
      setLeadSource([]);
    }
  };

  const getPhysio = async () => {
    try {
      const res = await apiRequest("PhysioCategory/getAllPhysioCategory", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const list = Array.isArray(res)
        ? res
        : res?.physioCategory || res?.physioCategories || res?.data || [];

      setPhysioCate(list);
    } catch (error) {
      console.error("Error loading Physio:", error);
      setPhysioCate([]);
    }
  };

  const getGender = async () => {
    try {
      const res = await apiRequest("Gender/getAllGender", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const list = Array.isArray(res)
        ? res
        : res?.gender || res?.genders || res?.data || [];

      setGender(list);
    } catch (error) {
      console.error("Error loading Gender:", error);
      setGender([]);
    }
  };

  const getLead = async () => {
    try {
      const response = await apiRequest("Lead/getAllLead", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const allLeads = response?.leads || [];
      const otherLeads = allLeads.filter(
        (lead) =>
          lead.isQualified !== "true" &&
          lead?.LeadStatusId?.leadStatusName !== "Qualified",
      );

      setLeads(otherLeads);
      setFilteredLeads(otherLeads);
    } catch (error) {
      console.error("Error loading leads:", error);
    }
  };

  const createLead = async (data) => {
    try {
      const formData = new FormData();

      // append all fields
      Object.keys(data).forEach((key) => {
        if (key !== "leadDocuments") {
          formData.append(key, data[key]);
        }
      });

      // append files
      data.leadDocuments.forEach((file) => {
        formData.append("leadDocuments", file); //  MUST MATCH BACKEND
      });

      const response = await fetch("/api/Lead/createLead", {
        method: "POST",
        body: formData,
      });

      const res = await response.json();

      toast({
        title: "Success",
        description: "Lead created successfully.",
      });

      getLead();
      setIsFormOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  const updateLead = async (data) => {
    try {
      const formData = new FormData();

      Object.keys(data).forEach((key) => {
        if (key !== "leadDocuments" && key !== "removedDocuments") {
          formData.append(key, data[key] ?? "");
        }
      });

      if (data.removedDocuments?.length) {
        formData.append(
          "removedDocuments",
          JSON.stringify(data.removedDocuments),
        );
      }

      if (data.leadDocuments?.length) {
        data.leadDocuments.forEach((file) => {
          // send only new files
          if (file instanceof File) {
            formData.append("leadDocuments", file);
          }
        });
      }

      const res = await apiRequest("Lead/updateLead", {
        method: "POST",
        body: formData,
      });

      toast({
        title: "Updated",
        description: "Lead updated successfully.",
      });

      setIsFormOpen(false);
      getLead();

      return res;
    } catch (error) {
      console.error("Error updating lead:", error);
    }
  };

  const deleteLead = async (id) => {
    try {
      await apiRequest("Lead/deleteLead", {
        method: "POST",
        body: JSON.stringify({ _id: id }),
      });

      toast({
        title: "Deleted",
        description: "Lead has been removed.",
        variant: "destructive",
      });

      getLead();
    } catch (error) {
      console.error("Error deleting lead:", error);
    }
  };

  useEffect(() => {
    let filtered = leads;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (lead) =>
          lead.leadName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.leadContactNo?.includes(searchTerm),
      );
    }

    // Status filter (UPDATED)
    if (statusFilter !== "all") {
      filtered = filtered.filter((lead) => {
        const leadStatusId =
          lead?.LeadStatusId?._id ||
          lead?.LeadStatusId?.LeadStatusIDPK ||
          lead?.LeadStatusId;

        return leadStatusId === statusFilter;
      });
    }

    setFilteredLeads(filtered);
  }, [searchTerm, statusFilter, leads]);
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setLeadForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setLeadForm((prev) => ({ ...prev, [name]: value }));
  };

  const isCBStatus = useMemo(() => {
    const selected = leadStatus.find(
      (s) => (s._id || s.LeadStatusIDPK) === leadForm.LeadStatusId,
    );

    const statusName =
      selected?.leadStatusName ||
      selected?.LeadStatusName ||
      leadForm.leadStatusName ||
      "";

    return statusName.toLowerCase() === "cb";
  }, [leadStatus, leadForm.LeadStatusId, leadForm.leadStatusName]);
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);

    setLeadForm((prev) => ({
      ...prev,
      leadDocuments: [...prev.leadDocuments, ...files],
    }));

    toast({
      title: "File Added",
      description: `${files.length} file(s) added.`,
    });
  };
  const handleRemoveDocument = (doc, index) => {
    setLeadForm((prev) => {
      const updatedDocs = [...(prev.leadDocuments || [])];
      updatedDocs.splice(index, 1);

      const updatedRemoved = [...(prev.removedDocuments || [])];

      if (doc?.fileUrl) {
        updatedRemoved.push(doc.fileUrl);
      }

      return {
        ...prev,
        leadDocuments: updatedDocs,
        removedDocuments: updatedRemoved,
      };
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!leadForm.leadName) {
      toast({
        title: "Alert",
        description: "Please Enter Lead Name",
        variant: "destructive",
      });
      return;
    }

    if (!leadForm.leadAge) {
      toast({
        title: "Alert",
        description: "Please Enter Lead Age",
        variant: "destructive",
      });
      return;
    }

    if (!leadForm.leadGenderId) {
      toast({
        title: "Alert",
        description: "Please select Gender",
        variant: "destructive",
      });
      return;
    }

    if (!leadForm.leadContactNo) {
      toast({
        title: "Alert",
        description: "Please Enter Lead Mobile number",
        variant: "destructive",
      });
      return;
    }

    if (!leadForm.leadAddress) {
      toast({
        title: "Alert",
        description: "Please Enter Lead Address",
        variant: "destructive",
      });
      return;
    }

    if (!leadForm.LeadStatusId) {
      toast({
        title: "Alert",
        description: "Please select Lead Status",
        variant: "destructive",
      });
      return;
    }

    const selectedStatus = leadStatus.find(
      (s) => (s._id || s.LeadStatusIDPK) === leadForm.LeadStatusId,
    );

    const selectedStatusName =
      selectedStatus?.leadStatusName || selectedStatus?.LeadStatusName || "";

    if (selectedStatusName === "CB" && !leadForm.cbDate) {
      toast({
        title: "Alert",
        description: "Please select Call Back Date",
        variant: "destructive",
      });
      return;
    }

    if (!leadForm.physioCategoryId) {
      toast({
        title: "Alert",
        description: "Please select Physio Category",
        variant: "destructive",
      });
      return;
    }

    if (!leadForm.leadSourceId) {
      toast({
        title: "Alert",
        description: "Please select Lead Source",
        variant: "destructive",
      });
      return;
    }

    if (leadForm.leadSourceName === "Reference" && !leadForm.ReferenceId) {
      toast({
        title: "Alert",
        description: "Please select Reference",
        variant: "destructive",
      });
      return;
    }

    if (editingLead) {
      await updateLead(leadForm);
      setIsFormOpen(false);
    } else {
      await createLead(leadForm);
      setIsFormOpen(false);
    }
  };

  useEffect(() => {
    if (leadStatus.length > 0 && !leadForm.LeadStatusId) {
      const pendingStatus = leadStatus.find(
        (st) => (st?.leadStatusName || st?.LeadStatusName) === "Pending",
      );

      if (pendingStatus) {
        setLeadForm((prev) => ({
          ...prev,
          LeadStatusId: pendingStatus._id || pendingStatus.LeadStatusIDPK,
        }));
      }
    }
  }, [leadStatus, leadForm.LeadStatusId]);

  const handleEdit = (lead) => {
    setEditingLead(lead);

    const referenceId =
      lead?.ReferenceId?._id || lead?.ReferenceId?.ReferenceIDPK || "";

    const referenceName =
      lead?.ReferenceId?.sourceName ||
      lead?.ReferenceId?.referenceName ||
      lead?.ReferenceId?.ReferenceName ||
      "";

    const detectedLeadSourceName =
      lead?.leadSourceName ||
      lead?.leadSourceId?.leadSourceName ||
      lead?.leadSourceId?.LeadSourceName ||
      "";

    const isReferenceLead =
      detectedLeadSourceName.toLowerCase() === "reference" || !!referenceId;

    const detectedLeadSourceId =
      lead?.leadSourceId?._id ||
      lead?.leadSourceId?.LeadIDPK ||
      lead?.leadSourceId ||
      "";

    const finalLeadSourceId = isReferenceLead
      ? referenceLeadSource?.LeadIDPK ||
        referenceLeadSource?._id ||
        detectedLeadSourceId
      : detectedLeadSourceId;

    const finalLeadSourceName = isReferenceLead
      ? "Reference"
      : detectedLeadSourceName;

    const genderId =
      lead?.leadGenderId?._id ||
      lead?.leadGenderId?.GenderIDPK ||
      lead?.leadGenderId ||
      "";

    const physioCategoryId =
      lead?.physioCategoryId?._id ||
      lead?.physioCategoryId?.PhysioCateIDPK ||
      lead?.physioCategoryId?.PhysioCategoryIDPK ||
      lead?.physioCategoryId ||
      "";

    const leadStatusId =
      lead?.LeadStatusId?._id ||
      lead?.LeadStatusId?.LeadStatusIDPK ||
      lead?.LeadStatusId ||
      "";

    setLeadForm({
      leadName: lead?.leadName || "",
      leadAge: lead?.leadAge || "",
      leadGenderId: genderId,
      leadContactNo: lead?.leadContactNo || "",
      leadAddress: lead?.leadAddress || "",
      physioCategoryId,
      leadSourceId: finalLeadSourceId,
      leadMedicalHistory: lead?.leadMedicalHistory || "",
      genderName:
        lead?.leadGenderId?.genderName || lead?.leadGenderId?.GenderName || "",
      leadSourceName: finalLeadSourceName,
      leadDocuments: lead?.leadDocuments || [],
      leadId: lead?._id || "",
      ReferenceId: referenceId,
      sourceName: referenceName,
      isQualified: lead?.isQualified ?? true,
      LeadStatusId: leadStatusId,
      removedDocuments: [],
      leadStatusName:
        lead?.LeadStatusId?.leadStatusName ||
        lead?.LeadStatusId?.LeadStatusName ||
        "",
      cbDate: lead?.cbDate
        ? new Date(lead.cbDate).toISOString().split("T")[0]
        : "",
    });

    setIsFormOpen(true);
  };

  const openNewLeadDialog = () => {
    setEditingLead(null);
    setLeadForm(initialFormState);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4 w-full"
      >
        <div>
          <h1 className="md:text-3xl text-xl font-bold text-gray-900">
            Lead Management
          </h1>
          <p className="text-gray-600 mt-1 text-sm md:text-xs">
            Manage and track potential patients from all sources.
          </p>
        </div>

        {Permissions.isAdd && (
          <Button
            onClick={openNewLeadDialog}
            className="shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-shadow"
          >
            <UserPlus size={18} className="mr-2" /> Add New Lead
          </Button>
        )}
      </motion.div>

      <Card className="max-w-xs md:max-w-none">
        <CardHeader>
          <CardTitle className="text-md font-bold md:text-2xl">
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or contact..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">All</SelectItem>

                  {leadStatus.map((status) => {
                    const id = status._id || status.LeadStatusIDPK;
                    const name =
                      status.leadStatusName || status.LeadStatusName || "";
                    const color = status.leadStatusColor || "#ccc";

                    return (
                      <SelectItem key={id} value={id}>
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: color }}
                          ></span>
                          {name}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle>Leads ({filteredLeads.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Contact</th>
                <th className="p-3 text-left">Physio Category</th>
                <th className="p-3 text-left">Lead Source</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <tr key={lead._id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{lead.leadName}</td>
                  <td className="p-3">{lead.leadContactNo}</td>
                  <td className="p-3">
                    <span className="text-xs font-extralight border-2 border-blue-200 p-2 bg-blue-200 text-blue-700 rounded-2xl">
                      {lead?.physioCategoryId?.physioCateName || "-"}
                    </span>
                  </td>
                  <td className="p-3">
                    {lead?.ReferenceId?.sourceName ||
                      lead?.ReferenceId?.referenceName ||
                      lead?.ReferenceId?.ReferenceName ||
                      lead?.leadSourceName ||
                      lead?.leadSourceId?.leadSourceName ||
                      "-"}
                  </td>
                  <td className="p-3">
                    <span
                      style={{
                        backgroundColor:
                          lead?.LeadStatusId?.leadStatusColor || "white",
                      }}
                      className="text-xs font-extralight border-2 p-2 rounded-2xl"
                    >
                      {lead?.LeadStatusId?.leadStatusName || "-"}
                    </span>
                  </td>
                  <td className="p-3 flex gap-2">
                    <Dialog open={open} onOpenChange={setOpen}>
                      <DialogContent className="max-w-md max-h-[90vh] backdrop-blur-lg">
                        <DialogHeader>
                          <DialogTitle>Qualify Lead</DialogTitle>
                          <td>Schedule the initial consultation for</td>
                        </DialogHeader>
                        <div className="space-y-3">
                          <Label>Consultation Date</Label>
                          <Input
                            type="date"
                            value={ConsultationDate}
                            onChange={(e) =>
                              setConsultationDate(e.target.value)
                            }
                          />
                        </div>
                        <DialogFooter>
                          <Button
                            onClick={() => setOpen(false)}
                            variant="outline"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => {
                              QualifyLead(LeadQualify);
                              setOpen(false);
                            }}
                          >
                            Qualify & Notify HOD
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <td className="p-3 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDocuments(lead)}
                        disabled={!lead?.leadDocuments?.length}
                      >
                        <Eye size={14} />
                      </Button>

                      {lead?.LeadStatusId?.leadStatusName !== "Qualified" &&
                        Permissions.isEdit && (
                          <Button
                            variant="default"
                            onClick={() => {
                              setLeadQualify(lead);
                              setOpen(true);
                            }}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Qualify
                          </Button>
                        )}

                      {lead?.LeadStatusId?.leadStatusName !== "Qualified" &&
                        Permissions.isEdit && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(lead)}
                          >
                            <Edit size={14} />
                          </Button>
                        )}
                    </td>

                    {lead?.LeadStatusId?.leadStatusName !== "Qualified" &&
                      Permissions.isDelete && (
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
                                This will permanently delete the lead.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteLead(lead._id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="md:hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">
            Leads ({filteredLeads.length})
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="grid gap-3">
            {filteredLeads.map((lead) => (
              <div
                key={lead._id}
                className="border rounded-lg p-3 shadow-sm bg-white flex flex-col gap-3"
              >
                <div className="space-y-1.5">
                  <div className="flex space-x-4 mb-3 justify-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="text-blue-600" size={25} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-600">
                        <span className="font-normal text-gray-500 text-sm">
                          {lead.leadName}
                        </span>
                      </p>

                      <p className="text-xs text-gray-600">
                        <span className="font-normal text-gray-500 text-sm">
                          {lead.leadContactNo}
                        </span>
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 flex justify-center items-center me-4 gap-2">
                    <span className="font-semibold text-gray-900 text-sm">
                      Status:
                    </span>
                    <span
                      className="text-[10px] px-2 py-[2px] rounded-md inline-block"
                      style={{
                        backgroundColor:
                          lead?.LeadStatusId?.leadStatusColor || "#e5e7eb",
                      }}
                    >
                      {lead?.LeadStatusId?.leadStatusName}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-2 me-4 justify-center">
                  {lead?.LeadStatusId?.leadStatusName !== "Qualified" &&
                    Permissions.isEdit && (
                      <Button
                        size="icon"
                        variant="default"
                        onClick={() => {
                          setLeadQualify(lead);
                          setOpen(true);
                        }}
                        className="h-8 w-8 bg-blue-600 hover:bg-blue-700"
                      >
                        <CheckCircle size={14} />
                      </Button>
                    )}

                  {lead?.LeadStatusId?.leadStatusName !== "Qualified" &&
                    Permissions.isEdit && (
                      <Button size="icon" variant="outline" className="h-8 w-8">
                        <Edit size={14} onClick={() => handleEdit(lead)} />
                      </Button>
                    )}

                  {lead?.LeadStatusId?.leadStatusName !== "Qualified" &&
                    Permissions.isDelete && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="destructive"
                            className="h-8 w-8"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the lead.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteLead(lead._id)}
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

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingLead ? "Edit Lead" : "Create Lead"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>
                  Name <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  name="leadName"
                  value={leadForm.leadName}
                  onChange={handleFormChange}
                />
              </div>

              <div>
                <Label>
                  Age<span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  type="number"
                  onWheel={(e) => {
                    e.target.blur();
                  }}
                  name="leadAge"
                  value={leadForm.leadAge}
                  onChange={(e) => {
                    let value = e.target.value;
                    if (value.length > 2) return;
                    setLeadForm((prev) => ({
                      ...prev,
                      leadAge: value,
                    }));
                  }}
                  placeholder="Enter Age"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>
                  Gender<span className="text-red-500 ml-1">*</span>
                </Label>
                <Select
                  value={leadForm.leadGenderId || ""}
                  onValueChange={(v) => handleSelectChange("leadGenderId", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    {gender.map((g) => (
                      <SelectItem
                        key={g.GenderIDPK || g._id}
                        value={g.GenderIDPK || g._id}
                      >
                        {g.genderName || g.GenderName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>
                  Contact<span className="text-red-500 ml-1">*</span>
                </Label>

                <div className="flex">
                  <span className="px-3 flex items-center border border-r-0 rounded-l-md bg-gray-100">
                    +91
                  </span>

                  <Input
                    name="leadContactNo"
                    value={leadForm.leadContactNo}
                    onChange={(e) => {
                      let value = e.target.value;
                      value = value.replace(/\D/g, "");
                      if (value.startsWith("91") && value.length > 10) {
                        value = value.slice(-10);
                      }
                      value = value.slice(0, 10);
                      setLeadForm((prev) => ({
                        ...prev,
                        leadContactNo: value,
                      }));
                    }}
                    inputMode="numeric"
                    placeholder="Enter mobile number"
                    className="rounded"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>
                  Address<span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  name="leadAddress"
                  value={leadForm.leadAddress}
                  onChange={handleFormChange}
                />
              </div>

              <div>
                <Label>
                  Lead Status<span className="text-red-500 ml-1">*</span>
                </Label>
                <Select
                  value={leadForm.LeadStatusId || ""}
                  onValueChange={(v) => handleSelectChange("LeadStatusId", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Lead Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {leadStatus.map((leadst) => (
                      <SelectItem
                        key={leadst._id || leadst.LeadStatusIDPK}
                        value={leadst._id || leadst.LeadStatusIDPK}
                      >
                        {leadst.leadStatusName || leadst.LeadStatusName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {isCBStatus && (
                  <div>
                    <Label>
                      Call Back Date<span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      type="date"
                      name="cbDate"
                      value={leadForm.cbDate}
                      onChange={handleFormChange}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>
                  Physio Category<span className="text-red-500 ml-1">*</span>
                </Label>
                <Select
                  value={leadForm.physioCategoryId || ""}
                  onValueChange={(v) =>
                    handleSelectChange("physioCategoryId", v)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Physio Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {physioCate.map((physio) => (
                      <SelectItem
                        key={
                          physio.PhysioCateIDPK ||
                          physio.PhysioCategoryIDPK ||
                          physio._id
                        }
                        value={
                          physio.PhysioCateIDPK ||
                          physio.PhysioCategoryIDPK ||
                          physio._id
                        }
                      >
                        {physio.physioCateName || physio.PhysioCateName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>
                  Lead Source<span className="text-red-500 ml-1">*</span>
                </Label>

                <Select
                  value={leadForm.leadSourceId || ""}
                  onValueChange={(v) => {
                    const selected = leadSource.find(
                      (item) => (item.LeadIDPK || item._id) === v,
                    );

                    const selectedName =
                      selected?.leadSourceName ||
                      selected?.LeadSourceName ||
                      "";

                    handleSelectChange("leadSourceId", v);
                    handleSelectChange("leadSourceName", selectedName);

                    if (selectedName !== "Reference") {
                      handleSelectChange("ReferenceId", "");
                      handleSelectChange("sourceName", "");
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Lead Source" />
                  </SelectTrigger>

                  <SelectContent>
                    {leadSource.map((leads) => {
                      const id = leads.LeadIDPK || leads._id;
                      const name = leads.leadSourceName || leads.LeadSourceName;

                      return (
                        <SelectItem key={id} value={id}>
                          {name}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {leadForm.leadSourceName === "Reference" && (
                <div className="space-y-2">
                  <Label>
                    Reference<span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Select
                    value={leadForm.ReferenceId || ""}
                    onValueChange={(v) => {
                      const selected = reference.find(
                        (ref) => (ref._id || ref.ReferenceIDPK) === v,
                      );

                      handleSelectChange("ReferenceId", v);
                      handleSelectChange(
                        "sourceName",
                        selected?.sourceName ||
                          selected?.referenceName ||
                          selected?.ReferenceName ||
                          "",
                      );
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Reference" />
                    </SelectTrigger>
                    <SelectContent>
                      {reference.map((ref) => {
                        const refId = ref._id || ref.ReferenceIDPK;
                        const refName =
                          ref.sourceName ||
                          ref.referenceName ||
                          ref.ReferenceName ||
                          "-";

                        return (
                          <SelectItem key={refId} value={refId}>
                            {refName}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div>
              <Label>Medical History</Label>
              <Input
                name="leadMedicalHistory"
                value={leadForm.leadMedicalHistory}
                onChange={handleFormChange}
              />
            </div>

            <div>
              <Label>Documents</Label>
              <Input type="file" multiple onChange={handleFileUpload} />

              <div className="mt-2 space-y-2">
                {leadForm.leadDocuments?.map((doc, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between border rounded p-2"
                  >
                    <span className="text-sm">
                      {doc instanceof File ? doc.name : doc.fileName}
                    </span>

                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveDocument(doc, index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingLead ? "Update Lead" : "Create Lead"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={isDocViewOpen} onOpenChange={setIsDocViewOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedLeadName} - Documents</DialogTitle>
          </DialogHeader>

          {selectedLeadDocs.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {selectedLeadDocs.map((doc, index) => {
                const fileUrl = `http://localhost:8002${doc.fileUrl}`;
                const isImage = doc?.fileType?.startsWith("image/");

                return (
                  <div key={index} className="border rounded-lg p-2 space-y-2">
                    {isImage ? (
                      <img
                        src={fileUrl}
                        alt={doc.fileName}
                        className="w-full h-40 object-cover rounded cursor-pointer"
                        onClick={() => window.open(fileUrl, "_blank")}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-40 border rounded">
                        <Paperclip className="w-8 h-8 text-gray-500" />
                        <p className="text-xs text-center mt-2 break-all">
                          {doc.fileName}
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          className="mt-2"
                          onClick={() => window.open(fileUrl, "_blank")}
                        >
                          View File
                        </Button>
                      </div>
                    )}

                    <p className="text-xs text-center break-all">
                      {doc.fileName}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center">
              No documents found
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeadManagement;
