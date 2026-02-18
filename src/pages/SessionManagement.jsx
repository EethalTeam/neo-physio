import React, { useState, useEffect, useRef, useMemo } from "react";
import { m, motion } from "framer-motion";
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
  Calendar as CalendarIcon,
  Play,
  Square,
  MessageSquare,
  Search,
  PlusCircle,
  Edit,
  Trash2,
  Upload,
  Paperclip,
  XCircle,
  FileText,
  User,
  CircleDotDashedIcon,
  StopCircle,
  XCircleIcon,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, isMonday } from "date-fns";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "@/components/CustomComponents/apiRequest";
import PatientDetailsDialog from "../components/PatientDetailsDialog";
import PetrolAllowance from "./PetrolAllowance";

const SessionManagement = () => {
  const [cancelledReasonType, setCancelledReasonType] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();
  const [getPhysioCounts, setgetphyioCounts] = useState("");
  const userRole = localStorage.getItem("userRole");
  const physioName = user?.physioName;
  console.log(userRole, "userRole");
  console.log(user?.physioName, "physioName");
  const [sessions, setSessions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [physios, setPhysios] = useState([]);
  const [machines, setMachines] = useState([]);
  const [redFlags, setRedFlags] = useState([]);
  const [Modalities, setModalities] = useState([]);
  // console.log(Modalities,"Modalities")
  const [sessionStatus, setSessionStatus] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  console.log(filteredSessions, "filteredSessions");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const initialFormState = {
    // patientId: '',
    //  physioId: '',
    //  sessionDate: null,
    //  sessionTime: '',
    //  machineId: ''
    sessionCount: "",
    sessionCode: "",
    patientId: "",
    physioId: "",
    sessionDate: "",
    sessionDay: "",
    sessionTime: "",
    sessionStatusId: "691ecb36b87c5c57dead47a7",
    // machineId:''
  };

  const [sessionForm, setSessionForm] = useState(initialFormState);
  const [feedbackDialog, setFeedbackDialog] = useState({
    open: false,
    sessionId: null,
  });
  // console.log(feedbackDialog, "feedbackDialog");
  const initialFeedbackState = {
    sessionFeedbackPros: "",
    redFlags: [],
    media: [],
    modeOfExercise: "",
    homeExerciseAssigned: false,
    modalitiesList: [],
    targetArea: "",
    machineId: "",
    modalities: "no",
  };
  const [feedback, setFeedback] = useState(initialFeedbackState);
  console.log(feedback, "feedback");
  const fileInputRef = useRef(null);

  const [cancelDialog, setCancelDialog] = useState({
    open: false,
    sessionId: null,
  });
  const [cancelledReason, setCancelledReason] = useState("");
  const [cancelledKms, setCancelledKms] = useState("");
  const [radio, setRadio] = useState([]);
  const [claimPetrol, setClaimPetrol] = useState(true);
  const { getPermissionsByPath } = useAuth();
  const [Permissions, setPermissions] = useState({
    isAdd: false,
    isView: false,
    isEdit: false,
    isDelete: false,
  });

  // const modalitiesOptions = ["TENS", "IFT", "USD", "WAX", "ICE", "HOT", "Weights", "Band"];

  useEffect(() => {
    getPhysio();
    getAllPatient();
    getPhysioCount();
    getPatient();
    getSessionStatus();
    // getMachinery();
    getRedFlag();
    getModalities();
    getAllMachine();
    handleViewConsultation();
    getPermissionsByPath(window.location.pathname).then((res) => {
      if (res) {
        setPermissions(res);
      } else {
        navigate("/dashboard");
      }
    });
  }, []);
  const handleCheckboxChange = () => {
    setClaimPetrol((prev) => !prev);
  };

  useEffect(() => {
    if (Permissions.isView) {
      getSession();
    }
  }, [Permissions]);

  // const getSession = async (data) => {
  //   try {
  //     let date = new Date().toISOString()
  //     let nextdate1 = Number(date.split('T')[0].split('-')[2]) + 1
  //     console.log(nextdate1, "nextdate")
  //     let filter = `${date.split('T')[0]}T00:00:00Z`
  //     const [year, month] = date.split("T")[0].split("-");
  //     let nextdate = `${year}-${month}-${nextdate1}T00:00:00Z`;
  //     //  let nextdate=`${date.split('T')[0].split('-')[0]}-${date.split('T')[0].split('-')[1]}-${nextdate1}T00:00:00Z`
  //     console.log(nextdate, "nextdate")
  //     const response = await apiRequest("Session/getAllSession", {
  //       method: 'POST',
  //       body: JSON.stringify({ sessionDate: filter, nextDate: nextdate, physioId: user._id })
  //     });
  //     setSessions(response)
  //     setFilteredSessions(response)

  //   } catch (error) {
  //     console.log(error, "error from frontend get All  Session")
  //   }
  // }

  // const getSession = async () => {
  //   try {
  //     const storedRole = localStorage.getItem("userRole");

  //     const today = new Date();
  //     const tomorrow = new Date(today);
  //     tomorrow.setDate(today.getDate() + 1);

  //     const filter = `${today.toISOString().split("T")[0]}T00:00:00Z`;
  //     const nextdate = `${tomorrow.toISOString().split("T")[0]}T00:00:00Z`;

  //     const response = await apiRequest("Session/getAllSession", {
  //       method: "POST",
  //       body: JSON.stringify({
  //         sessionDate: filter,
  //         nextDate: nextdate,
  //         physioId: user._id,
  //         storedRole,
  //       }),
  //     });

  //     //  IMPORTANT SAFETY CHECK
  //     if (Array.isArray(response)) {
  //       setSessions(response);
  //       setFilteredSessions(response);
  //     } else {
  //       console.warn("Session API did not return array:", response);
  //       setSessions([]);
  //       setFilteredSessions([]);
  //     }
  //   } catch (error) {
  //     console.log(error, "error from frontend get All Session");
  //     setSessions([]);
  //     setFilteredSessions([]);
  //   }
  // };
  const [sessionCountMap, setSessionCountMap] = useState({});
  // console.log(sessionCountMap, "sessionCountMap");

  // const getNthSession = (currentSession) => {
  //   if (!sessions?.length) return "-";
  //   const relatedSessions = sessions
  //     .filter(
  //       (s) =>
  //         s.patientId?._id === currentSession.patientId?._id &&
  //         s.physioId?._id === currentSession.physioId?._id,
  //     )
  //     .sort((a, b) => new Date(a.sessionDate) - new Date(b.sessionDate));
  //   const index = relatedSessions.findIndex(
  //     (s) => s._id === currentSession._id,
  //   );

  //   return index !== -1 ? index + 1 : "-";
  // };

  const getCreateSession = async (data) => {
    try {
      if (!data.sessionDate) {
        return;
      }
      const year = data.sessionDate.getFullYear();
      const month = (data.sessionDate.getMonth() + 1)
        .toString()
        .padStart(2, "0");
      // Pad the date with a leading zero if necessary
      const date = data.sessionDate.getDate().toString().padStart(2, "0");
      // let [month, date, year] = data.sessionDate
      // .toLocaleDateString()
      // .split("/");
      let date1 = `${year}-${month}-${date}`;
      console.log(date1);
      const create = {
        sessionStatusId: data.sessionStatusId,
        patientId: data.patientId,
        physioId: data.physioId,
        sessionDate: new Date(date1).toISOString(),
        sessionTime: data.sessionTime,
        sessionDay: data.sessionDay,
        sessionCount: data.sessionCount,
      };
      const response = await apiRequest("Session/createSession", {
        method: "POST",
        body: JSON.stringify(create),
      });
      getSession();
    } catch (error) {
      console.log(error, "error from frontend get All  Session");
    }
  };

  const updateSession = async (data) => {
    try {
      const response = await apiRequest("Session/updateSession", {
        method: "POST",
        body: JSON.stringify(data),
      });
      getSession();
    } catch (error) {
      console.log(error, "error from frontend update  Session");
    }
  };

  const deleteSession = async (data) => {
    try {
      const response = await apiRequest("Session/deleteSession", {
        method: "POST",
        body: JSON.stringify(data),
      });
      getSession();
    } catch (error) {
      console.log(error, "error   Session delete");
    }
  };
  const deleteDuplicateSession = async (patientId, physioId, sessionTime) => {
    try {
      const response = await apiRequest("Session/deleteDuplicateSession", {
        method: "POST",
        body: JSON.stringify({
          patientId,
          physioId,
          sessionTime,
        }),
      });

      console.log(response);
      getSession();
    } catch (error) {
      console.log(error, "error Session delete");
    }
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

  const getPhysio = async (data) => {
    try {
      const response = await apiRequest("Physio/getAllPhysio", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setPhysios(response.physios);
    } catch (error) {
      console.log(error, "error from frontend get All Physio");
    }
  };
  const [sessionCount, setSessionCount] = useState({ total: 0, completed: 0 });

  const getSessionStatus = async (data) => {
    try {
      const response = await apiRequest("SessionStatus/getAllSessionStatus", {
        method: "POST",
        body: JSON.stringify(data),
      });
      // setSessionStatus(response)
      setSessionStatus(response.sessionStatuses);
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
      setRedFlags(response);
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
      setModalities(response);
    } catch (error) {
      console.log(error, "error from frontend get All Modalities");
    }
  };
  // const assignedPhysioIds =
  //   typeof sessionForm.physioId === "object"
  //     ? sessionForm.physioId?._id
  //     : sessionForm.physioId;
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

      const modId = m.modalityId?._id ?? m.modalityId; // object or string

      if (isAssigned && modId) set.add(String(modId));
    });

    return Array.from(set);
  }, [machines, assignedPhysioIds]);

  console.log("machines", machines.length);
  console.log("assignedPhysioId", assignedPhysioIds);
  console.log("physioModalityIds", physioModalityIds);

  const getAllMachine = async (data) => {
    try {
      const res = await apiRequest("Machinery/getAllMachinery", {
        method: "POST",
        body: JSON.stringify(data),
      });

      // depending on response shape
      const list = res?.machines ?? res ?? [];
      setMachines(list);
    } catch (error) {
      console.error("not able to getall Machine", error);
    }
  };

  const SessionStop = async (data) => {
    try {
      const response = await apiRequest("Session/SessionStop", {
        method: "POST",
        body: JSON.stringify(data),
      });
      getSession();
      return response;
    } catch (error) {
      console.log(error, "error from frontend get All Session Start");
    }
  };
  const SessionCancelRevert = async (sessionId) => {
    try {
      const response = await apiRequest("Session/SessionCancelRevert", {
        method: "POST",
        body: JSON.stringify({ sessionId }),
      });

      getSession();
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
      getSession();
      return response;
    } catch (error) {
      console.log(error, "error from frontend get All Session Start");
    }
  };

  const SessionCancel = async (data) => {
    try {
      const response = await apiRequest("Session/SessionCancel", {
        method: "POST",
        body: JSON.stringify(data),
      });
      // console.log(data, "data of cancel");
      getSession();
      return response;
    } catch (error) {
      console.log(error, "error from frontend get All Session Cancel");
    }
  };

  const SessionEnd = async (data) => {
    // console.log("SessionEnd");
    try {
      const payload = {
        ...data,
        modalities: data.modalities,
      };
      const response = await apiRequest("Session/SessionEnd", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      // console.log(data.modalities, "data.modalities ");

      if (response) {
        if (feedback.redFlags.length > 0) {
          toast({
            title: "HOD Notification",
            description: "Red flags have been reported to HOD for review.",
          });
        }
        setFeedbackDialog({ open: false, sessionId: null });
        setFeedback(initialFeedbackState);
        toast({
          title: "Session Completed",
          description: "Session feedback has been recorded.",
        });
        getSession();
      }
    } catch (error) {
      console.log(error, "error from frontend get All Session Start");
    }
  };

  //convert the time

  const Converttime = (time) => {
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
  // getDayName
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

  useEffect(() => {
    let filtered = [...sessions];

    const term = searchTerm.toLowerCase();

    // Filter by patient name
    if (searchTerm) {
      filtered = filtered.filter(
        (s) =>
          s.patientId?.patientName?.toLowerCase().includes(term) ||
          s.physioId?.physioName?.toLowerCase().includes(term),
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (s) => s.sessionStatusId?.sessionStatusName === statusFilter,
      );
    }

    // Filter by date
    const filterDate = dateFilter || new Date().toISOString().slice(0, 10);
    filtered = filtered.filter(
      (s) => s.sessionDate?.slice(0, 10) === filterDate,
    );
    setFilteredSessions(filtered);
    // setSearchTerm("");
  }, [sessions, searchTerm, statusFilter, dateFilter]);

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
    }
    // Handle 24-hour format
    else {
      const [h, m] = time.split(":").map(Number);
      hours = h;
      minutes = m;
    }

    date.setHours(hours, minutes, 0, 0);
    return date;
  };
  const canStartByPreviousIndex = (sessions, session) => {
    const currentTime = buildSessionDateTime(session);

    const previousSessions = sessions
      .filter((s) => {
        const t = buildSessionDateTime(s);
        return t < currentTime;
      })
      .sort((a, b) => buildSessionDateTime(b) - buildSessionDateTime(a));

    if (previousSessions.length === 0) return true;

    const prevStatus = previousSessions[0]?.sessionStatusId?.sessionStatusName;

    return prevStatus === "Completed" || prevStatus === "Canceled";
  };

  const [msg, setMsg] = useState("");
  const [data, setData] = useState("");
  const getSession = async (date) => {
    try {
      const storedRole = localStorage.getItem("userRole");
      const today = new Date().toISOString().split("T")[0];
      let Today;
      if (date) {
        Today = date;
      } else {
        Today = today;
      }
      const response = await apiRequest("Session/getAllSession", {
        method: "POST",
        body: JSON.stringify({
          physioId: user._id,
          Today,
          storedRole,
        }),
      });
      // console.log(response, "response response");
      // if (!Array.isArray(response)) return;
      console.log(response, "response");
      const msgs = response.message;
      setMsg(msgs);
      const Data = response.incompleteData || response || [];
      // setData(Data);
      console.log(Data, "Data");
      // setSessions(Data);
      setFilteredSessions(Data);
      //Build session count map
      const countMap = {};

      Data.forEach((s) => {
        const pid = s.patientId?._id;
        const physioId = s.physioId?._id;
        if (!pid || !physioId) return;

        const key = `${pid}-${physioId}`;

        if (!countMap[key]) {
          countMap[key] = { total: 0, completed: 0 };
        }

        countMap[key].total += 1;

        if (s.sessionStatusId?.sessionStatusName === "Completed") {
          countMap[key].completed += 1;
        }
      });

      setSessionCountMap(countMap);

      const todaySessions = Data.filter((s) => {
        if (!s.sessionDate || !s.sessionTime) return false;

        const sessionDay = new Date(s.sessionDate).toISOString().split("T")[0];

        // if patient is recovered
        if (s.patientId?.isRecovered) {
          const recoveredDay = new Date(s.patientId.recoveredAt)
            .toISOString()
            .split("T")[0];

          //recovered before today → hide today session
          if (recoveredDay < today) return false;
        }

        return sessionDay === today;
      })

        .sort((a, b) => {
          const aTime = buildSessionDateTime(a);
          const bTime = buildSessionDateTime(b);
          return aTime - bTime;
        });
      console.log(todaySessions, "todaySessions");
    } catch (error) {
      console.error("Error fetching sessions:", error);
    }
  };
  const getPhysioCount = async () => {
    try {
      const response = await apiRequest("Patient/getPhysioPatientCounts", {
        method: "POST",
        body: JSON.stringify({}),
      });

      console.log(response, "getphysiocount response");
      setgetphyioCounts(response.data);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    }
  };

  const handleSessionAction = (sessionId, action) => {
    if (action === "Completed") {
      setFeedbackDialog({ open: true, sessionId });
      return;
    }

    if (action === "Canceled") {
      setCancelDialog({ open: true, sessionId });
      return;
    }

    // Validate ONLY when starting (Attended)
    if (action === "Attended") {
      const session = filteredSessions.find((s) => s._id === sessionId);
      if (!session) return;

      if (!canStartByPreviousIndex(filteredSessions, session)) {
        toast({
          title: "Action blocked",
          description: "Please complete or cancel the previous session first",
          variant: "destructive",
        });
        return;
      }

      handleActionStart(sessionId, action);
    }

    // stop
    if (action === "Scheduled") {
      handlesessionStop(sessionId, action);
    }
    if (action === "Canceled") {
      handleSessionCancelRevert(sessionId, action);
    }
    // Update UI
    setSessions((prev) =>
      prev.map((s) =>
        s._id === sessionId
          ? {
              ...s,
              sessionStatusId: {
                ...s.sessionStatusId,
                sessionStatusName: action,
              },
            }
          : s,
      ),
    );
    setFilteredSessions((prev) =>
      prev.map((s) =>
        s._id === sessionId
          ? {
              ...s,
              sessionStatusId: {
                ...s.sessionStatusId,
                sessionStatusName: action,
              },
            }
          : s,
      ),
    );

    toast({
      title: "Session Updated",
      description: `Session has been marked as ${action}`,
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
    setSessions((prev) =>
      prev.map((s) =>
        s._id === sessionId
          ? {
              ...s,
              status: "Canceled",
              cancelledKms: parseFloat(cancelledKms) || 0,
              petrolAllowanceClaimed: claimPetrol,
            }
          : s,
      ),
    );
    toast({
      title: "Session Canceled",
      description: "Session has been marked as Canceled.",
    });
    setCancelDialog({ open: false, sessionId: null });
    setCancelledKms("");
    setCancelledReason("");
    setClaimPetrol(true);
  };

  const handleFeedbackUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFeedback((prev) => ({ ...prev, media: [...prev.media, file.name] }));
      toast({
        title: "Media Added",
        description: `${file.name} staged for upload.`,
      });
    }
  };

  const handleFeedbackSubmit = () => {
    const { sessionId } = feedbackDialog;

    // Feedback text required
    if (!feedback.sessionFeedbackPros?.trim()) {
      toast({
        title: "Alert",
        description: "Enter the session feedback",
        variant: "destructive",
      });
      return;
    }

    //Mode of exercise required
    if (!feedback.modeOfExercise) {
      toast({
        title: "Alert",
        description: "Select the Mode of Exercise",
        variant: "destructive",
      });
      return;
    }

    // Modalities list required if modalities = yes
    if (feedback.modalities) {
      if (!feedback.modalitiesList?.length) {
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

    //Targeted area required

    console.log(feedback, "Validation passed");
    handleActionEnd(feedback, "Completed", sessionId);
  };

  const handleActionStart = (session, action) => {
    SessionStart({
      _id: session,
      sessionFromTime: CovertTdyTim(),
      action: action,
    });
  };
  const handlesessionStop = (session, action) => {
    SessionStop({
      _id: session,
      action: action,
    });
  };
  const handleSessionCancelRevert = (session, action) => {
    SessionCancelRevert({
      _id: session,

      action: action,
    });
  };
  const handleActionCancel = (
    session,
    action,
    cancelledKms,
    cancelledReason,
    claimPetrol,
  ) => {
    SessionCancel({
      _id: session,
      action: action,
      physioId: user?._id,
      userRole: userRole,
      physioName: physioName,
      cancelledKms: cancelledKms,
      cancelledReason: cancelledReason,
      petrolAllowanceClaimed: claimPetrol,
    });
  };

  // const handleActionEnd = (session, action, id) => {
  //   SessionEnd({
  //     _id: id,
  //     sessionToTime: CovertTdyTim(),
  //     action: action,
  //     modeOfExercise: feedback.modeOfExercise,
  //     // machineId: session.machineId,
  //     sessionFeedbackPros: session.sessionFeedbackPros,
  //     redFlags: session.redFlags,
  //     targetArea: session.targetArea,
  //     modalitiesList: session.modalitiesList,
  //     modalities: feedback.modalities,
  //   });
  // };
  const handleActionEnd = (session, action, id) => {
    SessionEnd({
      _id: id,
      sessionToTime: CovertTdyTim(),
      action: action,
      modeOfExercise: feedback.modeOfExercise || "",
      machineId: session.machineId?._id || session.machineId || undefined,
      sessionFeedbackPros: session.sessionFeedbackPros || "",
      redFlags: (session.redFlags || [])
        .filter((r) => r.redFlagId)
        .map((r) => ({
          redFlagId: r.redFlagId,
          isOccurred: r.isOccurred || false,
        })),
      targetArea: session.targetArea || "",
      modalitiesList: (session.modalitiesList || [])
        .filter((m) => m.modalityId)
        .map((m) => ({
          modalityId: m.modalityId,
          isOccurred: m.isOccurred || false,
        })),
      homeExerciseAssigned: feedback.homeExerciseAssigned,
      modalities: feedback.modalities,
    });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();

    if (!sessionForm.patientId) {
      alert("select the patient");
    }

    if (!sessionForm.physioId) {
      alert("select the physio");
    }

    const formData = {
      ...sessionForm,
      patientId: parseInt(sessionForm.patientId),
      physioId: parseInt(sessionForm.physioId),
      machineId: sessionForm.machineId ? parseInt(sessionForm.machineId) : null,
      sessionDate: sessionForm.sessionDate,
    };

    if (editingSession) {
      updateSession({ ...sessionForm, redFlags: radio });
      toast({ title: "Success", description: "Session updated." });
    } else {
      const newSession = {
        id: Date.now(),
        ...formData,
        status: "scheduled",
        feedback: null,
      };
      getCreateSession({ ...sessionForm, redFlags: radio });
      toast({ title: "Success", description: "New session scheduled." });
    }
    setIsFormOpen(false);
    setEditingSession(null);
    setSessionForm(initialFormState);
  };

  const handleEditSession = (session) => {
    setEditingSession(session);
    setSessionForm({
      ...session,
      // patientId: session.patientId.toString(),
      // physioId: session.physioId.toString(),
      // machineId: session.machineId ? session.machineId.toString() : '',
      // sessionDate: new Date(session.sessionDate),

      sessionCode: session.sessionCode ? session.sessionCode : "",
      patientId: session.patientId ? session.patientId._id : "",
      physioId: session.physioId ? session.physioId._id : "",
      sessionDate: session.sessionDate ? new Date(session.sessionDate) : "",
      sessionDay: session.sessionDay ? session.sessionDay : "",
      sessionTime: session.sessionTime ? session.sessionTime : "",
      sessionFromTime: session.sessionFromTime ? session.sessionFromTime : "",
      sessionToTime: session.sessionToTime ? session.sessionToTime : "",
      sessionCount: session.sessionCount ? session.sessionCount : "",
      // machineId: session.machineId?session.machineId._id:'',
      sessionStatusId: session.sessionStatusId
        ? session.sessionStatusId._id
        : "",
    });
    setIsFormOpen(true);
  };

  const renderPhysioBadge = (physioId) => {
    // 1. Find the physio object from your state array
    const physio = getPhysioCounts.find((p) => p.physioId === physioId);

    // 2. Handle case where physio might not be found
    if (!physio) return <span>Physio not found</span>;

    // 3. Define the background color logic
    const bgColor =
      physio.activePatientCount > 6
        ? "green"
        : physio.activePatientCount > 3
          ? "orange"
          : "red";

    // 4. Return the styled response
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

  const handleDeleteSession = (id) => {
    // setSessions(prev => prev.filter(s => s.id !== sessionId));
    deleteSession({ _id: id });
    toast({
      title: "Deleted",
      description: "Session has been removed.",
      variant: "destructive",
    });
  };
  // const handleDuplicateSession = (patientId, physioId, sessionTime) => {
  //   deleteDuplicateSession(patientId, physioId, sessionTime);

  //   toast({
  //     title: "Deleted",
  //     description: "Duplicate sessions have been removed.",
  //     variant: "destructive",
  //   });
  // };

  const openNewSessionDialog = () => {
    setEditingSession(null);
    setSessionForm(initialFormState);
    setIsFormOpen(true);
  };
  const Today = new Date().toISOString().split("T")[0];

  // const handleRadio = (name,value) => {
  //   setRadio(prev =>[...prev, { redFlagIdID: RedflagIDPK, isOccurred: value }] )
  //   setFeedback(prev => ({ ...prev, [name]: value }))

  // }
  // const handleRadioChange = (name, value) => {
  //   setFeedback(prev => ({ ...prev, [name]: value }));
  // };

  //  const renderRadioGroup = (label, name, value, id, group, dynamic) => (
  //     <div className="flex items-center space-x-4">
  //       <Label className="w-24">{label}</Label>
  //       <RadioGroup value={feedback[name] || (group ? false : 'no')} onValueChange={(v) => { dynamic ? handleRadio(name, v, id) : handleRadioChange(name, v) }} className="flex gap-4">
  //         <div className="flex items-center space-x-2"><RadioGroupItem value={group ? true : 'yes'} id={`${name}-yes`} /><Label htmlFor={`${name}-yes`}>Yes</Label></div>
  //         <div className="flex items-center space-x-2"><RadioGroupItem value={group ? false : 'no'} id={`${name}-no`} /><Label htmlFor={`${name}-no`}>No</Label></div>
  //       </RadioGroup>
  //     </div>  )
  const [viewingPatient, setViewingPatient] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [modalitiesForm, setModalitiesForm] = useState(initialFormState);

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
      throw error;
    }
  };
  console.log("Session invompleted", filteredSessions);
  return (
    <div className="md:space-y-6  space-y-10">
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
        {user?.role !== "Physio" && Permissions.isAdd && (
          <Button onClick={openNewSessionDialog}>
            <PlusCircle className="mr-2 h-4 w-4" /> Schedule Session
          </Button>
        )}
      </motion.div>
      <Card className="medical-card max-w-fit md:max-w-full  ">
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex md:flex-row  flex-col items-center gap-4  md:space-x-4  ">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by Patient Name, Physio Name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {/* <div className="w-48"> */}
            {/* <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Date">Date</SelectItem>
                  <Input type="Date" value={sessionForm.sessionDate} />
                </SelectContent>
              </Select> */}
            {user?.role !== "Physio" && (
              <div className="w-48">
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => {
                    setDateFilter(e.target.value);
                    getSession(e.target.value);
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
      {msg && user?.role === "Physio" && (
        <Card className="medical-card max-w-fit md:max-w-full  ">
          <CardContent>
            <div className="flex md:flex-row m-5 mb-0 flex-col items-center gap-4 text-center md:space-x-4  ">
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

                    <th className="text-left p-2">Feedback</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {/* {data.map((s) => (
                    <tr key={s._id} className="border-b hover:bg-gray-50">
                      <td className="p-2">{s.sessionCode}</td>
                      <td className="p-2">{s.patientId?.patientName}</td>
                    </tr>
                  ))} */}
                  {filteredSessions.map((session) => (
                    <tr key={session._id} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        {session.sessionCode ||
                          session.incompleteData.sessionCode}
                      </td>
                      <td className="p-2">
                        {session.patientId?.patientName ||
                          session.incompleteData.patientId?.patientName}
                      </td>
                      {/* <td className="p-2">{session.patientId.patientName}</td> */}
                      {/* <td className='p-2'>
                        {
                          patients.map((pat)=>{
                              <div key={pat._id}>{pat.patientName}</div> 
                          })
                        }
                          
                      </td> */}

                      {user?.role !== "Physio" && (
                        <td className="p-2">
                          {renderPhysioBadge(session.physioId._id)}
                          {/* {session.physioId?.physioName || "-"} */}
                        </td>
                      )}
                      {/* {user?.role !== 'physio' && <td className="p-2">{session.physioId.physioName}</td>} */}
                      <td className="p-2">
                        <div>
                          <p className="text-sm">
                            {session.sessionDate
                              .split("T")[0]
                              .split("-")
                              .reverse()
                              .join("-")}{" "}
                            (
                            {session.sessionDay ||
                              session.incompleteData.sessionDay}
                            )
                          </p>
                          <p className="text-xs text-gray-600">
                            {Converttime(session.sessionTime)}
                          </p>
                        </div>
                      </td>
                      <td className="p-2">
                        {session.machineId
                          ? session.machineId.machineName
                          : "-"}
                      </td>
                      <td className="p-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs status-${session.status}`}
                          style={{
                            backgroundColor: session.sessionStatusId
                              ? session.sessionStatusId.sessionStatusColor
                              : "white",
                            color: session.sessionStatusId
                              ? session.sessionStatusId.sessionStatusTextColor
                              : "black",
                          }}
                        >
                          {" "}
                          {session.sessionStatusId
                            ? session.sessionStatusId.sessionStatusName
                            : ""}
                        </span>
                      </td>
                      <td className="p-2">
                        {session.sessionCount}
                        {/* {sessionCountMap[
                          `${session?.patientId?._id}-${session?.physioId?._id}`
                        ]?.completed + 1} */}
                      </td>

                      <td className="p-2">
                        <div className="text-xs space-y-1">
                          {/* Session Feedback Pros */}
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

                          {/* Red Flags */}
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
                              !session.redFlags.length && (
                                <span className="text-gray-400">
                                  No feedback
                                </span>
                              )}
                        </div>
                      </td>
                      {/* <td className="p-2">{session.feedback ? <div className="text-xs">{session.feedback.sessionFeedbackPros && <p className="text-green-600">✓ {session.feedback.sessionFeedbackPros}</p>}{session.feedback.redFlags?.length > 0 && <p className="text-red-600">⚠ {session.feedback.redFlags.join(', ')}</p>}{session.feedback.media?.length > 0 && <p className="text-blue-600"><Paperclip size={12} className="inline-block mr-1" />{session.feedback.media.join(', ')}</p>}</div> : <span className="text-gray-400 text-xs">No feedback</span>}</td> */}
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
                          {session.sessionStatusId.sessionStatusName.toLowerCase() ===
                            "scheduled" && (
                            <Button
                              size="sm"
                              onClick={() =>
                                handleSessionAction(session._id, "Attended")
                              }
                            >
                              <Play size={12} />
                            </Button>
                          )}
                          {session.sessionStatusId.sessionStatusName.toLowerCase() ===
                            "attended" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleSessionAction(session._id, "Completed")
                              }
                            >
                              <Square size={12} />
                            </Button>
                          )}
                          {session.sessionStatusId?.sessionStatusName?.toLowerCase() ===
                            "attended" &&
                            user?.role !== "Physio" && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  handleSessionAction(session._id, "Scheduled")
                                }
                              >
                                <StopCircle size={12} />
                              </Button>
                            )}

                          {session.sessionStatusId.sessionStatusName.toLowerCase() ===
                            "completed" &&
                            !session.feedback && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  // Pre-fill feedback with existing session data
                                  setFeedback({
                                    sessionFeedbackPros:
                                      session.sessionFeedbackPros || "",
                                    modeOfExercise:
                                      session.modeOfExercise || "",
                                    redFlags: session.redFlags || [],
                                    homeExerciseAssigned:
                                      !!session.homeExerciseAssigned,
                                    // modalitiesList:
                                    //   session.modalitiesList.map((m) => {
                                    //     return {
                                    //       modalityId: m.modalityId?._id,
                                    //       isOccurred: m.isOccurred,
                                    //     };
                                    //   }) || [],
                                    modalitiesList: Array.isArray(
                                      session.modalitiesList,
                                    )
                                      ? session.modalitiesList
                                          .map((m) =>
                                            String(
                                              m.modalityId?._id ?? m.modalityId,
                                            ),
                                          )
                                          .filter(Boolean)
                                      : [],

                                    // machineId:
                                    // session.machineId?.machineName || "",
                                    targetArea: session.targetArea || "",
                                    media: session.media || [],
                                    modalities: !!session.modalities,
                                  });

                                  setModalitiesForm({
                                    modalitiestype:
                                      session.modalitiestype ||
                                      "Exercise Therapy", // default type
                                  });

                                  // Open the feedback dialog
                                  setFeedbackDialog({
                                    open: true,
                                    sessionId: session._id,
                                    physioId:
                                      session?.physioId?._id ??
                                      session?.physioId ??
                                      "",
                                  });
                                }}
                              >
                                <MessageSquare size={12} />
                              </Button>
                            )}
                          {(session.sessionStatusId.sessionStatusName.toLowerCase() ===
                            "scheduled" ||
                            session.sessionStatusId.sessionStatusName ===
                              "Attended") && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                handleSessionAction(session._id, "Canceled")
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
                                      This will Changed the Cancelled session to
                                      Scheduled.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
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
                            // <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditSession(session)}
                            >
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
                                  <AlertDialogTitle>
                                    Are you sure?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete the session.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      handleDeleteSession(session._id)
                                    }
                                  >
                                    Delete
                                  </AlertDialogAction>
                                  {/* <AlertDialogAction
                                    onClick={() =>
                                      handleDuplicateSession(
                                        session.patientId._id,
                                        session.physioId._id,
                                        session.sessionTime,
                                      )
                                    }
                                  >
                                    Delete
                                  </AlertDialogAction> */}
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                            // </>
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

        <PatientDetailsDialog
          isOpen={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          patient={viewingPatient}
        />
        {/* //card for mobile view */}
        {/* <Card className="medical-card  md:hidden"> */}
        {/* <CardHeader><CardTitle>Sessions ({filteredSessions.length})</CardTitle></CardHeader> */}
        {/* <CardContent> */}
        {/* Mobile view */}
        {/* <div className="md:hidden space-y-4">
              {filteredSessions.map((session) => (
                <Card key={session._id} className="p-4 shadow-lg rounded-2xl border"> */}

        {/* --- Top Section --- */}
        {/* <div className="mb-2">
                    <p className="text-base font-bold">{session.patientId.patientName}</p>

                    {user?.role !== 'physio' && (
                      <p className="text-sm text-gray-500">
                        Physio: <span className="font-medium">{session.physioId.physioName}</span>
                      </p>
                    )}
                  </div> */}

        {/* --- Date + Time Badge --- */}
        {/* <div className="bg-gray-100 rounded-md p-2 text-xs mb-2">
                    <p className="font-semibold">
                      {session.sessionDate.split('T')[0].split('-').reverse().join('-')} ({session.sessionDay})
                    </p>
                    <p className="text-gray-700">
                      {Converttime(session.sessionTime)}
                    </p>
                  </div> */}

        {/* --- Machine & Status --- */}
        {/* <div className="flex justify-between text-xs mb-2">
                    <p className="font-medium">
                      Machine: {session.machineId ? session.machineId.machineName : '-'}
                    </p>

                    <span
                      className="px-2 py-1 rounded-sm text-[10px]"
                      style={{
                        backgroundColor: session.sessionStatusId?.sessionStatusColor,
                        color: session.sessionStatusId?.sessionStatusTextColor,
                      }}
                    >
                      {session.sessionStatusId?.sessionStatusName}
                    </span>
                  </div> */}

        {/* --- Feedback --- */}
        {/* <div className="text-xs mb-3">
                    {session.feedback ? (
                      <>
                        {session.feedback.sessionFeedbackPros && (
                          <p className="text-green-600">✓ {session.feedback.sessionFeedbackPros}</p>
                        )}
                        {session.feedback.redFlags?.length > 0 && (
                          <p className="text-red-600">⚠ {session.feedback.redFlags.join(', ')}</p>
                        )}
                        {session.feedback.media?.length > 0 && (
                          <p className="text-blue-600">
                            <Paperclip size={12} className="inline-block mr-1" />
                            {session.feedback.media.join(', ')}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-gray-400">No feedback</p>
                    )}
                  </div> */}

        {/* --- Action Buttons --- */}
        {/* <div className="flex flex-wrap gap-2">
                    {session.sessionStatusId.sessionStatusName.toLowerCase() === 'scheduled' && (
                      <Button size="sm" onClick={() => handleSessionAction(session._id, 'Attended')}>
                        <Play size={12} />
                      </Button>
                    )}

                    {session.sessionStatusId.sessionStatusName.toLowerCase() === 'attended' && (
                      <Button size="sm" variant="outline" onClick={() => handleSessionAction(session._id, 'Completed')}>
                        <Square size={12} />
                      </Button>
                    )}

                    {session.sessionStatusId.sessionStatusName.toLowerCase() === 'completed' && !session.feedback && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setFeedbackDialog({ open: true, sessionId: session.sessionId })}
                      >
                        <MessageSquare size={12} />
                      </Button>
                    )}

                    {(session.sessionStatusId.sessionStatusName.toLowerCase() === 'scheduled' ||
                      session.sessionStatusId.sessionStatusName === 'Attended') && (
                        <Button size="sm" variant="destructive" onClick={() => handleSessionAction(session._id, 'Canceled')}>
                          <XCircle size={12} />
                        </Button>
                      )}

                    {user?.role !== 'physio' && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleEditSession(session)}>
                          <Edit size={12} />
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              <Trash2 size={12} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>This will permanently delete the session.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteSession(session._id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </div>
                </Card>
              ))}
            </div>

          </CardContent>
        </Card> */}

        {/* Mobile view card */}
        <Card className="medical-card md:hidden">
          <CardHeader>
            <CardTitle>Sessions ({filteredSessions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="md:hidden space-y-4">
              {filteredSessions.map((session) => (
                <Card
                  key={session._id}
                  className="p-4 shadow-lg rounded-2xl border"
                >
                  {/* Top Section */}
                  <div className="mb-2">
                    <p className="text-base font-bold">
                      {session.patientId?.patientName || "-"}
                    </p>

                    {user?.role !== "physio" && (
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
                    <span className="font-medium text-gray-800 ml-1">
                      {/* {getNthSession(session) || "-"}
                       */}
                      {session.sessionCount}
                      {/* {
                        sessionCountMap[
                          `${session?.patientId?._id}-${session?.physioId?._id}`
                        ]?.completed
                      } */}
                    </span>
                  </p>

                  {/* Date + Time */}
                  <div className="bg-gray-100 rounded-md p-2 text-xs mb-2">
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

                  {/* Machine & Status */}
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

                  {/* Feedback */}
                  <div className="text-xs space-y-1">
                    {/* Session Feedback Pros */}
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

                    {/* Red Flags */}
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
                        !session.redFlags.length && (
                          <span className="text-gray-400">No feedback</span>
                        )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewConsultation(session.patientId)}
                    >
                      <FileText size={14} />
                    </Button>
                    {session.sessionStatusId?.sessionStatusName?.toLowerCase() ===
                      "scheduled" && (
                      <Button
                        size="sm"
                        onClick={() =>
                          handleSessionAction(session._id, "Attended")
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
                          handleSessionAction(session._id, "Completed")
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
                            handleSessionAction(session._id, "Scheduled")
                          }
                        >
                          <StopCircle size={12} />
                        </Button>
                      )}

                    {session.sessionStatusId?.sessionStatusName?.toLowerCase() ===
                      "completed" &&
                      !session.feedback && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // Pre-fill feedback with existing session data
                            setFeedback({
                              sessionFeedbackPros:
                                session.sessionFeedbackPros || "",
                              modeOfExercise: session.modeOfExercise || "",
                              redFlags: session.redFlags || [],
                              homeExerciseAssigned:
                                !!session.homeExerciseAssigned,
                              modalities: !!session.modalities,
                              modalitiesList: session.modalitiesList || [],
                              machineId: session.machineId?.machineName || "",
                              targetArea: session.targetArea || "",
                              media: session.media || [],
                            });

                            setModalitiesForm({
                              modalitiestype:
                                session.modalitiestype || "Exercise Therapy", // default type
                            });

                            // Open the feedback dialog
                            setFeedbackDialog({
                              open: true,
                              sessionId: session._id,
                            });
                          }}
                        >
                          <MessageSquare size={12} />
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
                          handleSessionAction(session._id, "Canceled")
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
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will Changed the Cancelled session to
                                Scheduled.
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
                    {/* {user?.role !== "Physio" && ( */}
                    {/* <> */}
                    {/* <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditSession(session)}
                        >
                          <Edit size={12} />
                        </Button> */}
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
                    {/* </> */}
                    {/* )} */}
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
      <Dialog
        open={feedbackDialog.open}
        onOpenChange={(open) => setFeedbackDialog({ open, sessionId: null })}
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
                <Label htmlFor="sessionFeedbackPros ">Update Feedback </Label>
                <textarea
                  id="sessionFeedbackPros "
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
                  defaultValue="passive"
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
                    const isChecked = feedback.redFlags?.some(
                      (f) => f.redFlagId?._id === flag.RedflagIDPK,
                    );

                    return (
                      <div
                        key={flag.RedflagIDPK}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`rf-${flag.RedflagIDPK}`}
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            setFeedback((prev) => ({
                              ...prev,
                              redFlags: checked
                                ? [
                                    // remove duplicates first
                                    ...prev.redFlags.filter(
                                      (f) =>
                                        f.redFlagId?._id !== flag.RedflagIDPK,
                                    ),
                                    {
                                      redFlagId: {
                                        _id: flag.RedflagIDPK,
                                        redflagName: flag.redflagName,
                                      },
                                      isOccurred: true,
                                    },
                                  ]
                                : prev.redFlags.filter(
                                    (f) =>
                                      f.redFlagId?._id !== flag.RedflagIDPK,
                                  ),
                            }));
                          }}
                        />

                        <Label
                          htmlFor={`rf-${flag.RedflagIDPK}`}
                          className="text-sm font-normal"
                        >
                          {flag.redflagName}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* <div className="space-y-2"><Label>Red Flags</Label>
              <div className="p-3 border rounded-md grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {  
                redFlags.map((red)=>{
                      <div key={red.RedflagIDPK}>
                          {renderRadioGroup(red.redflagName, red.redflagName.toLowerCase(), feedback[red.redflagName.toLowerCase()], red.RedflagIDPK, true, true)}
                        </div>
                  })
                }
                </div>
                </div> */}

              <div className="space-y-2">
                <Label>Home Exercise Program Assigned</Label>
                <RadioGroup
                  value={feedback.homeExerciseAssigned}
                  onValueChange={(v) => {
                    console.log(v, "v in home exercise");
                    setFeedback({ ...feedback, homeExerciseAssigned: v });
                  }}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value={true} id="he-yes" />
                    <Label htmlFor="he-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value={false} id="he-no" />
                    <Label htmlFor="he-no">No</Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label>Modalities</Label>
                <RadioGroup
                  value={sessionForm.modalities ? "yes" : "no"}
                  onValueChange={(v) => {
                    setSessionForm((prev) => ({
                      ...prev,
                      modalities: v === "yes",
                      modalitiestype: v === "no" ? "" : prev.modalitiestype,
                      modalityList: v === "no" ? [] : prev.modalityList,
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

              {sessionForm.modalities === true && (
                <div className="space-y-2">
                  <Label htmlFor="modalitiestype">Modalities Type</Label>

                  <Select
                    value={sessionForm.modalitiestype}
                    onValueChange={(val) =>
                      setSessionForm((prev) => ({
                        ...prev,
                        modalitiestype: val,
                        modalityList: [],
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

                  {sessionForm.modalitiestype && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-2 pl-4"
                    >
                      <Label>List of Modalities</Label>

                      {Array.isArray(Modalities) &&
                        (() => {
                          const list = Modalities.filter(
                            (mod) =>
                              mod.modalitiestype ===
                                sessionForm.modalitiestype &&
                              physioModalityIds.includes(String(mod._id)),
                          );

                          if (list.length === 0) {
                            return (
                              <div className="p-3 border rounded-md text-sm text-red-500">
                                This Physio does not have any assigned
                                modalities.
                              </div>
                            );
                          }

                          return (
                            <div className="p-3 border rounded-md grid grid-cols-3 gap-2">
                              {list.map((mod) => {
                                const id = String(mod._id);
                                const isChecked = (
                                  sessionForm.modalityList || []
                                )
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
                                        setSessionForm((prev) => {
                                          const list = (
                                            prev.modalityList || []
                                          ).map(String);
                                          return {
                                            ...prev,
                                            modalityList: checked
                                              ? Array.from(
                                                  new Set([...list, id]),
                                                )
                                              : list.filter((m) => m !== id),
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

              {/* <div className="space-y-2">
                <Label>Machine Used</Label>
                <Select
                  onValueChange={(v) =>
                    setFeedback((p) => ({ ...p, machineId: v }))
                  }
                  value={feedback.machineId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a machine" />
                  </SelectTrigger>
                  <SelectContent>
                    {machines.map((m) => (
                      <SelectItem key={m._id} value={m._id}>
                        {m.machineName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div> */}

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
                    onClick={() => fileInputRef.current.click()}
                  >
                    <Upload size={16} className="mr-2" /> Attach Media
                  </Button>
                  <div className="mt-2 space-y-1">
                    {feedback.media.map((doc, index) => (
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
                    setFeedbackDialog({ open: false, sessionId: null })
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
              {/* Enter the kilometers travelled before cancellation, if any. */}
            </DialogDescription>
          </DialogHeader>
          {user?.role !== "Physio" && (
            <div className="space-y-4 pt-4">
              <Label htmlFor="cancelledKms">Cancelled Kms</Label>
              <Input
                id="cancelledKms"
                type="number"
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
                if (val !== "Other") {
                  setCancelledReason(val);
                } else {
                  setCancelledReason("");
                }
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

            {/* <Input
              id="cancelledReason"
              type="text"
              value={cancelledReason}
              onChange={(e) => setCancelledReason(e.target.value)}
              placeholder="Enter reason for cancelling this session..."
              required
            /> */}
            {/* <p className="text-xs text-gray-500">
              This amount will be deducted from the physio's daily total.
            </p> */}
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
              <Label>Patient</Label>
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
              <Label>Physiotherapist</Label>
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
            {/* <div className="space-y-2"><Label>Session Date</Label><Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !sessionForm.sessionDate && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {sessionForm.sessionDate ? sessionForm.sessionDate : <span>Pick a date</span>}
              </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={sessionForm.sessionDate} onSelect={(d) => setSessionForm(p => ({ ...p, sessionDate: d , }))} initialFocus /></PopoverContent></Popover></div> */}
            <div className="space-y-2">
              <Label>Session Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !sessionForm.sessionDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {sessionForm.sessionDate ? (
                      format(sessionForm.sessionDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={sessionForm.sessionDate}
                    onSelect={(d) =>
                      setSessionForm((p) => ({
                        ...p,
                        sessionDate: d,
                        sessionDay: getDayName(d),
                      }))
                    }
                    initialFocus
                    disabled={(date) =>
                      date < new Date(new Date().setHours(0, 0, 0, 0))
                    }
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
                  setSessionForm((p) => ({ ...p, sessionDay: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sessionTime">Session Time</Label>
              <Input
                id="sessionTime"
                type="time"
                value={sessionForm.sessionTime}
                onChange={(e) =>
                  setSessionForm((p) => ({ ...p, sessionTime: e.target.value }))
                }
              />
            </div>{" "}
            {/* <div className="space-y-2">
              <Label htmlFor="sessionTime">Session Count</Label>
              <Input
                id="sessionCount"
                type="text"
                value={sessionForm.sessionCount}
                onChange={(e) =>
                  setSessionForm((p) => ({
                    ...p,
                    sessionCount: e.target.value,
                  }))
                }
              />
            </div> */}
            {/* <div className="space-y-2">
              <Label htmlFor="sessionTime">Session Code</Label>
              <Input
                id="sessionCode"
                type="text"
                value={sessionForm.sessionCode}
                onChange={(e) =>
                  setSessionForm((p) => ({
                    ...p,
                    sessionCode: e.target.value,
                  }))
                }
              />
            </div> */}
            {/* <div className="space-y-2"><Label>Machine Used (Optional)</Label><Select onValueChange={(v) => setSessionForm(p => ({ ...p, machineId: v }))} value={sessionForm.machineId}><SelectTrigger><SelectValue placeholder="Select a machine" /></SelectTrigger><SelectContent>{machines.map(m => <SelectItem key={m._id} value={m._id}>{m.machineName}</SelectItem>)}</SelectContent></Select></div> */}
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
