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
  Activity,
} from "lucide-react";
import { apiRequest } from "@/components/CustomComponents/apiRequest";
import { useNavigate } from "react-router-dom";

const SuperAdminDashboard = () => {
  const [dateFilter, setDateFilter] = useState({
    fromDate: "",
    toDate: "",
  });

  const navigate = useNavigate();
  const [stats, setStats] = useState({
    lead: 0,
    patient: 0,
    monthlySessions: 0,
    monthlyRevenue: 0,
    physio: 0,
    sessionCompleted: 0,
  });

  // useEffect(() => {
  //   // Load mock data and calculate stats
  //   Promise.all([
  //     fetch('/mockdata/leads.json').then(res => res.json()),
  //     fetch('/mockdata/patients.json').then(res => res.json()),
  //     fetch('/mockdata/sessions.json').then(res => res.json()),
  //     fetch('/mockdata/physios.json').then(res => res.json())
  //   ]).then(([leads, patients, sessions, physios]) => {
  //     const completedSessions = sessions.filter(s => s.status === 'completed');
  //     const monthlyRevenue = completedSessions.reduce((sum, session) => {
  //       const physio = physios.find(p => p.id === session.physioId);
  //       return sum + (physio?.ratePerSession || 0);
  //     }, 0);

  //     setStats({
  //       totalLeads: leads.length,
  //       totalPatients: patients.length,
  //       totalSessions: sessions.length,
  //       monthlyRevenue,
  //       activePhysios: physios.filter(p => p.active).length,
  //       completedSessions: completedSessions.length
  //     });
  //   }).catch(err => console.error('Error loading dashboard data:', err));
  // }, []);

  useEffect(() => {
    getAllDashBoard(dateFilter);
  }, [dateFilter]);

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
      value: `₹${stats.monthlyRevenue}`,
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      title: "Active Physios",
      value: stats.physio,
      icon: Activity,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
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
    <div className="space-y-6  ">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="md:text-3xl text-lg font-bold text-gray-800 mb-2">
          SuperAdmin Dashboard
        </h1>
        <p className="text-gray-600">
          Complete overview of your physiotherapy service management
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
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest updates across the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <p className="text-sm text-gray-600">
                    New patient registered: John Doe
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <p className="text-sm text-gray-600">
                    Session completed by Dr. Smith
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <p className="text-sm text-gray-600">
                    Lead qualified: Jane Wilson
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <p className="text-sm text-gray-600">
                    Review scheduled for tomorrow
                  </p>
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
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Frequently used operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => navigate("/leads")}
                  className="p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <UserPlus className="text-blue-600 mb-2" size={20} />
                  <p className="text-sm font-medium">Add New Lead</p>
                </button>
                <button
                  onClick={() => navigate("/sessions")}
                  className="p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Calendar className="text-green-600 mb-2" size={20} />
                  <p className="text-sm font-medium">Schedule Session</p>
                </button>
                <button
                  onClick={() => navigate("/physios")}
                  className="p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Users className="text-purple-600 mb-2" size={20} />
                  <p className="text-sm font-medium">Manage Physios</p>
                </button>
                <button
                  onClick={() => navigate("/reports")}
                  className="p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <TrendingUp className="text-orange-600 mb-2" size={20} />
                  <p className="text-sm font-medium">View Reports</p>
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
