import React, { useEffect, useMemo, useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Calendar as UICalendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

import {
  Users,
  Calendar as CalendarLucide,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  Edit,
  Trash2,
  CalendarIcon,
  StickyNote,
  UserCircle,
  UserMinus,
  BellRing,
  PhoneCall,
  Activity,
  ShieldAlert,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import { apiRequest } from "@/components/CustomComponents/apiRequest";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import socket from "@/socket/Socket";

const HODDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stats, setStats] = useState({
    patient: 0,
    todaysession: 0,
    alertsCount: 0,
    pendingreviews: 0,
    sessionCompleted: 0,
  });

  const [allReviews, setAllReviews] = useState([]);
  const [cbNotifications, setCbNotifications] = useState([]);

  const [patients, setPatients] = useState([]);
  const [physios, setPhysios] = useState([]);
  const [reviewStatuses, setReviewStatuses] = useState([]);
  const [reviewTypes, setReviewTypes] = useState([]);
  const [redFlags, setRedFlags] = useState([]);
  const [missingNotesAlerts, setMissingNotesAlerts] = useState([]);

  const [editingReview, setEditingReview] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const initialFormState = {
    reviewCode: "",
    patientId: "",
    physioId: "",
    sessionDate: null,
    reviewTime: "",
    reviewTypeId: "",
    reviewStatusId: "",
    redFlags: [],
    feedback: "",
    Satisfaction: "",
  };

  const [sessionForm, setSessionForm] = useState(initialFormState);

  useEffect(() => {
    AOS.init({ duration: 700, once: true, easing: "ease-out-cubic" });
    getAllDashBoard();
  }, []);

  const getAllDashBoard = async () => {
    try {
      const response = await apiRequest("DashBoard/getAllDashBoard", {
        method: "POST",
        body: JSON.stringify({}),
      });
      setStats(response || {});
    } catch (error) {
      console.error("Dashboard error:", error);
    }
  };

  useEffect(() => {
    getReviews();
    getPatients();
    getPhysios();
    getReviewStatus();
    getReviewTypes();
    getRedFlags();
    getCbNotifications();
  }, []);

  const fetchMissingNotesAlerts = async () => {
    if (!user?._id) return;
    try {
      const res = await apiRequest("Notifications/getNotifications", {
        method: "POST",
        body: JSON.stringify({ employeeId: user._id }),
      });
      const all = res?.data || [];
      setMissingNotesAlerts(
        all.filter((n) => n.type === "HOD-Notes-Alert"),
      );
    } catch (e) {
      console.error("fetchMissingNotesAlerts error", e);
    }
  };

  useEffect(() => {
    if (!user?._id) return;
    fetchMissingNotesAlerts();
    socket.on("receiveNotification", fetchMissingNotesAlerts);
    return () => {
      socket.off("receiveNotification", fetchMissingNotesAlerts);
    };
  }, [user?._id]);

  const getReviews = async () => {
    try {
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);

      const filter = `${today.toISOString().split("T")[0]}T00:00:00Z`;
      const nextdate = `${tomorrow.toISOString().split("T")[0]}T00:00:00Z`;

      const response = await apiRequest("Review/getAllReview", {
        method: "POST",
        body: JSON.stringify({
          sessionDate: filter,
          nextDate: nextdate,
        }),
      });

      setAllReviews(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error(error);
      setAllReviews([]);
    }
  };

  const getPatients = async () => {
    try {
      const res = await apiRequest("Patient/getAllPatient", {
        method: "POST",
        body: JSON.stringify({}),
      });
      setPatients(res?.data || res || []);
    } catch (e) {
      console.error(e);
      setPatients([]);
    }
  };

  const getPhysios = async () => {
    try {
      const res = await apiRequest("Physio/getAllPhysio", {
        method: "POST",
        body: JSON.stringify({}),
      });
      setPhysios(res?.physios || []);
    } catch (e) {
      console.error(e);
      setPhysios([]);
    }
  };

  const getReviewStatus = async () => {
    try {
      const response = await apiRequest("ReviewStatus/getAllReviewStatus", {
        method: "POST",
        body: JSON.stringify({}),
      });
      setReviewStatuses(Array.isArray(response) ? response : []);
    } catch (e) {
      console.error(e);
      setReviewStatuses([]);
    }
  };

  const getReviewTypes = async () => {
    try {
      const res = await apiRequest("ReviewType/getAllReviewType", {
        method: "POST",
      });
      setReviewTypes(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error(e);
      setReviewTypes([]);
    }
  };

  const getRedFlags = async () => {
    try {
      const res = await apiRequest("Redflag/getAllRedflag", {
        method: "POST",
      });
      setRedFlags(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error(e);
      setRedFlags([]);
    }
  };

  const getCbNotifications = async () => {
    try {
      const res = await apiRequest("Lead/getAllLead", {
        method: "POST",
      });

      const leads = Array.isArray(res)
        ? res
        : Array.isArray(res?.leads)
          ? res.leads
          : [];

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const filtered = leads.filter((lead) => {
        if (!lead?.cbDate) return false;

        const cbDate = new Date(lead.cbDate);
        cbDate.setHours(0, 0, 0, 0);

        const threeDaysBefore = new Date(cbDate);
        threeDaysBefore.setDate(cbDate.getDate() - 3);

        return today >= threeDaysBefore && today <= cbDate;
      });

      filtered.sort((a, b) => new Date(a.cbDate) - new Date(b.cbDate));
      setCbNotifications(filtered);
    } catch (error) {
      console.error(error);
      setCbNotifications([]);
    }
  };

  const pendingReviews = useMemo(() => {
    return allReviews.filter(
      (r) => r.reviewStatusId?.reviewStatusName === "Pending",
    );
  }, [allReviews]);

  const alertReviews = useMemo(() => {
    return allReviews.filter(
      (r) =>
        (Array.isArray(r.redFlags) && r.redFlags.length > 0) ||
        r.reviewTypeId?.reviewTypeName === "RedFlags",
    );
  }, [allReviews]);

  const getRedFlagNames = (feedbackRedFlags = []) => {
    return feedbackRedFlags
      .map((rf) => rf?.redFlagId?.redflagName)
      .filter(Boolean);
  };

  const getDaysLeft = (cbDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const target = new Date(cbDate);
    target.setHours(0, 0, 0, 0);

    const diffTime = target - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const formatShortDate = (date) => {
    if (!date) return "-";
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("en-IN");
  };

  const ReviewTypeBadge = ({ reviewTypeName }) => (
    <span
      className={`px-3 py-1 rounded-md text-xs font-medium inline-block ${
        reviewTypeName === "General"
          ? "bg-blue-100 text-blue-800"
          : reviewTypeName === "RedFlags"
            ? "bg-red-100 text-red-800"
            : "bg-gray-100 text-gray-700"
      }`}
    >
      {reviewTypeName || "N/A"}
    </span>
  );

  const FeedbackView = ({ feedback }) => {
    if (!feedback) return <span className="text-gray-400">No feedback</span>;

    return (
      <div className="space-y-1 text-xs text-gray-600">
        {typeof feedback === "string" && <p>{feedback}</p>}

        {typeof feedback === "object" && (
          <>
            {feedback.sessionFeedbackPros && (
              <p>{feedback.sessionFeedbackPros}</p>
            )}
            {feedback.sessionFeedbackCons && (
              <p className="text-orange-600">{feedback.sessionFeedbackCons}</p>
            )}
            {feedback.redFlags?.length > 0 && (
              <p className="text-red-600">{feedback.redFlags.join(", ")}</p>
            )}
            {feedback.media?.length > 0 && (
              <p className="text-blue-600">{feedback.media.join(", ")}</p>
            )}
          </>
        )}
      </div>
    );
  };

  const UpdateReview = async (data) => {
    try {
      const payload = {
        ...data,
        redFlags:
          data.redFlags && data.redFlags.length > 0
            ? data.redFlags
            : editingReview?.redFlags || [],
      };

      const res = await apiRequest("Review/updateReview", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      toast({ title: "Success", description: res.message });
      getReviews();
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: error?.message, variant: "destructive" });
    }
  };

  const deleteReview = async (data) => {
    try {
      const res = await apiRequest("Review/deleteReview", {
        method: "POST",
        body: JSON.stringify(data),
      });
      toast({ title: "Deleted", description: res.message, variant: "destructive" });
      getReviews();
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: e?.message, variant: "destructive" });
    }
  };

  const handleDeleteReview = (id) => {
    deleteReview({ _id: id });
  };

  const handleEditReview = (review) => {
    setEditingReview(review);

    setSessionForm({
      reviewCode: review.reviewCode || "",
      patientId: review.patientId?._id || "",
      physioId: review.physioId?._id || "",
      sessionDate: review.reviewDate ? new Date(review.reviewDate) : null,
      reviewTime: review.reviewTime || "",
      reviewTypeId: review.reviewTypeId?._id || "",
      reviewStatusId: review.reviewStatusId?._id || "",
      redFlags: review.redFlags || [],
      feedback: review.feedback || "",
      Satisfaction: review.Satisfaction || "",
    });

    setIsFormOpen(true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();

    if (!sessionForm.patientId || !sessionForm.physioId) {
      alert("Please select patient and physio");
      return;
    }

    if (editingReview) {
      UpdateReview({ ...sessionForm, _id: editingReview._id });
    } else {
      toast({ title: "Info", description: "Create API not connected here." });
    }

    setIsFormOpen(false);
    setEditingReview(null);
    setSessionForm(initialFormState);
  };

  const selectedPatientObj = useMemo(() => {
    return patients.find((p) => p._id === sessionForm.patientId);
  }, [patients, sessionForm.patientId]);

  const statCards = [
    {
      title: "Total Patients",
      value: stats.patient || 0,
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Today Sessions",
      value: stats.todaysession || 0,
      icon: CalendarLucide,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Pending Reviews",
      value: stats.pendingreviews || 0,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Completed Sessions",
      value: stats.sessionCompleted || 0,
      icon: CheckCircle,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Alerts",
      value: alertReviews.length,
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
    {
      title: "CB Notifications",
      value: cbNotifications.length,
      icon: BellRing,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
  ];

  const weeklyChartData = useMemo(() => {
    const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const reviewsByDay = [0, 0, 0, 0, 0, 0, 0];
    const alertsByDay = [0, 0, 0, 0, 0, 0, 0];

    allReviews.forEach((review) => {
      const date = new Date(
        review.reviewDate || review.createdAt || Date.now(),
      );
      const day = date.getDay();
      reviewsByDay[day] += 1;

      const hasAlert =
        (Array.isArray(review.redFlags) && review.redFlags.length > 0) ||
        review.reviewTypeId?.reviewTypeName === "RedFlags";

      if (hasAlert) {
        alertsByDay[day] += 1;
      }
    });

    return labels.map((name, index) => ({
      name,
      reviews: reviewsByDay[index],
      alerts: alertsByDay[index],
      sessions:
        index === 1
          ? Math.max(Number(stats.todaysession || 0), 0)
          : Math.max(
              Math.round(
                (Number(stats.sessionCompleted || 0) / 6) * ((index % 3) + 1),
              ),
              0,
            ),
    }));
  }, [allReviews, stats.todaysession, stats.sessionCompleted]);

  const reviewStatusChartData = useMemo(() => {
    const pending = allReviews.filter(
      (r) => r.reviewStatusId?.reviewStatusName === "Pending",
    ).length;

    const completed = allReviews.filter(
      (r) => r.reviewStatusId?.reviewStatusName === "Completed",
    ).length;

    const others = Math.max(allReviews.length - pending - completed, 0);

    return [
      { name: "Pending", value: pending },
      { name: "Completed", value: completed },
      { name: "Others", value: others },
    ];
  }, [allReviews]);

  const progressPercent = Math.min(
    ((Number(stats.sessionCompleted || 0) / 26) * 100).toFixed(0),
    100,
  );

  const quickActions = [
    {
      title: "Reviews",
      icon: StickyNote,
      path: "/reviewform",
      color: "text-blue-600",
    },
    {
      title: "Patients",
      icon: UserCircle,
      path: "/patients",
      color: "text-pink-600",
    },
    {
      title: "Schedule Session",
      icon: CalendarLucide,
      path: "/sessions",
      color: "text-green-600",
    },
    {
      title: "Manage Physios",
      icon: Users,
      path: "/physios",
      color: "text-purple-600",
    },
    {
      title: "View Reports",
      icon: TrendingUp,
      path: "/reports",
      color: "text-orange-600",
    },
    {
      title: "Leave Manage",
      icon: UserMinus,
      path: "/leavephysio",
      color: "text-red-600",
    },
  ];

  const pieColors = ["#f59e0b", "#10b981", "#94a3b8"];

  return (
    <div className="space-y-6">
      <div
        data-aos="fade-down"
        data-aos-duration="600"
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            HOD Dashboard
          </h1>
          <p className="text-gray-600">
            Department oversight and review management
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-2xl border bg-white px-4 py-3 shadow-sm" data-aos="fade-left" data-aos-delay="100">
          <Activity className="h-5 w-5 text-blue-600" />
          <div>
            <p className="text-xs text-gray-500">Today Overview</p>
            <p className="text-sm font-semibold text-gray-800">
              {stats.todaysession || 0} sessions • {pendingReviews.length}{" "}
              pending Reviews
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {quickActions.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={item.title}
              data-aos="zoom-in"
              data-aos-delay={idx * 60}
              onClick={() => navigate(item.path)}
              className="p-4 text-left border rounded-xl hover:bg-gray-50 transition-colors bg-white shadow-sm"
            >
              <Icon className={`${item.color} mb-2`} size={20} />
              <p className="text-sm font-medium">{item.title}</p>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              data-aos="fade-up"
              data-aos-delay={index * 60}
            >
              <Card className="medical-card hover:shadow-lg transition-shadow border-0 shadow-sm">
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
                    <AnimatedNumber value={stat.value} />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Live dashboard summary
                  </p>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 shadow-sm" data-aos="fade-right" data-aos-delay="50">
          <CardHeader>
            <CardTitle>Weekly Sessions & Reviews</CardTitle>
            <CardDescription>
              Visual trend for sessions, reviews and alerts
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="sessions" radius={[8, 8, 0, 0]} />
                <Bar dataKey="reviews" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm" data-aos="fade-left" data-aos-delay="100">
          <CardHeader>
            <CardTitle>Review Status Distribution</CardTitle>
            <CardDescription>Pending vs completed reviews</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={reviewStatusChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  label
                >
                  {reviewStatusChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={pieColors[index % pieColors.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="shadow-sm" data-aos="fade-right" data-aos-delay="50">
          <CardHeader>
            <CardTitle>Review Alert Trend</CardTitle>
            <CardDescription>Red flag review movement</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="alerts" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Session Progress</CardTitle>
            <CardDescription>Target completion tracker</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Completion</span>
                <span className="font-semibold text-gray-800">
                  {progressPercent}%
                </span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <p className="text-gray-600">
                  {stats.sessionCompleted || 0} / 26 Sessions
                </p>
                <p className="text-blue-600 font-medium">
                  {Math.max(26 - Number(stats.sessionCompleted || 0), 0)} left
                </p>
              </div>
            </div>
          </CardContent>
        </Card> */}

        <Card className="border-l-4 border-red-500 shadow-sm" data-aos="fade-left" data-aos-delay="100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-600" />
              Critical Alerts
            </CardTitle>
            <CardDescription>Immediate review attention</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">
              <AnimatedNumber value={alertReviews.length} />
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Active issues requiring follow-up
            </p>

            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Pending Reviews</span>
                <span className="font-semibold">{pendingReviews.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">CB Notifications</span>
                <span className="font-semibold">{cbNotifications.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div data-aos="fade-right" data-aos-delay="50">
          <Card className="medical-card shadow-sm">
            <CardHeader>
              <CardTitle>Pending Reviews</CardTitle>
              <CardDescription>
                15-day patient reviews requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingReviews.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No pending reviews today.
                  </p>
                ) : (
                  pendingReviews.map((review) => (
                    <div
                      key={review._id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-800">
                          {review.patientId?.patientName || "N/A"}
                        </p>
                        <p className="text-sm text-gray-600">
                          Review Date: {formatShortDate(review.reviewDate)}
                        </p>
                      </div>

                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        Pending
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div data-aos="fade-left" data-aos-delay="100">
          <Card className="medical-card shadow-sm">
            <CardHeader>
              <CardTitle>Session Alerts</CardTitle>
              <CardDescription>Reviews with RedFlags / issues</CardDescription>
            </CardHeader>

            <CardContent>
              <div className="block md:hidden space-y-3">
                {alertReviews.length === 0 ? (
                  <p className="text-sm text-gray-500">No alerts today.</p>
                ) : (
                  alertReviews.map((session) => (
                    <div
                      key={session._id}
                      className="border rounded-xl p-3 bg-white shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-gray-800">
                            {session.patientId?.patientName || "N/A"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {session.physioId?.physioName || "-"}
                          </p>
                        </div>

                        <ReviewTypeBadge
                          reviewTypeName={session.reviewTypeId?.reviewTypeName}
                        />
                      </div>

                      <div className="mt-2 text-xs text-gray-600">
                        <span className="text-gray-500">Date:</span>{" "}
                        {formatShortDate(session.reviewDate)}
                      </div>

                      {session.reviewTypeId?.reviewTypeName === "RedFlags" &&
                        session.redFlags?.length > 0 && (
                          <div className="text-xs text-red-600 mt-2">
                            {getRedFlagNames(session.redFlags).join(", ")}
                          </div>
                        )}

                      <div className="mt-2">
                        <FeedbackView feedback={session.feedback} />
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-2">
                        {session.reviewStatusId?.reviewStatusName ? (
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium inline-block ${
                              session.reviewStatusId.reviewStatusName.toLowerCase() ===
                              "completed"
                                ? "bg-green-100 text-green-800"
                                : session.reviewStatusId.reviewStatusName.toLowerCase() ===
                                    "pending"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {session.reviewStatusId.reviewStatusName}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">
                            No status
                          </span>
                        )}

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditReview(session)}
                          >
                            <Edit size={12} />
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive">
                                <Trash2 size={12} />
                              </Button>
                            </AlertDialogTrigger>

                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Are you sure?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete the review.
                                </AlertDialogDescription>
                              </AlertDialogHeader>

                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleDeleteReview(session._id)
                                  }
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="hidden md:block">
                {alertReviews.length === 0 ? (
                  <p className="text-sm text-gray-500">No alerts today.</p>
                ) : (
                  <>
                    <div className="grid grid-cols-9 text-xs font-semibold text-gray-600 border-b pb-2">
                      <div className="p-2">Patient</div>
                      <div className="p-2">Physio</div>
                      <div className="p-2">Date</div>
                      <div className="p-2">Type</div>
                      <div className="p-2 col-span-2">Feedback</div>
                      <div className="p-2">Status</div>
                      <div className="p-2">Actions</div>
                    </div>

                    {alertReviews.map((session) => (
                      <div
                        key={session._id}
                        className="grid grid-cols-9 items-start border-b hover:bg-gray-50 text-sm"
                      >
                        <div className="p-2">
                          {session.patientId?.patientName || "N/A"}
                        </div>
                        <div className="p-2">
                          {session.physioId?.physioName || "-"}
                        </div>
                        <div className="p-2">
                          {formatShortDate(session.reviewDate)}
                        </div>

                        <div className="p-2">
                          <ReviewTypeBadge
                            reviewTypeName={
                              session.reviewTypeId?.reviewTypeName
                            }
                          />
                          {session.reviewTypeId?.reviewTypeName ===
                            "RedFlags" &&
                            session.redFlags?.length > 0 && (
                              <div className="text-xs text-red-600 mt-1">
                                ({getRedFlagNames(session.redFlags).join(", ")})
                              </div>
                            )}
                        </div>

                        <div className="p-2 col-span-2">
                          <FeedbackView feedback={session.feedback} />
                        </div>

                        <div className="p-2">
                          {session.reviewStatusId?.reviewStatusName ? (
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium inline-block ${
                                session.reviewStatusId.reviewStatusName.toLowerCase() ===
                                "completed"
                                  ? "bg-green-100 text-green-800"
                                  : session.reviewStatusId.reviewStatusName.toLowerCase() ===
                                      "pending"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {session.reviewStatusId.reviewStatusName}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </div>

                        <div className="p-2 flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditReview(session)}
                          >
                            <Edit size={12} />
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive">
                                <Trash2 size={12} />
                              </Button>
                            </AlertDialogTrigger>

                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Are you sure?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete the review.
                                </AlertDialogDescription>
                              </AlertDialogHeader>

                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleDeleteReview(session._id)
                                  }
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div data-aos="fade-up" data-aos-delay="50">
        <Card className="medical-card shadow-sm">
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
                        <div className="flex items-center gap-2">
                          <PhoneCall className="h-4 w-4 text-orange-600" />
                          <p className="font-semibold text-gray-800">
                            {lead.leadName}
                          </p>
                        </div>

                        <p className="text-sm text-gray-500 mt-1">
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
                          CB Date: {formatShortDate(lead.cbDate)}
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

      {missingNotesAlerts.length > 0 && (
        <div data-aos="fade-up">
          <Card className="border-l-4 border-orange-500 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <StickyNote className="h-5 w-5 text-orange-600" />
                Missing HOD Notes Alerts
                <span className="ml-auto px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 text-xs font-semibold">
                  {missingNotesAlerts.length}
                </span>
              </CardTitle>
              <CardDescription>
                Patients who reached session 3+ without HOD Notes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {missingNotesAlerts.map((alert, idx) => (
                  <div
                    key={alert._id || idx}
                    className="flex items-start justify-between p-3 border border-orange-200 rounded-lg bg-orange-50"
                  >
                    <p className="text-sm text-gray-800">{alert.message}</p>
                    <p className="text-xs text-gray-400 shrink-0 ml-4">
                      {alert.createdAt
                        ? new Date(alert.createdAt).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto scrollbar-hide">
          <DialogHeader>
            <DialogTitle>
              {editingReview ? "Edit Review" : "Schedule New Review"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Patient</Label>
              <Select
                onValueChange={(v) =>
                  setSessionForm((p) => ({ ...p, patientId: v }))
                }
                value={sessionForm.patientId}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.length === 0 ? (
                    <SelectItem value="loading" disabled>
                      Loading patients...
                    </SelectItem>
                  ) : (
                    patients.map((p) => (
                      <SelectItem key={p._id} value={p._id}>
                        {p.patientName}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Physiotherapist</Label>
              <Select
                onValueChange={(v) =>
                  setSessionForm((p) => ({ ...p, physioId: v }))
                }
                value={sessionForm.physioId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a physio" />
                </SelectTrigger>
                <SelectContent>
                  {physios.map((p) => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.physioName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Review Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !sessionForm.sessionDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {sessionForm.sessionDate ? (
                      format(sessionForm.sessionDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <UICalendar
                    mode="single"
                    selected={sessionForm.sessionDate}
                    onSelect={(d) =>
                      setSessionForm((p) => ({ ...p, sessionDate: d }))
                    }
                    initialFocus
                    disabled={(date) =>
                      date < new Date(new Date().setHours(0, 0, 0, 0))
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Review Type</Label>
              <Select
                value={sessionForm.reviewTypeId}
                onValueChange={(v) =>
                  setSessionForm((p) => ({ ...p, reviewTypeId: v }))
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a review type" />
                </SelectTrigger>
                <SelectContent>
                  {reviewTypes.map((rt) => (
                    <SelectItem key={rt._id} value={rt._id}>
                      {rt.reviewTypeName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="font-semibold">Current Goal</Label>
              <p className="text-sm text-gray-700 p-2 bg-gray-100 rounded-md mt-1">
                {selectedPatientObj?.shortTermGoals || "No current goal set."}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Feedback</Label>
              <Input
                name="feedback"
                type="text"
                value={sessionForm.feedback}
                onChange={(e) =>
                  setSessionForm((p) => ({ ...p, feedback: e.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Satisfaction (%)</Label>
              <div className="flex items-center gap-2 flex-wrap">
                {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((p) => (
                  <Button
                    key={p}
                    type="button"
                    variant={
                      sessionForm.Satisfaction === p ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() =>
                      setSessionForm((f) => ({ ...f, Satisfaction: p }))
                    }
                  >
                    {p}%
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Review Status</Label>
              <Select
                value={sessionForm.reviewStatusId}
                onValueChange={(v) =>
                  setSessionForm((p) => ({ ...p, reviewStatusId: v }))
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a review status" />
                </SelectTrigger>
                <SelectContent>
                  {reviewStatuses.map((rt) => (
                    <SelectItem key={rt._id} value={rt._id}>
                      {rt.reviewStatusName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingReview ? "Save Changes" : "Schedule Review"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HODDashboard;
