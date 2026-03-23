import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
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
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const Reports = () => {
  const { user } = useAuth();

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const [selectedReference, setSelectedReference] = useState("all");
  const [selectedPhysio, setSelectedPhysio] = useState("all");
  const [reviews, setReviews] = useState([]);
  const [referenceList, setReferenceList] = useState([]);
  const [expensesData, setExpensesData] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [patientList, setPatientList] = useState([]);
  const [leaveData, setLeaveData] = useState([]);
  const [todaySessionCount, setTodaySessionCount] = useState(0);

  const [stats, setStats] = useState({
    lead: 0,
    patient: 0,
    monthlySessions: 0,
    cancelledsession: 0,
    physio: 0,
    monthlyRevenue: 0,
    monthlyExpenses: 0,
    patientRecovered: 0,
    patientRecoveredOthers: 0,
    completedReview: 0,
    cancelledSessions: 0,
    patientRecover: 0,
    sessionCompleted: 0,
    pendingreviews: 0,
  });

  const [summary, setSummary] = useState({
    cancelledSessions: 0,
  });

  const [funnel, setFunnel] = useState({
    newEnquiries: 0,
    newConsultations: 0,
    newPatients: 0,
    conversionRate: 0,
  });

  const [selectedMonth, setSelectedMonth] = useState(String(currentMonth));
  const [selectedYear, setSelectedYear] = useState(String(currentYear));

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
  ];

  const formatDate = (date) => {
    if (!date) return "N/A";
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "N/A";
    return parsed.toLocaleDateString("en-GB");
  };

  const getCompletionPercentage = (completed, total) => {
    if (!total || Number(total) === 0) return 0;
    return ((Number(completed) / Number(total)) * 100).toFixed(2);
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

  // ---------------------------
  // API calls
  // ---------------------------
  const getAllReviews = async () => {
    try {
      const shouldFilterByPhysio = selectedPhysio !== "all" && !isHodSelected;

      const payload = {
        month: Number(selectedMonth) + 1,
        year: Number(selectedYear),
        ...(shouldFilterByPhysio ? { physioId: selectedPhysio } : {}),
        ...(selectedReference !== "all"
          ? { referenceId: selectedReference }
          : {}),
      };

      console.log("review payload", payload);

      const res = await apiRequest("Review/getAllReviewDownload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (Array.isArray(res)) {
        setReviews(res);
      } else if (Array.isArray(res?.report)) {
        setReviews(res.report);
      } else if (Array.isArray(res?.data)) {
        setReviews(res.data);
      } else {
        setReviews([]);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setReviews([]);
    }
  };
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
      } else {
        setPatientList([]);
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
      setPatientList([]);
    }
  };

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

  const getAllDashBoard = async () => {
    try {
      const response = await apiRequest("DashBoard/getAllDashBoard", {
        method: "POST",
        body: JSON.stringify({}),
      });
      setStats((prev) => ({ ...prev, ...response }));
    } catch (error) {
      console.error("Error:", error);
    }
  };
  const [physioList, setPhysioList] = useState([]);
  const getAllPhysio = async () => {
    try {
      const res = await apiRequest("Physio/getAllPhysio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      console.log("getAllPhysio response", res);

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
  const processDashboardData = (sessionsData) => {
    if (!Array.isArray(sessionsData)) return;

    const cancelledSessions = sessionsData.filter(
      (s) => s.sessionStatusId?.sessionStatusName === "Canceled",
    );

    setSummary({
      cancelledSessions: cancelledSessions.length,
    });
  };

  const getSession = async () => {
    try {
      const storedRole = localStorage.getItem("userRole");

      const payload =
        storedRole === "Physio"
          ? { physioId: user?._id, storedRole }
          : { storedRole };

      const response = await apiRequest("Session/getAllSession", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!Array.isArray(response)) {
        setSessions([]);
        return;
      }

      setSessions(response);

      const today = new Date().toISOString().split("T")[0];

      const todaySessions = response.filter((s) => {
        if (!s.sessionDate) return false;
        const sessionDay = new Date(s.sessionDate).toISOString().split("T")[0];
        return sessionDay === today;
      });

      setTodaySessionCount(todaySessions.length);
      processDashboardData(response);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      setSessions([]);
    }
  };

  const getMonthlyRevenue = async () => {
    try {
      const month = Number(selectedMonth);
      const year = Number(selectedYear);

      const fromDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
      const toDate = new Date(year, month + 1, 0).toISOString().split("T")[0];

      const res = await apiRequest("DashBoard/getIncomeByDate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fromDate, toDate }),
      });

      setStats((prev) => ({
        ...prev,
        monthlyRevenue: Number(res?.totalCompletedAmount || 0),
      }));
    } catch (error) {
      console.error("Error fetching monthly revenue:", error);
      setStats((prev) => ({
        ...prev,
        monthlyRevenue: 0,
      }));
    }
  };

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

  const funnelmonthly = async () => {
    try {
      const res = await apiRequest("DashBoard/monthlyfunnel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          month: Number(selectedMonth) + 1,
          year: Number(selectedYear),
        }),
      });

      setFunnel({
        newEnquiries: res?.newEnquiries?.length ?? 0,
        newConsultations: res?.newConsultations?.length ?? 0,
        newPatients: res?.newPatients?.length ?? 0,
        conversionRate:
          res?.newEnquiries?.length > 0
            ? (
                (res?.newPatients?.length / res?.newEnquiries?.length) *
                100
              ).toFixed(2)
            : 0,
      });
    } catch (error) {
      console.error("Funnel error:", error);
      setFunnel({
        newEnquiries: 0,
        newConsultations: 0,
        newPatients: 0,
        conversionRate: 0,
      });
    }
  };
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

  useEffect(() => {
    getAllDashBoard();
    getSession();
    getAllPatients();
    getAllReference();
    getAllExpenses();
    getAllLeaves();
    getAllPhysio();
  }, []);

  useEffect(() => {
    getAllReviews();
    funnelmonthly();
    getMonthlyRevenue();
  }, [selectedMonth, selectedYear, selectedPhysio, selectedReference]);

  // ---------------------------
  // Derived data
  // ---------------------------
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (!s.sessionDate) return false;
      const d = new Date(s.sessionDate);

      const matchesMonthYear =
        d.getMonth() === Number(selectedMonth) &&
        d.getFullYear() === Number(selectedYear);

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

  const filteredExpenses = useMemo(() => {
    return expensesData.filter((exp) => {
      if (!exp.expenseDate) return false;
      const d = new Date(exp.expenseDate);

      return (
        d.getMonth() === Number(selectedMonth) &&
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
          d.getMonth() === Number(selectedMonth) &&
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
    sessions,
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
        d.getMonth() === Number(selectedMonth) &&
        d.getFullYear() === Number(selectedYear)
      );
    });
  }, [leaveData, selectedPhysio, selectedMonth, selectedYear]);
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
  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      const reviewDate = getReviewDate(review);
      if (!reviewDate) return false;

      const d = new Date(reviewDate);

      const matchesMonthYear =
        d.getMonth() === Number(selectedMonth) &&
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
  const totalLeaveDays = useMemo(() => {
    return filteredLeaves.reduce((sum, leave) => {
      return sum + getLeaveDaysCount(leave);
    }, 0);
  }, [filteredLeaves]);

  console.log("selectedPhysio", selectedPhysio);
  console.log("selectedPhysioDetails", selectedPhysioDetails);
  console.log("raw roleName", selectedPhysioDetails?.roleName);
  console.log("normalizedRoleName", normalizedRoleName);
  console.log(
    "selectedPhysio !== all",
    String(selectedPhysio).trim() !== "all",
  );

  useEffect(() => {
    const monthlyExpenses = filteredExpenses.reduce(
      (sum, exp) => sum + Number(exp.expenseAmount || 0),
      0,
    );

    if (isHodSelected) {
      const totalReviews = filteredReviews.length;

      const completedReviews = filteredReviews.filter((review) => {
        return getReviewStatusName(review).trim().toLowerCase() === "completed";
      }).length;

      const pendingReviews = filteredReviews.filter((review) => {
        return getReviewStatusName(review).trim().toLowerCase() === "pending";
      }).length;

      const totalPatients = new Set(
        filteredReviews
          .map((review) => review?.patientId?._id || review?.patientId)
          .filter(Boolean),
      ).size;

      setStats((prev) => ({
        ...prev,
        patient: totalPatients,
        physio: selectedPhysio === "all" ? physioOptions.length : 1,
        monthlySessions: totalReviews,
        sessionCompleted: completedReviews,
        cancelledSessions: 0,
        monthlyExpenses,
        pendingreviews: pendingReviews,
        completedReview: completedReviews,
      }));

      setSummary({
        cancelledSessions: 0,
      });

      return;
    }

    const totalPatients = new Set(
      filteredSessions.map((s) => getSessionPatientId(s)).filter(Boolean),
    ).size;

    const totalPhysio = new Set(
      filteredSessions.map((s) => getSessionPhysioId(s)).filter(Boolean),
    ).size;

    const completedSessions = filteredSessions.filter(
      (s) => s.sessionStatusId?.sessionStatusName === "Completed",
    ).length;

    const cancelledSessions = filteredSessions.filter(
      (s) => s.sessionStatusId?.sessionStatusName === "Canceled",
    ).length;

    const completedReviews = filteredReviews.filter((review) => {
      return getReviewStatusName(review).trim().toLowerCase() === "completed";
    }).length;

    const pendingReviews = filteredReviews.filter((review) => {
      return getReviewStatusName(review).trim().toLowerCase() === "pending";
    }).length;

    setStats((prev) => ({
      ...prev,
      patient: totalPatients,
      physio: totalPhysio,
      monthlySessions: filteredSessions.length,
      sessionCompleted: completedSessions,
      cancelledSessions,
      monthlyExpenses,
      pendingreviews: pendingReviews,
      completedReview: completedReviews,
    }));

    setSummary({
      cancelledSessions,
    });
  }, [
    filteredSessions,
    filteredExpenses,
    filteredReviews,
    isHodSelected,
    selectedPhysio,
    physioOptions,
  ]);

  const avgPatient =
    stats.physio > 0 ? Math.floor(stats.patient / stats.physio) : 0;

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

    filteredPatientList.forEach((patient) => {
      const physioId = String(getPatientPhysioId(patient) || "unassigned");
      const physioName = getPatientPhysioName(patient);

      if (!grouped[physioId]) {
        grouped[physioId] = {
          physioId,
          physioName,
          assignedPatients: [],
          patientIds: new Set(),
          totalSessions: 0,
          completedSessions: 0,
          cancelledSessions: 0,
          leaveDays: 0,
          leaveCount: 0,
          leaveEntries: [],
        };
      }

      const patientId = String(patient?._id || "");
      if (patientId && !grouped[physioId].patientIds.has(patientId)) {
        grouped[physioId].patientIds.add(patientId);
        grouped[physioId].assignedPatients.push(patient);
      }
    });

    filteredSessions.forEach((session) => {
      const physioId = String(getSessionPhysioId(session) || "unassigned");
      const physioName = getSessionPhysioName(session);

      if (!grouped[physioId]) {
        grouped[physioId] = {
          physioId,
          physioName,
          assignedPatients: [],
          patientIds: new Set(),
          totalSessions: 0,
          completedSessions: 0,
          cancelledSessions: 0,
          leaveDays: 0,
          leaveCount: 0,
          leaveEntries: [],
        };
      }

      grouped[physioId].totalSessions += 1;

      if (session?.sessionStatusId?.sessionStatusName === "Completed") {
        grouped[physioId].completedSessions += 1;
      }

      if (session?.sessionStatusId?.sessionStatusName === "Canceled") {
        grouped[physioId].cancelledSessions += 1;
      }
    });

    filteredLeaves.forEach((leave) => {
      const physioId = String(getLeavePhysioId(leave) || "unassigned");
      const physioName = getLeavePhysioName(leave);

      if (!grouped[physioId]) {
        grouped[physioId] = {
          physioId,
          physioName,
          assignedPatients: [],
          patientIds: new Set(),
          totalSessions: 0,
          completedSessions: 0,
          cancelledSessions: 0,
          leaveDays: 0,
          leaveCount: 0,
          leaveEntries: [],
        };
      }

      grouped[physioId].leaveDays += getLeaveDaysCount(leave);
      grouped[physioId].leaveCount += 1;
      grouped[physioId].leaveEntries.push(leave);
    });

    return Object.values(grouped)
      .map((item) => ({
        ...item,
        totalAssignedPatients: item.assignedPatients.length,
        completionPercentage:
          item.totalSessions > 0
            ? ((item.completedSessions / item.totalSessions) * 100).toFixed(2)
            : "0.00",
      }))
      .sort((a, b) => a.physioName.localeCompare(b.physioName));
  }, [filteredPatientList, filteredSessions, filteredLeaves]);

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

  const selectedMonthName = `${monthNames[Number(selectedMonth)]} ${selectedYear}`;

  // ---------------------------
  // Export functions
  // ---------------------------
  const addHeader = (doc, title) => {
    // Logo
    doc.addImage(logo, "PNG", 14, 5, 25, 15);

    // Title
    doc.setFontSize(16);
    doc.text(title, 45, 15);
  };
  const handleExportHodReviewXLSX = () => {
    if (filteredReviews.length === 0) {
      toast({
        title: "No data",
        description: "No review data found for the selected filters.",
        variant: "destructive",
      });
      return;
    }

    const exportData = filteredReviews.map((review, index) => ({
      "S.No": index + 1,
      "Review Date": formatDate(getReviewDate(review)),
      "Patient Name": getReviewPatientName(review),
      Physio: getReviewPhysioName(review),
      Reference: getReviewReferenceName(review),
      Status: getReviewStatusName(review),
      Notes: review?.feedback || "N/A",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData, { origin: "A6" });

    XLSX.utils.sheet_add_aoa(worksheet, [
      ["Reference:", selectedReferenceName],
      ["Physio:", selectedPhysioName],
      ["Month:", selectedMonthName],
      ["Total Reviews:", filteredReviews.length],
    ]);

    worksheet["!cols"] = [
      { wch: 8 },
      { wch: 15 },
      { wch: 15 },
      { wch: 25 },
      { wch: 20 },
      { wch: 20 },
      { wch: 15 },
      { wch: 35 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reviews");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const fileData = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });

    saveAs(
      fileData,
      `HOD_Review_Report_${selectedPhysioName.replace(/\s+/g, "_")}_${selectedMonthName}.xlsx`,
    );
  };

  const handleExportHodReviewPDF = () => {
    if (filteredReviews.length === 0) {
      toast({
        title: "No data",
        description: "No review data found for the selected filters.",
        variant: "destructive",
      });
      return;
    }

    const doc = new jsPDF("l", "mm", "a4");

    // doc.setFontSize(16);
    // doc.text("HOD Review Report", 14, 15);
    addHeader(doc, "HOD Review Report");
    doc.setFontSize(11);
    doc.text(`Reference: ${selectedReferenceName}`, 14, 28);
    doc.text(`Physio: ${selectedPhysioName}`, 14, 35);
    doc.text(`Month: ${selectedMonthName}`, 14, 42);
    doc.text(`Total Reviews: ${filteredReviews.length}`, 14, 49);
    doc.text(`Generated On: ${new Date().toLocaleDateString("en-GB")}`, 14, 56);
    const tableData = filteredReviews.map((review, index) => [
      index + 1,
      formatDate(getReviewDate(review)),
      getReviewPatientName(review),
      getReviewPhysioName(review),
      getReviewReferenceName(review),
      getReviewStatusName(review),
      review?.feedback || "N/A",
    ]);

    autoTable(doc, {
      startY: 60,
      head: [
        [
          "S.No",
          "Review Date",
          "Patient Name",
          "Physio",
          "Reference",
          "Status",
          "Notes",
        ],
      ],
      body: tableData,
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: "linebreak",
        valign: "middle",
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
    });

    doc.save(
      `HOD_Review_Report_${selectedPhysioName.replace(/\s+/g, "_")}_${selectedMonthName}.pdf`,
    );
  };

  const handleExportPatientList = () => {
    if (filteredPatientList.length === 0) {
      toast({
        title: "No data",
        description: "No patients found for the selected filters.",
        variant: "destructive",
      });
      return;
    }

    const totalPatients = filteredPatientList.length;

    const exportData = filteredPatientList.map((patient, index) => ({
      "S.No": index + 1,
      "Patient Code": patient?.patientCode || "N/A",
      "Patient Name": patient?.patientName || "N/A",
      "Mobile Number": patient?.patientNumber || "N/A",
      Gender: patient?.patientGenderId?.genderName || "N/A",
      Age: patient?.patientAge || "N/A",
      Address: patient?.patientAddress || "N/A",
      Condition: patient?.patientCondition || "N/A",
      Physio: getPatientPhysioName(patient),
      Reference: getPatientReferenceName(patient),
      "Session Count": patient?.sessionCount ?? 0,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData, { origin: "A6" });

    XLSX.utils.sheet_add_aoa(worksheet, [
      ["Reference:", selectedReferenceName],
      ["Physio:", selectedPhysioName],
      ["Month:", selectedMonthName],
      ["Total Patients:", totalPatients],
    ]);

    worksheet["!cols"] = [
      { wch: 8 },
      { wch: 15 },
      { wch: 25 },
      { wch: 18 },
      { wch: 12 },
      { wch: 10 },
      { wch: 25 },
      { wch: 25 },
      { wch: 20 },
      { wch: 20 },
      { wch: 12 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Patients");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const fileData = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });

    saveAs(
      fileData,
      `Patient_List_${selectedReferenceName.replace(/\s+/g, "_")}_${selectedPhysioName.replace(/\s+/g, "_")}_${selectedMonthName}.xlsx`,
    );
  };

  const handleExportPatientListPDF = () => {
    if (filteredPatientList.length === 0) {
      toast({
        title: "No data",
        description: "No patients found for the selected filters.",
        variant: "destructive",
      });
      return;
    }

    const doc = new jsPDF("l", "mm", "a4");
    const totalPatients = filteredPatientList.length;

    // doc.setFontSize(16);
    // doc.text("Reference / Physio Wise Patient List", 14, 15);
    addHeader(doc, "Reference / Physio Wise Patient List");
    doc.setFontSize(11);
    doc.text(`Reference: ${selectedReferenceName}`, 14, 28);
    doc.text(`Physio: ${selectedPhysioName}`, 14, 35);
    doc.text(`Month: ${selectedMonthName}`, 14, 42);
    doc.text(`Total Patients: ${totalPatients}`, 14, 49);
    doc.text(`Generated On: ${new Date().toLocaleDateString("en-GB")}`, 14, 56);
    const tableData = filteredPatientList.map((patient, index) => [
      index + 1,
      patient?.patientCode || "N/A",
      patient?.patientName || "N/A",
      patient?.patientNumber || "N/A",
      patient?.patientGenderId?.genderName || "N/A",
      patient?.patientAge || "N/A",
      patient?.patientCondition || "N/A",
      getPatientPhysioName(patient),
      getPatientReferenceName(patient),
      patient?.sessionCount ?? 0,
    ]);

    autoTable(doc, {
      startY: 60,
      head: [
        [
          "S.No",
          "Patient Code",
          "Patient Name",
          "Mobile",
          "Gender",
          "Age",
          "Condition",
          "Physio",
          "Reference",
          "Sessions",
        ],
      ],
      body: tableData,
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: "linebreak",
        valign: "middle",
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
    });

    doc.save(
      `Patient_List_${selectedReferenceName.replace(/\s+/g, "_")}_${selectedPhysioName.replace(/\s+/g, "_")}_${selectedMonthName}.pdf`,
    );
  };

  const handleExportCSV = () => {
    const rows = [
      ["Metric", "Value"],
      ["Reference", selectedReferenceName],
      ["Physio", selectedPhysioName],
      ["Total Patients", stats.patient],
      ["Total Physio", stats.physio],
      [
        isHodSelected ? "Total Reviews" : "Total Sessions",
        stats.monthlySessions,
      ],
      [
        isHodSelected ? "Completed Reviews" : "Completed Sessions",
        stats.sessionCompleted,
      ],
      ["Cancelled Sessions", stats.cancelledSessions],
      ["Monthly Revenue", stats.monthlyRevenue],
      ["Monthly Expenses", stats.monthlyExpenses],
      ["Recovered Patients", stats.patientRecover],
      ["Pending Reviews", stats.pendingreviews],
      ["Completed Reviews", stats.completedReview],
      ["Today's Sessions", todaySessionCount],
      ["Average Patient per Physio", avgPatient],
      ["Total Leave Days", totalLeaveDays],
      [
        isHodSelected
          ? "Review Completion Rate (RCR)"
          : "Session Completion Rate (SCR)",
        `${getCompletionPercentage(stats.sessionCompleted, stats.monthlySessions)}%`,
      ],
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      rows.map((e) => e.map((v) => `"${v}"`).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);

    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `report_${selectedReferenceName}_${selectedPhysioName}_${monthNames[Number(selectedMonth)]}_${selectedYear}.csv`,
    );

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();

    // doc.setFontSize(18);
    // doc.text(isHodSelected ? "HOD Report" : "Physio Report", 14, 20);
    addHeader(doc, isHodSelected ? "HOD Report" : "Physio Report");
    doc.setFontSize(12);
    doc.text(`Reference: ${selectedReferenceName}`, 14, 30);
    doc.text(`Physio: ${selectedPhysioName}`, 14, 38);
    doc.text(
      `Month: ${monthNames[Number(selectedMonth)]} ${selectedYear}`,
      14,
      46,
    );

    const tableData = [
      ["Total Patients", stats.patient],
      ["Total Physio", stats.physio],
      [
        isHodSelected ? "Total Reviews" : "Total Sessions",
        stats.monthlySessions,
      ],
      [
        isHodSelected ? "Completed Reviews" : "Completed Sessions",
        stats.sessionCompleted,
      ],
      ["Cancelled Sessions", stats.cancelledSessions],
      ["Monthly Revenue", `Rs ${stats.monthlyRevenue}`],
      ["Monthly Expenses", `Rs ${stats.monthlyExpenses}`],
      ["Recovered Patients", stats.patientRecover],
      ["Pending Reviews", stats.pendingreviews],
      ["Completed Reviews", stats.completedReview],
      ["Today's Sessions", todaySessionCount],
      ["Avg Patient / Physio", avgPatient],
      ["Total Leave Days", totalLeaveDays],
      [
        isHodSelected
          ? "Review Completion Rate (RCR)"
          : "Session Completion Rate (SCR)",
        `${getCompletionPercentage(stats.sessionCompleted, stats.monthlySessions)}%`,
      ],
    ];

    autoTable(doc, {
      startY: 55,
      head: [["Metric", "Value"]],
      body: tableData,
    });

    doc.save(
      `report_${selectedReferenceName}_${selectedPhysioName}_${monthNames[Number(selectedMonth)]}_${selectedYear}.pdf`,
    );
  };

  const handleExportPhysioWiseXLSX = () => {
    if (physioWiseData.length === 0) {
      toast({
        title: "No data",
        description:
          "No physio-wise report data found for the selected filters.",
        variant: "destructive",
      });
      return;
    }

    const workbook = XLSX.utils.book_new();

    const summaryData = physioWiseData.map((item, index) => ({
      "S.No": index + 1,
      Physio: item.physioName,
      "Assigned Patients": item.totalAssignedPatients,
      "Total Sessions": item.totalSessions,
      "Completed Sessions": item.completedSessions,
      "Canceled Sessions": item.cancelledSessions,
      "Leave Entries": item.leaveCount,
      "Leave Days": item.leaveDays,
      "Session Completion Rate ": item.completionPercentage,
    }));

    const summarySheet = XLSX.utils.json_to_sheet(summaryData, {
      origin: "A6",
    });

    XLSX.utils.sheet_add_aoa(summarySheet, [
      ["Reference:", selectedReferenceName],
      ["Physio:", selectedPhysioName],
      ["Month:", selectedMonthName],
      ["Report Type:", "Physio Wise Summary"],
    ]);

    summarySheet["!cols"] = [
      { wch: 8 },
      { wch: 22 },
      { wch: 18 },
      { wch: 18 },
      { wch: 20 },
      { wch: 20 },
      { wch: 15 },
      { wch: 12 },
      { wch: 14 },
    ];

    XLSX.utils.book_append_sheet(workbook, summarySheet, "Physio Summary");

    const patientRows = [];
    physioWiseData.forEach((item) => {
      if (item.assignedPatients.length === 0) {
        patientRows.push({
          Physio: item.physioName,
          "Patient Code": "N/A",
          "Patient Name": "No Assigned Patients",
          Mobile: "",
          Condition: "",
          Reference: "",
          "Session Count": 0,
        });
      } else {
        item.assignedPatients.forEach((patient) => {
          patientRows.push({
            Physio: item.physioName,
            "Patient Code": patient?.patientCode || "N/A",
            "Patient Name": patient?.patientName || "N/A",
            Mobile: patient?.patientNumber || "N/A",
            Condition: patient?.patientCondition || "N/A",
            Reference: getPatientReferenceName(patient),
            "Session Count": patient?.sessionCount ?? 0,
          });
        });
      }
    });

    const patientSheet = XLSX.utils.json_to_sheet(patientRows, {
      origin: "A6",
    });

    XLSX.utils.sheet_add_aoa(patientSheet, [
      ["Reference:", selectedReferenceName],
      ["Physio:", selectedPhysioName],
      ["Month:", selectedMonthName],
      ["Report Type:", "Physio Wise Patient List"],
    ]);

    patientSheet["!cols"] = [
      { wch: 22 },
      { wch: 15 },
      { wch: 25 },
      { wch: 18 },
      { wch: 25 },
      { wch: 20 },
      { wch: 15 },
    ];

    XLSX.utils.book_append_sheet(workbook, patientSheet, "Physio Patients");

    const leaveRows = [];
    physioWiseData.forEach((item) => {
      if (item.leaveEntries.length === 0) {
        leaveRows.push({
          Physio: item.physioName,
          "Leave Date": "",
          "Leave Mode": "No Leave",
          "Paid Leave": "",
          "Leave Status": "",
          "Reassigned Sessions": "",
        });
      } else {
        item.leaveEntries.forEach((leave) => {
          leaveRows.push({
            Physio: item.physioName,
            "Leave Date": formatDate(getLeaveDate(leave)),
            "Leave Mode": getLeaveMode(leave),
            "Paid Leave": leave?.PaidLeave ? "Yes" : "No",
            "Leave Status": getLeaveStatus(leave),
            "Reassigned Sessions": getReassignedCount(leave),
          });
        });
      }
    });

    const leaveSheet = XLSX.utils.json_to_sheet(leaveRows, { origin: "A6" });

    XLSX.utils.sheet_add_aoa(leaveSheet, [
      ["Reference:", selectedReferenceName],
      ["Physio:", selectedPhysioName],
      ["Month:", selectedMonthName],
      ["Report Type:", "Physio Leave Details"],
      ["Total Leave Days:", totalLeaveDays],
    ]);

    leaveSheet["!cols"] = [
      { wch: 22 },
      { wch: 15 },
      { wch: 15 },
      { wch: 12 },
      { wch: 14 },
      { wch: 18 },
    ];

    XLSX.utils.book_append_sheet(workbook, leaveSheet, "Physio Leaves");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const fileData = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });

    saveAs(
      fileData,
      `Physio_Wise_Report_${selectedReferenceName.replace(/\s+/g, "_")}_${selectedPhysioName.replace(/\s+/g, "_")}_${selectedMonthName}.xlsx`,
    );
  };

  const handleExportPhysioWisePDF = () => {
    if (physioWiseData.length === 0) {
      toast({
        title: "No data",
        description:
          "No physio-wise report data found for the selected filters.",
        variant: "destructive",
      });
      return;
    }

    const doc = new jsPDF("l", "mm", "a4");

    // doc.setFontSize(16);
    // doc.text("Physio Wise Report", 14, 15);
    addHeader(doc, "Physio Wise Report");
    doc.setFontSize(11);
    doc.text(`Reference: ${selectedReferenceName}`, 14, 28);
    doc.text(`Physio: ${selectedPhysioName}`, 14, 35);
    doc.text(`Month: ${selectedMonthName}`, 14, 42);
    doc.text(`Generated On: ${new Date().toLocaleDateString("en-GB")}`, 14, 49);
    const summaryTable = physioWiseData.map((item, index) => [
      index + 1,
      item.physioName,
      item.totalAssignedPatients,
      item.totalSessions,
      item.completedSessions,
      item.cancelledSessions,
      item.leaveCount,
      item.leaveDays,
      `${item.completionPercentage}%`,
    ]);

    autoTable(doc, {
      startY: 52,
      head: [
        [
          "S.No",
          "Physio Name",
          "Assigned Patients",
          "Total Sessions",
          "Completed",
          "Canceled",
          "Leave Entries",
          "Leave Days",
          "Session Completion Rate",
        ],
      ],
      body: summaryTable,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
    });

    let currentY = doc.lastAutoTable.finalY + 10;

    physioWiseData.forEach((item) => {
      if (currentY > 170) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(12);
      doc.text(
        `${item.physioName} - Patient List (${item.totalAssignedPatients})`,
        14,
        currentY,
      );
      currentY += 4;

      const patientTable = item.assignedPatients.length
        ? item.assignedPatients.map((patient, index) => [
            index + 1,
            patient?.patientCode || "N/A",
            patient?.patientName || "N/A",
            patient?.patientNumber || "N/A",
            patient?.patientCondition || "N/A",
            patient?.sessionCount ?? 0,
          ])
        : [["", "", "No Assigned Patients", "", "", ""]];

      autoTable(doc, {
        startY: currentY + 2,
        head: [
          [
            "S.No",
            "Patient Code",
            "Patient Name",
            "Mobile",
            "Condition",
            "Session Count",
          ],
        ],
        body: patientTable,
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [52, 73, 94],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
      });

      currentY = doc.lastAutoTable.finalY + 8;

      if (currentY > 170) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(12);
      doc.text(`${item.physioName} - Leave Details`, 14, currentY);
      currentY += 4;

      const leaveTable = item.leaveEntries.length
        ? item.leaveEntries.map((leave, index) => [
            index + 1,
            formatDate(getLeaveDate(leave)),
            getLeaveMode(leave),
            leave?.PaidLeave ? "Yes" : "No",
            getLeaveStatus(leave),
            getReassignedCount(leave),
          ])
        : [["", "No Leave", "", "", "", ""]];

      autoTable(doc, {
        startY: currentY + 2,
        head: [
          [
            "S.No",
            "Leave Date",
            "Leave Mode",
            "Paid Leave",
            "Status",
            "Reassigned Sessions",
          ],
        ],
        body: leaveTable,
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [234, 179, 8],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
      });

      currentY = doc.lastAutoTable.finalY + 10;
    });

    doc.save(
      `Physio_Wise_Report_${selectedReferenceName.replace(/\s+/g, "_")}_${selectedPhysioName.replace(/\s+/g, "_")}_${selectedMonthName}.pdf`,
    );
  };
  console.log(isHodSelected, "isHodSelected");
  const statCards = [
    {
      title: isHodSelected
        ? "Review Completion Rate (RCR)"
        : "Session Completion Rate (SCR)",
      value: `${getCompletionPercentage(
        stats.sessionCompleted,
        stats.monthlySessions,
      )}%`,
      icon: TrendingUp,
      color: "text-sky-600",
      bgColor: "bg-sky-100",
    },
    {
      title: "Total Patients",
      value: stats.patient,
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Total Physio",
      value: stats.physio,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },

    {
      title: isHodSelected ? "Total Reviews" : "Total Sessions",
      value: stats.monthlySessions,
      icon: Activity,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: isHodSelected ? "Completed Reviews" : "Completed Sessions",
      value: stats.sessionCompleted,
      icon: CheckSquare,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
    },
    {
      title: "Monthly Revenue",
      value: `₹${Number(stats.monthlyRevenue || 0).toLocaleString("en-IN")}`,
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      title: "Monthly Expenses",
      value: `₹${Number(stats.monthlyExpenses || 0).toLocaleString("en-IN")}`,
      icon: Wallet,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
    {
      title: "Pending Reviews",
      value: stats.pendingreviews,
      icon: BookUser,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Completed Reviews",
      value: stats.completedReview,
      icon: TrendingUp,
      color: "text-cyan-600",
      bgColor: "bg-cyan-100",
    },
    {
      title: "Recovered Patients",
      value: stats.patientRecover ?? 0,
      icon: User,
      color: "text-teal-600",
      bgColor: "bg-teal-100",
    },
    {
      title: "Cancelled Sessions",
      value: summary.cancelledSessions,
      icon: Calendar,
      color: "text-rose-600",
      bgColor: "bg-rose-100",
    },
    {
      title: "Today Session Count",
      value: todaySessionCount,
      icon: Calendar,
      color: "text-lime-600",
      bgColor: "bg-lime-100",
    },
    {
      title: "Avg Patient / Physio",
      value: avgPatient,
      icon: Users,
      color: "text-violet-600",
      bgColor: "bg-violet-100",
    },
  ];

  return (
    <div className="space-y-6 p-2 md:p-0">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col space-y-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1 md:mb-2">
            Reports & Analytics
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            Comprehensive insights and performance metrics
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={selectedReference}
            onValueChange={setSelectedReference}
          >
            <SelectTrigger className="w-full md:w-48">
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
            <SelectTrigger className="w-full md:w-48">
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
            <SelectTrigger className="w-full md:w-40">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select Month" />
            </SelectTrigger>
            <SelectContent className="z-[99999] max-h-72 overflow-auto bg-white border shadow-lg">
              {monthNames.map((month, index) => (
                <SelectItem key={month} value={String(index)}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-full md:w-32">
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

          {isHodSelected ? (
            <>
              <Button variant="outline" onClick={handleExportHodReviewXLSX}>
                <Download className="h-4 w-4 mr-2" />
                Review XLSX
              </Button>

              <Button variant="outline" onClick={handleExportHodReviewPDF}>
                <Download className="h-4 w-4 mr-2" />
                Review PDF
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleExportPatientList}>
                <Download className="h-4 w-4 mr-2" />
                Patient XLSX
              </Button>

              <Button variant="outline" onClick={handleExportPatientListPDF}>
                <Download className="h-4 w-4 mr-2" />
                Patient PDF
              </Button>

              <Button variant="outline" onClick={handleExportPhysioWiseXLSX}>
                <Download className="h-4 w-4 mr-2" />
                Physio XLSX
              </Button>

              <Button variant="outline" onClick={handleExportPhysioWisePDF}>
                <Download className="h-4 w-4 mr-2" />
                Physio PDF
              </Button>
            </>
          )}

          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>

          <Button variant="outline" onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-2" />
            Report PDF
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
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
                    {stat.value}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {monthNames[Number(selectedMonth)]} {selectedYear}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card className="medical-card hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              New Enquiries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">
              {funnel.newEnquiries}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {monthNames[Number(selectedMonth)]} {selectedYear}
            </p>
          </CardContent>
        </Card>

        <Card className="medical-card hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              New Consultations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">
              {funnel.newConsultations}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {monthNames[Number(selectedMonth)]} {selectedYear}
            </p>
          </CardContent>
        </Card>

        <Card className="medical-card hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              New Patients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">
              {funnel.newPatients}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {monthNames[Number(selectedMonth)]} {selectedYear}
            </p>
          </CardContent>
        </Card>

        <Card className="medical-card hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Lead Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">
              {funnel.conversionRate}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {monthNames[Number(selectedMonth)]} {selectedYear}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="medical-card">
          <CardHeader>
            <CardTitle>Expense Breakdown</CardTitle>
            <CardDescription>
              {monthNames[Number(selectedMonth)]} {selectedYear}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {expensePieData.length === 0 ? (
              <div className="h-[320px] flex items-center justify-center text-sm text-gray-500">
                No expense data for selected month
              </div>
            ) : (
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expensePieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {expensePieData.map((entry, index) => (
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
            )}
          </CardContent>
        </Card>

        <Card className="medical-card">
          <CardHeader>
            <CardTitle>Expense Summary</CardTitle>
            <CardDescription>Category wise amounts</CardDescription>
          </CardHeader>
          <CardContent>
            {expensePieData.length === 0 ? (
              <p className="text-sm text-gray-500">
                No expense summary available.
              </p>
            ) : (
              <div className="space-y-3">
                {expensePieData.map((item, index) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between border rounded-lg p-3"
                  >
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
                    <span className="text-sm font-semibold text-gray-800">
                      ₹{Number(item.value).toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {!isHodSelected && (
        <Card className="medical-card">
          <CardHeader>
            <CardTitle>Physio Wise Report View</CardTitle>
            <CardDescription>
              Assigned patients, session count, completed and canceled session,
              leave details
            </CardDescription>
          </CardHeader>
          <CardContent>
            {physioWiseData.length === 0 ? (
              <div className="text-sm text-gray-500">
                No physio-wise data available for selected filters.
              </div>
            ) : (
              <div className="space-y-6">
                {physioWiseData.map((item) => (
                  <div
                    key={item.physioId}
                    className="border rounded-xl p-4 bg-white shadow-sm"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          {item.physioName}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {selectedMonthName}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                        <div className="rounded-lg bg-blue-50 px-4 py-3">
                          <p className="text-xs text-gray-500">
                            Assigned Patients
                          </p>
                          <p className="text-lg font-bold text-blue-700">
                            {item.totalAssignedPatients}
                          </p>
                        </div>

                        <div className="rounded-lg bg-purple-50 px-4 py-3">
                          <p className="text-xs text-gray-500">
                            Total Sessions
                          </p>
                          <p className="text-lg font-bold text-purple-700">
                            {item.totalSessions}
                          </p>
                        </div>

                        <div className="rounded-lg bg-green-50 px-4 py-3">
                          <p className="text-xs text-gray-500">Completed</p>
                          <p className="text-lg font-bold text-green-700">
                            {item.completedSessions}
                          </p>
                        </div>

                        <div className="rounded-lg bg-red-50 px-4 py-3">
                          <p className="text-xs text-gray-500">Canceled</p>
                          <p className="text-lg font-bold text-red-700">
                            {item.cancelledSessions}
                          </p>
                        </div>

                        <div className="rounded-lg bg-yellow-50 px-4 py-3">
                          <p className="text-xs text-gray-500">Leave Days</p>
                          <p className="text-lg font-bold text-yellow-700">
                            {item.leaveDays}
                          </p>
                        </div>

                        <div className="rounded-lg bg-cyan-50 px-4 py-3">
                          <p className="text-xs text-gray-500">
                            Session Completion Rate(SCR)
                          </p>
                          <p className="text-lg font-bold text-cyan-700">
                            {item.completionPercentage}%
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="overflow-auto mb-5">
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr className="bg-slate-100 text-left">
                            <th className="border px-3 py-2">S.No</th>
                            <th className="border px-3 py-2">Patient Code</th>
                            <th className="border px-3 py-2">Patient Name</th>
                            <th className="border px-3 py-2">Mobile</th>
                            <th className="border px-3 py-2">Condition</th>
                            <th className="border px-3 py-2">Reference</th>
                            <th className="border px-3 py-2">
                              Total No. of Session
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {item.assignedPatients.length === 0 ? (
                            <tr>
                              <td
                                colSpan={7}
                                className="border px-3 py-4 text-center text-gray-500"
                              >
                                No assigned patients
                              </td>
                            </tr>
                          ) : (
                            item.assignedPatients.map((patient, index) => (
                              <tr
                                key={patient?._id || index}
                                className="hover:bg-slate-50"
                              >
                                <td className="border px-3 py-2">
                                  {index + 1}
                                </td>
                                <td className="border px-3 py-2">
                                  {patient?.patientCode || "N/A"}
                                </td>
                                <td className="border px-3 py-2">
                                  {patient?.patientName || "N/A"}
                                </td>
                                <td className="border px-3 py-2">
                                  {patient?.patientNumber || "N/A"}
                                </td>
                                <td className="border px-3 py-2">
                                  {patient?.patientCondition || "N/A"}
                                </td>
                                <td className="border px-3 py-2">
                                  {getPatientReferenceName(patient)}
                                </td>
                                <td className="border px-3 py-2">
                                  {patient?.sessionCount ?? 0}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="overflow-auto">
                      <h4 className="text-md font-semibold text-gray-800 mb-2">
                        Leave Details
                      </h4>
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr className="bg-yellow-100 text-left">
                            <th className="border px-3 py-2">S.No</th>
                            <th className="border px-3 py-2">Leave Date</th>
                            <th className="border px-3 py-2">Leave Mode</th>
                            <th className="border px-3 py-2">Paid Leave</th>
                            <th className="border px-3 py-2">Status</th>
                            <th className="border px-3 py-2">
                              Reassigned Sessions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {item.leaveEntries.length === 0 ? (
                            <tr>
                              <td
                                colSpan={6}
                                className="border px-3 py-4 text-center text-gray-500"
                              >
                                No leave found
                              </td>
                            </tr>
                          ) : (
                            item.leaveEntries.map((leave, index) => (
                              <tr
                                key={leave?._id || index}
                                className="hover:bg-yellow-50"
                              >
                                <td className="border px-3 py-2">
                                  {index + 1}
                                </td>
                                <td className="border px-3 py-2">
                                  {formatDate(getLeaveDate(leave))}
                                </td>
                                <td className="border px-3 py-2">
                                  {getLeaveMode(leave)}
                                </td>
                                <td className="border px-3 py-2">
                                  {leave?.PaidLeave ? "Yes" : "No"}
                                </td>
                                <td className="border px-3 py-2">
                                  {getLeaveStatus(leave)}
                                </td>
                                <td className="border px-3 py-2">
                                  {getReassignedCount(leave)}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Reports;
