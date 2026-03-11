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
  const [referenceList, setReferenceList] = useState([]);
  const [expensesData, setExpensesData] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [patientList, setPatientList] = useState([]);
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
  const [summary, setSummary] = useState({
    cancelledSessions: 0,
  });

  const [reportData, setReportData] = useState({
    patientHistory: [],
    feedback: [],
  });

  const [funnel, setFunnel] = useState({
    newEnquiries: 0,
    newConsultations: 0,
    newPatients: 0,
    conversionRate: 0,
  });

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
      null
    );
  };

  const getSessionReferenceName = (session) => {
    return (
      session?.sourceId?.sourceName ||
      session?.referenceId?.sourceName ||
      session?.leadId?.sourceId?.sourceName ||
      session?.patientId?.sourceId?.sourceName ||
      "N/A"
    );
  };

  const handleExportPatientList = () => {
    console.log("Clicking is work");

    if (filteredPatientList.length === 0) {
      toast({
        title: "No data",
        description: "No patients found for the selected reference.",
        variant: "destructive",
      });
      return;
    }

    const selectedReferenceName =
      selectedReference === "all"
        ? "All References"
        : referenceList.find(
            (ref) => String(ref._id) === String(selectedReference),
          )?.sourceName || "Reference";

    const selectedMonthName = `${monthNames[Number(selectedMonth)]} ${selectedYear}`;
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
      Physio: patient?.physioId?.physioName || "N/A",
      Reference: patient?.ReferenceId?.sourceName || "N/A",
      "Session Count": patient?.sessionCount ?? 0,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData, { origin: "A5" });

    XLSX.utils.sheet_add_aoa(worksheet, [
      ["Reference:", selectedReferenceName],
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
      `Patient_List_${selectedReferenceName.replace(/\s+/g, "_")}_${selectedMonthName}.xlsx`,
    );
  };
  const handleExportPatientListPDF = () => {
    if (filteredPatientList.length === 0) {
      toast({
        title: "No data",
        description: "No patients found for the selected reference.",
        variant: "destructive",
      });
      return;
    }

    const doc = new jsPDF("l", "mm", "a4");

    const selectedReferenceName =
      selectedReference === "all"
        ? "All References"
        : referenceList.find(
            (ref) => String(ref._id) === String(selectedReference),
          )?.sourceName || "Reference";

    const selectedMonthName = `${monthNames[Number(selectedMonth)]} ${selectedYear}`;
    const totalPatients = filteredPatientList.length;

    doc.setFontSize(16);
    doc.text("Reference Wise Patient List", 14, 15);

    doc.setFontSize(11);
    doc.text(`Reference: ${selectedReferenceName}`, 14, 24);
    doc.text(`Month: ${selectedMonthName}`, 14, 31);
    doc.text(`Total Patients: ${totalPatients}`, 14, 38);
    doc.text(`Generated On: ${new Date().toLocaleDateString("en-GB")}`, 14, 45);

    const tableData = filteredPatientList.map((patient, index) => [
      index + 1,
      patient?.patientCode || "N/A",
      patient?.patientName || "N/A",
      patient?.patientNumber || "N/A",
      patient?.patientGenderId?.genderName || "N/A",
      patient?.patientAge || "N/A",
      patient?.patientCondition || "N/A",
      patient?.physioId?.physioName || "N/A",
      patient?.ReferenceId?.sourceName || "N/A",
      patient?.sessionCount ?? 0,
    ]);

    autoTable(doc, {
      startY: 55,
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
      `Patient_List_${selectedReferenceName.replace(/\s+/g, "_")}_${selectedMonthName}.pdf`,
    );
  };
  const handleExportCSV = () => {
    const rows = [
      ["Metric", "Value"],
      ["Total Patients", stats.patient],
      ["Total Physio", stats.physio],
      ["Total Sessions", stats.monthlySessions],
      ["Completed Sessions", stats.sessionCompleted],
      ["Cancelled Sessions", stats.cancelledSessions],
      ["Monthly Revenue", stats.monthlyRevenue],
      ["Monthly Expenses", stats.monthlyExpenses],
      ["Recovered Patients", stats.patientRecover],
      ["Pending Reviews", stats.pendingreviews],
      ["Completed Reviews", stats.completedReview],
      ["Today's Sessions", todaySessionCount],
      ["Average Patient per Physio", avgPatient],
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);

    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `report_${monthNames[selectedMonth]}_${selectedYear}.csv`,
    );

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Physio Report", 14, 20);

    doc.setFontSize(12);
    doc.text(`Month: ${monthNames[selectedMonth]} ${selectedYear}`, 14, 30);

    const tableData = [
      ["Total Patients", stats.patient],
      ["Total Physio", stats.physio],
      ["Total Sessions", stats.monthlySessions],
      ["Completed Sessions", stats.sessionCompleted],
      ["Cancelled Sessions", stats.cancelledSessions],
      ["Monthly Revenue", `Rs${stats.monthlyRevenue}`],
      ["Monthly Expenses", `Rs${stats.monthlyExpenses}`],
      ["Recovered Patients", stats.patientRecover],
      ["Pending Reviews", stats.pendingreviews],
      ["Completed Reviews", stats.completedReview],
      ["Today's Sessions", todaySessionCount],
      ["Avg Patient / Physio", avgPatient],
    ];

    autoTable(doc, {
      startY: 40,
      head: [["Metric", "Value"]],
      body: tableData,
    });

    doc.save(`report_${monthNames[selectedMonth]}_${selectedYear}.pdf`);
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

      const response = await apiRequest("Session/getAllSession", {
        method: "POST",
        body: JSON.stringify({
          physioId: user?._id,
          storedRole,
        }),
      });

      if (!Array.isArray(response)) return;

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

  useEffect(() => {
    getAllDashBoard();
    getSession();
    getAllPatients();
    getAllReference();
    getAllExpenses();
  }, []);

  useEffect(() => {
    funnelmonthly();
    getMonthlyRevenue();
  }, [selectedMonth, selectedYear]);

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (!s.sessionDate) return false;
      const d = new Date(s.sessionDate);
      return (
        d.getMonth() === Number(selectedMonth) &&
        d.getFullYear() === Number(selectedYear)
      );
    });
  }, [sessions, selectedMonth, selectedYear]);

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

  useEffect(() => {
    const totalPatients = new Set(
      filteredSessions
        .map((s) => s.patientId?._id || s.patientId)
        .filter(Boolean),
    ).size;

    const totalPhysio = new Set(
      filteredSessions
        .map((s) => s.physioId?._id || s.physioId)
        .filter(Boolean),
    ).size;

    const completedSessions = filteredSessions.filter(
      (s) => s.sessionStatusId?.sessionStatusName === "Completed",
    ).length;

    const cancelledSessions = filteredSessions.filter(
      (s) => s.sessionStatusId?.sessionStatusName === "Canceled",
    ).length;

    const monthlyExpenses = filteredExpenses.reduce(
      (sum, exp) => sum + Number(exp.expenseAmount || 0),
      0,
    );

    setStats((prev) => ({
      ...prev,
      patient: totalPatients,
      physio: totalPhysio,
      monthlySessions: filteredSessions.length,
      sessionCompleted: completedSessions,
      cancelledSessions,
      monthlyExpenses,
    }));

    setSummary({
      cancelledSessions,
    });
  }, [filteredSessions, filteredExpenses]);
  const avgPatient =
    stats.physio > 0
      ? Math.floor((stats.patient / stats.physio).toFixed(1))
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
  const statCards = [
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
      title: "Total Sessions",
      value: stats.monthlySessions,
      icon: Activity,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Completed Sessions",
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
  const filteredPatientList = useMemo(() => {
    return patientList.filter((patient) => {
      const matchesReference =
        selectedReference === "all" ||
        String(patient?.ReferenceId?._id || patient?.ReferenceId || "") ===
          String(selectedReference);

      if (!matchesReference) return false;

      const patientDate =
        patient?.createdAt ||
        patient?.consultationDate ||
        patient?.sessionStartDate ||
        null;

      if (!patientDate) return false;

      const d = new Date(patientDate);

      return (
        d.getMonth() === Number(selectedMonth) &&
        d.getFullYear() === Number(selectedYear)
      );
    });
  }, [patientList, selectedReference, selectedMonth, selectedYear]);

  return (
    <div className="space-y-6 p-2 md:p-0">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0"
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
            <SelectContent
              position="popper"
              side="bottom"
              align="start"
              sideOffset={6}
              avoidCollisions={false}
              className="z-[99999] max-h-72 overflow-auto w-[--radix-select-trigger-width] bg-white border shadow-lg h-[200px]"
            >
              <SelectItem value="all">All References</SelectItem>
              {referenceList.map((ref) => (
                <SelectItem key={ref._id} value={String(ref._id)}>
                  {ref.sourceName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            className="flex-1 md:flex-none"
            onClick={handleExportPatientList}
          >
            <Download className="h-4 w-4 mr-2" />
            XLSX
          </Button>
          <Button
            variant="outline"
            className="flex-1 md:flex-none"
            onClick={handleExportPatientListPDF}
          >
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-full md:w-40">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select Month" />
            </SelectTrigger>
            <SelectContent
              position="popper"
              side="bottom"
              align="start"
              sideOffset={6}
              avoidCollisions={false}
              className="z-[99999] max-h-72 overflow-auto w-[--radix-select-trigger-width] bg-white border shadow-lg h-[200px]"
            >
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
            <SelectContent
              position="popper"
              side="bottom"
              align="start"
              sideOffset={6}
              avoidCollisions={false}
              className="z-[99999] max-h-72 overflow-auto w-[--radix-select-trigger-width] bg-white border shadow-lg h-[200px]"
            >
              {years.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex w-full md:w-auto space-x-2">
            <Button
              variant="outline"
              className="flex-1 md:flex-none"
              onClick={handleExportCSV}
            >
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>

            <Button
              variant="outline"
              className="flex-1 md:flex-none"
              onClick={handleExportPDF}
            >
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>
      </motion.div>

      {/* NORMAL CARDS */}
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

      {/* FUNNEL NORMAL CARDS */}
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

      {/* EXPENSE PIE CHART */}
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
    </div>
  );
};

export default Reports;
