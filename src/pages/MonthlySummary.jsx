import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  CheckCircle,
  Calendar,
  BanIcon,
  ClipboardList,
  Wallet,
  Fuel,
  Gift,
  MinusCircle,
  IndianRupee,
  FileText,
  Clock3,
  PlusCircle,
} from "lucide-react";
import { apiRequest } from "@/components/CustomComponents/apiRequest";
import { useAuth } from "@/contexts/AuthContext";

const MonthlySummary = () => {
  const { user } = useAuth();

  const [summary, setSummary] = useState({
    totalSessions: 0,
    completedSessions: 0,
    cancelledSessions: 0,
    upcomingSessions: 0,

    totalReviews: 0,
    completedReviews: 0,
    pendingReviews: 0,

    monthlySalary: 0,
    payroll: null,
    salaryVisible: false,
    salaryVisibleAfter: null,
    payrollMonthName: "",
    payrollYear: "",
    selectedMonthName: "",
    selectedYear: "",
    isHOD: false,
    roleName: "",
  });

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = [
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

  const years = [
    new Date().getFullYear(),
    new Date().getFullYear() - 1,
    new Date().getFullYear() - 2,
  ];

  const formatCurrency = (value) => {
    return `₹${Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const shouldShowValue = (value) => Number(value) !== 0;

  const loadDashboardData = async () => {
    try {
      const response = await apiRequest("Session/getMonthlySummary", {
        method: "POST",
        body: JSON.stringify({
          physioId: user._id,
          month: selectedMonth + 1,
          year: selectedYear,
        }),
      });

      setSummary({
        totalSessions: Number(response?.totalSessions || 0),
        completedSessions: Number(response?.completedSessions || 0),
        cancelledSessions: Number(response?.cancelledSessions || 0),
        upcomingSessions: Number(response?.upcomingSessions || 0),

        totalReviews: Number(response?.totalReviews || 0),
        completedReviews: Number(response?.completedReviews || 0),
        pendingReviews: Number(response?.pendingReviews || 0),

        monthlySalary: Number(response?.monthlySalary || 0),
        payroll: response?.payroll || null,
        salaryVisible: Boolean(response?.salaryVisible),
        salaryVisibleAfter: response?.salaryVisibleAfter || null,
        payrollMonthName: response?.payrollMonthName || "",
        payrollYear: response?.payrollYear || "",
        selectedMonthName: response?.selectedMonthName || months[selectedMonth],
        selectedYear: response?.selectedYear || selectedYear,
        isHOD: Boolean(response?.isHOD),
        roleName: response?.roleName || "",
      });
    } catch (err) {
      console.error("Monthly summary load failed:", err);
    }
  };

  useEffect(() => {
    if (user?._id) {
      loadDashboardData();
    }
  }, [selectedMonth, selectedYear, user?._id]);

  const payroll = summary.payroll;
  const isHOD = summary.isHOD;
  const isSalaryVisible = summary.salaryVisible;

  const primaryCards = isHOD
    ? [
        {
          title: "Total Reviews",
          value: summary.totalReviews || summary.totalSessions,
          icon: FileText,
          color: "text-purple-600",
          bgColor: "bg-purple-100",
        },
        {
          title: "Completed Reviews",
          value: summary.completedReviews || summary.completedSessions,
          icon: CheckCircle,
          color: "text-green-600",
          bgColor: "bg-green-100",
        },
        {
          title: "Pending Reviews",
          value: summary.pendingReviews || summary.upcomingSessions,
          icon: Clock3,
          color: "text-orange-600",
          bgColor: "bg-orange-100",
        },
        {
          title: "Monthly Salary",
          value: isSalaryVisible
            ? formatCurrency(summary.monthlySalary)
            : "Not Available",
          icon: DollarSign,
          color: "text-blue-600",
          bgColor: "bg-blue-100",
        },
      ]
    : [
        {
          title: "Total Sessions",
          value: summary.totalSessions,
          icon: ClipboardList,
          color: "text-purple-600",
          bgColor: "bg-purple-100",
        },
        {
          title: "Completed Sessions",
          value: summary.completedSessions,
          icon: CheckCircle,
          color: "text-green-600",
          bgColor: "bg-green-100",
        },
        {
          title: "Cancelled Sessions",
          value: summary.cancelledSessions,
          icon: BanIcon,
          color: "text-red-600",
          bgColor: "bg-red-100",
        },
        {
          title: "Monthly Salary",
          value: isSalaryVisible
            ? formatCurrency(summary.monthlySalary)
            : "Not Available",
          icon: DollarSign,
          color: "text-blue-600",
          bgColor: "bg-blue-100",
        },
      ];

  const salaryBreakup = payroll
    ? [
        {
          label: "Basic Salary",
          value: payroll.basicSalary,
          icon: Wallet,
          color: "text-blue-600",
          bg: "bg-blue-50",
        },
        {
          label: "Petrol Amount",
          value: payroll.PetrolAmount,
          icon: Fuel,
          color: "text-orange-600",
          bg: "bg-orange-50",
        },

        {
          label: "Incentive",
          value: payroll.Incentive,
          icon: Gift,
          color: "text-green-600",
          bg: "bg-green-50",
        },
        {
          label: "Manual Deduction",
          value: payroll.ManualDeduction,
          icon: MinusCircle,
          color: "text-red-600",
          bg: "bg-red-50",
        },
        // {
        //   label: "ESI",
        //   value: payroll.ESI,
        //   icon: MinusCircle,
        //   color: "text-rose-600",
        //   bg: "bg-rose-50",
        // },
        // {
        //   label: "PF",
        //   value: payroll.PF,
        //   icon: MinusCircle,
        //   color: "text-pink-600",
        //   bg: "bg-pink-50",
        // },
        {
          label: "Vehicle Maintenance",
          value: payroll.vehicleMaintanance,
          icon: IndianRupee,
          color: "text-yellow-600",
          bg: "bg-yellow-50",
        },
        {
          label: "Savings",
          value: payroll.savings,
          icon: PlusCircle,
          color: "text-pink-600",
          bg: "bg-pink-50",
        },
        {
          label: "Total Amount Deducted",
          value: payroll.TotalAmountDeducted,
          icon: MinusCircle,
          color: "text-red-700",
          bg: "bg-red-100",
        },
        {
          label: "Total Salary",
          value: payroll.TotalSalary,
          icon: Wallet,
          color: "text-indigo-600",
          bg: "bg-indigo-50",
        },
        {
          label: "Net Salary",
          value: payroll.NetSalary,
          icon: DollarSign,
          color: "text-emerald-700",
          bg: "bg-emerald-100",
        },
      ].filter((item) => shouldShowValue(item.value))
    : [];

  const secondaryInfoCards = payroll
    ? [
        {
          label: isHOD ? "Completed Reviews" : "Completed Sessions",
          value: isHOD
            ? summary.completedReviews || summary.completedSessions
            : summary.completedSessions,
        },
        {
          label: isHOD ? "Pending Reviews" : "Cancelled Sessions",
          value: isHOD
            ? summary.pendingReviews || summary.upcomingSessions
            : summary.cancelledSessions,
        },
        // {
        //   label: "Petrol KM",
        //   value: payroll.PetrolKm,
        // },
        // {
        //   label: "Amount Per KM",
        //   value: payroll.amountperKm,
        //   isCurrency: true,
        // },
        {
          label: "No. of Leave",
          value: payroll.NoofLeave,
        },
      ].filter((item) => shouldShowValue(item.value))
    : [];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center"
      >
        <div>
          <h1 className="md:text-3xl text-xl font-bold text-gray-800 mb-2">
            Monthly Summary
          </h1>
          <p className="text-gray-600">
            {isHOD
              ? "Your payroll and review overview."
              : "Your financial and session overview."}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Calendar className="h-5 w-5 text-gray-500" />

          <Select
            value={selectedMonth.toString()}
            onValueChange={(val) => setSelectedMonth(parseInt(val))}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              position="popper"
              side="bottom"
              align="start"
              sideOffset={6}
              avoidCollisions={false}
              className="z-[99999] max-h-72 overflow-auto w-[--radix-select-trigger-width] bg-white border shadow-lg h-[200px]"
            >
              {months.map((m, i) => (
                <SelectItem key={i} value={i.toString()}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedYear.toString()}
            onValueChange={(val) => setSelectedYear(parseInt(val))}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              position="popper"
              side="bottom"
              align="start"
              sideOffset={6}
              avoidCollisions={false}
              className="z-[99999] max-h-72 overflow-auto w-[--radix-select-trigger-width] bg-white border shadow-lg h-[200px]"
            >
              {years.map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {primaryCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
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
                    {stat.value}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {stat.title === "Monthly Salary"
                      ? isSalaryVisible
                        ? `${summary.payrollMonthName} ${summary.payrollYear}`
                        : "Available after 10th"
                      : `${months[selectedMonth]} ${selectedYear}`}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {isSalaryVisible && payroll && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white via-green-50 to-emerald-50 overflow-hidden">
            <CardHeader className="border-b bg-white/70 backdrop-blur-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <CardTitle className="text-xl md:text-2xl font-bold text-gray-800">
                    Salary Breakup
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-600 mt-1">
                    Payroll for {summary.payrollMonthName} {summary.payrollYear}
                  </CardDescription>
                </div>

                <div className="bg-emerald-100 text-emerald-800 px-4 py-2 rounded-xl font-semibold text-sm w-fit">
                  Net Salary: {formatCurrency(payroll.NetSalary)}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-6">
              {salaryBreakup.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
                  {salaryBreakup.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.35, delay: index * 0.05 }}
                        className={`rounded-2xl p-4 border ${item.bg}`}
                      >
                        <div className="flex items-center justify-between mb-3 gap-3">
                          <div className="text-sm font-medium text-gray-600">
                            {item.label}
                          </div>
                          <div className="p-2 rounded-full bg-white shadow-sm shrink-0">
                            <Icon className={`h-4 w-4 ${item.color}`} />
                          </div>
                        </div>
                        <div className="text-xl font-bold text-gray-800 break-words">
                          {formatCurrency(item.value)}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {secondaryInfoCards.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl bg-white border p-4"
                  >
                    <p className="text-sm text-gray-500 mb-1">{item.label}</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {item.isCurrency
                        ? formatCurrency(item.value)
                        : item.value}
                    </p>
                  </div>
                ))}

                {payroll?.payRollDate && (
                  <div className="rounded-2xl bg-white border p-4">
                    <p className="text-sm text-gray-500 mb-1">Payroll Date</p>
                    <p className="text-lg font-bold text-gray-800">
                      {new Date(payroll.payRollDate).toLocaleDateString(
                        "en-IN",
                      )}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {isSalaryVisible && !payroll && (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-gray-500">
            No payroll data found for {summary.payrollMonthName}{" "}
            {summary.payrollYear}.
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MonthlySummary;
