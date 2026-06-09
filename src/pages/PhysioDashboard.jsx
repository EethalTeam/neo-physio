import React, { useState, useEffect } from "react";
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
import {
  Calendar,
  Clock,
  CheckCircle,
  User,
  Info,
  XCircle,
} from "lucide-react";
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
    monthTotalSessions: 0,
    monthCompletedSessions: 0,
    monthCompletionRate: 0,
  });

  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    AOS.init({ duration: 700, once: true, easing: "ease-out-cubic" });
    if (user?._id) {
      loadDashboardData();
    }
  }, [user?._id]);

  const loadDashboardData = async () => {
    try {
      const storedRole = localStorage.getItem("userRole");

      // ✅ Fetch ALL physio sessions
      const sessionRes = await apiRequest("Session/getAllSession", {
        method: "POST",
        body: JSON.stringify({
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

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // ✅ Current month sessions
    const currentMonthSessions = sessionsData.filter((s) => {
      if (!s?.sessionDate) return false;
      const d = new Date(s.sessionDate);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const currentMonthCompletedSessions = currentMonthSessions.filter(
      (s) => s?.sessionStatusId?.sessionStatusName === "Completed",
    );

    const currentMonthCompletionRate =
      currentMonthSessions.length > 0
        ? Math.round(
            (currentMonthCompletedSessions.length /
              currentMonthSessions.length) *
              100,
          )
        : 0;

    // ✅ Today's sessions
    const todaySessions = sessionsData.filter((s) =>
      s?.sessionDate?.startsWith(todayStr),
    );

    const todayCompletedSessions = todaySessions.filter(
      (s) => s?.sessionStatusId?.sessionStatusName === "Completed",
    );

    const todayCancelledSessions = todaySessions.filter(
      (s) => s?.sessionStatusId?.sessionStatusName === "Canceled",
    );

    // ✅ Upcoming sessions
    const upcomingSessions = sessionsData.filter((s) => {
      if (!s?.sessionDate) return false;

      const sessionDate = new Date(s.sessionDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const status = s?.sessionStatusId?.sessionStatusName;

      return (
        sessionDate >= today &&
        (status === "Scheduled" ||
          status === "Attended" ||
          status === "Pending")
      );
    });

    // ✅ Active patient count
    const activePatientIds = new Set(
      sessionsData.map((s) =>
        typeof s.patientId === "object" ? s.patientId?._id : s.patientId,
      ),
    );

    // ✅ Enriched session list for upcoming card
    const enrichedSessions = upcomingSessions
      .sort((a, b) => new Date(a.sessionDate) - new Date(b.sessionDate))
      .map((session) => {
        const patientId =
          typeof session.patientId === "object"
            ? session.patientId?._id
            : session.patientId;

        const patient =
          patientsData.find(
            (p) => p._id?.toString() === patientId?.toString(),
          ) ||
          session.patientId ||
          null;

        return {
          ...session,
          id: session._id,
          patientName: patient?.patientName || "Unknown",
          patientDetails: patient || null,
          status: session?.sessionStatusId?.sessionStatusName?.toLowerCase(),
        };
      });

    const notConsentPatients = physioPatients.filter(
      (patient) => patient.isConsentReceived === false,
    ).length;

    setStats({
      todaySessions: todaySessions.length,
      completedSessions: todayCompletedSessions.length,
      upcomingSessions: upcomingSessions.length,
      activePatients: activePatientIds.size,
      notConsent: notConsentPatients,
      cancelledSessions: todayCancelledSessions.length,
      monthTotalSessions: currentMonthSessions.length,
      monthCompletedSessions: currentMonthCompletedSessions.length,
      monthCompletionRate: currentMonthCompletionRate,
    });

    setSessions(enrichedSessions.slice(0, 5));
  };

  const handleViewDetails = (patient) => {
    setSelectedPatient(patient);
    setIsDetailsOpen(true);
  };

  const statCards = [
    {
      title: "Session Completion Rate (SCR)",
      value: `${stats.monthCompletionRate}%`,
      subtitle: `${stats.monthCompletedSessions} / ${stats.monthTotalSessions} sessions`,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Today's Sessions",
      value: stats.todaySessions,
      subtitle: "Today",
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Upcoming Sessions",
      value: stats.upcomingSessions,
      subtitle: "Scheduled ahead",
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Today Completed Session",
      value: stats.completedSessions,
      subtitle: "Completed today",
      icon: CheckCircle,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Cancelled Sessions",
      value: stats.cancelledSessions,
      subtitle: "Cancelled today",
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
  ];

  return (
    <div className="space-y-6">
      <div data-aos="fade-down" data-aos-duration="600">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Physiotherapist Dashboard
        </h1>
        <p className="text-gray-600">
          Your daily operational overview and upcoming tasks
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              data-aos="fade-up"
              data-aos-delay={index * 70}
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
                    <AnimatedNumber value={stat.value} />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      <div data-aos="fade-up" data-aos-delay="100">
        <Card className="medical-card">
          <CardHeader>
            <CardTitle>Upcoming Sessions</CardTitle>
            <CardDescription>
              Your next scheduled patient sessions
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="max-h-96 overflow-y-auto space-y-4">
              {sessions.length > 0 ? (
                sessions.map((session, idx) => (
                  <div
                    key={session.id}
                    data-aos="fade-up"
                    data-aos-delay={idx * 60}
                    className="flex items-center justify-between p-2 border rounded-lg hover:bg-gray-50/50 transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="text-blue-600" size={16} />
                      </div>

                      <div>
                        <p className="font-medium text-gray-800">
                          {session.patientId?.patientName ||
                            session.patientName ||
                            "Unknown"}
                        </p>

                        <p className="text-sm text-gray-600">
                          {new Date(session.sessionDate).toLocaleDateString(
                            undefined,
                            {
                              weekday: "long",
                              month: "long",
                              day: "numeric",
                            },
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
                          onClick={() =>
                            navigate("/sessions", {
                              state: {
                                sessionId: session.id,
                                from: "dashboard",
                              },
                            })
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
      </div>

      <PatientDetailsDialog
        isOpen={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        patient={selectedPatient}
      />
    </div>
  );
};

export default PhysioDashboard;
