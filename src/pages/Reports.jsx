import React, { useState, useEffect, useMemo } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import AnimatedNumber from "@/components/CustomComponents/AnimatedNumber";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import logo from "@/Assets/images/logo_png.png";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/components/CustomComponents/apiRequest";
import {
  Download,
  Calendar,
  Users,
  TrendingUp,
  BookUser,
  User,
  DollarSign,
  Wallet,
  Activity,
  CheckSquare,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Legend as ChartLegend,
  Tooltip as ChartTooltip,
} from "chart.js";
ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  ChartLegend,
  ChartTooltip,
);

function StatBox({ label, value, bg, text }) {
  return (
    <div
      className={`rounded-xl ${bg} p-2 sm:p-3 flex flex-col justify-center border border-black/5`}
    >
      <p className="text-[10px] sm:text-xs text-gray-500 font-medium leading-tight mb-1">
        {label}
      </p>
      <p className={`text-base sm:text-lg font-extrabold ${text} leading-none`}>
        <AnimatedNumber value={value} />
      </p>
    </div>
  );
}

const Reports = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  const [consultations, setConsultations] = useState([]);
  const [selectedReference, setSelectedReference] = useState("all");
  const [selectedPhysio, setSelectedPhysio] = useState("all");
  const [reviews, setReviews] = useState([]);
  const [referenceList, setReferenceList] = useState([]);
  const [expensesData, setExpensesData] = useState([]);
  const [physioList, setPhysioList] = useState([]);
  console.log(currentMonth, "currentMonth");
  const [selectedMonth, setSelectedMonth] = useState(String(currentMonth));
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [sessions, setSessions] = useState([]);
  const [patientList, setPatientList] = useState([]);
  const [leaveData, setLeaveData] = useState([]);
  const [todaySessionCount, setTodaySessionCount] = useState(0);
  // useEffect(() => {
  //   const now = new Date();
  //   setSelectedMonth(String(now.getMonth())); // FIX
  //   setSelectedYear(String(now.getFullYear()));
  // }, []);
  const physioOptions = useMemo(() => {
    return physioList
      .map((physio) => ({
        _id: String(physio?._id || ""),
        physioName: physio?.physioName || "Unknown",
        roleName:
          physio?.roleId?.RoleName ||
          physio?.roleName ||
          physio?.role ||
          physio?.userRole ||
          physio?.designation ||
          "",
      }))
      .filter((physio) => physio._id)
      .sort((a, b) => a.physioName.localeCompare(b.physioName));
  }, [physioList]);
  // ---------------------------
  // Patient helpers
  // ---------------------------
  const getPatientReferenceId = (patient) => {
    return patient?.ReferenceId?._id || patient?.ReferenceId || null;
  };

  const getPatientReferenceName = (patient) => {
    return patient?.ReferenceId?.sourceName || "N/A";
  };

  const getPatientPhysioId = (patient) => {
    return patient?.physioId?._id || patient?.physioId || null;
  };

  const getPatientPhysioName = (patient) => {
    return patient?.physioId?.physioName || "Unassigned";
  };

  const selectedPhysioDetails = useMemo(() => {
    return physioOptions.find(
      (phy) => String(phy._id) === String(selectedPhysio),
    );
  }, [physioOptions, selectedPhysio]);

  const normalizedRoleName = useMemo(() => {
    return String(selectedPhysioDetails?.roleName || "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }, [selectedPhysioDetails]);

  const isHodSelected = useMemo(() => {
    return (
      String(selectedPhysio).trim() !== "all" &&
      ["hod", "head of department", "head"].includes(normalizedRoleName)
    );
  }, [selectedPhysio, normalizedRoleName]);

  // True when the LOGGED-IN user is a HOD — hide all financial data for them
  const isHodUser = useMemo(() => {
    const role = String(user?.role || "").trim().toLowerCase();
    return ["hod", "head of department", "head"].includes(role);
  }, [user]);

  const normalize = (val) =>
    String(val || "")
      .trim()
      .toLowerCase();
  // ---------------------------
  // Derived data
  // ---------------------------

  const getReviewPhysioId = (review) => {
    return review?.physioId?._id || review?.physioId || null;
  };

  const getReviewPhysioName = (review) => {
    return review?.physioId?.physioName || "Unknown";
  };

  const getReviewPatientName = (review) => {
    return review?.patientId?.patientName || review?.patientName || "N/A";
  };

  const getReviewPatientCode = (review) => {
    return review?.patientId?.patientCode || review?.patientCode || "N/A";
  };

  const getReviewReferenceId = (review) => {
    return (
      review?.sourceId?._id ||
      review?.sourceId ||
      review?.referenceId?._id ||
      review?.referenceId ||
      review?.patientId?.ReferenceId?._id ||
      review?.patientId?.ReferenceId ||
      null
    );
  };

  const getReviewReferenceName = (review) => {
    return (
      review?.sourceId?.sourceName ||
      review?.referenceId?.sourceName ||
      review?.patientId?.ReferenceId?.sourceName ||
      "N/A"
    );
  };

  const getReviewDate = (review) => {
    return review?.reviewDate || review?.createdAt || null;
  };

  const getReviewStatusName = (review) => {
    return (
      review?.reviewStatusId?.reviewStatusName ||
      review?.reviewStatus ||
      review?.status ||
      "Pending"
    );
  };

  // ---------------------------
  // Session helpers
  // ---------------------------
  const getSessionReferenceId = (session) => {
    return (
      session?.sourceId?._id ||
      session?.sourceId ||
      session?.referenceId?._id ||
      session?.referenceId ||
      session?.leadId?.sourceId?._id ||
      session?.leadId?.sourceId ||
      session?.patientId?.sourceId?._id ||
      session?.patientId?.sourceId ||
      session?.patientId?.ReferenceId?._id ||
      session?.patientId?.ReferenceId ||
      null
    );
  };

  const getSessionPhysioId = (session) => {
    return session?.physioId?._id || session?.physioId || null;
  };

  const getSessionPhysioName = (session) => {
    return session?.physioId?.physioName || "Unassigned";
  };

  const getSessionPatientId = (session) => {
    return session?.patientId?._id || session?.patientId || null;
  };
  // ---------------------------
  // Leave helpers
  // ---------------------------
  const getLeavePhysioId = (leave) => {
    return leave?.physioId?._id || leave?.physioId || null;
  };

  const getLeavePhysioName = (leave) => {
    return leave?.physioId?.physioName || "Unknown Physio";
  };

  const getLeaveDate = (leave) => {
    return leave?.LeaveDate || null;
  };

  const getLeaveMode = (leave) => {
    return leave?.LeaveMode || "Full Day";
  };

  const getLeaveStatus = (leave) => {
    return leave?.isActive ? "Active" : "Inactive";
  };

  const getLeaveDaysCount = (leave) => {
    const mode = String(leave?.LeaveMode || "").toLowerCase();
    return mode.includes("half") ? 0.5 : 1;
  };

  const getReassignedCount = (leave) => {
    return Array.isArray(leave?.SessionGenerateForLeave)
      ? leave.SessionGenerateForLeave.length
      : 0;
  };
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (!s.sessionDate) return false;

      const d = new Date(s.sessionDate);

      // ✅ Use UTC to avoid timezone bugs
      const matchesMonthYear =
        d.getUTCMonth() + 1 === Number(selectedMonth) &&
        d.getUTCFullYear() === Number(selectedYear);

      const matchesReference =
        selectedReference === "all" ||
        String(getSessionReferenceId(s) || "") === String(selectedReference);

      const matchesPhysio =
        selectedPhysio === "all" ||
        String(getSessionPhysioId(s) || "") === String(selectedPhysio);

      return matchesMonthYear && matchesReference && matchesPhysio;
    });
  }, [
    sessions,
    selectedMonth,
    selectedYear,
    selectedReference,
    selectedPhysio,
  ]);
  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      const reviewDate = getReviewDate(review);
      if (!reviewDate) return false;

      const d = new Date(reviewDate);

      const matchesMonthYear =
        d.getMonth() + 1 === Number(selectedMonth) &&
        d.getFullYear() === Number(selectedYear);

      const matchesReference =
        selectedReference === "all" ||
        String(getReviewReferenceId(review) || "") ===
          String(selectedReference);

      const matchesPhysio =
        isHodSelected ||
        selectedPhysio === "all" ||
        String(getReviewPhysioId(review) || "") === String(selectedPhysio);

      return matchesMonthYear && matchesReference && matchesPhysio;
    });
  }, [
    reviews,
    selectedMonth,
    selectedYear,
    selectedReference,
    selectedPhysio,
    isHodSelected,
  ]);

  const filteredExpenses = useMemo(() => {
    return expensesData.filter((exp) => {
      if (!exp.expenseDate) return false;
      const d = new Date(exp.expenseDate);

      return (
        d.getMonth() + 1 === Number(selectedMonth) &&
        d.getFullYear() === Number(selectedYear)
      );
    });
  }, [expensesData, selectedMonth, selectedYear]);

  const filteredPatientList = useMemo(() => {
    return patientList.filter((patient) => {
      const patientId = String(patient?._id || "");

      const matchesReference =
        selectedReference === "all" ||
        String(getPatientReferenceId(patient) || "") ===
          String(selectedReference);

      const matchesPhysio =
        selectedPhysio === "all" ||
        String(getPatientPhysioId(patient) || "") === String(selectedPhysio);

      if (!matchesReference || !matchesPhysio) return false;

      const hasSessionInSelectedMonth = sessions.some((session) => {
        const sessionPatientId = String(getSessionPatientId(session) || "");
        if (sessionPatientId !== patientId) return false;
        if (!session?.sessionDate) return false;

        const d = new Date(session.sessionDate);

        const matchesMonthYear =
          d.getMonth() + 1 === Number(selectedMonth) &&
          d.getFullYear() === Number(selectedYear);

        const matchesSessionReference =
          selectedReference === "all" ||
          String(getSessionReferenceId(session) || "") ===
            String(selectedReference);

        const matchesSessionPhysio =
          selectedPhysio === "all" ||
          String(getSessionPhysioId(session) || "") === String(selectedPhysio);

        return (
          matchesMonthYear && matchesSessionReference && matchesSessionPhysio
        );
      });

      return hasSessionInSelectedMonth;
    });
  }, [
    patientList,
    filteredSessions,
    selectedReference,
    selectedPhysio,
    selectedMonth,
    selectedYear,
  ]);

  const filteredLeaves = useMemo(() => {
    return leaveData.filter((leave) => {
      const matchesPhysio =
        selectedPhysio === "all" ||
        String(getLeavePhysioId(leave) || "") === String(selectedPhysio);

      if (!matchesPhysio) return false;

      const leaveDate = getLeaveDate(leave);
      if (!leaveDate) return false;

      const d = new Date(leaveDate);

      return (
        d.getMonth() + 1 === Number(selectedMonth) &&
        d.getFullYear() === Number(selectedYear)
      );
    });
  }, [leaveData, selectedPhysio, selectedMonth, selectedYear]);

  const addHeader = (doc, title) => {
    // Logo
    doc.addImage(logo, "PNG", 14, 5, 25, 15);

    // Title
    doc.setFontSize(16);
    doc.text(title, 45, 15);
  };
  const [stats, setStats] = useState([]);
  const getAllPatients = async () => {
    try {
      const res = await apiRequest("Patient/getAllPatient", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      if (Array.isArray(res)) {
        setPatientList(res);
      } else if (Array.isArray(res?.data)) {
        setPatientList(res.data);
      } else if (Array.isArray(res?.Patients)) {
        setPatientList(res.Patients);
      } else if (Array.isArray(res?.patients)) {
        setPatientList(res.patients);
      } else {
        setPatientList([]);
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
      setPatientList([]);
    }
  };

  const getSession = async () => {
    try {
      const storedRole = localStorage.getItem("userRole");

      const payload =
        storedRole === "Physio"
          ? {
              physioId: user?._id,
              storedRole,
              month: Number(selectedMonth),
              year: Number(selectedYear),
            }
          : {
              storedRole,
              month: Number(selectedMonth),
              year: Number(selectedYear),
            };

      const response = await apiRequest("Session/getSessionsByMonthYear", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      console.log("PAYLOAD:", payload);
      console.log("RESPONSE:", response);
      const sessionData = Array.isArray(response?.data) ? response.data : [];
      console.log(sessionData.length, "sessionData");
      setSessions(sessionData);

      // ✅ Today count (still useful)
      const today = new Date().toISOString().split("T")[0];

      const todaySessions = sessionData.filter((s) => {
        if (!s.sessionDate) return false;

        const sessionDay = new Date(s.sessionDate).toISOString().split("T")[0];

        return sessionDay === today;
      });

      setTodaySessionCount(todaySessions.length);

      processDashboardData(sessionData);
    } catch (error) {
      console.error("❌ Error fetching sessions:", error);
      console.log("⚠️ Overwriting sessions with EMPTY array");
      // setSessions([]);
    }
  };
  useEffect(() => {
    console.log("UPDATED sessions:", sessions);
  }, [sessions]);
  useEffect(() => {
    AOS.init({ duration: 700, once: true, easing: "ease-out-cubic" });
    getAllPatients();
  }, []);
  useEffect(() => {
    if (selectedMonth && selectedYear) {
      getSession();
    }
  }, [selectedMonth, selectedYear]);
  const getAllExpenses = async () => {
    try {
      const res = await apiRequest("Expense/getAllExpense", {
        method: "POST",
      });

      if (Array.isArray(res?.data)) {
        setExpensesData(res.data);
      } else {
        setExpensesData([]);
      }
    } catch (error) {
      console.error("Error fetching expenses:", error);
      setExpensesData([]);
    }
  };
  const getallsummary = async () => {
    try {
      const res = await apiRequest("Dashboard/getReportsSummary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          month: Number(selectedMonth),
          year: Number(selectedYear),
          physioId: selectedPhysio,
          referenceId: selectedReference,
        }),
      });

      if (res?.stats) {
        setStats(res.stats); // 👈 THIS is what you need
      } else {
        setStats({});
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      setStats({});
    }
  };
  console.log(stats, "stats from report");

  useEffect(() => {
    if (selectedMonth && selectedYear) {
      getallsummary();
    }
  }, [selectedMonth, selectedYear, selectedPhysio, selectedReference]);

  const totalConsultations = consultations?.length || 0;
  const downloadFile = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);
  };
  const downloadReport = async (months, type) => {
    try {
      const payload = {
        months,
        type,
      };

      const blob = await apiRequest(
        "Report/exportHodPerformanceReport",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
        "blob",
      );

      const filename =
        type === "pdf"
          ? `HOD_Performance_${months}_Months.pdf`
          : `HOD_Performance_${months}_Months.xlsx`;

      downloadFile(blob, filename);
    } catch (error) {
      console.error("Download error:", error);
    }
  };
  const exportPhysioPerformancePDF = async (months, selectedPhysio) => {
    try {
      const blob = await apiRequest(
        "Report/exportPhysioPerformanceReport",
        {
          method: "POST",
          body: JSON.stringify({
            months,
            physioId: selectedPhysio,
            type: "pdf",
          }),
        },
        "blob",
      );

      downloadFile(blob, `Physio_Performance_${months}_Months.pdf`);
    } catch (error) {
      console.error("Physio PDF download error:", error);
    }
  };

  const exportPhysioPerformanceExcel = async (months, selectedPhysio) => {
    try {
      const blob = await apiRequest(
        "Report/exportPhysioPerformanceReport",
        {
          method: "POST",
          body: JSON.stringify({
            months,
            physioId: selectedPhysio,
            type: "excel",
          }),
        },
        "blob",
      );

      downloadFile(blob, `Physio_Performance_${months}_Months.xlsx`);
    } catch (error) {
      console.error("Physio Excel download error:", error);
    }
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

  const years = [];
  for (let y = currentYear - 5; y <= currentYear + 2; y++) {
    years.push(String(y));
  }

  const PIE_COLORS = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#06b6d4",
    "#f97316",
    "#a855f7",
    "#14b8a6",
    "#ec4899",
  ];

  const [pincodeChartType, setPincodeChartType] = useState("bar");


  const pincodeData = useMemo(() => {
    const map = {};
    patientList.forEach((p) => {
      const pin =
        p.patientPinCode?.trim() ||
        p.patientAddress?.trim() ||
        "Unknown";
      map[pin] = (map[pin] || 0) + 1;
    });
    return Object.entries(map)
      .map(([pincode, count]) => ({ pincode, count }))
      .sort((a, b) => b.count - a.count);
  }, [patientList]);

  const formatDate = (date) => {
    if (!date) return "N/A";
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "N/A";
    return parsed.toLocaleDateString("en-GB");
  };

  const getCompletionPercentage = (completed, total) => {
    if (!total) return 0;
    return ((completed / total) * 100).toFixed(2);
  };

  // ---------------------------
  // API calls
  // ---------------------------

  const getAllReference = async (data) => {
    try {
      const response = await apiRequest("References/getALLReferences", {
        method: "POST",
        body: JSON.stringify(data || {}),
      });

      if (Array.isArray(response)) {
        setReferenceList(response);
      } else if (Array.isArray(response?.data)) {
        setReferenceList(response.data);
      } else {
        setReferenceList([]);
      }
    } catch (error) {
      console.error("Error fetching references:", error);
      setReferenceList([]);
    }
  };

  const getAllPhysio = async () => {
    try {
      const res = await apiRequest("Physio/getAllPhysio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      if (Array.isArray(res)) {
        setPhysioList(res);
      } else if (Array.isArray(res?.data)) {
        setPhysioList(res.data);
      } else if (Array.isArray(res?.physios)) {
        setPhysioList(res.physios);
      } else if (Array.isArray(res?.report)) {
        setPhysioList(res.report);
      } else {
        setPhysioList([]);
      }
    } catch (error) {
      console.error("Error fetching physios:", error);
      setPhysioList([]);
    }
  };

  const getAllLeaves = async () => {
    try {
      const res = await apiRequest("LeaveControllers/getAllLeave", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      if (Array.isArray(res)) {
        setLeaveData(res);
      } else if (Array.isArray(res?.Leaves)) {
        setLeaveData(res.Leaves);
      } else if (Array.isArray(res?.data)) {
        setLeaveData(res.data);
      } else {
        setLeaveData([]);
      }
    } catch (error) {
      console.error("Error fetching leave data:", error);
      setLeaveData([]);
    }
  };

  useEffect(() => {
    getAllReference();
    getAllLeaves();
    getAllPhysio();
    getAllExpenses();
  }, []);

  const totalLeaveDays = useMemo(() => {
    return filteredLeaves.reduce((sum, leave) => {
      return sum + getLeaveDaysCount(leave);
    }, 0);
  }, [filteredLeaves]);

  const incomeExpensePieData = useMemo(() => {
    return [
      {
        name: "Income",
        value: Number(stats?.monthlyRevenue || 0),
      },
      {
        name: "Expense",
        value: Number(stats?.totalExpense || 0),
      },
    ];
  }, [stats]);
  const expensePieData = useMemo(() => {
    const map = {};

    filteredExpenses.forEach((exp) => {
      const key =
        exp?.ExpenseCategoryId?.ExpenseCategoryName ||
        exp?.ExpenseTypeID?.ExpenseTypeName ||
        "Others";

      map[key] = (map[key] || 0) + Number(exp.expenseAmount || 0);
    });

    return Object.entries(map).map(([name, value]) => ({
      name,
      value,
    }));
  }, [filteredExpenses]);
  const physioWiseData = useMemo(() => {
    const grouped = {};

    const normalizeId = (id) => (id ? String(id) : "unassigned");

    // ---------------- PATIENTS ----------------
    filteredPatientList.forEach((patient) => {
      const physioId = normalizeId(getPatientPhysioId(patient));
      const physioName = getPatientPhysioName(patient) || "Unassigned";

      // 🔥 derive recovery status (adjust field if needed)
      const isRecovered =
        patient?.patientStatus?.toLowerCase?.() === "recovered" ||
        patient?.isRecovered === true;

      if (!grouped[physioId]) {
        grouped[physioId] = {
          physioId,
          physioName,
          assignedPatients: [],
          patientIds: new Set(),

          // session buckets
          completedSessions: 0,
          cancelledSessions: 0,
          otherSessions: 0,

          // leaves
          leaveDays: 0,
          leaveCount: 0,
          leaveEntries: [],
        };
      }

      const patientId = normalizeId(patient?._id);

      if (!grouped[physioId].patientIds.has(patientId)) {
        grouped[physioId].patientIds.add(patientId);

        // ✅ attach recovery flag for UI
        grouped[physioId].assignedPatients.push({
          ...patient,
          isRecovered,
        });
      }
    });

    // ---------------- SESSIONS ----------------
    filteredSessions.forEach((session) => {
      const physioId = normalizeId(getSessionPhysioId(session));
      const physioName = getSessionPhysioName(session) || "Unassigned";

      if (!grouped[physioId]) {
        grouped[physioId] = {
          physioId,
          physioName,
          assignedPatients: [],
          patientIds: new Set(),

          completedSessions: 0,
          cancelledSessions: 0,
          otherSessions: 0,

          leaveDays: 0,
          leaveCount: 0,
          leaveEntries: [],
        };
      }

      const status = String(session?.sessionStatusId?.sessionStatusName || "")
        .trim()
        .toLowerCase();

      const isCompleted = status === "completed" || status === "recovered";

      const isCancelled = status.includes("cancel");

      // strict bucketing
      if (isCompleted) {
        grouped[physioId].completedSessions++;
      } else if (isCancelled) {
        grouped[physioId].cancelledSessions++;
      } else {
        grouped[physioId].otherSessions++;
      }
    });

    // ---------------- LEAVES ----------------
    filteredLeaves.forEach((leave) => {
      const physioId = normalizeId(getLeavePhysioId(leave));
      const physioName = getLeavePhysioName(leave) || "Unassigned";

      if (!grouped[physioId]) {
        grouped[physioId] = {
          physioId,
          physioName,
          assignedPatients: [],
          patientIds: new Set(),

          completedSessions: 0,
          cancelledSessions: 0,
          otherSessions: 0,

          leaveDays: 0,
          leaveCount: 0,
          leaveEntries: [],
        };
      }

      grouped[physioId].leaveDays += getLeaveDaysCount(leave);
      grouped[physioId].leaveCount++;
      grouped[physioId].leaveEntries.push(leave);
    });

    // ---------------- FINAL ----------------
    return Object.values(grouped)
      .map((item) => {
        const totalSessions =
          item.completedSessions + item.cancelledSessions + item.otherSessions;

        return {
          ...item,
          totalSessions,

          totalAssignedPatients: item.patientIds.size,

          completionPercentage:
            totalSessions > 0
              ? ((item.completedSessions / totalSessions) * 100).toFixed(2)
              : "0.00",
        };
      })
      .sort((a, b) => a.physioName.localeCompare(b.physioName));
  }, [filteredPatientList, filteredSessions, filteredLeaves]);
  console.log(physioWiseData, "physioWiseData");
  const selectedReferenceName =
    selectedReference === "all"
      ? "All References"
      : referenceList.find(
          (ref) => String(ref._id) === String(selectedReference),
        )?.sourceName || "Reference";

  const selectedPhysioName =
    selectedPhysio === "all"
      ? "All Physios"
      : physioOptions.find((phy) => String(phy._id) === String(selectedPhysio))
          ?.physioName || "Physio";

  const selectedMonthName = `${monthNames[Number(selectedMonth) - 1]} ${selectedYear}`;

  // ---------------------------
  // Export functions
  // ---------------------------

  const handleExportHodReviewXLSX = async () => {
    try {
      const payload = {
        physioId: selectedPhysio === "all" ? null : selectedPhysio,
        referenceId: selectedReference === "all" ? null : selectedReference,
        month: selectedMonth,
        year: selectedYear,
        type: "excel",
      };

      const blob = await apiRequest(
        "Report/exportHodReviewReport",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
        "blob",
      );

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `HOD_Review_Report_${selectedMonth}_${selectedYear}.xlsx`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Excel Download Error:", error);
    }
  };

  const handleExportHodReviewPDF = async () => {
    try {
      const payload = {
        physioId: selectedPhysio === "all" ? null : selectedPhysio,
        referenceId: selectedReference === "all" ? null : selectedReference,
        month: selectedMonth,
        year: selectedYear,
        type: "pdf",
      };

      const blob = await apiRequest(
        "Report/exportHodReviewReport",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
        "blob",
      );

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `HOD_Review_Report_${selectedMonth}_${selectedYear}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF Download Error:", error);
    }
  };

  const handleExportPatientListPDF = async () => {
    try {
      const payload = {
        physioId: selectedPhysio === "all" ? null : selectedPhysio,
        referenceId: selectedReference === "all" ? null : selectedReference,
        month: selectedMonth, // ✅ ADD THIS
        year: selectedYear,
      };

      const blob = await apiRequest(
        "Report/downloadPatientListPDF",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
        "blob",
      );

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Patient_List_${selectedMonth}_${selectedYear}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF Download Error:", error);
    }
  };
  const handleExportPatientListXLSX = async () => {
    try {
      const payload = {
        physioId: selectedPhysio === "all" ? null : selectedPhysio,
        referenceId: selectedReference === "all" ? null : selectedReference,
        month: selectedMonth, // ✅ ADD THIS
        year: selectedYear,
      };

      const blob = await apiRequest(
        "Report/downloadPatientListXLSX",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
        "blob",
      );

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Patient_List_${selectedMonth}_${selectedYear}.xlsx`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("XLSX Download Error:", error);
    }
  };
  const handleExportCSV = async () => {
    try {
      const payload = {
        physioId: selectedPhysio === "all" ? null : selectedPhysio,
        referenceId: selectedReference === "all" ? null : selectedReference,
        month: Number(selectedMonth),
        year: Number(selectedYear),
      };

      const blob = await apiRequest(
        "Report/downloadReportCSV",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
        "blob",
      );

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `report_${selectedMonth}_${selectedYear}.csv`;

      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("CSV export failed:", err);
    }
  };

  const handleExportPDF = async () => {
    try {
      const payload = {
        physioId: selectedPhysio === "all" ? null : selectedPhysio,
        referenceId: selectedReference === "all" ? null : selectedReference,
        month: Number(selectedMonth),
        year: Number(selectedYear),
      };
      const blob = await apiRequest(
        "Report/downloadReportPDF",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
        "blob",
      );

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `report_${selectedMonth}_${selectedYear}.pdf`;

      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF export failed:", err);
    }
  };
  const handleExportPhysioWiseXLSX = async () => {
    const payload = {
      physioId: selectedPhysio === "all" ? null : selectedPhysio,
      referenceId: selectedReference === "all" ? null : selectedReference,
      month: Number(selectedMonth),
      year: Number(selectedYear),
    };

    const blob = await apiRequest(
      "Report/downloadPhysioWiseReportXLSX",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      "blob",
    );

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `Physio_Wise_Report_${selectedMonth}_${selectedYear}.xlsx`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);
  };
  const handleExportPhysioWisePDF = async () => {
    try {
      const payload = {
        month: Number(selectedMonth),
        year: Number(selectedYear),
        physioId: selectedPhysio === "all" ? null : selectedPhysio,
        referenceId: selectedReference === "all" ? null : selectedReference,
      };

      const blob = await apiRequest(
        "Report/downloadPhysioWiseReportPDF",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
        "blob",
      );

      if (!blob || blob.size === 0) {
        throw new Error("Empty PDF received");
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `Physio_Wise_Report_${selectedMonth}_${selectedYear}.pdf`;

      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF Export Error:", err);
    }
  };
  const handleExportHodCSV = async () => {
    try {
      const payload = {
        physioId: selectedPhysio === "all" ? null : selectedPhysio,
        referenceId: selectedReference === "all" ? null : selectedReference,
        month: Number(selectedMonth),
        year: Number(selectedYear),
        role: "HOD",
      };

      const blob = await apiRequest(
        "Report/downloadHODReportCSV",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
        "blob",
      );

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `HOD_Report_${selectedMonth}_${selectedYear}.csv`;

      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("CSV Export Error:", err);
    }
  };
  const handleExportHodPDF = async () => {
    try {
      const payload = {
        physioId: selectedPhysio === "all" ? null : selectedPhysio,
        referenceId: selectedReference === "all" ? null : selectedReference,
        month: Number(selectedMonth),
        year: Number(selectedYear),
        role: "HOD",
      };

      const blob = await apiRequest(
        "Report/downloadHODReportPDF",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
        "blob",
      );

      if (!blob || blob.size === 0) {
        throw new Error("Empty PDF received");
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `HOD_Report_${selectedMonth}_${selectedYear}.pdf`;

      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF Export Error:", err);
    }
  };
  const statCards = [
    !isHodSelected && {
      title: "Session Completion Rate (SCR)",
      value: `${getCompletionPercentage(
        stats.completedSessions,
        stats.totalSessions,
      )}%`,
      icon: TrendingUp,
      color: "text-sky-600",
      bgColor: "bg-sky-100",
    },
    isHodSelected && {
      title: "Review Completion Rate (SCR)",
      value: `${getCompletionPercentage(
        stats.completedReviews,
        stats.completedReviews + stats.pendingReviews,
      )}%`,
      icon: TrendingUp,
      color: "text-sky-600",
      bgColor: "bg-sky-100",
    },
    !isHodSelected && {
      title: "Total Patients",
      value: stats.totalActivePatients,
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },

    !isHodSelected && {
      title: "Total Recovered Patients",
      value: stats.totalRecoveredPatients,
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },

    !isHodSelected && {
      title: "Patient Recovered Patients",
      value: stats.patientRecoveredCount,
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },

    !isHodSelected && {
      title: "Other Recovered Patients",
      value: stats.otherReasonRecoveredCount,
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },

    // ✅ Hide when physio selected
    selectedPhysio === "all" && {
      title: "Total Physio",
      value: stats.totalPhysio,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },

    !isHodSelected && {
      title: "Total Sessions",
      value: stats.totalSessions,
      icon: Activity,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },

    !isHodSelected && {
      title: "Completed Sessions",
      value: stats.completedSessions,
      icon: CheckSquare,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
    },

    !isHodSelected && {
      title: "Cancelled Sessions",
      value: stats.cancelledSessions,
      icon: Calendar,
      color: "text-rose-600",
      bgColor: "bg-rose-100",
    },

    !isHodSelected && !isHodUser && {
      title: "Monthly Revenue",
      value: `₹${Number(stats.monthlyRevenue || 0).toLocaleString("en-IN")}`,
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },

    !selectedPhysio ||
      (!isHodSelected && !isHodUser && {
        title: "Monthly Expenses",
        value: `₹${Number(stats.totalExpense || 0).toLocaleString("en-IN")}`,
        icon: Wallet,
        color: "text-red-600",
        bgColor: "bg-red-100",
      }),

    // ✅ Hide reviews when physio selected
    !selectedPhysio ||
      (isHodSelected && {
        title: "Pending Reviews",
        value: stats.pendingReviews,
        icon: BookUser,
        color: "text-orange-600",
        bgColor: "bg-orange-100",
      }),
    !selectedPhysio ||
      (isHodSelected && {
        title: "Completed Reviews",
        value: stats.completedReviews,
        icon: TrendingUp,
        color: "text-cyan-600",
        bgColor: "bg-cyan-100",
      }),
    !selectedPhysio ||
      (isHodSelected && {
        title: "Consultation From Leads",
        value: stats.consultationsFromLeads,
        icon: Calendar,
        color: "text-cyan-600",
        bgColor: "bg-cyan-100",
      }),
    !selectedPhysio ||
      (isHodSelected && {
        title: "Consultation to Patients Rate",
        value: `${stats.leadConversionRatess}%`,
        icon: Calendar,
        color: "text-cyan-600",
        bgColor: "bg-cyan-100",
      }),

    !isHodSelected && {
      title: "Today Session Count",
      value: stats.todaySession,
      icon: Calendar,
      color: "text-lime-600",
      bgColor: "bg-lime-100",
    },

    !isHodSelected && {
      title: "Avg Patient / Physio",
      value:
        stats.totalPhysio > 0
          ? (stats.totalActivePatients / stats.totalPhysio).toFixed(1)
          : 0,
      icon: Users,
      color: "text-violet-600",
      bgColor: "bg-violet-100",
    },
  ].filter(Boolean); // 🔥 removes false values
  const [months, setMonths] = useState(1);

  return (
    <div className="space-y-6 p-2 md:p-0">
      <div className="flex flex-col space-y-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">
            Reports & Analytics
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            Comprehensive insights and performance metrics
          </p>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <Select
            value={selectedReference}
            onValueChange={setSelectedReference}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select Reference" />
            </SelectTrigger>
            <SelectContent className="z-[99999] max-h-72 overflow-auto bg-white border shadow-lg">
              <SelectItem value="all">All References</SelectItem>
              {referenceList.map((ref) => (
                <SelectItem key={ref._id} value={String(ref._id)}>
                  {ref.sourceName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedPhysio} onValueChange={setSelectedPhysio}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select Physio" />
            </SelectTrigger>
            <SelectContent className="z-[99999] max-h-72 overflow-auto bg-white border shadow-lg">
              <SelectItem value="all">All Physios</SelectItem>
              {physioOptions.map((phy) => (
                <SelectItem key={phy._id} value={String(phy._id)}>
                  {phy.physioName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select Month" />
            </SelectTrigger>
            <SelectContent className="z-[99999] max-h-72 overflow-auto bg-white border shadow-lg">
              {monthNames.map((month, index) => (
                <SelectItem key={month} value={String(index + 1)}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent className="z-[99999] max-h-72 overflow-auto bg-white border shadow-lg">
              {years.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!isHodSelected && (
            <div className="flex gap-3 items-center">
              <label>Select Months:</label>

              <input
                type="number"
                min="1"
                max="12"
                value={months}
                onChange={(e) => setMonths(Number(e.target.value))}
                className="border p-2 w-20"
              />

              <button
                onClick={() =>
                  exportPhysioPerformancePDF(months, selectedPhysio)
                }
              >
                Download PDF
              </button>

              <button
                onClick={() =>
                  exportPhysioPerformanceExcel(months, selectedPhysio)
                }
              >
                Download Excel
              </button>
            </div>
          )}
          {isHodSelected && (
            <div className="flex gap-3 items-center">
              <label>HOD Performance Months:</label>

              <input
                type="number"
                min="1"
                max="12"
                value={months}
                onChange={(e) => setMonths(Number(e.target.value))}
                className="border p-2 w-20"
              />

              <Button onClick={() => downloadReport(months, "pdf")}>
                Download PDF
              </Button>

              <Button onClick={() => downloadReport(months, "excel")}>
                Download Excel
              </Button>
            </div>
          )}
          {isHodSelected ? (
            <>
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={handleExportHodReviewXLSX}
              >
                <Download className="h-4 w-4 mr-2" />
                Review XLSX
              </Button>
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={handleExportHodReviewPDF}
              >
                <Download className="h-4 w-4 mr-2" />
                Review PDF
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={handleExportPatientListXLSX}
              >
                <Download className="h-4 w-4 mr-2" />
                Patient XLSX
              </Button>
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={handleExportPatientListPDF}
              >
                <Download className="h-4 w-4 mr-2" />
                Patient PDF
              </Button>
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={handleExportPhysioWiseXLSX}
              >
                <Download className="h-4 w-4 mr-2" />
                Physio XLSX
              </Button>
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={handleExportPhysioWisePDF}
              >
                <Download className="h-4 w-4 mr-2" />
                Physio PDF
              </Button>
            </>
          )}
          {!isHodSelected && (
            <>
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={handleExportCSV}
              >
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={handleExportPDF}
              >
                <Download className="h-4 w-4 mr-2" />
                Report PDF
              </Button>
            </>
          )}
          {isHodSelected && (
            <div className="flex gap-3 mt-4">
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={handleExportHodPDF}
              >
                <Download className="h-4 w-4 mr-2" />
                Report PDF
              </Button>

              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={handleExportHodCSV}
              >
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              data-aos="fade-up"
              data-aos-delay={index * 100}
            >
              <Card className="medical-card hover:shadow-lg transition-shadow">
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
                    {monthNames[Number(selectedMonth) - 1]} {selectedYear}
                  </p>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div data-aos="fade-up" data-aos-delay="0">
          <Card className="medical-card hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                New Enquiries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-800">
                <AnimatedNumber value={stats.newEnquiries} />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {monthNames[Number(selectedMonth) - 1]} {selectedYear}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* <Card className="medical-card hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Consultations
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="text-2xl font-bold text-gray-800">
                {totalConsultations}
              </div>

              <p className="text-xs text-gray-500 mt-1">
                {monthNames[Number(selectedMonth) - 1]} {selectedYear}
              </p>
            </CardContent>
          </Card> */}

        <div data-aos="fade-up" data-aos-delay="100">
          <Card className="medical-card hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                New Consultations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-800">
                <AnimatedNumber value={stats.consultationsFromLeads} />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {monthNames[Number(selectedMonth) - 1]} {selectedYear}
              </p>
            </CardContent>
          </Card>
        </div>

        <div data-aos="fade-up" data-aos-delay="200">
          <Card className="medical-card hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                New Patients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-800">
                <AnimatedNumber value={stats.newPatients} />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {monthNames[Number(selectedMonth) - 1]} {selectedYear}
              </p>
            </CardContent>
          </Card>
        </div>

        <div data-aos="fade-up" data-aos-delay="300">
          <Card className="medical-card hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Lead Conversion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-800">
                <AnimatedNumber value={`${stats.leadConversionRate}%`} />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {monthNames[Number(selectedMonth) - 1]} {selectedYear}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {!isHodUser && <div
        data-aos="fade-up"
        className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6"
      >
        <Card className="medical-card">
          <CardHeader>
            <CardTitle>Monthly Financial Overview</CardTitle>
            <CardDescription>
              {monthNames[Number(selectedMonth - 1)]} {selectedYear}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="h-[260px] sm:h-[300px] md:h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={incomeExpensePieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={window.innerWidth < 640 ? 70 : 100}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {incomeExpensePieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>

                  <Tooltip
                    formatter={(value) =>
                      `₹${Number(value).toLocaleString("en-IN")}`
                    }
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="medical-card">
          <CardHeader>
            <CardTitle>Expense Breakdown</CardTitle>
            <CardDescription>
              Category-wise expense distribution
            </CardDescription>
          </CardHeader>

          <CardContent>
            {expensePieData.length === 0 ? (
              <p className="text-sm text-gray-500">
                No expense data for selected month
              </p>
            ) : (
              <div className="space-y-3">
                {expensePieData.map((item, index) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between gap-3 flex-wrap border rounded-lg p-3"
                  >
                    {/* Left side: category */}
                    <div className="flex items-center gap-3">
                      <span
                        className="w-4 h-4 rounded-full"
                        style={{
                          backgroundColor:
                            PIE_COLORS[index % PIE_COLORS.length],
                        }}
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {item.name}
                      </span>
                    </div>

                    {/* Right side: value */}
                    <span className="text-sm font-semibold text-gray-800">
                      ₹{Number(item.value).toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>}

      {/* Pincode / Area Distribution */}
      <div data-aos="fade-up">
        <Card className="medical-card">
          <CardHeader className="flex flex-row items-start justify-between gap-4 flex-wrap">
            <div>
              <CardTitle>Patient Distribution by Area / Pincode</CardTitle>
              <CardDescription>
                Grouped by pincode · falls back to address when pincode is
                blank · {pincodeData.length} area
                {pincodeData.length !== 1 ? "s" : ""} · {patientList.length}{" "}
                total patients
              </CardDescription>
            </div>
            <div className="flex gap-1 border rounded-lg p-0.5 bg-gray-50 self-start">
              <button
                onClick={() => setPincodeChartType("bar")}
                className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                  pincodeChartType === "bar"
                    ? "bg-white shadow text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Bar
              </button>
              <button
                onClick={() => setPincodeChartType("pie")}
                className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                  pincodeChartType === "pie"
                    ? "bg-white shadow text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Pie
              </button>
            </div>
          </CardHeader>

          <CardContent>
            {pincodeData.length === 0 ? (
              <p className="text-sm text-gray-500 py-6 text-center">
                No patient area data available
              </p>
            ) : pincodeChartType === "bar" ? (
              <div
                style={{
                  height: Math.max(220, pincodeData.length * 44),
                  minHeight: 220,
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={pincodeData}
                    margin={{ top: 4, right: 56, bottom: 4, left: 16 }}
                    barCategoryGap="30%"
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={false}
                      stroke="#f0f0f0"
                    />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: "#6b7280" }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <YAxis
                      dataKey="pincode"
                      type="category"
                      tickLine={false}
                      axisLine={false}
                      width={140}
                      tick={({ x, y, payload }) => {
                        const full = payload.value || "";
                        const label =
                          full.length > 20
                            ? full.slice(0, 18) + "…"
                            : full;
                        return (
                          <text
                            x={x}
                            y={y}
                            dy={4}
                            textAnchor="end"
                            fill="#374151"
                            fontSize={11}
                          >
                            {label}
                          </text>
                        );
                      }}
                    />
                    <Tooltip
                      cursor={{ fill: "#eff6ff" }}
                      formatter={(value) => [value, "Patients"]}
                      contentStyle={{
                        fontSize: 12,
                        borderRadius: 8,
                        border: "1px solid #e5e7eb",
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill="#3b82f6"
                      radius={[0, 4, 4, 0]}
                      maxBarSize={28}
                    >
                      <LabelList
                        dataKey="count"
                        position="right"
                        style={{
                          fontSize: 11,
                          fill: "#1d4ed8",
                          fontWeight: 600,
                        }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pincodeData}
                      dataKey="count"
                      nameKey="pincode"
                      cx="50%"
                      cy="50%"
                      outerRadius={window.innerWidth < 640 ? 80 : 110}
                      label={({ name, percent }) =>
                        percent > 0.04
                          ? `${name} (${(percent * 100).toFixed(0)}%)`
                          : ""
                      }
                      labelLine={false}
                    >
                      {pincodeData.map((_, i) => (
                        <Cell
                          key={`cell-${i}`}
                          fill={PIE_COLORS[i % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [value + " patients", name]}
                      contentStyle={{
                        fontSize: 12,
                        borderRadius: 8,
                        border: "1px solid #e5e7eb",
                      }}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: 11 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Summary table */}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Area / Pincode
                    </th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Patients
                    </th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Share
                    </th>
                    <th className="py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">
                      &nbsp;
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pincodeData.map((row, i) => (
                    <tr
                      key={row.pincode}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                      <td
                        className="py-2 px-3 font-medium text-gray-800 max-w-[200px]"
                        title={row.pincode}
                      >
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-full mr-2 align-middle shrink-0"
                          style={{
                            backgroundColor:
                              PIE_COLORS[i % PIE_COLORS.length],
                          }}
                        />
                        <span className="truncate">
                          {row.pincode.length > 28
                            ? row.pincode.slice(0, 26) + "…"
                            : row.pincode}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-semibold text-blue-600">
                        {row.count}
                      </td>
                      <td className="py-2 px-3 text-right text-gray-500">
                        {((row.count / patientList.length) * 100).toFixed(1)}%
                      </td>
                      <td className="py-2 px-3">
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full"
                            style={{
                              width: `${(row.count / pincodeData[0].count) * 100}%`,
                              backgroundColor:
                                PIE_COLORS[i % PIE_COLORS.length],
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {!isHodSelected && (
        <div>
          <Card className="medical-card border-none shadow-sm">
            <CardHeader className="px-4 py-5 sm:px-6">
              <CardTitle className="text-xl font-bold text-gray-900">
                Physio Wise Report View
              </CardTitle>
              <CardDescription className="text-sm">
                Assigned patients, session count, completed/canceled sessions,
                and leave details
              </CardDescription>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
              {physioWiseData.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-500 italic">
                  No physio-wise data available for selected filters.
                </div>
              ) : (
                <div className="space-y-8">
                  {physioWiseData.map((item) => (
                    <div
                      key={item.physioId}
                      className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm"
                    >
                      {/* Header Section: Name and Quick Stats */}
                      <div className="p-4 bg-slate-50/50 border-b border-slate-100">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                          <div>
                            <h3 className="text-lg font-bold text-gray-800">
                              {item.physioName}
                            </h3>
                            <p className="text-xs font-medium text-blue-600 uppercase tracking-wider">
                              {selectedMonthName}
                            </p>
                          </div>

                          {/* Responsive Stats Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 w-full lg:w-auto">
                            <StatBox
                              label="Assigned"
                              value={item.totalAssignedPatients}
                              bg="bg-blue-50"
                              text="text-blue-700"
                            />

                            <StatBox
                              label="Sessions"
                              value={item.totalSessions}
                              bg="bg-purple-50"
                              text="text-purple-700"
                            />

                            <StatBox
                              label="Completed"
                              value={item.completedSessions}
                              bg="bg-green-50"
                              text="text-green-700"
                            />
                            <StatBox
                              label="Canceled"
                              value={item.cancelledSessions}
                              bg="bg-red-50"
                              text="text-red-700"
                            />
                            <StatBox
                              label="Leave"
                              value={item.leaveDays}
                              bg="bg-yellow-50"
                              text="text-yellow-700"
                            />
                            <StatBox
                              label="SCR %"
                              value={`${item.completionPercentage ?? 0}%`}
                              bg="bg-cyan-50"
                              text="text-cyan-700"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="p-4 space-y-8">
                        {/* Patient Table Wrapper */}
                        <div>
                          <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                            <span className="w-1.5 h-4 bg-blue-500 rounded-full"></span>
                            Assigned Patients
                          </h4>
                          <div className="relative overflow-x-auto rounded-lg border border-slate-100">
                            <table className="min-w-[700px] w-full text-sm text-left border-collapse">
                              <thead className="bg-slate-50 text-slate-600 font-semibold border-b">
                                <tr>
                                  <th className="px-3 py-3 whitespace-nowrap">
                                    S.No
                                  </th>
                                  <th className="px-3 py-3 whitespace-nowrap">
                                    Code
                                  </th>
                                  <th className="px-4 py-3 min-w-[150px]">
                                    Patient Name
                                  </th>
                                  <th className="px-3 py-3 whitespace-nowrap">
                                    Mobile
                                  </th>
                                  <th className="px-4 py-3 min-w-[150px]">
                                    Condition
                                  </th>
                                  <th className="px-3 py-3 whitespace-nowrap">
                                    Reference
                                  </th>
                                  <th className="px-3 py-3 text-center">
                                    Sessions
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                {item.assignedPatients.length === 0 ? (
                                  <tr>
                                    <td
                                      colSpan={7}
                                      className="px-3 py-6 text-center text-gray-400 italic"
                                    >
                                      No assigned patients
                                    </td>
                                  </tr>
                                ) : (
                                  item.assignedPatients.map(
                                    (patient, index) => (
                                      <tr
                                        key={patient?._id || index}
                                        data-aos="fade-up"
                                        data-aos-delay={index * 60}
                                        className="hover:bg-slate-50/50 transition-colors"
                                      >
                                        <td className="px-3 py-3 text-gray-400">
                                          {index + 1}
                                        </td>
                                        <td className="px-3 py-3 font-mono text-xs text-gray-600">
                                          {patient?.patientCode || "N/A"}
                                        </td>
                                        <td className="px-4 py-3 font-semibold text-gray-800">
                                          {patient?.patientName || "N/A"}{" "}
                                          {patient.isRecovered
                                            ? " (Recovered)"
                                            : ""}
                                        </td>
                                        <td className="px-3 py-3 text-gray-600">
                                          {patient?.patientNumber || "N/A"}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                          {patient?.patientCondition || "N/A"}
                                        </td>
                                        <td className="px-3 py-3 text-gray-500">
                                          {getPatientReferenceName(patient)}
                                        </td>
                                        <td className="px-3 py-3 text-center font-bold text-blue-600">
                                          {
                                            sessions.filter(
                                              (s) =>
                                                String(
                                                  s?.patientId?._id ||
                                                    s?.patientId,
                                                ) === String(patient?._id) &&
                                                s?.sessionStatusId?.sessionStatusName?.toLowerCase() ===
                                                  "completed",
                                            ).length
                                          }
                                        </td>
                                      </tr>
                                    ),
                                  )
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Leave Details Wrapper */}
                        <div className="bg-yellow-50/30 p-4 rounded-xl border border-yellow-100/50">
                          <h4 className="text-sm font-bold text-yellow-800 mb-3 flex items-center gap-2">
                            <span className="w-1.5 h-4 bg-yellow-400 rounded-full"></span>
                            Leave Details
                          </h4>
                          <div className="relative overflow-x-auto rounded-lg border border-yellow-100 bg-white/50">
                            <table className="min-w-[700px] w-full text-sm text-left border-collapse">
                              <thead className="bg-yellow-100/50 text-yellow-900 font-bold border-b border-yellow-100">
                                <tr>
                                  <th className="px-3 py-2">S.No</th>
                                  <th className="px-3 py-2 whitespace-nowrap">
                                    Leave Date
                                  </th>
                                  <th className="px-3 py-2 whitespace-nowrap">
                                    Leave Mode
                                  </th>
                                  <th className="px-3 py-2">Paid</th>
                                  <th className="px-3 py-2">Status</th>
                                  <th className="px-3 py-2 text-center">
                                    Reassigned
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-yellow-100">
                                {item.leaveEntries.length === 0 ? (
                                  <tr>
                                    <td
                                      colSpan={6}
                                      className="px-3 py-4 text-center text-yellow-600/50 italic text-xs"
                                    >
                                      No leave found
                                    </td>
                                  </tr>
                                ) : (
                                  item.leaveEntries.map((leave, index) => (
                                    <tr
                                      key={leave?._id || index}
                                      data-aos="fade-up"
                                      data-aos-delay={index * 60}
                                      className="hover:bg-yellow-50/50 transition-colors"
                                    >
                                      <td className="px-3 py-2 text-yellow-700/60">
                                        {index + 1}
                                      </td>
                                      <td className="px-3 py-2 font-medium">
                                        {formatDate(getLeaveDate(leave))}
                                      </td>
                                      <td className="px-3 py-2">
                                        {getLeaveMode(leave)}
                                      </td>
                                      <td className="px-3 py-2">
                                        {leave?.PaidLeave ? "Yes" : "No"}
                                      </td>
                                      <td className="px-3 py-2 whitespace-nowrap">
                                        <span className="px-2 py-0.5 rounded-full bg-white border border-yellow-200 text-[10px] font-bold uppercase text-yellow-700">
                                          {getLeaveStatus(leave)}
                                        </span>
                                      </td>
                                      <td className="px-3 py-2 text-center font-bold text-yellow-800">
                                        {getReassignedCount(leave)}
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Reports;
