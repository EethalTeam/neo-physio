import React, { useEffect, useMemo, useRef, useState } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import AnimatedNumber from "@/components/CustomComponents/AnimatedNumber";
import { useNavigate } from "react-router-dom";
import {
  Users,
  UserPlus,
  Calendar as CalendarIconLucide,
  DollarSign,
  TrendingUp,
  Activity,
  Paperclip,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/components/CustomComponents/apiRequest";

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const initialSessionFormState = {
    sessionCount: "",
    sessionCode: "",
    patientId: "",
    physioId: "",
    sessionDates: [],
    sessionDay: "",
    sessionTime: "",
    machineId: "",
    sessionStatusId: "691ecb36b87c5c57dead47a7",
  };

  const initialLeadFormState = {
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
    leadId: "",
    ReferenceId: "",
    sourceName: "",
    isQualified: true,
    LeadStatusId: "691c06c97abd26fd38437215",
    leadStatusName: "Pending",
    cbDate: "",
  };

  const [sessionForm, setSessionForm] = useState(initialSessionFormState);
  const [leadForm, setLeadForm] = useState(initialLeadFormState);

  const [physios, setPhysios] = useState([]);
  const [patients, setPatients] = useState([]);
  const [cbNotifications, setCbNotifications] = useState([]);

  const [genderList, setGenderList] = useState([]);
  const [physioCategories, setPhysioCategories] = useState([]);
  const [leadSources, setLeadSources] = useState([]);
  const [leadStatus, setLeadStatus] = useState([]);
  const [references, setReferences] = useState([]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);

  const [dateFilter, setDateFilter] = useState({
    fromDate: "",
    toDate: "",
  });

  const [todayRevenue, setTodayRevenue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [leadLoading, setLeadLoading] = useState(false);
  const [linkpop, setLinkpop] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");

  const [stats, setStats] = useState({
    lead: 0,
    patient: 0,
    monthlySessions: 0,
    monthlyRevenue: 0,
    physio: 0,
    sessionCompleted: 0,
    avgPatientPerPhysio: 0,
    avgPricePerSession: 0,
    todaysession: 0,
    todayCompletedSession: 0,
  });

  const formatDateForInput = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const year = d.getFullYear();
    const month = `${d.getMonth() + 1}`.padStart(2, "0");
    const day = `${d.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getDayName = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", { weekday: "long" });
  };

  const normalizeSessionDates = (dates = []) => {
    return dates.map((date) => formatDateForInput(date));
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setLeadForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setLeadForm((prev) => {
      const updated = { ...prev, [name]: value };

      if (name === "leadGenderId") {
        const selected = genderList.find(
          (g) => (g._id || g.GenderIDPK) === value,
        );
        updated.genderName = selected?.genderName || selected?.GenderName || "";
      }

      if (name === "LeadStatusId") {
        const selected = leadStatus.find(
          (s) => (s._id || s.LeadStatusIDPK) === value,
        );
        updated.leadStatusName =
          selected?.leadStatusName || selected?.LeadStatusName || "";
      }

      if (name === "physioCategoryId") {
        updated.physioCategoryId = value;
      }

      return updated;
    });
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    const fileNames = files.map((file) => file.name);

    setLeadForm((prev) => ({
      ...prev,
      leadDocuments: [...prev.leadDocuments, ...fileNames],
    }));
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

    return statusName.toLowerCase().includes("call back");
  }, [leadForm.LeadStatusId, leadForm.leadStatusName, leadStatus]);

  const getPhysio = async (data = {}) => {
    try {
      const response = await apiRequest("Physio/getAllPhysio", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setPhysios(response?.physios || []);
    } catch (error) {
      console.error("error from frontend getAllPhysio", error);
    }
  };

  const getPatients = async (data = {}) => {
    try {
      const response = await apiRequest("Patient/getAllPatient", {
        method: "POST",
        body: JSON.stringify(data),
      });

      const patientList = Array.isArray(response)
        ? response
        : response?.patients || response?.data || [];

      setPatients(patientList);
    } catch (error) {
      console.error("error from frontend getAllPatient", error);
    }
  };

  const getPhysioCategory = async () => {
    try {
      const response = await apiRequest("PhysioCategory/getAllPhysioCategory", {
        method: "POST",
        body: JSON.stringify({}),
      });
      setPhysioCategories(
        response?.physioCategory ||
          response?.data ||
          response?.physioCategories ||
          response ||
          [],
      );
    } catch (error) {
      console.error("getPhysioCategory error:", error);
    }
  };

  const getGender = async () => {
    try {
      const response = await apiRequest("Gender/getAllGender", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const list = Array.isArray(response)
        ? response
        : response?.gender || response?.genders || response?.data || [];

      setGenderList(list);
    } catch (error) {
      console.error("getGender error:", error);
      setGenderList([]);
    }
  };

  const getLeadSource = async () => {
    try {
      const response = await apiRequest("LeadSource/getAllLeadSource", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const list = Array.isArray(response)
        ? response
        : response?.leadSource || response?.leadSources || response?.data || [];

      setLeadSources(list);
    } catch (error) {
      console.error("getLeadSource error:", error);
      setLeadSources([]);
    }
  };

  const getLeadStatus = async () => {
    try {
      const response = await apiRequest("LeadStatus/getAllLeadStatus", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const list = Array.isArray(response)
        ? response
        : response?.leadStatus ||
          response?.leadStatuses ||
          response?.data ||
          [];

      setLeadStatus(list);
    } catch (error) {
      console.error("getLeadStatus error:", error);
      setLeadStatus([]);
    }
  };

  const getReferences = async () => {
    try {
      const response = await apiRequest("References/getALLReferences", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const list = Array.isArray(response)
        ? response
        : response?.reference || response?.references || response?.data || [];

      setReferences(list);
    } catch (error) {
      console.error("getReferences error:", error);
      setReferences([]);
    }
  };
  const [leads, setLead] = useState([]);
  const getCbNotifications = async () => {
    try {
      const res = await apiRequest("Lead/getAllLead", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const allLeads = Array.isArray(res) ? res : res?.leads || [];

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const filtered = allLeads.filter((lead) => {
        const statusName =
          lead?.LeadStatusId?.leadStatusName ||
          lead?.LeadStatusId?.LeadStatusName ||
          "";

        // only CB status
        if (statusName.toLowerCase() !== "cb") return false;

        // cbDate required
        if (!lead?.cbDate) return false;

        const cbDate = new Date(lead.cbDate);
        if (isNaN(cbDate.getTime())) return false;

        cbDate.setHours(0, 0, 0, 0);

        const threeDaysBefore = new Date(cbDate);
        threeDaysBefore.setDate(cbDate.getDate() - 3);

        return today >= threeDaysBefore && today <= cbDate;
      });

      filtered.sort((a, b) => new Date(a.cbDate) - new Date(b.cbDate));

      setCbNotifications(filtered);
      setLead(allLeads);
    } catch (error) {
      console.error("getCbNotifications error:", error);
    }
  };

  const getDaysLeft = (cbDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const target = new Date(cbDate);
    target.setHours(0, 0, 0, 0);

    const diffTime = target - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const fetchTodayRevenue = async () => {
    try {
      const res = await apiRequest("DashBoard/getTodayIncome", {
        method: "POST",
        body: JSON.stringify({}),
      });
      setTodayRevenue(Number(res?.totalCompletedAmount || 0));
    } catch (err) {
      console.error("fetchTodayRevenue error:", err);
    }
  };

  const getAllDashBoard = async (filterData = {}) => {
    try {
      const response = await apiRequest("DashBoard/getAllDashBoard", {
        method: "POST",
        body: JSON.stringify(filterData),
      });

      setStats((prev) => ({
        ...prev,
        ...response,
      }));
    } catch (error) {
      console.error("getAllDashBoard error:", error);
    }
  };

  const fetchIncomeByDate = async (filter = {}) => {
    try {
      const payload = { ...filter };

      if (payload.fromDate && !payload.toDate) {
        payload.toDate = payload.fromDate;
      }

      const res = await apiRequest("DashBoard/getIncomeByDate", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setStats((prev) => ({
        ...prev,
        monthlyRevenue: Number(res?.totalCompletedAmount || 0),
        avgPricePerSession: Number(res?.avgPricePerSession || 0),
      }));
    } catch (err) {
      console.error("fetchIncomeByDate error:", err);
    }
  };

  const getCreateSession = async (data) => {
    try {
      const response = await apiRequest("Session/createSession", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response;
    } catch (error) {
      console.error("create session error:", error);
      throw error;
    }
  };

  const updateSession = async (data) => {
    try {
      const response = await apiRequest("Session/updateSession", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response;
    } catch (error) {
      console.error("update session error:", error);
      throw error;
    }
  };

  const createLead = async (data) => {
    try {
      const response = await apiRequest("Lead/createLead", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response;
    } catch (error) {
      console.error("create lead error:", error);
      throw error;
    }
  };

  const refreshDashboardData = async () => {
    const payload = { ...dateFilter };

    if (payload.fromDate && !payload.toDate) {
      payload.toDate = payload.fromDate;
    }

    await Promise.all([
      getAllDashBoard(payload),
      fetchIncomeByDate(payload),
      fetchTodayRevenue(),
      getCbNotifications(),
      getPhysio(),
      getPatients(),
      getGender(),
      getPhysioCategory(),
      getLeadSource(),
      getLeadStatus(),
      getReferences(),
    ]);
  };

  useEffect(() => {
    AOS.init({ duration: 700, once: true, easing: "ease-out-cubic" });
    refreshDashboardData();
  }, []);

  useEffect(() => {
    const payload = { ...dateFilter };
    if (payload.fromDate && !payload.toDate) {
      payload.toDate = payload.fromDate;
    }

    getAllDashBoard(payload);
    fetchIncomeByDate(payload);
  }, [dateFilter]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!sessionForm.patientId) {
      toast({
        title: "Validation Alert",
        description: "Please select a patient",
        variant: "destructive",
      });
      return;
    }

    if (!sessionForm.physioId) {
      toast({
        title: "Validation Alert",
        description: "Please select a physiotherapist",
        variant: "destructive",
      });
      return;
    }

    if (!sessionForm.sessionDates || sessionForm.sessionDates.length === 0) {
      toast({
        title: "Validation Alert",
        description: "Please select at least one session date",
        variant: "destructive",
      });
      return;
    }

    if (!sessionForm.sessionTime) {
      toast({
        title: "Validation Alert",
        description: "Please select session time",
        variant: "destructive",
      });
      return;
    }

    try {
      const formData = {
        ...sessionForm,
        patientId: sessionForm.patientId,
        physioId: sessionForm.physioId,
        machineId: sessionForm.machineId || null,
        sessionDates: normalizeSessionDates(sessionForm.sessionDates),
      };

      if (editingSession) {
        await updateSession({
          ...formData,
          _id: editingSession?._id,
        });

        toast({
          title: "Success",
          description: "Session updated successfully",
        });
      } else {
        await getCreateSession(formData);

        toast({
          title: "Success",
          description: "Session scheduled successfully",
        });
      }

      setIsFormOpen(false);
      setEditingSession(null);
      setSessionForm(initialSessionFormState);
      await refreshDashboardData();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error?.message || "Something went wrong while saving session",
        variant: "destructive",
      });
    }
  };

  const handleLeadSubmit = async (e) => {
    e.preventDefault();

    if (!leadForm.leadName?.trim()) {
      toast({
        title: "Validation Alert",
        description: "Please enter lead name",
        variant: "destructive",
      });
      return;
    }

    if (!leadForm.leadContactNo?.trim()) {
      toast({
        title: "Validation Alert",
        description: "Please enter contact number",
        variant: "destructive",
      });
      return;
    }

    if (!leadForm.leadGenderId) {
      toast({
        title: "Validation Alert",
        description: "Please select gender",
        variant: "destructive",
      });
      return;
    }

    if (!leadForm.physioCategoryId) {
      toast({
        title: "Validation Alert",
        description: "Please select physio category",
        variant: "destructive",
      });
      return;
    }

    if (!leadForm.leadSourceId) {
      toast({
        title: "Validation Alert",
        description: "Please select lead source",
        variant: "destructive",
      });
      return;
    }

    if (leadForm.leadSourceName === "Reference" && !leadForm.ReferenceId) {
      toast({
        title: "Validation Alert",
        description: "Please select reference",
        variant: "destructive",
      });
      return;
    }

    try {
      setLeadLoading(true);

      const payload = {
        ...leadForm,
        leadAge: leadForm.leadAge ? Number(leadForm.leadAge) : "",
        cbDate: leadForm.cbDate || "",
      };

      await createLead(payload);

      toast({
        title: "Success",
        description: "Lead created successfully",
      });

      setLeadForm(initialLeadFormState);
      setIsLeadFormOpen(false);
      await refreshDashboardData();
    } catch (error) {
      toast({
        title: "Error",
        description: error?.message || "Failed to create lead",
        variant: "destructive",
      });
    } finally {
      setLeadLoading(false);
    }
  };

  const resetFilter = () => {
    setDateFilter({ fromDate: "", toDate: "" });
  };

  const handleGenerateLink = async () => {
    try {
      setLoading(true);

      const response = await apiRequest("Link/createSecureLink", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const link =
        response?.link ||
        response?.data?.link ||
        response?.secureLink ||
        response?.url ||
        "";

      if (!link) {
        toast({
          title: "Error",
          description: "Link not found in API response.",
          variant: "destructive",
        });
        return;
      }

      setGeneratedLink(link);
      setLinkpop(true);

      toast({
        title: "Success",
        description: "Link generated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate link.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async (link) => {
    try {
      await navigator.clipboard.writeText(link);
      toast({
        title: "Copied",
        description: "Link copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Unable to copy link",
        variant: "destructive",
      });
    }
  };

  const copyAndShareToWhatsApp = async (link) => {
    try {
      await navigator.clipboard.writeText(link);
      const message = encodeURIComponent(`Hi, here is the link: ${link}`);
      const whatsappUrl = `https://api.whatsapp.com/send?text=${message}`;
      window.open(whatsappUrl, "_blank");
    } catch (err) {
      toast({
        title: "Error",
        description: "Unable to share to WhatsApp",
        variant: "destructive",
      });
    }
  };

  const openNewSessionDialog = () => {
    setEditingSession(null);
    setSessionForm(initialSessionFormState);
    setIsFormOpen(true);
  };

  const openNewLeadDialog = () => {
    setLeadForm(initialLeadFormState);
    setIsLeadFormOpen(true);
  };

  const avgPatient = useMemo(() => {
    return stats.physio > 0
      ? Number((stats.patient / stats.physio).toFixed(1))
      : 0;
  }, [stats.patient, stats.physio]);

  const statCards = [
    {
      title: "Total Leads",
      value: stats.lead || 0,
      icon: UserPlus,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Total Patients",
      value: stats.patient || 0,
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Total Sessions",
      value: stats.monthlySessions || 0,
      icon: CalendarIconLucide,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Completed Revenue",
      value: `₹${Number(stats.monthlyRevenue || 0)}`,
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      title: "Today Revenue",
      value: `₹${Math.round(Number(todayRevenue || 0))}`,
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      title: "Avg Patients / Physio",
      value: avgPatient,
      icon: Users,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
    },
    {
      title: "Avg / Session",
      value: `₹${Number(stats.avgPricePerSession || 0)}`,
      icon: DollarSign,
      color: "text-cyan-600",
      bgColor: "bg-cyan-100",
    },
    {
      title: "Today Total Session",
      value: stats.todaysession || 0,
      icon: CalendarIconLucide,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    },
    {
      title: "Today Completed Sessions",
      value: stats.todayCompletedSession || 0,
      icon: TrendingUp,
      color: "text-lime-600",
      bgColor: "bg-lime-100",
    },
    {
      title: "Active Physios",
      value: stats.physio || 0,
      icon: Activity,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Completed Sessions",
      value: stats.sessionCompleted || 0,
      icon: TrendingUp,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
    },
  ];
  const safeLeads = Array.isArray(leads) ? leads : [];

  const normalize = (value) =>
    String(value || "")
      .trim()
      .toLowerCase();

  const getLeadStatuses = (lead) =>
    normalize(
      lead?.LeadStatusId?.leadStatusName ||
        lead?.LeadStatusId?.LeadStatusName ||
        "",
    );

  const getLeadSourcees = (lead) =>
    normalize(
      lead?.leadSourceId?.leadSourceName ||
        lead?.leadSourceId?.LeadSourceName ||
        lead?.leadSourceName ||
        "",
    );

  // lead counts - always from leads array
  const totalLeadsCount = safeLeads.length;

  const pendingCount = safeLeads.filter(
    (lead) => getLeadStatuses(lead) === "pending",
  ).length;

  const cbCount = safeLeads.filter((lead) =>
    ["cb", "callback", "call back"].includes(getLeadStatuses(lead)),
  ).length;

  const qualifiedCount = safeLeads.filter(
    (lead) => getLeadStatuses(lead) === "qualified",
  ).length;
  const safePatients = Array.isArray(patients) ? patients : [];

  const isThisMonth = (date) => {
    if (!date) return false;
    const d = new Date(date);
    const now = new Date();
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  };

  // All-time: patients converted from leads (isFromLead flag + leadId link)
  const convertedCount = safePatients.filter(
    (p) => p?.isFromLead === true && p?.leadId,
  ).length;

  // This month only: consultations converted to patients this month
  const thisMonthConvertedCount = safePatients.filter(
    (p) => p?.isFromLead === true && p?.leadId && isThisMonth(p.createdAt),
  ).length;

  const conversionRate =
    totalLeadsCount > 0
      ? ((convertedCount / totalLeadsCount) * 100).toFixed(1)
      : "0.0";

  // source counts
  const onlineCount = safeLeads.filter(
    (lead) => getLeadSourcees(lead) === "online",
  ).length;

  const referenceCount = safeLeads.filter(
    (lead) =>
      Boolean(lead?.ReferenceId) || getLeadSourcees(lead) === "reference",
  ).length;
  const leadFunnelData = [
    {
      label: "Total Leads",
      value: totalLeadsCount,
      color: "bg-blue-500",
    },
    {
      label: "Pending",
      value: pendingCount,
      color: "bg-yellow-500",
    },
    {
      label: "Callback",
      value: cbCount,
      color: "bg-orange-500",
    },
    {
      label: "Qualified",
      value: qualifiedCount,
      color: "bg-purple-500",
    },
    {
      label: "Converted",
      value: convertedCount,
      color: "bg-green-500",
    },
  ];
  const leadSourceData = [
    {
      label: "Online",
      value: onlineCount,
      color: "bg-blue-500",
    },
    {
      label: "Reference",
      value: referenceCount,
      color: "bg-orange-500",
    },
  ];

  const totalLeadSource = leadSourceData.reduce(
    (sum, item) => sum + Number(item.value || 0),
    0,
  );

  const getPriorityClass = (daysLeft) => {
    if (daysLeft === 0) return "bg-red-100 text-red-600";
    if (daysLeft === 1) return "bg-orange-100 text-orange-600";
    return "bg-yellow-100 text-yellow-600";
  };
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div
        data-aos="fade-down"
        data-aos-duration="600"
        className="flex flex-col md:flex-row md:items-start md:justify-between gap-4"
      >
        <div>
          <h1 className="md:text-3xl text-lg font-bold text-gray-800 mb-2">
            SuperAdmin Dashboard
          </h1>
          <p className="text-gray-600">
            Complete overview of your physiotherapy service management
          </p>
        </div>

        <div className="w-full md:w-[240px]" data-aos="fade-left" data-aos-delay="100">
          <Button
            onClick={handleGenerateLink}
            disabled={loading}
            className="w-full"
          >
            {loading ? "Generating..." : "Generate Link"}
          </Button>
        </div>
      </div>

      {/* FILTER */}
      <Card className="medical-card" data-aos="fade-up" data-aos-delay="50">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">From Date</label>
              <input
                type="date"
                className="border rounded-md px-3 py-2 text-sm w-full"
                value={dateFilter.fromDate}
                onChange={(e) =>
                  setDateFilter((prev) => ({
                    ...prev,
                    fromDate: e.target.value,
                  }))
                }
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">To Date</label>
              <input
                type="date"
                className="border rounded-md px-3 py-2 text-sm w-full"
                value={dateFilter.toDate}
                onChange={(e) =>
                  setDateFilter((prev) => ({
                    ...prev,
                    toDate: e.target.value,
                  }))
                }
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={resetFilter}
                className="w-full px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                Reset
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MAIN CONTENT + RIGHT SIDEBAR */}
      {/* MAIN CONTENT + RIGHT SIDEBAR */}
      <div className="flex flex-col xl:flex-row gap-4 items-start">
        {/* LEFT CONTENT FLOW */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* CB NOTIFICATIONS */}
          <Card className="medical-card" data-aos="fade-up" data-aos-delay="80">
            <CardHeader>
              <CardTitle>CB Notifications</CardTitle>
              <CardDescription>
                Callback reminders for the next 3 days
              </CardDescription>
            </CardHeader>

            <CardContent>
              {cbNotifications.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No callback notifications.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cbNotifications.map((lead) => {
                    const daysLeft = getDaysLeft(lead.cbDate);
                    const sourceDisplay =
                      lead.ReferenceId?.sourceName ||
                      lead.ReferenceId?.referenceName ||
                      lead.ReferenceId?.ReferenceName ||
                      lead.leadSourceId?.leadSourceName ||
                      lead.leadSourceId?.LeadSourceName ||
                      lead.leadSourceName ||
                      "-";

                    return (
                      <div
                        key={lead._id}
                        className="border rounded-xl p-4 hover:bg-gray-50 transition"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-800 truncate">
                              {lead.leadName}
                            </p>
                            <p className="text-sm text-gray-500">
                              {lead.leadCode} • {lead.leadContactNo}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {lead.physioCategoryId?.physioCateName || "-"} •{" "}
                              {sourceDisplay}
                            </p>
                            <p className="text-sm text-gray-600">
                              Status: {lead.LeadStatusId?.leadStatusName || "-"}
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <p className="text-sm font-medium text-red-600">
                              {new Date(lead.cbDate).toLocaleDateString(
                                "en-GB",
                              )}
                            </p>
                            <p className="mt-2">
                              <span
                                className={`px-2 py-1 text-xs rounded-full font-semibold ${getPriorityClass(
                                  daysLeft,
                                )}`}
                              >
                                {daysLeft === 0
                                  ? "Today"
                                  : `${daysLeft} day(s)`}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* TODAY OVERVIEW */}
          <Card className="medical-card" data-aos="fade-up" data-aos-delay="100">
            <CardHeader>
              <CardTitle>Today Overview</CardTitle>
              <CardDescription>
                Quick understanding of today’s activity
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-xl border bg-blue-50 p-4">
                  <p className="text-sm text-gray-600">Today Sessions</p>
                  <h3 className="text-2xl font-bold text-blue-700 mt-1">
                    <AnimatedNumber value={stats.todaysession || 0} />
                  </h3>
                </div>

                <div className="rounded-xl border bg-green-50 p-4">
                  <p className="text-sm text-gray-600">Completed</p>
                  <h3 className="text-2xl font-bold text-green-700 mt-1">
                    <AnimatedNumber value={stats.todayCompletedSession || 0} />
                  </h3>
                </div>

                <div className="rounded-xl border bg-emerald-50 p-4">
                  <p className="text-sm text-gray-600">Today Revenue</p>
                  <h3 className="text-2xl font-bold text-emerald-700 mt-1">
                    <AnimatedNumber value={`₹${Math.round(Number(todayRevenue || 0))}`} />
                  </h3>
                </div>

                <div className="rounded-xl border bg-orange-50 p-4">
                  <p className="text-sm text-gray-600">CB Notifications</p>
                  <h3 className="text-2xl font-bold text-orange-700 mt-1">
                    <AnimatedNumber value={cbNotifications.length} />
                  </h3>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* STATS AREA */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {statCards.map((stat, index) => {
              const Icon = stat.icon;

              return (
                <div
                  key={stat.title}
                  data-aos="fade-up"
                  data-aos-delay={index * 60}
                >
                  <Card className="medical-card hover:shadow-lg transition-shadow h-full">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        {stat.title}
                      </CardTitle>
                      <div className={`p-2 rounded-full ${stat.bgColor}`}>
                        <Icon className={`h-4 w-4 ${stat.color}`} />
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="text-2xl font-bold text-gray-800">
                        <AnimatedNumber value={stat.value} />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Updated in real-time
                      </p>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="hidden xl:flex xl:flex-col xl:w-[280px] xl:shrink-0 space-y-4 sticky top-4">
          <Card className="medical-card border shadow-sm" data-aos="fade-left" data-aos-delay="80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Actions</CardTitle>
              <CardDescription>Frequently used operations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <button
                onClick={openNewLeadDialog}
                className="w-full flex items-center gap-3 rounded-xl border p-3 text-left hover:bg-blue-50 hover:border-blue-200 transition"
              >
                <div className="p-2 rounded-lg bg-blue-100">
                  <UserPlus className="text-blue-600" size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    Add New Lead
                  </p>
                  <p className="text-xs text-gray-500">
                    Create a new lead entry
                  </p>
                </div>
              </button>

              <button
                onClick={openNewSessionDialog}
                className="w-full flex items-center gap-3 rounded-xl border p-3 text-left hover:bg-green-50 hover:border-green-200 transition"
              >
                <div className="p-2 rounded-lg bg-green-100">
                  <CalendarIconLucide className="text-green-600" size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    Schedule Session
                  </p>
                  <p className="text-xs text-gray-500">Book patient session</p>
                </div>
              </button>

              <button
                onClick={() => navigate("/physios")}
                className="w-full flex items-center gap-3 rounded-xl border p-3 text-left hover:bg-purple-50 hover:border-purple-200 transition"
              >
                <div className="p-2 rounded-lg bg-purple-100">
                  <Users className="text-purple-600" size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    Manage Physios
                  </p>
                  <p className="text-xs text-gray-500">
                    View physiotherapist list
                  </p>
                </div>
              </button>

              <button
                onClick={() => navigate("/reports")}
                className="w-full flex items-center gap-3 rounded-xl border p-3 text-left hover:bg-orange-50 hover:border-orange-200 transition"
              >
                <div className="p-2 rounded-lg bg-orange-100">
                  <TrendingUp className="text-orange-600" size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    View Reports
                  </p>
                  <p className="text-xs text-gray-500">
                    Check analytics & reports
                  </p>
                </div>
              </button>
            </CardContent>
          </Card>

          <Card className="medical-card border shadow-sm" data-aos="fade-left" data-aos-delay="150">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Monthly Summary</CardTitle>
              <CardDescription>Quick business snapshot</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center border rounded-lg p-3">
                <span className="text-sm text-gray-600">Revenue</span>
                <span className="font-semibold text-emerald-700">
                  <AnimatedNumber value={`₹${Number(stats.monthlyRevenue || 0)}`} />
                </span>
              </div>

              <div className="flex justify-between items-center border rounded-lg p-3">
                <span className="text-sm text-gray-600">Sessions</span>
                <span className="font-semibold text-purple-700">
                  <AnimatedNumber value={stats.monthlySessions || 0} />
                </span>
              </div>

              <div className="flex justify-between items-center border rounded-lg p-3">
                <span className="text-sm text-gray-600">Leads</span>
                <span className="font-semibold text-blue-700">
                  <AnimatedNumber value={stats.lead || 0} />
                </span>
              </div>

              <div className="flex justify-between items-center border rounded-lg p-3">
                <span className="text-sm text-gray-600">Patients</span>
                <span className="font-semibold text-green-700">
                  <AnimatedNumber value={stats.patient || 0} />
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* VISUAL UNDERSTANDING SECTION - OUTSIDE MAIN FLEX */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="medical-card" data-aos="fade-right" data-aos-delay="50">
          <CardHeader>
            <CardTitle>Lead Funnel</CardTitle>
            <CardDescription>
              Understand how leads move through your process
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              {leadFunnelData.map((item) => {
                const width =
                  totalLeadsCount > 0
                    ? `${(Number(item.value || 0) / totalLeadsCount) * 100}%`
                    : "0%";

                return (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{item.label}</span>
                      <span className="font-semibold text-gray-900">
                        {item.value}
                      </span>
                    </div>

                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full`}
                        style={{ width }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        <Card className="medical-card" data-aos="fade-left" data-aos-delay="100">
          <CardHeader>
            <CardTitle>Patient Conversion</CardTitle>
            <CardDescription>How many leads become patients</CardDescription>
          </CardHeader>

          <CardContent>
            <div className="flex flex-col items-center justify-center py-4">
              <div className="relative w-40 h-40 rounded-full border-[12px] border-green-100 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-700">
                    <AnimatedNumber value={`${conversionRate}%`} />
                  </p>
                  <p className="text-sm text-gray-500">Conversion Rate</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 w-full mt-6">
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-xs text-gray-500">Total Leads</p>
                  <p className="text-xl font-bold text-blue-700">
                    <AnimatedNumber value={totalLeadsCount} />
                  </p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-xs text-gray-500">Converted</p>
                  <p className="text-xl font-bold text-green-700">
                    <AnimatedNumber value={convertedCount} />
                  </p>
                </div>
                <div className="rounded-lg border p-3 text-center bg-blue-50">
                  <p className="text-xs text-gray-500">This Month</p>
                  <p className="text-xl font-bold text-blue-600">
                    <AnimatedNumber value={thisMonthConvertedCount} />
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="medical-card" data-aos="fade-right" data-aos-delay="50">
          <CardHeader>
            <CardTitle>Revenue Insight</CardTitle>
            <CardDescription>
              Simple visual understanding of this period
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">Monthly Revenue</span>
                  <span className="font-semibold text-emerald-700">
                    ₹{Number(stats.monthlyRevenue || 0)}
                  </span>
                </div>
                <div className="w-full h-4 bg-emerald-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{
                      width: `${Math.min(
                        (Number(stats.monthlyRevenue || 0) / 100000) * 100,
                        100,
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">Completed Sessions</span>
                  <span className="font-semibold text-purple-700">
                    {stats.sessionCompleted || 0}
                  </span>
                </div>
                <div className="w-full h-4 bg-purple-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{
                      width: `${Math.min(
                        (Number(stats.sessionCompleted || 0) / 100) * 100,
                        100,
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">Average / Session</span>
                  <span className="font-semibold text-cyan-700">
                    ₹{Number(stats.avgPricePerSession || 0)}
                  </span>
                </div>
                <div className="w-full h-4 bg-cyan-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 rounded-full"
                    style={{
                      width: `${Math.min(
                        (Number(stats.avgPricePerSession || 0) / 5000) * 100,
                        100,
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="medical-card" data-aos="fade-left" data-aos-delay="100">
          <CardHeader>
            <CardTitle>Lead Source Analysis</CardTitle>
            <CardDescription>
              See which source brings more leads
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              {leadSourceData.map((item, index) => {
                const colors = [
                  "bg-blue-500",
                  "bg-orange-500",
                  "bg-purple-500",
                ];
                const width =
                  totalLeadSource > 0
                    ? `${(item.value / totalLeadSource) * 100}%`
                    : "0%";

                return (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{item.label}</span>
                      <span className="font-semibold text-gray-900">
                        {item.value}
                      </span>
                    </div>
                    <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${colors[index]} rounded-full`}
                        style={{ width }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
      {/* LINK DIALOG */}
      <Dialog open={linkpop} onOpenChange={setLinkpop}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generated Link</DialogTitle>
          </DialogHeader>

          <div className="flex gap-2 flex-wrap">
            <Input value={generatedLink} readOnly />
            <Button onClick={() => copyLink(generatedLink)}>Copy</Button>
            <Button
              onClick={() => copyAndShareToWhatsApp(generatedLink)}
              className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-2"
            >
              <FaWhatsapp className="h-5 w-5" />
              Share
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* SESSION DIALOG */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto scrollbar-hide">
          <DialogHeader>
            <DialogTitle>
              {editingSession ? "Edit Session" : "Schedule New Session"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>
                Patient<span className="text-red-500 ml-1">*</span>
              </Label>
              <Select
                value={sessionForm.patientId}
                onValueChange={(v) =>
                  setSessionForm((prev) => ({ ...prev, patientId: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient._id} value={patient._id}>
                      {patient.patientName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                Physiotherapist<span className="text-red-500 ml-1">*</span>
              </Label>
              <Select
                value={sessionForm.physioId}
                onValueChange={(v) =>
                  setSessionForm((prev) => ({ ...prev, physioId: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a physio" />
                </SelectTrigger>
                <SelectContent>
                  {physios.map((physio) => (
                    <SelectItem key={physio._id} value={physio._id}>
                      {physio.physioName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                Session Dates<span className="text-red-500 ml-1">*</span>
              </Label>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      (!sessionForm.sessionDates ||
                        sessionForm.sessionDates.length === 0) &&
                        "text-muted-foreground",
                    )}
                  >
                    <CalendarIconLucide className="mr-2 h-4 w-4" />
                    {sessionForm.sessionDates?.length > 0 ? (
                      <span>
                        {sessionForm.sessionDates.length} date(s) selected
                      </span>
                    ) : (
                      <span>Pick date(s)</span>
                    )}
                  </Button>
                </PopoverTrigger>

                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="multiple"
                    selected={
                      Array.isArray(sessionForm.sessionDates)
                        ? sessionForm.sessionDates
                        : []
                    }
                    onSelect={(dates) =>
                      setSessionForm((prev) => ({
                        ...prev,
                        sessionDates: dates || [],
                        sessionDay:
                          dates?.length === 1
                            ? getDayName(dates[0])
                            : dates?.length > 1
                              ? "Multiple"
                              : "",
                      }))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sessionDay">Session Day</Label>
              <Input
                id="sessionDay"
                disabled
                type="text"
                value={sessionForm.sessionDay}
                onChange={(e) =>
                  setSessionForm((prev) => ({
                    ...prev,
                    sessionDay: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sessionTime">
                Session Time<span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="sessionTime"
                type="time"
                value={sessionForm.sessionTime}
                onChange={(e) =>
                  setSessionForm((prev) => ({
                    ...prev,
                    sessionTime: e.target.value,
                  }))
                }
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingSession(null);
                  setSessionForm(initialSessionFormState);
                }}
              >
                Cancel
              </Button>

              <Button type="submit">
                {editingSession ? "Update Session" : "Schedule Session"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* LEAD DIALOG */}
      <Dialog open={isLeadFormOpen} onOpenChange={setIsLeadFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{"Create Lead"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleLeadSubmit} className="space-y-4">
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
                  onWheel={(e) => e.target.blur()}
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
                  value={leadForm.leadGenderId}
                  onValueChange={(v) => handleSelectChange("leadGenderId", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    {genderList.map((g) => (
                      <SelectItem
                        key={g._id || g.GenderIDPK}
                        value={g._id || g.GenderIDPK}
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
                      let value = e.target.value.replace(/\D/g, "");
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
                  value={leadForm.LeadStatusId}
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
                  value={leadForm.physioCategoryId}
                  onValueChange={(v) =>
                    handleSelectChange("physioCategoryId", v)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Physio Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {physioCategories.map((physio) => (
                      <SelectItem
                        key={
                          physio._id ||
                          physio.PhysioCateIDPK ||
                          physio.PhysioCategoryIDPK
                        }
                        value={
                          physio._id ||
                          physio.PhysioCateIDPK ||
                          physio.PhysioCategoryIDPK
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
                  value={leadForm.leadSourceId}
                  onValueChange={(v) => {
                    const selected = leadSources.find(
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
                    {leadSources.map((leads) => (
                      <SelectItem
                        key={
                          leads._id || leads.LeadIDPK || leads.leadSourceName
                        }
                        value={leads._id || leads.LeadIDPK}
                      >
                        {leads.leadSourceName ||
                          leads.name ||
                          leads.LeadSourceName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {leadForm.leadSourceName === "Reference" ||
              leadForm.ReferenceId ? (
                <div className="space-y-2">
                  <Label>
                    Reference<span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Select
                    value={leadForm.ReferenceId || ""}
                    onValueChange={(v) => {
                      const selected = references.find(
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
                      {references.map((ref) => {
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
              ) : null}
            </div>

            <div>
              <Label>Medical History</Label>
              <textarea
                name="leadMedicalHistory"
                value={leadForm.leadMedicalHistory}
                onChange={handleFormChange}
                className="w-full border p-2 rounded-md"
              />
            </div>

            <div>
              <Label>Upload Documents</Label>
              <Input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                multiple
              />
              <div className="mt-2 text-sm text-gray-600 flex flex-col gap-1">
                {leadForm.leadDocuments.map((doc, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Paperclip size={14} /> {doc}
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsLeadFormOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={leadLoading}>
                {leadLoading ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdminDashboard;
