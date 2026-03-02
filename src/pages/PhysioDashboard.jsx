import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar, Clock, CheckCircle, User, Info, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import PatientDetailsDialog from "@/components/PatientDetailsDialog";
import { apiRequest } from "@/components/CustomComponents/apiRequest";
import { useNavigate } from "react-router-dom";
const PhysioDashboard = () => {
  const [stats, setStats] = useState({
    todaySessions: 0,
    completedSessions: 0,
    upcomingSessions: 0,
    activePatients: 0,
    notConsent: 0,
    cancelledSessions: 0,
  });
  const Navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const currentPhysioId = 1; // Mock current physio ID
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const storedRole = localStorage.getItem("userRole");
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      const startDate = `${today.toISOString().split("T")[0]}T00:00:00Z`;
      const endDate = `${tomorrow.toISOString().split("T")[0]}T00:00:00Z`;

      //  Fetch sessions
      const sessionRes = await apiRequest("Session/getAllSession", {
        method: "POST",
        body: JSON.stringify({
          Today: startDate,
          nextDate: endDate,
          physioId: user._id,
          storedRole,
        }),
      });

      const patientRes = await apiRequest("Patient/getAllPatient", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const sessionsArr = Array.isArray(sessionRes)
        ? sessionRes
        : Array.isArray(sessionRes?.data)
          ? sessionRes.data
          : Array.isArray(sessionRes?.sessions)
            ? sessionRes.sessions
            : [];

      const patientsArr = Array.isArray(patientRes)
        ? patientRes
        : Array.isArray(patientRes?.data)
          ? patientRes.data
          : Array.isArray(patientRes?.patients)
            ? patientRes.patients
            : [];

      processDashboardData(sessionsArr, patientsArr);
    } catch (err) {
      console.error("Dashboard load failed:", err);
    }
  };
  const processDashboardData = (sessionsData, patientsData) => {
    const physioPatients = patientsData.filter(
      (patient) => patient.physioId?._id?.toString() === user._id?.toString(),
    );

    const todayStr = new Date().toISOString().split("T")[0];
    console.log(physioPatients, "patientsData");

    const todaySessions = sessionsData.filter((s) =>
      s.sessionDate?.startsWith(todayStr),
    );

    const completedSessions = sessionsData.filter(
      (s) => s?.sessionStatusId?.sessionStatusName === "Completed",
    );

    const upcomingSessions = sessionsData.filter((s) => {
      const sessionDate = new Date(s.sessionDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const status = s.sessionStatusId?.sessionStatusName;

      return (
        sessionDate >= today &&
        (status === "Scheduled" || status === "Attended")
      );
    });

    const activePatientIds = new Set(sessionsData.map((s) => s.patientId));

    // Attach patient details to each session
    const enrichedSessions = upcomingSessions
      .sort((a, b) => new Date(a.sessionDate) - new Date(b.sessionDate))
      .map((session) => {
        const patient = patientsData.find((p) => p._id === session.patientId);

        return {
          ...session,
          id: session._id, // normalize for UI
          patientName: patient?.name || "Unknown",
          patientDetails: patient || null,
          status: session.sessionStatusId?.sessionStatusName?.toLowerCase(),
        };
      });
    const notConsentPatients = () => {
      return physioPatients.filter(
        (patient) => patient.isConsentReceived === false,
      ).length;
    };

    const todayDate = new Date().toISOString().split("T")[0];
    const todaycancelledSessions = sessionsData.filter(
      (s) =>
        s.sessionStatusId?.sessionStatusName === "Canceled" &&
        s.sessionDate?.startsWith(todayDate),
    );
    console.log(todaycancelledSessions, "Todays cancelled session");

    setStats({
      todaySessions: todaySessions.length,
      completedSessions: completedSessions.length,
      totalPatient: physioPatients.length,
      upcomingSessions: upcomingSessions.length,
      activePatients: activePatientIds.size,
      notConsent: notConsentPatients(user._id),
      cancelledSessions: todaycancelledSessions.length,
    });

    setSessions(enrichedSessions.slice(0, 5));
  };

  const handleSessionAction = (sessionId, action) => {
    setSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId ? { ...session, status: action } : session,
      ),
    );

    toast({
      title: "Session Updated",
      description: `Session has been ${action}`,
    });
  };

  const handleViewDetails = (patient) => {
    setSelectedPatient(patient);
    setIsDetailsOpen(true);
  };

  const statCards = [
    {
      title: "Today's Sessions",
      value: stats.todaySessions,
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Upcoming Sessions",
      value: stats.upcomingSessions,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Active Patients",
      value: stats.activePatients,
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Total Patients",
      value: stats.totalPatient,
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Not Consent Patients",
      value: stats.notConsent,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Today Completed Session",
      value: stats.completedSessions,
      icon: CheckCircle,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Cancelled Sessions",
      value: stats.cancelledSessions,
      icon: CheckCircle,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Physiotherapist Dashboard
        </h1>
        <p className="text-gray-600">
          Your daily operational overview and upcoming tasks
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="medical-card hover:shadow-lg transition-shadow w-full">
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
                  <p className="text-xs text-gray-500 mt-1">Your performance</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Card className="medical-card">
          <CardHeader>
            <CardTitle>Upcoming Sessions</CardTitle>
            <CardDescription>
              Your next scheduled patient sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* <div className="space-y-4"> */}
            <div className="max-h-96 overflow-y-auto space-y-4">
              {sessions.length > 0 ? (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-2 border rounded-lg hover:bg-gray-50/50 transition-colors"
                  >
                    <div className="flex items-center space-x-2 ">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="text-blue-600" size={16} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {session.patientId?.patientName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(session.sessionDate).toLocaleDateString(
                            undefined,
                            { weekday: "long", month: "long", day: "numeric" },
                          )}{" "}
                          at {session.sessionTime}
                        </p>
                        <span
                          className={`inline-block px-2 py-1 text-xs rounded-full status-${session.status}`}
                        >
                          {session.sessionStatusId?.sessionStatusName}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center">
                      {session.patientDetails && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            handleViewDetails(session.patientDetails)
                          }
                        >
                          <Info size={16} />
                        </Button>
                      )}
                      {session.status === "scheduled" && (
                        <Button
                          size="sm"
                          onClick={
                            () =>
                              Navigate("/sessions", {
                                state: {
                                  sessionId: session.id,
                                  from: "dashboard",
                                },
                              })
                            // handleSessionAction(session.id, "attended")
                          }
                        >
                          Attend
                        </Button>
                      )}
                      {session.status === "attended" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            toast({
                              title: "Redirecting...",
                              description:
                                "Please complete feedback in Session Management.",
                            });
                          }}
                        >
                          Complete
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No upcoming sessions.</p>
                  <p className="text-sm">Enjoy your break!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <PatientDetailsDialog
        isOpen={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        patient={selectedPatient}
      />
    </div>
  );
};

export default PhysioDashboard;
