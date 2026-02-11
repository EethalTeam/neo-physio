import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// import DateRangePicker from "@/components/DateRangePicker";

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
  BarChart3,
  Download,
  Calendar,
  Users,
  DollarSign,
  CheckSquare,
  XSquare,
  BookUser,
  UserPlus,
  TrendingUp,
  DogIcon,
  User,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getMonth } from "date-fns";

const Reports = () => {
  const [expensesData, setExpensesData] = useState([]);

  const handlePeriodChange = async (ranges) => {
    if (!ranges?.selection) return;

    const normalizeDate = (date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0); // remove time
      return d;
    };

    const start = normalizeDate(ranges.selection.startDate);
    const end = normalizeDate(ranges.selection.endDate);

    setSelectedRange({ startDate: start, endDate: end, key: "selection" });

    try {
      // Fetch sessions for selected range
      const sessionsRes = await apiRequest("Session/getAllSession", {
        method: "POST",
        body: JSON.stringify({
          physioId: user._id,
          startDate: selectedRange.startDate,
          endDate: selectedRange.endDate,
        }),
      });

      const expensesRes = await apiRequest("Expense/getAllExpense", {
        method: "POST",
        body: JSON.stringify({
          startDate,
          endDate,
        }),
      });

      // Update states
      setSessions(sessionsRes || []);
      setExpensesData(expensesRes || []);

      // Calculate stats
      const totalPatients = sessionsRes.reduce(
        (sum, s) => sum + (s.patientCount || 1),
        0,
      );
      const totalPhysio = new Set(sessionsRes.map((s) => s.physioId)).size;
      const completedSessions = sessionsRes.filter(
        (s) => s.sessionStatusId?.sessionStatusName === "Completed",
      ).length;
      const cancelledSessions = sessionsRes.filter(
        (s) => s.sessionStatusId?.sessionStatusName === "Canceled",
      ).length;

      setStats((prev) => ({
        ...prev,
        patient: totalPatients,
        physio: totalPhysio,
        sessionCompleted: completedSessions,
        cancelledSessions,
      }));

      // Update funnel
      const newEnquiries = sessionsRes.filter(
        (s) => s.type === "Enquiry",
      ).length;
      const newConsultations = sessionsRes.filter(
        (s) => s.type === "Consultation",
      ).length;
      const newPatients = sessionsRes.filter(
        (s) => s.type === "Patient",
      ).length;
      const conversionRate =
        newEnquiries > 0 ? ((newPatients / newEnquiries) * 100).toFixed(2) : 0;

      setFunnel({
        newEnquiries,
        newConsultations,
        newPatients,
        conversionRate,
      });
    } catch (err) {
      console.error("Error loading reports for selected period:", err);
    }
  };

  // const [selectedRange, setSelectedRange] = useState({
  //   startDate: new Date(),
  //   endDate: new Date(),
  //   key: "selection",
  // });

  const [stats, setStats] = useState({
    lead: 0,
    patient: 0,
    monthlySessions: 0,
    cancelledsession: 0,
    physio: 0,
    monthlyRevenue: 0,
    monthlyExpenses: 0,
    // physio: 0,
    patientRecovered: 0,
    patientRecoveredOthers: 0,
    completedReview: 0,
    cancelledSessions: 0,
    patientRecover: 0,
    sessionCompleted: 0,
  });
  const loadDashboardData = async () => {
    try {
      const sessionRes = await apiRequest("Session/getAllSession", {
        method: "POST",
        body: JSON.stringify({
          physioId: user._id,
        }),
      });

      processDashboardData(sessionRes);
    } catch (err) {
      console.error("Monthly summary load failed:", err);
    }
  };
  const [summary, setSummary] = useState({
    cancelledSessions: 0,
  });
  const processDashboardData = (sessionsData) => {
    if (!Array.isArray(sessionsData)) return;

    const cancelledSessions = sessionsData.filter(
      (s) => s.sessionStatusId?.sessionStatusName === "Canceled",
    );

    setSummary({
      cancelledSessions: cancelledSessions.length,
    });
  };
  // console.log("Summary", summary);

  useEffect(() => {
    getAllDashBoard();
    funnelmonthly();
    loadDashboardData();
    getSession();
    getAllExpenses();
  }, []);
  const [sessions, setSessions] = useState([]);

  const [todaySessionCount, setTodaySessionCount] = useState(0);

  const getSession = async () => {
    try {
      const storedRole = localStorage.getItem("userRole");

      const response = await apiRequest("Session/getAllSession", {
        method: "POST",
        body: JSON.stringify({
          physioId: user._id,
          storedRole,
        }),
      });

      if (!Array.isArray(response)) return;

      setSessions(response);

      const today = new Date().toISOString().split("T")[0];

      const todaySessions = response.filter((s) => {
        if (!s.sessionDate) return false;

        const sessionDay = new Date(s.sessionDate).toISOString().split("T")[0];
        // console.log(sessionDay, "sessionDay" + today, "Today");

        return sessionDay === today;
      });
      // setFilteredSessions(todaySessions);
      setTodaySessionCount(todaySessions.length);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    }
  };
  const getAllDashBoard = async (data) => {
    try {
      const response = await apiRequest("DashBoard/getAllDashBoard", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setStats(response);
      // console.log(response, "response");
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  };

  const statCards = [
    // {
    //   title: "Total Leads",
    //   value: stats.lead,
    //   icon: UserPlus,
    //   color: "text-blue-600",
    //   bgColor: "bg-blue-100",
    // },
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
      color: "text-green-600",
      bgColor: "bg-green-100",
    },

    // {
    //   title: "Total Sessions",
    //   value: stats.session,
    //   icon: Calendar,
    //   color: "text-purple-600",
    //   bgColor: "bg-purple-100",
    // },
    // {
    //   title: "Monthly Revenue",
    //   value: `₹${stats.monthlyRevenue}`,
    //   icon: DollarSign,
    //   color: "text-emerald-600",
    //   bgColor: "bg-emerald-100",
    // },
    // {
    //   title: "Completed Sessions",
    //   value: stats.sessionCompleted,
    //   icon: TrendingUp,
    //   color: "text-indigo-600",
    //   bgColor: "bg-indigo-100",
    // },
  ];

  const { user } = useAuth();
  const [reportData, setReportData] = useState({
    revenue: [],
    sessions: [],
    patients: [],
    feedback: [],
    patientHistory: [],
  });
  // const [hodStats, setHodStats] = useState({
  //   completedReviews: 0,
  //   cancelledSessions: 0,
  // });
  const [selectedPeriod, setSelectedPeriod] = useState("monthly");

  const handleCustomRangeChange = ([startDate, endDate]) => {
    if (!startDate || !endDate) return;

    setSelectedRange({
      startDate,
      endDate,
    });
  };

  const handleExportCSV = () => {
    toast({
      title:
        "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
    });
  };

  const handleExportPDF = () => {
    toast({
      title:
        "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
    });
  };

  const getTotalRevenue = () => {
    if (reportData.revenue.length === 0) return 0;
    return reportData.revenue.reduce((sum, item) => sum + item.amount, 0);
  };

  const getTotalSessions = () => {
    if (reportData.sessions.length === 0) return 0;
    return reportData.sessions.reduce(
      (sum, item) => sum + item.completed + item.scheduled,
      0,
    );
  };
  const [funnel, setFunnel] = useState({
    newEnquiries: 0,
    newConsultations: 0,
    newPatients: 0,
    conversionRate: 0,
  });
  const funnelmonthly = async () => {
    try {
      const today = new Date();

      const res = await apiRequest("DashBoard/monthlyfunnel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          month: today.getMonth() + 1, // 1–12
          year: today.getFullYear(), // 2026
        }),
      });

      console.log("Monthly funnel response:", res);

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
    }
  };

  const getTotalPatients = () => {
    if (reportData.patients.length === 0) return 0;
    return reportData.patients.reduce(
      (sum, item) => sum + item.new + item.returning,
      0,
    );
  };
  const monthname = [
    "January",
    "Febuary",
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
  const getDateRange = (period) => {
    const now = new Date();
    let startDate;
    let endDate = new Date();

    switch (period) {
      case "weekly":
        startDate = new Date();
        startDate.setDate(now.getDate() - 6);
        break;

      case "monthly":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;

      case "quarterly":
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterStart, 1);
        break;

      case "yearly":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;

      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    return { startDate, endDate };
  };
  const [selectedRange, setSelectedRange] = useState(() =>
    getDateRange("monthly"),
  );
  useEffect(() => {
    if (!sessions.length) return;

    const revenue = calculateRevenueByPeriod(sessions, selectedRange);
    const expenses = calculateExpensesByPeriod(expensesData, selectedRange);

    setStats((prev) => ({
      ...prev,
      monthlyRevenue: revenue,
      monthlyExpenses: expenses,
    }));
  }, [selectedRange, sessions, expensesData]);

  useEffect(() => {
    if (selectedPeriod === "custom") return;

    const range = getDateRange(selectedPeriod);
    setSelectedRange(range);
  }, [selectedPeriod]);

  const calculateRevenueByPeriod = (sessions, periodOrRange) => {
    let startDate, endDate;

    if (periodOrRange.startDate && periodOrRange.endDate) {
      // Custom range selected
      startDate = periodOrRange.startDate;
      endDate = periodOrRange.endDate;
    } else {
      // Fallback to predefined periods
      ({ startDate, endDate } = getDateRange(periodOrRange));
    }

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    return sessions.reduce((revenue, s) => {
      if (s.sessionStatusId?.sessionStatusName !== "Completed") return revenue;

      const sessionDate = new Date(s.sessionDate);
      sessionDate.setHours(0, 0, 0, 0);

      if (sessionDate < startDate || sessionDate > endDate) return revenue;

      if (s.feeType === "PerSession") revenue += Number(s.feeAmount || 0);
      else if (s.feeType === "PerMonth") revenue += Number(s.monthlyFee || 0);

      return revenue;
    }, 0);
  };

  const getAllExpenses = async () => {
    try {
      const res = await apiRequest("Expense/getAllExpense", {
        method: "POST", // or GET if you set up GET endpoint
      });

      if (Array.isArray(res)) {
        setExpensesData(res);
      }
    } catch (error) {
      console.error("Error fetching expenses:", error);
    }
  };

  const calculateExpensesByPeriod = (expenses, period) => {
    const { startDate, endDate } = getDateRange(period);

    return expenses.reduce((total, exp) => {
      const d = new Date(exp.expenseDate);
      if (d >= startDate && d <= endDate) {
        total += Number(exp.expenseAmount || 0); // use expenseAmount from your schema
      }
      return total;
    }, 0);
  };

  const month = new Date().getMonth();
  const year = new Date().getFullYear();
  const avgPatient =
    stats.physio > 0 ? (stats.patient / stats.physio).toFixed(1) : 0;

  console.log(avgPatient, "Average Patients per Physiotherapist");

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Reports & Analytics
          </h1>
          <p className="text-gray-600">
            Comprehensive insights and performance metrics
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center space-x-4">
            {/* <DateRangePicker
              period={selectedPeriod}
              onPeriodChange={setSelectedPeriod}
              onRangeChange={handleCustomRangeChange}
            /> */}
          </div>

          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button variant="outline" onClick={handleExportPDF}>
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>
      </motion.div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
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
                    Updated for selected date
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4  gap-6">
        <Card className="medical-card hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              New Enquiries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">
              {funnel.newEnquiries}
            </div>
            <p className="text-xs text-gray-500 mt-1">Updated in real-time</p>
          </CardContent>
        </Card>

        <Card className="medical-card hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              New Consultations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">
              {funnel.newConsultations}
            </div>
            <p className="text-xs text-gray-500 mt-1">Updated in real-time</p>
          </CardContent>
        </Card>

        <Card className="medical-card hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              New Patients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">
              {funnel.newPatients}
            </div>
            <p className="text-xs text-gray-500 mt-1">Updated in real-time</p>
          </CardContent>
        </Card>

        <Card className="medical-card hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Lead Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">
              {funnel.conversionRate}%
            </div>
            <p className="text-xs text-gray-500 mt-1">Updated in real-time</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4  gap-6">
        <Card className="medical-card hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">
              {stats.pendingreviews}
            </div>
            <p className="text-xs text-gray-500 mt-1">Updated in real-time</p>
          </CardContent>
        </Card>

        <Card className="medical-card hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Completed Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">
              {stats.completedReview}
            </div>
            <p className="text-xs text-gray-500 mt-1">Updated in real-time</p>
          </CardContent>
        </Card>

        <Card className="medical-card hover:shadow-lg transition-shadow p-4">
          <CardContent className="p-0">
            <div className="grid grid-cols-2 gap-4">
              <div className="border-r border-gray-100 pr-4">
                <p className="text-sm font-medium text-gray-600 mb-4">
                  Total Recovered Patients
                </p>
                <div className="text-center py-2">
                  <div className="text-2xl font-bold text-gray-800">
                    {stats.patientRecover}
                  </div>
                  <div className="text-xs text-gray-500">Total Patients</div>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-4">
                  Recovered Type
                </p>
                <div className="flex justify-between items-center text-center">
                  <div className="flex-1">
                    <div className="text-xl font-bold text-gray-800">
                      {stats.patientRecovered}
                    </div>
                    <div className="text-sm font-medium text-gray-600">
                      Fully Recovered
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="text-xl font-bold text-gray-800">
                      {stats.patientRecoveredOthers}
                    </div>
                    <div className="text-sm font-medium text-gray-600">
                      Others
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-1">Updated in real-time</p>
          </CardContent>
        </Card>

        <Card className="medical-card hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Lead Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">
              {funnel.conversionRate}%
            </div>
            <p className="text-xs text-gray-500 mt-1">Updated in real-time</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4  gap-6">
        <Card className="medical-card hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total session(Monthly)
            </CardTitle>
            <div className={`p-2 rounded-full ${stats.bgColor}`}>
              <User className={`h-4 w-4 ${stats.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">
              {stats.monthlySessions}
            </div>
            <p className="text-xs text-gray-500 mt-1">{`${monthname[month]}-${year}`}</p>
          </CardContent>
        </Card>
        <Card className="medical-card hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Cancelled session(Monthly)
            </CardTitle>
            <div className={`p-2 rounded-full ${stats.bgColor}`}>
              <User className={`h-4 w-4 ${stats.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">
              {summary.cancelledSessions}
            </div>
            <p className="text-xs text-gray-500 mt-1">{`${monthname[month]}-${year}`}</p>
          </CardContent>
        </Card>
        <Card className="medical-card hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Today Session Count
            </CardTitle>
            <div className={`p-2 rounded-full ${stats.bgColor}`}>
              <User className={`h-4 w-4 ${stats.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">
              {todaySessionCount}
            </div>
            <p className="text-xs text-gray-500 mt-1">{`${monthname[month]}-${year}`}</p>
          </CardContent>
        </Card>{" "}
        <Card className="medical-card hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Average Patient per Physiotherapist
            </CardTitle>
            <div className={`p-2 rounded-full ${stats.bgColor}`}>
              <User className={`h-4 w-4 ${stats.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">{avgPatient}</div>
            <p className="text-xs text-gray-500 mt-1">Updated in real-time</p>
          </CardContent>
        </Card>
      </div>
      {/* Charts and Detailed Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {user?.role !== "HOD" && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="medical-card">
              <CardHeader>
                <CardTitle>Revenue Trends</CardTitle>
                <CardDescription>Monthly revenue breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.revenue.map((item) => (
                    <div
                      key={item.month}
                      className="flex items-center justify-between"
                    >
                      {" "}
                      <span className="text-sm text-gray-600">
                        {item.month}
                      </span>{" "}
                      <div className="flex items-center space-x-2">
                        {" "}
                        <div className="w-32 bg-gray-200 rounded-full h-2.5">
                          {" "}
                          {(() => {
                            const maxRevenue = Math.max(
                              ...reportData.revenue.map((r) => r.amount),
                            );
                            const width =
                              maxRevenue > 0
                                ? (item.amount / maxRevenue) * 100
                                : 0;
                            return (
                              <div
                                className="bg-green-500 rounded-full h-2.5"
                                style={{ width: `${width}%` }}
                              ></div>
                            );
                          })()}{" "}
                        </div>{" "}
                        <span className="text-xs font-medium">
                          ₹{item.amount.toLocaleString()}
                        </span>{" "}
                      </div>{" "}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {user?.role !== "HOD" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card className="medical-card">
              <CardHeader>
                <CardTitle>Session History</CardTitle>
                <CardDescription>
                  Completed vs. Scheduled sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.sessions.map((item) => (
                    <div
                      key={item.month}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm text-gray-600">
                        {item.month}
                      </span>
                      <div className="flex items-center space-x-2">
                        {" "}
                        <div className="w-32 bg-gray-200 rounded-full h-2.5">
                          {" "}
                          {(() => {
                            const total = item.completed + item.scheduled;
                            const width =
                              total > 0 ? (item.completed / total) * 100 : 0;
                            return (
                              <div
                                className="bg-blue-500 rounded-full h-2.5"
                                style={{ width: `${width}%` }}
                              ></div>
                            );
                          })()}{" "}
                        </div>{" "}
                        <span className="text-xs font-medium">
                          {item.completed} / {item.scheduled}
                        </span>{" "}
                      </div>{" "}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {user?.role === "HOD" && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="medical-card">
              <CardHeader>
                <CardTitle>Patient History Log</CardTitle>
                <CardDescription>Recent patient activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.patientHistory.map((item) => (
                    <div key={item.id} className="flex items-center space-x-3">
                      <div
                        className={`p-2 rounded-full ${item.action.includes("New") ? "bg-blue-100" : "bg-green-100"}`}
                      >
                        <BookUser
                          className={`h-5 w-5 ${item.action.includes("New") ? "text-blue-600" : "text-green-600"}`}
                        />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{item.name}</p>
                        <p className="text-sm text-gray-500">
                          {item.action} on{" "}
                          {new Date(item.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, x: 20, x: user?.role === "HOD" ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card className="medical-card">
            <CardHeader>
              <CardTitle>Patient Feedback Summary</CardTitle>
              <CardDescription>Overall patient satisfaction</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.feedback.map((item) => (
                  <div
                    key={item.category}
                    className="flex items-center justify-between"
                  >
                    {" "}
                    <span className="text-sm text-gray-600">
                      {item.category}
                    </span>{" "}
                    <div className="flex items-center space-x-2">
                      {" "}
                      <div className="w-32 bg-gray-200 rounded-full h-2.5">
                        {" "}
                        <div
                          className="bg-purple-500 rounded-full h-2.5"
                          style={{ width: `${item.percentage}%` }}
                        ></div>{" "}
                      </div>{" "}
                      <span className="text-xs font-medium">
                        {item.percentage}%
                      </span>{" "}
                    </div>{" "}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Reports;
