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
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  FileSpreadsheet,
  Calendar,
  Download,
  Printer,
  User,
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
    leavePhysioId: "",
    newPhysioId: "",
    LeaveMode: "",
  });

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

  useEffect(() => {
    console.log("Calling APIs...");
    getPhysio();
    getSessions();
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
  const getSessions = async () => {
    try {
      const response = await apiRequest("Session/getAllSession", {
        method: "POST",
        body: JSON.stringify({}),
      });

      if (Array.isArray(response)) {
        setSessions(response);
      } else {
        setSessions([]);
      }
    } catch (error) {
      console.error("Error loading sessions:", error);
      setSessions([]);
    }
  };

  const selectedDate = dateFilter || new Date().toISOString().slice(0, 10);

  const [leavePhysioSessions, setLeavePhysioSessions] = useState([]);

  useEffect(() => {
    const filtered =
      assignForm.physioId && dateFilter
        ? sessions.filter((s) => {
            // protect against null physioId
            const physioId =
              s.physioId && typeof s.physioId === "object"
                ? s.physioId._id
                : s.physioId;
            // extract YYYY-MM-DD from ISO date
            const sessionDateOnly = s.sessionDate?.split("T")[0];
            return (
              physioId === assignForm.physioId && sessionDateOnly === dateFilter
            );
          })
        : [];
    setLeavePhysioSessions(filtered);
  }, [assignForm.physioId, dateFilter, sessions]);

  //   const getAllPatient = async () => {
  //     try {
  //       const res = await apiRequest("Patient/getAllPatient", {
  //         method: "POST",
  //         body: JSON.stringify({}),
  //       });

  //       //   setLeavePhysioSessions(res);
  //       //   setPatients(res);
  //     } catch (error) {
  //       console.error("Error:", error);
  //       throw error;
  //     }
  //   };
  const AssignPhysio = async (data) => {
    try {
      const response = await apiRequest("Patient/sessionassignphysio", {
        method: "POST",
        body: JSON.stringify(data),
      });
      console.log("AssignPhysio Response:", response);
      toast({ title: "Success", description: "Assign updated successfully." });
      //   getAllPatient();

      return response;
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  };
  const handleAssignPhysio = async (physioId, physioName, sessionCode) => {
    if (!physioId || !physioName) return;

    const data = {
      sessionCode,
      newPhysioId: physioId,
      newPhysioName: physioName,
    };

    try {
      const res = await AssignPhysio(data);

      toast({ title: "Success", description: "Physio assigned successfully." });

      // update local state so table reflects the change immediately
      setLeavePhysioSessions((prev) =>
        prev.map((s) =>
          s.sessionCode === sessionCode
            ? { ...s, physioId: { _id: physioId, physioName }, physioName }
            : s,
        ),
      );
    } catch (err) {
      console.error("Error assigning physio:", err);
      toast({ title: "Error", description: "Failed to assign physio." });
    }
  };

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
      const response = await apiRequest("Physio/markLeave", {
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
  };

  return (
    <div className="space-y-6 overflow-x-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Leave Management
          </h1>
          <p className="text-gray-600 text-sm md:text-xs">
            Manage physiotherapist leave and reassign patients to available
            physiotherapists.
          </p>
        </div>
      </motion.div>

      <Card className="medical-card">
        <CardHeader>
          <CardTitle>Find Leave Physio & Reassign Patients</CardTitle>
          <CardDescription>
            Select a physiotherapist and date to view sessions and reassign
            patients.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
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
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button onClick={handleLeave}>Mark as Leave</Button>
          </div>
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
            <CardTitle>
              Sessions on {dateFilter || "Selected Date"} for{" "}
              {assignForm.physioId
                ? employees.find((p) => p._id === assignForm.physioId)
                    ?.physioName
                : "Selected Physio"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold text-gray-600">
                      Patient
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-600">
                      Session Time
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-600">
                      Leave Physio
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-600">
                      Assign To
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {leavePhysioSessions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center p-4 text-gray-500">
                        No sessions found for selected physio and date
                      </td>
                    </tr>
                  ) : (
                    leavePhysioSessions.map((s) => (
                      <tr key={s._id} className="border-b hover:bg-gray-50/50">
                        <td className="p-3 font-medium text-gray-800">
                          {s.patientId?.patientName}
                        </td>
                        <td className="p-3">{s.sessionTime}</td>
                        <td className="p-3 text-gray-600 font-medium">
                          {s.physioId?.physioName}
                        </td>
                        <td className="p-3">
                          <Select
                            value={s.newPhysioId || ""}
                            onValueChange={(physioId) => {
                              const selectedPhysio = employees.find(
                                (p) => p._id === physioId,
                              );
                              if (!selectedPhysio) return;

                              setAssignForm((prev) => ({
                                ...prev,
                                newPhysioId: selectedPhysio._id,
                                newPhysioName: selectedPhysio.physioName,
                              }));

                              handleAssignPhysio(
                                selectedPhysio._id,
                                selectedPhysio.physioName,
                                s.sessionCode,
                              );
                            }}
                            disabled={!assignForm.physioId}
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue
                                placeholder={
                                  assignForm.physioId
                                    ? "Select Physio"
                                    : "Select top physio first"
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {employees
                                .filter((p) => p._id !== s.physioId?._id)
                                .map((p) => (
                                  <SelectItem key={p._id} value={p._id}>
                                    {p.physioName}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Mobile Cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="sm:hidden"
      >
        <Card className="medical-card">
          <CardHeader>
            <CardTitle>Sessions on {dateFilter || "Selected Date"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {leavePhysioSessions.length === 0 ? (
              <p className="text-center text-sm text-gray-500">
                No sessions found for selected physio and date
              </p>
            ) : (
              leavePhysioSessions.map((s) => (
                <Card key={s._id} className="border rounded-xl">
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {s.patientId?.patientName}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Session Time: {s.sessionTime}
                      </p>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Leave Physio</span>
                      <span className="text-red-600 font-medium">
                        {s.physioId?.physioName}
                      </span>
                    </div>

                    <Select
                      value={s.newPhysioId || ""}
                      onValueChange={(physioId) => {
                        const selectedPhysio = employees.find(
                          (p) => p._id === physioId,
                        );
                        if (!selectedPhysio) return;

                        setAssignForm((prev) => ({
                          ...prev,
                          newPhysioId: selectedPhysio._id,
                          newPhysioName: selectedPhysio.physioName,
                        }));

                        handleAssignPhysio(
                          selectedPhysio._id,
                          selectedPhysio.physioName,
                          s.sessionCode,
                        );
                      }}
                      disabled={!assignForm.physioId}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            assignForm.physioId
                              ? "Select Physio"
                              : "Select top physio first"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {employees
                          .filter((p) => p._id !== s.physioId?._id)
                          .map((p) => (
                            <SelectItem key={p._id} value={p._id}>
                              {p.physioName}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default LeavephysioManagement;
