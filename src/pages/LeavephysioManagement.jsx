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

  const getLeave = async () => {
    try {
      const response = await apiRequest("LeaveControllers/getAllLeave", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const rows = Array.isArray(response?.Leaves) ? response.Leaves : [];
      const normalized = rows.map((leave) => ({
        ...leave,
        LeaveDate: leave.LeaveDate || leave.Date,
        PaidLeave: leave.PaidLeave === true || leave.PaidLeave === "true",
      }));

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
      const res = await apiRequest("LeaveControllers/updateLeavePaidStatus", {
        method: "POST",
        body: JSON.stringify({ _id: leaveId, PaidLeave: nextValue }),
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
    <div className="space-y-6 overflow-x-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4"
      >
        <div className="min-w-0">
          <h1 className="text-xl sm:text-3xl font-bold text-gray-800 leading-tight">
            Leave Management
          </h1>

          <p className="mt-1 text-xs sm:text-sm text-gray-600 leading-snug break-words">
            Manage physiotherapist leave and reassign patients to available
            physiotherapists.
          </p>
        </div>
      </motion.div>

      <Card className="medical-card">
        <CardHeader className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <div className="flex flex-col">
            <CardTitle>Manage Physio Leave & Reassign Patients</CardTitle>
            <CardDescription>
              Select a physiotherapist and date to manage leave.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
            <User className="h-5 w-5 text-gray-500" />
            <Select
              onValueChange={(v) =>
                setAssignForm((p) => ({ ...p, physioId: v }))
              }
              value={assignForm.physioId || ""}
            >
              <SelectTrigger className="w-full sm:w-60">
                <SelectValue placeholder="Select Leave physiotherapist" />
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

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Calendar className="h-5 w-5 text-gray-500" />
            <Input
              type="date"
              value={normalizedDateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full sm:w-48"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select
              onValueChange={(v) =>
                setAssignForm((p) => ({ ...p, LeaveMode: v }))
              }
              value={assignForm.LeaveMode || ""}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Select Leave Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Half Day">Half Day</SelectItem>
                <SelectItem value="Full Day">Full Day</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button className="w-full sm:w-auto" onClick={handleLeave}>
            Mark as Leave
          </Button>
        </CardContent>
      </Card>

      {isTodaySelected && assignForm.physioId && (
        <Card className="medical-card">
          <CardHeader>
            <CardTitle>Today Sessions</CardTitle>
            <CardDescription>
              After leave is marked, today sessions are auto-cancelled. Select
              patient, time and new physio below, then save session to change it
              back to Scheduled.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {leavePhysioSessions.length === 0 ? (
              <p className="text-sm text-gray-500">
                No sessions found for selected physio today.
              </p>
            ) : (
              <div className="space-y-3">
                {leavePhysioSessions.map((session) => (
                  <div
                    key={session._id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border rounded-lg p-3"
                  >
                    <div>
                      <p className="font-medium text-gray-800">
                        {session.patientId?.patientName || "Unknown Patient"}
                      </p>
                      <p className="text-sm text-gray-500">
                        Time: {session.sessionTime || "-"}
                      </p>
                      <p className="text-sm text-gray-500">
                        Status:{" "}
                        {session.sessionStatusId?.sessionStatusName ||
                          session.sessionStatusName ||
                          "-"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="medical-card">
        <CardHeader className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <div className="flex flex-col">
            <CardTitle>Reassign Patients to the Physios</CardTitle>
            <CardDescription>
              Select a patient, set time, and choose new physio.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="grid grid-cols-1 sm:flex sm:items-center gap-2 w-full sm:w-auto">
            <User className="h-5 w-5 text-gray-500" />

            <Select
              value={selectedPatientId}
              onValueChange={setSelectedPatientId}
            >
              <SelectTrigger className="w-full sm:w-56">
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

            <Input
              type="time"
              className="w-full sm:w-36"
              disabled={!selectedPatientId}
              value={
                leaveSessionPlan.find((x) => x.patientId === selectedPatientId)
                  ?.sessionTime || "09:00"
              }
              onChange={(e) =>
                upsertPlan(selectedPatientId, { sessionTime: e.target.value })
              }
            />

            <Select
              disabled={!selectedPatientId}
              value={
                leaveSessionPlan.find((x) => x.patientId === selectedPatientId)
                  ?.Re_Assign || ""
              }
              onValueChange={(v) =>
                upsertPlan(selectedPatientId, { Re_Assign: v })
              }
            >
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue placeholder="Reassign Physio" />
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

            <Button onClick={handleSaveSession}>
              {isTodaySelected ? "Save Session" : "Save Reassign Plan"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="medical-card">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Leave History</CardTitle>
              <CardDescription>Recent physiotherapist leaves.</CardDescription>
            </div>

            {/* FILTER BAR */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <Select
                  value={historyPhysioFilter}
                  onValueChange={setHistoryPhysioFilter}
                >
                  <SelectTrigger className="w-[180px] h-9">
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
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <Input
                  type="date"
                  className="w-[160px] h-9"
                  value={historyDateFilter}
                  onChange={(e) => setHistoryDateFilter(e.target.value)}
                />
                {historyDateFilter && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => setHistoryDateFilter("")}
                  >
                    Clear
                  </Button>
                )}
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={getLeave}
                className="h-9"
              >
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="w-10"></th>
                  <th className="text-left p-3 font-semibold text-gray-600">
                    Physio
                  </th>
                  <th className="text-left p-3 font-semibold text-gray-600">
                    Leave Date
                  </th>
                  <th className="text-left p-3 font-semibold text-gray-600">
                    Leave Mode
                  </th>
                  <th className="text-left p-3 font-semibold text-gray-600">
                    Sessions
                  </th>
                  <th className="text-left p-3 font-semibold text-gray-600">
                    Paid / Unpaid Leave
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredLeaveData.length > 0 ? (
                  filteredLeaveData.map((leave) => {
                    const isOpen = openRowId === leave._id;
                    const rowSessions = leave.SessionGenerateForLeave || [];

                    return (
                      <React.Fragment key={leave._id}>
                        <tr
                          className="border-b hover:bg-gray-50 cursor-pointer"
                          onClick={() =>
                            setOpenRowId(isOpen ? null : leave._id)
                          }
                        >
                          <td className="p-3 text-gray-600">
                            {isOpen ? (
                              <ChevronDown size={16} />
                            ) : (
                              <ChevronRight size={16} />
                            )}
                          </td>
                          <td className="p-3 font-medium text-gray-800">
                            {leave.physioId?.physioName || "N/A"}
                          </td>
                          <td className="p-3 text-gray-700">
                            {leave.LeaveDate
                              ? new Date(leave.LeaveDate).toLocaleDateString()
                              : "N/A"}
                          </td>
                          <td className="p-3 text-gray-700">
                            {leave.LeaveMode || "N/A"}
                          </td>
                          <td className="p-3 text-gray-700">
                            {rowSessions.length}
                          </td>
                          <td className="p-3">
                            <Button
                              size="sm"
                              variant={leave.PaidLeave ? "outline" : "default"}
                              onClick={(e) => {
                                e.stopPropagation();
                                openPaidConfirm(leave);
                              }}
                            >
                              {leave.PaidLeave
                                ? "Mark as UnPaid"
                                : "Mark as Paid"}
                            </Button>
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      No records found matching the filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog
        open={paidConfirm.open}
        onOpenChange={(open) => setPaidConfirm((prev) => ({ ...prev, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Leave Status Update</AlertDialogTitle>
            <AlertDialogDescription>
              {paidConfirm.message}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
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
