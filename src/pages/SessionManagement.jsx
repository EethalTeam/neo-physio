import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Calendar as CalendarIcon,
  Play,
  Square,
  Search,
  PlusCircle,
  Edit,
  Trash2,
  Upload,
  Paperclip,
  XCircle,
  FileText,
  StopCircle,
  XCircleIcon,
  TrendingUp,
  CheckSquare,
  Activity,
  Award,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "@/components/CustomComponents/apiRequest";
import PatientDetailsDialog from "../components/PatientDetailsDialog";

const SessionManagement = () => {
  const navigate = useNavigate();
  const { user, getPermissionsByPath } = useAuth();
  const userRole = localStorage.getItem("userRole");
  const physioName = user?.physioName;

  const [cancelledReasonType, setCancelledReasonType] = useState("");
  const [getPhysioCounts, setgetphyioCounts] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [physios, setPhysios] = useState([]);
  const [machines, setMachines] = useState([]);
  const [redFlags, setRedFlags] = useState([]);
  const [Modalities, setModalities] = useState([]);
  const [sessionStatus, setSessionStatus] = useState([]);
  // const [filteredSessions, setFilteredSessions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);

  const initialFormState = {
    sessionCount: "",
    sessionCode: "",
    patientId: "",
    physioId: "",
    sessionDate: [],
    sessionDay: "",
    sessionTime: "",

    sessionStatusId: "691ecb36b87c5c57dead47a7",
  };

  const [sessionForm, setSessionForm] = useState(initialFormState);

  const [feedbackDialog, setFeedbackDialog] = useState({
    open: false,
    sessionId: null,
    physioId: "",
  });

  const initialFeedbackState = {
    sessionFeedbackPros: "",
    redFlags: [],
    media: [],
    modeOfExercise: "",
    homeExerciseAssigned: "false",
    modalitiesList: [],
    modalitiestype: "",
    targetArea: "",
    machineId: "",
    modalities: false,
  };

  const [feedback, setFeedback] = useState(initialFeedbackState);
  const fileInputRef = useRef(null);

  const [cancelDialog, setCancelDialog] = useState({
    open: false,
    sessionId: null,
  });
  const [cancelledReason, setCancelledReason] = useState("");
  const [cancelledKms, setCancelledKms] = useState("");
  const [claimPetrol, setClaimPetrol] = useState(false);

  const [Permissions, setPermissions] = useState({
    isAdd: false,
    isView: false,
    isEdit: false,
    isDelete: false,
  });

  const [sessionCountMap, setSessionCountMap] = useState({});
  const [msg, setMsg] = useState("");
  const [viewingPatient, setViewingPatient] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [filteredPatients, setFilteredPatients] = useState([]);

  useEffect(() => {
    getPhysio();
    getAllPatient();
    getPhysioCount();
    getPatient();
    getSessionStatus();
    getRedFlag();
    getModalities();
    getAllMachine();

    getPermissionsByPath(window.location.pathname).then((res) => {
      if (res) setPermissions(res);
      else navigate("/dashboard");
    });
  }, []);

  // useEffect(() => {
  //   if (Permissions.isView) {
  //     getSession();
  //   }
  // }, [Permissions]);
  useEffect(() => {
    if (Permissions.isView) {
      getSession(dateFilter);
    }
  }, [dateFilter, Permissions]);

  const handleCheckboxChange = () => {
    setClaimPetrol((prev) => !prev);
  };

  const getPatient = async (data) => {
    try {
      const response = await apiRequest("Patient/getAllPatient", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setPatients(response);
    } catch (error) {
      console.log(error, "error from frontend get All patient");
    }
  };

  const getAllPatient = async () => {
    try {
      const res = await apiRequest("Patient/getAllPatient", {
        method: "POST",
        body: JSON.stringify({}),
      });

      setFilteredPatients(res);
      setPatients(res);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const getPhysio = async (data) => {
    try {
      const response = await apiRequest("Physio/getAllPhysio", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setPhysios(response.physios || []);
    } catch (error) {
      console.log(error, "error from frontend get All Physio");
    }
  };

  const getSessionStatus = async (data) => {
    try {
      const response = await apiRequest("SessionStatus/getAllSessionStatus", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setSessionStatus(response.sessionStatuses || []);
    } catch (error) {
      console.log(error, "error from frontend get All Session Status");
    }
  };

  const getRedFlag = async (data) => {
    try {
      const response = await apiRequest("Redflag/getAllRedflag", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setRedFlags(response || []);
    } catch (error) {
      console.log(error, "error from frontend get All RedFlag");
    }
  };

  const getModalities = async (data) => {
    try {
      const response = await apiRequest("Modalities/getAllModalities", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setModalities(response || []);
    } catch (error) {
      console.log(error, "error from frontend get All Modalities");
    }
  };

  const getAllMachine = async (data) => {
    try {
      const res = await apiRequest("Machinery/getAllMachinery", {
        method: "POST",
        body: JSON.stringify(data),
      });

      const list = res?.machines ?? res ?? [];
      setMachines(list);
    } catch (error) {
      console.error("not able to getall Machine", error);
    }
  };

  const getPhysioCount = async () => {
    try {
      const response = await apiRequest("Patient/getPhysioPatientCounts", {
        method: "POST",
        body: JSON.stringify({}),
      });
      setgetphyioCounts(response.data || []);
    } catch (error) {
      console.error("Error fetching physio counts:", error);
    }
  };

  const getSession = async (passedDate) => {
    try {
      const storedRole = localStorage.getItem("userRole");
      const today = new Date().toLocaleDateString("en-CA");

      const selectedDate = passedDate || dateFilter || today;

      const response = await apiRequest("Session/getAllSession", {
        method: "POST",
        body: JSON.stringify({
          physioId: user?._id,
          Today: selectedDate,
          storedRole,
        }),
      });

      const incomplete = Array.isArray(response?.incompleteData)
        ? response.incompleteData
        : [];

      const complete = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.sessions)
          ? response.sessions
          : Array.isArray(response)
            ? response
            : [];

      const merged = [...complete, ...incomplete];
      setSessions(merged);
      setMsg(response?.message || "");

      const countMap = {};
      merged.forEach((s) => {
        const pid = s.patientId?._id;
        const phyId = s.physioId?._id;
        if (!pid || !phyId) return;

        const key = `${pid}-${phyId}`;
        if (!countMap[key]) countMap[key] = { total: 0, completed: 0 };

        countMap[key].total += 1;
        if (s.sessionStatusId?.sessionStatusName === "Completed") {
          countMap[key].completed += 1;
        }
      });

      setSessionCountMap(countMap);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    }
  };

  const assignedPhysioIds = feedbackDialog?.physioId ?? "";

  const physioModalityIds = useMemo(() => {
    if (!assignedPhysioIds || !Array.isArray(machines)) return [];

    const set = new Set();

    machines.forEach((m) => {
      const isAssigned =
        Array.isArray(m.Assignedto) &&
        m.Assignedto.some(
          (a) =>
            String(a.physioId) === String(assignedPhysioIds) &&
            Number(a.count || 0) > 0,
        );

      const modId = m.modalityId?._id ?? m.modalityId;

      if (isAssigned && modId) {
        set.add(String(modId));
      }
    });

    return Array.from(set);
  }, [machines, assignedPhysioIds]);

  // useEffect(() => {
  //   let filtered = Array.isArray(sessions) ? [...sessions] : [];

  //   const term = (searchTerm || "").trim().toLowerCase();

  //   if (term) {
  //     filtered = filtered.filter((s) => {
  //       const patientName = (
  //         s.patientId?.patientName ||
  //         s.incompleteData?.patientId?.patientName ||
  //         ""
  //       ).toLowerCase();

  //       const physioNameValue = (
  //         s.physioId?.physioName ||
  //         s.incompleteData?.physioId?.physioName ||
  //         ""
  //       ).toLowerCase();

  //       const sessionCode = (
  //         s.sessionCode ||
  //         s.incompleteData?.sessionCode ||
  //         ""
  //       ).toLowerCase();

  //       return (
  //         patientName.includes(term) ||
  //         physioNameValue.includes(term) ||
  //         sessionCode.includes(term)
  //       );
  //     });
  //   }

  //   if (statusFilter !== "all") {
  //     filtered = filtered.filter(
  //       (s) => s.sessionStatusId?.sessionStatusName === statusFilter,
  //     );
  //   }

  //   if (dateFilter) {
  //     const toISTDate = (iso) =>
  //       new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

  //     filtered = filtered.filter(
  //       (s) => s.sessionDate && toISTDate(s.sessionDate) === dateFilter,
  //     );
  //   }

  //   setFilteredSessions(filtered);
  // }, [sessions, searchTerm, statusFilter, dateFilter]);
  const filteredSessions = useMemo(() => {
    let filtered = Array.isArray(sessions) ? [...sessions] : [];

    const term = (searchTerm || "").trim().toLowerCase();

    if (term) {
      filtered = filtered.filter((s) => {
        const patientName = (
          s.patientId?.patientName ||
          s.incompleteData?.patientId?.patientName ||
          ""
        ).toLowerCase();

        const physioNameValue = (
          s.physioId?.physioName ||
          s.incompleteData?.physioId?.physioName ||
          ""
        ).toLowerCase();

        const sessionCode = (
          s.sessionCode ||
          s.incompleteData?.sessionCode ||
          ""
        ).toLowerCase();

        return (
          patientName.includes(term) ||
          physioNameValue.includes(term) ||
          sessionCode.includes(term)
        );
      });
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (s) => s.sessionStatusId?.sessionStatusName === statusFilter,
      );
    }

    if (dateFilter) {
      const toISTDate = (iso) =>
        new Date(iso).toLocaleDateString("en-CA", {
          timeZone: "Asia/Kolkata",
        });

      filtered = filtered.filter(
        (s) => s.sessionDate && toISTDate(s.sessionDate) === dateFilter,
      );
    }

    return filtered;
  }, [sessions, searchTerm, statusFilter, dateFilter]);
  const getCreateSession = async (data) => {
    try {
      if (
        !Array.isArray(sessionForm.sessionDate) ||
        sessionForm.sessionDate.length === 0
      ) {
        toast({ title: "Select at least one date", variant: "destructive" });
        return;
      }

      if (!data.patientId || !data.physioId || !data.sessionTime) {
        toast({
          title: "Fill patient, physio and time",
          variant: "destructive",
        });
        return;
      }

      const payload = {
        patientId: data.patientId,
        physioId: data.physioId,
        sessionTime: data.sessionTime,
        sessionCount: data.sessionCount,
        sessionDates: sessionForm.sessionDate
          .map((d) => {
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, "0");
            const dd = String(d.getDate()).padStart(2, "0");
            return `${yyyy}-${mm}-${dd}`;
          })
          .sort((a, b) => new Date(a) - new Date(b)),
        sessionStatusId: data.sessionStatusId,
      };

      await apiRequest("Session/createSession", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      toast({ title: "Success", description: "Sessions created" });
      getSession(dateFilter);
    } catch (e) {
      console.error(e);
      toast({
        title: "Error",
        description: "Failed to create sessions",
        variant: "destructive",
      });
    }
  };

  const updateSession = async (data) => {
    try {
      await apiRequest("Session/updateSession", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          updatedBy: user?.physioName || "null",
        }),
      });

      getSession(dateFilter);

      toast({
        title: "Updated",
        description: "Session updated successfully",
      });
    } catch (error) {
      console.log(error);

      toast({
        title: "Error",
        description: "Failed to update session",
        variant: "destructive",
      });
    }
  };

  const deleteSession = async (data) => {
    try {
      await apiRequest("Session/deleteSession", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          updatedBy: user?.physioName || "null",
        }),
      });

      getSession(dateFilter);

      toast({
        title: "Deleted",
        description: "Session deleted successfully",
      });
    } catch (error) {
      console.log(error);

      toast({
        title: "Error",
        description: "Failed to delete session",
        variant: "destructive",
      });
    }
  };

  const SessionStop = async (data) => {
    try {
      const response = await apiRequest("Session/SessionStop", {
        method: "POST",
        body: JSON.stringify(data),
      });
      getSession(dateFilter);
      return response;
    } catch (error) {
      console.log(error, "error from frontend SessionStop");
    }
  };

  const SessionCancelRevert = async (sessionId) => {
    try {
      const response = await apiRequest("Session/SessionCancelRevert", {
        method: "POST",
        body: JSON.stringify({
          sessionId,
          updatedBy: user?.physioName || "null",
        }),
      });

      getSession(dateFilter);
      return response;
    } catch (error) {
      console.log("Cancel revert error", error);
    }
  };

  const SessionStart = async (data) => {
    try {
      const response = await apiRequest("Session/SessionStart", {
        method: "POST",
        body: JSON.stringify(data),
      });

      getSession(dateFilter);

      toast({
        title: "Session Started",
        description: "Session marked as attended",
      });

      return response;
    } catch (error) {
      console.log(error);

      toast({
        title: "Error",
        description: "Failed to start session",
        variant: "destructive",
      });
    }
  };
  const SessionCancel = async (data) => {
    try {
      const response = await apiRequest("Session/SessionCancel", {
        method: "POST",
        body: JSON.stringify(data),
      });

      getSession(dateFilter);

      toast({
        title: "Canceled",
        description: "Session canceled successfully",
      });

      return response;
    } catch (error) {
      console.log(error);

      toast({
        title: "Error",
        description: "Failed to cancel session",
        variant: "destructive",
      });
    }
  };

  const SessionEnd = async (data) => {
    try {
      const payload = {
        ...data,
        modalities: data.modalities,
        createdBy: user?.physioName || "null",
        updatedBy: user?.physioName || "null",
      };

      const response = await apiRequest("Session/SessionEnd", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (response) {
        if ((feedback.redFlags || []).length > 0) {
          toast({
            title: "HOD Notification",
            description: "Red flags have been reported to HOD for review.",
          });
        }

        setFeedbackDialog({ open: false, sessionId: null, physioId: "" });
        setFeedback(initialFeedbackState);

        toast({
          title: "Session Completed",
          description: "Session feedback has been recorded.",
        });

        getSession(dateFilter);
      }
    } catch (error) {
      console.log(error, "error from frontend SessionEnd");
    }
  };

  const Converttime = (time) => {
    if (!time) return "-";
    const [hours, minutes] = time.split(":");
    const data = new Date();
    data.setHours(hours, minutes);
    return data.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleViewConsultation = (patient) => {
    setViewingPatient(patient);
    setIsDetailsOpen(true);
  };

  const getDayName = (date) => {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return days[new Date(date).getDay()];
  };

  const CovertTdyTim = () => {
    return new Date().toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const buildSessionDateTime = (session) => {
    if (!session.sessionDate || !session.sessionTime) return null;

    const date = new Date(session.sessionDate);
    let time = session.sessionTime.toString().trim().toLowerCase();

    let hours = 0;
    let minutes = 0;

    if (time.includes("am") || time.includes("pm")) {
      const [t, meridian] = time.split(" ");
      let [h, m] = t.split(":").map(Number);

      if (meridian === "pm" && h !== 12) h += 12;
      if (meridian === "am" && h === 12) h = 0;

      hours = h;
      minutes = m;
    } else {
      const [h, m] = time.split(":").map(Number);
      hours = h;
      minutes = m;
    }

    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const canStartByVisitOrder = (sessionsList, currentSession) => {
    const currentPhysioId =
      currentSession?.physioId?._id || currentSession?.physioId || "";
    const currentPatientId =
      currentSession?.patientId?._id || currentSession?.patientId || "";
    const currentVisitOrder = Number(
      currentSession?.patientId?.visitOrder || 0,
    );

    if (!currentPhysioId || !currentPatientId || !currentVisitOrder) {
      return true;
    }

    const toISTDate = (iso) =>
      new Date(iso).toLocaleDateString("en-CA", {
        timeZone: "Asia/Kolkata",
      });

    const currentDate = currentSession?.sessionDate
      ? toISTDate(currentSession.sessionDate)
      : "";

    // same physio + same date only
    const samePhysioSameDateSessions = (
      Array.isArray(sessionsList) ? sessionsList : []
    ).filter((s) => {
      const physioId = s?.physioId?._id || s?.physioId || "";
      const sessionDate = s?.sessionDate ? toISTDate(s.sessionDate) : "";
      return physioId === currentPhysioId && sessionDate === currentDate;
    });

    // sort by patient visit order
    const orderedSessions = samePhysioSameDateSessions.sort((a, b) => {
      const aOrder = Number(a?.patientId?.visitOrder || 0);
      const bOrder = Number(b?.patientId?.visitOrder || 0);
      return aOrder - bOrder;
    });

    // find current index
    const currentIndex = orderedSessions.findIndex(
      (s) => String(s?._id) === String(currentSession?._id),
    );

    if (currentIndex <= 0) {
      return true; // first visitOrder can start directly
    }

    const previousSession = orderedSessions[currentIndex - 1];
    const prevStatus = previousSession?.sessionStatusId?.sessionStatusName;

    return prevStatus === "Completed" || prevStatus === "Canceled";
  };

  const handleSessionAction = async (session, action) => {
    try {
      const sessionId = session?._id;
      if (!sessionId) return;

      if (action === "Completed") {
        setFeedback({
          sessionFeedbackPros: session.sessionFeedbackPros || "",
          modeOfExercise: session.modeOfExercise || "",
          redFlags: session.redFlags || [],
          homeExerciseAssigned: String(!!session.homeExerciseAssigned),
          modalities: !!session.modalities,
          modalitiestype: session.modalitiestype || "",
          modalitiesList: Array.isArray(session.modalitiesList)
            ? session.modalitiesList
                .map((m) => String(m.modalityId?._id ?? m.modalityId ?? m))
                .filter(Boolean)
            : [],
          machineId: session.machineId?._id || session.machineId || "",
          targetArea: session.targetArea || "",
          media: session.media || [],
        });

        setFeedbackDialog({
          open: true,
          sessionId,
          physioId: session?.physioId?._id ?? session?.physioId ?? "",
        });
        return;
      }

      if (action === "Canceled") {
        setCancelDialog({ open: true, sessionId });
        return;
      }

      if (action === "Attended") {
        const allowed = canStartByVisitOrder(sessions, session);

        if (!allowed) {
          toast({
            title: "Action blocked",
            description:
              "Please complete or cancel the previous visit order session first",
            variant: "destructive",
          });
          return;
        }

        await SessionStart({
          _id: sessionId,
          sessionFromTime: CovertTdyTim(),
          action: "Attended",
          updatedBy: user?.physioName || "null",
        });
      }

      if (action === "Scheduled") {
        await SessionStop({
          _id: sessionId,
          action: "Scheduled",
          updatedBy: user?.physioName || "null",
        });
      }

      setSessions((prev) =>
        (Array.isArray(prev) ? prev : []).map((s) =>
          s._id === sessionId
            ? {
                ...s,
                sessionStatusId: {
                  ...(s.sessionStatusId || {}),
                  sessionStatusName: action,
                },
              }
            : s,
        ),
      );

      toast({ title: "Session Updated", description: `Marked as ${action}` });
    } catch (err) {
      console.error("handleSessionAction error:", err);
      toast({
        title: "Error",
        description: "API failed while updating session",
        variant: "destructive",
      });
    }
  };

  const handleActionCancel = (
    session,
    action,
    cancelledKmsValue,
    cancelledReasonValue,
    claimPetrolValue,
  ) => {
    SessionCancel({
      _id: session,
      action,
      physioId: user?._id,
      userRole,
      updatedBy: user?.physioName || "null",
      physioName,
      cancelledKms: cancelledKmsValue,
      cancelledReason: cancelledReasonValue,
      petrolAllowanceClaimed: claimPetrolValue,
    });
  };

  const handleCancelSubmit = () => {
    if (!cancelledReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please enter a reason for cancelling this session.",
        variant: "destructive",
      });
      return;
    }

    const { sessionId } = cancelDialog;

    handleActionCancel(
      sessionId,
      "Canceled",
      cancelledKms,
      cancelledReason,
      claimPetrol,
    );

    // setFilteredSessions((prev) =>
    //   prev.map((s) =>
    //     s._id === sessionId
    //       ? {
    //           ...s,
    //           status: "Canceled",
    //           cancelledKms: parseFloat(cancelledKms) || 0,
    //           petrolAllowanceClaimed: claimPetrol,
    //         }
    //       : s,
    //   ),
    // );

    toast({
      title: "Session Canceled",
      description: "Session has been marked as Canceled.",
    });

    setCancelDialog({ open: false, sessionId: null });
    setCancelledKms("");
    setCancelledReason("");
    setClaimPetrol(false);
    setCancelledReasonType("");
  };

  const handleFeedbackUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFeedback((prev) => ({ ...prev, media: [...prev.media, file.name] }));
      toast({
        title: "Media Added",
        description: `${file.name} staged for upload.`,
      });
    }
  };

  const handleActionEnd = (session, action, id) => {
    SessionEnd({
      _id: id,
      sessionToTime: CovertTdyTim(),
      action,
      modeOfExercise: feedback.modeOfExercise || "",
      machineId: feedback.machineId || undefined,
      sessionFeedbackPros: session.sessionFeedbackPros || "",
      redFlags: (session.redFlags || []).map((r) => ({
        redFlagId: r.redFlagId?._id || r.redFlagId,
        isOccurred: r.isOccurred || false,
      })),
      targetArea: session.targetArea || "",
      modalitiestype: feedback.modalitiestype || "",
      modalitiesList: (session.modalitiesList || []).map((idValue) => ({
        modalityId: idValue,
        isOccurred: true,
      })),
      homeExerciseAssigned: feedback.homeExerciseAssigned === "true",
      modalities: feedback.modalities,
    });
  };

  const handleFeedbackSubmit = () => {
    const { sessionId } = feedbackDialog;

    if (!feedback.sessionFeedbackPros?.trim()) {
      toast({
        title: "Alert",
        description: "Enter the session feedback",
        variant: "destructive",
      });
      return;
    }

    if (!feedback.modeOfExercise) {
      toast({
        title: "Alert",
        description: "Select the Mode of Exercise",
        variant: "destructive",
      });
      return;
    }

    if (feedback.modalities === true) {
      if (!feedback.modalitiesList || feedback.modalitiesList.length === 0) {
        toast({
          title: "Alert",
          description: "Select at least one modality",
          variant: "destructive",
        });
        return;
      }

      if (!feedback.targetArea?.trim()) {
        toast({
          title: "Alert",
          description: "Enter the targeted area",
          variant: "destructive",
        });
        return;
      }
    }

    handleActionEnd(feedback, "Completed", sessionId);
  };
  const handleFormSubmit = (e) => {
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

    if (!sessionForm.sessionDate || sessionForm.sessionDate.length === 0) {
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

    const formData = {
      ...sessionForm,
      patientId: sessionForm.patientId,
      physioId: sessionForm.physioId,
      machineId: sessionForm.machineId || null,
      sessionDate: sessionForm.sessionDate,
    };

    try {
      if (editingSession) {
        updateSession({ ...sessionForm });

        toast({
          title: "Success",
          description: "Session updated successfully",
        });
      } else {
        getCreateSession({ ...formData });

        toast({
          title: "Success",
          description: "Session scheduled successfully",
        });
      }

      setIsFormOpen(false);
      setEditingSession(null);
      setSessionForm(initialFormState);
    } catch (error) {
      console.error(error);

      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const handleEditSession = (session) => {
    setEditingSession(session);
    setSessionForm({
      _id: session._id || "",
      sessionCode: session.sessionCode || "",
      patientId: session.patientId?._id || "",
      physioId: session.physioId?._id || "",
      sessionDate: session.sessionDate ? [new Date(session.sessionDate)] : [],
      sessionDay: session.sessionDay || "",
      sessionTime: session.sessionTime || "",
      sessionFromTime: session.sessionFromTime || "",
      sessionToTime: session.sessionToTime || "",
      sessionCount: session.sessionCount || "",
      sessionStatusId: session.sessionStatusId?._id || "",
    });
    setIsFormOpen(true);
  };

  const renderPhysioBadge = (physioId) => {
    const physio = (getPhysioCounts || []).find((p) => p.physioId === physioId);
    if (!physio) return <span>Physio not found</span>;

    const bgColor =
      physio.activePatientCount > 6
        ? "green"
        : physio.activePatientCount > 3
          ? "orange"
          : "red";

    return (
      <span
        style={{
          backgroundColor: bgColor,
          color: "white",
          padding: "2px 8px",
          borderRadius: "4px",
        }}
      >
        {physio.physioName}
      </span>
    );
  };

  const handleSessionCancelRevert = async (sessionId, updatedBy) => {
    try {
      const response = await SessionCancelRevert(sessionId, updatedBy);

      if (response?.success) {
        toast({
          title: "Success",
          description: response.message || "Session reverted successfully",
        });

        setSessions((prev) =>
          (Array.isArray(prev) ? prev : []).map((s) =>
            s._id === sessionId
              ? {
                  ...s,
                  sessionStatusId: {
                    ...s.sessionStatusId,
                    sessionStatusName: "Scheduled",
                  },
                  cancelledReason: "",
                  sessionFeedbackCons: "",
                  cancelledKms: 0,
                  updatedBy: updatedBy,
                }
              : s,
          ),
        );

        // setFilteredSessions((prev) =>
        //   (Array.isArray(prev) ? prev : []).map((s) =>
        //     s._id === sessionId
        //       ? {
        //           ...s,
        //           sessionStatusId: {
        //             ...s.sessionStatusId,
        //             sessionStatusName: "Scheduled",
        //           },
        //           cancelledReason: "",
        //           sessionFeedbackCons: "",
        //           cancelledKms: 0,
        //         }
        //       : s,
        //   ),
        // );
      } else {
        toast({
          title: "Error",
          description: response?.message || response?.error || "Revert failed",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("handleSessionCancelRevert error:", error);
      toast({
        title: "Error",
        description: "Something went wrong while reverting the session",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSession = (id) => {
    deleteSession({ _id: id });
    toast({
      title: "Deleted",
      description: "Session has been removed.",
      variant: "destructive",
    });
  };

  const openNewSessionDialog = () => {
    setEditingSession(null);
    setSessionForm(initialFormState);
    setIsFormOpen(true);
  };

  const is26thMilestone = (session) =>
    session?.sessionStatusId?.sessionStatusName === "Completed" &&
    Number(session?.monthlySessionCount) > 0 &&
    Number(session?.monthlySessionCount) % 26 === 0;

  const getCompletionPercentage = (completed, total) => {
    if (!total || Number(total) === 0) return "0.00";
    return ((Number(completed) / Number(total)) * 100).toFixed(2);
  };

  const overallScheduledCount = filteredSessions.length;

  const overallCompletedCount = filteredSessions.filter(
    (s) => s.sessionStatusId?.sessionStatusName === "Completed",
  ).length;

  const overallCompletionPercentage = getCompletionPercentage(
    overallCompletedCount,
    overallScheduledCount,
  );

  const summaryCards = [
    {
      title: "Scheduled Sessions",
      value: overallScheduledCount,
      icon: Activity,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Completed Sessions",
      value: overallCompletedCount,
      icon: CheckSquare,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Session Completion Rate (SCR)",
      value: `${overallCompletionPercentage}%`,
      icon: TrendingUp,
      color: "text-cyan-600",
      bgColor: "bg-cyan-100",
    },
  ];

  return (
    <div className="md:space-y-6 space-y-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="md:flex md:justify-between md:items-center lg:flex lg:justify-between lg:items-center space-y-5"
      >
        <div>
          <h1 className="md:text-3xl text-xl font-bold text-gray-800 mb-2">
            {user?.role === "Physio" ? "My Sessions" : "Session Management"}
          </h1>
          <p className="text-gray-600">
            {user?.role === "Physio"
              ? "Manage your assigned patient sessions"
              : "Manage all patient sessions and track progress"}
          </p>
        </div>

        {Permissions.isAdd && (
          <Button onClick={openNewSessionDialog}>
            <PlusCircle className="mr-2 h-4 w-4" /> Schedule Session
          </Button>
        )}
      </motion.div>

      <Card className="medical-card max-w-fit md:max-w-full">
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex md:flex-row flex-col items-center gap-4 md:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by Patient Name, Physio Name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {user?.role !== "Physio" && (
              <div className="w-48">
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => {
                    setDateFilter(e.target.value);
                    // getSession(e.target.value);
                  }}
                  className="w-full"
                />
              </div>
            )}

            <div className="w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                  <SelectItem value="Attended">Attended</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Canceled">Canceled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="medical-card">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{card.title}</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">
                      {card.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${card.bgColor}`}>
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {msg && user?.role === "Physio" && (
        <Card className="medical-card max-w-fit md:max-w-full">
          <CardContent>
            <div className="flex md:flex-row m-5 mb-0 flex-col items-center gap-4 text-center md:space-x-4">
              <div className="flex-1 relative">
                <h5>{msg}</h5>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {filteredSessions.length > 0 && (
          <Card className="medical-card hidden md:block">
            <CardHeader>
              <CardTitle>Sessions ({filteredSessions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Session Code</th>
                      <th className="text-left p-2">Patient</th>
                      {user?.role !== "Physio" && (
                        <th className="text-left p-2">Physiotherapist</th>
                      )}
                      <th className="text-left p-2">Date & Time</th>
                      <th className="text-left p-2">Machine</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Session</th>
                      {/* <th className="text-left p-2">Completion %</th> */}
                      <th className="text-left p-2">Feedback</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSessions.map((session) => {
                      const patientId = session.patientId?._id;
                      const physioId = session.physioId?._id;
                      const sessionKey = `${patientId}-${physioId}`;
                      const sessionStats = sessionCountMap[sessionKey] || {
                        total: 0,
                        completed: 0,
                      };
                      const completionPercentage = getCompletionPercentage(
                        sessionStats.completed,
                        sessionStats.total,
                      );

                      return (
                        <tr
                          key={session._id}
                          className="border-b hover:bg-gray-50"
                          style={is26thMilestone(session) ? { backgroundColor: "#e8fde7", borderLeft: "4px solid #86F285" } : {}}
                        >
                          <td className="p-2">
                            {session.sessionCode ||
                              session.incompleteData?.sessionCode ||
                              "-"}
                          </td>
                          <td className="p-2">
                            {session.patientId?.patientName ||
                              session.incompleteData?.patientId?.patientName ||
                              "-"}
                          </td>

                          {user?.role !== "Physio" && (
                            <td className="p-2">
                              {renderPhysioBadge(session.physioId?._id)}
                            </td>
                          )}

                          <td className="p-2">
                            <div>
                              <p className="text-sm">
                                {session.sessionDate
                                  ? session.sessionDate
                                      .split("T")[0]
                                      .split("-")
                                      .reverse()
                                      .join("-")
                                  : "-"}
                                (
                                {session.sessionDay ||
                                  session.incompleteData?.sessionDay ||
                                  "-"}
                                )
                              </p>
                              <p className="text-xs text-gray-600">
                                {session.sessionTime
                                  ? Converttime(session.sessionTime)
                                  : "-"}
                              </p>
                            </div>
                          </td>

                          <td className="p-2">
                            {session.machineId?.machineName || "-"}
                          </td>

                          <td className="p-2">
                            <span
                              className="px-2 py-1 rounded-full text-xs"
                              style={{
                                backgroundColor:
                                  session?.sessionStatusId
                                    ?.sessionStatusColor || "white",
                                color:
                                  session?.sessionStatusId
                                    ?.sessionStatusTextColor || "black",
                              }}
                            >
                              {session?.sessionStatusId?.sessionStatusName ||
                                ""}
                            </span>
                          </td>

                          <td className="p-2">
                            <div className="flex items-center gap-1">
                              {session?.monthlySessionCount || "-"}
                              {is26thMilestone(session) && (
                                <Award className="w-4 h-4" style={{ color: "#86F285" }} title="26th Session Milestone!" />
                              )}
                            </div>
                          </td>

                          {/* <td className="p-2">
                            <span className="font-medium text-cyan-700">
                              {completionPercentage}%
                            </span>
                          </td> */}

                          <td className="p-2">
                            <div className="text-xs space-y-1">
                              {session.sessionFeedbackPros && (
                                <p className="text-green-600">
                                  ✓ {session.sessionFeedbackPros}
                                </p>
                              )}
                              {session.sessionFeedbackCons && (
                                <p className="text-yellow-600">
                                  {session.sessionFeedbackCons}
                                </p>
                              )}

                              {session.redFlags?.length > 0
                                ? session.redFlags.map(
                                    (flag) =>
                                      flag.isOccurred && (
                                        <p
                                          key={flag._id}
                                          className="text-red-600"
                                        >
                                          ⚠ {flag.redFlagId?.redflagName}
                                        </p>
                                      ),
                                  )
                                : !session.sessionFeedbackPros &&
                                  !session.sessionFeedbackCons &&
                                  !(session.redFlags || []).length && (
                                    <span className="text-gray-400">
                                      No feedback
                                    </span>
                                  )}
                            </div>
                          </td>

                          <td className="p-2">
                            <div className="flex space-x-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleViewConsultation(session.patientId)
                                }
                              >
                                <FileText size={14} />
                              </Button>

                              {session?.sessionStatusId?.sessionStatusName?.toLowerCase() ===
                                "scheduled" && (
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() =>
                                    handleSessionAction(session, "Attended")
                                  }
                                >
                                  <Play size={12} />
                                </Button>
                              )}

                              {session?.sessionStatusId?.sessionStatusName?.toLowerCase() ===
                                "attended" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleSessionAction(session, "Completed")
                                  }
                                >
                                  <Square size={12} />
                                </Button>
                              )}

                              {session?.sessionStatusId?.sessionStatusName?.toLowerCase() ===
                                "attended" &&
                                user?.role !== "Physio" && (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() =>
                                      handleSessionAction(session, "Scheduled")
                                    }
                                  >
                                    <StopCircle size={12} />
                                  </Button>
                                )}

                              {(session?.sessionStatusId?.sessionStatusName?.toLowerCase() ===
                                "scheduled" ||
                                session?.sessionStatusId?.sessionStatusName?.toLowerCase() ===
                                  "attended") && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() =>
                                    handleSessionAction(session, "Canceled")
                                  }
                                >
                                  <XCircle size={12} />
                                </Button>
                              )}

                              {user?.role !== "Physio" &&
                                session.sessionStatusId?.sessionStatusName ===
                                  "Canceled" && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                      >
                                        <XCircleIcon size={12} />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>
                                          Are you sure?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This will change the cancelled session
                                          to scheduled.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>
                                          Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() =>
                                            handleSessionCancelRevert(
                                              session._id,
                                              {
                                                updatedBy:
                                                  user?.physioName || "null",
                                              },
                                            )
                                          }
                                        >
                                          Revert Cancel
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}

                              {user?.role !== "Physio" &&
                                Permissions.isEdit && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditSession(session)}
                                  >
                                    <Edit size={12} />
                                  </Button>
                                )}

                              {user?.role !== "Physio" &&
                                Permissions.isDelete && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button size="sm" variant="destructive">
                                        <Trash2 size={12} />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>
                                          Are you sure?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This will permanently delete the
                                          session.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>
                                          Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() =>
                                            handleDeleteSession(session._id)
                                          }
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        <PatientDetailsDialog
          isOpen={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          patient={viewingPatient}
        />

        <Card className="medical-card md:hidden">
          <CardHeader>
            <CardTitle>
              Sessions ({filteredSessions.length || sessions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="md:hidden space-y-4">
              {filteredSessions.map((session) => {
                const patientId = session.patientId?._id;
                const physioId = session.physioId?._id;

                return (
                  <Card
                    key={session._id}
                    className="p-4 shadow-lg rounded-2xl border"
                    style={is26thMilestone(session) ? { borderColor: "#86F285", backgroundColor: "#e8fde7" } : {}}
                  >
                    {is26thMilestone(session) && (
                      <div className="flex items-center gap-1 mb-2">
                        <Award className="w-4 h-4" style={{ color: "#86F285" }} />
                        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "#2d7a2d" }}>
                          26th Session Milestone
                        </span>
                      </div>
                    )}
                    <div className="mb-2">
                      <p className="text-base font-bold">
                        {session.patientId?.patientName || "-"}
                      </p>

                      {user?.role !== "Physio" && (
                        <p className="text-sm text-gray-500">
                          Physio:
                          <span className="font-medium">
                            {session.physioId?.physioName || "-"}
                          </span>
                        </p>
                      )}
                    </div>

                    <p className="text-sm text-gray-500">
                      Session
                      <span className="font-medium ml-1" style={is26thMilestone(session) ? { color: "#2d7a2d" } : { color: "#1f2937" }}>
                        {session.monthlySessionCount || "-"}
                      </span>
                    </p>

                    {/* <p className="text-sm text-gray-500">
                      Completion %
                      <span className="font-medium text-cyan-700 ml-1">
                        {completionPercentage}%
                      </span>
                    </p> */}

                    <div className="bg-gray-100 rounded-md p-2 text-xs mb-2 mt-2">
                      <p className="font-semibold">
                        {session.sessionDate
                          ? new Date(session.sessionDate).toLocaleDateString(
                              "en-GB",
                            ) + ` (${session.sessionDay || "-"})`
                          : "-"}
                      </p>
                      <p className="text-gray-700">
                        {session.sessionTime
                          ? Converttime(session.sessionTime)
                          : "-"}
                      </p>
                    </div>

                    <div className="flex justify-between text-xs mb-2">
                      <p className="font-medium">
                        Machine: {session.machineId?.machineName || "-"}
                      </p>
                      <span
                        className="px-2 py-1 rounded-sm text-[10px]"
                        style={{
                          backgroundColor:
                            session.sessionStatusId?.sessionStatusColor ||
                            "white",
                          color:
                            session.sessionStatusId?.sessionStatusTextColor ||
                            "black",
                        }}
                      >
                        {session.sessionStatusId?.sessionStatusName || "-"}
                      </span>
                    </div>

                    <div className="text-xs space-y-1">
                      {session.sessionFeedbackPros && (
                        <p className="text-green-600">
                          ✓ {session.sessionFeedbackPros}
                        </p>
                      )}
                      {session.sessionFeedbackCons && (
                        <p className="text-yellow-600">
                          {session.sessionFeedbackCons}
                        </p>
                      )}

                      {session.redFlags?.length > 0
                        ? session.redFlags.map(
                            (flag) =>
                              flag.isOccurred && (
                                <p key={flag._id} className="text-red-600">
                                  ⚠ {flag.redFlagId?.redflagName}
                                </p>
                              ),
                          )
                        : !session.sessionFeedbackPros &&
                          !session.sessionFeedbackCons &&
                          !(session.redFlags || []).length && (
                            <span className="text-gray-400">No feedback</span>
                          )}
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleViewConsultation(session.patientId)
                        }
                      >
                        <FileText size={14} />
                      </Button>

                      {session.sessionStatusId?.sessionStatusName?.toLowerCase() ===
                        "scheduled" && (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() =>
                            handleSessionAction(session, "Attended")
                          }
                        >
                          <Play size={12} />
                        </Button>
                      )}

                      {session.sessionStatusId?.sessionStatusName?.toLowerCase() ===
                        "attended" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleSessionAction(session, "Completed")
                          }
                        >
                          <Square size={12} />
                        </Button>
                      )}

                      {session.sessionStatusId?.sessionStatusName?.toLowerCase() ===
                        "attended" &&
                        (user?.role === "Admin" || user?.role === "HOD") && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              handleSessionAction(session, "Scheduled")
                            }
                          >
                            <StopCircle size={12} />
                          </Button>
                        )}

                      {(session.sessionStatusId?.sessionStatusName?.toLowerCase() ===
                        "scheduled" ||
                        session.sessionStatusId?.sessionStatusName?.toLowerCase() ===
                          "attended") && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            handleSessionAction(session, "Canceled")
                          }
                        >
                          <XCircle size={12} />
                        </Button>
                      )}

                      {user?.role !== "Physio" &&
                        session.sessionStatusId?.sessionStatusName ===
                          "Canceled" && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <XCircleIcon size={12} />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Are you sure?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will change the cancelled session to
                                  scheduled.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleSessionCancelRevert(session._id)
                                  }
                                >
                                  Revert Cancel
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}

                      {user?.role !== "Physio" && Permissions.isEdit && (
                        <Button onClick={() => handleEditSession(session)}>
                          <Edit size={12} />
                        </Button>
                      )}

                      {user?.role !== "Physio" && Permissions.isDelete && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              <Trash2 size={12} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the session.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteSession(session._id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog
        open={feedbackDialog.open}
        onOpenChange={(open) =>
          setFeedbackDialog({
            open,
            sessionId: null,
            physioId: open ? feedbackDialog.physioId : "",
          })
        }
      >
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Add Session Feedback</DialogTitle>
            <DialogDescription>
              Provide feedback for the completed session.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-6">
            <div className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label htmlFor="sessionFeedbackPros">Update Feedback</Label>
                <textarea
                  id="sessionFeedbackPros"
                  className="w-full p-2 border rounded-md"
                  rows={2}
                  value={feedback.sessionFeedbackPros}
                  onChange={(e) =>
                    setFeedback({
                      ...feedback,
                      sessionFeedbackPros: e.target.value,
                    })
                  }
                  placeholder="What went well..."
                />
              </div>

              <div className="space-y-2">
                <Label>Mode of Exercise</Label>
                <RadioGroup
                  value={feedback.modeOfExercise}
                  onValueChange={(v) =>
                    setFeedback({ ...feedback, modeOfExercise: v })
                  }
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="active" id="ex-active" />
                    <Label htmlFor="ex-active">Active</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="passive" id="ex-passive" />
                    <Label htmlFor="ex-passive">Passive</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label>Red Flags</Label>
                <div className="p-3 border rounded-md grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {redFlags.map((flag) => {
                    const flagId = flag.RedflagIDPK || flag._id;
                    const isChecked = feedback.redFlags?.some(
                      (f) =>
                        String(f.redFlagId?._id || f.redFlagId) ===
                        String(flagId),
                    );

                    return (
                      <div key={flagId} className="flex items-center space-x-2">
                        <Checkbox
                          id={`rf-${flagId}`}
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            setFeedback((prev) => ({
                              ...prev,
                              redFlags: checked
                                ? [
                                    ...prev.redFlags.filter(
                                      (f) =>
                                        String(
                                          f.redFlagId?._id || f.redFlagId,
                                        ) !== String(flagId),
                                    ),
                                    {
                                      redFlagId: {
                                        _id: flagId,
                                        redflagName: flag.redflagName,
                                      },
                                      isOccurred: true,
                                    },
                                  ]
                                : prev.redFlags.filter(
                                    (f) =>
                                      String(
                                        f.redFlagId?._id || f.redFlagId,
                                      ) !== String(flagId),
                                  ),
                            }));
                          }}
                        />
                        <Label
                          htmlFor={`rf-${flagId}`}
                          className="text-sm font-normal"
                        >
                          {flag.redflagName}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Home Exercise Program Assigned</Label>
                <RadioGroup
                  value={feedback.homeExerciseAssigned}
                  onValueChange={(v) =>
                    setFeedback({ ...feedback, homeExerciseAssigned: v })
                  }
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="true" id="he-yes" />
                    <Label htmlFor="he-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="false" id="he-no" />
                    <Label htmlFor="he-no">No</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label>Modalities</Label>
                <RadioGroup
                  value={feedback.modalities ? "yes" : "no"}
                  onValueChange={(v) => {
                    setFeedback((prev) => ({
                      ...prev,
                      modalities: v === "yes",
                      modalitiestype: v === "no" ? "" : prev.modalitiestype,
                      modalitiesList: v === "no" ? [] : prev.modalitiesList,
                    }));
                  }}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="mod-yes" />
                    <Label htmlFor="mod-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="mod-no" />
                    <Label htmlFor="mod-no">No</Label>
                  </div>
                </RadioGroup>
              </div>

              {feedback.modalities === true && (
                <div className="space-y-2">
                  <Label htmlFor="modalitiestype">Modalities Type</Label>

                  <Select
                    value={feedback.modalitiestype}
                    onValueChange={(val) =>
                      setFeedback((prev) => ({
                        ...prev,
                        modalitiestype: val,
                        modalitiesList: [],
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
                      <SelectItem value="Electrotherapy">
                        Electrotherapy
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {feedback.modalitiestype && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-2 pl-4"
                    >
                      <Label>List of Modalities</Label>

                      {(() => {
                        const list = (Modalities || []).filter((mod) => {
                          const modId = String(mod._id);
                          return (
                            mod.modalitiestype === feedback.modalitiestype &&
                            physioModalityIds.includes(modId)
                          );
                        });

                        if (list.length === 0) {
                          return (
                            <div className="p-3 border rounded-md text-sm text-red-500">
                              This Physio does not have any assigned modalities.
                            </div>
                          );
                        }

                        return (
                          <div className="p-3 border rounded-md grid grid-cols-3 gap-2">
                            {list.map((mod) => {
                              const id = String(mod._id);
                              const isChecked = (feedback.modalitiesList || [])
                                .map(String)
                                .includes(id);

                              return (
                                <div
                                  key={id}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={`mod-${id}`}
                                    checked={isChecked}
                                    onCheckedChange={(checked) => {
                                      setFeedback((prev) => {
                                        const listIds = (
                                          prev.modalitiesList || []
                                        ).map(String);

                                        return {
                                          ...prev,
                                          modalitiesList: checked
                                            ? Array.from(
                                                new Set([...listIds, id]),
                                              )
                                            : listIds.filter((m) => m !== id),
                                        };
                                      });
                                    }}
                                  />
                                  <Label
                                    htmlFor={`mod-${id}`}
                                    className="text-sm font-normal"
                                  >
                                    {mod.modalitiesName}
                                  </Label>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </motion.div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="targetArea">Targeted Area</Label>
                <Input
                  id="targetArea"
                  value={feedback.targetArea}
                  onChange={(e) =>
                    setFeedback({ ...feedback, targetArea: e.target.value })
                  }
                  placeholder="e.g., Lower back, right shoulder"
                />
              </div>

              {user?.role === "Physio" && (
                <div className="space-y-2">
                  <Label>Upload Image/Video</Label>
                  <Input
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFeedbackUpload}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={16} className="mr-2" /> Attach Media
                  </Button>

                  <div className="mt-2 space-y-1">
                    {(feedback.media || []).map((doc, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-sm text-gray-600"
                      >
                        <Paperclip size={14} /> {doc}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setFeedbackDialog({
                      open: false,
                      sessionId: null,
                      physioId: "",
                    })
                  }
                >
                  Cancel
                </Button>
                <Button onClick={handleFeedbackSubmit}>Submit Feedback</Button>
              </DialogFooter>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={cancelDialog.open}
        onOpenChange={(open) => setCancelDialog({ open, sessionId: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Session</DialogTitle>
            <DialogDescription>
              Enter the below details before cancellation, if any.
            </DialogDescription>
          </DialogHeader>

          {user?.role !== "Physio" && (
            <div className="space-y-4 pt-4">
              <Label htmlFor="cancelledKms">Cancelled Kms</Label>
              <Input
                id="cancelledKms"
                type="number"
                onWheel={(e) => e.target.blur()}
                value={cancelledKms}
                onChange={(e) => setCancelledKms(e.target.value)}
                placeholder="e.g., 5"
              />
              <p className="text-xs text-gray-500">
                This amount will be deducted from the physio's daily total.
              </p>
            </div>
          )}

          <div className="space-y-4 pt-4">
            <Label htmlFor="cancelledReason">Cancel Reason</Label>

            <Select
              value={cancelledReasonType}
              onValueChange={(val) => {
                setCancelledReasonType(val);
                if (val !== "Other") setCancelledReason(val);
                else setCancelledReason("");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Cancel Reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LUP">LUP</SelectItem>
                <SelectItem value="LUO">LUO</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>

            {cancelledReasonType === "Other" && (
              <Input
                id="cancelledReason"
                type="text"
                value={cancelledReason}
                onChange={(e) => setCancelledReason(e.target.value)}
                placeholder="Enter reason for cancelling this session..."
                required
              />
            )}

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="claimPetrol"
                checked={claimPetrol}
                onChange={handleCheckboxChange}
                className="w-4 h-4"
              />
              <Label htmlFor="claimPetrol">Claim Petrol</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCancelDialog({ open: false, sessionId: null })}
            >
              Back
            </Button>
            <Button onClick={handleCancelSubmit}>Confirm Cancellation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                onValueChange={(v) =>
                  setSessionForm((p) => ({ ...p, patientId: v }))
                }
                value={sessionForm.patientId}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((p) => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.patientName}
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
                onValueChange={(v) =>
                  setSessionForm((p) => ({ ...p, physioId: v }))
                }
                value={sessionForm.physioId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a physio" />
                </SelectTrigger>
                <SelectContent>
                  {physios.map((p) => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.physioName}
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
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      (!sessionForm.sessionDate ||
                        sessionForm.sessionDate.length === 0) &&
                        "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {sessionForm.sessionDate?.length > 0 ? (
                      <span>
                        {sessionForm.sessionDate.length} date(s) selected
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
                      Array.isArray(sessionForm.sessionDate)
                        ? sessionForm.sessionDate
                        : []
                    }
                    onSelect={(dates) =>
                      setSessionForm((p) => ({
                        ...p,
                        sessionDate: dates || [],
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
              <Label htmlFor="sessionDay">
                Session Day<span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="sessionDay"
                disabled
                type="text"
                value={sessionForm.sessionDay}
                onChange={(e) =>
                  setSessionForm((p) => ({ ...p, sessionDay: e.target.value }))
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
                  setSessionForm((p) => ({ ...p, sessionTime: e.target.value }))
                }
              />
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
                {editingSession ? "Save Changes" : "Schedule Session"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SessionManagement;
