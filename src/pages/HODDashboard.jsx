import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
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

import { apiRequest } from "@/components/CustomComponents/apiRequest";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

const HODDashboard = () => {
  const navigate = useNavigate();

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
    getAllDashBoard();
  }, []);

  const getAllDashBoard = async () => {
    try {
      const response = await apiRequest("DashBoard/getAllDashBoard", {
        method: "POST",
        body: JSON.stringify({}),
      });
      setStats(response);
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
      console.log("getReviews error:", error);
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
      console.log("getPatients error:", e);
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
      console.log("getPhysios error:", e);
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
      console.log("getReviewStatus error:", e);
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
      console.log("getReviewTypes error:", e);
      setReviewTypes([]);
    }
  };

  const getRedFlags = async () => {
    try {
      const res = await apiRequest("Redflag/getAllRedflag", { method: "POST" });
      setRedFlags(Array.isArray(res) ? res : []);
    } catch (e) {
      console.log("getRedFlags error:", e);
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
      console.log("getCbNotifications error:", error);
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

  const handleReviewAction = (reviewId, action) => {
    setAllReviews((prev) =>
      prev.map((r) => (r._id === reviewId ? { ...r, status: action } : r)),
    );

    toast({
      title: "Review Updated",
      description: `Review marked as ${action}`,
    });
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

      await apiRequest("Review/updateReview", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      toast({ title: "Success", description: "Review updated." });
      getReviews();
    } catch (error) {
      console.log("UpdateReview error:", error);
    }
  };

  const deleteReview = async (data) => {
    try {
      await apiRequest("Review/deleteReview", {
        method: "POST",
        body: JSON.stringify(data),
      });
      getReviews();
    } catch (e) {
      console.log("deleteReview error:", e);
    }
  };

  const handleDeleteReview = (id) => {
    deleteReview({ _id: id });
    toast({
      title: "Deleted",
      description: "Review has been removed.",
      variant: "destructive",
    });
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
      value: stats.patient,
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Today Sessions",
      value: stats.todaysession,
      icon: CalendarLucide,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Pending Reviews",
      value: stats.pendingreviews,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Completed Sessions",
      value: stats.sessionCompleted,
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

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-800 mb-2">HOD Dashboard</h1>
        <p className="text-gray-600">
          Department oversight and review management
        </p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => navigate("/reviewform")}
          className="p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors"
        >
          <StickyNote className="text-blue-600 mb-2" size={20} />
          <p className="text-sm font-medium">Reviews</p>
        </button>

        <button
          onClick={() => navigate("/patients")}
          className="p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors"
        >
          <UserCircle className="text-pink-600 mb-2" size={20} />
          <p className="text-sm font-medium">Patients</p>
        </button>

        <button
          onClick={() => navigate("/sessions")}
          className="p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors"
        >
          <CalendarLucide className="text-green-600 mb-2" size={20} />
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

        <button
          onClick={() => navigate("/leavephysio")}
          className="p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors"
        >
          <UserMinus className="text-red-600 mb-2" size={20} />
          <p className="text-sm font-medium">Leave Manage</p>
        </button>
      </div>

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
                    Requires attention
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
                          Review Date:{" "}
                          {review.reviewDate
                            ? new Date(review.reviewDate).toLocaleDateString(
                                "en-IN",
                              )
                            : "-"}
                        </p>
                      </div>
                    </div>
                  ))
                )}
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
                        {session.reviewDate
                          ? new Date(session.reviewDate).toLocaleDateString(
                              "en-IN",
                            )
                          : "-"}
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
                          {session.reviewDate
                            ? new Date(session.reviewDate).toLocaleDateString(
                                "en-IN",
                              )
                            : "-"}
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
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
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
      </motion.div>

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
