import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/components/CustomComponents/apiRequest";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChevronRight, ChevronDown, Calendar, User } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const LeavephysioManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [leaveData, setLeaveData] = useState([]);
  const [leavePhysioSessions, setLeavePhysioSessions] = useState([]);
  const [historyPhysioFilter, setHistoryPhysioFilter] = useState("all");
  const [historyDateFilter, setHistoryDateFilter] = useState("");
  const [dateFilter, setDateFilter] = useState(
    new Date().toISOString().split("T")[0],
  );
  const formatDateYMD = (date) => {
    if (!date) return "";
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return "";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const { user } = useAuth();

  const [assignForm, setAssignForm] = useState({
    physioId: "",
    newPhysioId: "",
    LeaveMode: "",
  });
  const filteredLeaveData = leaveData.filter((leave) => {
    // Filter by Physio
    const matchesPhysio =
      historyPhysioFilter === "all" ||
      leave.physioId?._id?.toString() === historyPhysioFilter;

    // Filter by Date (YYYY-MM-DD)
    const leaveDateStr = leave.LeaveDate ? formatDateYMD(leave.LeaveDate) : "";
    const matchesDate =
      !historyDateFilter || leaveDateStr === historyDateFilter;

    return matchesPhysio && matchesDate;
  });
  const [leaveSessionPlan, setLeaveSessionPlan] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [openRowId, setOpenRowId] = useState(null);

  const [paidConfirm, setPaidConfirm] = useState({
    open: false,
    leaveId: null,
    nextValue: false,
    message: "",
  });

  const getTodayString = () => formatDateYMD(new Date());

  const normalizeInputDate = (value) => {
    if (!value) return "";

    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

    if (/^\d{2}-\d{2}-\d{4}$/.test(value)) {
      const [dd, mm, yyyy] = value.split("-");
      return `${yyyy}-${mm}-${dd}`;
    }

    return formatDateYMD(value);
  };

  const normalizedDateFilter = normalizeInputDate(dateFilter);
  const isTodaySelected = normalizedDateFilter === getTodayString();

  const closePaidConfirm = () => {
    setPaidConfirm({
      open: false,
      leaveId: null,
      nextValue: false,
      message: "",
    });
  };

  const openPaidConfirm = (leave) => {
    const nextValue = !leave.PaidLeave;

    setPaidConfirm({
      open: true,
      leaveId: leave._id,
      nextValue,
      message: nextValue
        ? "Are you sure you want to mark this as PAID leave?"
        : "Are you sure you want to mark this as UNPAID leave?",
    });
  };

  const getPhysio = async () => {
    try {
      const response = await apiRequest("Physio/getAllPhysio", {
        method: "POST",
        body: JSON.stringify({ type: "master" }),
      });

      const physios = Array.isArray(response?.physios) ? response.physios : [];
      setEmployees(physios.filter((p) => p.isActive !== false));
    } catch (error) {
      console.error("Error loading physios:", error);
      setEmployees([]);
    }
  };
  const [historyFromDate, setHistoryFromDate] = useState("");
  const [historyToDate, setHistoryToDate] = useState("");
  useEffect(() => {
    // Only call getLeave if any filter has a value
    if (historyPhysioFilter || historyFromDate || historyToDate) {
      getLeave();
    }
  }, [historyPhysioFilter, historyFromDate, historyToDate]);
  const refreshHistory = () => {
    setHistoryPhysioFilter("all");
    setHistoryFromDate("");
    setHistoryToDate("");
    getLeave();
  };
  const getLeave = async () => {
    try {
      // Prepare payload
      const payload = {
        physioId:
          historyPhysioFilter !== "all" ? historyPhysioFilter : undefined,
        fromDate: historyFromDate || undefined,
        toDate: historyToDate || undefined,
      };

      const response = await apiRequest("LeaveControllers/getAllLeave", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      // Normalize the leave data
      const rows = Array.isArray(response?.Leaves) ? response.Leaves : [];
      const normalized = rows
        .map((leave) => ({
          ...leave,
          LeaveDate: leave.LeaveDate || leave.Date,
          PaidLeave: leave.PaidLeave === true || leave.PaidLeave === "true",
        }))
        // Filter by date range on the frontend as a safety
        .filter((leave) => {
          const leaveDate = new Date(leave.LeaveDate);
          const from = historyFromDate ? new Date(historyFromDate) : null;
          const to = historyToDate ? new Date(historyToDate) : null;

          if (from && leaveDate < from) return false;
          if (to && leaveDate > to) return false;
          return true;
        });

      setLeaveData(normalized);
    } catch (error) {
      console.error("Error loading leave data:", error);
      setLeaveData([]);
    }
  };
  const getSession = async () => {
    try {
      const response = await apiRequest("Session/getAllSession", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const allSessions = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.sessions)
          ? response.sessions
          : Array.isArray(response)
            ? response
            : [];

      setSessions(allSessions);

      if (!assignForm.physioId || !normalizedDateFilter) {
        setLeavePhysioSessions([]);
        return;
      }

      const filtered = allSessions.filter((session) => {
        const physioId =
          typeof session.physioId === "object"
            ? session.physioId?._id
            : session.physioId;

        const sessionDate = session.sessionDate
          ? formatDateYMD(session.sessionDate)
          : "";

        return (
          physioId?.toString() === assignForm.physioId?.toString() &&
          sessionDate === normalizedDateFilter
        );
      });

      setLeavePhysioSessions(filtered);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      setSessions([]);
      setLeavePhysioSessions([]);
    }
  };

  const handleLeave = async () => {
    if (
      !assignForm.physioId ||
      !normalizedDateFilter ||
      !assignForm.LeaveMode
    ) {
      toast({
        title: "Error",
        description: "Please select physiotherapist, date, and leave type.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await apiRequest("LeaveControllers/markLeave", {
        method: "POST",
        body: JSON.stringify({
          physioId: assignForm.physioId,
          LeaveDate: normalizedDateFilter,
          LeaveMode: assignForm.LeaveMode,
          createdBy: user?.physioName || "null",
        }),
      });

      if (!response?.success) {
        toast({
          title: "Error",
          description: response?.message || "Failed to mark leave.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: response?.message || "Leave marked successfully.",
      });

      await getLeave();
      await getSession();
    } catch (error) {
      console.error("Error marking leave:", error);
      toast({
        title: "Error",
        description: "Failed to mark leave.",
        variant: "destructive",
      });
    }
  };

  const updatePaidLeave = async (leaveId, nextValue) => {
    try {
      const res = await apiRequest("LeaveControllers/updateLeavePaid", {
        method: "POST",
        body: JSON.stringify({
          _id: leaveId,
          PaidLeave: nextValue,
          updatedBy: user?.physioName || "null",
        }),
      });

      if (res?.success) {
        toast({
          title: "Success",
          description: res?.message || "Updated successfully.",
        });

        setLeaveData((prev) =>
          prev.map((l) =>
            l._id === leaveId ? { ...l, PaidLeave: nextValue } : l,
          ),
        );
      } else {
        toast({
          title: "Error",
          description: res?.message || "Update failed.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: err?.message || "Update failed.",
        variant: "destructive",
      });
    }
  };

  const confirmPaidToggle = async () => {
    if (!paidConfirm.leaveId) return;
    await updatePaidLeave(paidConfirm.leaveId, paidConfirm.nextValue);
    closePaidConfirm();
  };

  useEffect(() => {
    if (!leavePhysioSessions.length) {
      setPatients([]);
      setLeaveSessionPlan([]);
      return;
    }

    const uniquePatients = [];
    const seen = new Set();

    leavePhysioSessions.forEach((session) => {
      const patient = session.patientId;
      if (patient?._id && !seen.has(patient._id)) {
        seen.add(patient._id);
        uniquePatients.push(patient);
      }
    });

    setPatients(uniquePatients);

    setLeaveSessionPlan((prev) => {
      const prevMap = new Map(prev.map((x) => [x.patientId, x]));

      return uniquePatients.map((p) => ({
        patientId: p._id,
        sessionTime: prevMap.get(p._id)?.sessionTime || "09:00",
        Re_Assign: prevMap.get(p._id)?.Re_Assign || "",
      }));
    });
  }, [leavePhysioSessions]);

  const upsertPlan = (patientId, patch) => {
    setLeaveSessionPlan((prev) => {
      const index = prev.findIndex((x) => x.patientId === patientId);

      if (index !== -1) {
        const updated = [...prev];
        updated[index] = { ...updated[index], ...patch };
        return updated;
      }

      return [
        ...prev,
        {
          patientId,
          sessionTime: "09:00",
          Re_Assign: "",
          ...patch,
        },
      ];
    });
  };

  const handleSaveSession = async () => {
    if (!assignForm.physioId || !normalizedDateFilter) {
      toast({
        title: "Error",
        description: "Please select physio and date first.",
        variant: "destructive",
      });
      return;
    }

    const validPlans = leaveSessionPlan.filter(
      (item) => item.patientId && item.Re_Assign && item.sessionTime,
    );

    if (!validPlans.length) {
      toast({
        title: "Error",
        description: "Please select patient, time and physio.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isTodaySelected) {
        const results = await Promise.all(
          validPlans.map((item) =>
            apiRequest("Session/reassignTodayCancelledSession", {
              method: "POST",
              body: JSON.stringify({
                patientId: item.patientId,
                oldPhysioId: assignForm.physioId,
                newPhysioId: item.Re_Assign,
                sessionDate: normalizedDateFilter,
                sessionTime: item.sessionTime,
                updatedBy: user?.physioName || "null",
              }),
            }),
          ),
        );

        const failed = results.filter((r) => !r?.success);

        if (failed.length > 0) {
          toast({
            title: "Partial Error",
            description: "Some sessions failed to update.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Success",
            description: "Selected session(s) changed to Scheduled.",
          });
        }

        setSelectedPatientId("");
        await getSession();
        await getLeave();
        return;
      }

      const response = await apiRequest("LeaveControllers/saveLeavePlan", {
        method: "POST",
        body: JSON.stringify({
          physioId: assignForm.physioId,
          LeaveDate: normalizedDateFilter,
          LeaveMode: assignForm.LeaveMode || "Full Day",
          SessionGenerateForLeave: validPlans,
          updatedBy: user?.physioName || "null",
        }),
      });

      if (response?.success) {
        toast({
          title: "Success",
          description: "Future reassignment plan saved successfully.",
        });
        setSelectedPatientId("");
        await getLeave();
      } else {
        toast({
          title: "Error",
          description: response?.message || "Failed to save leave plan.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("handleSaveSession error:", error);
      toast({
        title: "Error",
        description: "Failed to save session.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    getPhysio();
    getLeave();
  }, []);

  useEffect(() => {
    if (assignForm.physioId && normalizedDateFilter) {
      getSession();
    } else {
      setLeavePhysioSessions([]);
      setPatients([]);
      setLeaveSessionPlan([]);
    }
  }, [assignForm.physioId, normalizedDateFilter]);

  return (
    <div className="space-y-6 px-2 sm:px-4 pb-8 overflow-x-hidden">
      {/* PAGE HEADER */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col gap-2 pt-4"
      >
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 tracking-tight">
            Leave Management
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage physiotherapist leave and reassign patients to available
            providers.
          </p>
        </div>
      </motion.div>

      {/* MANAGE LEAVE CARD */}
      <Card className="medical-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">
            Manage Physio Leave
          </CardTitle>
          <CardDescription>
            Select a physiotherapist and date to manage leave.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 flex items-center gap-2">
                <User className="h-4 w-4" /> Physiotherapist
              </label>
              <Select
                onValueChange={(v) =>
                  setAssignForm((p) => ({ ...p, physioId: v }))
                }
                value={assignForm.physioId || ""}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Physio" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((p) => (
                    <SelectItem key={p._id} value={p._id.toString()}>
                      {p.physioName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Leave Date
              </label>
              <Input
                type="date"
                value={normalizedDateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 uppercase">
                Leave Type
              </label>
              <Select
                onValueChange={(v) =>
                  setAssignForm((p) => ({ ...p, LeaveMode: v }))
                }
                value={assignForm.LeaveMode || ""}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="First Half Day">First Half Day</SelectItem>
                  <SelectItem value="Second Half Day">
                    Second Half Day
                  </SelectItem>
                  <SelectItem value="Full Day">Full Day</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full" onClick={handleLeave}>
              Mark as Leave
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* TODAY SESSIONS */}
      {isTodaySelected && assignForm.physioId && (
        <Card className="medical-card border-amber-200 bg-amber-50/30">
          <CardHeader>
            <CardTitle className="text-base text-amber-800">
              Today Sessions
            </CardTitle>
            <CardDescription className="text-amber-700/80">
              Sessions are auto-cancelled. Reassign below to reschedule.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {leavePhysioSessions.length === 0 ? (
              <p className="text-sm text-gray-500 italic">
                No sessions found for today.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {leavePhysioSessions.map((session) => (
                  <div
                    key={session._id}
                    className="bg-white border rounded-lg p-3 shadow-sm"
                  >
                    <p className="font-bold text-gray-800">
                      {session.patientId?.patientName || "Unknown"}
                    </p>
                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                      <span>Time: {session.sessionTime || "-"}</span>
                      <span className="font-medium text-blue-600">
                        {session.sessionStatusId?.sessionStatusName ||
                          session.sessionStatusName ||
                          "-"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* REASSIGNMENT CARD */}
      <Card className="medical-card">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">
            Reassign Patients
          </CardTitle>
          <CardDescription>
            Select patient, set time, and choose a new physio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500">
                Patient
              </label>
              <Select
                value={selectedPatientId}
                onValueChange={setSelectedPatientId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((p) => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.patientName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500">
                New Time
              </label>
              <Input
                type="time"
                className="w-full"
                disabled={!selectedPatientId}
                value={
                  leaveSessionPlan.find(
                    (x) => x.patientId === selectedPatientId,
                  )?.sessionTime || "09:00"
                }
                onChange={(e) =>
                  upsertPlan(selectedPatientId, { sessionTime: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500">
                New Physio
              </label>
              <Select
                disabled={!selectedPatientId}
                value={
                  leaveSessionPlan.find(
                    (x) => x.patientId === selectedPatientId,
                  )?.Re_Assign || ""
                }
                onValueChange={(v) =>
                  upsertPlan(selectedPatientId, { Re_Assign: v })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Substitute" />
                </SelectTrigger>
                <SelectContent>
                  {employees
                    .filter((emp) => emp._id !== assignForm.physioId)
                    .map((p) => (
                      <SelectItem key={p._id} value={p._id}>
                        {p.physioName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleSaveSession}
              variant="secondary"
              className="w-full"
            >
              {isTodaySelected ? "Save Session" : "Save Reassign Plan"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* LEAVE HISTORY */}
      <Card className="medical-card">
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <CardTitle>Leave History</CardTitle>
              <CardDescription>
                Recent physiotherapist leaves and reassignment details.
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Physio Filter */}
              <Select
                value={historyPhysioFilter}
                onValueChange={setHistoryPhysioFilter}
              >
                <SelectTrigger className="w-full sm:w-[180px] h-9">
                  <SelectValue placeholder="All Physios" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Physios</SelectItem>
                  {employees.map((p) => (
                    <SelectItem key={p._id} value={p._id.toString()}>
                      {p.physioName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                className="w-full sm:w-[160px] h-9"
                value={historyFromDate}
                onChange={(e) => setHistoryFromDate(e.target.value)}
                placeholder="From"
              />

              <Input
                type="date"
                className="w-full sm:w-[160px] h-9"
                value={historyToDate}
                onChange={(e) => setHistoryToDate(e.target.value)}
                placeholder="To"
              />
              {/* Refresh Button */}
              <Button
                size="sm"
                variant="outline"
                onClick={refreshHistory}
                className="h-9 w-full sm:w-auto"
              >
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* DESKTOP VIEW */}
          <div className="hidden md:block overflow-x-auto rounded-lg border">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="w-10 p-3"></th>
                  <th className="p-3 font-semibold text-gray-600">Physio</th>
                  <th className="p-3 font-semibold text-gray-600">Date</th>
                  <th className="p-3 font-semibold text-gray-600">Mode</th>
                  <th className="p-3 font-semibold text-gray-600 text-center">
                    Sessions
                  </th>
                  <th className="p-3 font-semibold text-gray-600 text-right">
                    Payroll
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLeaveData.length > 0 ? (
                  filteredLeaveData.map((leave) => {
                    const isOpen = openRowId === leave._id;
                    const sessions = leave.SessionGenerateForLeave || [];

                    return (
                      <React.Fragment key={leave._id}>
                        <tr
                          className={`border-b hover:bg-gray-50 cursor-pointer transition-colors ${isOpen ? "bg-blue-50/30" : ""}`}
                          onClick={() =>
                            setOpenRowId(isOpen ? null : leave._id)
                          }
                        >
                          <td className="p-3 text-gray-400">
                            {isOpen ? (
                              <ChevronDown
                                size={18}
                                className="text-blue-600"
                              />
                            ) : (
                              <ChevronRight size={18} />
                            )}
                          </td>
                          <td className="p-3 font-medium">
                            {leave.physioId?.physioName || "N/A"}
                          </td>
                          <td className="p-3 text-gray-600">
                            {leave.LeaveDate
                              ? new Date(leave.LeaveDate).toLocaleDateString()
                              : "N/A"}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white border uppercase">
                              {leave.LeaveMode}
                            </span>
                          </td>
                          <td className="p-3 text-center">{sessions.length}</td>
                          <td className="p-3 text-right">
                            <Button
                              size="sm"
                              variant={leave.PaidLeave ? "outline" : "default"}
                              onClick={(e) => {
                                e.stopPropagation();
                                openPaidConfirm(leave);
                              }}
                            >
                              {leave.PaidLeave ? "Unpaid" : "Paid"}
                            </Button>
                          </td>
                        </tr>
                        {/* EXPANDED SECTION FOR REASSIGNED PATIENTS */}
                        {isOpen && (
                          <tr>
                            <td
                              colSpan={6}
                              className="bg-blue-50/20 p-4 border-b"
                            >
                              <div className="pl-8 space-y-2">
                                <h5 className="text-xs font-bold text-blue-800 uppercase tracking-wider">
                                  Reassigned Patient Details
                                </h5>
                                {sessions.length > 0 ? (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {sessions.map((s, idx) => (
                                      <div
                                        key={idx}
                                        className="bg-white border border-blue-100 p-2 rounded shadow-sm text-xs"
                                      >
                                        <p className="font-bold text-gray-800">
                                          {s.patientId?.patientName ||
                                            "Unknown"}
                                        </p>
                                        <p className="text-gray-500">
                                          Time: {s.sessionTime}
                                        </p>
                                        <p className="text-blue-600 font-medium">
                                          Reassigned To:{" "}
                                          {s.Re_Assign?.physioName || "TBD"}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-gray-500 italic">
                                    No reassigned sessions recorded for this
                                    leave.
                                  </p>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      No records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* MOBILE VIEW */}
          <div className="md:hidden flex flex-col gap-4">
            {filteredLeaveData.map((leave) => {
              const isOpen = openRowId === leave._id;
              const sessions = leave.SessionGenerateForLeave || [];

              return (
                <div
                  key={leave._id}
                  className="border rounded-lg bg-white shadow-sm overflow-hidden"
                >
                  <div
                    className={`p-4 flex justify-between items-start cursor-pointer ${isOpen ? "bg-blue-50/50" : ""}`}
                    onClick={() => setOpenRowId(isOpen ? null : leave._id)}
                  >
                    <div>
                      <h4 className="font-bold text-gray-900">
                        {leave.physioId?.physioName || "N/A"}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {leave.LeaveDate
                          ? new Date(leave.LeaveDate).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-1 rounded font-bold uppercase">
                        {leave.LeaveMode}
                      </span>
                      {isOpen ? (
                        <ChevronDown size={16} className="text-blue-600" />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </div>
                  </div>

                  {isOpen && (
                    <div className="px-4 pb-4 space-y-3 bg-blue-50/20 border-t pt-3">
                      <p className="text-[10px] font-bold text-blue-800 uppercase">
                        Reassignments ({sessions.length})
                      </p>
                      {sessions.map((s, idx) => (
                        <div
                          key={idx}
                          className="bg-white p-2 rounded border border-blue-100 text-xs"
                        >
                          <div className="flex justify-between font-bold">
                            <span>{s.patientId?.patientName}</span>
                            <span>{s.sessionTime}</span>
                          </div>
                          <p className="text-blue-600 mt-1">
                            To: {s.Re_Assign?.physioName || "TBD"}
                          </p>
                        </div>
                      ))}
                      <div className="pt-2 flex justify-end">
                        <Button
                          size="sm"
                          variant={leave.PaidLeave ? "outline" : "default"}
                          onClick={() => openPaidConfirm(leave)}
                        >
                          {leave.PaidLeave ? "Mark Unpaid" : "Mark Paid"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* DIALOGS */}
      <AlertDialog
        open={paidConfirm.open}
        onOpenChange={(open) => setPaidConfirm((prev) => ({ ...prev, open }))}
      >
        <AlertDialogContent className="w-[90vw] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Update</AlertDialogTitle>
            <AlertDialogDescription>
              {paidConfirm.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel onClick={closePaidConfirm}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmPaidToggle}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LeavephysioManagement;
