import React, { useState, useEffect, useMemo } from "react";
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
import { Bitcoin, InboxIcon } from "lucide-react";

const Income = () => {
  const [patients, setPatients] = useState([]);
  const [sessions, setSessions] = useState([]);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [selectedBillMonth, setSelectedBillMonth] = useState(
    new Date().getMonth() + 1,
  );
  const [selectedBillYear, setSelectedBillYear] = useState(
    new Date().getFullYear(),
  );

  const [activeTab, setActiveTab] = useState("income");

  const [physios, setPhysios] = useState([]);
  const [feesType, setFeesType] = useState([]);

  const [selectedPhysioId, setSelectedPhysioId] = useState("ALL");
  const [selectedPatientId, setSelectedPatientId] = useState("ALL");
  const [selectedBillPatientId, setSelectedBillPatientId] = useState("ALL");
  const [selectedFeeTypeId, setSelectedFeeTypeId] = useState("ALL");

  const monthlyId = "691af5c343be7d5e2861981f"; // monthly
  const sessionId = "691af5dc43be7d5e28619825"; // per session

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

  const getId = (v) => (typeof v === "object" ? v?._id : v);

  const TabButton = ({ id, label, icon: Icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`relative flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all rounded-md ${
        activeTab === id
          ? "bg-blue-600 text-white shadow-md"
          : "text-slate-400 hover:text-white hover:bg-blue-900"
      }`}
      type="button"
    >
      {Icon && <Icon className="w-4 h-4" />}
      {label}
      {activeTab === id && (
        <motion.div
          layoutId="activetabincome"
          className="absolute inset-0 rounded-md bg-blue-600 -z-10"
        />
      )}
    </button>
  );

  const fetchData = async () => {
    try {
      const patientsRes = await apiRequest("Patient/getAllPatientsIncome", {
        method: "POST",
        body: JSON.stringify({ month: selectedMonth, year: selectedYear }),
      });

      const sessionsRes = await apiRequest("Session/getAllSession", {
        method: "POST",
        body: JSON.stringify({}),
      });

      setPatients(Array.isArray(patientsRes) ? patientsRes : []);
      setSessions(Array.isArray(sessionsRes) ? sessionsRes : []);
    } catch (err) {
      console.error(err);
    }
  };

  const getAllPshyio = async () => {
    try {
      const res = await apiRequest("Physio/getAllPhysio", {
        method: "POST",
        body: JSON.stringify({}),
      });
      setPhysios(res?.physios || []);
    } catch (error) {
      console.error(error);
    }
  };

  const getFeesType = async () => {
    try {
      const response = await apiRequest("FeesType/getAllFeesType", {
        method: "POST",
        body: JSON.stringify({}),
      });
      setFeesType(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData();
    getAllPshyio();
    getFeesType();
  }, [selectedMonth, selectedYear]);

  const feeTypeMatch = (p) => {
    if (selectedFeeTypeId === "ALL") return true;

    const id = getId(p.feesTypeId || p.feeTypeId || p.FeesTypeId);
    if (id) return id === selectedFeeTypeId;

    const patientFee = (p.feeType || "").toLowerCase();
    const selectedFee = (
      feesType.find((x) => x._id === selectedFeeTypeId)?.feesTypeName || ""
    ).toLowerCase();

    return patientFee === selectedFee;
  };

  const filteredPatients = useMemo(() => {
    return patients
      .filter((p) =>
        selectedPhysioId === "ALL"
          ? true
          : getId(p.physioId) === selectedPhysioId,
      )
      .filter(feeTypeMatch)
      .filter((p) =>
        selectedPatientId === "ALL" ? true : p._id === selectedPatientId,
      );
  }, [
    patients,
    selectedPhysioId,
    selectedFeeTypeId,
    selectedPatientId,
    feesType,
  ]);

  const totalIncomeByFilter = filteredPatients.reduce(
    (sum, p) => sum + Number(p.totalIncome || 0),
    0,
  );
  const totalPendingByfilter = filteredPatients.reduce(
    (sum, p) => sum + Number(p.paymentPending || 0),
    0,
  );
  const totalReceivedByfilter = filteredPatients.reduce(
    (sum, p) => sum + Number(p.paymentReceived || 0),
    0,
  );

  const calcRatePerSession = (patient) => {
    if (!patient) return 0;

    const feeAmount = Number(patient.feeAmount || 0);
    const feesTypeId = getId(patient.FeesTypeId);
    const totalDays = Number(patient.totalSessionDays || patient.noOfDays || 0);

    if (feesTypeId === monthlyId) {
      return totalDays ? feeAmount / totalDays : 0;
    }

    if (feesTypeId === sessionId) {
      return feeAmount;
    }

    return feeAmount;
  };

  const billSessions = useMemo(() => {
    return sessions.filter((s) => {
      const pid = getId(s.patientId);
      const d = new Date(s.sessionDate);

      const isSameMonth =
        d.getMonth() + 1 === selectedBillMonth &&
        d.getFullYear() === selectedBillYear;

      const matchPatient =
        selectedBillPatientId === "ALL" ? true : pid === selectedBillPatientId;

      return isSameMonth && matchPatient;
    });
  }, [sessions, selectedBillMonth, selectedBillYear, selectedBillPatientId]);

  const completedBillSessions = useMemo(() => {
    return billSessions.filter(
      (s) =>
        (s?.sessionStatusId?.sessionStatusName || "").toLowerCase() ===
        "completed",
    );
  }, [billSessions]);

  const completedCount = completedBillSessions.length;

  const billedAmount = useMemo(() => {
    let total = 0;

    if (selectedBillPatientId !== "ALL") {
      const patient = patients.find((p) => p._id === selectedBillPatientId);
      const rate = calcRatePerSession(patient);
      total = completedCount * rate;
      return Number(total.toFixed(2));
    }

    const countByPatient = {};
    completedBillSessions.forEach((s) => {
      const pid = getId(s.patientId);
      countByPatient[pid] = (countByPatient[pid] || 0) + 1;
    });

    total = Object.entries(countByPatient).reduce((sum, [pid, count]) => {
      const patient = patients.find((p) => p._id === pid);
      const rate = calcRatePerSession(patient);
      return sum + count * rate;
    }, 0);

    return Number(total.toFixed(2));
  }, [patients, completedBillSessions, selectedBillPatientId, completedCount]);

  return (
    <div className="p-4 space-y-4 flex flex-col">
      <div className="w-full flex justify-center">
        <div className="flex items-center gap-2 p-1 rounded-lg border border-slate-800 overflow-x-auto max-w-full">
          <TabButton id="income" label="INCOME" icon={InboxIcon} />
          <TabButton id="bill" label="BILL GENERATE" icon={Bitcoin} />
        </div>
      </div>

      {activeTab === "income" && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Income Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="md:flex flex-wrap justify-between items-center w-full gap-2 grid grid-cols-1">
                {/* Left */}
                <div className="flex flex-col gap-2 text-sm font-semibold md:flex-row md:items-center md:gap-8">
                  <div className="flex w-full justify-between md:w-[220px]">
                    <span>Total Income:</span>
                    <span>₹{totalIncomeByFilter.toFixed(2)}</span>
                  </div>

                  <div className="flex w-full justify-between md:w-[220px]">
                    <span>Received:</span>
                    <span>₹{totalReceivedByfilter.toFixed(2)}</span>
                  </div>

                  <div className="flex w-full justify-between md:w-[220px]">
                    <span>Pending:</span>
                    <span>₹{totalPendingByfilter.toFixed(2)}</span>
                  </div>
                </div>

                {/* Right */}
                <div className="md:flex items-center gap-2 grid grid-cols-2">
                  <Select
                    value={selectedPhysioId}
                    onValueChange={(v) => setSelectedPhysioId(v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Filter by Physiotherapist" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Physios</SelectItem>
                      {physios.map((p) => (
                        <SelectItem key={p._id} value={p._id}>
                          {p.physioName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={selectedPatientId}
                    onValueChange={(v) => setSelectedPatientId(v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Filter by Patients" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Patients</SelectItem>
                      {patients.map((p) => (
                        <SelectItem key={p._id} value={p._id}>
                          {p.patientName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={selectedFeeTypeId}
                    onValueChange={(v) => setSelectedFeeTypeId(v)}
                  >
                    <SelectTrigger className="w-full mr-10">
                      <SelectValue placeholder="Filter by Feestype" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Fees Type</SelectItem>
                      {feesType.map((p) => (
                        <SelectItem key={p._id} value={p._id}>
                          {p.feesTypeName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

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
                      {[
                        2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034,
                        2035, 2036, 2037, 2038, 2039, 2040,
                      ].map((y) => (
                        <SelectItem key={y} value={y}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="medical-card hidden md:block ">
            {" "}
            <CardContent>
              {" "}
              <div className="hidden md:block overflow-x-auto mt-5">
                {" "}
                <table className="min-w-full text-sm border rounded-lg">
                  {" "}
                  <thead className="bg-gray-100 text-gray-700">
                    {" "}
                    <tr>
                      {" "}
                      <th className="px-3 py-2 text-left">Patient Name</th>{" "}
                      <th className="px-3 py-2 text-left">Physio Name</th>{" "}
                      <th className="px-3 py-2 text-left">
                        {" "}
                        Completed Sessions{" "}
                      </th>{" "}
                      <th className="px-3 py-2 text-left">
                        Fees(Fees Type)
                      </th>{" "}
                      <th className="px-3 py-2 text-left">Total Income</th>{" "}
                      <th className="px-3 py-2 text-left">Payment Received</th>{" "}
                      <th className="px-3 py-2 text-left">
                        Payment Pending
                      </th>{" "}
                    </tr>{" "}
                  </thead>{" "}
                  <tbody>
                    {" "}
                    {filteredPatients
                      .filter((p) => p.totalCompletedSessions > 0)
                      .map((p) => (
                        <tr
                          key={p._id}
                          className="hover:bg-gray-50 text-sm md:text-base"
                        >
                          {" "}
                          <td className="p-2 border whitespace-nowrap">
                            {" "}
                            {p.patientName}{" "}
                          </td>{" "}
                          <td className="p-2 border whitespace-nowrap">
                            {" "}
                            {p.physioName}{" "}
                          </td>{" "}
                          <td className="p-2 border text-center">
                            {" "}
                            {p.totalCompletedSessions}{" "}
                          </td>{" "}
                          <td className="p-2 border text-center whitespace-nowrap">
                            {" "}
                            ₹{p.feePerSession || 0} ({p.feeType || "N/A"}){" "}
                          </td>{" "}
                          <td className="p-2 border text-center font-semibold whitespace-nowrap">
                            {" "}
                            ₹{Number(p.totalIncome || 0).toFixed(2)}{" "}
                          </td>{" "}
                          <td className="p-2 border text-center font-semibold whitespace-nowrap">
                            {" "}
                            ₹{Number(p.paymentReceived || 0).toFixed(2)}{" "}
                          </td>{" "}
                          <td className="p-2 border text-center font-semibold whitespace-nowrap">
                            {" "}
                            ₹{Number(p.paymentPending || 0).toFixed(2)}{" "}
                          </td>{" "}
                        </tr>
                      ))}{" "}
                  </tbody>{" "}
                </table>{" "}
              </div>{" "}
            </CardContent>{" "}
          </Card>
        </>
      )}
      {activeTab === "bill" && (
        <Card>
          <CardHeader>
            <CardTitle>Bill Generate Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap justify-between items-center w-full gap-4">
              <h3 className="text-lg font-semibold">
                Completed Sessions:{" "}
                <span className="ml-2">{completedCount}</span>
              </h3>

              <h3 className="text-lg font-semibold">
                Billed Amount: <span className="ml-2">₹{billedAmount}</span>
              </h3>

              <div className="flex items-center gap-3 w-full">
                <Select
                  value={selectedBillPatientId}
                  onValueChange={(v) => setSelectedBillPatientId(v)}
                >
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="Filter by Patients" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Patients</SelectItem>
                    {patients.map((p) => (
                      <SelectItem key={p._id} value={p._id}>
                        {p.patientName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  onValueChange={(val) => setSelectedBillMonth(Number(val))}
                  value={selectedBillMonth}
                >
                  <SelectTrigger className="w-40">
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
                  onValueChange={(val) => setSelectedBillYear(Number(val))}
                  value={selectedBillYear}
                >
                  <SelectTrigger className="w-28">
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034,
                      2035, 2036, 2037, 2038, 2039, 2040,
                    ].map((y) => (
                      <SelectItem key={y} value={y}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button onClick={fetchData}>Apply</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Income;
