import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogDescription,
} from "@/components/ui/dialog";
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
  Calendar as CalendarIcon,
  Play,
  Square,
  MessageSquare,
  Search,
  PlusCircle,
  Edit,
  Trash2,
  Upload,
  Paperclip,
  XCircle,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, formatISO } from "date-fns";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "@/components/CustomComponents/apiRequest";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
const initialFormState = {
  patientId: "",
  physioId: "",
  sessionDate: "",
  sessionTime: "",
  machineId: "",
};

const initialFeedbackState = {
  sessionFeedbackPros: "",
  modeOfExercise: "passive",
  redFlags: [],
  homeExerciseAssigned: "no",
  modalities: "no",
  modalitiesList: [],
  machineId: "",
  targetArea: "",
  media: [],
  reviewTypeId: "",
};

const ReviewMasterForm = () => {
  const navigate = useNavigate();
  const { user, getPermissionsByPath } = useAuth();

  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [patients, setPatients] = useState([]);
  const [physios, setPhysios] = useState([]);
  const [reviewTypes, setReviewTypes] = useState([]);
  const [redFlags, setRedFlags] = useState([]);
  const [machines, setMachines] = useState([]);
  const [modalities, setModalities] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [reviewTypeFilter, setReviewTypeFilter] = useState("all");

  const [permissions, setPermissions] = useState({
    isAdd: false,
    isView: false,
    isEdit: false,
    isDelete: false,
  });
  const today = new Date();

  const [downloadMonth, setDownloadMonth] = useState(
    String(today.getMonth() + 1),
  );
  const [downloadYear, setDownloadYear] = useState(String(today.getFullYear()));
  const monthOptions = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const yearOptions = [];
  for (let y = today.getFullYear() - 5; y <= today.getFullYear() + 5; y++) {
    yearOptions.push(String(y));
  }

  const fmtDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-IN");
  };
  const [feedbackDialog, setFeedbackDialog] = useState({
    open: false,
    sessionId: null,
    patientId: null,
  });
  const [cancelDialog, setCancelDialog] = useState({
    open: false,
    sessionId: null,
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditDate, setIsEditDate] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [sessionForm, setSessionForm] = useState(initialFormState);
  const [feedback, setFeedback] = useState(initialFeedbackState);
  const fileInputRef = useRef(null);
  const [reviewStatuses, setReviewStatuses] = useState([]);

  useEffect(() => {
    getPermissions();
    getAllData();
    getReviewStatus();
  }, []);

  const getPermissions = async () => {
    const res = await getPermissionsByPath(window.location.pathname);
    if (res) setPermissions(res);
    else navigate("/dashboard");
  };
  console.log(filteredReviews, "filteredReviewsfilteredReviews");
  const getAllData = async () => {
    await Promise.all([
      getReviews(),
      getPatients(),
      getPhysios(),
      getReviewTypes(),
      getRedFlags(),
    ]);
  };

  const getReviews = async () => {
    try {
      const storedRole = localStorage.getItem("userRole");
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      let date = today.toISOString();
      let filter = `${date.split("T")[0]}T00:00:00Z`;

      let nextdate = `${tomorrow.toISOString().split("T")[0]}T00:00:00Z`;

      console.log(filter, "filter");
      console.log(nextdate, "nextdate");

      const response = await apiRequest("Review/getAllReview", {
        method: "POST",
        body: JSON.stringify({
          sessionDate: filter,
          nextDate: nextdate,
          // physioId: user._id,
          // storedRole: storedRole,
          // redFlags: true,
        }),
      });
      const redflagsReview = response.filter(
        (review) =>
          Array.isArray(review.redFlags) && review.redFlags.length > 0,
      );
      const completedReviews = response.filter(
        (review) => review.reviewStatusId?.reviewStatusName === "Pending",
      );

      setReviews(completedReviews);
      setFilteredReviews(completedReviews);
      console.log(completedReviews, "reviews from frontend");
    } catch (error) {
      console.log(error, "error from frontend get All Session");
    }
  };

  const getPatients = async () => {
    const res = await apiRequest("Patient/getAllPatient", {
      method: "POST",
      body: JSON.stringify({}),
    });

    setPatients(res?.data || res || []);
    console.log(patients, "patient shortterm");
  };

  const getPhysios = async () => {
    const res = await apiRequest("Physio/getAllPhysio", {
      method: "POST",
      body: JSON.stringify({}),
    });
    setPhysios(res.physios || []);
  };

  const getReviewTypes = async () => {
    const res = await apiRequest("ReviewType/getAllReviewType", {
      method: "POST",
    });
    setReviewTypes(res || []);
    console.log(res, "review types");
  };

  const getRedFlags = async () => {
    const res = await apiRequest("Redflag/getAllRedflag", { method: "POST" });
    setRedFlags(res || []);
    console.log(res, "review types");
  };

  const getRedFlagNames = (feedbackRedFlags = []) => {
    console.log("helper input →", feedbackRedFlags);

    return feedbackRedFlags
      .map((rf) => {
        console.log("each rf →", rf);
        return rf?.redFlagId?.redflagName;
      })
      .filter(Boolean);
  };

  // useEffect(() => {
  //   let filtered = [...reviews];
  //   if (searchTerm) {
  //     filtered = filtered.filter(
  //       (r) =>
  //         r.patientId?.patientName
  //           ?.toLowerCase()
  //           .includes(searchTerm.toLowerCase()) ||
  //         r.physioId?.physioName
  //           ?.toLowerCase()
  //           .includes(searchTerm.toLowerCase()) ||
  //         r.feedback?.toLowerCase()?.includes(searchTerm.toLowerCase()),
  //     );
  //   }
  //   if (reviewTypeFilter !== "all") {
  //     filtered = filtered.filter(
  //       (r) => r.reviewTypeId?._id === reviewTypeFilter,
  //     );
  //   }
  //   setFilteredReviews(filtered);
  // }, [searchTerm, reviewTypeFilter, reviews]);

  const getPatientName = (patient) => {
    if (!patient) return "unknown";
    if (typeof patient === "object") return patient.patientName || "unknown";
    return patients.find((p) => p._id === patient)?.patientName || "unknown";
  };

  const getPhysioName = (physio) => {
    if (!physio) return "unknown";
    if (typeof physio === "object") return physio.physioName || "unknown";
    return physios.find((p) => p._id === physio)?.physioName || "unknown";
  };

  const getReviewTypeName = (type) => {
    if (!type) return "unknown";
    if (typeof type === "object") return type.reviewTypeName || "unknown";
    return reviewTypes.find((r) => r._id === type)?.reviewTypeName || "unknown";
  };

  useEffect(() => {
    let filtered = [...reviews];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();

      filtered = filtered.filter((r) => {
        const patientName = String(getPatientName(r.patientId)).toLowerCase();
        const physioName = String(getPhysioName(r.physioId)).toLowerCase();
        const feedback = String(r.feedback || "").toLowerCase();

        return (
          patientName.includes(term) ||
          physioName.includes(term) ||
          feedback.includes(term)
        );
      });
    }

    if (reviewTypeFilter !== "all") {
      filtered = filtered.filter(
        (r) =>
          r.reviewTypeId === reviewTypeFilter ||
          r.reviewTypeId?._id === reviewTypeFilter,
      );
    }

    setFilteredReviews(filtered);
  }, [searchTerm, reviewTypeFilter, reviews, patients, physios]);

  const handleFeedbackSubmit = async () => {
    try {
      if (!feedback.sessionFeedbackPros || !feedback.reviewTypeId) {
        alert("Please enter feedback and select review type before submitting");
        return;
      }
      const pendingStatus = reviewStatuses.find(
        (s) => s.reviewStatusName.toLowerCase() === "pending",
      );

      if (!pendingStatus) {
        alert("Pending status not found");
        return;
      }

      const payload = {
        patientId: feedbackDialog.patientId,
        physioId: user._id,
        reviewDate: new Date(),
        reviewTime: new Date().toLocaleTimeString(),
        reviewTypeId: feedback.reviewTypeId,
        redflagId:
          feedback.redFlags.length > 0 ? feedback.redFlags[0].redflagId : null,
        feedback: feedback.sessionFeedbackPros,
        reviewStatusId: pendingStatus._id,
      };

      await apiRequest("Review/createReview", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setFeedbackDialog({ open: false, sessionId: null, patientId: null });
      getReviews();
      setFeedback(initialFeedbackState);
    } catch (err) {
      console.error("Error submitting feedback:", err);
      alert("Failed to submit feedback");
    }
  };

  const createReview = async (data) => {
    try {
      if (!data.sessionDate || !data.patientId || !data.reviewTypeId) return;

      const payload = {
        patientId: data.patientId,
        Satisfaction: data.Satisfaction,
        physioId: data.physioId || user._id,
        reviewDate: new Date(data.sessionDate).toISOString(),
        // reviewTime: data.sessionTime || new Date().toLocaleTimeString(),
        reviewTypeId: data.reviewTypeId,
        redflagId: data.redflagId || "694e1fc2212f38083803642a",
        feedback: data.feedback || "",
        reviewStatusId: data.reviewStatusId || "",
      };

      const response = await apiRequest("Review/createReview", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      getReviews();

      if (response.ok) {
        console.log(response, "response");
      }
    } catch (error) {
      console.error(error, "Error creating review");
    }
  };
  const selectedPatientObj = patients.find(
    (p) => p._id === sessionForm.patientId,
  );

  const handleFormSubmit = (e) => {
    e.preventDefault();

    if (!sessionForm.patientId || !sessionForm.physioId) {
      alert("Please select patient and physio");
      return;
    }

    const formData = {
      ...sessionForm,
      patientId: parseInt(sessionForm.patientId),
      physioId: parseInt(sessionForm.physioId),
      reviewDate: sessionForm.reviewDate,
      reviewStatusId: sessionForm.reviewStatusId,
      Satisfaction: sessionForm.Satisfaction,

      // shortterm: sessionForm.shortTermGoal,
      reviewStatusName: sessionForm.reviewStatusName,
    };
    if (editingReview) {
      UpdateReview({ ...sessionForm, _id: editingReview._id });
      toast({ title: "Success", description: "Review updated." });
    } else {
      createReview(sessionForm);
      toast({ title: "Success", description: "New Review scheduled." });
    }

    setIsFormOpen(false);
    setEditingReview(null);
    setSessionForm(initialFormState);
  };
  console.log(sessionForm, "Session form");

  const downloadReviewPDF = async () => {
    try {
      const res = await apiRequest("Review/getAllReviewDownload", {
        method: "POST",
        body: JSON.stringify({
          month: downloadMonth,
          year: downloadYear,
        }),
      });

      const report = Array.isArray(res?.report) ? res.report : [];
      const totalReviews = res?.totalReviews || 0;
      const completedReviews = res?.completedReviews || 0;

      if (!report.length) {
        toast({
          title: "No Data",
          description: "No review data found.",
          variant: "destructive",
        });
        return;
      }

      const doc = new jsPDF("landscape");

      // Title
      doc.setFontSize(16);
      doc.text("NEO-PHYSIO - REVIEW REPORT", 14, 15);

      // Month
      doc.setFontSize(11);
      doc.text(
        `Month: ${monthOptions.find((m) => m.value === downloadMonth)?.label} ${downloadYear}`,
        14,
        22,
      );

      // Summary
      doc.text(`Total Reviews: ${totalReviews}`, 14, 30);
      doc.text(`Completed Reviews: ${completedReviews}`, 90, 30);

      const rows = report.map((r, index) => [
        index + 1,
        r.reviewDate ? fmtDate(r.reviewDate) : "-",
        r.patientId?.patientName || "-",
        r.physioId?.physioName || "-",
        r.reviewTypeId?.reviewTypeName || "-",
        r.reviewStatusId?.reviewStatusName || "-",
        r.feedback || "-",
        r.patientId?.shortTermGoals || "-",
        r.patientId?.longTermGoals || "-",
        r.patientId?.isRecovered ? "Recovered" : "Active",
      ]);

      autoTable(doc, {
        startY: 36,
        head: [
          [
            "S.No",
            "Review Date",
            "Patient",
            "Physio",
            "Type",
            "Status",
            "Feedback",
            "Short Goal",
            "Long Goal",
            "Recovered",
          ],
        ],
        body: rows,
        styles: { fontSize: 8 },
      });

      doc.save(`Review_Report_${downloadMonth}_${downloadYear}.pdf`);
    } catch (error) {
      console.error("PDF download error:", error);

      toast({
        title: "Error",
        description: "Failed to download review PDF.",
        variant: "destructive",
      });
    }
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
      const response = await apiRequest("Review/updateReview", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      getReviews();
      toast({ title: "Success", description: "Review updated." });
    } catch (error) {
      console.log(error, "error from frontend update  Review");
    }
  };
  console.log(reviews, "Reviews");
  console.log(filteredReviews, "Filtered reviews");
  const deleteReview = async (data) => {
    try {
      const response = await apiRequest("Review/deleteReview", {
        method: "POST",
        body: JSON.stringify(data),
      });
      getReviews();
    } catch (error) {
      console.log(error, "error   Session delete");
    }
  };

  const handleEditReview = (review) => {
    setEditingReview(review);

    setSessionForm({
      reviewCode: review.reviewCode || "",
      patientId: review.patientId?._id || "",
      physioId: review.physioId?._id || "",
      sessionDate: review.reviewDate ? new Date(review.reviewDate) : "",
      reviewTime: review.reviewTime || "",
      reviewTypeId: review.reviewTypeId?._id || "",
      reviewStatusId: review.reviewStatusId ? review.reviewStatusId._id : "",
      redFlags: review.redFlags || [],
      feedback: review.feedback || "",
      Satisfaction: review.Satisfaction || "",
    });

    setIsFormOpen(true);
  };
  const handlePostponed = async (review) => {
    if (!review?._id) return;

    try {
      const newDate = sessionForm.sessionDate;
      if (!newDate) {
        toast({
          title: "Error",
          description: "Please select a date",
          variant: "destructive",
        });
        return;
      }

      await apiRequest("Review/updateReviewDate", {
        method: "POST",
        body: JSON.stringify({
          _id: review._id,
          reviewDate: newDate.toISOString(),
        }),
      });

      toast({
        title: "Success",
        description: "Review date updated successfully",
      });

      setIsEditDate(false);
      setEditingReview(null);
      getReviews();
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to update review date",
        variant: "destructive",
      });
    }
  };
  const handleDeleteReview = (id) => {
    // setSessions(prev => prev.filter(s => s.id !== sessionId));
    deleteReview({ _id: id });
    toast({
      title: "Deleted",
      description: "Review has been removed.",
      variant: "destructive",
    });
  };
  const handleEditSession = (session) => {
    // setEditingSession(session);
    setSessionForm({
      ...session,
      // patientId: session.patientId.toString(),
      // physioId: session.physioId.toString(),
      // machineId: session.machineId ? session.machineId.toString() : '',
      // sessionDate: new Date(session.sessionDate),

      sessionCode: session.sessionCode ? session.sessionCode : "",
      patientId: session.patientId ? session.patientId._id : "",
      physioId: session.physioId ? session.physioId._id : "",
      sessionDate: session.sessionDate ? new Date(session.sessionDate) : "",
      sessionDay: session.sessionDay ? session.sessionDay : "",
      sessionTime: session.sessionTime ? session.sessionTime : "",
      sessionFromTime: session.sessionFromTime ? session.sessionFromTime : "",
      feedback: session.feedback ? session.feedback : " ",
      sessionToTime: session.sessionToTime ? session.sessionToTime : "",
      Satisfaction: session.Satisfaction ? session.Satisfaction : "",
      // machineId: session.machineId?session.machineId._id:'',
      sessionStatusId: session.sessionStatusId
        ? session.sessionStatusId._id
        : "",
    });
    setIsFormOpen(true);
  };
  const updateReviewDate = async () => {
    if (!editingReview || !sessionForm.sessionDate) {
      toast({
        title: "Error",
        description: "Please select a valid date",
        variant: "destructive",
      });
      return;
    }

    try {
      await apiRequest("Review/updateReview", {
        method: "POST",
        body: JSON.stringify({
          _id: editingReview._id,
          reviewDate: sessionForm.sessionDate,
        }),
      });

      toast({
        title: "Success",
        description: "Review date updated successfully",
      });

      setIsEditDate(false);
      setEditingReview(null);
      getReviews(); // refresh table
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to update review date",
        variant: "destructive",
      });
    }
  };
  const getReviewStatus = async (data) => {
    try {
      const response = await apiRequest("ReviewStatus/getAllReviewStatus", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setReviewStatuses(response);
      setFilteredReviews(response);
      // setReviewStatuses(response.reviewStatuses || []);
    } catch (error) {
      console.log(error, "error from frontend get All Review Status");
    }
  };
  const [selectedPatient, setSelectedPatient] = useState(null);
  return (
    <div className="md:space-y-6 space-y-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="md:flex md:justify-between md:items-center lg:flex lg:justify-between lg:items-center space-y-5"
      >
        <div>
          <h1 className="md:text-3xl text-xl font-bold text-gray-800 mb-2">
            {user?.role === "Physio" ? "My Reviews" : "Review Management"}
          </h1>
          <p className="text-gray-600">
            {user?.role === "Physio"
              ? "Manage your assigned patient reviews"
              : "Manage all patient reviews and track progress"}
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-2 items-center">
          <div className="w-[160px]">
            <Select value={downloadMonth} onValueChange={setDownloadMonth}>
              <SelectTrigger>
                <SelectValue placeholder="Select month" />
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

          <div className="w-[120px]">
            <Select value={downloadYear} onValueChange={setDownloadYear}>
              <SelectTrigger>
                <SelectValue placeholder="Select year" />
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

          <Button onClick={downloadReviewPDF}>Download Monthly PDF</Button>
        </div>
        {permissions.isAdd && (
          <Button onClick={() => setIsFormOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Schedule Review
          </Button>
        )}
      </motion.div>

      {/* Filter Card */}
      <Card className="medical-card max-w-fit md:max-w-full">
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex md:flex-row flex-col items-center gap-4">
            <div className="flex-1 relative">
              <Input
                placeholder="Search by Patient Name & Physio Name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-48">
              <Select
                value={reviewTypeFilter}
                onValueChange={(v) => setReviewTypeFilter(v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Review Types</SelectItem>
                  {reviewTypes.map((r) => (
                    <SelectItem key={r._id} value={r._id}>
                      {r.reviewTypeName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="medical-card ">
        <CardHeader>
          <CardTitle>Reviews({reviews.length})</CardTitle>
          <Card className="medical-card hidden md:block">
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Patient</th>
                      {user?.role !== "physio" && (
                        <th className="text-left p-2">Physiotherapist</th>
                      )}
                      <th className="text-left p-2">Date</th>{" "}
                      <th className="text-left p-2">Review Type</th>
                      <th className="text-left p-2">Feedback</th>{" "}
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReviews.map((session) => (
                      <tr
                        key={session._id}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="p-2">
                          {session.patientId?.patientName}
                        </td>

                        {user?.role !== "physio" && (
                          <td className="p-2">
                            {session.physioId?.physioName || "-"}
                          </td>
                        )}
                        {/* {user?.role !== 'physio' && <td className="p-2">{session.physioId.physioName}</td>} */}
                        <td className="p-2">
                          <div>
                            <p className="text-sm">
                              {new Date(session.reviewDate).toLocaleDateString(
                                "en-IN",
                              )}
                              {/* {session.reviewDate
                                ? session.reviewDate
                                    .split("T")[0]
                                    .split("-")
                                    .reverse()
                                    .join("-")
                                : "-"} */}
                            </p>
                            <p className="text-xs text-gray-600"></p>
                          </div>
                        </td>
                        {/* <td className="p-2">{session.machineId ? session.machineId.machineName : '-'}</td> */}
                        {/* <td className="p-2"><span className={`px-2 py-1 rounded-full text-xs status-${session.status}`} style={{ backgroundColor: session.sessionStatusId ? session.sessionStatusId.sessionStatusColor : 'white', color: session.sessionStatusId ? session.sessionStatusId.sessionStatusTextColor : 'black' }}> {session.sessionStatusId ? session.sessionStatusId.sessionStatusName : ''}</span></td> */}
                        {/* <td className="p-2"><span className={`px-2 py-1 rounded-full text-xs status-${session.reviewTypeName}`} style={{ backgroundColor: session.sessionStatusId ? session.sessionStatusId.sessionStatusColor : 'white', color: session.sessionStatusId ? session.sessionStatusId.sessionStatusTextColor : 'black' }}> {session.sessionStatusId ? session.sessionStatusId.reviewTypeName : ''}</span></td> */}
                        <td className="p-2">
                          <div
                            className={`inline-block px-3 py-1 rounded-md text-sm font-medium
      ${
        session.reviewTypeId?.reviewTypeName === "General"
          ? "bg-blue-100 text-blue-800"
          : session.reviewTypeId?.reviewTypeName === "RedFlags"
            ? "bg-red-100 text-red-800"
            : "bg-gray-100 text-gray-700"
      }`}
                          >
                            {session.reviewTypeId?.reviewTypeName}
                          </div>

                          {session.reviewTypeId?.reviewTypeName ===
                            "RedFlags" &&
                            session.redFlags?.length > 0 && (
                              <div className="text-xs text-red-600 mt-1">
                                ({getRedFlagNames(session.redFlags).join(", ")})
                              </div>
                            )}
                        </td>

                        {/* <td className="p-2">{session.feedback ? <div className="text-xs">{session.feedback.sessionFeedbackPros && <p className="text-green-600">✓ {session.feedback.sessionFeedbackPros}</p>}{session.feedback.redFlags?.length > 0 && <p className="text-red-600">⚠ {session.feedback.redFlags.join(', ')}</p>}{session.feedback.media?.length > 0 && <p className="text-blue-600"><Paperclip size={12} className="inline-block mr-1" />{session.feedback.media.join(', ')}</p>}</div> : <span className="text-gray-400 text-xs">No feedback</span>}</td> */}
                        <td className="p-2">
                          {" "}
                          {session.feedback ? (
                            <div className="text-sm space-y-1">
                              {typeof session.feedback === "string" && (
                                <p
                                  className={
                                    session.reviewType?.reviewTypeName ===
                                    "General"
                                  }
                                >
                                  {session.reviewType?.reviewTypeName ===
                                    "General"}
                                  {session.feedback}
                                </p>
                              )}
                              {session.feedback.sessionFeedbackPros && (
                                <p className="text-sm text-gray-600">
                                  {session.feedback.sessionFeedbackPros}
                                </p>
                              )}
                              {session.feedback.redFlags?.length > 0 && (
                                <p className="text-sm text-gray-600">
                                  {session.feedback.redFlags.join(", ")}
                                </p>
                              )}
                              {session.feedback.media?.length > 0 && (
                                <p className="text-gray-600">
                                  <Paperclip
                                    size={12}
                                    className="inline-block mr-1"
                                  />
                                  {session.feedback.media.join(", ")}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-600 text-sm">
                              No feedback
                            </span>
                          )}
                        </td>
                        <td className="p-2">
                          {session.reviewStatusId && (
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
                              {session.reviewStatusId?.reviewStatusName}
                            </span>
                          )}
                        </td>
                        <td className="p-2">
                          <div className="flex space-x-1">
                            {user?.role !== "physio" && (
                              <>
                                {/* ✅ Review Date icon button */}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingReview(session);
                                    setSessionForm((p) => ({
                                      ...p,
                                      sessionDate: session.reviewDate
                                        ? new Date(session.reviewDate)
                                        : null,
                                    }));
                                    setIsEditDate(true);
                                  }}
                                >
                                  <CalendarIcon className="h-4 w-4" />
                                </Button>

                                {/* Edit */}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditReview(session)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>

                                {/* Delete */}
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="destructive">
                                      <Trash2 className="h-4 w-4" />
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
                                      <AlertDialogCancel>
                                        Cancel
                                      </AlertDialogCancel>
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
                              </>
                            )}
                          </div>
                        </td>
                        {/* <td className="p-2">
                          <div className="flex space-x-1">
                            {user?.role !== "physio" && (
                              <>
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
                                      <AlertDialogCancel>
                                        Cancel
                                      </AlertDialogCancel>
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
                              </>
                            )}
                          </div>
                        </td> */}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </CardHeader>
        <CardContent>
          <div className="md:hidden space-y-4">
            {filteredReviews.map((session) => (
              <Card
                key={session._id}
                className="p-4 shadow-lg rounded-2xl border"
              >
                {/* Top Section */}
                <div className="mb-2">
                  <p className="text-base font-bold">
                    {session.patientId?.patientName || "-"}
                  </p>

                  {user?.role !== "physio" && (
                    <p className="text-sm text-gray-500">
                      Physio:{" "}
                      <span className="font-medium">
                        {session.physioId?.physioName || "-"}
                      </span>
                    </p>
                  )}
                  <p className="text-base font-bold">
                    {session.reviewTypeId?.reviewTypeName || "-"}
                  </p>
                  <p className="text-base font-bold">
                    {session.reviewDate
                      ? session.reviewDate
                          .split("T")[0]
                          .split("-")
                          .reverse()
                          .join("-")
                      : "-"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {session.reviewStatusId && (
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
                        {session.reviewStatusId?.reviewStatusName}
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-gray-500 mt-4">
                    <div
                      className={`inline-block px-3 py-1 rounded-md text-sm font-medium
      ${
        session.reviewTypeId?.reviewTypeName === "General"
          ? "bg-blue-100 text-blue-800"
          : session.reviewTypeId?.reviewTypeName === "RedFlags"
            ? "bg-red-100 text-red-800"
            : "bg-gray-100 text-gray-700"
      }`}
                    >
                      {session.reviewTypeId?.reviewTypeName}
                    </div>

                    {session.reviewTypeId?.reviewTypeName === "RedFlags" &&
                      session.redFlags?.length > 0 && (
                        <div className="text-xs text-red-600 mt-1">
                          ({getRedFlagNames(session.redFlags).join(", ")})
                        </div>
                      )}
                  </p>
                </div>
                {/* Feedback */}
                <div className="text-xs mb-3">
                  {session.feedback ? (
                    <>
                      {session.feedback.sessionFeedbackPros && (
                        <p className="text-green-600">
                          ✓ {session.feedback.sessionFeedbackPros}
                        </p>
                      )}
                      {session.feedback.redFlags?.length > 0 && (
                        <p className="text-red-600">
                          ⚠ {session.feedback.redFlags.join(", ")}
                        </p>
                      )}
                      {session.feedback.media?.length > 0 && (
                        <p className="text-blue-600">
                          <Paperclip size={12} className="inline-block mr-1" />
                          {session.feedback.media.join(", ")}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-400">No feedback</p>
                  )}
                </div>
                {/* <td className="p-2"><span className={`px-2 py-1 rounded-full text-xs status-${session.status}`} style={{ backgroundColor: session.reviewStatusId ? session.reviewStatusId.reviewStatusColor : 'white', color: session.reviewStatusId ? session.reviewStatusId.reviewStatusTextColor : 'black' }}> {session.reviewStatusId ? session.reviewStatusId.reviewStatusName : ''}</span></td> */}

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  {session.reviewStatusId?.reviewStatusName?.toLowerCase() ===
                    "scheduled" && (
                    <Button
                      size="sm"
                      onClick={() =>
                        handleSessionAction(session._id, "Attended")
                      }
                    >
                      <Play size={12} />
                    </Button>
                  )}
                  {(session.reviewTypeId?.reviewTypeName?.toLowerCase() ===
                    "scheduled" ||
                    session.reviewTypeId?.reviewTypeName?.toLowerCase() ===
                      "attended") && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        handleSessionAction(session._id, "Canceled")
                      }
                    >
                      <XCircle size={12} />
                    </Button>
                  )}

                  {user?.role !== "Physio" && (
                    <>
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
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the session.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteSession(session._id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
      <Dialog
        open={feedbackDialog.open}
        onOpenChange={(open) => setFeedbackDialog({ open, sessionId: null })}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Add Session Feedback</DialogTitle>
            <DialogDescription>
              Provide feedback for the completed session.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-6">
            <div className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label htmlFor="sessionFeedbackPros ">
                  Positive Feedback (Pros)
                </Label>
                <textarea
                  id="sessionFeedbackPros "
                  className="w-full p-2 border rounded-md"
                  rows={2}
                  value={feedback.sessionFeedbackPros}
                  onChange={(e) =>
                    setFeedback({
                      ...feedback,
                      sessionFeedbackPros: e.target.value,
                    })
                  }
                  placeholder="What went well..."
                />
              </div>

              <div className="space-y-2">
                <Label>Mode of Exercise</Label>
                <RadioGroup
                  defaultValue="passive"
                  value={feedback.modeOfExercise}
                  onValueChange={(v) =>
                    setFeedback({ ...feedback, modeOfExercise: v })
                  }
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="active" id="ex-active" />
                    <Label htmlFor="ex-active">Active</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="passive" id="ex-passive" />
                    <Label htmlFor="ex-passive">Passive</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label>Red Flags</Label>
                <div className="p-3 border rounded-md grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {redFlags.map((flag) => (
                    <div key={flag._id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`rf-${flag._id}`}
                        onCheckedChange={(checked) => {
                          setFeedback((prev) => ({
                            ...prev,
                            redFlags: checked
                              ? [
                                  ...prev.redFlags,
                                  { redflagId: flag._id, isOccurred: true },
                                ]
                              : prev.redFlags.filter(
                                  (f) => f.redflagId !== flag._id,
                                ),
                          }));
                        }}
                      />
                      <Label
                        htmlFor={`rf-${flag._id}`}
                        className="text-sm font-normal"
                      >
                        {flag.redflagName}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Home Exercise Program Assigned</Label>
                <RadioGroup
                  value={feedback.homeExerciseAssigned}
                  onValueChange={(v) =>
                    setFeedback({ ...feedback, homeExerciseAssigned: v })
                  }
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="he-yes" />
                    <Label htmlFor="he-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="he-no" />
                    <Label htmlFor="he-no">No</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label>Modalities</Label>
                <RadioGroup
                  value={feedback.modalities}
                  onValueChange={(v) =>
                    setFeedback({ ...feedback, modalities: v })
                  }
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="mod-yes" />
                    <Label htmlFor="mod-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="mod-no" />
                    <Label htmlFor="mod-no">No</Label>
                  </div>
                </RadioGroup>
              </div>

              {feedback.modalities === "yes" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-2 pl-4"
                >
                  <Label>List of Modalities</Label>
                  <div className="p-3 border rounded-md grid grid-cols-3 gap-2">
                    {modalities.map((mod) => (
                      <div
                        key={mod._id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`mod-${mod._id}`}
                          onCheckedChange={(checked) => {
                            setFeedback((prev) =>
                              checked
                                ? {
                                    ...prev,
                                    modalitiesList: [
                                      ...prev.modalitiesList,
                                      { modalityId: mod._id, isOccurred: true },
                                    ],
                                  }
                                : {
                                    ...prev,
                                    modalitiesList: prev.modalitiesList.filter(
                                      (m) => m.modalityId !== mod._id,
                                    ),
                                  },
                            );
                          }}
                        />
                        <Label
                          htmlFor={`rf-${mod._id}`}
                          className="text-sm font-normal"
                        >
                          {mod.modalitiesName}
                        </Label>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
              <div className="space-y-2">
                <Label>Machine Used</Label>
                <Select
                  onValueChange={(v) =>
                    setFeedback((p) => ({ ...p, machineId: v }))
                  }
                  value={feedback.machineId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a machine" />
                  </SelectTrigger>
                  <SelectContent>
                    {machines.map((m) => (
                      <SelectItem key={m._id} value={m._id}>
                        {m.machineName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetArea">Targeted Area</Label>
                <Input
                  id="targetArea"
                  value={feedback.targetArea}
                  onChange={(e) =>
                    setFeedback({ ...feedback, targetArea: e.target.value })
                  }
                  placeholder="e.g., Lower back, right shoulder"
                />
              </div>

              {user?.role === "Physio" && (
                <div className="space-y-2">
                  <Label>Upload Image/Video</Label>
                  <Input
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFeedbackUpload}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current.click()}
                  >
                    <Upload size={16} className="mr-2" /> Attach Media
                  </Button>
                  <div className="mt-2 space-y-1">
                    {feedback.media.map((doc, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-sm text-gray-600"
                      >
                        <Paperclip size={14} /> {doc}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setFeedbackDialog({ open: false, sessionId: null })
                  }
                >
                  Cancel
                </Button>
                <Button onClick={handleFeedbackSubmit}>Submit Feedback</Button>
              </DialogFooter>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={isEditDate} onOpenChange={setIsEditDate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Review Date</DialogTitle>
            <DialogDescription>
              Select a new date and submit to update.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Date Picker */}
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
                      <span>Select date</span>
                    )}
                  </Button>
                </PopoverTrigger>

                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={sessionForm.sessionDate}
                    onSelect={(date) =>
                      setSessionForm((p) => ({ ...p, sessionDate: date }))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Buttons */}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDate(false)}>
                Cancel
              </Button>
              <Button onClick={() => handlePostponed(editingReview)}>
                Update Date
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
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
                    <SelectItem value="" disabled>
                      Loading patients...
                    </SelectItem>
                  ) : (
                    patients.map((p) => (
                      <SelectItem key={p._id || p.id} value={p._id || p.id}>
                        {p.patientName || p.name}
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
                    type="button"
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

                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
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
            {/* <div className="space-y-2"><Label htmlFor="sessionDay">Session Day</Label><Input id="sessionDay" disabled type="text" value={sessionForm.sessionDay} onChange={(e) => setSessionForm(p => ({ ...p, sessionDay: e.target.value }))} /></div> */}
            {/* <div className="space-y-2"><Label htmlFor="sessionTime">Session Time</Label><Input id="sessionTime" type="time" value={sessionForm.sessionTime} onChange={(e) => setSessionForm(p => ({ ...p, sessionTime: e.target.value }))} /></div> */}
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
            </div>{" "}
            <div>
              <Label className="font-semibold">Current Goal</Label>
              <p className="text-sm text-gray-700 p-2 bg-gray-100 rounded-md mt-1">
                {selectedPatientObj?.shortTermGoals ||
                  selectedPatientObj?.patientId?.shortTermGoals ||
                  "No current goal set."}
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
                  <SelectValue placeholder="Select a review Status Type" />
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
export default ReviewMasterForm;
