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

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [cbNotifications, setCbNotifications] = useState([]);

  const [patients, setPatients] = useState([]);

  const [dateFilter, setDateFilter] = useState({
    fromDate: "",
    toDate: "",
  });
  const [todayRevenue, setTodayRevenue] = useState(0);

  const fetchTodayRevenue = async () => {
    try {
      const res = await apiRequest("DashBoard/getTodayIncome", {
        method: "POST",
        body: JSON.stringify({}),
      });

      setTodayRevenue(Number(res.totalCompletedAmount || 0));
    } catch (err) {
      console.error("fetchTodayRevenue error:", err);
    }
  };

  useEffect(() => {
    fetchTodayRevenue();
    getCbNotifications();
  }, []);

  const [stats, setStats] = useState({
    lead: 0,
    patient: 0,
    monthlySessions: 0,
    monthlyRevenue: 0,
    physio: 0,
    sessionCompleted: 0,
  });

  const getAllDashBoard = async (filterData = {}) => {
    try {
      const response = await apiRequest("DashBoard/getAllDashBoard", {
        method: "POST",
        body: JSON.stringify(filterData),
      });

      setStats((prev) => ({ ...prev, ...response }));
    } catch (error) {
      console.error("getAllDashBoard error:", error);
    }
  };

  const fetchIncomeByDate = async (filter = {}) => {
    try {
      const payload = { ...filter };
      if (payload.fromDate && !payload.toDate)
        payload.toDate = payload.fromDate;

      const res = await apiRequest("DashBoard/getIncomeByDate", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setStats((prev) => ({
        ...prev,
        monthlyRevenue: Number(res.totalCompletedAmount || 0),
        avgPricePerSession: Number(res.avgPricePerSession || 0),
      }));

      setPatients(res.patients || []);
    } catch (err) {
      console.error("fetchIncomeByDate error:", err);
    }
  };
  const getCbNotifications = async () => {
    try {
      const res = await apiRequest("Lead/getAllLead", {
        method: "POST",
      });

      const leads = Array.isArray(res) ? res : res.leads || [];

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const filtered = leads.filter((lead) => {
        if (!lead.cbDate) return false;

        const cbDate = new Date(lead.cbDate);
        cbDate.setHours(0, 0, 0, 0);

        const threeDaysBefore = new Date(cbDate);
        threeDaysBefore.setDate(cbDate.getDate() - 3);

        return today >= threeDaysBefore && today <= cbDate;
      });

      filtered.sort((a, b) => new Date(a.cbDate) - new Date(b.cbDate));

      setCbNotifications(filtered);
    } catch (error) {
      console.error("getCbNotifications error:", error);
    }
  };
  const getDaysLeft = (cbDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const target = new Date(cbDate);
    target.setHours(0, 0, 0, 0);

    const diffTime = target - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  useEffect(() => {
    const payload = { ...dateFilter };
    if (payload.fromDate && !payload.toDate) payload.toDate = payload.fromDate;

    getAllDashBoard(payload);
    fetchIncomeByDate(payload);
  }, [dateFilter]);

  const applyDateFilter = () => {
    const payload = { ...dateFilter };
    if (payload.fromDate && !payload.toDate) payload.toDate = payload.fromDate;

    setDateFilter(payload);
  };

  const resetFilter = () => {
    setDateFilter({ fromDate: "", toDate: "" });
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
      title: "Today total session",
      value: stats.todaysession,
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      title: "Today Completed Sessions",
      value: stats.todayCompletedSession,
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      title: "Avg / Session",
      value: `₹${Math.round(stats.avgPricePerSession || 0)}`,
      icon: DollarSign,
      color: "text-cyan-600",
      bgColor: "bg-cyan-100",
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
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="md:text-3xl text-lg font-bold text-gray-800 mb-2">
          Admin Dashboard
        </h1>
        <p className="text-gray-600">
          Complete overview of your physiotherapy service management
        </p>
      </motion.div>

      {/* Date Filter */}
      <Card className="medical-card">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">From Date</label>
              <input
                type="date"
                className="border rounded-md px-3 py-2 text-sm w-full"
                value={dateFilter.fromDate}
                onChange={(e) =>
                  setDateFilter((prev) => ({
                    ...prev,
                    fromDate: e.target.value,
                  }))
                }
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">To Date</label>
              <input
                type="date"
                className="border rounded-md px-3 py-2 text-sm w-full"
                value={dateFilter.toDate}
                onChange={(e) =>
                  setDateFilter((prev) => ({ ...prev, toDate: e.target.value }))
                }
              />
            </div>
            {/* <div className="flex items-end">
              <button
                onClick={applyDateFilter}
                className="w-full px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                Apply Filter
              </button>
            </div> */}

            <div className="flex items-end">
              <button
                onClick={resetFilter}
                className="w-full px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                Reset
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats cards */}
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        {/* Optional: show list of patients revenue (if you want later) */}
        <Card className="medical-card">
          <CardHeader>
            <CardTitle>CB Notifications</CardTitle>
            <CardDescription>
              Callback reminders for the next 3 days
            </CardDescription>
          </CardHeader>

          <CardContent>
            {cbNotifications.length === 0 ? (
              <p className="text-sm text-gray-500">
                No callback notifications.
              </p>
            ) : (
              <div className="space-y-3">
                {cbNotifications.map((lead) => {
                  const daysLeft = getDaysLeft(lead.cbDate);

                  return (
                    <div
                      key={lead._id}
                      className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 hover:bg-gray-50 transition"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800">
                          {lead.leadName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {lead.leadCode} • {lead.leadContactNo}
                        </p>
                        <p className="text-sm text-gray-600">
                          {lead.physioCategoryId?.physioCateName || "-"} •{" "}
                          {lead.leadSourceId?.leadSourceName || "-"}
                        </p>
                        <p className="text-sm text-gray-600">
                          Status: {lead.LeadStatusId?.leadStatusName || "-"}
                        </p>
                      </div>

                      <div className="text-left md:text-right">
                        <p className="text-sm font-medium text-red-600">
                          CB Date:{" "}
                          {new Date(lead.cbDate).toLocaleDateString("en-GB")}
                        </p>

                        <p className="text-xs mt-1">
                          {daysLeft === 0 ? (
                            <span className="text-red-600 font-semibold">
                              Callback is today
                            </span>
                          ) : (
                            <span className="text-orange-600 font-semibold">
                              {daysLeft} day(s) left
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
