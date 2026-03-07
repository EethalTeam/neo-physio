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
import { Input } from "@/components/ui/input";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Bitcoin, CheckCircle, InboxIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  const [billPreview, setBillPreview] = useState({
    open: false,
    bill: null,
    includeSessions: false,
    loading: false,
  });
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
  const getPreviewDateRange = (bill) => {
    const pid = getId(bill?.patientId);
    const list = sessions
      .filter((s) => getId(s.patientId) === pid)
      .map((s) => new Date(s.sessionDate))
      .filter((d) => !isNaN(d.getTime()))
      .filter(
        (d) =>
          d.getMonth() + 1 === selectedBillMonth &&
          d.getFullYear() === selectedBillYear,
      );

    if (!list.length) return "N/A";
    const minD = new Date(Math.min(...list));
    const maxD = new Date(Math.max(...list));
    return `${fmt(minD)} → ${fmt(maxD)}`;
  };
  const getCompletedCountForPreview = (bill) => {
    if (!bill) return 0;

    const pid = getId(bill.patientId);

    return sessions.filter((s) => {
      const spid = getId(s.patientId);
      if (spid !== pid) return false;

      const d = new Date(s.sessionDate);
      const sameMonth =
        d.getMonth() + 1 === selectedBillMonth &&
        d.getFullYear() === selectedBillYear;

      const isCompleted =
        (s?.sessionStatusId?.sessionStatusName || "").toLowerCase() ===
        "completed";

      return sameMonth && isCompleted;
    }).length;
  };

  const fmt = (d) => {
    const x = new Date(d);
    if (isNaN(x.getTime())) return "N/A";
    return x.toLocaleDateString("en-GB"); // dd/mm/yyyy
  };
  const fetchData = async () => {
    try {
      const patientsRes = await apiRequest("Patient/getAllPatientsIncome", {
        method: "POST",
        body: JSON.stringify({ month: selectedMonth, year: selectedYear }),
      });

      // const sessionsRes = await apiRequest("Session/getAllSession", {
      //   method: "POST",
      //   body: JSON.stringify({}),
      // });

      setPatients(Array.isArray(patientsRes) ? patientsRes : []);
      // setSessions(Array.isArray(sessionsRes) ? sessionsRes : []);
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
          : p.physioDetails?.some((val) => val.physioId === selectedPhysioId),
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
  console.log(filteredPatients, "filteredPatients");
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

    // ✅ if backend already gives feePerSession, use it first
    const directRate = Number(
      patient.feePerSession ?? patient.ratePerSession ?? 0,
    );
    if (directRate > 0) return directRate;

    // ✅ try to get feesTypeId from any key
    const feesTypeId = getId(
      patient.feesTypeId ?? patient.feeTypeId ?? patient.FeesTypeId,
    );

    // ✅ try to get feeAmount from any key
    const feeAmount = Number(
      patient.feeAmount ?? patient.feesAmount ?? patient.amount ?? 0,
    );

    const totalDays = Number(
      patient.totalSessionDays ?? patient.noOfDays ?? patient.totalDays ?? 0,
    );

    if (!feeAmount) return 0;

    if (feesTypeId === monthlyId) {
      return totalDays ? feeAmount / totalDays : 0;
    }

    if (feesTypeId === sessionId) {
      return feeAmount;
    }

    return feeAmount;
  };
  const [bills, setBills] = useState([]);
  const fetchBills = async () => {
    try {
      const res = await apiRequest("Bill/getAllBill", {
        method: "POST",
        body: JSON.stringify({
          month: months[selectedBillMonth - 1], // "February"
          year: selectedBillYear, // 2026
          patientId: selectedBillPatientId, // optional
        }),
      });

      setBills(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error(e);
      setBills([]);
    }
  };

  useEffect(() => {
    if (activeTab === "bill") {
      fetchBills();
    }
  }, [activeTab, selectedBillMonth, selectedBillYear, selectedBillPatientId]);
  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      const pid = getId(b.patientId);

      const matchPatient =
        selectedBillPatientId === "ALL" ? true : pid === selectedBillPatientId;

      const matchMonth =
        String(b.month || "")
          .trim()
          .toLowerCase() ===
        String(months[selectedBillMonth - 1] || "")
          .trim()
          .toLowerCase();

      const matchYear = Number(b.year) === Number(selectedBillYear);

      return matchPatient && matchMonth && matchYear;
    });
  }, [bills, selectedBillPatientId, selectedBillMonth, selectedBillYear]);
  const totalGeneratedBillAmount = useMemo(() => {
    return filteredBills.reduce(
      (sum, b) => sum + Number(b.NetBilledAmount || 0),
      0,
    );
  }, [filteredBills]);

  const totalReceivedAmt = useMemo(() => {
    return filteredBills.reduce(
      (sum, b) => sum + Number(b.ReceivedAmount || 0),
      0,
    );
  }, [filteredBills]);

  const totalPendingAmt = useMemo(() => {
    return filteredBills.reduce((sum, b) => {
      const pending =
        Number(b.NetBilledAmount || 0) - Number(b.ReceivedAmount || 0);
      return sum + Math.max(pending, 0);
    }, 0);
  }, [filteredBills]);
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
  const selectedBillPatient = useMemo(() => {
    if (selectedBillPatientId === "ALL") return null;
    return patients.find((p) => p._id === selectedBillPatientId) || null;
  }, [patients, selectedBillPatientId]);

  const billFromDate = useMemo(
    () => new Date(selectedBillYear, selectedBillMonth - 1, 1),
    [selectedBillYear, selectedBillMonth],
  );
  const billToDate = useMemo(() => {
    if (!selectedBillPatientId || selectedBillPatientId === "ALL") return null;

    const patientCompletedSessions = completedBillSessions
      .filter((s) => getId(s.patientId) === selectedBillPatientId)
      .map((s) => new Date(s.sessionDate))
      .filter((d) => !isNaN(d.getTime()));

    if (patientCompletedSessions.length === 0) return null;

    // latest date
    return new Date(Math.max(...patientCompletedSessions));
  }, [completedBillSessions, selectedBillPatientId]);
  const ratePerSessionForSelected = useMemo(() => {
    if (!selectedBillPatient) return 0;
    return calcRatePerSession(selectedBillPatient);
  }, [selectedBillPatient]);
  const [paymentDialog, setPaymentDialog] = useState({
    open: false,
    bill: null,
  });

  const [paymentMode, setPaymentMode] = useState("Full Payment");
  const [partialAmount, setPartialAmount] = useState("");

  const openPaymentDialog = (bill) => {
    const net = Number(
      bill?.NetBilledAmount ??
        bill?.TotalBilledAmount ??
        bill?.totalAmount ??
        0,
    );
    const received = Number(bill?.ReceivedAmount ?? 0);

    const pending = Math.max(net - received, 0);

    setPaymentDialog({ open: true, bill: { ...bill, pending } });
    setPaymentMode("Full Payment");
    setPartialAmount("");
  };

  const closePaymentDialog = () => {
    setPaymentDialog({ open: false, bill: null });
    setPaymentMode("Full Payment");
    setPartialAmount("");
  };
  useEffect(() => {
    if (!paymentDialog.open || !paymentDialog.bill) return;
    if (paymentMode !== "Partial Payment") return;

    const pending = Number(paymentDialog.bill.pending || 0);

    // only switch when user typed exactly pending
    if (partialAmount === "") return;

    const n = Number(partialAmount);
    if (Number.isNaN(n)) return;

    if (n === pending && pending > 0) {
      setPaymentMode("Full Payment");
    }
  }, [paymentMode, partialAmount, paymentDialog.open, paymentDialog.bill]);

  const handlePartialChange = (e) => {
    const pending = Number(paymentDialog.bill?.pending || 0);
    const val = e.target.value; // keep as string

    // allow empty
    if (val === "") {
      setPartialAmount("");
      return;
    }

    // allow only digits (no minus, no e, no +)
    if (!/^\d*$/.test(val)) return;

    const num = Number(val);

    // clamp to pending
    if (num > pending) {
      setPartialAmount(String(pending));
      return;
    }

    setPartialAmount(val);
  };
  const selectedGeneratedBill = useMemo(() => {
    if (selectedBillPatientId === "ALL") return null;

    // pick latest generated bill for that patient in current month/year filter
    const list = filteredBills.filter(
      (b) => getId(b.patientId) === selectedBillPatientId,
    );

    if (list.length === 0) return null;

    // latest by startDate (or createdAt if you have)
    return list.sort(
      (a, b) => new Date(b.startDate) - new Date(a.startDate),
    )[0];
  }, [filteredBills, selectedBillPatientId]);

  const updateBillPayment = async (billId, receivedAmount, paymentType) => {
    return await apiRequest("Bill/receivePayment", {
      method: "POST",
      body: JSON.stringify({
        billId,
        receivedAmount,
        paymentType,
        notes: "",
        feedback: "",
      }),
    });
  };
  const handleDownloadBill = async () => {
    const bill = billPreview.bill;
    if (!bill) return;

    try {
      setBillPreview((s) => ({ ...s, loading: true }));

      let completedSessions = [];

      if (billPreview.includeSessions) {
        completedSessions = await fetchCompletedSessionsForBill(bill);
      }

      downloadBillPdf({
        bill,
        includeSessions: billPreview.includeSessions,
        completedSessions,
      });

      setBillPreview((s) => ({ ...s, open: false, loading: false }));
    } catch (err) {
      console.error("Bill PDF download failed:", err);
      setBillPreview((s) => ({ ...s, loading: false }));
    }
  };
  const downloadBillPdf = ({
    bill,
    includeSessions,
    completedSessions = [],
  }) => {
    const doc = new jsPDF();

    const patientName = bill?.patientId?.patientName || "N/A";
    const patientCode = bill?.patientId?.patientCode || "";
    const physioName = bill?.physioId?.physioName || "N/A";

    const totalSessions = Number(bill?.TotalSessionCount || 0);
    const rate = Number(bill?.ratePerSession || 0);
    const totalAmount = Number(bill?.TotalBilledAmount || 0);
    const deducted = Number(bill?.DeductedFromAdvance || 0);
    const net = Number(bill?.NetBilledAmount || 0);
    const received = Number(bill?.ReceivedAmount || 0);
    const pending = Math.max(net - received, 0);

    // Header
    doc.setFontSize(16);
    doc.text("NEO-PHYSIO - BILL", 14, 16);

    doc.setFontSize(11);
    doc.text(`Patient: ${patientName} (${patientCode})`, 14, 26);
    doc.text(`Physio: ${physioName}`, 14, 32);
    doc.text(
      `Bill Month: ${months[selectedBillMonth - 1]} ${selectedBillYear}`,
      14,
      38,
    );

    // Summary
    autoTable(doc, {
      startY: 45,
      head: [["Item", "Value"]],
      body: [
        ["Total Sessions", String(totalSessions)],
        ["Rate / Session", `Rs. ${rate.toFixed(2)}`],
        ["Total Amount", `Rs. ${totalAmount.toFixed(2)}`],
        ["Deducted From Advance", `Rs. ${deducted.toFixed(2)}`],
        ["Net Billed Amount", `Rs. ${net.toFixed(2)}`],
        ["Received Amount", `Rs. ${received.toFixed(2)}`],
        ["Pending Amount", `Rs. ${pending.toFixed(2)}`],
        ["Payment Status", bill?.paymentStatus || "N/A"],
        ["Payment Type", bill?.paymentType || "-"],
      ],
      styles: { fontSize: 10 },
    });

    // Sessions + feedback
    if (includeSessions) {
      const rows = completedSessions.map((s, idx) => [
        idx + 1,
        fmt(s.sessionDate),
        s?.sessionFeedbackPros || s?.Feedback || "—",
      ]);

      const nextY = doc.lastAutoTable.finalY + 10;

      doc.setFontSize(12);
      doc.text("Completed Sessions (with feedback)", 14, nextY);

      autoTable(doc, {
        startY: nextY + 4,
        head: [["#", "Session Date", "Feedback"]],
        body: rows.length ? rows : [["", "No completed sessions", ""]],
        styles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 35 },
          2: { cellWidth: 130 },
        },
      });
    }

    // filename
    const fileName =
      `Bill_${patientName}_${selectedBillMonth}-${selectedBillYear}.pdf`
        .replaceAll(" ", "_")
        .replace(/[^\w\-\.]/g, "");

    doc.save(fileName);
  };
  const billedAmountFromBills = filteredPatients.reduce(
    (sum, p) => sum + Number(p.Billed || 0),
    0,
  );
  const unbilledAmountFromIncome = useMemo(() => {
    return Math.max(totalIncomeByFilter - billedAmountFromBills, 0);
  }, [totalIncomeByFilter, billedAmountFromBills]);
  const handleSendBill = async (id) => {
    try {
      await apiRequest("Bill/updateSendStatus", {
        method: "POST",
        body: JSON.stringify({ billId: id }),
      });

      // update UI instantly
      setBills((prev) =>
        prev.map((b) => (b._id === id ? { ...b, isSend: true } : b)),
      );
    } catch (error) {
      console.error(error);
    }
  };
  const sortedBills = useMemo(() => {
    const pending = [];
    const paid = [];

    filteredBills.forEach((b) => {
      const net = Number(b?.NetBilledAmount || 0);
      const received = Number(b?.ReceivedAmount || 0);

      const isPaid = received >= net;

      if (isPaid) paid.push(b);
      else pending.push(b);
    });

    return [...pending, ...paid];
  }, [filteredBills]);

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
                <div className="flex flex-col gap-2 text-sm font-semibold md:flex-row md:gap-8">
                  <div className="flex justify-between md:w-[220px]">
                    <span>Total Income:</span>
                    <span>₹{totalIncomeByFilter.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between md:w-[220px] text-green-700">
                    <span>Billed Amount:</span>
                    <span>₹{billedAmountFromBills.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between md:w-[220px] text-red-600">
                    <span>Unbilled Amount:</span>
                    <span>₹{unbilledAmountFromIncome.toFixed(2)}</span>
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
                    <SelectContent className="h-[200px]">
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
                    <SelectContent className="h-[200px]">
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
                    {/* <SelectContent className="h-[200px]">
                     */}
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
                    <SelectContent className="h-[200px]">
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
                    <SelectContent className="h-[200px]">
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
                            {selectedPhysioId !== "ALL"
                              ? p.physioDetails?.find(
                                  (physio) =>
                                    physio.physioId === selectedPhysioId,
                                )?.physioName
                              : p.physioDetails
                                  ?.map((physio) => physio.physioName)
                                  .join(", ") || "N/A"}{" "}
                          </td>{" "}
                          <td className="p-2 border text-center">
                            {" "}
                            {selectedPhysioId !== "ALL"
                              ? p.physioDetails?.find(
                                  (physio) =>
                                    physio.physioId === selectedPhysioId,
                                )?.sessionCount
                              : p.totalCompletedSessions}{" "}
                          </td>{" "}
                          <td className="p-2 border text-center whitespace-nowrap">
                            {" "}
                            ₹{p.feePerSession || 0} ({p.feeType || "N/A"}){" "}
                          </td>{" "}
                          <td className="p-2 border text-center font-semibold whitespace-nowrap">
                            {" "}
                            ₹{Number(p.totalIncome || 0).toFixed(2)}{" "}
                          </td>{" "}
                        </tr>
                      ))}{" "}
                  </tbody>{" "}
                </table>{" "}
              </div>{" "}
            </CardContent>{" "}
          </Card>
          {/* MOBILE VIEW - INCOME CARDS */}
          <Card className="medical-card md:hidden">
            <CardHeader>
              <CardTitle className="text-base">
                Patients (
                {
                  filteredPatients.filter((p) => p.totalCompletedSessions > 0)
                    .length
                }
                )
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              {filteredPatients.filter((p) => p.totalCompletedSessions > 0)
                .length === 0 ? (
                <div className="text-center text-sm text-gray-500 py-6">
                  No income records found for selected filters.
                </div>
              ) : (
                filteredPatients
                  .filter((p) => p.totalCompletedSessions > 0)
                  .map((p) => (
                    <motion.div
                      key={p._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className="border rounded-xl p-4 bg-white shadow-sm"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-gray-800">
                            {p.patientName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {p.patientCode || ""}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Total Income</p>
                          <p className="font-bold text-gray-900">
                            ₹{Number(p.totalIncome || 0).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Body */}
                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                        <div className="p-2 rounded-lg bg-gray-50">
                          <p className="text-xs text-gray-500">Physio</p>
                          <p className="font-medium text-gray-800">
                            {p.physioName || "N/A"}
                          </p>
                        </div>

                        <div className="p-2 rounded-lg bg-gray-50">
                          <p className="text-xs text-gray-500">Completed</p>
                          <p className="font-medium text-gray-800">
                            {p.totalCompletedSessions || 0}
                          </p>
                        </div>

                        <div className="p-2 rounded-lg bg-gray-50 col-span-2">
                          <p className="text-xs text-gray-500">Fees</p>
                          <p className="font-medium text-gray-800">
                            ₹{p.feePerSession || 0}{" "}
                            <span className="text-xs text-gray-500">
                              ({p.feeType || "N/A"})
                            </span>
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))
              )}
            </CardContent>
          </Card>
        </>
      )}
      {activeTab === "bill" && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Bill Generate Dashboard</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Top Summary */}
              <div className="flex flex-wrap justify-between items-center w-full gap-4">
                <h3 className="text-lg font-semibold">
                  Generated Bills:{" "}
                  <span className="ml-2">{filteredBills.length}</span>
                </h3>
                <h3 className="text-lg font-semibold">
                  Total Received Amount:{" "}
                  <span className="ml-2">₹{totalReceivedAmt.toFixed(2)}</span>
                </h3>{" "}
                <h3 className="text-lg font-semibold">
                  Total Pending Amount:{" "}
                  <span className="ml-2">₹{totalPendingAmt.toFixed(2)}</span>
                </h3>{" "}
                <h3 className="text-lg font-semibold">
                  Total Billed Amount:{" "}
                  <span className="ml-2">
                    ₹{totalGeneratedBillAmount.toFixed(2)}
                  </span>
                </h3>
              </div>

              {/* Filters + Button Row */}
              <div className="flex flex-wrap items-center gap-3 w-full">
                <Select
                  value={selectedBillPatientId}
                  onValueChange={(v) => setSelectedBillPatientId(v)}
                >
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="Filter by Patients" />
                  </SelectTrigger>
                  <SelectContent className="h-[200px]">
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
                  value={String(selectedBillMonth)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Select Month" />
                  </SelectTrigger>
                  <SelectContent className="h-[200px]">
                    {months.map((m, idx) => (
                      <SelectItem key={idx} value={String(idx + 1)}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  onValueChange={(val) => setSelectedBillYear(Number(val))}
                  value={String(selectedBillYear)}
                >
                  <SelectTrigger className="w-28">
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent className="h-[200px]">
                    {[
                      2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034,
                      2035, 2036, 2037, 2038, 2039, 2040,
                    ].map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={fetchBills}>Apply</Button>

                {/* RIGHT SIDE BUTTON */}
                {/* <Button
                className="ml-auto"
                disabled={!selectedBillPatient}
                onClick={generateBillAndPdf}
              >
                Show Bill (PDF)
              </Button> */}
              </div>

              {/* Patient Details Card (show only when patient selected) */}
              <Card className="medical-card hidden md:block ">
                <CardContent>
                  <div className="hidden md:block overflow-x-auto mt-5">
                    <table className="min-w-full text-sm border rounded-lg">
                      <thead className="bg-gray-100 text-gray-700">
                        <tr>
                          <th className="px-3 py-2 text-left">Patient</th>
                          <th className="px-3 py-2 text-left">Physio</th>
                          <th className="px-3 py-2 text-left">
                            Session Start - To date
                          </th>
                          <th className="px-3 py-2 text-left">Sessions</th>
                          <th className="px-3 py-2 text-left">Rate/Session</th>
                          <th className="px-3 py-2 text-left">Total Amount</th>
                          <th className="px-3 py-2 text-left">
                            Deducted From Advance
                          </th>
                          <th className="px-3 py-2 text-left">
                            Net Billed Amount
                          </th>

                          <th className="px-3 py-2 text-left">
                            Received Amount
                          </th>
                          <th className="px-3 py-2 text-left">
                            Pending Amount
                          </th>

                          <th className="px-3 py-2 text-left">
                            Payment Status
                          </th>
                          <th className="px-3 py-2 text-left">Payment Type</th>
                          <th className="px-3 py-2 text-left">Bill Generate</th>
                          <th className="px-3 py-2 text-left">
                            Receive Payment
                          </th>
                          <th className="px-3 py-2 text-left">Bill Send</th>
                        </tr>
                      </thead>
                      <tbody>
                        {" "}
                        {sortedBills.length === 0 ? (
                          // {filteredBills.length === 0 ? (
                          <tr>
                            <td
                              colSpan={10}
                              className="p-4 text-center text-gray-500"
                            >
                              No bills found for selected filters
                            </td>
                          </tr>
                        ) : (
                          // .filter((p) => p.totalCompletedSessions > 0)
                          sortedBills.map((b) => (
                            // filteredBills.map((b) => (
                            <tr
                              key={b._id}
                              className="hover:bg-gray-50 text-sm md:text-base"
                            >
                              <td className="p-2 border whitespace-nowrap">
                                {b?.patientId?.patientName || "N/A"}{" "}
                                <span className="text-xs text-gray-500">
                                  ({b?.patientId?.patientCode || ""})
                                </span>
                              </td>
                              <td className="p-2 border whitespace-nowrap">
                                {b?.physioId?.physioName || "N/A"}
                              </td>{" "}
                              <td className="p-2 border whitespace-nowrap">
                                {b?.patientId?.sessionStartDate || b?.startDate
                                  ? new Date(
                                      b?.patientId?.sessionStartDate ||
                                        b?.startDate,
                                    )
                                      .toLocaleDateString("en-GB")
                                      .replace(/\//g, "-")
                                  : "-"}
                                {" - "}
                                {b?.ToDate
                                  ? new Date(b.ToDate)
                                      .toLocaleDateString("en-GB")
                                      .replace(/\//g, "-")
                                  : "-"}
                              </td>
                              <td className="p-2 border text-center">
                                {b?.TotalSessionCount ?? 0}
                              </td>
                              <td className="p-2 border text-center whitespace-nowrap">
                                ₹{Number(b?.ratePerSession || 0).toFixed(2)}
                              </td>
                              <td className="p-2 border text-center font-semibold whitespace-nowrap ">
                                ₹{Number(b?.TotalBilledAmount || 0).toFixed(2)}
                              </td>
                              <td className="p-2 border text-center font-semibold whitespace-nowrap bg-yellow-100">
                                ₹
                                {Number(b?.DeductedFromAdvance || 0).toFixed(2)}
                              </td>
                              <td className="p-2 border text-center font-semibold whitespace-nowrap bg-blue-100">
                                ₹{Number(b?.NetBilledAmount || 0).toFixed(2)}
                              </td>
                              <td className="p-2 border text-center whitespace-nowrap bg-green-300">
                                ₹{Number(b?.ReceivedAmount || 0).toFixed(2)}
                              </td>
                              <td className="p-2 border text-center whitespace-nowrap bg-[#ED3421]">
                                ₹
                                {Number(
                                  b?.NetBilledAmount -
                                    (b?.ReceivedAmount +
                                      b?.DeductedFromAdvance || 0),
                                ).toFixed(2)}
                              </td>
                              <td className="p-2 border whitespace-nowrap">
                                {b?.paymentStatus || "N/A"}
                              </td>
                              <td className="p-2 border whitespace-nowrap">
                                {b?.paymentType || "-"}
                              </td>
                              <td className="p-2 border whitespace-nowrap">
                                <Button
                                  onClick={() => {
                                    const net = Number(b?.NetBilledAmount || 0);
                                    const received = Number(
                                      b?.ReceivedAmount || 0,
                                    );
                                    const pending = Math.max(net - received, 0);

                                    setBillPreview({
                                      open: true,
                                      bill: { ...b, pending },
                                      includeSessions: false,
                                      loading: false,
                                    });
                                  }}
                                >
                                  Generate Bill
                                </Button>
                              </td>{" "}
                              <td className="p-2 border whitespace-nowrap">
                                <Button
                                  size="sm"
                                  onClick={() => openPaymentDialog(b)}
                                  disabled={
                                    Number(b?.TotalBilledAmount || 0) -
                                      Number(b?.ReceivedAmount || 0) <=
                                    0
                                  }
                                  className={
                                    Number(b?.TotalBilledAmount || 0) -
                                      Number(b?.ReceivedAmount || 0) <=
                                    0
                                      ? "bg-green-600 text-white hover:bg-green-600 cursor-not-allowed"
                                      : ""
                                  }
                                >
                                  {Number(b?.TotalBilledAmount || 0) -
                                    Number(b?.ReceivedAmount || 0) <=
                                  0 ? (
                                    <span className="flex items-center gap-2">
                                      <CheckCircle size={16} />
                                      Payment Received
                                    </span>
                                  ) : (
                                    "Receive Payment"
                                  )}
                                </Button>
                              </td>
                              <td className="p-2 border whitespace-nowrap">
                                <Button
                                  size="sm"
                                  onClick={() => handleSendBill(b._id)}
                                  disabled={b?.isSend}
                                  className={
                                    b?.isSend
                                      ? "bg-green-600 text-white hover:bg-green-600 cursor-not-allowed"
                                      : ""
                                  }
                                >
                                  {b?.isSend ? (
                                    <span className="flex items-center gap-2">
                                      <CheckCircle size={16} />
                                      Bill Sent
                                    </span>
                                  ) : (
                                    "Send Bill"
                                  )}
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}{" "}
                      </tbody>{" "}
                    </table>{" "}
                  </div>{" "}
                </CardContent>{" "}
              </Card>
            </CardContent>
          </Card>
          {/* ✅ MOBILE VIEW - BILL CARDS */}
          <Card className="medical-card md:hidden">
            <CardHeader>
              <CardTitle className="text-base">
                Bills ({sortedBills.length})
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              {sortedBills.length === 0 ? (
                <div className="text-center text-sm text-gray-500 py-6">
                  No bills found for selected filters.
                </div>
              ) : (
                sortedBills.map((b) => {
                  const net = Number(b?.NetBilledAmount || 0);
                  const received = Number(b?.ReceivedAmount || 0);
                  const deducted = Number(b?.DeductedFromAdvance || 0);

                  //  pending logic (use NET - RECEIVED)
                  const pending = Math.max(net - received, 0);
                  const isPaid = pending <= 0;

                  const fromDate =
                    b?.patientId?.sessionStartDate || b?.startDate;
                  const toDate = b?.ToDate;

                  return (
                    <motion.div
                      key={b._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className={`border rounded-xl p-4 bg-white shadow-sm ${
                        isPaid ? "border-green-200" : "border-red-200"
                      }`}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-gray-800">
                            {b?.patientId?.patientName || "N/A"}{" "}
                            <span className="text-xs text-gray-500">
                              ({b?.patientId?.patientCode || ""})
                            </span>
                          </p>
                          <p className="text-xs text-gray-500">
                            Physio: {b?.physioId?.physioName || "N/A"}
                          </p>
                        </div>

                        <div
                          className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            isPaid
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {isPaid ? "Paid" : "Pending"}
                        </div>
                      </div>

                      {/* Period */}
                      <div className="mt-2 text-xs text-gray-600">
                        Period:{" "}
                        {fromDate
                          ? new Date(fromDate).toLocaleDateString()
                          : "-"}{" "}
                        {" - "}
                        {toDate ? new Date(toDate).toLocaleDateString() : "-"}
                      </div>

                      {/* Amounts */}
                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                        <div className="p-2 rounded-lg bg-gray-50">
                          <p className="text-xs text-gray-500">Sessions</p>
                          <p className="font-medium">
                            {b?.TotalSessionCount ?? 0}
                          </p>
                        </div>

                        <div className="p-2 rounded-lg bg-gray-50">
                          <p className="text-xs text-gray-500">Rate</p>
                          <p className="font-medium">
                            ₹{Number(b?.ratePerSession || 0).toFixed(2)}
                          </p>
                        </div>

                        <div className="p-2 rounded-lg bg-blue-50">
                          <p className="text-xs text-gray-500">Net</p>
                          <p className="font-bold">₹{net.toFixed(2)}</p>
                        </div>

                        <div
                          className={`p-2 rounded-lg ${isPaid ? "bg-green-50" : "bg-red-50"}`}
                        >
                          <p className="text-xs text-gray-500">Pending</p>
                          <p className="font-bold">₹{pending.toFixed(2)}</p>
                        </div>

                        <div className="p-2 rounded-lg bg-gray-50 col-span-2">
                          <p className="text-xs text-gray-500">
                            Received / Deducted
                          </p>
                          <p className="font-medium">
                            ₹{received.toFixed(2)}{" "}
                            <span className="text-xs text-gray-500">
                              (Deducted: ₹{deducted.toFixed(2)})
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <Button
                          className="w-full"
                          onClick={() => {
                            const pendingNow = Math.max(net - received, 0);
                            setBillPreview({
                              open: true,
                              bill: { ...b, pending: pendingNow },
                              includeSessions: false,
                              loading: false,
                            });
                          }}
                        >
                          Generate
                        </Button>

                        <Button
                          className="w-full"
                          variant="outline"
                          onClick={() => openPaymentDialog(b)}
                          disabled={pending <= 0}
                        >
                          {pending <= 0 ? (
                            <span className="flex items-center gap-2">
                              <CheckCircle size={16} /> Paid
                            </span>
                          ) : (
                            "Receive"
                          )}
                        </Button>

                        <Button
                          className="w-full col-span-2"
                          onClick={() => handleSendBill(b._id)}
                          disabled={b?.isSend}
                          variant={b?.isSend ? "secondary" : "default"}
                        >
                          {b?.isSend ? (
                            <span className="flex items-center gap-2">
                              <CheckCircle size={16} /> Bill Sent
                            </span>
                          ) : (
                            "Send Bill"
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </>
      )}
      <Dialog
        open={paymentDialog.open}
        onOpenChange={(v) => !v && closePaymentDialog()}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Payment Received</DialogTitle>
            <DialogDescription>
              {paymentDialog.bill?.patientId?.patientName || "Patient"} —
              Pending:{" "}
              <span className="font-semibold">
                ₹{" "}
                {Number(
                  paymentDialog.bill?.NetBilledAmount -
                    paymentDialog.bill?.ReceivedAmount || 0,
                ).toFixed(2)}
              </span>
            </DialogDescription>
          </DialogHeader>

          {/* Payment type dropdown */}
          <div className="space-y-2">
            <Label>Payment Type</Label>
            <Select value={paymentMode} onValueChange={setPaymentMode}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment type" />
              </SelectTrigger>
              <SelectContent className="h-[200px]">
                <SelectItem value="Full Payment">Full Payment</SelectItem>
                <SelectItem value="Partial Payment">Partial Payment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Partial amount input */}
          {paymentMode === "Partial Payment" && (
            <div className="space-y-2">
              <Label>Partial Amount</Label>
              <Input
                type="text"
                inputMode="numeric"
                value={partialAmount}
                onChange={handlePartialChange}
                placeholder="Enter amount"
              />
              <p className="text-xs text-gray-500">
                Amount cannot exceed pending bill amount.
              </p>
            </div>
          )}

          {/* If FULL, show auto amount */}
          {paymentMode === "Full Payment" && (
            <div className="text-sm text-gray-700">
              Amount to receive:{" "}
              <span className="font-semibold">
                ₹{Number(paymentDialog.bill?.pending || 0).toFixed(2)}
              </span>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closePaymentDialog}>
              Cancel
            </Button>

            <Button
              onClick={async () => {
                const billId = paymentDialog.bill?._id;
                const pending = Number(paymentDialog.bill?.pending || 0);

                const amt =
                  paymentMode === "Full Payment"
                    ? pending
                    : Number(partialAmount || 0);

                if (!billId) return;
                if (amt <= 0) return;
                if (amt > pending) return; // safety

                try {
                  await updateBillPayment(billId, amt, paymentMode);

                  closePaymentDialog();
                  fetchBills(); // ✅ refresh bill tab table
                  // fetchData(); // (optional, only if you need income refresh)
                } catch (err) {
                  console.error("Payment update failed:", err);
                }
              }}
            >
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={billPreview.open}
        onOpenChange={(v) =>
          !v && setBillPreview((s) => ({ ...s, open: false }))
        }
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Generate Bill</DialogTitle>
            <DialogDescription>
              Review summary. Choose whether to include sessions + feedback in
              PDF.
            </DialogDescription>
          </DialogHeader>

          {billPreview.bill && (
            <div className="space-y-3 text-sm">
              <div className="p-3 rounded-md border bg-gray-50">
                <div className="font-semibold">
                  {billPreview.bill?.patientId?.patientName || "Patient"}{" "}
                  <span className="text-gray-500 text-xs">
                    ({billPreview.bill?.patientId?.patientCode || ""})
                  </span>
                </div>
                <div className="text-gray-700">
                  Physio: {billPreview.bill?.physioId?.physioName || "N/A"}
                </div>
                <div className="text-gray-700">
                  Month: {months[selectedBillMonth - 1]} {selectedBillYear}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 border rounded">
                  Sessions: {getCompletedCountForPreview(billPreview.bill)}
                </div>
                <div className="p-2 border rounded">
                  Period: {getPreviewDateRange(billPreview.bill)}
                </div>
                <div className="p-2 border rounded">
                  Rate: ₹
                  {Number(billPreview.bill?.ratePerSession || 0).toFixed(2)}
                </div>
                <div className="p-2 border rounded">
                  Net: ₹
                  {Number(billPreview.bill?.NetBilledAmount || 0).toFixed(2)}
                </div>
                <div className="p-2 border rounded">
                  Pending: ₹{Number(billPreview.bill?.pending || 0).toFixed(2)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="includeSessions"
                  type="checkbox"
                  checked={billPreview.includeSessions}
                  onChange={(e) =>
                    setBillPreview((s) => ({
                      ...s,
                      includeSessions: e.target.checked,
                    }))
                  }
                />
                <Label htmlFor="includeSessions">
                  Include all completed sessions + feedback in PDF
                </Label>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setBillPreview((s) => ({ ...s, open: false }))}
            >
              Cancel
            </Button>
            <Button onClick={handleDownloadBill} disabled={billPreview.loading}>
              {billPreview.loading ? "Preparing..." : "Download PDF"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Income;
