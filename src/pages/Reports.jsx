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
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  PieChart,
  Pie,
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
const Reports = () => {
  const { user } = useAuth();

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

  const [selectedMonth, setSelectedMonth] = useState(String(currentMonth));
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [sessions, setSessions] = useState([]);
  const [patientList, setPatientList] = useState([]);
  const [leaveData, setLeaveData] = useState([]);
  const [todaySessionCount, setTodaySessionCount] = useState(0);
  useEffect(() => {
    const now = new Date();
    setSelectedMonth(String(now.getMonth() + 1)); // FIX
    setSelectedYear(String(now.getFullYear()));
  }, []);
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

      const matchesMonthYear =
        d.getMonth() + 1 === Number(selectedMonth) &&
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
        d.getMonth() + 1 === Number(selectedMonth) &&
        d.getFullYear() === Number(selectedYear)
      );
    });
  }, [leaveData, selectedPhysio, selectedMonth, selectedYear]);
  const computedStats = useMemo(() => {
    const normalize = (val) =>
      String(val || "")
        .trim()
        .toLowerCase();

    const monthlyExpenses = filteredExpenses.reduce(
      (sum, exp) => sum + Number(exp.expenseAmount || 0),
      0,
    );

    const completedReviews = filteredReviews.filter(
      (r) => normalize(getReviewStatusName(r)) === "completed",
    ).length;

    const pendingReviews = filteredReviews.filter(
      (r) => normalize(getReviewStatusName(r)) === "pending",
    ).length;

    const patientSet = new Set();
    const physioSet = new Set();

    filteredSessions.forEach((s) => {
      const pId = getSessionPatientId(s);
      const phyId = getSessionPhysioId(s);

      if (pId) patientSet.add(String(pId));
      if (phyId) physioSet.add(String(phyId));
    });

    filteredReviews.forEach((r) => {
      const pId = r?.patientId?._id || r?.patientId;
      if (pId) patientSet.add(String(pId));
    });

    const completedSessions = filteredSessions.filter(
      (s) => normalize(s.sessionStatusId?.sessionStatusName) === "completed",
    ).length;

    const cancelledSessions = filteredSessions.filter((s) =>
      ["canceled", "cancelled"].includes(
        normalize(s.sessionStatusId?.sessionStatusName),
      ),
    ).length;

    const totalLeaveDays = filteredLeaves.reduce(
      (sum, leave) => sum + getLeaveDaysCount(leave),
      0,
    );

    return {
      totalPatients: patientSet.size,
      totalPhysio: isHodSelected
        ? selectedPhysio === "all"
          ? physioOptions.length
          : 1
        : physioSet.size,
      totalSessions: filteredSessions.length,
      completedSessions,
      cancelledSessions,
      monthlyExpenses,
      completedReviews,
      pendingReviews,
      totalLeaveDays,
    };
  }, [
    filteredSessions,
    filteredReviews,
    filteredExpenses,
    filteredLeaves,
    isHodSelected,
    selectedPhysio,
    physioOptions,
  ]);

  const addHeader = (doc, title) => {
    // Logo
    doc.addImage(logo, "PNG", 14, 5, 25, 15);

    // Title
    doc.setFontSize(16);
    doc.text(title, 45, 15);
  };
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
  const getAllConsultation = async () => {
    try {
      const res = await apiRequest("Consultation/getAllConsultation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      if (Array.isArray(res)) {
        setConsultations(res);
      } else if (Array.isArray(res?.data)) {
        setConsultations(res.data);
      } else {
        setConsultations([]);
      }
    } catch (error) {
      console.error("Error fetching consultations:", error);
      setConsultations([]);
    }
  };

  useEffect(() => {
    getAllConsultation();
  }, []);
  useEffect(() => {
    const totalConsultations = consultations?.length || 0;

    setFunnel((prev) => ({
      ...prev,
      totalConsultations,
    }));
  }, [consultations]);
  useEffect(() => {
    const totalConsultations =
      consultations?.filter((c) => {
        const date = new Date(c.date);
        return (
          date.getMonth() === Number(selectedMonth) &&
          date.getFullYear() === Number(selectedYear)
        );
      })?.length || 0;

    setFunnel((prev) => ({
      ...prev,
      totalConsultations,
    }));
  }, [consultations, selectedMonth, selectedYear]);
  const totalConsultations = consultations?.length || 0;
  const [funnel, setFunnel] = useState({
    newEnquiries: 0,
    newConsultations: 0,
    newPatients: 0,
    conversionRate: 0,
    consultations: 0,
    totalConsultations: 0,
  });
  console.log(funnel);

  const getSessionsForMonths = (months) => {
    const today = new Date();
    const startDate = new Date();

    startDate.setMonth(today.getMonth() - months);

    return sessions.filter((s) => {
      const d = new Date(s.sessionDate);
      return d >= startDate && d <= today;
    });
  };
  const getReviewsForMonths = (months) => {
    const today = new Date();
    const startDate = new Date();

    startDate.setMonth(today.getMonth() - months);

    return reviews.filter((s) => {
      const d = new Date(s.reviewDate);
      console.log(d);

      return d >= startDate && d <= today;
    });
  };
  const generateHodPerformance = (months) => {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // -------------------------
    // FILTER REVIEWS
    // -------------------------
    const reviewData = filteredReviews.filter((r) => {
      const d = new Date(r.reviewDate || r.createdAt);
      return d >= startDate;
    });

    // -------------------------
    // FILTER CONSULTATIONS
    // -------------------------
    const consultationData = consultations.filter((c) => {
      const d = new Date(c.consultationDate || c.createdAt);
      return d >= startDate;
    });
    console.log(consultationData);
    // -------------------------
    // FINAL METRICS
    // -------------------------
    let data = {
      totalReviews: 0,
      completedReviews: 0,

      totalConsultations: 0,
      completedConsultations: 0,

      pending: 0,
      cancelled: 0,

      convertedPatients: new Set(),
    };

    // -------------------------
    // REVIEWS PROCESS
    // -------------------------
    reviewData.forEach((r) => {
      const status = (r.reviewStatusId?.reviewStatusName || "").toLowerCase();

      data.totalReviews++;

      if (status.includes("completed")) data.completedReviews++;
      else if (status.includes("pending")) data.pending++;
      else if (status.includes("cancel")) data.cancelled++;

      if (r.patientId) {
        data.convertedPatients.add(String(r.patientId._id || r.patientId));
      }
    });

    // -------------------------
    // CONSULTATION PROCESS
    // -------------------------
    consultationData.forEach((c) => {
      const status = (c.status || "").toLowerCase();

      data.totalConsultations++;

      if (status.includes("complete")) data.completedConsultations++;
      else if (status.includes("pending")) data.pending++;
      else if (status.includes("cancel")) data.cancelled++;

      if (c.patientId) {
        data.convertedPatients.add(String(c.patientId._id || c.patientId));
      }
    });

    // -------------------------
    // FINAL CALCULATION
    // -------------------------
    const totalActivities = data.totalReviews + data.totalConsultations;

    const conversionRate =
      totalActivities === 0
        ? 0
        : Math.round((data.convertedPatients.size / totalActivities) * 100);

    return {
      ...data,
      totalActivities,
      convertedPatients: data.convertedPatients.size,
      conversionRate,
    };
  };
  const exportHodPerformancePDF = (months) => {
    const data = generateHodPerformance(months);
    console.log(data);

    const doc = new jsPDF();

    addHeader(doc, "HOD Performance Report (Reviews + Consultations)");

    doc.setFontSize(12);
    doc.text(`Last ${months} Months Combined Report`, 14, 40);

    autoTable(doc, {
      startY: 50,
      head: [["Metric", "Value"]],
      body: [
        ["Total Reviews", data.totalReviews],
        ["Completed Reviews", data.completedReviews],

        ["Total Consultations", data.totalConsultations],
        // ["Completed Consultations", data.completedConsultations],

        ["Pending Activities", data.pending],
        ["Cancelled Activities", data.cancelled],

        ["Total Patients Engaged", data.convertedPatients],
        ["Conversion Rate", `${data.conversionRate}%`],
      ],
    });

    doc.save(`HOD_Combined_Performance_${months}_Months.pdf`);
  };
  const exportHodPerformanceExcel = (months) => {
    const data = generateHodPerformance(months);

    const rows = [
      { Metric: "Total Reviews", Value: data.totalReviews },
      { Metric: "Completed Reviews", Value: data.completedReviews },

      { Metric: "Total Consultations", Value: data.totalConsultations },
      // { Metric: "Completed Consultations", Value: data.completedConsultations },

      { Metric: "Pending Activities", Value: data.pending },
      { Metric: "Cancelled Activities", Value: data.cancelled },

      { Metric: "Total Patients Engaged", Value: data.convertedPatients },
      { Metric: "Conversion Rate", Value: `${data.conversionRate}%` },
    ];

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "HOD Performance");

    XLSX.writeFile(wb, `HOD_Combined_Performance_${months}_Months.xlsx`);
  };
  const generatePhysioPerformance = (months, selectedPhysio) => {
    let reportSessions = getSessionsForMonths(months);

    if (selectedPhysio !== "all") {
      reportSessions = reportSessions.filter(
        (s) => String(getSessionPhysioId(s)) === String(selectedPhysio),
      );
    }

    const physioMap = {};

    reportSessions.forEach((s) => {
      const physioId = getSessionPhysioId(s);
      const physioName = s.physioId.physioName || "Unknown";

      if (!physioMap[physioId]) {
        physioMap[physioId] = {
          physioName,
          totalSessions: 0,
          completedSessions: 0,
          cancelledSessions: 0,
          pendingSessions: 0,
          patients: new Set(),
        };
      }

      physioMap[physioId].totalSessions += 1;
      if (s.patientId) {
        const patientId =
          typeof s.patientId === "object" ? s.patientId._id : s.patientId;

        physioMap[physioId].patients.add(String(patientId));
      }

      const status = (s.sessionStatusId.sessionStatusName || "").toLowerCase();

      if (status.includes("complete")) {
        physioMap[physioId].completedSessions += 1;
      } else if (status.includes("cancel")) {
        physioMap[physioId].cancelledSessions += 1;
      } else {
        physioMap[physioId].pendingSessions += 1;
      }
    });

    return Object.values(physioMap).map((p) => {
      const uniquePatients = p.patients.size;

      const completionPercentage =
        p.totalSessions === 0
          ? 0
          : Math.round((p.completedSessions / p.totalSessions) * 100);

      const avgSessionsPerPatient =
        uniquePatients === 0
          ? 0
          : (p.totalSessions / uniquePatients).toFixed(2);

      const productivityScore = Math.round(
        completionPercentage * 0.6 +
          (uniquePatients / (p.totalSessions || 1)) * 40,
      );

      return {
        physioName: p.physioName,
        totalSessions: p.totalSessions,
        completedSessions: p.completedSessions,
        cancelledSessions: p.cancelledSessions,
        pendingSessions: p.pendingSessions,
        uniquePatients,
        avgSessionsPerPatient,
        completionPercentage,
        productivityScore,
      };
    });
  };
  const exportPhysioPerformancePDF = (months, selectedPhysio) => {
    const data = generatePhysioPerformance(months, selectedPhysio);

    const doc = new jsPDF("landscape");
    addHeader(doc, isHodSelected ? "HOD Report" : "Physio Report");

    doc.setFontSize(14);
    doc.text(`Physio Performance Report - Last ${months} Months`, 14, 45);
    // create chart canvas
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 300;

    const ctx = canvas.getContext("2d");

    const labels = data.map((p) => p.physioName);
    const completed = data.map((p) => p.completedSessions);
    const cancelled = data.map((p) => p.cancelledSessions);

    new ChartJS(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Completed Sessions",
            data: completed,
            backgroundColor: "#4CAF50",
          },
          {
            label: "Cancelled Sessions",
            data: cancelled,
            backgroundColor: "#F44336",
          },
        ],
      },
      options: {
        responsive: false,
        plugins: {
          legend: { position: "top" },
        },
      },
    });

    setTimeout(() => {
      const chartImage = canvas.toDataURL("image/png");

      // add chart
      doc.addImage(chartImage, "PNG", 15, 55, 260, 80);

      // table data
      const tableRows = data.map((p, index) => [
        index + 1,
        p.physioName,
        p.totalSessions,
        p.completedSessions,
        p.cancelledSessions,
        p.pendingSessions,
        p.uniquePatients,
        p.avgSessionsPerPatient,
        p.completionPercentage + "%",
        p.productivityScore,
      ]);

      autoTable(doc, {
        startY: 140,
        head: [
          [
            "S.No",
            "Physio",
            "Total Sessions",
            "Completed",
            "Cancelled",
            "Pending",
            "Unique Patients",
            "Avg Sessions / Patient",
            "Completion %",
            "Productivity Score",
          ],
        ],
        body: tableRows,
        styles: {
          fontSize: 8,
          cellPadding: 2,
          overflow: "linebreak",
        },
        columnStyles: {
          1: { cellWidth: 40 },
        },
      });

      // download PDF
      doc.save(`Physio_Performance_Last_${months}_Months.pdf`);
    }, 300);
  };
  const exportPhysioPerformanceExcel = (months, selectedPhysio) => {
    const data = generatePhysioPerformance(months, selectedPhysio);

    const rows = data.map((p, index) => ({
      "S.No": index + 1,
      Physio: p.physioName,
      "Total Sessions": p.totalSessions,
      Completed: p.completedSessions,
      Cancelled: p.cancelledSessions,
      Pending: p.pendingSessions,
      "Unique Patients": p.uniquePatients,
      "Avg Sessions / Patient": p.avgSessionsPerPatient,
      "Completion %": p.completionPercentage + "%",
      "Productivity Score": p.productivityScore,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Physio Performance");

    XLSX.writeFile(wb, `Physio_Performance_Last_${months}_Months.xlsx`);
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
  ];

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
  // API calls
  // ---------------------------
  const getAllReviews = async () => {
    try {
      const shouldFilterByPhysio = selectedPhysio !== "all" && !isHodSelected;

      const payload = {
        month: Number(selectedMonth),
        year: Number(selectedYear),
        ...(shouldFilterByPhysio ? { physioId: selectedPhysio } : {}),
        ...(selectedReference !== "all"
          ? { referenceId: selectedReference }
          : {}),
      };

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
  const processDashboardData = (sessionsData) => {
    if (!Array.isArray(sessionsData)) return;

    const cancelledSessions = sessionsData.filter(
      (s) => normalize(s.sessionStatusId?.sessionStatusName) === "cancelled",
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
          month: Number(selectedMonth),
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

  const totalLeaveDays = useMemo(() => {
    return filteredLeaves.reduce((sum, leave) => {
      return sum + getLeaveDaysCount(leave);
    }, 0);
  }, [filteredLeaves]);

  useEffect(() => {
    setStats((prev) => ({
      ...prev,
      patient: computedStats.totalPatients,
      physio: computedStats.totalPhysio,
      monthlySessions: isHodSelected
        ? filteredReviews.length
        : computedStats.totalSessions,
      sessionCompleted: isHodSelected
        ? computedStats.completedReviews
        : computedStats.completedSessions,
      cancelledSessions: computedStats.cancelledSessions,
      monthlyExpenses: computedStats.monthlyExpenses,
      pendingreviews: computedStats.pendingReviews,
      completedReview: computedStats.completedReviews,
    }));

    setSummary({
      cancelledSessions: computedStats.cancelledSessions,
    });
  }, [computedStats, isHodSelected, filteredReviews.length]);
  const avgPatient =
    computedStats.totalPhysio > 0
      ? Math.floor(computedStats.totalPatients / computedStats.totalPhysio)
      : 0;

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
      const status = normalize(session?.sessionStatusId?.sessionStatusName);

      if (status === "completed") {
        grouped[physioId].completedSessions += 1;
      }

      if (["canceled", "cancelled"].includes(status)) {
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
      ["Total Leave Days", computedStats.totalLeaveDays],
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
      ["Total Leave Days", computedStats.totalLeaveDays],
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
      ["Total Leave Days:", computedStats.totalLeaveDays],
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
  const [months, setMonths] = useState(1);

  return (
    <div className="space-y-6 p-2 md:p-0">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col space-y-4"
      >
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
                <SelectItem key={month} value={String(index)}>
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

              <Button
                variant="outline"
                onClick={() => exportHodPerformancePDF(months)}
              >
                <Download className="h-4 w-4 mr-2" />
                HOD PDF
              </Button>

              <Button
                variant="outline"
                onClick={() => exportHodPerformanceExcel(months)}
              >
                <Download className="h-4 w-4 mr-2" />
                HOD Excel
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
                onClick={handleExportPatientList}
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
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
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
        {isHodSelected && (
          <Card className="medical-card hover:shadow-lg transition-shadow">
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
                {monthNames[Number(selectedMonth)]} {selectedYear}
              </p>
            </CardContent>
          </Card>
        )}

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
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
              <div className="h-[260px] sm:h-[300px] md:h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expensePieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={window.innerWidth < 640 ? 70 : 100}
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
                    className="flex items-center justify-between gap-3 flex-wrap border rounded-lg p-3"
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
        <Card className="medical-card border-none shadow-sm">
          <CardHeader className="px-4 py-5 sm:px-6">
            <CardTitle className="text-xl font-bold text-gray-900">
              Physio Wise Report View
            </CardTitle>
            <CardDescription className="text-sm">
              Assigned patients, session count, completed/canceled sessions, and
              leave details
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
                            value={`${item.completionPercentage}%`}
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
                                item.assignedPatients.map((patient, index) => (
                                  <tr
                                    key={patient?._id || index}
                                    className="hover:bg-slate-50/50 transition-colors"
                                  >
                                    <td className="px-3 py-3 text-gray-400">
                                      {index + 1}
                                    </td>
                                    <td className="px-3 py-3 font-mono text-xs text-gray-600">
                                      {patient?.patientCode || "N/A"}
                                    </td>
                                    <td className="px-4 py-3 font-semibold text-gray-800">
                                      {patient?.patientName || "N/A"}
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
                                      {patient?.sessionCount ?? 0}
                                    </td>
                                  </tr>
                                ))
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
      )}

      {/* Helper component to keep the code clean */}
    </div>
  );
  function StatBox({ label, value, bg, text }) {
    return (
      <div
        className={`rounded-xl ${bg} p-2 sm:p-3 flex flex-col justify-center border border-black/5`}
      >
        <p className="text-[10px] sm:text-xs text-gray-500 font-medium leading-tight mb-1">
          {label}
        </p>
        <p
          className={`text-base sm:text-lg font-extrabold ${text} leading-none`}
        >
          {value}
        </p>
      </div>
    );
  }
};

export default Reports;
