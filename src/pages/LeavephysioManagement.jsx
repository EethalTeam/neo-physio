import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChevronRight, ChevronDown } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-dropdown-menu";

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
} from "@/components/ui/alert-dialog";
import {
  FileSpreadsheet,
  Calendar,
  Download,
  Printer,
  User,
  XCircle,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const LeavephysioManagement = () => {
  const [selectedPhysio, setSelectedPhysio] = useState("");
  const [employees, setEmployees] = useState([]);
  const [sessions, setSessions] = useState([]);
  const physio = [];
  const [dateFilter, setDateFilter] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [assignForm, setAssignForm] = useState({
    physioId: "",
    newPhysioId: "",
    LeaveMode: "",
  });
  const [leaveSessionPlan, setLeaveSessionPlan] = useState([]);

  useEffect(() => {
    let filtered = [...sessions];

    const term = searchTerm.toLowerCase();

    // Filter by patient name
    if (searchTerm) {
      filtered = filtered.filter((s) =>
        s.physioId?.physioName?.toLowerCase().includes(term),
      );
    }

    // Filter by date
    const filterDate = dateFilter || new Date().toISOString().slice(0, 10);
    filtered = filtered.filter(
      (s) => s.sessionDate?.slice(0, 10) === filterDate,
    );

    setFilteredSessions(filtered);
  }, [sessions, searchTerm, dateFilter]);
  const [patients, setPatients] = useState([]);
  const [openRowId, setOpenRowId] = useState(null);
  const [paidConfirm, setPaidConfirm] = useState({
    open: false,
    leaveId: null,
    nextValue: false,
    message: "",
  });

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

  const confirmPaidToggle = async () => {
    if (!paidConfirm.leaveId) return;

    await updatePaidLeave(paidConfirm.leaveId, paidConfirm.nextValue);

    setPaidConfirm({
      open: false,
      leaveId: null,
      nextValue: false,
      message: "",
    });
  };
  useEffect(() => {
    getPhysio();
    getSessionStatus();
    getLeave();
  }, []);

  const getPhysio = async () => {
    try {
      const response = await apiRequest("Physio/getAllPhysio", {
        method: "POST",
        body: JSON.stringify({ type: "master" }),
      });

      const physios = response.physios || [];

      // Only active physios
      setEmployees(physios.filter((p) => p.isActive !== false));
    } catch (error) {
      console.error("Error loading physios:", error);
      setEmployees([]);
    }
  };
  // const getSessions = async () => {
  //   try {
  //     const response = await apiRequest("Session/getAllSession", {
  //       method: "POST",
  //       body: JSON.stringify({}),
  //     });

  //     if (Array.isArray(response)) {
  //       setSessions(response);
  //     } else {
  //       setSessions([]);
  //     }
  //   } catch (error) {
  //     console.error("Error loading sessions:", error);
  //     setSessions([]);
  //   }
  // };
  const [leaveData, setLeaveData] = useState([]);
  const [showModal, setShowModal] = useState(false); // controls popup visibility

  const getLeave = async () => {
    try {
      const response = await apiRequest("LeaveControllers/getAllLeave", {
        method: "POST",
        body: JSON.stringify({}),
      });

      // console.log(response, "response Leave");

      if (response?.Leaves && Array.isArray(response.Leaves)) {
        const normal = response.Leaves.map((leave) => ({
          ...leave,
          LeaveDate: leave.LeaveDate || leave.Date,
          PaidLeave:
            leave.PaidLeave === true || leave.PaidLeave === "true"
              ? true
              : false,
        }));
        setLeaveData(normal);

        // console.log(normal, "normal LeaveData");
      } else {
        setLeaveData([]);
        // console.log([], "No leave data found");
      }

      setShowModal(true);
    } catch (error) {
      console.error("Error loading leave data:", error);
      setLeaveData([]);
      setShowModal(false);
    }
  };

  const selectedDate = dateFilter || new Date().toISOString().slice(0, 10);

  const [leavePhysioSessions, setLeavePhysioSessions] = useState([]);
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];

    const filtered =
      assignForm.physioId && dateFilter
        ? sessions.filter((s) => {
            const physioId =
              typeof s.physioId === "object" ? s.physioId?._id : s.physioId;

            const sessionDateOnly = (s.sessionDate || "").split("T")[0];
            const statusName = (
              s.sessionStatusId?.sessionStatusName || ""
            ).toLowerCase();

            const isSameDate = sessionDateOnly === dateFilter;
            const isFutureOrToday = dateFilter >= today;
            const isScheduled = statusName === "scheduled";

            return (
              physioId === assignForm.physioId &&
              isSameDate &&
              isFutureOrToday &&
              isScheduled
            );
          })
        : [];

    setLeavePhysioSessions(filtered);
  }, [assignForm.physioId, dateFilter, sessions]);
  useEffect(() => {
    if (!assignForm.physioId || !dateFilter) return;

    getAllPatient(assignForm.physioId, dateFilter);
  }, [assignForm.physioId, dateFilter]);

  // useEffect(() => {
  //   const filtered =
  //     assignForm.physioId && dateFilter
  //       ? sessions.filter((s) => {
  //           // protect against null physioId
  //           const physioId =
  //             s.physioId && typeof s.physioId === "object"
  //               ? s.physioId._id
  //               : s.physioId;
  //           // extract YYYY-MM-DD from ISO date
  //           const sessionDateOnly = s.sessionDate?.split("T")[0];
  //           return (
  //             physioId === assignForm.physioId && sessionDateOnly === dateFilter
  //           );
  //         })
  //       : [];
  //   setLeavePhysioSessions(filtered);
  // }, [assignForm.physioId, dateFilter, sessions]);
  const getAllPatient = async () => {
    try {
      const res = await apiRequest("Patient/getAllPatientsByPhysioAndDate", {
        method: "POST",
        body: JSON.stringify({
          physioId: assignForm.physioId,
          targetDate: selectedDate,
        }),
      });

      const list = Array.isArray(res) ? res : res?.patients || [];
      setPatients(list);
    } catch (error) {
      console.error("Error:", error);
      setPatients([]);
    }
  };

  const assignedPatients = patients.filter((p) => {
    const pid =
      p.physioId && typeof p.physioId === "object"
        ? p.physioId._id
        : p.physioId;

    return pid === assignForm.physioId;
  });

  // const AssignPhysio = async (data) => {
  //   try {
  //     const response = await apiRequest("Patient/sessionassignphysio", {
  //       method: "POST",
  //       body: JSON.stringify(data),
  //     });
  //     console.log("AssignPhysio Response:", response);
  //     toast({ title: "Success", description: "Assign updated successfully." });
  //     //   getAllPatient();

  //     return response;
  //   } catch (error) {
  //     console.error("Error:", error);
  //     throw error;
  //   }
  // };
  // const handleAssignPhysio = async (physioId, physioName, sessionCode) => {
  //   if (!physioId || !physioName) return;

  //   const data = {
  //     sessionCode,
  //     newPhysioId: physioId,
  //     newPhysioName: physioName,
  //   };

  //   try {
  //     const res = await AssignPhysio(data);

  //     toast({ title: "Success", description: "Physio assigned successfully." });

  //     // update local state so table reflects the change immediately
  //     setLeavePhysioSessions((prev) =>
  //       prev.map((s) =>
  //         s.sessionCode === sessionCode
  //           ? { ...s, physioId: { _id: physioId, physioName }, physioName }
  //           : s,
  //       ),
  //     );
  //   } catch (err) {
  //     console.error("Error assigning physio:", err);
  //     toast({ title: "Error", description: "Failed to assign physio." });
  //   }
  // };

  const handleLeave = async () => {
    if (!assignForm.physioId || !dateFilter || !assignForm.LeaveMode) {
      toast({
        title: "Error",
        description: "Please select physiotherapist, date, and leave type.",
        variant: "destructive",
      });
      return;
    }

    const selectedPhysio = employees.find((p) => p._id === assignForm.physioId);

    try {
      const response = await apiRequest("LeaveControllers/markLeave", {
        method: "POST",
        body: JSON.stringify({
          physioId: assignForm.physioId,
          LeaveDate: dateFilter,
          LeaveMode: assignForm.LeaveMode,
        }),
      });
      if (response?.success !== true) {
        toast({
          title: "Alert",
          description: "Already leave exists for this physio with this date.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Success",
        description: "Leave marked successfully.",
      });
    } catch (error) {
      console.error("Error marking leave:", error);
      toast({
        title: "Error",
        description: "Failed to mark leave.",
        variant: "destructive",
      });
    }
    getLeave();
  };
  const [cancelDialog, setCancelDialog] = useState({
    open: false,
    type: "session",
    sessionId: null,
    patientId: null,
    patientName: "",
  });

  const [cancelledReason, setCancelledReason] = useState("");
  const [cancelledKms, setCancelledKms] = useState("");
  const [sessionStatus, setSessionStatus] = useState([]);

  const getSession = async () => {
    try {
      const storedRole = localStorage.getItem("userRole");

      const response = await apiRequest("Session/getAllSession", {
        method: "POST",
        body: JSON.stringify({
          // physioId: user._id,
          storedRole,
        }),
      });

      if (!Array.isArray(response)) return;

      setSessions(response);

      //Build session count map
      const countMap = {};

      response.forEach((s) => {
        const pid = s.patientId?._id;
        const physioId = s.physioId?._id;
        if (!pid || !physioId) return;

        const key = `${pid}-${physioId}`;

        if (!countMap[key]) {
          countMap[key] = { total: 0, completed: 0 };
        }

        countMap[key].total += 1;

        if (s.sessionStatusId?.sessionStatusName === "Completed") {
          countMap[key].completed += 1;
        }
      });

      setSessionCountMap(countMap);
      const today = new Date().toISOString().split("T")[0];

      const todaySessions = response.filter((s) => {
        if (!s.sessionDate) return false;

        const sessionDay = new Date(s.sessionDate).toISOString().split("T")[0];

        return sessionDay === today;
      });

      setFilteredSessions(todaySessions);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    }
  };
  const getSessionStatus = async (data) => {
    try {
      const response = await apiRequest("SessionStatus/getAllSessionStatus", {
        method: "POST",
        body: JSON.stringify(data),
      });

      // ALWAYS force array
      setSessionStatus(
        Array.isArray(response?.sessionStatuses)
          ? response.sessionStatuses
          : [],
      );
    } catch (error) {
      console.log(error, "error from frontend get All Session Status");
      setSessionStatus([]); // never allow undefined
    }
  };
  const handlePlanCancelClick = (patientId, patientName) => {
    setCancelDialog({
      open: true,
      type: "plan",
      sessionId: null,
      patientId,
      patientName,
    });
  };

  const handleCancelSubmit = () => {
    if (!cancelledReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please enter a reason for cancelling this session.",
        variant: "destructive",
      });
      return;
    }
    const { sessionId } = cancelDialog;
    handleActionCancel(sessionId, "Canceled", cancelledKms, cancelledReason);
    setSessions((prev) =>
      prev.map((s) =>
        s._id === sessionId
          ? {
              ...s,
              status: "Canceled",
              cancelledKms: parseFloat(cancelledKms) || 0,
            }
          : s,
      ),
    );
    toast({
      title: "Session Canceled",
      description: "Session has been marked as Canceled.",
    });
    setCancelDialog({ open: false, sessionId: null });
    setCancelledKms("");
    setCancelledReason("");
  };
  const handleActionCancel = (
    session,
    action,
    cancelledKms,
    cancelledReason,
  ) => {
    SessionCancel({
      _id: session,
      action: action,
      cancelledKms: cancelledKms,
      cancelledReason: cancelledReason,
    });
  };
  const SessionCancel = async (data) => {
    try {
      const response = await apiRequest("Session/SessionCancel", {
        method: "POST",
        body: JSON.stringify(data),
      });
      // console.log(data, "data of cancel");
      getSession();
      return response;
    } catch (error) {
      console.log(error, "error from frontend get All Session Cancel");
    }
  };
  const today = new Date().toISOString().split("T")[0];
  const isFutureSelected = !!dateFilter && dateFilter > today;
  const updatePaidLeave = async (leaveId, nextValue) => {
    try {
      const res = await apiRequest("LeaveControllers/updateLeavePaid", {
        method: "POST",
        body: JSON.stringify({ _id: leaveId, PaidLeave: nextValue }),
      });

      if (res?.success) {
        toast({ title: "Success", description: res.message || "Updated" });

        // update local state instantly
        setLeaveData((prev) =>
          prev.map((l) =>
            l._id === leaveId ? { ...l, PaidLeave: nextValue } : l,
          ),
        );
      } else {
        toast({
          title: "Error",
          description: res?.message || "Update failed",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err?.message || "Update failed",
        variant: "destructive",
      });
    }
  };
  const handleSaveSession = async () => {
    if (!assignForm.physioId || !dateFilter) {
      toast({
        title: "Alert",
        description: "Select Physio And Date First",
        variant: "destructive",
      });
      return;
    }

    const planned = leaveSessionPlan
      .filter((x) => x.patientId && x.Re_Assign)
      .map((x) => ({
        ...x,
        date: dateFilter, // optional, but good for backend
        sessionTime: x.sessionTime || "09:00",
      }));

    if (planned.length === 0) {
      toast({
        title: "Alert",
        description: "No planned Sessions to save",
        variant: "destructive",
      });
      return;
    }

    const invalid = planned.find((x) => !x.sessionTime || !x.Re_Assign);
    if (invalid) {
      toast({
        title: "Error",
        description: "Please set Time and Re-Assign for selected patients",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await apiRequest("LeaveControllers/saveLeavePlan", {
        method: "POST",
        body: JSON.stringify({
          physioId: assignForm.physioId,
          LeaveDate: dateFilter,
          LeaveMode: assignForm.LeaveMode,
          SessionGenerateForLeave: planned,
        }),
      });

      if (res?.success) {
        toast({
          title: "Saved",
          description: "Future session plan saved in DB",
        });
      } else {
        toast({
          title: "Error",
          description: res?.message || "Save failed",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to save plan",
        variant: "destructive",
      });
    }
    getLeave();
  };

  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [reAssignPhysioId, setReAssignPhysioId] = useState("");
  const selectedPatient = patients.find((p) => p._id === selectedPatientId);
  useEffect(() => {
    if (!patients?.length) return;

    setLeaveSessionPlan((prev) => {
      const prevMap = new Map(prev.map((x) => [x.patientId, x]));

      return patients.map((p) => {
        const existing = prevMap.get(p._id);

        return {
          patientId: p._id,
          sessionTime: existing?.sessionTime || p.sessionTime || "09:00",
          Re_Assign: existing?.Re_Assign || "",
        };
      });
    });
  }, [patients]);
  // console.log(selectedPatientId, "setSelectedPatientId");
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

      {/* Leave list */}
      {/* <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[95vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Physio Leave History</DialogTitle>
            <DialogDescription>
              View all physiotherapist leaves.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto mt-4 space-y-2">
            {leaveData.length === 0 ? (
              <p>No leave data found</p>
            ) : (
              leaveData.map((leave) => (
                <div
                  key={leave._id}
                  className="border p-3 rounded flex justify-between items-center"
                >
                  <div className="flex flex-col gap-1">
                    <p>
                      <strong>Physio:</strong>{" "}
                      {leave.physioId?.physioName || "N/A"}
                    </p>
                    <p>
                      <strong>Date:</strong>{" "}
                      {new Date(
                        leave.LeaveDate || leave.Date,
                      ).toLocaleDateString()}
                    </p>
                    <p>
                      <strong>Mode:</strong> {leave.LeaveMode || "N/A"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog> */}
      <Card className="medical-card">
        <CardHeader className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <div className="flex flex-col">
            <CardTitle>Manage Physio Leave & Reassign Patients</CardTitle>
            <CardDescription>
              Select a physiotherapist and date to view sessions and reassign
              patients.
            </CardDescription>
          </div>

          {/* <div className="items-center gap-2">
            <Button onClick={getLeave}>History</Button>
          </div> */}
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
            <Input
              type="date"
              value={dateFilter || ""}
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
                <SelectItem value="Half Day">Half Day </SelectItem>
                <SelectItem value="Full Day">Full Day</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full sm:w-auto" onClick={handleLeave}>
            Mark as Leave
          </Button>
        </CardContent>
      </Card>

      <Card className="medical-card">
        <CardHeader className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <div className="flex flex-col">
            <CardTitle>Reassign Patients to the Physios</CardTitle>
            <CardDescription>
              Select a patient and set time + reassign physio.
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
              onChange={(e) => {
                upsertPlan(selectedPatientId, { sessionTime: e.target.value });
              }}
            />

            <Select
              disabled={!selectedPatientId}
              value={
                leaveSessionPlan.find((x) => x.patientId === selectedPatientId)
                  ?.Re_Assign || ""
              }
              onValueChange={(physioId) => {
                upsertPlan(selectedPatientId, { Re_Assign: physioId });

                const selectedPhysio = employees.find(
                  (x) => x._id === physioId,
                );
                toast({
                  title: "Planned",
                  description: `Planned reassignment for ${selectedPatient?.patientName || ""} → ${
                    selectedPhysio?.physioName || ""
                  }`,
                });
              }}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Select Physio" />
              </SelectTrigger>

              <SelectContent>
                {employees
                  .filter((x) => x._id !== assignForm.physioId)
                  .map((x) => (
                    <SelectItem key={x._id} value={x._id}>
                      {x.physioName}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* date */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Input
              type="date"
              value={dateFilter || ""}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full sm:w-48"
            />
          </div>

          <Button className="w-full sm:w-auto" onClick={handleSaveSession}>
            Save Session
          </Button>
        </CardContent>
      </Card>

      {/* Desktop Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="hidden sm:block"
      >
        <Card className="medical-card">
          <CardHeader>
            {/* <CardTitle>
              Sessions on {dateFilter || "Selected Date"} for{" "}
              {assignForm.physioId
                ? employees.find((p) => p._id === assignForm.physioId)
                    ?.physioName
                : "Selected Physio"}
            </CardTitle> */}
          </CardHeader>
          <div className="mb-4 rounded-lg border">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b bg-gray-50">
              <div>
                <p className="font-semibold text-gray-800">Leave History</p>
                <p className="text-xs text-gray-500">Recent leaves</p>
              </div>

              <Button size="sm" variant="outline" onClick={getLeave}>
                Refresh
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="w-10"></th> {/* chevron column */}
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
                  {leaveData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-gray-500">
                        No leave data found
                      </td>
                    </tr>
                  ) : (
                    leaveData.map((leave) => {
                      const isOpen = openRowId === leave._id;
                      const sessions = leave.SessionGenerateForLeave || [];

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
                              {new Date(
                                leave.LeaveDate || leave.Date,
                              ).toLocaleDateString()}
                            </td>
                            <td className="p-3 text-gray-700">
                              {leave.LeaveMode || "N/A"}
                            </td>
                            <td className="p-3 text-gray-700">
                              {sessions.length}
                            </td>{" "}
                            <td className="p-3">
                              <Button
                                size="sm"
                                variant={
                                  leave.PaidLeave ? "outline" : "default"
                                }
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openPaidConfirm(leave);
                                }}
                              >
                                {leave.PaidLeave
                                  ? "Mark as UnPaid Leave"
                                  : "Mark as Paid Leave"}
                              </Button>
                            </td>
                          </tr>

                          {isOpen && (
                            <tr className="bg-blue-50">
                              <td colSpan={5} className="p-3">
                                {sessions.length === 0 ? (
                                  <p className="text-sm text-gray-500">
                                    No planned sessions
                                  </p>
                                ) : (
                                  <table className="w-full text-sm border">
                                    <thead>
                                      <tr className="border-b bg-blue-100">
                                        <th className="p-2 text-left">
                                          Patient ID
                                        </th>
                                        <th className="p-2 text-left">
                                          Session Time
                                        </th>
                                        <th className="p-2 text-left">
                                          Re-Assign Physio
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {sessions.map((s) => (
                                        <tr key={s._id} className="border-b">
                                          <td className="p-2">
                                            {s.patientId?.patientName}
                                          </td>
                                          <td className="p-2">
                                            {s.sessionTime}
                                          </td>
                                          <td className="p-2">
                                            {s.Re_Assign?.physioName}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                )}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <AlertDialog
            open={paidConfirm.open}
            onOpenChange={(open) =>
              setPaidConfirm((prev) => ({
                ...prev,
                open,
                ...(open
                  ? {}
                  : { leaveId: null, nextValue: false, message: "" }),
              }))
            }
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Action</AlertDialogTitle>
                <AlertDialogDescription>
                  {paidConfirm.message}
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmPaidToggle}>
                  Yes, Confirm
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </Card>
      </motion.div>
      <Dialog
        open={cancelDialog.open}
        onOpenChange={(open) =>
          setCancelDialog({
            open,
            type: "session",
            sessionId: null,
            patientId: null,
            patientName: "",
          })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {cancelDialog.type === "plan"
                ? "Remove Planned Patient"
                : "Cancel Session"}
            </DialogTitle>

            <DialogDescription>
              {cancelDialog.type === "plan"
                ? `This will remove ${cancelDialog.patientName || "this patient"} from the leave plan.`
                : "Enter the below details before cancellation, if any."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <Label htmlFor="cancelledKms">Cancelled Kms</Label>
            <Input
              id="cancelledKms"
              type="number"
              onWheel={(e) => {
                e.target.blur();
              }}
              value={cancelledKms}
              onChange={(e) => setCancelledKms(e.target.value)}
              placeholder="e.g., 5"
            />
            <p className="text-xs text-gray-500">
              This amount will be deducted from the physio's daily total.
            </p>
          </div>

          <div className="space-y-4 pt-4">
            <Label htmlFor="cancelledKms">Cancel Reason</Label>
            <Input
              id="cancelledReason"
              type="text"
              value={cancelledReason}
              onChange={(e) => setCancelledReason(e.target.value)}
              placeholder="Enter reason for cancelling this session..."
              required
            />
            {/* <p className="text-xs text-gray-500">
              This amount will be deducted from the physio's daily total.
            </p> */}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setCancelDialog({
                  open: false,
                  type: "session",
                  sessionId: null,
                  patientId: null,
                  patientName: "",
                })
              }
            >
              Back
            </Button>
            <Button onClick={handleCancelSubmit}>Confirm Cancellation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Mobile Cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="sm:hidden"
      >
        <Card className="medical-card">
          <div className="border rounded-lg overflow-hidden">
            {/* Header (same like desktop) */}
            <div className="flex items-center justify-between px-3 py-2 border-b bg-gray-50">
              <div>
                <p className="font-semibold text-gray-800">Leave History</p>
                <p className="text-xs text-gray-500">Recent leaves</p>
              </div>

              <Button size="sm" variant="outline" onClick={getLeave}>
                Refresh
              </Button>
            </div>

            <CardContent className="p-0">
              {leaveData.length === 0 ? (
                <p className="p-4 text-center text-sm text-gray-500">
                  No leave data found
                </p>
              ) : (
                <div className="divide-y">
                  {leaveData.map((leave) => {
                    const isOpen = openRowId === leave._id;
                    const sessions = leave.SessionGenerateForLeave || [];

                    return (
                      <div key={leave._id} className="bg-white">
                        {/* MAIN ROW (click to expand) */}
                        <button
                          type="button"
                          onClick={() =>
                            setOpenRowId(isOpen ? null : leave._id)
                          }
                          className="w-full text-left px-3 py-3 flex items-start justify-between gap-3 hover:bg-gray-50"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">
                              {leave.physioId?.physioName || "N/A"}
                            </p>

                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(
                                leave.LeaveDate || leave.Date,
                              ).toLocaleDateString()}
                              {" • "}
                              {leave.LeaveMode || "N/A"}
                            </p>

                            <p className="text-xs text-gray-600 mt-1">
                              Sessions:{" "}
                              <span className="font-medium">
                                {sessions.length}
                              </span>
                            </p>
                            <Button
                              size="sm"
                              variant={leave.PaidLeave ? "outline" : "default"}
                              onClick={(e) => {
                                e.stopPropagation();
                                openPaidConfirm(leave);
                              }}
                            >
                              {leave.PaidLeave
                                ? "Mark as UnPaid Leave"
                                : "Mark as Paid Leave"}
                            </Button>
                          </div>

                          <div className="pt-1 text-gray-600">
                            {isOpen ? (
                              <ChevronDown size={18} />
                            ) : (
                              <ChevronRight size={18} />
                            )}
                          </div>
                        </button>

                        {/* EXPANDED CONTENT */}
                        {isOpen && (
                          <div className="bg-green-50 px-3 pb-3">
                            {sessions.length === 0 ? (
                              <p className="text-sm text-gray-500 pt-2">
                                No planned sessions
                              </p>
                            ) : (
                              <div className="mt-2 space-y-2">
                                {sessions.map((s) => (
                                  <div
                                    key={s._id}
                                    className="rounded border bg-white px-3 py-2"
                                  >
                                    <p className="text-sm font-medium text-gray-800">
                                      {s.patientId?.patientName || "N/A"}
                                    </p>

                                    <div className="mt-1 flex justify-between text-xs text-gray-600">
                                      <span>Time: {s.sessionTime || "-"}</span>
                                      <span>
                                        Re-Assign:{" "}
                                        {s.Re_Assign?.physioName || "-"}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default LeavephysioManagement;
