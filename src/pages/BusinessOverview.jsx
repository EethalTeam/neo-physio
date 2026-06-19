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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Wallet,
  PlusCircle,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Calendar as CalendarIcon,
  Filter,
  Search,
  FileText,
  List,
  Download,
  BarChart3,
  PieChart as PieChartIcon,
  Users,
  Activity,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { format, getYear, getMonth } from "date-fns";
import { Pie, Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "@/components/CustomComponents/apiRequest";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
);

const BusinessOverview = () => {
  const navigate = useNavigate();
  const { user, getPermissionsByPath } = useAuth();

  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [patientList, setPatientList] = useState([]);
  const [allSessions, setAllSessions] = useState([]);
  const [selectedReference, setSelectedReference] = useState("all");

  const [masters, setMasters] = useState({
    patients: [],
    physio: [],
    machines: [],
    references: [],
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTx, setEditingTx] = useState(null);

  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString(),
  );
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().getMonth().toString(),
  );

  const [Permissions, setPermissions] = useState({
    isAdd: false,
    isView: false,
    isEdit: false,
    isDelete: false,
  });

  const [filterState, setFilterState] = useState({
    ExpenseCategoryId: "",
    ExpenseCategoryName: "",
    linkedEntity: {},
    year: new Date().getFullYear().toString(),
    month: "all",
  });

  const [advancedFilteredTransactions, setAdvancedFilteredTransactions] =
    useState(null);

  const initialFormState = {
    ExpenseTypeID: "",
    ExpenseTypeName: "",
    ExpenseCategoryId: "",
    ExpenseCategoryName: "",
    expenseDate: new Date(),
    expenseAmount: "",
    PhysioId: "",
    physioDescription: "",
    officeExpDes: "",
    ReferenceId: "",
    PatientId: "",
    referenceDes: "",
    MachineiId: "",
    machineDes: "",
    otherDescription: "",
    description: "",
    linkedEntity: {},
  };

  const [formState, setFormState] = useState(initialFormState);
  const [expenseType, setExpenseType] = useState([]);
  const [expenseCategory, setExpenseCategory] = useState([]);

  useEffect(() => {
    AOS.init({ duration: 700, once: true, easing: "ease-out-cubic" });
    const fetchAll = async () => {
      try {
        await Promise.all([
          getAllPhysio(),
          getExpenseType(),
          getAllExpenseCategory(),
          getAllReference(),
          getAllPatient(),
          getAllMachie(),
        ]);
      } catch (error) {
        console.error(error);
      }
    };
    fetchAll();
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
      getExpense();
    }
  }, [Permissions]);

  useEffect(() => {
    getAllSessionsData(Number(selectedYear));
  }, [selectedYear]);

  const getExpense = async (data) => {
    try {
      const response = await apiRequest("Expense/getAllExpense", {
        method: "POST",
        body: JSON.stringify(data || {}),
      });

      const expenseList = response?.data || response || [];

      const mappedTransactions = expenseList.map((item) => ({
        id: item._id,
        _id: item._id,
        type:
          item?.ExpenseTypeID?.ExpenseTypeName === "Income" ||
          item?.ExpenseTypeID?.ExpenseTypeName === "Revenue" ||
          item?.ExpenseTypeID?.ExpenseTypeName === "Revenue from Patient"
            ? "Income"
            : "Expense",
        category: item?.ExpenseCategoryId?.ExpenseCategoryName || "-",
        date: item?.expenseDate,
        amount: Number(item?.expenseAmount || 0),
        description:
          item?.officeExpDes ||
          item?.physioDescription ||
          item?.referenceDes ||
          item?.machineDes ||
          item?.otherDescription ||
          "-",
        ExpenseCategoryId: item?.ExpenseCategoryId?._id || "",
        ExpenseCategoryName: item?.ExpenseCategoryId?.ExpenseCategoryName || "",
        ExpenseTypeID: item?.ExpenseTypeID?._id || "",
        ExpenseTypeName: item?.ExpenseTypeID?.ExpenseTypeName || "",
        PhysioId: item?.PhysioId?._id || "",
        physioName: item?.PhysioId?.physioName || "",
        PatientId: item?.PatientId?._id || "",
        patientName: item?.PatientId?.patientName || "",
        ReferenceId: item?.ReferenceId?._id || "",
        sourceName: item?.ReferenceId?.sourceName || "",
        MachineiId: item?.MachineiId?._id || "",
        machineName: item?.MachineiId?.machineName || "",
        linkedEntity: {
          physioName: item?.PhysioId?._id || "",
          patientName: item?.PatientId?._id || "",
          sourceName: item?.ReferenceId?._id || "",
          machineId: item?.MachineiId?._id || "",
        },
        raw: item,
      }));

      setTransactions(mappedTransactions);
      return expenseList;
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  };

  const createExpense = async (data) => {
    try {
      const response = await apiRequest("Expense/createExpense", {
        method: "POST",
        body: JSON.stringify({
          createdBy: user?.physioName || "",
          ...data,
        }),
      });

      await getExpense();

      return response?.data || response;
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  };
  const updateExpense = async (data) => {
    try {
      const response = await apiRequest("Expense/updateExpense", {
        method: "POST",
        body: JSON.stringify({
          updatedBy: user?.physioName || "",
          ...data,
        }),
      });

      await getExpense();

      return response?.data || response;
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  };
  const openEditDialog = (tx) => {
    setEditingTx(tx);

    const raw = tx?.raw || {};

    setFormState({
      ExpenseTypeID: tx?.ExpenseTypeID || "",
      ExpenseTypeName: tx?.ExpenseTypeName || "",
      ExpenseCategoryId: tx?.ExpenseCategoryId || "",
      ExpenseCategoryName: tx?.ExpenseCategoryName || "",
      expenseDate: raw?.expenseDate ? new Date(raw.expenseDate) : new Date(),
      expenseAmount: tx?.amount || "",
      PhysioId: tx?.PhysioId || "",
      physioDescription: raw?.physioDescription || "",
      officeExpDes: raw?.officeExpDes || "",
      ReferenceId: tx?.ReferenceId || "",
      PatientId: tx?.PatientId || "",
      referenceDes: raw?.referenceDes || "",
      MachineiId: tx?.MachineiId || "",
      machineDes: raw?.machineDes || "",
      otherDescription: raw?.otherDescription || "",
      description: raw?.officeExpDes || tx?.description || "",
      linkedEntity: {
        physioName: tx?.PhysioId || "",
        patientName: tx?.PatientId || "",
        sourceName: tx?.ReferenceId || "",
        machineId: tx?.MachineiId || "",
      },
    });

    setIsFormOpen(true);
  };
  const getAllPhysio = async (data) => {
    try {
      const response = await apiRequest("Physio/getAllPhysio", {
        method: "POST",
        body: JSON.stringify(data || {}),
      });
      setMasters((prev) => ({ ...prev, physio: response?.physios || [] }));
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  };

  const getExpenseType = async (data) => {
    try {
      const response = await apiRequest("ExpenseType/getAllExpenseType", {
        method: "POST",
        body: JSON.stringify(data || {}),
      });
      setExpenseType(response || []);
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  };

  const getAllExpenseCategory = async (data) => {
    try {
      const response = await apiRequest(
        "ExpenseCategory/getAllExpenseCategory",
        {
          method: "POST",
          body: JSON.stringify(data || {}),
        },
      );
      setExpenseCategory(response || []);
      setCategories(response || []);
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  };

  const getAllReference = async (data) => {
    try {
      const response = await apiRequest("References/getALLReferences", {
        method: "POST",
        body: JSON.stringify(data || {}),
      });
      setMasters((prev) => ({ ...prev, references: response || [] }));
      return response;
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  };

  const getAllPatient = async (data) => {
    try {
      const response = await apiRequest("Patient/getAllPatient", {
        method: "POST",
        body: JSON.stringify(data || {}),
      });

      const patients = response || [];
      setPatientList(patients);
      setMasters((prev) => ({ ...prev, patients }));
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  };

  const getAllMachie = async (data) => {
    try {
      const response = await apiRequest("Machinery/getAllMachinery", {
        method: "POST",
        body: JSON.stringify(data || {}),
      });

      setMasters((prev) => ({ ...prev, machines: response || [] }));
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  };

  const getAllSessionsData = async (year) => {
    try {
      const targetYear = year || Number(selectedYear);
      // Fetch all 12 months in parallel to get full-year session data
      const results = await Promise.all(
        Array.from({ length: 12 }, (_, i) =>
          apiRequest("Session/getSessionsByMonthYear", {
            method: "POST",
            body: JSON.stringify({ month: i + 1, year: targetYear }),
          })
        )
      );
      const sessions = results.flatMap((res) =>
        Array.isArray(res?.data) ? res.data : []
      );
      setAllSessions(sessions);
    } catch (error) {
      console.error("Error fetching yearly sessions:", error);
    }
  };

  const handleFormChange = (name, value) => {
    if (name === "linkedEntity") {
      setFormState((prev) => ({ ...prev, linkedEntity: value || {} }));
      return;
    }

    if (name.startsWith("linkedEntity.")) {
      const key = name.split(".")[1];
      setFormState((prev) => ({
        ...prev,
        linkedEntity: { ...prev.linkedEntity, [key]: value },
      }));
    } else {
      setFormState((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFilterChange = (name, value) => {
    if (name === "linkedEntity") {
      setFilterState((prev) => ({ ...prev, linkedEntity: value || {} }));
      return;
    }

    if (name.startsWith("linkedEntity.")) {
      const key = name.split(".")[1];
      setFilterState((prev) => ({
        ...prev,
        linkedEntity: { ...prev.linkedEntity, [key]: value },
      }));
    } else {
      setFilterState((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (name, value) => {
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const openNewDialog = () => {
    setEditingTx(null);
    setFormState(initialFormState);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const selectedCategory = categories.find(
      (c) => c._id?.toString() === formState.ExpenseCategoryId?.toString(),
    );

    if (!selectedCategory && formState.ExpenseTypeName === "Expenses") {
      toast({
        title: "Error",
        description: "Please select a valid Expense Category",
        variant: "destructive",
      });
      return;
    }

    const transactionDate = formState.expenseDate
      ? new Date(formState.expenseDate)
      : new Date();

    if (isNaN(transactionDate.getTime())) {
      toast({
        title: "Error",
        description: "Please select a valid date",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      _id: editingTx?._id || null,
      ExpenseTypeID: formState.ExpenseTypeID || null,
      ExpenseCategoryId: formState.ExpenseCategoryId || null,
      expenseDate: format(transactionDate, "yyyy-MM-dd"),
      expenseAmount: parseFloat(formState.expenseAmount) || 0,
      PhysioId:
        formState.PhysioId || formState.linkedEntity?.physioName || null,
      PatientId:
        formState.PatientId || formState.linkedEntity?.patientName || null,
      ReferenceId:
        formState.ReferenceId || formState.linkedEntity?.sourceName || null,
      MachineiId:
        formState.MachineiId || formState.linkedEntity?.machineId || null,
      physioDescription: formState.physioDescription || "",
      officeExpDes: formState.description || formState.officeExpDes || "",
      referenceDes: formState.referenceDes || "",
      machineDes: formState.machineDes || "",
      otherDescription: formState.otherDescription || "",
    };

    try {
      if (editingTx?._id) {
        await updateExpense(payload);
        toast({
          title: "Success",
          description: "Transaction updated successfully.",
        });
      } else {
        await createExpense(payload);
        toast({
          title: "Success",
          description: "New transaction added.",
        });
      }

      setIsFormOpen(false);
      setEditingTx(null);
      setFormState(initialFormState);
    } catch (error) {
      toast({
        title: "Error",
        description: error?.message || "Failed to save transaction. Try again.",
        variant: "destructive",
      });
    }
  };

  const handleApplyAdvancedFilter = () => {
    let filtered = transactions.filter((tx) => {
      if (!tx.date) return false;
      const txDate = new Date(tx.date);
      const yearMatch = getYear(txDate).toString() === filterState.year;
      const monthMatch =
        filterState.month === "all" ||
        getMonth(txDate).toString() === filterState.month;

      return tx.type === "Expense" && yearMatch && monthMatch;
    });

    if (filterState.ExpenseCategoryId) {
      filtered = filtered.filter(
        (tx) =>
          tx.ExpenseCategoryId?.toString() ===
          filterState.ExpenseCategoryId?.toString(),
      );
    }

    const linkedEntityFilters = Object.entries(filterState.linkedEntity).filter(
      ([_, value]) => value,
    );

    if (linkedEntityFilters.length > 0) {
      filtered = filtered.filter((tx) => {
        if (!tx.linkedEntity) return false;
        return linkedEntityFilters.every(([key, value]) => {
          return tx.linkedEntity[key] === value;
        });
      });
    }

    setAdvancedFilteredTransactions(filtered);
    toast({
      title: "Filter Applied",
      description: `Found ${filtered.length} transactions.`,
    });
  };

  const clearAdvancedFilter = () => {
    setFilterState({
      ExpenseCategoryId: "",
      ExpenseCategoryName: "",
      linkedEntity: {},
      year: new Date().getFullYear().toString(),
      month: "all",
    });
    setAdvancedFilteredTransactions(null);
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (!tx.date) return false;
      const txDate = new Date(tx.date);
      const yearMatch = getYear(txDate).toString() === selectedYear;
      const monthMatch = getMonth(txDate).toString() === selectedMonth;
      return yearMatch && monthMatch;
    });
  }, [transactions, selectedYear, selectedMonth]);

  const incomeTransactions = useMemo(
    () => filteredTransactions.filter((t) => t.type === "Income"),
    [filteredTransactions],
  );

  const expenseTransactions = useMemo(
    () => filteredTransactions.filter((t) => t.type === "Expense"),
    [filteredTransactions],
  );

  const totalIncome = useMemo(
    () => incomeTransactions.reduce((sum, t) => sum + Number(t.amount), 0),
    [incomeTransactions],
  );

  const totalExpense = useMemo(
    () => expenseTransactions.reduce((sum, t) => sum + Number(t.amount), 0),
    [expenseTransactions],
  );

  const netBalance = totalIncome - totalExpense;

  const advancedFilterTotal = useMemo(() => {
    if (!advancedFilteredTransactions) return 0;
    return advancedFilteredTransactions.reduce(
      (sum, tx) => sum + Number(tx.amount || 0),
      0,
    );
  }, [advancedFilteredTransactions]);

  const referenceList = useMemo(
    () => masters.references || [],
    [masters.references],
  );

  const filteredPatientList = useMemo(() => {
    let filtered = [...patientList];

    if (selectedReference !== "all") {
      filtered = filtered.filter(
        (patient) =>
          patient?.ReferenceId?._id?.toString() ===
          selectedReference.toString(),
      );
    }

    return filtered;
  }, [patientList, selectedReference]);

  const getWeeklyRevenueForChart = async () => {
    try {
      const res = await apiRequest("Expense/getWeeklyRevenue", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const apiData = res?.weeklyDayWiseRevenue;

      if (!apiData || typeof apiData !== "object") {
        console.error("Invalid API response:", apiData);
        return;
      }

      // Convert object to arrays
      const labels = Object.keys(apiData); // ["Monday", "Tuesday", ...]
      const data = Object.values(apiData); // [11076.846, 0, 0, ...]

      setDailyRevenueData({
        labels: labels,
        datasets: [
          {
            label: "Weekly Revenue",
            data: data,
            borderColor: "#22c55e",
            backgroundColor: "rgba(34,197,94,0.2)",
            tension: 0.3,
            fill: true,
          },
        ],
      });
    } catch (error) {
      console.error("Error fetching weekly revenue:", error);
    }
  };
  useEffect(() => {
    getWeeklyRevenueForChart();
  }, []);

  const expenseByCategory = useMemo(() => {
    const data = expenseTransactions.reduce((acc, tx) => {
      acc[tx.category] = (acc[tx.category] || 0) + Number(tx.amount || 0);
      return acc;
    }, {});

    return {
      labels: Object.keys(data),
      datasets: [
        {
          data: Object.values(data),
          backgroundColor: [
            "#3b82f6",
            "#ef4444",
            "#f97316",
            "#8b5cf6",
            "#10b981",
            "#f59e0b",
            "#6366f1",
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [expenseTransactions]);

  const incomeVsExpensePieData = useMemo(() => {
    return {
      labels: ["Income", "Expense"],
      datasets: [
        {
          data: [totalIncome, totalExpense],
          backgroundColor: ["#22c55e", "#ef4444"],
          borderWidth: 1,
        },
      ],
    };
  }, [totalIncome, totalExpense]);

  const monthWise12MonthsData = useMemo(() => {
    const selectedYearNumber = Number(selectedYear);
    const labels = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const incomeData = Array(12).fill(0);
    const expenseData = Array(12).fill(0);

    transactions.forEach((tx) => {
      if (!tx.date) return;
      const txDate = new Date(tx.date);
      const year = txDate.getFullYear();
      const month = txDate.getMonth();

      if (year === selectedYearNumber) {
        if (tx.type === "Income") {
          incomeData[month] += Number(tx.amount || 0);
        } else {
          expenseData[month] += Number(tx.amount || 0);
        }
      }
    });

    return {
      labels,
      datasets: [
        {
          label: "Income",
          data: incomeData,
          borderColor: "#22c55e",
          backgroundColor: "rgba(34,197,94,0.2)",
          tension: 0.3,
          fill: false,
        },
        {
          label: "Expense",
          data: expenseData,
          borderColor: "#ef4444",
          backgroundColor: "rgba(239,68,68,0.2)",
          tension: 0.3,
          fill: false,
        },
      ],
    };
  }, [transactions, selectedYear]);

  const currentVsPreviousMonthData = useMemo(() => {
    const currentYear = Number(selectedYear);
    const currentMonth = Number(selectedMonth);

    let prevMonth = currentMonth - 1;
    let prevYear = currentYear;

    if (prevMonth < 0) {
      prevMonth = 11;
      prevYear = currentYear - 1;
    }

    let currentIncome = 0;
    let currentExpense = 0;
    let previousIncome = 0;
    let previousExpense = 0;

    transactions.forEach((tx) => {
      if (!tx.date) return;
      const txDate = new Date(tx.date);
      const year = txDate.getFullYear();
      const month = txDate.getMonth();
      const amount = Number(tx.amount || 0);

      if (year === currentYear && month === currentMonth) {
        if (tx.type === "Income") currentIncome += amount;
        else currentExpense += amount;
      }

      if (year === prevYear && month === prevMonth) {
        if (tx.type === "Income") previousIncome += amount;
        else previousExpense += amount;
      }
    });
    const monthOptions = [
      { value: "all", label: "All Months" },
      { value: "0", label: "January" },
      { value: "1", label: "February" },
      { value: "2", label: "March" },
      { value: "3", label: "April" },
      { value: "4", label: "May" },
      { value: "5", label: "June" },
      { value: "6", label: "July" },
      { value: "7", label: "August" },
      { value: "8", label: "September" },
      { value: "9", label: "October" },
      { value: "10", label: "November" },
      { value: "11", label: "December" },
    ];
    const reportMonthOptions = monthOptions.filter((m) => m.value !== "all");

    const currentLabel =
      reportMonthOptions.find((m) => Number(m.value) === currentMonth)?.label ||
      "Current Month";
    const previousLabel =
      monthOptions.find((m) => Number(m.value) === prevMonth)?.label ||
      "Previous Month";

    return {
      labels: [previousLabel, currentLabel],
      datasets: [
        {
          label: "Income",
          data: [previousIncome, currentIncome],
          backgroundColor: "#22c55e",
        },
        {
          label: "Expense",
          data: [previousExpense, currentExpense],
          backgroundColor: "#ef4444",
        },
      ],
    };
  }, [transactions, selectedYear, selectedMonth]);

  const handleExportPatientList = () => {
    if (filteredPatientList.length === 0) {
      toast({
        title: "No data",
        description: "No patients found for the selected reference.",
        variant: "destructive",
      });
      return;
    }
    const reportMonthOptions = monthOptions.filter((m) => m.value !== "all");

    const selectedMonthLabel =
      reportMonthOptions.find((m) => m.value === selectedMonth)?.label || "";

    const selectedReferenceName =
      selectedReference === "all"
        ? "All_References"
        : referenceList.find(
            (ref) => String(ref._id) === String(selectedReference),
          )?.sourceName || "Selected_Reference";

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

    exportData.push(
      {},
      {
        "S.No": "",
        "Patient Code": "",
        "Patient Name": "",
        "Mobile Number": "",
        Gender: "",
        Age: "",
        Address: "",
        Condition: "",
        Physio: "",
        Reference: "Total Patients",
        "Session Count": filteredPatientList.length,
      },
    );

    const worksheet = XLSX.utils.json_to_sheet(exportData);

    worksheet["!cols"] = [
      { wch: 8 },
      { wch: 15 },
      { wch: 24 },
      { wch: 18 },
      { wch: 12 },
      { wch: 8 },
      { wch: 28 },
      { wch: 25 },
      { wch: 20 },
      { wch: 20 },
      { wch: 14 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Patient List");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const fileData = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });

    saveAs(
      fileData,
      `Patient_List_${selectedReferenceName}_${selectedMonthLabel}_${selectedYear}.xlsx`,
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
    const reportMonthOptions = monthOptions.filter((m) => m.value !== "all");

    const selectedMonthLabel =
      reportMonthOptions.find((m) => m.value === selectedMonth)?.label || "";

    const selectedReferenceName =
      selectedReference === "all"
        ? "All References"
        : referenceList.find(
            (ref) => String(ref._id) === String(selectedReference),
          )?.sourceName || "Selected Reference";

    doc.setFontSize(16);
    doc.text("Reference Wise Patient List", 14, 15);

    doc.setFontSize(10);
    doc.text(`Month: ${selectedMonthLabel} ${selectedYear}`, 14, 23);
    doc.text(`Reference: ${selectedReferenceName}`, 14, 29);
    doc.text(`Total Patients: ${filteredPatientList.length}`, 14, 35);

    const tableBody = filteredPatientList.map((patient, index) => [
      index + 1,
      patient?.patientCode || "N/A",
      patient?.patientName || "N/A",
      patient?.patientNumber || "N/A",
      patient?.patientGenderId?.genderName || "N/A",
      patient?.patientAge || "N/A",
      patient?.patientAddress || "N/A",
      patient?.patientCondition || "N/A",
      patient?.physioId?.physioName || "N/A",
      patient?.ReferenceId?.sourceName || "N/A",
      patient?.sessionCount ?? 0,
    ]);

    autoTable(doc, {
      startY: 42,
      head: [
        [
          "S.No",
          "Patient Code",
          "Patient Name",
          "Mobile",
          "Gender",
          "Age",
          "Address",
          "Condition",
          "Physio",
          "Reference",
          "Session Count",
        ],
      ],
      body: tableBody,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [41, 128, 185],
      },
    });

    doc.save(
      `Patient_List_${selectedReferenceName}_${selectedMonthLabel}_${selectedYear}.pdf`,
    );
  };

  const renderDynamicFields = (state, handler, isFilter = false) => {
    const category = state?.ExpenseCategoryName || "";

    if (!category)
      return !isFilter ? (
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={state.description || ""}
            onChange={(e) => handler("description", e.target.value)}
            required
          />
        </div>
      ) : null;

    const commonFields = !isFilter ? (
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={state.description || ""}
          onChange={(e) => handler("description", e.target.value)}
          required
        />
      </div>
    ) : null;

    const onValueChange = (val, name) => handler(name, val);

    switch (category) {
      case "Revenue from Patient":
        return (
          <>
            <div className="space-y-2">
              <Label>Patient Name</Label>
              <Select
                value={state.linkedEntity?.patientName || ""}
                onValueChange={(val) =>
                  onValueChange(val, "linkedEntity.patientName")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Patient" />
                </SelectTrigger>
                <SelectContent>
                  {(masters.patients || []).map((p) => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.patientName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {commonFields}
          </>
        );

      case "Other Income":
        return (
          <>
            <div className="space-y-2">
              <Label>Source Name</Label>
              <Input
                value={state.linkedEntity?.sourceName || ""}
                onChange={(e) =>
                  handler("linkedEntity.sourceName", e.target.value)
                }
                placeholder="e.g. Asset Sale"
              />
            </div>
            {commonFields}
          </>
        );

      case "Physio Salary":
        return (
          <>
            <div className="space-y-2">
              <Label>Physio Name</Label>
              <Select
                value={state.linkedEntity?.physioName || ""}
                onValueChange={(val) =>
                  onValueChange(val, "linkedEntity.physioName")
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={isFilter ? "All Physio" : "Select Physio"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {(masters.physio || []).map((p) => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.physioName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {commonFields}
          </>
        );

      case "Machine Maintenance":
        return (
          <>
            <div className="space-y-2">
              <Label>Machine</Label>
              <Select
                value={
                  isFilter
                    ? state.linkedEntity?.machineId || ""
                    : state.MachineiId || ""
                }
                onValueChange={(val) =>
                  isFilter
                    ? handler("linkedEntity.machineId", val)
                    : handler("MachineiId", val)
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={isFilter ? "All Machines" : "Select Machine"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {(masters.machines || []).map((m) => (
                    <SelectItem key={m._id} value={m._id}>
                      {m?.modalityId?.modalitiesName?.trim() ||
                        m?.machineName ||
                        "Unnamed Machine"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {commonFields}
          </>
        );

      case "Referral Commission":
        return (
          <>
            <div className="space-y-2">
              <Label>Reference Name</Label>
              <Select
                value={state.linkedEntity?.sourceName || ""}
                onValueChange={(val) =>
                  onValueChange(val, "linkedEntity.sourceName")
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      isFilter ? "All References" : "Select Reference"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {(masters.references || []).map((r) => (
                    <SelectItem key={r._id} value={r._id}>
                      {r.sourceName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Patient Name</Label>
              <Select
                value={state.linkedEntity?.patientName || ""}
                onValueChange={(val) =>
                  onValueChange(val, "linkedEntity.patientName")
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={isFilter ? "All Patients" : "Select Patient"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {(masters.patients || []).map((p) => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.patientName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {commonFields}
          </>
        );

      default:
        return commonFields;
    }
  };
  const TransactionTable = ({ data, type }) => (
    <div className="w-full min-w-0 overflow-hidden rounded-xl border bg-white">
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-slate-50">
            <tr className="border-b">
              <th className="p-3 text-left font-semibold text-gray-600">
                Date
              </th>
              <th className="p-3 text-left font-semibold text-gray-600">
                Category
              </th>
              <th className="p-3 text-left font-semibold text-gray-600">
                Description
              </th>
              <th className="p-3 text-right font-semibold text-gray-600">
                Amount
              </th>
              {Permissions.isEdit && (
                <th className="p-3 text-center font-semibold text-gray-600">
                  Action
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((tx) => (
                <tr key={tx.id} className="border-b hover:bg-gray-50/50">
                  <td className="p-3 text-gray-700">
                    {tx.date ? format(new Date(tx.date), "dd MMM, yyyy") : "-"}
                  </td>
                  <td className="p-3 text-gray-700">{tx.category}</td>
                  <td className="max-w-xs truncate p-3 text-gray-500">
                    {tx.description}
                  </td>
                  <td
                    className={`p-3 text-right font-medium ${
                      type === "Income" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    ₹{Number(tx.amount || 0).toLocaleString()}
                  </td>

                  {Permissions.isEdit && (
                    <td className="p-3 text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(tx)}
                      >
                        Edit
                      </Button>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={Permissions.isEdit ? 5 : 4}
                  className="p-6 text-center text-gray-500"
                >
                  No records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 p-3 md:hidden">
        {data.length > 0 ? (
          data.map((tx) => (
            <div
              key={tx.id}
              className="w-full min-w-0 rounded-xl border bg-white p-3 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-gray-500">Date</p>
                  <p className="text-sm font-medium text-gray-800">
                    {tx.date ? format(new Date(tx.date), "dd MMM, yyyy") : "-"}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-[11px] text-gray-500">Amount</p>
                  <p
                    className={`text-sm font-semibold ${
                      type === "Income" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    ₹{Number(tx.amount || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                <div>
                  <p className="text-[11px] text-gray-500">Category</p>
                  <p className="text-sm text-gray-800">{tx.category}</p>
                </div>

                <div>
                  <p className="text-[11px] text-gray-500">Description</p>
                  <p className="text-sm text-gray-600 break-words">
                    {tx.description}
                  </p>
                </div>
              </div>

              {Permissions.isEdit && (
                <div className="mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => openEditDialog(tx)}
                  >
                    Edit
                  </Button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="p-6 text-center text-gray-500">No records found</div>
        )}
      </div>
    </div>
  );

  const yearOptions = useMemo(() => {
    const years = [2030, 2029, 2028, 2027, 2026, 2025, 2024];
    return Array.from(years)
      .sort((a, b) => b - a)
      .map(String);
  }, []);
  const monthOptions = [
    { value: "all", label: "All Months" },
    { value: "0", label: "January" },
    { value: "1", label: "February" },
    { value: "2", label: "March" },
    { value: "3", label: "April" },
    { value: "4", label: "May" },
    { value: "5", label: "June" },
    { value: "6", label: "July" },
    { value: "7", label: "August" },
    { value: "8", label: "September" },
    { value: "9", label: "October" },
    { value: "10", label: "November" },
    { value: "11", label: "December" },
  ];
  const reportMonthOptions = monthOptions.filter((m) => m.value !== "all");
  const [dailyRevenueData, setDailyRevenueData] = useState({
    labels: [],
    datasets: [
      {
        label: "Weekly Revenue",
        data: [],
        borderColor: "#22c55e",
        backgroundColor: "rgba(34,197,94,0.2)",
        tension: 0.3,
        fill: true,
      },
    ],
  });
  const monthlyProfitData = useMemo(() => {
    const selectedYearNumber = Number(selectedYear);
    const labels = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const profitData = Array(12).fill(0);

    transactions.forEach((tx) => {
      if (!tx.date) return;
      const txDate = new Date(tx.date);
      if (txDate.getFullYear() === selectedYearNumber) {
        const month = txDate.getMonth();
        const amount = Number(tx.amount || 0);

        // Calculate Net: Income increases profit, Expense decreases it
        if (tx.type === "Income") {
          profitData[month] += amount;
        } else {
          profitData[month] -= amount;
        }
      }
    });

    return {
      labels,
      datasets: [
        {
          label: `Monthly Profit (${selectedYear})`,
          data: profitData,
          // Dynamic colors: Green for profit, Red for loss
          backgroundColor: profitData.map((val) =>
            val >= 0 ? "rgba(34, 197, 94, 0.6)" : "rgba(239, 68, 68, 0.6)",
          ),
          borderColor: profitData.map((val) =>
            val >= 0 ? "#22c55e" : "#ef4444",
          ),
          borderWidth: 1,
        },
      ],
    };
  }, [transactions, selectedYear]);

  const averageRevenueData = useMemo(() => {
    const selectedYearNumber = Number(selectedYear);
    const labels = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const monthlyRevenue = Array(12).fill(0);
    // Unique patients who had a session each month of the selected year
    const sessionPatientsPerMonth = Array.from({ length: 12 }, () => new Set());

    // 1. Monthly revenue from income transactions
    transactions.forEach((tx) => {
      if (!tx.date || tx.type !== "Income") return;
      const txDate = new Date(tx.date);
      if (txDate.getFullYear() === selectedYearNumber) {
        monthlyRevenue[txDate.getMonth()] += Number(tx.amount || 0);
      }
    });

    // 2. Unique patients with sessions in each month
    allSessions.forEach((session) => {
      const dateStr = session.sessionDate || session.date;
      if (!dateStr) return;
      const sDate = new Date(dateStr);
      if (sDate.getFullYear() !== selectedYearNumber) return;
      const patientId =
        session.patientId?._id || session.patientId || session.PatientId;
      if (patientId) {
        sessionPatientsPerMonth[sDate.getMonth()].add(String(patientId));
      }
    });

    // 3. Average = revenue / unique patients with sessions that month
    const patientCounts = sessionPatientsPerMonth.map((s) => s.size);
    const averageData = monthlyRevenue.map((revenue, index) => {
      const patientCount = patientCounts[index];
      return patientCount > 0
        ? parseFloat((revenue / patientCount).toFixed(2))
        : 0;
    });

    return {
      labels,
      datasets: [
        {
          type: "line",
          label: "Avg Revenue per Patient (₹)",
          data: averageData,
          borderColor: "#8b5cf6",
          backgroundColor: "rgba(139, 92, 246, 0.1)",
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          yAxisID: "y",
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          type: "bar",
          label: "Patient Count",
          data: patientCounts,
          backgroundColor: "rgba(34, 197, 94, 0.4)",
          borderColor: "rgba(34, 197, 94, 0.8)",
          borderWidth: 1,
          borderRadius: 4,
          yAxisID: "y1",
        },
      ],
    };
  }, [transactions, allSessions, selectedYear]);

  const avgRevenuePerSessionData = useMemo(() => {
    const selectedYearNumber = Number(selectedYear);
    const labels = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    const monthlyRevenue = Array(12).fill(0);
    const sessionCountPerMonth = Array(12).fill(0);

    // 1. Monthly revenue from income transactions
    transactions.forEach((tx) => {
      if (!tx.date || tx.type !== "Income") return;
      const txDate = new Date(tx.date);
      if (txDate.getFullYear() === selectedYearNumber) {
        monthlyRevenue[txDate.getMonth()] += Number(tx.amount || 0);
      }
    });

    // 2. Total sessions per month
    allSessions.forEach((session) => {
      const dateStr = session.sessionDate || session.date;
      if (!dateStr) return;
      const sDate = new Date(dateStr);
      if (sDate.getFullYear() !== selectedYearNumber) return;
      sessionCountPerMonth[sDate.getMonth()]++;
    });

    // 3. Average = revenue / total sessions that month
    const averageData = monthlyRevenue.map((revenue, index) => {
      const sessionCount = sessionCountPerMonth[index];
      return sessionCount > 0
        ? parseFloat((revenue / sessionCount).toFixed(2))
        : 0;
    });

    return {
      labels,
      datasets: [
        {
          type: "line",
          label: "Avg Revenue per Session (₹)",
          data: averageData,
          borderColor: "#0ea5e9",
          backgroundColor: "rgba(14, 165, 233, 0.1)",
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          yAxisID: "y",
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          type: "bar",
          label: "Session Count",
          data: sessionCountPerMonth,
          backgroundColor: "rgba(249, 115, 22, 0.4)",
          borderColor: "rgba(249, 115, 22, 0.8)",
          borderWidth: 1,
          borderRadius: 4,
          yAxisID: "y1",
        },
      ],
    };
  }, [transactions, allSessions, selectedYear]);

  // Feature 9: Expense category spend trend across 12 months
  const expenseCategoryTrendData = useMemo(() => {
    const selectedYearNumber = Number(selectedYear);
    const labels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const categoryMap = {};

    transactions.forEach((tx) => {
      if (!tx.date || tx.type !== "Expense") return;
      const txDate = new Date(tx.date);
      if (txDate.getFullYear() !== selectedYearNumber) return;
      const cat = tx.ExpenseCategoryName || tx.category || "Other";
      if (!categoryMap[cat]) categoryMap[cat] = Array(12).fill(0);
      categoryMap[cat][txDate.getMonth()] += Number(tx.amount || 0);
    });

    const palette = ["#ef4444","#f97316","#eab308","#22c55e","#0ea5e9","#8b5cf6","#ec4899","#14b8a6"];
    const datasets = Object.entries(categoryMap).map(([name, data], i) => ({
      label: name,
      data,
      borderColor: palette[i % palette.length],
      backgroundColor: palette[i % palette.length] + "33",
      borderWidth: 2,
      tension: 0.4,
      fill: false,
      pointRadius: 3,
    }));

    return { labels, datasets };
  }, [transactions, selectedYear]);

  // Feature 4: Session count by day of week
  const sessionByDayData = useMemo(() => {
    const selectedYearNumber = Number(selectedYear);
    const dayCounts = [0, 0, 0, 0, 0, 0, 0]; // 0=Sun … 6=Sat

    allSessions.forEach((session) => {
      const dateStr = session.sessionDate || session.date;
      if (!dateStr) return;
      const sDate = new Date(dateStr);
      if (sDate.getFullYear() !== selectedYearNumber) return;
      dayCounts[sDate.getDay()]++;
    });

    // Reorder Mon→Sun
    const ordered = [dayCounts[1],dayCounts[2],dayCounts[3],dayCounts[4],dayCounts[5],dayCounts[6],dayCounts[0]];

    return {
      labels: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
      datasets: [{
        label: "Sessions",
        data: ordered,
        backgroundColor: ordered.map((_, i) =>
          i >= 5 ? "rgba(239,68,68,0.5)" : "rgba(14,165,233,0.5)"
        ),
        borderColor: ordered.map((_, i) => i >= 5 ? "#ef4444" : "#0ea5e9"),
        borderWidth: 1,
        borderRadius: 6,
      }],
    };
  }, [allSessions, selectedYear]);

  // Feature 5: New vs Returning patients per month
  const newVsReturningData = useMemo(() => {
    const selectedYearNumber = Number(selectedYear);
    const labels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const monthPatients = Array.from({ length: 12 }, () => new Set());

    allSessions.forEach((session) => {
      const dateStr = session.sessionDate || session.date;
      if (!dateStr) return;
      const sDate = new Date(dateStr);
      if (sDate.getFullYear() !== selectedYearNumber) return;
      const pid = String(session.patientId?._id || session.patientId || "");
      if (pid) monthPatients[sDate.getMonth()].add(pid);
    });

    const seenBefore = new Set();
    const newCounts = Array(12).fill(0);
    const returningCounts = Array(12).fill(0);

    monthPatients.forEach((patients, monthIdx) => {
      patients.forEach((pid) => {
        if (seenBefore.has(pid)) {
          returningCounts[monthIdx]++;
        } else {
          newCounts[monthIdx]++;
          seenBefore.add(pid);
        }
      });
    });

    return {
      labels,
      datasets: [
        {
          label: "New Patients",
          data: newCounts,
          backgroundColor: "rgba(34,197,94,0.6)",
          borderColor: "#22c55e",
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: "Returning Patients",
          data: returningCounts,
          backgroundColor: "rgba(99,102,241,0.6)",
          borderColor: "#6366f1",
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    };
  }, [allSessions, selectedYear]);

  // Feature 1: Month-over-month patient retention rate
  const patientRetentionData = useMemo(() => {
    const selectedYearNumber = Number(selectedYear);
    const labels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const monthPatients = Array.from({ length: 12 }, () => new Set());

    allSessions.forEach((session) => {
      const dateStr = session.sessionDate || session.date;
      if (!dateStr) return;
      const sDate = new Date(dateStr);
      if (sDate.getFullYear() !== selectedYearNumber) return;
      const pid = String(session.patientId?._id || session.patientId || "");
      if (pid) monthPatients[sDate.getMonth()].add(pid);
    });

    const retentionRates = labels.map((_, i) => {
      if (i === 0) return null;
      const prev = monthPatients[i - 1];
      const curr = monthPatients[i];
      if (prev.size === 0) return null;
      const retained = [...prev].filter((pid) => curr.has(pid)).length;
      return parseFloat(((retained / prev.size) * 100).toFixed(1));
    });

    return {
      labels,
      datasets: [{
        label: "Retention Rate (%)",
        data: retentionRates,
        borderColor: "#f59e0b",
        backgroundColor: "rgba(245,158,11,0.1)",
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        spanGaps: true,
      }],
    };
  }, [allSessions, selectedYear]);

const [scrChartData, setScrChartData] = useState(Array(12).fill(0));
  const [fySummary, setFySummary] = useState(null);

  const getFYSummary = async () => {
    try {
      const res = await apiRequest("Expense/getFinancialYearSummary", {
        method: "POST",
        body: JSON.stringify({ year: selectedYear }),
      });
      setFySummary(res.data);
    } catch (error) {
      console.error("FY Summary Error:", error);
    }
  };

  // Update your useEffect to trigger this when the year changes
  useEffect(() => {
    if (Permissions.isView) {
      getFYSummary();
    }
  }, [selectedYear, Permissions.isView]);

  const yearlyComparisonData = useMemo(() => {
    const yearlyLabels = ["2024-2025", "2025-2026", "2026-2027"];

    // Fixed previous year data
    const incomeData = [3099950, 3600000, 0];
    const expenseData = [0, 0, 0];

    let currentIncome = 0;
    let currentExpense = 0;

    transactions.forEach((tx) => {
      if (!tx.date) return;

      const date = new Date(tx.date);
      const year = date.getFullYear();
      const month = date.getMonth();

      // FY 2026-2027 (Apr 2026 - Mar 2027)
      const isCurrentFY =
        (year === 2026 && month >= 3) || (year === 2027 && month <= 2);

      if (isCurrentFY) {
        if (tx.type === "Income") {
          currentIncome += Number(tx.amount || 0);
        } else if (tx.type === "Expense") {
          currentExpense += Number(tx.amount || 0);
        }
      }
    });

    // push current year calculated values
    incomeData[2] = currentIncome;
    expenseData[2] = currentExpense;

    return {
      labels: yearlyLabels,
      datasets: [
        {
          label: "Yearly Income",
          data: incomeData,
          backgroundColor: [
            "rgba(16, 185, 129, 0.6)",
            "rgba(16, 185, 129, 0.6)",
            "#10b981",
          ],
          borderRadius: 6,
        },
        {
          label: "Yearly Expense",
          data: expenseData,
          backgroundColor: "rgba(244, 63, 94, 0.6)",
          borderRadius: 6,
        },
      ],
    };
  }, [transactions]);
  const fetchSCR = async () => {
    try {
      // We send the selectedYear to the backend to get the specific month-wise breakdown
      const response = await apiRequest(
        `Session/getSCRStats?year=${selectedYear}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ year: selectedYear }),
        },
      );

      if (response?.success) {
        const monthlyValues = Array(12).fill(0);

        // The backend returns an array of { month: 1, scr: 85.5 }
        response.data.forEach((item) => {
          const monthIndex = item.month - 1;
          monthlyValues[monthIndex] = parseFloat(item.scr.toFixed(1));
        });

        setScrChartData(monthlyValues);
      }
    } catch (error) {
      console.error("Error fetching SCR:", error);
    }
  };

  useEffect(() => {
    if (Permissions.isView) {
      fetchSCR();
    }
  }, [selectedYear, Permissions.isView]);

  const sessionCompletionRateData = useMemo(() => {
    return {
      labels: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
      datasets: [
        {
          label: "Session Completion Rate (%)",
          data: scrChartData, // Use the state fetched from the backend
          borderColor: "#10b981",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
        },
      ],
    };
  }, [scrChartData]);

  return (
    <div className="w-full min-w-0 max-w-full space-y-4 overflow-x-hidden px-2 pb-4 sm:space-y-6 sm:px-4 md:px-6">
      <div
        data-aos="fade-down"
        data-aos-duration="600"
        className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
      >
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-lg font-bold text-gray-900 sm:gap-3 sm:text-2xl md:text-3xl">
            <Wallet size={24} className="shrink-0 sm:h-7 sm:w-7" />
            <span className="truncate">Business Overview</span>
          </h1>
          <p className="mt-1 text-sm text-gray-600 sm:mt-2 sm:text-base">
            Track all income and expenses in one place.
          </p>
        </div>

        {Permissions.isAdd && (
          <Button
            onClick={openNewDialog}
            className="w-full shadow-lg shadow-blue-500/20 transition-shadow hover:shadow-xl md:w-auto"
          >
            <PlusCircle size={18} className="mr-2" />
            Add Transaction
          </Button>
        )}
      </div>

      <Tabs defaultValue="monthly_report" className="w-full min-w-0">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-2 rounded-xl bg-muted p-1 sm:grid-cols-3 xl:grid-cols-7">
          <TabsTrigger
            value="monthly_report"
            className="w-full whitespace-normal break-words px-2 py-2 text-[11px] leading-tight sm:text-sm"
          >
            Monthly Report
          </TabsTrigger>
          <TabsTrigger
            value="all_records"
            className="w-full whitespace-normal break-words px-2 py-2 text-[11px] leading-tight sm:text-sm"
          >
            All Data
          </TabsTrigger>
          <TabsTrigger
            value="expenses"
            className="w-full whitespace-normal break-words px-2 py-2 text-[11px] leading-tight sm:text-sm"
          >
            Expenses
          </TabsTrigger>
          <TabsTrigger
            value="income"
            className="w-full whitespace-normal break-words px-2 py-2 text-[11px] leading-tight sm:text-sm"
          >
            Income
          </TabsTrigger>
          <TabsTrigger
            value="expense_chart"
            className="w-full whitespace-normal break-words px-2 py-2 text-[11px] leading-tight sm:text-sm"
          >
            Expense Chart
          </TabsTrigger>
          <TabsTrigger
            value="summary_charts"
            className="w-full whitespace-normal break-words px-2 py-2 text-[11px] leading-tight sm:text-sm"
          >
            Summary Charts
          </TabsTrigger>
          <TabsTrigger
            value="advanced_filter"
            className="w-full whitespace-normal break-words px-2 py-2 text-[11px] leading-tight sm:text-sm"
          >
            Advanced Filter
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="monthly_report"
          className="mt-4 space-y-4 sm:space-y-6"
        >
          <div data-aos="fade-down"><Card className="rounded-2xl">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500 sm:h-5 sm:w-5" />
                <h3 className="text-sm font-semibold sm:text-lg">
                  Report Filters
                </h3>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="year-select">Year</Label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger id="year-select" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent
                      position="popper"
                      side="bottom"
                      align="start"
                      sideOffset={6}
                      avoidCollisions={false}
                      className="z-[99999] max-h-72 overflow-auto border bg-white shadow-lg"
                    >
                      {yearOptions.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="month-select">Month</Label>
                  <Select
                    value={selectedMonth}
                    onValueChange={setSelectedMonth}
                  >
                    <SelectTrigger id="month-select" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent
                      position="popper"
                      side="bottom"
                      align="start"
                      sideOffset={6}
                      avoidCollisions={false}
                      className="z-[99999] max-h-72 overflow-auto border bg-white shadow-lg"
                    >
                      {reportMonthOptions.map((month) => (
                        <SelectItem key={month.value} value={month.value}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Reference</Label>
                  <Select
                    value={selectedReference}
                    onValueChange={setSelectedReference}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Reference" />
                    </SelectTrigger>
                    <SelectContent
                      position="popper"
                      side="bottom"
                      align="start"
                      sideOffset={6}
                      avoidCollisions={false}
                      className="z-[99999] max-h-72 overflow-auto border bg-white shadow-lg"
                    >
                      <SelectItem value="all">All References</SelectItem>
                      {referenceList.map((ref) => (
                        <SelectItem key={ref._id} value={String(ref._id)}>
                          {ref.sourceName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={handleExportPatientList}
                >
                  <Download className="mr-2 h-4 w-4" />
                  XLSX
                </Button>

                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={handleExportPatientListPDF}
                >
                  <Download className="mr-2 h-4 w-4" />
                  PDF
                </Button>
              </div>
            </CardContent>
          </Card></div>

          <div className="space-y-6 p-4">
            {/* TOP SUMMARY STATS - 3 COLUMN GRID */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div data-aos="fade-up" data-aos-delay="0">
              <Card className="rounded-2xl border-l-4 border-l-green-500 shadow-sm">
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Monthly Income
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="break-all text-xl font-bold text-green-600 sm:text-2xl">
                    <AnimatedNumber value={`₹${totalIncome.toLocaleString()}`} />
                  </div>
                </CardContent>
              </Card>
              </div>

              <div data-aos="fade-up" data-aos-delay="80">
              <Card className="rounded-2xl border-l-4 border-l-red-500 shadow-sm">
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Monthly Expense
                  </CardTitle>
                  <TrendingDown className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="break-all text-xl font-bold text-red-600 sm:text-2xl">
                    <AnimatedNumber value={`₹${totalExpense.toLocaleString()}`} />
                  </div>
                </CardContent>
              </Card>
              </div>

              <div data-aos="fade-up" data-aos-delay="160" className="md:col-span-2 xl:col-span-1">
              <Card className="rounded-2xl border-l-4 border-l-blue-500 shadow-sm">
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Monthly Net
                  </CardTitle>
                  <IndianRupee
                    className={`h-4 w-4 ${netBalance >= 0 ? "text-blue-500" : "text-orange-500"}`}
                  />
                </CardHeader>
                <CardContent>
                  <div
                    className={`break-all text-xl font-bold sm:text-2xl ${netBalance >= 0 ? "text-blue-600" : "text-orange-600"}`}
                  >
                    <AnimatedNumber value={`₹${netBalance.toLocaleString()}`} />
                  </div>
                </CardContent>
              </Card>
              </div>
            </div>

            {/* MAIN CHARTS SECTION */}
            <div data-aos="fade-up" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 1. MULTI-YEAR GROWTH BAR CHART */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                    Multi-Year Revenue Growth
                  </CardTitle>
                  <CardDescription>
                    Comparison of last 3 Financial Years
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <Bar
                      data={yearlyComparisonData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { position: "bottom" },
                          tooltip: {
                            callbacks: {
                              label: (context) =>
                                `${context.dataset.label}: ₹${context.raw.toLocaleString("en-IN")}`,
                            },
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: {
                              callback: (value) => `₹${value / 100000}L`,
                            },
                          },
                          x: { grid: { display: false } },
                        },
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* 2. MONTHLY PROFIT OVERVIEW BAR CHART */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    Monthly Profit Overview
                  </CardTitle>
                  <CardDescription>
                    Net profit/loss per month for {selectedYear}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <Bar
                      data={monthlyProfitData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                          tooltip: {
                            callbacks: {
                              label: (context) =>
                                `Net: ₹${context.raw.toLocaleString()}`,
                            },
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: {
                              callback: (value) => `₹${value.toLocaleString()}`,
                            },
                          },
                        },
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* 3. AVERAGE REVENUE PER PATIENT LINE CHART */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-purple-500" />
                    Average Revenue Per Patient
                  </CardTitle>
                  <CardDescription>
                    Total income ÷ unique patients ({selectedYear})
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <Line
                      data={averageRevenueData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: true, position: "top" },
                          tooltip: {
                            callbacks: {
                              label: (context) =>
                                context.dataset.yAxisID === "y1"
                                  ? `Patients: ${context.raw}`
                                  : `Avg Revenue: ₹${Number(context.raw).toLocaleString()}`,
                            },
                          },
                        },
                        scales: {
                          y: {
                            type: "linear",
                            position: "left",
                            beginAtZero: true,
                            ticks: {
                              callback: (value) => `₹${value.toLocaleString()}`,
                            },
                            grid: { color: "rgba(0,0,0,0.05)" },
                          },
                          y1: {
                            type: "linear",
                            position: "right",
                            beginAtZero: true,
                            ticks: {
                              stepSize: 1,
                              callback: (value) => `${value} pts`,
                            },
                            grid: { drawOnChartArea: false },
                          },
                        },
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* 4. AVERAGE REVENUE PER SESSION LINE CHART */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-sky-500" />
                    Average Revenue Per Session
                  </CardTitle>
                  <CardDescription>
                    Total income ÷ total sessions ({selectedYear})
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <Line
                      data={avgRevenuePerSessionData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: true, position: "top" },
                          tooltip: {
                            callbacks: {
                              label: (context) =>
                                context.dataset.yAxisID === "y1"
                                  ? `Sessions: ${context.raw}`
                                  : `Avg Revenue: ₹${Number(context.raw).toLocaleString()}`,
                            },
                          },
                        },
                        scales: {
                          y: {
                            type: "linear",
                            position: "left",
                            beginAtZero: true,
                            ticks: {
                              callback: (value) => `₹${value.toLocaleString()}`,
                            },
                            grid: { color: "rgba(0,0,0,0.05)" },
                          },
                          y1: {
                            type: "linear",
                            position: "right",
                            beginAtZero: true,
                            ticks: {
                              stepSize: 1,
                              callback: (value) => `${value} sess`,
                            },
                            grid: { drawOnChartArea: false },
                          },
                        },
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* 6. SESSION FREQUENCY BY DAY OF WEEK */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-sky-500" />
                    Session Frequency by Day
                  </CardTitle>
                  <CardDescription>
                    Total sessions per weekday — weekends highlighted ({selectedYear})
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <Bar
                      data={sessionByDayData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                          tooltip: {
                            callbacks: {
                              label: (context) => `Sessions: ${context.raw}`,
                            },
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: { stepSize: 1, callback: (v) => `${v}` },
                          },
                        },
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* 7. NEW VS RETURNING PATIENTS BAR CHART */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-indigo-500" />
                    New vs Returning Patients
                  </CardTitle>
                  <CardDescription>
                    First-visit vs repeat patients per month ({selectedYear})
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <Bar
                      data={newVsReturningData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: true, position: "top" },
                          tooltip: {
                            callbacks: {
                              label: (context) =>
                                `${context.dataset.label}: ${context.raw}`,
                            },
                          },
                        },
                        scales: {
                          x: { stacked: false },
                          y: { beginAtZero: true, ticks: { stepSize: 1 } },
                        },
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* 8. PATIENT RETENTION RATE */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-amber-500" />
                    Patient Retention Rate
                  </CardTitle>
                  <CardDescription>
                    % of last month's patients who returned this month ({selectedYear})
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <Line
                      data={patientRetentionData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                          tooltip: {
                            callbacks: {
                              label: (context) =>
                                context.raw != null
                                  ? `Retention: ${context.raw}%`
                                  : "No data",
                            },
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            max: 100,
                            ticks: { callback: (v) => `${v}%` },
                          },
                        },
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* 9. EXPENSE CATEGORY TREND */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-red-500" />
                    Expense Category Trend
                  </CardTitle>
                  <CardDescription>
                    Monthly spend per category — spot creeping costs ({selectedYear})
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <Line
                      data={expenseCategoryTrendData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: true, position: "top" },
                          tooltip: {
                            callbacks: {
                              label: (context) =>
                                `${context.dataset.label}: ₹${Number(context.raw).toLocaleString()}`,
                            },
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: {
                              callback: (v) => `₹${v.toLocaleString()}`,
                            },
                          },
                        },
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* 5. SESSION COMPLETION RATE (SCR) LINE CHART */}
              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-base font-semibold">
                      Session Completion Rate (SCR)
                    </CardTitle>
                    <CardDescription>Target: 90%+</CardDescription>
                  </div>
                  <div className="text-emerald-600 font-medium text-xs flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {selectedYear} Performance
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <Line
                      data={sessionCompletionRateData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                          tooltip: {
                            callbacks: {
                              label: (context) => `SCR: ${context.raw}%`,
                            },
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            max: 100,
                            ticks: { callback: (value) => `${value}%` },
                          },
                        },
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

          </div>
        </TabsContent>

        <TabsContent value="all_records" className="mt-4">
          <div className="space-y-6">
            <div data-aos="fade-up">
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-green-700">
                    <List size={18} />
                    Income Records
                  </CardTitle>
                  <CardDescription>
                    All income entries ({transactions.filter(t => t.type === "Income").length} records)
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-3 pb-4 sm:px-6">
                  <TransactionTable
                    data={transactions.filter(t => t.type === "Income")}
                    type="Income"
                  />
                </CardContent>
              </Card>
            </div>

            <div data-aos="fade-up">
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-red-700">
                    <List size={18} />
                    Expense Records
                  </CardTitle>
                  <CardDescription>
                    All expense entries ({transactions.filter(t => t.type === "Expense").length} records)
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-3 pb-4 sm:px-6">
                  <TransactionTable
                    data={transactions.filter(t => t.type === "Expense")}
                    type="Expense"
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="mt-4">
          <div data-aos="fade-up"><Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Expense Records</CardTitle>
              <CardDescription>
                Showing transactions for{" "}
                {reportMonthOptions.find((m) => m.value === selectedMonth)
                  ?.label || ""}{" "}
                {selectedYear}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-3 pb-4 sm:px-6">
              <TransactionTable data={expenseTransactions} type="Expense" />
            </CardContent>
          </Card></div>
        </TabsContent>

        <TabsContent value="income" className="mt-4">
          <div data-aos="fade-up"><Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Income Records</CardTitle>
              <CardDescription>
                Showing transactions for{" "}
                {reportMonthOptions.find((m) => m.value === selectedMonth)
                  ?.label || ""}{" "}
                {selectedYear}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-3 pb-4 sm:px-6">
              <TransactionTable data={incomeTransactions} type="Income" />
            </CardContent>
          </Card></div>
        </TabsContent>
        <TabsContent
          value="expense_chart"
          className="mt-4 w-full min-w-0 max-w-full overflow-hidden"
        >
          <div data-aos="fade-up"><Card className="w-full min-w-0 max-w-full rounded-2xl overflow-hidden">
            <CardHeader className="px-3 py-3">
              <CardTitle className="text-sm font-semibold sm:text-base md:text-2xl">
                Expense Breakdown
              </CardTitle>
              <CardDescription className="text-[11px] leading-relaxed break-words sm:text-sm">
                Expenses by category for{" "}
                {reportMonthOptions.find((m) => m.value === selectedMonth)
                  ?.label || ""}{" "}
                {selectedYear}
              </CardDescription>
            </CardHeader>

            <CardContent className="w-full max-w-full overflow-hidden px-2 pb-3 pt-0 sm:px-4 md:px-6">
              <div className="relative h-[200px] w-full max-w-full overflow-hidden sm:h-[260px] md:h-[350px]">
                {expenseTransactions.length > 0 ? (
                  <Pie
                    data={expenseByCategory}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      resizeDelay: 0,
                      layout: {
                        padding: 2,
                      },
                      plugins: {
                        legend: {
                          position: "bottom",
                          align: "center",
                          labels: {
                            boxWidth: 8,
                            padding: 6,
                            font: {
                              size: 8,
                            },
                          },
                        },
                      },
                    }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center px-2 text-center text-xs text-gray-500">
                    No expense data for the selected period.
                  </div>
                )}
              </div>
            </CardContent>
          </Card></div>
        </TabsContent>
        <TabsContent value="summary_charts" className="mt-4">
          <div data-aos="fade-up" className="grid grid-cols-1 gap-4 sm:gap-6 2xl:grid-cols-2">
            {/* Income vs Expense */}
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-2xl">
                  <PieChartIcon className="h-5 w-5" />
                  Income vs Expense
                </CardTitle>
                <CardDescription>
                  Combined pie chart for selected month
                </CardDescription>
              </CardHeader>

              <CardContent className="p-3 sm:p-6">
                <div className="h-[260px] w-full sm:h-[320px] md:h-[350px]">
                  <Pie
                    data={incomeVsExpensePieData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: "bottom",
                          labels: {
                            boxWidth: 12,
                            font: { size: 10 },
                          },
                        },
                      },
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Weekly Daily Revenue */}
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-2xl">
                  <BarChart3 className="h-5 w-5" />
                  Weekly Revenue
                </CardTitle>
                <CardDescription>
                  Revenue grouped by weekday (Mon–Sun)
                </CardDescription>
              </CardHeader>

              <CardContent className="p-3 sm:p-6">
                <div className="h-[260px] w-full sm:h-[320px] md:h-[350px]">
                  <Line
                    data={dailyRevenueData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: "top",
                          labels: {
                            boxWidth: 12,
                            font: { size: 10 },
                          },
                        },
                      },
                      scales: {
                        x: {
                          ticks: { font: { size: 10 } },
                        },
                        y: {
                          beginAtZero: true,
                          ticks: { font: { size: 10 } },
                        },
                      },
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Previous vs Current Month */}
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-2xl">
                  <BarChart3 className="h-5 w-5" />
                  Previous vs Current Month
                </CardTitle>
                <CardDescription>
                  Compare income and expense between 2 months
                </CardDescription>
              </CardHeader>

              <CardContent className="p-3 sm:p-6">
                <div className="h-[260px] w-full sm:h-[320px] md:h-[350px]">
                  <Bar
                    data={currentVsPreviousMonthData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: "top",
                          labels: {
                            boxWidth: 12,
                            font: { size: 10 },
                          },
                        },
                      },
                      scales: {
                        x: {
                          ticks: {
                            font: { size: 10 },
                          },
                        },
                        y: {
                          beginAtZero: true,
                          ticks: {
                            font: { size: 10 },
                          },
                        },
                      },
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* 12 Months Chart */}
            <Card className="rounded-2xl 2xl:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-2xl">
                  <BarChart3 className="h-5 w-5" />
                  12 Months Income vs Expense
                </CardTitle>
                <CardDescription>
                  Full year monthly comparison for {selectedYear}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-3 sm:p-6">
                <div className="h-[240px] w-full sm:h-[320px] md:h-[420px]">
                  <Line
                    data={monthWise12MonthsData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: "top",
                          labels: {
                            boxWidth: 12,
                            font: { size: 10 },
                          },
                        },
                      },
                      scales: {
                        x: {
                          ticks: {
                            font: { size: 10 },
                            maxRotation: 0,
                            minRotation: 0,
                          },
                        },
                        y: {
                          beginAtZero: true,
                          ticks: {
                            font: { size: 10 },
                          },
                        },
                      },
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="advanced_filter" className="mt-4 space-y-4">
          <div data-aos="fade-up"><Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-2xl">
                <Search className="h-5 w-5" />
                Advanced Expense Filter
              </CardTitle>
              <CardDescription>
                Drill down into your expenses with specific criteria.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-4 rounded-xl border bg-gray-50/50 p-3 sm:p-4">
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Year</Label>
                    <Select
                      value={filterState.year}
                      onValueChange={(val) => handleFilterChange("year", val)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {yearOptions.map((year) => (
                          <SelectItem key={year} value={year}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Month</Label>
                    <Select
                      value={filterState.month}
                      onValueChange={(val) => handleFilterChange("month", val)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {monthOptions.map((month) => (
                          <SelectItem key={month.value} value={month.value}>
                            {month.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={filterState.ExpenseCategoryId || "all"}
                      onValueChange={(val) => {
                        if (val === "all") {
                          handleFilterChange("ExpenseCategoryId", "");
                          handleFilterChange("ExpenseCategoryName", "");
                          handleFilterChange("linkedEntity", {});
                          return;
                        }

                        const selected = categories.find(
                          (c) => c._id?.toString() === val,
                        );

                        handleFilterChange("ExpenseCategoryId", val);
                        handleFilterChange(
                          "ExpenseCategoryName",
                          selected?.ExpenseCategoryName || "",
                        );
                        handleFilterChange("linkedEntity", {});
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((c) => (
                          <SelectItem key={c._id} value={c._id.toString()}>
                            {c.ExpenseCategoryName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {renderDynamicFields(filterState, handleFilterChange, true)}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
                <Button
                  className="w-full sm:w-auto"
                  onClick={handleApplyAdvancedFilter}
                >
                  Apply Filter
                </Button>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={clearAdvancedFilter}
                >
                  Clear Filter
                </Button>
              </div>
            </CardContent>
          </Card></div>

          {advancedFilteredTransactions && (
            <div data-aos="fade-up"><Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Filtered Results</CardTitle>

                <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
                  <div className="flex items-center gap-3 rounded-xl border p-4">
                    <FileText className="h-5 w-5 text-blue-500 sm:h-6 sm:w-6" />
                    <div>
                      <p className="text-xs text-muted-foreground sm:text-sm">
                        Transactions
                      </p>
                      <p className="text-lg font-bold sm:text-xl">
                        {advancedFilteredTransactions.length}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-xl border p-4">
                    <TrendingDown className="h-5 w-5 text-red-500 sm:h-6 sm:w-6" />
                    <div>
                      <p className="text-xs text-muted-foreground sm:text-sm">
                        Total Expense
                      </p>
                      <p className="break-all text-lg font-bold text-red-600 sm:text-xl">
                        ₹{advancedFilterTotal.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="px-3 pb-4 sm:px-6">
                <TransactionTable
                  data={advancedFilteredTransactions}
                  type="Expense"
                />
              </CardContent>
            </Card></div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-h-[92vh] w-[96vw] max-w-lg overflow-y-auto rounded-2xl p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              {editingTx ? "Edit Transaction" : "Add New Transaction"}
            </DialogTitle>
            <DialogDescription className="text-sm">
              Fill in the details for the transaction.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className="space-y-4 pt-2 sm:pt-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={
                    formState.ExpenseTypeID
                      ? JSON.stringify({
                          id: formState.ExpenseTypeID,
                          name: formState.ExpenseTypeName,
                        })
                      : ""
                  }
                  onValueChange={(v) => {
                    const selected = JSON.parse(v);
                    handleSelectChange("ExpenseTypeID", selected.id);
                    handleSelectChange("ExpenseTypeName", selected.name);
                    handleSelectChange("ExpenseCategoryId", "");
                    handleSelectChange("ExpenseCategoryName", "");
                    handleSelectChange("linkedEntity", {});
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseType.map((exp) => (
                      <SelectItem
                        key={exp._id}
                        value={JSON.stringify({
                          id: exp._id,
                          name: exp.ExpenseTypeName,
                        })}
                      >
                        {exp.ExpenseTypeName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start overflow-hidden text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                      <span className="truncate">
                        {formState.expenseDate
                          ? format(formState.expenseDate, "PPP")
                          : "Pick a date"}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formState.expenseDate}
                      onSelect={(val) => handleFormChange("expenseDate", val)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="expenseAmount">Amount (₹)</Label>
                <Input
                  id="expenseAmount"
                  type="number"
                  onWheel={(e) => e.target.blur()}
                  value={formState.expenseAmount}
                  onChange={(e) =>
                    handleFormChange("expenseAmount", e.target.value)
                  }
                  required
                  min="0.01"
                  step="0.01"
                />
              </div>

              {formState.ExpenseTypeName === "Expenses" && (
                <div className="space-y-2">
                  <Label htmlFor="ExpenseCategoryId">Select Categories</Label>
                  <Select
                    value={
                      formState.ExpenseCategoryId
                        ? JSON.stringify({
                            id: formState.ExpenseCategoryId,
                            name: formState.ExpenseCategoryName,
                          })
                        : ""
                    }
                    onValueChange={(v) => {
                      const selected = JSON.parse(v);
                      handleSelectChange("ExpenseCategoryId", selected.id);
                      handleSelectChange("ExpenseCategoryName", selected.name);
                      handleSelectChange("linkedEntity", {});
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseCategory.map((expCate) => (
                        <SelectItem
                          key={expCate._id}
                          value={JSON.stringify({
                            id: expCate._id,
                            name: expCate.ExpenseCategoryName,
                          })}
                        >
                          {expCate.ExpenseCategoryName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {renderDynamicFields(formState, handleFormChange)}

            <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => setIsFormOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="w-full sm:w-auto">
                {editingTx ? "Save Changes" : "Add Transaction"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BusinessOverview;
