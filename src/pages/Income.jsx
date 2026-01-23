import React, { useState, useEffect } from "react";
import { apiRequest } from "@/components/CustomComponents/apiRequest";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const Income = () => {
  const [patients, setPatients] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  //   const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);
  const fetchData = async () => {
    // setLoading(true);
    try {
      // Get patient base data (fee type & fee)
      const patientsRes = await apiRequest("Patient/getAllPatientsIncome", {
        method: "POST",
        body: JSON.stringify({ month: selectedMonth, year: selectedYear }),
      });

      // Get ALL sessions
      const sessionsRes = await apiRequest("Session/getAllSession", {
        method: "POST",
        body: JSON.stringify({}),
      });

      // Count completed sessions per patient (MONTH FILTER)
      const completedSessionsByPatient = {};

      sessionsRes.forEach((session) => {
        if (!session.patientId) return; //  skip invalid sessions

        const patientId =
          typeof session.patientId === "object"
            ? session.patientId._id
            : session.patientId;

        if (!patientId) return;

        const date = new Date(session.sessionDate);

        const isSameMonth =
          date.getMonth() + 1 === selectedMonth &&
          date.getFullYear() === selectedYear;

        if (
          isSameMonth &&
          session.sessionStatusId?.sessionStatusName?.toLowerCase() ===
            "completed"
        ) {
          completedSessionsByPatient[patientId] =
            (completedSessionsByPatient[patientId] || 0) + 1;
        }
      });

      //  Merge + calculate income
      const patientsWithIncome = patientsRes.map((p) => {
        const completed = completedSessionsByPatient[p._id] || 0;
        let totalIncome = 0;

        if (p.feeType === "PerSession") {
          totalIncome = completed * (p.feePerSession || 0);
        } else if (p.feeType === "PerMonth") {
          totalIncome = p.feePerSession || 0;
        }

        return {
          ...p,
          totalCompletedSessions: completed,
          totalIncome,
        };
      });

      setPatients(patientsWithIncome);
    } catch (err) {
      console.error(err);
    } finally {
      //   setLoading(false);
    }
  };

  //   const fetchData = async () => {
  //     setLoading(true);
  //     try {
  //       // Fetch patients
  //       const patientsRes = await apiRequest("Patient/getAllPatient", {
  //         method: "POST",
  //         body: JSON.stringify({}),
  //       });

  //       //  Fetch all sessions
  //       const sessionsRes = await apiRequest("Session/getAllSession", {
  //         method: "POST",
  //         body: JSON.stringify({}),
  //       });

  //       // Count completed sessions per patient
  //       const completedSessionsByPatient = {};
  //       sessionsRes.forEach((session) => {
  //         const patientId = session.patientId?._id || session.patientId;

  //         if (!completedSessionsByPatient[patientId]) {
  //           completedSessionsByPatient[patientId] = 0;
  //         }

  //         if (
  //           session.sessionStatusId?.sessionStatusName &&
  //           session.sessionStatusId.sessionStatusName.toLowerCase() ===
  //             "completed"
  //         ) {
  //           completedSessionsByPatient[patientId]++;
  //         }
  //       });

  //       // Merge completed sessions count and calculate total income
  //       const patientsWithIncome = patientsRes.map((p) => {
  //         const completed = completedSessionsByPatient[p._id] || 0;
  //         let totalIncome = 0;

  //         if (p.FeesTypeId?.feesTypeName === "PerSession") {
  //           totalIncome = completed * (p.feeAmount || 0);
  //         } else if (p.FeesTypeId?.feesTypeName === "Monthly") {
  //           totalIncome = p.feeAmount || 0;
  //         }
  //         return {
  //           ...p,
  //           completedSessionsByPatient: completed,
  //           totalIncome,
  //         };
  //       });

  //       // 5. Save to state
  //       setPatients(patientsWithIncome);
  //       setSessions(sessionsRes);
  //     } catch (err) {
  //       console.error(err);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   const calculateIncome = (patient) => {
  //     const patientSessions = sessions.filter(
  //       (s) =>
  //         (s.patientId?._id || s.patientId) === patient._id &&
  //         s.sessionStatusId?.sessionStatusName.toLowerCase() === "completed",
  //     );

  //     const monthlySessions = patientSessions.filter((s) => {
  //       const date = new Date(s.sessionDate);
  //       return (
  //         date.getMonth() + 1 === selectedMonth &&
  //         date.getFullYear() === selectedYear
  //       );
  //     });

  //     const totalCompleted = monthlySessions.length;
  //     const feePerSession = patient.feeAmount || 0;
  //     const totalIncome = totalCompleted * feePerSession;

  //     return { totalCompleted, feePerSession, totalIncome };
  //   };

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  // const fetchData = async () => {
  //   setLoading(true);
  //   try {
  //     const response = await apiRequest("Patient/getAllPatient", {
  //       method: "POST",
  //       body: JSON.stringify({ month: selectedMonth, year: selectedYear }),
  //     });

  //     setPatients(Array.isArray(response) ? response : []);
  //   } catch (err) {
  //     console.error("Fetch error:", err);
  //     setPatients([]); // fallback
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  const totalMonthlyIncome = patients.reduce(
    (sum, p) => sum + (p.totalIncome || 0),
    0,
  );

  return (
    <div className="p-4 space-y-4 flex flex-col">
      <Card>
        <CardHeader>
          <CardTitle>Income Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap justify-between items-center w-full gap-4">
            {/* Left: Total Income */}
            <h3 className="text-lg font-semibold">
              Total Income: ₹{totalMonthlyIncome}
            </h3>

            {/* Right: Month, Year, Refresh */}
            <div className="flex items-center gap-2">
              <Select
                onValueChange={(val) => setSelectedMonth(Number(val))}
                value={selectedMonth}
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Select Month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m, idx) => (
                    <SelectItem key={idx} value={idx + 1}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                onValueChange={(val) => setSelectedYear(Number(val))}
                value={selectedYear}
              >
                <SelectTrigger className="w-full sm:w-28">
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                  {[2026, 2025, 2024].map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* <Button onClick={fetchData}>Refresh</Button> */}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="medical-card hidden md:block ">
        <CardContent>
          <div className="hidden md:block overflow-x-auto mt-5">
            <table className="min-w-full text-sm border rounded-lg">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="px-3 py-2 text-left">Patient Name</th>
                  <th className="px-3 py-2 text-left">Completed Sessions</th>
                  <th className="px-3 py-2 text-left">Fees</th>
                  <th className="px-3 py-2 text-left">Total Income</th>
                </tr>
              </thead>

              <tbody>
                {patients.map((p) => (
                  <tr
                    key={p._id}
                    className="hover:bg-gray-50 text-sm md:text-base"
                  >
                    <td className="p-2 border whitespace-nowrap">
                      {p.patientName}
                    </td>

                    <td className="p-2 border text-center">
                      {p.totalCompletedSessions}
                    </td>

                    <td className="p-2 border text-center whitespace-nowrap">
                      ₹{p.feePerSession || 0} ({p.feeType || "N/A"})
                    </td>

                    <td className="p-2 border text-center font-semibold whitespace-nowrap">
                      ₹{p.totalIncome || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      {/* <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      > */}
      <Card className="medical-card block sm:hidden">
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {patients.map((patient) => (
              <motion.div
                key={patient._id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="border mt-4 rounded-lg p-4 hover:shadow-md transition-shadow flex flex-col"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div>
                    <h3 className="text-sm font-medium">
                      Patient Name:
                      <span className="font-semibold">
                        {patient.patientName}
                      </span>
                    </h3>
                    <p className="text-sm text-gray-400">
                      Completed Session :
                      <span className="font-medium">
                        {patient.totalCompletedSessions}
                      </span>
                    </p>
                    <p className="text-sm text-gray-400">
                      Fees:
                      <span className="text-sm text-gray-600">
                        ₹{patient.feePerSession || 0} (
                        {patient.feeType || "N/A"})
                      </span>
                    </p>
                    <p className="text-sm text-gray-400">
                      Total Income:
                      <span className="font-semibold">
                        ₹{patient.totalIncome || 0}
                      </span>
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
      {/* </motion.div> */}

      {/* )} */}
    </div>
  );
};

export default Income;
