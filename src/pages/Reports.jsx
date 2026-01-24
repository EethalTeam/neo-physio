import React, { useState, useEffect } from "react";
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
  const [stats, setStats] = useState({
    lead: 0,
    patient: 0,
    monthlySessions: 0,
    physio: 0,
    monthlyRevenue: 0,
    // physio: 0,
    completedReview: 0,
    cancelledSessions: 0,
    patientRecover: 0,
    sessionCompleted: 0,
  });

  useEffect(() => {
    getAllDashBoard();
    funnelmonthly();
  }, []);

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
  const monthname = ["January", "Febuary", "March", "A"];
  const month = new Date().getMonth() + 1;
  const year = new Date().getFullYear();
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
      <div className="grid grid-cols-1 md:grid-cols-2  gap-6">
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

        <Card className="medical-card hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Patients Recovered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">
              {stats.patientRecover}
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
      <Card className="medical-card hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Total session
          </CardTitle>
          <div className={`p-2 rounded-full ${stats.bgColor}`}>
            <User className={`h-4 w-4 ${stats.color}`} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-800">
            {stats.monthlySessions}
          </div>
          <p className="text-xs text-gray-500 mt-1">{`${month}-${year}`}</p>
        </CardContent>
      </Card>
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
                      {" "}
                      <span className="text-sm text-gray-600">
                        {item.month}
                      </span>{" "}
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
