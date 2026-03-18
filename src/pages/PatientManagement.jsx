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
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
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
  Search,
  FileText,
  Calendar as CalendarIcon,
  User,
  Edit,
  Trash2,
  Upload,
  Paperclip,
  ClipboardList,
  PlusCircle,
  UserPlus,
  History,
  UserCheck,
  CheckCircle,
  Circle,
  InboxIcon,
  User2,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import PatientDetailsDialog from "@/components/PatientDetailsDialog";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "@/components/CustomComponents/apiRequest";

const PatientManagement = () => {
  const [dateFilter, setDateFilter] = useState("");

  const navigate = useNavigate();
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [physios, setPhysios] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState("patient");
  const [downloadDialog, setDownloadDialog] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [openRecoveryChoice, setOpenRecoveryChoice] = useState(false);
  const [selectedPatientForRecovery, setSelectedPatientForRecovery] =
    useState(null);
  const [openRecoverDialog, setOpenRecoverDialog] = useState(false);
  const [pendingPatient, setPendingPatient] = useState(null);
  const [openDialog, setOpendialog] = useState(false);

  const handleMarkNotRecoveredClick = (patient) => {
    setSelectedPatientForRecovery(patient);
    setOpenRecoveryChoice(true);
  };
  // format date safely
  const fmtDate = (d) => {
    if (!d) return "-";
    const x = new Date(d);
    if (isNaN(x.getTime())) return "-";
    return x.toLocaleDateString("en-GB");
  };
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  // build PDF from patient list
  const downloadPatientsPdf = ({ title, rows, fileName }) => {
    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.text("NEO-PHYSIO - PATIENT REPORT", 14, 14);

    doc.setFontSize(11);
    doc.text(title, 14, 22);
    doc.text(`Downloaded on: ${fmtDate(new Date())}`, 14, 28);

    autoTable(doc, {
      startY: 35,
      head: [
        [
          "#",
          "Patient Code",
          "Patient Name",
          "Age",
          "Gender",
          "Mobile",
          "Consultation",
          "Physio",
          "Status",
        ],
      ],
      body: rows.length
        ? rows.map((p, idx) => [
            idx + 1,
            p.patientCode || "-",
            p.patientName || "-",
            p.patientAge || "-",
            p.patientGenderId?.genderName || p.genderName || "-",
            p.patientNumber || "-",
            fmtDate(p.consultationDate),
            p.physioId?.physioName || p.physioName || "-",
            p.isRecovered ? "Recovered" : "Active",
          ])
        : [["", "No data", "", "", "", "", "", "", ""]],
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 22 },
        2: { cellWidth: 35 },
        3: { cellWidth: 12 },
        4: { cellWidth: 18 },
        5: { cellWidth: 22 },
        6: { cellWidth: 22 },
        7: { cellWidth: 25 },
        8: { cellWidth: 16 },
      },
    });

    doc.save(fileName);
  };
  const getPastMonthsRange = (monthsCount) => {
    // monthsCount must be 1 or more
    const now = new Date();

    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999); // last day of last month

    const start = new Date(
      end.getFullYear(),
      end.getMonth() - (monthsCount - 1),
      1,
      0,
      0,
      0,
      0,
    );

    const toYMD = (d) => d.toISOString().slice(0, 10);

    return { startDate: toYMD(start), endDate: toYMD(end), start, end };
  };
  const getCurrentMonthRange = () => {
    const now = new Date();

    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    const toYMD = (d) => d.toISOString().slice(0, 10);

    return { startDate: toYMD(start), endDate: toYMD(end), start, end };
  };
  const downloadPatientsByRange = async (
    { startDate, endDate, start, end },
    filePrefix,
  ) => {
    const res = await apiRequest("Patient/downloadPatient", {
      method: "POST",
      body: JSON.stringify({
        startDate,
        endDate,
        view: "all", // "active" | "recovered"
      }),
    });

    const title = `Patients (${start.toLocaleDateString("en-GB")} to ${end.toLocaleDateString("en-GB")})`;

    downloadPatientsPdf({
      title,
      rows: Array.isArray(res) ? res : [],
      fileName: `${filePrefix}_${startDate}_to_${endDate}.pdf`,
    });
  };
  const downloadPatientsOfMonth = () => {
    const range = getCurrentMonthRange();
    return downloadPatientsByRange(range, "Patients_This_Month");
  };

  const downloadPatientsOfLastMonth = () => {
    const range = getPastMonthsRange(1);
    return downloadPatientsByRange(range, "Patients_Last_1_Month");
  };

  const downloadPatientsOfLast2Month = () => {
    const range = getPastMonthsRange(2);
    return downloadPatientsByRange(range, "Patients_Last_2_Months");
  };
  const downloadPatientsOfLast3Month = () => {
    const range = getPastMonthsRange(3);
    return downloadPatientsByRange(range, "Patients_Last_3_Months");
  };

  const downloadPatientsLastYear = async () => {
    const res = await apiRequest("Patient/downloadPatient", {
      method: "POST",
      body: JSON.stringify({
        rangeType: "lastYear",
        view: "all",
      }),
    });

    downloadPatientsPdf({
      title: `Last 1 Year Patients List`,
      rows: Array.isArray(res) ? res : [],
      fileName: `Patients_Last_1_Year.pdf`,
    });
  };
  const filteredByDate = useMemo(() => {
    if (!dateFilter) return patients;

    // dateFilter is "YYYY-MM-DD"
    const end = new Date(dateFilter);
    end.setHours(23, 59, 59, 999); // include full selected day

    return patients.filter((p) => {
      const created = p.createdAt || p.createdOn || p.createdDate;
      if (!created) return false;

      const createdDate = new Date(created);
      return createdDate <= end;
    });
  }, [patients, dateFilter]);
  const [isAssignPhysioOpen, setIsAssignPhysioOpen] = useState(false);
  const [assigningPatient, setAssigningPatient] = useState(null);
  const initialAssignState = {
    _id: "",
    physioName: "",
    Physiotherapist: "",
    physioId: "",
    sessionStartDate: "",
    sessionTime: "",
    totalSessionDays: "",
    InitialShorttermGoal: "",
    goalDuration: "",
    goalDescription: "",
    reviewFrequency: "",
    visitOrder: 1,
    KmsfromHub: "",
    KmsfLPatienttoHub: "",
    kmsFromPrevious: "",
  };
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
          layoutId="activetabpatient"
          className="absolute inset-0 rounded-md bg-blue-600 -z-10"
        />
      )}
    </button>
  );
  const [assignForm, setAssignForm] = useState(initialAssignState);
  // console.log(assignForm, "assignForm")
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [viewingPatient, setViewingPatient] = useState(null);

  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewingPatient, setReviewingPatient] = useState(null);
  const initialReviewState = { feedback: "", satisfaction: 0 };
  const [reviewForm, setReviewForm] = useState(initialReviewState);

  const [isNewGoalOpen, setIsNewGoalOpen] = useState(false);
  const initialNewGoalState = {
    newShortTermGoal: "",
    newGoalDuration: "",
    // nextReviewDate: null,
    newGoalDuration: "",
  };
  const [newGoalForm, setNewGoalForm] = useState(initialNewGoalState);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [sessionSummary, setSessionSummary] = useState(null);

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyPatient, setHistoryPatient] = useState(null);
  const [patientHistory, setPatientHistory] = useState([]);

  const initialFormState = {
    _id: "",
    patientCode: "",
    patientName: "",
    patientAge: "",
    patientGenderId: "",
    patientNumber: "",
    patientAddress: "",
    category: "",
    MedicalHistoryAndRiskFactor: "",
    documents: [],
    consultationDate: null,
    byStandar: "",
    Relation: "",
    patientAltNum: "",
    patientPinCode: "",
    patientCondition: "",
    Physiotherapist: "",
    reviewDate: null,
    historyOfSurgery: false,
    historyOfSurgeryDetails: "",
    historyOfFall: false,
    historyOfFallDetails: "",
    otherMedCon: "",
    currMed: "",
    typesOfLifeStyle: "",
    smokingOrAlcohol: false,
    dietaryHabits: "",
    Contraindications: "",
    goalDescription: "",
    painLevel: "",
    rangeOfMotion: "",
    muscleStrength: "",
    postureOrGaitAnalysis: "",
    functionalLimitations: "",
    static: "",
    dynamic: "",
    coordination: "",
    ADLAbility: "",
    shortTermGoals: "",
    longTermGoals: "",
    RecomTherapy: "",
    Frequency: "",
    Duration: "",
    modalities: false,
    modalitiestype: "",
    modalityList: [],
    targetedArea: "",
    noOfDays: "",
    hodNotes: "",
    goalLog: [],
    travelDetails: null,
    genderName: "",
    FeesTypeId: "",
    feeAmount: "",
    feesTypeAmount: "",
    ReferenceId: "",
    sourceName: "",
  };
  const [patientForm, setPatientForm] = useState(initialFormState);
  console.log(patientForm, "patientForm");
  console.log(patientForm.FeesTypeId, "FeesTypeId");
  console.log(patientForm.ReferenceId, "ReferenceId");
  const assignedPhysioId = patientForm.physioId;

  const modalitiesOptions = [
    "TENS",
    "IFT",
    "USD",
    "WAX",
    "ICE",
    "HOT",
    "Weights",
    "Band",
  ];
  const [risk, setRisk] = useState([]); //for dropdown

  const [gender, setGender] = useState([]);
  const [radio, setRadio] = useState([]);
  const [feesType, setFeesType] = useState([]);
  const [reference, setReference] = useState([]);
  // console.log(radio,"radio")
  const { getPermissionsByPath } = useAuth();
  const [Permissions, setPermissions] = useState({
    isAdd: false,
    isView: false,
    isEdit: false,
    isDelete: false,
  });

  //api call  and get all risk Factor

  useEffect(() => {
    getAllRisk();
    getAllpshyio();
    getAllGender();
    getModalities();
    getFeesType();
    getReference();
    getAllMachine();
  }, []);
  const [machines, setMachines] = useState([]);
  // console.log(Permissions,"Permissions")
  useEffect(() => {
    getPermissionsByPath(window.location.pathname).then((res) => {
      if (res) {
        console.log(res, "res");
        setPermissions(res);
      } else {
        navigate("/dashboard");
      }
    });
  }, []);

  useEffect(() => {
    if (Permissions.isView) {
      getAllPatient();
    }
  }, [Permissions, activeTab, dateFilter]);

  //api for Reference

  const getReference = async () => {
    try {
      const res = await apiRequest("References/getALLReferences", {
        method: "POST",
        body: JSON.stringify({}),
      });
      setReference(res);
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  };

  //api for FeesType

  const getFeesType = async () => {
    try {
      const res = await apiRequest("FeesType/getAllFeesType", {
        method: "POST",
        body: JSON.stringify({}),
      });
      setFeesType(res);
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  };

  //api for getall pshyio
  const getAllpshyio = async () => {
    try {
      const res = await apiRequest("Physio/getAllPhysio", {
        method: "POST",
        body: JSON.stringify({}),
      });
      setPhysios(res.physios);
      // setAssignForm(res.physio)
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  };

  const getAllRisk = async () => {
    try {
      const res = await apiRequest("RiskFactor/getAllRiskFactor", {
        method: "POST",
        body: JSON.stringify({}),
      });
      setRisk(res);
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  };

  //Gender api for drop down
  const getAllGender = async () => {
    try {
      const res = await apiRequest("Gender/getAllGender", {
        method: "POST",
        body: JSON.stringify({}),
      });
      setGender(res);
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  };

  const getAllPatient = async () => {
    try {
      const body = {
        view: activeTab === "recover" ? "recovered" : "active",
      };

      if (dateFilter) {
        body.targetDate = dateFilter;
      }

      const res = await apiRequest("Patient/getAllPatient", {
        method: "POST",
        body: JSON.stringify(body),
      });

      const list = Array.isArray(res) ? res : [];

      setPatients(list);
      setFilteredPatients(list);
    } catch (error) {
      console.error("Error:", error);
    }
  };
  const formatDate = (date) => {
    if (!date) return "-";
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return "-";

    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  };

  const getSessionDateRange = (sessions = []) => {
    if (!Array.isArray(sessions) || sessions.length === 0) {
      return {
        sessionStartDate: "-",
        sessionEndDate: "-",
        lastSessionDate: "-",
      };
    }

    const validDates = sessions
      .map((s) => s?.sessionDate)
      .filter(Boolean)
      .map((date) => new Date(date))
      .filter((d) => !Number.isNaN(d.getTime()))
      .sort((a, b) => a - b);

    if (!validDates.length) {
      return {
        sessionStartDate: "-",
        sessionEndDate: "-",
        lastSessionDate: "-",
      };
    }

    return {
      sessionStartDate: formatDate(validDates[0]),
      sessionEndDate: formatDate(validDates[validDates.length - 1]),
      lastSessionDate: formatDate(validDates[validDates.length - 1]),
    };
  };
  const downloadPatientsPDFs = async () => {
    try {
      const body = {
        month: selectedMonth,
        year: selectedYear,
        view: "all",
      };

      const res = await apiRequest("Patient/downloadPatientsMonthlyReport", {
        method: "POST",
        body: JSON.stringify(body),
      });

      const report = Array.isArray(res?.report) ? res.report : [];

      if (!report.length) {
        toast({
          title: "No Data",
          description: "No patient report found for the selected month.",
          variant: "destructive",
        });
        return;
      }

      const doc = new jsPDF("landscape");

      doc.setFontSize(16);
      doc.text("NEO-PHYSIO - MONTHLY PATIENT REPORT", 14, 15);

      doc.setFontSize(11);
      doc.text(
        `Month: ${monthNames[selectedMonth - 1]} ${selectedYear}`,
        14,
        23,
      );
      doc.text(`Downloaded on: ${fmtDate(new Date())}`, 14, 30);

      const columns = [
        "S.No",
        "Patient Code",
        "Patient Name",
        "Age",
        "Gender",
        "Contact",
        "Condition",
        "Physio",
        "Start Date",
        "End Date",
        "Total Sessions",
        "Completed",
        "Cancelled",
        "Status",
      ];

      const rows = report.map((p, index) => {
        const { sessionStartDate, sessionEndDate, lastSessionDate } =
          getSessionDateRange(p.sessions);

        return [
          index + 1,
          p.patientCode || "-",
          p.patientName || "-",
          p.age || "-",
          p.gender || "-",
          p.number || "-",
          p.condition || "-",
          p.assignedPhysio || "-",
          sessionStartDate,
          sessionEndDate,
          p.totalSessions ?? 0,
          p.completedSessions ?? 0,
          p.cancelledSessions ?? 0,
          p.recovered || (p.isRecovered ? "Recovered" : "Active"),
        ];
      });
      autoTable(doc, {
        startY: 36,
        head: [columns],
        body: rows,
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [41, 128, 185],
        },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 20 },
          2: { cellWidth: 28 },
          3: { cellWidth: 10 },
          4: { cellWidth: 14 },
          5: { cellWidth: 22 },
          6: { cellWidth: 28 },
          7: { cellWidth: 24 },
          8: { cellWidth: 18 },
          9: { cellWidth: 18 },
          10: { cellWidth: 16 },
          11: { cellWidth: 16 },
          12: { cellWidth: 16 },
          13: { cellWidth: 16 },
        },
      });

      doc.save(
        `Patients_Report_${monthNames[selectedMonth - 1]}_${selectedYear}.pdf`,
      );
    } catch (error) {
      console.error("PDF download error:", error);
      toast({
        title: "Error",
        description: "Failed to download monthly patient PDF.",
        variant: "destructive",
      });
    }
  };

  const downloadPatientsExcel = async () => {
    try {
      const body = {
        month: selectedMonth,
        year: selectedYear,
        view: "all",
      };

      const res = await apiRequest("Patient/downloadPatientsMonthlyReport", {
        method: "POST",
        body: JSON.stringify(body),
      });

      const report = Array.isArray(res?.report) ? res.report : [];

      if (!report.length) {
        toast({
          title: "No Data",
          description: "No patient report found for the selected month.",
          variant: "destructive",
        });
        return;
      }

      const excelData = report.map((p, index) => {
        const { sessionStartDate, sessionEndDate, lastSessionDate } =
          getSessionDateRange(p.sessions);

        return {
          "S.No": index + 1,
          "Patient Code": p.patientCode || "-",
          "Patient Name": p.patientName || "-",
          Age: p.age || "-",
          Gender: p.gender || "-",
          Contact: p.number || "-",
          Address: p.address || "-",
          Condition: p.condition || "-",
          Physio: p.assignedPhysio || "-",
          "Consultation Date": formatDate(p.consultationDate),
          "Review Date": formatDate(p.reviewDate),
          "Session Start Date": sessionStartDate,
          "Session End Date": sessionEndDate,
          "Total Sessions": p.totalSessions ?? 0,
          Completed: p.completedSessions ?? 0,
          Cancelled: p.cancelledSessions ?? 0,
          Status: p.recovered || (p.isRecovered ? "Recovered" : "Active"),
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(excelData);

      worksheet["!cols"] = [
        { wch: 8 }, // S.No
        { wch: 15 }, // Patient Code
        { wch: 22 }, // Patient Name
        { wch: 8 }, // Age
        { wch: 10 }, // Gender
        { wch: 15 }, // Contact
        { wch: 22 }, // Address
        { wch: 28 }, // Condition
        { wch: 20 }, // Physio
        { wch: 16 }, // Consultation Date
        { wch: 16 }, // Review Date
        { wch: 16 }, // Session Start Date
        { wch: 16 }, // Session End Date
        { wch: 14 }, // Total Sessions
        { wch: 12 }, // Completed
        { wch: 12 }, // Cancelled
        { wch: 12 }, // Status
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Patients Report");

      XLSX.writeFile(
        workbook,
        `Patients_Report_${monthNames[selectedMonth - 1]}_${selectedYear}.xlsx`,
      );
    } catch (error) {
      console.error("Excel download error:", error);
      toast({
        title: "Error",
        description: "Failed to download monthly patient Excel.",
        variant: "destructive",
      });
    }
  };
  //api call and delete Patients
  const deletePatient = async (id) => {
    try {
      const response = await apiRequest("Patient/deletePatient", {
        method: "POST",
        body: JSON.stringify({ _id: id }),
      });
      toast({
        title: "Deleted",
        description: "Patients has been removed.",
        variant: "destructive",
      });
      getAllPatient();

      // setFilteredPatients(response);
      // setPhysios(response);
      // setSessions(response);

      return response;
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  };

  //api for update Patients
  const [selectedPatient, setSelectedPatient] = useState(null);

  const updatePatient = async (data) => {
    try {
      const response = await apiRequest("Patient/updatePatient", {
        method: "POST",
        body: JSON.stringify(data),
      });
      toast({ title: "Success", description: "Patient updated successfully." });
      getAllPatient();
      setIsFormOpen(false);
      // setFilteredPatients(response);
      // setPhysios(response);
      // setSessions(response);
      return response;
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  };

  //api for create patients

  const createPatient = async (data) => {
    console.log(data, "data");
    try {
      const response = await apiRequest("Patient/createPatient", {
        method: "POST",
        body: JSON.stringify(data),
      });
      // if (
      //   response?.success === false &&
      //   response?.message === "EXISTING_NUMBER"
      // ) {
      //   toast({
      //     title: "Alert",
      //     description: "This phone number is already registered.",
      //     variant: "destructive",
      //   });
      // }
      toast({ title: "Success", description: "Patient Create successfully." });
      getAllPatient();
      console.log("RESPONSE:", response);

      return response;

      setIsFormOpen(false);
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  };

  // useEffect(() => {
  //   AssignPhysio()
  // }, [])
  //api for Assign physio

  const AssignPhysio = async (data) => {
    try {
      const response = await apiRequest("Patient/AssignPhysio", {
        method: "POST",
        body: JSON.stringify(data),
      });
      toast({ title: "Success", description: "Assign updated successfully." });
      getAllPatient();
      setIsAssignPhysioOpen(false);

      return response;
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  };

  // useEffect(() => {
  //   Promise.all([
  //     fetch('/mockdata/patients.json').then(res => res.json()),
  //     fetch('/mockdata/physios.json').then(res => res.json()),
  //     fetch('/mockdata/sessions.json').then(res => res.json())
  //   ]).then(([patientsData, physiosData, sessionsData]) => {
  //     setPatients(patientsData);
  //     setFilteredPatients(patientsData);
  //     setPhysios(physiosData);
  //     setSessions(sessionsData);
  //   }).catch(err => console.error('Error loading data:', err));
  // }, []);

  // useEffect(() => {
  //   if (searchTerm) {
  //     const filtered = patients.filter(
  //       (patient) =>
  //         patient.patientName
  //           .toLowerCase()
  //           .includes(searchTerm.toLowerCase()) ||
  //         // patient.patientNumber.includes(searchTerm) ||
  //         patient.patientCode?.toLowerCase().includes(searchTerm.toLowerCase()),
  //     );
  //     setFilteredPatients(filtered);
  //   } else {
  //     setFilteredPatients(patients);
  //   }
  // }, [patients, searchTerm]);
  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = patients.filter(
        (patient) =>
          patient.patientName
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          patient.patientCode?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setFilteredPatients(filtered);
    } else {
      setFilteredPatients(patients);
    }
  }, [patients, searchTerm]);

  // useEffect(() => {
  //   if (dateFilter) {
  //     getAllPatient(dateFilter);
  //   }
  // }, [dateFilter]);

  useEffect(() => {
    if (isFormOpen && !editingPatient) {
      setPatientForm((prev) => ({
        ...prev,
        patientCode: generatePatientId(),
      }));
    }
  }, [isFormOpen, editingPatient]);

  // const generatePatientId = () => {
  //   const lastId =
  //     patients.length > 0
  //       ? Math.max(
  //           ...patients.map((p) => parseInt(p.patientCode.replace("PAT", "")))
  //         )
  //       : 0;
  //   const newId = lastId + 1;
  //   return `PAT${String(newId).padStart(6, "0")}`;
  // };

  const generatePatientId = () => {
    const lastId =
      patients.length > 0
        ? Math.max(
            ...patients
              .filter((p) => p.patientCode?.startsWith("HNP"))
              .map((p) => parseInt(p.patientCode.replace("HNP", ""), 10)),
          )
        : 0;

    const newId = lastId + 1;
    return `HNP${String(newId).padStart(4, "0")}`;
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setPatientForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setPatientForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRadioChange = (name, value) => {
    console.log(name, "Name", value, "Value");
    setPatientForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRadio = (name, value, id) => {
    // setRadio(prev => ({ ...prev, [name]: value }));
    setRadio((prev) => [...prev, { RiskFactorID: id, isExist: value }]);
    setPatientForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name, date) => {
    setPatientForm((prev) => ({ ...prev, [name]: date }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPatientForm((prev) => ({
        ...prev,
        documents: [...prev.documents, file.name],
      }));
      toast({
        title: "File Added",
        description: `${file.name} has been staged for upload.`,
      });
    }
  };
  const [recoveredType, setRecoveredType] = useState("");
  const [otherReason, setOtherReason] = useState("");

  // const handleFormSubmit = (e) => {
  //   e.preventDefault();
  //   if (response?.message === "EXISTING_NUMBER") {
  //     toast({
  //       title: "Alert",
  //       description: "This phone number is already registered.",
  //       variant: "destructive",
  //     });
  //     return false;
  //   }
  //   if (!patientForm.patientName) {
  //     toast({
  //       title: "Alert",
  //       description: "Please Enter Patient Name",
  //       variant: "destructive",
  //     });
  //     return false;
  //   }
  //   if (!patientForm.patientAge) {
  //     toast({
  //       title: "Alert",
  //       description: "Please Enter Patient Age",
  //       variant: "destructive",
  //     });
  //     return false;
  //   }

  //   if (!patientForm.patientGenderId) {
  //     toast({
  //       title: "Alert",
  //       description: "Please select Gender",
  //       variant: "destructive",
  //     });
  //     return false;
  //   }
  //   if (!patientForm.patientNumber) {
  //     toast({
  //       title: "Alert",
  //       description: "Please Enter Patient Mobile number",
  //       variant: "destructive",
  //     });
  //     return false;
  //   }
  //   if (!patientForm.patientAddress) {
  //     toast({
  //       title: "Alert",
  //       description: "Please Enter Patient Address",
  //       variant: "destructive",
  //     });
  //     return false;
  //   }
  //   if (!patientForm.FeesTypeId) {
  //     toast({
  //       title: "Alert",
  //       description: "Please select Fee Type",
  //       variant: "destructive",
  //     });
  //     return false;
  //   }

  //   if (!patientForm.feeAmount) {
  //     toast({
  //       title: "Alert",
  //       description: "Please Enter Fee Amount",
  //       variant: "destructive",
  //     });
  //     return false;
  //   }

  //   if (!patientForm.patientCondition) {
  //     toast({
  //       title: "Alert",
  //       description: "Please select Patient Condition",
  //       variant: "destructive",
  //     });
  //     return false;
  //   }

  //   if (editingPatient) {
  //     if (!patientForm.patientName) {
  //       toast({
  //         title: "Alert",
  //         description: "Please Enter Patient Name",
  //         variant: "destructive",
  //       });
  //       return false;
  //     }
  //     if (!patientForm.patientName) {
  //       toast({
  //         title: "Alert",
  //         description: "Please Enter Patient Name",
  //         variant: "destructive",
  //       });
  //       return false;
  //     }
  //     if (!patientForm.byStandar) {
  //       toast({
  //         title: "Alert",
  //         description: "Please Enter Bystander Name",
  //         variant: "destructive",
  //       });
  //       return false;
  //     }
  //     if (!patientForm.patientNumber) {
  //       toast({
  //         title: "Alert",
  //         description: "Please Enter Patient Number",
  //         variant: "destructive",
  //       });
  //       return false;
  //     }
  //     if (!patientForm.patientAddress) {
  //       toast({
  //         title: "Alert",
  //         description: "Please Enter Patient Address",
  //         variant: "destructive",
  //       });
  //       return false;
  //     }
  //     if (!patientForm.patientPinCode) {
  //       toast({
  //         title: "Alert",
  //         description: "Please Enter Patient Pin Code",
  //         variant: "destructive",
  //       });
  //       return false;
  //     }
  //     if (!patientForm.FeesTypeId) {
  //       toast({
  //         title: "Alert",
  //         description: "Please Select fees type",
  //         variant: "destructive",
  //       });
  //       return false;
  //     }
  //     if (!patientForm.feeAmount) {
  //       toast({
  //         title: "Alert",
  //         description: "Please Enter Fee Amount",
  //         variant: "destructive",
  //       });
  //       return false;
  //     }
  //     if (!patientForm.reviewDate) {
  //       toast({
  //         title: "Alert",
  //         description: "Please Select the Review Date",
  //         variant: "destructive",
  //       });
  //       return false;
  //     }

  //     // setPatients(prev => prev.map(p => p.id === editingPatient.id ? { ...p, ...patientForm } : p));
  //     updatePatient({ ...patientForm, MedicalHistoryAndRiskFactor: radio });
  //     toast({ title: "Success", description: "Patient details updated." });
  //   } else {
  //     // const newPatient = { id: Date.now(), ...patientForm, patientId: generatePatientId(), registeredAt: new Date().toISOString().split('T')[0] };
  //     // setPatients(prev => [newPatient, ...prev]);
  //     createPatient({ ...patientForm, MedicalHistoryAndRiskFactor: radio });
  //     toast({ title: "Success", description: "New patient created." });
  //   }

  //   setIsFormOpen(false);
  //   setEditingPatient(null);
  //   setPatientForm(initialFormState);
  // };
  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!patientForm.patientName) {
      toast({
        title: "Alert",
        description: "Please Enter Patient Name",
        variant: "destructive",
      });
      return;
    }

    if (!patientForm.patientNumber) {
      toast({
        title: "Alert",
        description: "Please Enter Patient Mobile number",
        variant: "destructive",
      });
      return;
    }

    try {
      // ---- CREATE PATIENT ----
      if (!editingPatient) {
        const response = await createPatient({
          ...patientForm,
          MedicalHistoryAndRiskFactor: radio,
        });

        // DUPLICATE NUMBER
        if (response?.success === false) {
          toast({
            title: "Alert",
            description: "This phone number is already registered.",
            variant: "destructive",
          });
          return; //modal stays open
        }

        toast({
          title: "Success",
          description: "New patient created.",
        });
      }

      // ---- UPDATE PATIENT ----
      if (editingPatient) {
        await updatePatient({
          ...patientForm,
          MedicalHistoryAndRiskFactor: radio,
        });
      }
      if (patientForm.modalities === "yes") {
        if (!patientForm.modalityList?.length) {
          toast({
            title: "Alert",
            description: "Select at least one modality",
            variant: "destructive",
          });
          return;
        }
        if (!patientForm.targetedArea?.trim()) {
          toast({
            title: "Alert",
            description: "Enter the targeted area",
            variant: "destructive",
          });
          return;
        }
      }
      // CLOSE MODAL ONLY ON SUCCESS
      setIsFormOpen(false);
      setEditingPatient(null);
      setPatientForm(initialFormState);
    } catch (error) {
      console.error(error);

      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
    toast({
      title: "Success",
      description: "Patient details updated.",
    });
  };

  const handleEditPatient = (patient) => {
    setEditingPatient(true);
    const formData = {
      _id: patient._id ? patient._id : null,
      patientCode: patient.patientCode ? patient.patientCode : null,
      patientName: patient.patientName ? patient.patientName : null,
      patientAge: patient.patientAge ? patient.patientAge : null,
      patientGenderId: patient.patientGenderId._id
        ? patient.patientGenderId._id
        : null,
      patientNumber: patient.patientNumber ? patient.patientNumber : null,
      patientAddress: patient.patientAddress ? patient.patientAddress : null,
      // category: patient.category ? patient.category : null,
      MedicalHistoryAndRiskFactor: patient.MedicalHistoryAndRiskFactor
        ? patient.MedicalHistoryAndRiskFactor
        : null,
      documents: patient.documents ? patient.documents : [],
      consultationDate: patient.consultationDate
        ? new Date(patient.consultationDate)
        : "",
      byStandar: patient.byStandar ? patient.byStandar : null,
      Relation: patient.Relation ? patient.Relation : null,
      patientAltNum: patient.patientAltNum ? patient.patientAltNum : null,
      patientPinCode: patient.patientPinCode ? patient.patientPinCode : null,
      patientCondition: patient.patientCondition
        ? patient.patientCondition
        : null,
      Physiotherapist: patient.Physiotherapist ? patient.Physiotherapist : null,
      physioId: patient?.physioId?._id ?? patient?.physioId ?? "",
      reviewDate: patient.reviewDate ? new Date(patient.reviewDate) : "",
      historyOfSurgery: patient.historyOfSurgery
        ? patient.historyOfSurgery
        : null,
      historyOfSurgeryDetails: patient.historyOfSurgeryDetails
        ? patient.historyOfSurgeryDetails
        : null,
      historyOfFall: patient.historyOfFall ? patient.historyOfFall : null,
      historyOfFallDetails: patient.historyOfFallDetails
        ? patient.historyOfFallDetails
        : null,
      otherMedCon: patient.otherMedCon ? patient.otherMedCon : null,
      currMed: patient.currMed ? patient.currMed : null,
      typesOfLifeStyle: patient.typesOfLifeStyle
        ? patient.typesOfLifeStyle
        : null,
      smokingOrAlcohol: patient.smokingOrAlcohol
        ? patient.smokingOrAlcohol
        : false,
      dietaryHabits: patient.dietaryHabits ? patient.dietaryHabits : null,
      Contraindications: patient.Contraindications
        ? patient.Contraindications
        : null,
      goalDescription: patient.goalDescription ? patient.goalDescription : null,
      painLevel: patient.painLevel ? patient.painLevel : null,
      rangeOfMotion: patient.rangeOfMotion ? patient.rangeOfMotion : null,
      muscleStrength: patient.muscleStrength ? patient.muscleStrength : null,
      postureOrGaitAnalysis: patient.postureOrGaitAnalysis
        ? patient.postureOrGaitAnalysis
        : null,
      functionalLimitations: patient.functionalLimitations
        ? patient.functionalLimitations
        : null,
      static: patient.static ? patient.static : null,
      dynamic: patient.dynamic ? patient.dynamic : null,
      coordination: patient.coordination ? patient.coordination : null,
      ADLAbility: patient.ADLAbility ? patient.ADLAbility : null,
      shortTermGoals: patient.shortTermGoals ? patient.shortTermGoals : null,
      longTermGoals: patient.longTermGoals ? patient.longTermGoals : null,
      RecomTherapy: patient.RecomTherapy ? patient.RecomTherapy : null,
      Frequency: patient.Frequency ? patient.Frequency : null,
      Duration: patient.Duration ? patient.Duration : null,
      modalities: patient.modalities ? patient.modalities : false,
      modalitiestype: patient.modalitiestype ? patient.modalitiestype : null,
      modalityList: patient.modalityList ? patient.modalityList : [],
      targetedArea: patient.targetedArea ? patient.targetedArea : null,
      noOfDays: patient.noOfDays ? patient.noOfDays : null,
      hodNotes: patient.hodNotes ? patient.hodNotes : null,
      goalLog: patient.goalLog ? patient.goalLog : [],
      travelDetails: patient.travelDetails ? patient.travelDetails : null,
      genderName: patient.patientGenderId
        ? patient.patientGenderId.genderName
        : null,
      FeesTypeId: patient.FeesTypeId ? patient.FeesTypeId._id : null,
      feesTypeName: patient.FeesTypeId ? patient.FeesTypeId.feesTypeName : null,
      feeAmount: patient.feeAmount ? patient.feeAmount : null,
      ReferenceId: patient.ReferenceId ? patient.ReferenceId._id : null,
      sourceName: patient.ReferenceId ? patient.ReferenceId.sourceName : null,
    };
    console.log(formData, "formData");
    if (patient.consultationDate)
      formData.consultationDate = new Date(patient.consultationDate);
    if (patient.reviewDate) formData.reviewDate = new Date(patient.reviewDate);
    let radio = [];
    const RiskFactor = patient.MedicalHistoryAndRiskFactor.map((val) => {
      if (val.isExist) {
        radio.push({
          RiskFactorID: val.RiskFactorID._id,
          isExist: val.isExist,
        });
      }
      return { [val.RiskFactorID.RiskFactorName]: val.isExist.toString() };
    });
    setRadio(radio);
    if (RiskFactor.length > 0) {
      RiskFactor.map(
        (val) =>
          (formData[Object.keys(val)[0].toLowerCase()] =
            val[Object.keys(val)[0]] == "true"),
      );
    }
    setPatientForm(formData);
    setIsFormOpen(true);
    setSelectedPatient(patient);
  };

  const handleNewPatient = () => {
    setEditingPatient(null);
    setPatientForm({ ...initialFormState, patientCode: generatePatientId() });
    setIsFormOpen(true);
  };

  const handleDeletePatient = (id) => {
    setPatients((prev) => prev.filter((p) => p.id !== id));
    deletePatient(id);

    toast({
      title: "Deleted",
      description: "Patient has been removed.",
      variant: "destructive",
    });
  };

  const handleViewConsultation = (patient) => {
    setViewingPatient(patient);
    setIsDetailsOpen(true);
  };

  const handleUpdateFeedback = async () => {
    if (!reviewingPatient) return;

    try {
      await apiRequest("Patient/updatePatientFeedbacks", {
        method: "POST",
        body: JSON.stringify({
          patientId: reviewingPatient._id,
          Feedback: reviewForm.feedback,
          Satisfaction: reviewForm.satisfaction,
        }),
      });

      // update local state ONLY for UI
      setPatients((prev) =>
        prev.map((p) =>
          p._id === reviewingPatient._id
            ? {
                ...p,
                Feedback: reviewForm.feedback,
                Satisfaction: reviewForm.satisfaction,
              }
            : p,
        ),
      );

      toast({
        title: "Feedback Updated",
        description: `Feedback for ${reviewingPatient.patientName} saved.`,
      });
      setIsReviewOpen(false);
      // setReviewForm(initialReviewState);
    } catch (err) {
      console.error("Failed to save feedback", err);
      toast({
        title: "Error",
        description: "Failed to save feedback",
        variant: "destructive",
      });
    }
  };
  console.log(reviewingPatient, "reviewingPatient");
  useEffect(() => {
    if (!isReviewOpen || !reviewingPatient) return;

    setReviewForm({
      feedback: reviewingPatient?.Feedback || "",
      satisfaction: reviewingPatient?.Satisfaction || null,
    });
  }, [isReviewOpen, reviewingPatient]);

  const handleLogAndOpenNewGoal = async (e) => {
    e.preventDefault();
    // setPatients((prev) =>
    //   prev.map((p) => {
    //     if (p._id === reviewingPatient._id) {
    //       const newGoalLog = [...(p.goalLog || [])];
    //       if (p.shortTermGoals) {
    //         newGoalLog.push({
    //           goal: p.shortTermGoals,
    //           date: new Date().toISOString().split("T")[0],
    //           status: "Reviewed & Completed",
    //           feedback: reviewingPatient.Feedback,
    //           satisfaction: reviewingPatient.Satisfaction,
    //         });
    //       }
    //       return { ...p, goalLog: newGoalLog };
    //     }
    //     return p;
    //   }),
    // );
    toast({
      title: "Goal Logged",
      description: "Current goal has been logged. Now set the next goal.",
    });
    setIsReviewOpen(false);
    setIsNewGoalOpen(true);
    try {
      await apiRequest("Patient/updatePatientFeedbacks", {
        method: "POST",
        body: JSON.stringify({
          patientId: reviewingPatient._id,
          Feedback: reviewForm.feedback,
          Satisfaction: reviewForm.satisfaction,
        }),
      });

      // update local state ONLY for UI
      setPatients((prev) =>
        prev.map((p) =>
          p._id === reviewingPatient._id
            ? {
                ...p,
                Feedback: reviewForm.feedback,
                Satisfaction: reviewForm.satisfaction,
              }
            : p,
        ),
      );

      toast({
        title: "Feedback Updated",
        description: `Feedback for ${reviewingPatient.patientName} saved.`,
      });

      setIsReviewOpen(false);
      setReviewForm(initialReviewState);
    } catch (err) {
      console.error("Failed to save feedback", err);
      toast({
        title: "Error",
        description: "Failed to save feedback",
        variant: "destructive",
      });
    }
    toast({
      title: "Feedback Updated",
      description: `Feedback for ${reviewingPatient.patientName} has been saved.`,
    });
    // } catch (errr) {
    //   console.error("Failed to save feedback", err);
    //   toast({
    //     title: "Error",
    //     description: "Failed to save feedback",
    //     variant: "destructive",
    //   });
    //   // }
    //   // toast({
    //   //   title: "Goal Logged",
    //   //   description: "Current goal has been logged. Now set the next goal.",
    //   // });
    //   setIsReviewOpen(false);
    //   setIsNewGoalOpen(true);
  };
  // };
  const handleRecoveryOption = async (type) => {
    if (!selectedPatientForRecovery?._id) return;

    try {
      if (type === "fresh") {
        await apiRequest("Patient/startFreshCycle", {
          method: "POST",
          body: JSON.stringify({
            patientId: selectedPatientForRecovery._id,
            physioId:
              selectedPatientForRecovery?.physioId?._id ||
              selectedPatientForRecovery?.physioId,
          }),
        });

        toast({
          title: "Fresh Cycle Started",
          description: `${selectedPatientForRecovery.patientName} started with a new cycle.`,
        });
      }

      if (type === "continue") {
        await apiRequest("Patient/continueOldCycle", {
          method: "POST",
          body: JSON.stringify({
            patientId: selectedPatientForRecovery._id,
          }),
        });

        toast({
          title: "Old Cycle Continued",
          description: `${selectedPatientForRecovery.patientName} continued the old cycle.`,
        });
      }

      setOpenRecoveryChoice(false);
      setSelectedPatientForRecovery(null);
      getAllPatient();
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to update recovery option.",
        variant: "destructive",
      });
    }
  };
  const handleNewGoalSubmit = async (e, review) => {
    e.preventDefault();
    console.log(review, "reviewForm");
    if (!reviewingPatient?._id) return;

    try {
      await apiRequest("Patient/updatePatientGoals", {
        method: "POST",
        body: JSON.stringify({
          patientId: reviewingPatient._id,
          shortTermGoals: newGoalForm.newShortTermGoal,
          goalDuration: newGoalForm.newGoalDuration,
          feedback: reviewForm.feedback,
          satisfaction: reviewForm.satisfaction,
        }),
      });

      toast({
        title: "New Goal Set!",
        description: "Previous goal archived and new goal assigned.",
      });

      setIsNewGoalOpen(false);
      setNewGoalForm(initialNewGoalState);
      setReviewForm(initialReviewState);
      getAllPatient();
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to save new goal",
        variant: "destructive",
      });
    }
  };
  console.log(reviewForm.feedback, "reviewForm.feedbackreviewForm.feedback");
  const [openAlert, setOpenAlert] = useState(false);
  const handleScheduleReview = (patient) => {
    setReviewingPatient(patient);
    setIsReviewOpen(true);
  };
  const FeesType =
    patientForm?.FeesTypeId?.feesTypeName || patientForm?.feesTypeName || "";
  const isPerSession =
    FeesType.replace(/\s+/g, "").toLowerCase() === "persession";
  const openAssignPhysioDialog = (patient) => {
    setAssigningPatient(patient);
    setAssignForm({
      _id: patient._id ? patient._id : null,
      Physiotherapist: patient.physioId ? patient.physioId.physioName : null,
      physioId: patient.physioId ? patient.physioId._id : "",
      InitialShorttermGoal: patient.InitialShorttermGoal || "",
      goalDuration: patient.goalDuration || "",
      totalSessionDays: patient.totalSessionDays || "",
      sessionStartDate: patient.sessionStartDate
        ? new Date(patient.sessionStartDate)
        : "",
      sessionTime: patient.sessionTime || "",
      goalDescription: patient.goalDescription || " ",
      reviewFrequency: patient.reviewFrequency || "",
      visitOrder: patient.visitOrder || "",
      KmsfromHub: patient.KmsfromHub || "",
      KmsfLPatienttoHub: patient.KmsfLPatienttoHub || "",
      kmsFromPrevious: patient.kmsFromPrevious || "",
    });
    setIsAssignPhysioOpen(true);
  };
  const handleAssignPhysioSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await AssignPhysio(assignForm); // wait for API

      // Update patients state locally
      setPatients((prev) =>
        prev.map((p) => {
          if (p._id === assigningPatient._id) {
            return {
              ...p,
              physioId: {
                _id: assignForm.physioId,
                physioName: assignForm.Physiotherapist,
              },
              sessionStartDate: assignForm.sessionStartDate,
              sessionTime: assignForm.sessionTime,
              totalSessionDays: assignForm.totalSessionDays,
              InitialShorttermGoal: assignForm.InitialShorttermGoal,
              goalDuration: assignForm.goalDuration,
              goalDescription: assignForm.goalDescription,
              reviewFrequency: assignForm.reviewFrequency,
              visitOrder: assignForm.visitOrder,
              KmsfromHub: assignForm.KmsfromHub,
              KmsfLPatienttoHub: assignForm.KmsfLPatienttoHub,
              kmsFromPrevious: assignForm.kmsFromPrevious,
            };
          }
          return p;
        }),
      );

      toast({
        title: "Success",
        description: `Physio assigned and plan updated for ${assigningPatient.patientName}.`,
      });

      setIsAssignPhysioOpen(false);
      setAssigningPatient(null);
      setAssignForm(initialAssignState);
    } catch (error) {
      console.error("Error assigning physio:", error);
      toast({
        title: "Error",
        description: "Failed to assign physio",
        variant: "destructive",
      });
    }
  };
  const [sessionCount, setSessionCount] = useState({ total: 0, completed: 0 });

  // const handleAssignPhysioSubmit = (e) => {
  // e.preventDefault();
  // setPatients(prev => prev.map(p => {
  //   if (p._id === assigningPatient._id) {
  //     return {
  //       ...p,
  //       physiotherapistAssigned: assignForm.Physiotherapist,
  //       sessionStartDate: assignForm.sessionStartDate,
  //       sessionTime: assignForm.sessionTime,
  //       totalSessionDays: assignForm.totalSessionDays,
  //       InitialShorttermGoal: assignForm.InitialShorttermGoal,
  //       goalDuration: assignForm.goalDuration,
  //       treatmentPlan: { ...(p.treatmentPlan || {}), goalDescription: assignForm.goalDescription },
  //       reviewFrequency: assignForm.reviewFrequency,
  //       travelDetails: {
  //         visitOrder: parseInt(assignForm.visitOrder),
  //         KmsfromHub: assignForm.visitOrder == 1 ? parseFloat(assignForm.KmsfromHub) : null,
  //         kmsFromPrevious: assignForm.visitOrder > 1 ? parseFloat(assignForm.kmsFromPrevious) : null,
  //         returnToHubKms: parseFloat(assignForm.returnToHubKms),
  //       }
  //     };
  //   }
  //   return p;
  // }));
  // console.log(assignForm, "...assigningPatient,...assignForm")

  // AssignPhysio(assignForm)
  // toast({ title: "Success", description: `Physio assigned and plan updated for ${assigningPatient.patientName}.` });
  // setIsAssignPhysioOpen(false);
  // setAssigningPatient(null);
  // setAssignForm(initialAssignState);
  // };

  const handleViewHistory = async (patient) => {
    setHistoryPatient(patient);
    setIsHistoryOpen(true);

    try {
      const allSessions = await apiRequest("Session/getAllSessionsbyPatient", {
        method: "POST",
        body: JSON.stringify({ patientId: patient._id }),
      });

      const sessionsArr = Array.isArray(allSessions) ? allSessions : [];

      // group by cycle
      const groupedByCycle = sessionsArr.reduce((acc, session) => {
        const cycleKey = session.cycleId?._id || session.cycleId || "no-cycle";

        if (!acc[cycleKey]) acc[cycleKey] = [];
        acc[cycleKey].push(session);
        return acc;
      }, {});

      // convert grouped cycles into display structure
      const cycleHistory = Object.entries(groupedByCycle).map(
        ([cycleId, cycleSessions], cycleIndex) => {
          const sortedSessions = [...cycleSessions].sort(
            (a, b) => new Date(a.sessionDate) - new Date(b.sessionDate),
          );

          let runningCount = 0;
          let previousStatus = "";

          const sessions = sortedSessions.map((s, index) => {
            const currentStatus =
              s.sessionStatusId?.sessionStatusName?.toLowerCase() || "";

            if (index === 0) {
              runningCount = 1;
            } else {
              if (previousStatus === "canceled") {
                runningCount = runningCount;
              } else {
                runningCount += 1;
              }
            }

            previousStatus = currentStatus;

            return {
              ...s,
              type: "session",
              cycleId,
              date: s.sessionDate,
              originalSessionCount: s.sessionCount || 0,
              displaySessionCount: runningCount,
              title: `Session ${runningCount}`,
              status: s.sessionStatusId?.sessionStatusName || "N/A",
              color: s.sessionStatusId?.sessionStatusColor || "#4B5563",
              physioName: s.physioId?.physioName || "N/A",
              sessionFromTime: s.sessionFromTime || null,
              sessionToTime: s.sessionToTime || null,
              feedback:
                s.sessionFeedbackPros ||
                s.sessionCancelReason ||
                s.sessionFeedbackCons ||
                "No feedback",
            };
          });

          const firstDate = sessions[0]?.date || null;
          const lastDate = sessions[sessions.length - 1]?.date || null;

          return {
            cycleId,
            cycleTitle: `Cycle ${cycleIndex + 1}`,
            firstDate,
            lastDate,
            totalSessions: sessions.length,
            sessions,
          };
        },
      );

      // sort cycles by latest session date descending
      cycleHistory.sort(
        (a, b) => new Date(b.lastDate || 0) - new Date(a.lastDate || 0),
      );

      setPatientHistory(cycleHistory);

      const totalRecords = cycleHistory.reduce(
        (sum, cycle) => sum + cycle.sessions.length,
        0,
      );

      const completedRecords = cycleHistory.reduce(
        (sum, cycle) =>
          sum +
          cycle.sessions.filter(
            (item) => (item.status || "").toLowerCase() === "completed",
          ).length,
        0,
      );

      const canceledRecords = cycleHistory.reduce(
        (sum, cycle) =>
          sum +
          cycle.sessions.filter(
            (item) => (item.status || "").toLowerCase() === "canceled",
          ).length,
        0,
      );

      setSessionCount({
        totalRecords,
        completed: completedRecords,
        canceled: canceledRecords,
      });
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
      setPatientHistory([]);
      setSessionCount({
        totalRecords: 0,
        completed: 0,
        canceled: 0,
      });
    }
  };

  const renderRadioGroup = (label, name, value, id, group, dynamic) => (
    <div className="flex items-center space-x-4">
      <Label className="w-24">{label}</Label>
      <RadioGroup
        value={patientForm[name] || (group ? false : "no")}
        onValueChange={(v) => {
          dynamic ? handleRadio(name, v, id) : handleRadioChange(name, v);
        }}
        className="flex gap-4"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value={group ? true : "yes"} id={`${name}-yes`} />
          <Label htmlFor={`${name}-yes`}>Yes</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value={group ? false : "no"} id={`${name}-no`} />
          <Label htmlFor={`${name}-no`}>No</Label>
        </div>
      </RadioGroup>
    </div>
  );
  const [modalities, setModalities] = useState([]);
  const [modalityForm, setModalityForm] = useState({
    modalities: false,
    modalitiestype: "",
    modalityList: [],
    modalityType: {}, // to store Type of Modality for each checked modality
  });
  console.log(modalities, "modalities modalities");
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
  const handleToggleStatus = async (patient) => {
    setPendingPatient(patient);
    setRecoveredType("");
    setOtherReason("");
    setOpenAlert(true);
  };
  // const handleToggleStatus = async (payload) => {
  //   try {
  //     const res = await apiRequest("Patient/updatePatient", {
  //       method: "POST",
  //       body: JSON.stringify({
  //         _id: payload.patientId || payload._id,
  //         isRecovered: payload.isRecovered,
  //         recoveredType: payload.recoveredType || null,
  //         stopReason: payload.stopReason || null,
  //       }),
  //     });

  //     if (res) {
  //       toast({
  //         title: "Status Updated",
  //         description: `${payload.patientName || "Patient"} is now ${
  //           payload.isRecovered ? "Recovered" : "Not Recovered"
  //         }.`,
  //       });

  //       setPatients((prev) =>
  //         prev.map((p) =>
  //           p._id === payload._id
  //             ? {
  //                 ...p,
  //                 isRecovered: payload.isRecovered,
  //                 recoveredType: payload.recoveredType || null,
  //                 stopReason: payload.stopReason || null,
  //               }
  //             : p,
  //         ),
  //       );
  //     }
  //   } catch (error) {
  //     toast({
  //       title: "Error",
  //       description: "Failed to update patient status.",
  //       variant: "destructive",
  //     });
  //   }
  // };

  const handleConsentToggle = async (patient) => {
    try {
      const newStatus = !patient.isConsentReceived;

      const res = await apiRequest("Patient/updatePatient", {
        method: "POST",
        body: JSON.stringify({
          _id: patient._id,
          isConsentReceived: newStatus,
        }),
      });

      if (res) {
        toast({
          title: "Status Updated",
          description: `${patient.patientName} is now ${
            newStatus ? "Consent Received" : "Not Consent Received"
          }.`,
        });

        setPatients((prev) =>
          prev.map((p) =>
            p._id === patient._id ? { ...p, isConsentReceived: newStatus } : p,
          ),
        );
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update patient status.",
        variant: "destructive",
      });
    }
  };

  // const renderRadioGroup = (label, name, value, id, group) => (
  //   <div className="flex items-center space-x-4">
  //     <Label className="w-24">{label}</Label>
  //     <RadioGroup value={patientForm[name] || value} onValueChange={(v) => { group ? handleRadio(name, v, id) : handleRadioChange(name, v) }} className="flex gap-4">
  //       <div className="flex items-center space-x-2"><RadioGroupItem value={true} id={`${name}-yes`} /><Label htmlFor={`${name}-yes`}>Yes</Label></div>
  //       <div className="flex items-center space-x-2"><RadioGroupItem value={false} active='no' id={`${name}-no`} /><Label htmlFor={`${name}-no`}>No</Label></div>
  //     </RadioGroup>
  //   </div>

  // );
  console.log("patientForm", patientForm);
  const [selectedPhysioId, setSelectedPhysioId] = useState("ALL");
  useEffect(() => {
    const filtered = filteredByDate.filter((patient) => {
      const search = searchTerm.toLowerCase();

      const matchesSearch =
        patient.patientName?.toLowerCase().includes(search) ||
        patient.patientCode?.toLowerCase().includes(search) ||
        patient.patientNumber?.toString().includes(search);

      const matchesPhysio =
        selectedPhysioId === "ALL" ||
        patient.physioId?._id === selectedPhysioId;

      return matchesSearch && matchesPhysio;
    });

    setFilteredPatients(filtered);
  }, [filteredByDate, searchTerm, selectedPhysioId]);
  const activePatients = useMemo(() => {
    return (filteredPatients || []).filter((p) => !p.isRecovered);
  }, [filteredPatients]);

  const recoveredPatients = useMemo(() => {
    return (filteredPatients || []).filter((p) => !!p.isRecovered);
  }, [filteredPatients]);
  const assignedPhysioIds =
    typeof patientForm.physioId === "object"
      ? patientForm.physioId?._id
      : patientForm.physioId;

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
  console.log("assignedPhysioId", assignedPhysioId);
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
  const getNthSessionFromToday = ({ currentSession, targetSession }) => {
    let date = new Date();

    // ✅ cycle logic (no negative ever)
    let sessionsToAdd =
      (targetSession - (currentSession % targetSession)) % targetSession;

    // 👉 if exactly divisible, we want NEXT cycle (26 not 0)
    if (sessionsToAdd === 0) {
      sessionsToAdd = targetSession;
    }

    let added = 0;

    // skip Sunday logic
    while (added < sessionsToAdd) {
      if (date.getDay() !== 0) {
        added++;
        if (added === sessionsToAdd) break;
      }
      date.setDate(date.getDate() + 1);
    }

    return {
      session: targetSession,
      date: formatDate(date),
      sessionsNeeded: sessionsToAdd,
    };
  };
  const getNext26thSession = (patient) => {
    const currentSession = patient.sessionCount || 0;
    const sessionsNeeded = 26 - currentSession;

    if (sessionsNeeded <= 0) {
      return {
        date: "Completed",
        sessionsNeeded: 0,
      };
    }

    const startDate = patient.consultationDate
      ? new Date(patient.consultationDate)
      : new Date();

    const nextDate = new Date(startDate);
    nextDate.setDate(nextDate.getDate() + sessionsNeeded);

    return {
      date: format(nextDate, "PP"),
      sessionsNeeded,
    };
  };
  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      <div className="w-full flex justify-center">
        <div className="flex items-center gap-2 p-1 rounded-lg border border-slate-800 overflow-x-auto max-w-full w-full sm:w-auto">
          <TabButton id="patient" label="PATIENTS" icon={User2} />
          <TabButton id="recover" label="RECOVERED" icon={UserCheck} />
        </div>
      </div>

      {activeTab === "patient" && (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center"
          >
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-2 break-words">
                Patient Management
              </h1>
              <p className="text-gray-600 text-sm sm:text-sm md:text-base">
                Manage registered patients and their treatment plans.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 w-full md:w-auto md:justify-end">
              <Button
                variant="outline"
                onClick={() => setDownloadDialog(true)}
                className="w-full sm:w-auto"
              >
                <FileText className="mr-2 h-4 w-4" />
                Download
              </Button>

              <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center flex-wrap w-full sm:w-auto">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="border rounded-md px-3 py-2 text-sm w-full sm:w-auto"
                >
                  {monthNames.map((month, index) => (
                    <option
                      key={month}
                      value={index + 1}
                      className=" h-[200px]"
                    >
                      {month}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="border rounded-md px-3 py-2 text-sm w-full sm:w-28"
                  min="2020"
                  max="2100"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full sm:w-auto">
                  <Button onClick={downloadPatientsPDFs} className="w-full">
                    Download PDF
                  </Button>
                  <Button onClick={downloadPatientsExcel} className="w-full">
                    Download Excel
                  </Button>
                </div>
              </div>

              {Permissions.isAdd && (
                <Button onClick={handleNewPatient} className="w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-4 w-4" /> New Patient
                </Button>
              )}
            </div>
          </motion.div>

          <Card className="medical-card">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-lg sm:text-xl">
                Search Patients
              </CardTitle>
            </CardHeader>

            <CardContent className="px-4 sm:px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-center">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, contact or Patient ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>

                <div className="w-full">
                  <Input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full"
                  />
                </div>

                <Select
                  value={selectedPhysioId}
                  onValueChange={(v) => setSelectedPhysioId(v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filter by Physiotherapist" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Physiotherapists</SelectItem>
                    {physios.map((p) => (
                      <SelectItem key={p._id} value={p._id}>
                        {p.physioName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="medical-card">
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="text-lg sm:text-xl">
                  Patients ({filteredPatients.length})
                </CardTitle>
                <CardDescription>
                  All registered patients in the system
                </CardDescription>
              </CardHeader>

              <CardContent className="px-4 sm:px-6">
                <div className="overflow-x-auto hidden sm:block">
                  <table className="min-w-full text-sm border rounded-lg">
                    <thead className="bg-gray-100 text-gray-700">
                      <tr>
                        <th className="px-3 py-2 text-left">Patient</th>
                        {user?.role !== "HOD" && (
                          <th className="px-3 py-2 text-left">Age / Gender</th>
                        )}
                        {user?.role !== "HOD" && (
                          <th className="px-3 py-2 text-left hidden md:table-cell">
                            Contact
                          </th>
                        )}
                        <>
                          <th className="px-3 py-2 text-left hidden md:table-cell">
                            No of Sessions
                          </th>
                          <th className="px-3 py-2 text-left hidden md:table-cell">
                            Next 26th session date
                          </th>
                          <th className="px-3 py-2 text-left hidden md:table-cell">
                            Condition
                          </th>
                        </>
                        {user?.role !== "HOD" && (
                          <th className="px-3 py-2 text-left hidden lg:table-cell">
                            Consultation
                          </th>
                        )}
                        <th className="px-3 py-2 text-left hidden lg:table-cell">
                          Review
                        </th>
                        <th className="px-3 py-2 text-left">Physio</th>
                        <th className="px-3 py-2 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPatients.map((patient) => {
                        const result = getNthSessionFromToday({
                          currentSession: patient.sessionCount || 0,
                          targetSession: 26,
                        });

                        return (
                          <tr
                            key={patient.PatientIDPK}
                            className="border-t hover:bg-gray-50 align-top"
                          >
                            <td className="px-3 py-2">
                              <div className="font-medium truncate max-w-[140px]">
                                {patient.patientName}
                              </div>
                              <div className="text-xs text-gray-500 truncate max-w-[140px]">
                                {patient.patientCode}
                              </div>
                            </td>

                            {user?.role !== "HOD" && (
                              <>
                                <td className="px-3 py-2">
                                  {patient.patientAge} /{" "}
                                  {patient.patientGenderId.genderName}
                                </td>

                                <td className="px-3 py-2 hidden md:table-cell truncate max-w-[140px]">
                                  {patient.patientNumber}
                                </td>
                              </>
                            )}

                            <>
                              <td className="px-3 py-2 hidden md:table-cell">
                                {patient.sessionCount || 0}
                              </td>

                              <td>
                                Session {result.session}
                                <br />
                                <span className="text-xs text-gray-500">
                                  {result.date} ({result.sessionsNeeded}{" "}
                                  sessions left)
                                </span>
                              </td>

                              <td className="px-3 py-2 hidden md:table-cell">
                                {patient.patientCondition}
                              </td>
                            </>

                            {user?.role !== "HOD" && (
                              <td className="px-3 py-2 hidden lg:table-cell">
                                {patient.consultationDate
                                  ? format(
                                      new Date(patient.consultationDate),
                                      "PP",
                                    )
                                  : "Not set"}
                              </td>
                            )}

                            <td className="px-3 py-2 hidden lg:table-cell">
                              {patient.reviewDate
                                ? format(new Date(patient.reviewDate), "PP")
                                : "N/A"}
                            </td>

                            <td className="px-3 py-2 whitespace-nowrap">
                              <div className="flex flex-col gap-2 min-w-[100px]">
                                {patient.physioId?.physioName}
                              </div>
                            </td>

                            <td className="px-3 py-2 hidden sm:table-cell">
                              <div className="flex flex-row flex-wrap gap-2 justify-center">
                                {patient.isConsentReceived ? (
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => {
                                      setPendingPatient(patient);
                                      setOpendialog(true);
                                    }}
                                  >
                                    <CheckCircle
                                      size={14}
                                      className="text-green-600 pointer-events-none"
                                    />
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => {
                                      setPendingPatient(patient);
                                      setOpendialog(true);
                                    }}
                                  >
                                    <Circle
                                      size={14}
                                      className="pointer-events-none"
                                    />
                                  </Button>
                                )}

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleViewConsultation(patient)
                                  }
                                >
                                  <FileText size={14} />
                                </Button>

                                <Button
                                  size="sm"
                                  onClick={() => handleScheduleReview(patient)}
                                >
                                  <CalendarIcon size={14} />
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewHistory(patient)}
                                >
                                  <History size={14} />
                                </Button>

                                {Permissions.isEdit && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditPatient(patient)}
                                  >
                                    <Edit size={14} />
                                  </Button>
                                )}

                                <Button
                                  size="sm"
                                  onClick={() =>
                                    openAssignPhysioDialog(patient)
                                  }
                                >
                                  {patient.physioId ? (
                                    <UserCheck size={14} />
                                  ) : (
                                    <UserPlus size={14} />
                                  )}
                                </Button>

                                {Permissions.isDelete && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button size="sm" variant="destructive">
                                        <Trash2 size={14} />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="w-[95vw] max-w-md">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>
                                          Delete patient?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This will permanently delete the
                                          patient.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                        <AlertDialogCancel className="w-full sm:w-auto">
                                          Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          className="w-full sm:w-auto"
                                          onClick={() =>
                                            handleDeletePatient(patient._id)
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
                {filteredPatients.map((patient) => {
                  const result = getNext26thSession(patient);

                  return (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      <Card className="medical-card sm:hidden">
                        <CardContent className="px-0 pt-0">
                          <div className="grid grid-cols-1 gap-4">
                            {filteredPatients.map((patient) => (
                              <motion.div
                                key={patient.PatientIDPK}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3 }}
                                className="border rounded-lg p-4 hover:shadow-md transition-shadow flex flex-col"
                              >
                                <div className="flex items-start gap-3 mb-3">
                                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                                    <User className="text-blue-600" size={20} />
                                  </div>
                                  <div className="min-w-0">
                                    <h3 className="font-semibold text-gray-800 break-words">
                                      {patient.patientName}
                                    </h3>
                                    <p className="text-sm text-gray-600 break-all">
                                      {patient.patientCode}
                                    </p>
                                    <p className="text-sm text-gray-600 break-words">
                                      {patient.patientAge} years,{" "}
                                      {patient.patientGenderId.genderName}
                                    </p>
                                  </div>
                                </div>
                                <div className="space-y-2 mb-4 flex-grow">
                                  <p className="text-sm break-words">
                                    <strong>Contact:</strong>{" "}
                                    {patient.patientNumber}
                                  </p>
                                </div>
                                {/* <div className="space-y-2 mb-4 flex-grow">
                                  <p className="text-sm break-words">
                                    <strong>Consultation Date:</strong>{" "}
                                    {patient.consultationDate
                                      ? format(
                                          new Date(patient.consultationDate),
                                          "PP",
                                        )
                                      : "Not set"}
                                  </p>
                                </div> */}
                                <>
                                  <div className="space-y-2 mb-4 flex-grow">
                                    <div className="flex flex-col gap-2">
                                      <p className="text-sm break-words">
                                        <strong>Condition:</strong>{" "}
                                        {patient.patientCondition}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="space-y-2 mb-4 flex-grow">
                                    <div className="flex flex-col gap-2">
                                      <p className="text-sm break-words">
                                        <strong>No of Sessions:</strong>{" "}
                                        {patient.sessionCount}
                                      </p>
                                    </div>
                                  </div>
                                </>
                                <div className="space-y-2 mb-4 flex-grow">
                                  <div className="flex flex-col gap-2">
                                    <p className="text-sm break-words">
                                      <strong>Next 26th Session:</strong>{" "}
                                      <span className="text-xs text-gray-500">
                                        {result.date} ({result.sessionsNeeded}{" "}
                                        sessions left)
                                      </span>
                                    </p>
                                  </div>
                                </div>
                                <div className="space-y-2 mb-4 flex-grow">
                                  <p className="text-sm break-words">
                                    <strong>Review Date:</strong>{" "}
                                    {patient.reviewDate
                                      ? format(
                                          new Date(patient.reviewDate),
                                          "PP",
                                        )
                                      : "N/A"}
                                  </p>
                                </div>{" "}
                                <div className="py-2">
                                  <div className="flex flex-col gap-2">
                                    <p className="break-words">
                                      Physio: {patient.physioId?.physioName}
                                    </p>
                                  </div>
                                </div>
                                <div className="mt-2 grid grid-cols-3 gap-2">
                                  {patient.isConsentReceived ? (
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      onClick={() => {
                                        setPendingPatient(patient);
                                        setOpendialog(true);
                                      }}
                                    >
                                      <CheckCircle
                                        size={14}
                                        className="text-green-600 pointer-events-none"
                                      />
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="default"
                                      onClick={() => {
                                        setPendingPatient(patient);
                                        setOpendialog(true);
                                      }}
                                    >
                                      <Circle
                                        size={14}
                                        className="pointer-events-none"
                                      />
                                    </Button>
                                  )}

                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      openAssignPhysioDialog(patient)
                                    }
                                  >
                                    {patient.physioId ? (
                                      <UserCheck size={14} />
                                    ) : (
                                      <UserPlus size={14} />
                                    )}
                                  </Button>

                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      handleViewConsultation(patient)
                                    }
                                  >
                                    <FileText size={14} />
                                  </Button>

                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      handleScheduleReview(patient)
                                    }
                                  >
                                    <CalendarIcon size={14} />
                                  </Button>

                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleViewHistory(patient)}
                                  >
                                    <History size={14} />
                                  </Button>

                                  {Permissions.isEdit && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleEditPatient(patient)}
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
                                      <AlertDialogContent className="w-[95vw] max-w-md">
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>
                                            Delete patient?
                                          </AlertDialogTitle>
                                          <AlertDialogDescription>
                                            This will permanently delete the
                                            patient.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                          <AlertDialogCancel className="w-full sm:w-auto">
                                            Cancel
                                          </AlertDialogCancel>
                                          <AlertDialogAction
                                            className="w-full sm:w-auto"
                                            onClick={() =>
                                              handleDeletePatient(patient._id)
                                            }
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
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}

      <Dialog open={downloadDialog} onOpenChange={setDownloadDialog}>
        <DialogContent className="w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Download Patient Report</DialogTitle>
            <DialogDescription>
              Choose which report you want to download as PDF.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Button
              className="w-full justify-start"
              onClick={downloadPatientsOfMonth}
              disabled={downloadLoading}
            >
              <FileText className="mr-2 h-4 w-4" />
              Patients of the Month
            </Button>
            <Button
              className="w-full justify-start"
              onClick={downloadPatientsOfLastMonth}
              disabled={downloadLoading}
            >
              <FileText className="mr-2 h-4 w-4" />
              Patients of the Last Month
            </Button>
            <Button
              className="w-full justify-start"
              onClick={downloadPatientsOfLast2Month}
              disabled={downloadLoading}
            >
              <FileText className="mr-2 h-4 w-4" />
              Patients of the Last 2 Month
            </Button>
            <Button
              className="w-full justify-start"
              onClick={downloadPatientsOfLast3Month}
              disabled={downloadLoading}
            >
              <FileText className="mr-2 h-4 w-4" />
              Patients of the Last 3 Month
            </Button>
            <Button
              className="w-full justify-start"
              onClick={downloadPatientsLastYear}
              disabled={downloadLoading}
            >
              <FileText className="mr-2 h-4 w-4" />
              Last 1 Year Patients List
            </Button>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDownloadDialog(false)}
              disabled={downloadLoading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {activeTab === "recover" && (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center"
          >
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-2 break-words">
                Recovered Patient Management
              </h1>
              <p className="text-gray-600 text-sm sm:text-sm md:text-base">
                Manage registered patients and their treatment plans.
              </p>
            </div>

            {Permissions.isAdd && (
              <Button onClick={handleNewPatient} className="w-full sm:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" /> New Patient
              </Button>
            )}
          </motion.div>

          <Card className="medical-card">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-lg sm:text-xl">
                Search Patients
              </CardTitle>
            </CardHeader>

            <CardContent className="px-4 sm:px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-center">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, contact or Patient ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>

                {user?.role !== "Physio" && (
                  <div className="w-full">
                    <Input
                      type="date"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="w-full"
                    />
                  </div>
                )}

                <Select
                  value={selectedPhysioId}
                  onValueChange={(v) => setSelectedPhysioId(v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filter by Physiotherapist" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Physiotherapists</SelectItem>
                    {physios.map((p) => (
                      <SelectItem key={p._id} value={p._id}>
                        {p.physioName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="medical-card">
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="text-lg sm:text-xl">
                  Recovered Patients ({recoveredPatients.length})
                </CardTitle>
                <CardDescription>
                  All Recovered patients in the system
                </CardDescription>
              </CardHeader>

              <CardContent className="px-4 sm:px-6">
                <div className="overflow-x-auto hidden sm:block">
                  <table className="min-w-full text-sm border rounded-lg">
                    <thead className="bg-gray-100 text-gray-700">
                      <tr>
                        <th className="px-3 py-2 text-left">Patient</th>
                        {user?.role !== "HOD" && (
                          <th className="px-3 py-2 text-left">Age / Gender</th>
                        )}
                        {user?.role !== "HOD" && (
                          <th className="px-3 py-2 text-left hidden md:table-cell">
                            Contact
                          </th>
                        )}
                        <>
                          <th className="px-3 py-2 text-left hidden md:table-cell">
                            No of Sessions
                          </th>
                          <th className="px-3 py-2 text-left hidden md:table-cell">
                            Condition
                          </th>
                        </>
                        {user?.role !== "HOD" && (
                          <th className="px-3 py-2 text-left hidden lg:table-cell">
                            Consultation
                          </th>
                        )}
                        <th className="px-3 py-2 text-left hidden lg:table-cell">
                          Review
                        </th>
                        <th className="px-3 py-2 text-left">Physio</th>
                        <th className="px-3 py-2 text-center">Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {recoveredPatients.map((patient) => (
                        <tr
                          key={patient.PatientIDPK}
                          className="border-t hover:bg-gray-50 align-top"
                        >
                          <td className="px-3 py-2">
                            <div className="font-medium truncate max-w-[140px]">
                              {patient.patientName}
                            </div>
                            <div className="text-xs text-gray-500 truncate max-w-[140px]">
                              {patient.patientCode}
                            </div>
                          </td>

                          {user?.role !== "HOD" && (
                            <>
                              <td className="px-3 py-2">
                                {patient.patientAge} /{" "}
                                {patient.patientGenderId.genderName}
                              </td>

                              <td className="px-3 py-2 hidden md:table-cell truncate max-w-[140px]">
                                {patient.patientNumber}
                              </td>
                            </>
                          )}

                          <>
                            <td className="px-3 py-2 hidden md:table-cell truncate max-w-[140px]">
                              {patient.sessionCount || 0}
                            </td>
                            <td className="px-3 py-2 hidden md:table-cell truncate max-w-[140px]">
                              {patient.patientCondition}
                            </td>
                          </>

                          {user?.role !== "HOD" && (
                            <td className="px-3 py-2 hidden lg:table-cell">
                              {patient.consultationDate
                                ? format(
                                    new Date(patient.consultationDate),
                                    "PP",
                                  )
                                : "Not set"}
                            </td>
                          )}

                          <td className="px-3 py-2 hidden lg:table-cell">
                            {patient.reviewDate
                              ? format(new Date(patient.reviewDate), "PP")
                              : "N/A"}
                          </td>

                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="flex flex-col gap-2 min-w-[100px]">
                              {patient.physioId?.physioName}
                            </div>
                          </td>

                          <td className="px-3 py-2 hidden sm:table-cell">
                            <div className="flex flex-row flex-wrap gap-2 justify-center">
                              {patient.isConsentReceived ? (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => {
                                    setPendingPatient(patient);
                                    setOpendialog(true);
                                  }}
                                >
                                  <CheckCircle
                                    size={14}
                                    className="text-green-600 pointer-events-none"
                                  />
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => {
                                    setPendingPatient(patient);
                                    setOpendialog(true);
                                  }}
                                >
                                  <Circle
                                    size={14}
                                    className="pointer-events-none"
                                  />
                                </Button>
                              )}

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewConsultation(patient)}
                              >
                                <FileText size={14} />
                              </Button>

                              <Button
                                size="sm"
                                onClick={() => handleScheduleReview(patient)}
                              >
                                <CalendarIcon size={14} />
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewHistory(patient)}
                              >
                                <History size={14} />
                              </Button>

                              {Permissions.isEdit && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditPatient(patient)}
                                >
                                  <Edit size={14} />
                                </Button>
                              )}

                              <Button
                                size="sm"
                                onClick={() => openAssignPhysioDialog(patient)}
                              >
                                {patient.physioId ? (
                                  <UserCheck size={14} />
                                ) : (
                                  <UserPlus size={14} />
                                )}
                              </Button>

                              {Permissions.isDelete && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="destructive">
                                      <Trash2 size={14} />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="w-[95vw] max-w-md">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Delete patient?
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will permanently delete the
                                        patient.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                      <AlertDialogCancel className="w-full sm:w-auto">
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        className="w-full sm:w-auto"
                                        onClick={() =>
                                          handleDeletePatient(patient._id)
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
                      ))}
                    </tbody>
                  </table>
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Card className="medical-card sm:hidden">
                    <CardContent className="px-0 pt-0">
                      <div className="grid grid-cols-1 gap-4">
                        {recoveredPatients.map((patient) => (
                          <motion.div
                            key={patient.PatientIDPK}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                            className="border rounded-lg p-4 hover:shadow-md transition-shadow flex flex-col"
                          >
                            <div className="flex items-start gap-3 mb-3">
                              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                                <User className="text-blue-600" size={20} />
                              </div>
                              <div className="min-w-0">
                                <h3 className="font-semibold text-gray-800 break-words">
                                  {patient.patientName}
                                </h3>
                                <p className="text-sm text-gray-600 break-all">
                                  {patient.patientCode}
                                </p>
                                <p className="text-sm text-gray-600 break-words">
                                  {patient.patientAge} years,{" "}
                                  {patient.patientGenderId.genderName}
                                </p>
                              </div>
                            </div>

                            <div className="space-y-2 mb-4 flex-grow">
                              <p className="text-sm break-words">
                                <strong>Contact:</strong>{" "}
                                {patient.patientNumber}
                              </p>
                            </div>

                            <div className="space-y-2 mb-4 flex-grow">
                              <p className="text-sm break-words">
                                <strong>Consultation Date:</strong>{" "}
                                {patient.consultationDate
                                  ? format(
                                      new Date(patient.consultationDate),
                                      "PP",
                                    )
                                  : "Not set"}
                              </p>
                            </div>

                            {user?.role === "HOD" && (
                              <>
                                <div className="space-y-2 mb-4 flex-grow">
                                  <div className="flex flex-col gap-2">
                                    <p className="text-sm break-words">
                                      <strong>Condition:</strong>{" "}
                                      {patient.patientCondition}
                                    </p>
                                  </div>
                                </div>

                                <div className="space-y-2 mb-4 flex-grow">
                                  <div className="flex flex-col gap-2">
                                    <p className="text-sm break-words">
                                      <strong>No of Sessions:</strong>{" "}
                                      {patient.sessionCount}
                                    </p>
                                  </div>
                                </div>
                              </>
                            )}

                            <div className="space-y-2 mb-4 flex-grow">
                              <p className="text-sm break-words">
                                <strong>Review Date:</strong>{" "}
                                {patient.reviewDate
                                  ? format(new Date(patient.reviewDate), "PP")
                                  : "N/A"}
                              </p>
                            </div>
                            <div className="space-y-2 mb-4 flex-grow">
                              <p className="text-sm break-words">
                                <strong>Session Count:</strong>{" "}
                                {patient.sessionCount || 0}
                              </p>
                            </div>

                            <div className="py-2">
                              <div className="flex flex-col gap-2">
                                <p className="break-words">
                                  Physio: {patient.physioId?.physioName}
                                </p>
                              </div>
                            </div>

                            <div className="mt-2 grid grid-cols-3 gap-2">
                              {patient.isConsentReceived ? (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => {
                                    setPendingPatient(patient);
                                    setOpendialog(true);
                                  }}
                                >
                                  <CheckCircle
                                    size={14}
                                    className="text-green-600 pointer-events-none"
                                  />
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => {
                                    setPendingPatient(patient);
                                    setOpendialog(true);
                                  }}
                                >
                                  <Circle
                                    size={14}
                                    className="pointer-events-none"
                                  />
                                </Button>
                              )}

                              <Button
                                size="sm"
                                onClick={() => openAssignPhysioDialog(patient)}
                              >
                                {patient.physioId ? (
                                  <UserCheck size={14} />
                                ) : (
                                  <UserPlus size={14} />
                                )}
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewConsultation(patient)}
                              >
                                <FileText size={14} />
                              </Button>

                              <Button
                                size="sm"
                                onClick={() => handleScheduleReview(patient)}
                              >
                                <CalendarIcon size={14} />
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewHistory(patient)}
                              >
                                <History size={14} />
                              </Button>

                              {Permissions.isEdit && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditPatient(patient)}
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
                                  <AlertDialogContent className="w-[95vw] max-w-md">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Delete patient?
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will permanently delete the
                                        patient.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                      <AlertDialogCancel className="w-full sm:w-auto">
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        className="w-full sm:w-auto"
                                        onClick={() =>
                                          handleDeletePatient(patient._id)
                                        }
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
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}

      <PatientDetailsDialog
        isOpen={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        patient={viewingPatient}
      />

      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[95vh] flex flex-col p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>
              Review Goal for {reviewingPatient?.patientName}
            </DialogTitle>
            <DialogDescription>
              Update feedback and satisfaction for the current goal.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-1 sm:pr-4">
            <div className="space-y-4 pt-4">
              <div>
                <Label className="font-semibold">Current Goal</Label>
                <p className="text-sm text-gray-700 p-2 bg-gray-100 rounded-md mt-1 break-words">
                  {reviewingPatient?.shortTermGoals || "No current goal set."}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="feedback">Feedback / Suggestions</Label>
                <textarea
                  id="feedback"
                  className="w-full p-2 border rounded-md"
                  value={reviewForm.feedback}
                  onChange={(e) =>
                    setReviewForm((p) => ({ ...p, feedback: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Satisfaction (%)</Label>
                <div className="flex items-center gap-2 flex-wrap">
                  {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((p) => (
                    <Button
                      key={p}
                      type="button"
                      variant={
                        reviewForm.satisfaction === p ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() =>
                        setReviewForm((f) => ({ ...f, satisfaction: p }))
                      }
                    >
                      {p}%
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="pt-4 flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsReviewOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleUpdateFeedback}
              className="w-full sm:w-auto"
            >
              Update Feedback Only
            </Button>
            <Button
              type="button"
              onClick={handleLogAndOpenNewGoal}
              className="w-full sm:w-auto"
            >
              Log Goal & Set New One
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isNewGoalOpen} onOpenChange={setIsNewGoalOpen}>
        <DialogContent className="w-[95vw] max-w-lg p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>
              Set Next Goal for {reviewingPatient?.patientName}
            </DialogTitle>
            <DialogDescription>
              Define the next short-term goal and review date.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => handleNewGoalSubmit(e, reviewForm)}
            className="space-y-4 pt-4"
          >
            <div className="space-y-2">
              <Label htmlFor="newShortTermGoal">New Short-term Goal</Label>
              <Input
                id="newShortTermGoal"
                value={newGoalForm.newShortTermGoal}
                onChange={(e) =>
                  setNewGoalForm((p) => ({
                    ...p,
                    newShortTermGoal: e.target.value,
                  }))
                }
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newGoalDuration">
                  New Goal Duration (days)
                </Label>
                <Input
                  id="newGoalDuration"
                  type="number"
                  onWheel={(e) => {
                    e.target.blur();
                  }}
                  value={newGoalForm.newGoalDuration}
                  onChange={(e) =>
                    setNewGoalForm((p) => ({
                      ...p,
                      newGoalDuration: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsNewGoalOpen(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button type="submit" className="w-full sm:w-auto">
                Set New Goal
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="w-[95vw] md:max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Patient History: {historyPatient?.patientName || "Unknown"}
            </DialogTitle>
            <DialogDescription>
              Chronological log of all sessions and reviews.
            </DialogDescription>
          </DialogHeader>

          <div className="mb-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <div className="rounded-lg border p-2 bg-slate-50">
              <p className="text-gray-500">Total Records</p>
              <p className="font-semibold">{sessionCount?.totalRecords ?? 0}</p>
            </div>

            <div className="rounded-lg border p-2 bg-slate-50">
              <p className="text-gray-500">Completed</p>
              <p className="font-semibold">{sessionCount?.completed ?? 0}</p>
            </div>

            <div className="rounded-lg border p-2 bg-slate-50">
              <p className="text-gray-500">Canceled</p>
              <p className="font-semibold">{sessionCount?.canceled ?? 0}</p>
            </div>

            <div className="rounded-lg border p-2 bg-slate-50">
              <p className="text-gray-500">Current Session No</p>
              <p className="font-semibold">{sessionCount?.current ?? 0}</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 sm:pr-4 mt-2">
            <div className="relative pl-6">
              <div
                className="absolute left-0 top-0 h-full w-0.5 bg-gray-200"
                style={{ transform: "translateX(2.5px)" }}
              />

              {patientHistory && patientHistory.length > 0 ? (
                patientHistory.map((cycle) => (
                  <div
                    key={cycle.cycleId}
                    className="mb-6 border rounded-lg p-4"
                  >
                    <h3 className="text-lg font-semibold text-blue-600 mb-2">
                      {cycle.cycleTitle}
                    </h3>

                    <p className="text-sm text-gray-500 mb-4">
                      {formatDate(cycle.firstDate)} to{" "}
                      {formatDate(cycle.lastDate)}
                    </p>

                    <div className="space-y-3">
                      {cycle.sessions.map((item, index) => (
                        <div
                          key={item._id || index}
                          className="border rounded-md p-3 flex flex-col gap-1"
                        >
                          <div className="font-medium">{item.title}</div>
                          <div className="text-sm text-gray-600">
                            Date: {formatDate(item.date)}
                          </div>
                          <div className="text-sm text-gray-600">
                            Status: {item.status}
                          </div>
                          <div className="text-sm text-gray-600">
                            Physio: {item.physioName}
                          </div>
                          <div className="text-sm text-gray-600">
                            Feedback: {item.feedback}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500">
                  No history found for this patient.
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[95vh] flex flex-col p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>
              {editingPatient ? "Edit Patient" : "Create New Patient"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-1 sm:pr-4">
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <Accordion
                type="multiple"
                defaultValue={["item-1"]}
                className="w-full"
              >
                <AccordionItem value="item-1">
                  <AccordionTrigger>Patient Details</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Patient ID</Label>
                        <Input
                          name="patientCode"
                          value={patientForm.patientCode}
                          disabled
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Consultation Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !patientForm.consultationDate &&
                                  "text-muted-foreground",
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {patientForm.consultationDate ? (
                                format(patientForm.consultationDate, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={patientForm.consultationDate}
                              onSelect={(d) =>
                                handleDateChange("consultationDate", d)
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          name="patientName"
                          value={patientForm.patientName}
                          onChange={handleFormChange}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Age</Label>
                        <Input
                          name="patientAge"
                          type="number"
                          onWheel={(e) => {
                            e.target.blur();
                          }}
                          value={patientForm.patientAge}
                          onChange={handleFormChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Gender</Label>
                        <Select
                          value={patientForm.patientGenderId}
                          onValueChange={(v) =>
                            handleSelectChange("patientGenderId", v)
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Gender" />
                          </SelectTrigger>
                          <SelectContent>
                            {gender.map((g) => (
                              <SelectItem
                                key={g.GenderIDPK}
                                value={g.GenderIDPK}
                              >
                                {g.genderName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Bystander Name</Label>
                        <Input
                          name="byStandar"
                          value={patientForm.byStandar}
                          onChange={handleFormChange}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Relation With Patient</Label>
                        <Input
                          name="Relation"
                          value={patientForm.Relation}
                          onChange={handleFormChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Mobile No.</Label>
                        <Input
                          name="patientNumber"
                          value={patientForm.patientNumber}
                          onChange={handleFormChange}
                          maxLength={10}
                          inputMode="numeric"
                          pattern="[6-9][0-9]{9}"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Alt. Mobile No.</Label>
                        <Input
                          name="patientAltNum"
                          value={patientForm.patientAltNum}
                          onChange={handleFormChange}
                          maxLength={10}
                          inputMode="numeric"
                          pattern="[6-9][0-9]{9}"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Address</Label>
                        <Input
                          name="patientAddress"
                          value={patientForm.patientAddress}
                          onChange={handleFormChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>PIN Code</Label>
                        <Input
                          name="patientPinCode"
                          value={patientForm.patientPinCode}
                          onChange={handleFormChange}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Fees Type</Label>
                        <Select
                          value={patientForm?.FeesTypeId || ""}
                          onValueChange={(id) => {
                            const selected = feesType.find((f) => f._id === id);
                            if (!selected) return;

                            handleSelectChange("FeesTypeId", selected._id);
                            handleSelectChange(
                              "feesTypeName",
                              selected.feesTypeName,
                            );
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Fees" />
                          </SelectTrigger>

                          <SelectContent>
                            {feesType.map((fee) => (
                              <SelectItem key={fee._id} value={fee._id}>
                                {fee.feesTypeName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>
                          Fees Amount (
                          {isPerSession ? "PerSession" : "PerMonth"})
                        </Label>
                        <Input
                          name="feeAmount"
                          value={patientForm.feeAmount}
                          onChange={handleFormChange}
                          placeholder={isPerSession ? "PerSession" : "PerMonth"}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Diagnosis / Condition</Label>
                        <Input
                          name="patientCondition"
                          value={patientForm.patientCondition}
                          onChange={handleFormChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Review Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !patientForm.reviewDate &&
                                  "text-muted-foreground",
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {patientForm.reviewDate ? (
                                format(patientForm.reviewDate, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={patientForm.reviewDate}
                              onSelect={(d) =>
                                handleDateChange("reviewDate", d)
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
                        <Label>Reference</Label>
                        <Select
                          value={JSON.stringify({
                            id: patientForm.ReferenceId,
                            name: patientForm.sourceName,
                          })}
                          onValueChange={(v) => {
                            if (!v) return;
                            try {
                              const selected = JSON.parse(v);
                              handleSelectChange("ReferenceId", selected.id);
                              handleSelectChange("sourceName", selected.name);
                            } catch (err) {
                              console.error("Unable to parse JSON", v, err);
                            }
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Reference" />
                          </SelectTrigger>
                          <SelectContent>
                            {reference.map((ref) => (
                              <SelectItem
                                key={ref._id}
                                value={JSON.stringify({
                                  id: ref._id,
                                  name: ref.sourceName,
                                })}
                              >
                                {ref.sourceName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedPatient && (
                        <div className="space-y-2">
                          <Label>Is Recovered</Label>
                          <Button
                            onClick={() => handleToggleStatus(selectedPatient)}
                            className={
                              selectedPatient.isRecovered
                                ? "bg-yellow-500 hover:bg-yellow-600"
                                : "bg-green-500 hover:bg-green-600"
                            }
                          >
                            {selectedPatient.isRecovered
                              ? "Not Recovered"
                              : "Mark Recovered"}
                          </Button>
                        </div>
                      )}

                      {selectedPatient && (
                        <div className="space-y-2">
                          <Label>Is Consent Received</Label>
                          <Button
                            type="button"
                            size="sm"
                            variant={
                              selectedPatient.isConsentReceived
                                ? "secondary"
                                : "default"
                            }
                            onClick={() => {
                              setPendingPatient(selectedPatient);
                              setOpendialog(true);
                            }}
                            className="w-full sm:w-auto"
                          >
                            {selectedPatient.isConsentReceived
                              ? "Mark Not Consent Received"
                              : "Mark Consent Received"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger>
                    Medical History & Risk Factors
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {risk.map((risk) => (
                        <div key={risk.RiskFactorIDPK}>
                          {renderRadioGroup(
                            risk.RiskFactorName,
                            risk.RiskFactorName.toLowerCase(),
                            patientForm[risk.RiskFactorName.toLowerCase()],
                            risk.RiskFactorIDPK,
                            true,
                            true,
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      {renderRadioGroup(
                        "History of Surgery",
                        "historyOfSurgery",
                        patientForm.historyOfSurgery,
                      )}
                    </div>
                    {patientForm.historyOfSurgery === "yes" && (
                      <div className="space-y-2">
                        <Label>Details</Label>
                        <textarea
                          name="historyOfSurgeryDetails"
                          rows={2}
                          className="w-full p-2 border rounded-md"
                          value={patientForm.historyOfSurgeryDetails}
                          onChange={handleFormChange}
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      {renderRadioGroup(
                        "History of Fall",
                        "historyOfFall",
                        patientForm.historyOfFall,
                      )}
                    </div>
                    {patientForm.historyOfFall === "yes" && (
                      <div className="space-y-2">
                        <Label>Details</Label>
                        <textarea
                          name="historyOfFallDetails"
                          rows={2}
                          className="w-full p-2 border rounded-md"
                          value={patientForm.historyOfFallDetails}
                          onChange={handleFormChange}
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>Other Medical Conditions</Label>
                      <textarea
                        name="otherMedCon"
                        rows={2}
                        className="w-full p-2 border rounded-md"
                        value={patientForm.otherMedCon}
                        onChange={handleFormChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Current Medications</Label>
                      <textarea
                        name="currMed"
                        rows={2}
                        className="w-full p-2 border rounded-md"
                        value={patientForm.currMed}
                        onChange={handleFormChange}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3">
                  <AccordionTrigger>Lifestyle Information</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Type of Lifestyle</Label>
                      <RadioGroup
                        value={patientForm.typesOfLifeStyle}
                        onValueChange={(v) =>
                          handleRadioChange("typesOfLifeStyle", v)
                        }
                        className="flex flex-col sm:flex-row gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="sedentary" id="ls-sedentary" />
                          <Label htmlFor="ls-sedentary">Sedentary</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="moderate" id="ls-moderate" />
                          <Label htmlFor="ls-moderate">Moderate</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="active" id="ls-active" />
                          <Label htmlFor="ls-active">Active</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div className="space-y-2">
                      {renderRadioGroup(
                        "Smoking / Alcohol",
                        "smokingOrAlcohol",
                        patientForm.smokingOrAlcohol,
                        "",
                        true,
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Dietary Habits</Label>
                      <textarea
                        name="dietaryHabits"
                        rows={2}
                        className="w-full p-2 border rounded-md"
                        value={patientForm.dietaryHabits}
                        onChange={handleFormChange}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4">
                  <AccordionTrigger>Contraindications</AccordionTrigger>
                  <AccordionContent>
                    <textarea
                      name="Contraindications"
                      rows={3}
                      className="w-full p-2 border rounded-md"
                      value={patientForm.Contraindications}
                      onChange={handleFormChange}
                    />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5">
                  <AccordionTrigger>Assessment Parameters</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Pain Level (0-10)</Label>
                        <Input
                          name="painLevel"
                          type="number"
                          onWheel={(e) => {
                            e.target.blur();
                          }}
                          value={patientForm.painLevel}
                          onChange={handleFormChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Range of Motion</Label>
                        <Input
                          name="rangeOfMotion"
                          value={patientForm.rangeOfMotion}
                          onChange={handleFormChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Muscle Strength (0-5)</Label>
                        <Input
                          name="muscleStrength"
                          type="text"
                          value={patientForm.muscleStrength}
                          onChange={handleFormChange}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Posture / Gait Analysis</Label>
                      <textarea
                        name="postureOrGaitAnalysis"
                        rows={2}
                        className="w-full p-2 border rounded-md"
                        value={patientForm.postureOrGaitAnalysis}
                        onChange={handleFormChange}
                      />
                    </div>
                    <div className="w-full border rounded-md p-4 bg-gray-50">
                      <Label className="text-sm font-semibold text-gray-700 mb-3 block">
                        Balance
                      </Label>

                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Static</p>
                          <textarea
                            name="static"
                            rows={2}
                            className="w-full p-2 border rounded-md text-sm"
                            value={patientForm.static}
                            onChange={handleFormChange}
                          />
                        </div>

                        <div>
                          <p className="text-xs text-gray-600 mb-1">Dynamic</p>
                          <textarea
                            name="dynamic"
                            rows={2}
                            className="w-full p-2 border rounded-md text-sm"
                            value={patientForm.dynamic}
                            onChange={handleFormChange}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Coordination</Label>
                      <textarea
                        name="coordination"
                        rows={2}
                        className="w-full p-2 border rounded-md"
                        value={patientForm.coordination}
                        onChange={handleFormChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Functional Limitations</Label>
                      <textarea
                        name="functionalLimitations"
                        rows={2}
                        className="w-full p-2 border rounded-md"
                        value={patientForm.functionalLimitations}
                        onChange={handleFormChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>ADL Ability</Label>
                      <textarea
                        name="ADLAbility"
                        rows={2}
                        className="w-full p-2 border rounded-md"
                        value={patientForm.ADLAbility}
                        onChange={handleFormChange}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6">
                  <AccordionTrigger>Treatment Plan</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Short-term Goals</Label>
                      <textarea
                        name="shortTermGoals"
                        rows={2}
                        className="w-full p-2 border rounded-md"
                        value={patientForm.shortTermGoals}
                        onChange={handleFormChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Long-term Goals</Label>
                      <textarea
                        name="longTermGoals"
                        rows={2}
                        className="w-full p-2 border rounded-md"
                        value={patientForm.longTermGoals}
                        onChange={handleFormChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Recommended Therapy</Label>
                      <textarea
                        name="RecomTherapy"
                        rows={2}
                        className="w-full p-2 border rounded-md"
                        value={patientForm.RecomTherapy}
                        onChange={handleFormChange}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Frequency (per week)</Label>
                        <Input
                          name="Frequency"
                          type="number"
                          onWheel={(e) => {
                            e.target.blur();
                          }}
                          value={patientForm.Frequency}
                          onChange={handleFormChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>No of Days</Label>
                        <Input
                          name="noOfDays"
                          type="number"
                          onWheel={(e) => {
                            e.target.blur();
                          }}
                          value={patientForm.noOfDays}
                          onChange={handleFormChange}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      {renderRadioGroup(
                        "Modalities",
                        "modalities",
                        patientForm.modalities,
                        "",
                        true,
                      )}
                    </div>

                    {patientForm.modalities === true && (
                      <div className="space-y-2">
                        <Label htmlFor="modalitiestype">Modalities Type</Label>
                        <Select
                          value={patientForm.modalitiestype}
                          onValueChange={(val) =>
                            setPatientForm((prev) => ({
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

                        {patientForm.modalitiestype && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="space-y-2 pl-0 sm:pl-4"
                          >
                            <Label>List of Modalities</Label>
                            <div className="p-3 border rounded-md grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                              {Array.isArray(modalities) &&
                                modalities
                                  .filter(
                                    (mod) =>
                                      mod.modalitiestype ===
                                        patientForm.modalitiestype &&
                                      physioModalityIds.includes(
                                        String(mod._id),
                                      ),
                                  )
                                  .map((mod) => {
                                    const isChecked = patientForm.modalityList
                                      .map((id) => String(id))
                                      .includes(String(mod._id));

                                    return (
                                      <div
                                        key={mod._id}
                                        className="flex items-center space-x-2"
                                      >
                                        <Checkbox
                                          id={`mod-${mod._id}`}
                                          checked={isChecked}
                                          onCheckedChange={(checked) => {
                                            const id = String(mod._id);

                                            setPatientForm((prev) => {
                                              const list = (
                                                prev.modalityList || []
                                              ).map((x) => String(x));

                                              return {
                                                ...prev,
                                                modalityList: checked
                                                  ? Array.from(
                                                      new Set([...list, id]),
                                                    )
                                                  : list.filter(
                                                      (m) => m !== id,
                                                    ),
                                              };
                                            });
                                          }}
                                        />
                                        <Label
                                          htmlFor={`mod-${mod._id}`}
                                          className="text-sm font-normal break-words"
                                        >
                                          {mod.modalitiesName}
                                        </Label>
                                      </div>
                                    );
                                  })}
                            </div>
                          </motion.div>
                        )}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Targeted Area</Label>
                      <Input
                        name="targetedArea"
                        value={patientForm.targetedArea}
                        onChange={handleFormChange}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-7">
                  <AccordionTrigger>HOD Notes</AccordionTrigger>
                  <AccordionContent>
                    <textarea
                      name="hodNotes"
                      rows={3}
                      className="w-full p-2 border rounded-md"
                      value={patientForm.hodNotes}
                      onChange={handleFormChange}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="space-y-2 pt-4">
                <Label>Upload Documents</Label>
                <Input
                  type="file"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current.click()}
                  className="w-full sm:w-auto"
                >
                  <Upload size={16} className="mr-2" /> Attach File
                </Button>
                <div className="mt-2 space-y-1">
                  {patientForm.documents.map((doc, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm text-gray-600 break-all"
                    >
                      <Paperclip size={14} /> {doc}
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter className="pt-4 flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFormOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button type="submit" className="w-full sm:w-auto">
                  {editingPatient ? "Save Changes" : "Create Patient"}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAssignPhysioOpen} onOpenChange={setIsAssignPhysioOpen}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[95vh] flex flex-col p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>
              Assign Physio & Plan for {assigningPatient?.patientName}
            </DialogTitle>
            <DialogDescription>
              Schedule sessions, set goals, and configure travel details.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-1 sm:pr-4">
            <form
              onSubmit={handleAssignPhysioSubmit}
              className="space-y-4 pt-4"
            >
              <Accordion
                type="multiple"
                defaultValue={["plan", "travel"]}
                className="w-full"
              >
                <AccordionItem value="plan">
                  <AccordionTrigger>Treatment Plan</AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label>Assign Physiotherapist</Label>
                      <Select
                        onValueChange={(v) =>
                          setAssignForm((p) => ({ ...p, physioId: v }))
                        }
                        value={assignForm.physioId}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a physiotherapist" />
                        </SelectTrigger>
                        <SelectContent>
                          {physios.map((p) => (
                            <SelectItem key={p._id} value={p._id.toString()}>
                              {p.physioName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Session Start Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !assignForm.sessionStartDate &&
                                  "text-muted-foreground",
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {assignForm.sessionStartDate ? (
                                format(assignForm.sessionStartDate, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={assignForm.sessionStartDate}
                              onSelect={(d) =>
                                setAssignForm((p) => ({
                                  ...p,
                                  sessionStartDate: d,
                                }))
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sessionTime">Session Time</Label>
                        <Input
                          id="sessionTime"
                          type="time"
                          value={assignForm.sessionTime}
                          onChange={(e) =>
                            setAssignForm((p) => ({
                              ...p,
                              sessionTime: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="totalSessionDays">
                          Total Session Days
                        </Label>
                        <Input
                          id="totalSessionDays"
                          type="number"
                          onWheel={(e) => {
                            e.target.blur();
                          }}
                          placeholder="e.g., 30"
                          value={assignForm.totalSessionDays}
                          onChange={(e) =>
                            setAssignForm((p) => ({
                              ...p,
                              totalSessionDays: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reviewFrequency">
                          Review Frequency (in days)
                        </Label>
                        <Input
                          id="reviewFrequency"
                          type="number"
                          onWheel={(e) => {
                            e.target.blur();
                          }}
                          placeholder="e.g., 15"
                          value={assignForm.reviewFrequency}
                          onChange={(e) =>
                            setAssignForm((p) => ({
                              ...p,
                              reviewFrequency: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="travel">
                  <AccordionTrigger>Travel Details</AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="visitOrder">Visit Order</Label>
                      <Input
                        id="visitOrder"
                        type="number"
                        onWheel={(e) => {
                          e.target.blur();
                        }}
                        min="1"
                        placeholder="e.g., 1 for first visit"
                        value={assignForm.visitOrder}
                        onChange={(e) =>
                          setAssignForm((p) => ({
                            ...p,
                            visitOrder: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="KmsfromHub">Kms from Hub</Label>
                      <Input
                        id="KmsfromHub"
                        type="number"
                        onWheel={(e) => {
                          e.target.blur();
                        }}
                        placeholder="Distance from hub to first patient"
                        value={assignForm.KmsfromHub}
                        onChange={(e) =>
                          setAssignForm((p) => ({
                            ...p,
                            KmsfromHub: e.target.value,
                          }))
                        }
                      />
                    </div>

                    {assignForm.visitOrder > 1 && (
                      <div className="space-y-2">
                        <Label htmlFor="kmsFromPrevious">
                          Kms from Previous Appointment
                        </Label>
                        <Input
                          id="kmsFromPrevious"
                          type="number"
                          onWheel={(e) => {
                            e.target.blur();
                          }}
                          placeholder="Distance from previous patient"
                          value={assignForm.kmsFromPrevious}
                          onChange={(e) =>
                            setAssignForm((p) => ({
                              ...p,
                              kmsFromPrevious: e.target.value,
                            }))
                          }
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="KmsfLPatienttoHub">
                        Kms from Last Patient to Hub
                      </Label>
                      <Input
                        id="KmsfLPatienttoHub"
                        type="number"
                        onWheel={(e) => {
                          e.target.blur();
                        }}
                        placeholder="Distance for return trip"
                        value={assignForm.KmsfLPatienttoHub}
                        onChange={(e) =>
                          setAssignForm((p) => ({
                            ...p,
                            KmsfLPatienttoHub: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <DialogFooter className="pt-4 flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAssignPhysioOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button type="submit" className="w-full sm:w-auto">
                  Assign & Save Plan
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={openDialog} onOpenChange={setOpendialog}>
        <AlertDialogContent className="w-[95vw] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark{" "}
              <strong>{pendingPatient?.patientName}</strong> as{" "}
              {!pendingPatient?.isConsentReceived
                ? "Consent Received"
                : "Not Consent Received"}
              ?
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              className="w-full sm:w-auto"
              onClick={() => handleConsentToggle(pendingPatient)}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={openAlert} onOpenChange={setOpenAlert}>
        <AlertDialogContent className="w-[95vw] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>

            <AlertDialogDescription className="space-y-3">
              <div>
                Are you sure you want to mark{" "}
                <strong>{pendingPatient?.patientName}</strong> as{" "}
                {!pendingPatient?.isRecovered ? "Recovered" : "Not Recovered"}?
              </div>

              {!pendingPatient?.isRecovered && (
                <>
                  <div className="space-y-1">
                    <Label>Recovered Type</Label>

                    <Select
                      value={recoveredType}
                      onValueChange={(value) => setRecoveredType(value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value="Patient Recovered">
                          Patient Recovered
                        </SelectItem>
                        <SelectItem value="Other">Stop</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {recoveredType === "Other" && (
                    <div className="space-y-1">
                      <Label>Stop Reason</Label>
                      <Input
                        type="text"
                        className="w-full border rounded px-2 py-1"
                        placeholder="Enter stop reason"
                        value={otherReason}
                        onChange={(e) => setOtherReason(e.target.value)}
                      />
                    </div>
                  )}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel
              className="w-full sm:w-auto"
              onClick={() => {
                setRecoveredType("");
                setOtherReason("");
                setPendingPatient(null);
                setOpenAlert(false);
              }}
            >
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              className="w-full sm:w-auto"
              disabled={
                !pendingPatient?.isRecovered &&
                (!recoveredType ||
                  (recoveredType === "Other" && !otherReason.trim()))
              }
              onClick={async () => {
                try {
                  // ACTIVE -> MARK AS RECOVERED
                  if (!pendingPatient?.isRecovered) {
                    await apiRequest("Patient/updatePatient", {
                      method: "POST",
                      body: JSON.stringify({
                        _id: pendingPatient._id,
                        isRecovered: true,
                        recoveredType,
                        stopReason:
                          recoveredType === "Other" ? otherReason : null,
                      }),
                    });

                    toast({
                      title: "Recovered",
                      description: `${pendingPatient.patientName} marked as recovered.`,
                    });
                  } else {
                    // ALREADY RECOVERED -> OPEN FRESH / CONTINUE DIALOG
                    setSelectedPatientForRecovery(pendingPatient);
                    setOpenRecoveryChoice(true);
                  }

                  setRecoveredType("");
                  setOtherReason("");
                  setOpenAlert(false);
                  setPendingPatient(null);
                  getAllPatient();
                } catch (error) {
                  toast({
                    title: "Error",
                    description:
                      error?.message || "Failed to update patient status.",
                    variant: "destructive",
                  });
                }
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog open={openRecoveryChoice} onOpenChange={setOpenRecoveryChoice}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choose Recovery Option</DialogTitle>
            <DialogDescription>
              This patient already has old treatment history. What do you want
              to do?
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-4">
            <Button
              onClick={() => handleRecoveryOption("fresh")}
              className="w-full"
            >
              Start Fresh
            </Button>

            <Button
              variant="outline"
              onClick={() => handleRecoveryOption("continue")}
              className="w-full"
            >
              Continue Old
            </Button>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setOpenRecoveryChoice(false);
                setSelectedPatientForRecovery(null);
              }}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PatientManagement;
