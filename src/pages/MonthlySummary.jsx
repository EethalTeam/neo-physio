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
  BarChart2,
  Ban,
  Calendar,
  BanIcon,
  ClipboardList,
} from "lucide-react";
import { apiRequest } from "@/components/CustomComponents/apiRequest";
import { useAuth } from "@/contexts/AuthContext";

const MonthlySummary = () => {
  const [summary, setSummary] = useState({
    monthlyRevenue: 0,
    completedSessions: 0,
    averageSatisfaction: 0,
    totalSessions: 0,
    mostFrequentPatient: "",
    cancelledSessions: 0,
  });
  const { user } = useAuth();

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const currentPhysioId = 1;

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

  const processDashboardData = (sessionsData) => {
    if (!Array.isArray(sessionsData)) return;

    const filteredSessions = sessionsData.filter((s) => {
      if (!s.sessionDate) return false;

      const date = new Date(s.sessionDate);

      return (
        date.getMonth() === selectedMonth && date.getFullYear() === selectedYear
      );
    });

    console.log(filteredSessions, "filtered sessions ");

    const completedSessions = filteredSessions.filter(
      (s) => s.sessionStatusId?.sessionStatusName === "Completed"
    );

    const cancelledSessions = filteredSessions.filter(
      (s) => s.sessionStatusId?.sessionStatusName === "Canceled"
    );
    filteredSessions.forEach((s) =>
      console.log(s.sessionStatusId?.sessionStatusName, "Session name")
    );

    setSummary({
      monthlyRevenue: 0,
      completedSessions: completedSessions.length,
      cancelledSessions: cancelledSessions.length,
      totalSessions: filteredSessions.length,
      averageSatisfaction: 0,
      mostFrequentPatient: "",
    });
  };

  useEffect(() => {
    loadDashboardData();
  }, [selectedMonth, selectedYear]);

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

  const statCards = [
    // {
    //     title: "Monthly Revenue",
    //     value: `₹${summary.monthlyRevenue.toLocaleString()}`,
    //     icon: DollarSign,
    //     color: 'text-green-600',
    //     bgColor: 'bg-green-100'
    // },

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
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Cancelled Sessions",
      value: summary.cancelledSessions,
      icon: BanIcon,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },

    // {
    //   title: "Avg. Patient Satisfaction",
    //   value: `${summary.averageSatisfaction}%`,
    //   icon: BarChart2,
    //   color: "text-blue-600",
    //   bgColor: "bg-blue-100",
    // },
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="md:flex justify-between items-center"
      >
        <div>
          <h1 className="md:text-3xl text-xl font-bold text-gray-800 mb-2">
            Monthly Summary
          </h1>
          <p className="text-gray-600">
            Your financial and performance overview.
          </p>
        </div>
        <br />
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-gray-500" />
          <Select
            value={selectedMonth.toString()}
            onValueChange={(val) => setSelectedMonth(parseInt(val))}
          >
            <SelectTrigger className="w-30">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
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
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* <div className="flex items-center gap-2"></div> */}
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    {months[selectedMonth]} {selectedYear}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="medical-card">
          <CardHeader>
            <CardTitle>Performance Insights</CardTitle>
            <CardDescription>
              Key metrics for {months[selectedMonth]} {selectedYear}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-700">
                Most Frequent Patient
              </h3>
              <p className="text-2xl font-bold text-blue-600">
                {summary.mostFrequentPatient}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-700">
                Revenue per Session
              </h3>
              <p className="text-2xl font-bold text-green-600">
                ₹
                {summary.completedSessions > 0
                  ? (
                      summary.monthlyRevenue / summary.completedSessions
                    ).toFixed(2)
                  : 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div> */}
    </div>
  );
  // return (
  //   <div className="space-y-6 overflow-x-hidden">
  //     {/* // <div className="min-h-screen w-full overflow-x-hidden"> */}
  //     <motion.div
  //       initial={{ opacity: 0, y: 20 }}
  //       animate={{ opacity: 1, y: 0 }}
  //       transition={{ duration: 0.5 }}
  //       className="flex justify-between items-center"
  //     >
  //       <div>
  //         <h1 className="text-3xl font-bold text-gray-800 mb-2">
  //           Monthly Summary
  //         </h1>
  //         <p className="text-gray-600 text-sm md:text-xs">
  //           Your financial and performance overview.
  //         </p>
  //       </div>
  //     </motion.div>

  //     <Card className="medical-card  hidden md:block">
  //       <CardContent className="flex items-center gap-4">
  //         {/* <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-4"> */}
  //         <div className="flex items-center gap-2">
  //           <Calendar className="h-5 w-5 text-gray-500" />
  //           <Select
  //             value={selectedMonth.toString()}
  //             onValueChange={(val) => setSelectedMonth(parseInt(val))}
  //           >
  //             <SelectTrigger className="w-30">
  //               <SelectValue />
  //             </SelectTrigger>
  //             <SelectContent>
  //               {months.map((m, i) => (
  //                 <SelectItem key={i} value={i.toString()}>
  //                   {m}
  //                 </SelectItem>
  //               ))}
  //             </SelectContent>
  //           </Select>
  //         </div>
  //         <div className="flex items-center p-5 gap-2">
  //           <Select
  //             value={selectedYear.toString()}
  //             onValueChange={(val) => setSelectedYear(parseInt(val))}
  //           >
  //             <SelectTrigger className="w-20">
  //               <SelectValue />
  //             </SelectTrigger>
  //             <SelectContent>
  //               {years.map((y) => (
  //                 <SelectItem key={y} value={y.toString()}>
  //                   {y}
  //                 </SelectItem>
  //               ))}
  //             </SelectContent>
  //           </Select>
  //         </div>
  //       </CardContent>
  //     </Card>

  //     <motion.div
  //       initial={{ opacity: 0 }}
  //       animate={{ opacity: 1 }}
  //       transition={{ duration: 0.5, delay: 0.2 }}
  //     >
  //       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  //         {statCards.map((stat, index) => {
  //           const Icon = stat.icon;
  //           return (
  //             <motion.div
  //               key={stat.title}
  //               initial={{ opacity: 0, y: 20 }}
  //               animate={{ opacity: 1, y: 0 }}
  //               transition={{ duration: 0.5, delay: index * 0.1 }}
  //             >
  //               <Card className="medical-card hover:shadow-lg transition-shadow">
  //                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
  //                   <CardTitle className="text-sm font-medium text-gray-600">
  //                     {stat.title}
  //                   </CardTitle>
  //                   <div className={`p-2 rounded-full ${stat.bgColor}`}>
  //                     <Icon className={`h-4 w-4 ${stat.color}`} />
  //                   </div>
  //                 </CardHeader>
  //                 <CardContent>
  //                   <div className="text-2xl font-bold text-gray-800">
  //                     {stat.value}
  //                   </div>
  //                   <p className="text-xs text-gray-500 mt-1">
  //                     {months[selectedMonth]} {selectedYear}
  //                   </p>
  //                 </CardContent>
  //               </Card>
  //             </motion.div>
  //           );
  //         })}
  //       </div>
  //     </motion.div>
  //   </div>
  // );
};

export default MonthlySummary;
