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
  Users,
  UserPlus,
  Calendar,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { apiRequest } from "@/components/CustomComponents/apiRequest";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    lead: 0,
    patient: 0,
    session: 0,
    monthlyRevenue: 0,
    // physio: 0,
    sessionCompleted: 0,
  });
  const fetchData = async () => {
    console.log("fetchData called", selectedMonth, selectedYear);
    // setLoading(true);
    try {
      // Get patient base data (fee type & fee)
      const patientsRes = await apiRequest("Patient/getAllPatientsIncome", {
        method: "POST",
        body: JSON.stringify({ month: selectedMonth, year: selectedYear }),
      });

      setPatients(patientsRes);

      // total monthly revenue from patient list
      const monthlyRevenue = patientsRes.reduce(
        (sum, p) => sum + (p.totalIncome || 0),
        0,
      );

      setStats((prev) => ({ ...prev, monthlyRevenue }));

      const totalPatinetIncome = patientsRes.reduce(
        (sum, p) => sum + Number(p.totalIncome || 0),
        0,
      );
      console.log("Total Patient Income", totalPatinetIncome.toFixed(2));
      // Count completed sessions per patient (MONTH FILTER)
      const completedSessionsByPatient = {};

      // sessionsRes.forEach((session) => {
      //   if (!session.patientId) return; //  skip invalid sessions

      //   const patientId =
      //     typeof session.patientId === "object"
      //       ? session.patientId._id
      //       : session.patientId;

      //   if (!patientId) return;

      //   const date = new Date(session.sessionDate);

      //   const isSameMonth =
      //     date.getMonth() + 1 === selectedMonth &&
      //     date.getFullYear() === selectedYear;

      //   if (
      //     isSameMonth &&
      //     session.sessionStatusId?.sessionStatusName?.toLowerCase() ===
      //       "completed"
      //   ) {
      //     completedSessionsByPatient[patientId] =
      //       (completedSessionsByPatient[patientId] || 0) + 1;
      //   }
      // });

      //  Merge + calculate income
      const patientsWithIncome = patientsRes.map((p) => {
        const completed = completedSessionsByPatient[p._id] || 0;

        const fee = Number(p.feePerSession || 0); // PerMonth already comes as baseFee/26

        const totalIncome =
          p.feeType === "PerSession" || p.feeType === "PerMonth"
            ? Number((completed * fee).toFixed(2))
            : 0;

        return {
          ...p,
          totalCompletedSessions: completed,
          totalIncome,
        };
      });

      setPatients(patientsWithIncome);
      // setSessions(sessionsRes);
    } catch (err) {
      console.error(err);
    } finally {
      //   setLoading(false);
    }
  };
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [patients, setPatients] = useState([]);

  console.log(stats, "Stats");
  const [dateFilter, setDateFilter] = useState({
    fromDate: "",
    toDate: "",
  });
  useEffect(() => {
    getAllDashBoard(dateFilter);
  }, [dateFilter]);

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  const getAllDashBoard = async (filterData = {}) => {
    try {
      const response = await apiRequest("DashBoard/getAllDashBoard", {
        method: "POST",
        body: JSON.stringify(filterData),
      });

      setStats(response);
      console.log(response, "response");
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  };
  const applyDateFilter = () => {
    let payload = { ...dateFilter };

    // If only fromDate is selected, use same date as toDate
    if (payload.fromDate && !payload.toDate) {
      payload.toDate = payload.fromDate;
    }

    getAllDashBoard(payload);
  };
  const statCards = [
    {
      title: "Total Leads",
      value: stats.lead,
      icon: UserPlus,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Total Patients",
      value: stats.patient,
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Total Sessions",
      value: stats.monthlySessions,
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Monthly Revenue",
      value: `₹${stats.monthlyRevenue || 0}`,
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      title: "Completed Sessions",
      value: stats.sessionCompleted,
      icon: TrendingUp,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
    },
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Admin Dashboard
        </h1>
        <p className="text-gray-600">
          Comprehensive management overview including revenue insights
        </p>
      </motion.div>
      <Card className="medical-card">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* From Date */}
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">From Date</label>
              <input
                type="date"
                className="border rounded-md px-3 py-2 text-sm w-full"
                value={dateFilter.fromDate}
                onChange={(e) =>
                  setDateFilter({ ...dateFilter, fromDate: e.target.value })
                }
              />
            </div>

            {/* To Date */}
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">To Date</label>
              <input
                type="date"
                className="border rounded-md px-3 py-2 text-sm w-full"
                value={dateFilter.toDate}
                onChange={(e) =>
                  setDateFilter({ ...dateFilter, toDate: e.target.value })
                }
              />
            </div>

            {/* Apply */}
            <div className="flex items-end">
              <button
                onClick={applyDateFilter}
                className="w-full px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                Apply Filter
              </button>
            </div>

            {/* Reset */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setDateFilter({ fromDate: "", toDate: "" });
                  getAllDashBoard();
                }}
                className="w-full px-6 py-2 border rounded-md hover:bg-gray-50 transition"
              >
                Reset
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

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
                    Updated in real-time
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card className="medical-card">
            <CardHeader>
              <CardTitle>Revenue Breakdown</CardTitle>
              <CardDescription>Monthly revenue analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Physiotherapy Sessions
                  </span>
                  <span className="font-medium">
                    ₹{stats.monthlyRevenue * 0.8}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Consultation Fees
                  </span>
                  <span className="font-medium">
                    ₹{stats.monthlyRevenue * 0.15}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Equipment Usage</span>
                  <span className="font-medium">
                    ₹{stats.monthlyRevenue * 0.05}
                  </span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between items-center font-semibold">
                    <span>Total Revenue</span>
                    <span>₹{stats.monthlyRevenue}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <Card className="medical-card">
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>Key performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Lead Conversion Rate
                  </span>
                  <span className="font-medium text-green-600">78%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Session Completion Rate
                  </span>
                  <span className="font-medium text-blue-600">92%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Patient Satisfaction
                  </span>
                  <span className="font-medium text-purple-600">4.8/5</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Average Revenue per Patient
                  </span>
                  <span className="font-medium text-orange-600">₹2,450</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;
