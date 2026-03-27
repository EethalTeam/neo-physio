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
import neoLogo from "../Assets/images/logo_png.png";
import neoQR from "../Assets/images/qr.jpg";
import { toast } from "@/components/ui/use-toast";

const Income = () => {
  const [patients, setPatients] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [badDebtDialog, setBadDebtDialog] = useState({
    open: false,
    billId: null,
  });
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
  const [discountAmount, setDiscountAmount] = useState("");
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
  const handleManualGenerateBill = async () => {
    try {
      if (!selectedBillPatientId || selectedBillPatientId === "ALL") {
        toast({
          title: "Select Patient",
          description: "Please select one patient to generate bill",
          variant: "destructive",
        });
        return;
      }

      const response = await apiRequest("Bill/createBill", {
        method: "POST",
        body: JSON.stringify({
          patientId: selectedBillPatientId,
          month: months[selectedBillMonth - 1],
          year: selectedBillYear,
        }),
      });

      // if backend sends duplicate / validation message
      if (
        response?.message ===
          `Bill already exists for ${months[selectedBillMonth - 1]} ${selectedBillYear}` ||
        response?.message?.toLowerCase().includes("already exists") ||
        response?.message?.toLowerCase().includes("failed")
      ) {
        toast({
          title: "Error",
          description: response.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: response?.message || "Manual bill generated successfully",
      });

      await fetchBills();
      await fetchData();
    } catch (error) {
      console.error(error);

      toast({
        title: "Error",
        description: error?.message || "Failed to generate bill",
        variant: "destructive",
      });
    }
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

    const directRate = Number(
      patient.feePerSession ?? patient.ratePerSession ?? 0,
    );
    if (directRate > 0) return directRate;

    const feesTypeId = getId(
      patient.feesTypeId ?? patient.feeTypeId ?? patient.FeesTypeId,
    );

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
  const totalDiscountAmt = useMemo(() => {
    return filteredBills.reduce((sum, bill) => {
      return sum + Number(bill?.DiscountAmount || 0);
    }, 0);
  }, [filteredBills]);

  const getPendingAmount = (bill) => {
    const net = Number(bill?.NetBilledAmount || 0);
    const discount = Number(bill?.DiscountAmount || 0);
    const received = Number(bill?.ReceivedAmount || 0);
    const isBadDebt = Boolean(bill?.isBadDebt);

    const finalPayable = Math.max(net - discount, 0);

    if (isBadDebt) return 0;

    return Math.max(finalPayable - received, 0);
  };

  const totalPendingAmt = useMemo(() => {
    return filteredBills.reduce((sum, b) => {
      return sum + getPendingAmount(b);
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
    const net = Number(bill?.NetBilledAmount || 0);
    const discount = Number(bill?.DiscountAmount || 0);
    const received = Number(bill?.ReceivedAmount || 0);

    const finalPayable = Math.max(net - discount, 0);
    const pending = Math.max(finalPayable - received, 0);

    setPaymentDialog({
      open: true,
      bill: {
        ...bill,
        pending,
        finalPayable,
      },
    });

    setPaymentMode("Full Payment");
    setPartialAmount("");
    setDiscountAmount("");
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

  const updateBillPayment = async (
    billId,
    amount,
    paymentType,
    discount = 0,
  ) => {
    return await apiRequest("Bill/receivePayment", {
      method: "POST",
      body: JSON.stringify({
        billId,
        receivedAmount: amount,
        discountAmount: Number(discountAmount || 0),
        notes: "",
        feedback: "",
      }),
    });
  };
  const fetchBilledSessionsForBill = async (bill) => {
    try {
      const patientId = getId(bill?.patientId);
      if (!patientId || !bill?._id) return [];

      const allSessions = await apiRequest("Session/getAllSessionsbyPatient", {
        method: "POST",
        body: JSON.stringify({ patientId }),
      });

      const sessionsArr = Array.isArray(allSessions) ? allSessions : [];

      return sessionsArr
        .filter((s) => s.isBilled === true && getId(s.billId) === bill._id)
        .sort((a, b) => new Date(a.sessionDate) - new Date(b.sessionDate));
    } catch (error) {
      console.error("Failed to fetch billed sessions for PDF:", error);
      return [];
    }
  };
  const getBillPaymentStatus = (bill) => {
    const received = Number(bill?.ReceivedAmount || 0);
    const net = Number(bill?.NetBilledAmount || 0);
    const discount = Number(bill?.DiscountAmount || 0);
    const isBadDebt = Boolean(bill?.isBadDebt);

    const finalPayable = Math.max(net - discount, 0);
    const pending = Math.max(finalPayable - received, 0);

    if (isBadDebt) {
      return "Bad Debt";
    }

    if (finalPayable === 0) {
      return "Paid";
    }

    if (pending === 0 && received > 0) {
      return "Paid";
    }

    if (received > 0 && pending > 0) {
      return "Partially Paid";
    }

    return "Pending";
  };

  const handleDownloadBill = async () => {
    const bill = billPreview.bill;
    if (!bill) return;

    try {
      setBillPreview((s) => ({ ...s, loading: true }));

      let billedSessions = [];

      if (billPreview.includeSessions) {
        billedSessions = await fetchBilledSessionsForBill(bill);
      }

      downloadBillPdf({
        bill,
        includeSessions: billPreview.includeSessions,
        billedSessions,
      });

      setBillPreview((s) => ({ ...s, open: false, loading: false }));
    } catch (err) {
      console.error("Bill PDF download failed:", err);
      setBillPreview((s) => ({ ...s, loading: false }));
    }
  };
  const downloadBillPdf = ({ bill, includeSessions, billedSessions = [] }) => {
    try {
      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();

      const patientName = bill?.patientId?.patientName || "N/A";
      const patientCode = bill?.patientId?.patientCode || "N/A";
      const physioName = bill?.physioId?.physioName || "N/A";

      const totalSessions = Number(bill?.TotalSessionCount || 0);
      const totalAmount = Number(
        bill?.NetBilledAmount || bill?.TotalBilledAmount || 0,
      );

      const feeType = String(bill?.feeType || "").toLowerCase();

      let rate = 0;
      let rateLabel = "";
      let descriptionText = "Physiotherapy Session";
      let sessionText = `${totalSessions}`;

      if (feeType === "permonth") {
        rate = Number(bill?.TotalBilledAmount || totalAmount || 0);
        rateLabel = "(Per Month)";
        descriptionText = "Physiotherapy Monthly Package";
        sessionText = "—";
      } else {
        rate =
          Number(bill?.ratePerSession || 0) > 0
            ? Number(bill?.ratePerSession || 0)
            : totalSessions > 0
              ? Number((totalAmount / totalSessions).toFixed(2))
              : 0;
        rateLabel = "(Per Session)";
        descriptionText = "Physiotherapy Session";
        sessionText = `${totalSessions}`;
      }

      const sortedSessions = [...billedSessions].sort(
        (a, b) => new Date(a.sessionDate) - new Date(b.sessionDate),
      );

      const fromDate =
        bill?.startDate ||
        sortedSessions?.[0]?.sessionDate ||
        bill?.patientId?.sessionStartDate ||
        null;

      const toDate =
        bill?.ToDate ||
        sortedSessions?.[sortedSessions.length - 1]?.sessionDate ||
        null;

      const adjustIfSunday = (date) => {
        if (!date) return date;
        const d = new Date(date);
        if (d.getUTCDay() === 0) d.setUTCDate(d.getUTCDate() + 1);
        return d;
      };

      const fmt = (date) => {
        if (!date) return "N/A";
        let d = new Date(date);
        if (Number.isNaN(d.getTime())) return "N/A";
        d = adjustIfSunday(d);
        const day = String(d.getUTCDate()).padStart(2, "0");
        const month = String(d.getUTCMonth() + 1).padStart(2, "0");
        const year = d.getUTCFullYear();
        return `${day}/${month}/${year}`;
      };

      const invoiceNo = bill?.invoiceNo || "N/A";

      const clinicAddress = [
        "Coimbatore, Tamil Nadu",
        "Phone: +91 99439 23231",
        "Email: info@neophysio.com",
        "Website: https://neophysio.in/",
      ];

      const onlinePaymentDetails = [
        "Scan the QR code to pay",
        "UPI ID: lifeisnike@okaxis",
      ];

      const labelColor = [24, 83, 148];
      const textColor = [30, 30, 30];
      const lineColor = [190, 190, 190];
      const tealLine = [120, 200, 215];

      doc.setFillColor(255, 255, 255);
      doc.rect(8, 8, 194, 281, "F");

      // ===== HEADER =====
      doc.addImage(neoLogo, "PNG", 18, 19, 14, 14);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(...labelColor);
      doc.text("NEO PHYSIO", 34, 27);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.text("Physiotherapy & Rehab Center", 34, 33);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...textColor);

      let rightY = 20;
      clinicAddress.forEach((line) => {
        doc.text(line, 118, rightY);
        rightY += 6;
      });

      doc.setFont("helvetica", "bold");
      doc.setTextColor(...labelColor);
      doc.text("No:", 118, 44);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(...textColor);
      doc.text(String(invoiceNo), 145, 44);

      doc.setDrawColor(...lineColor);
      doc.setLineWidth(0.3);
      doc.line(18, 52, 190, 52);

      // ===== TITLE =====
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...labelColor);
      doc.text("Treatment Estimate", pageWidth / 2, 61, { align: "center" });

      doc.setDrawColor(...lineColor);
      doc.line(18, 66, 190, 66);

      // ===== INFO ROWS =====
      const drawInfoRow = (
        y,
        leftLabel,
        leftValue,
        rightLabel = "",
        rightValue = "",
      ) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(...labelColor);
        doc.text(leftLabel, 18, y);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(...textColor);
        doc.text(String(leftValue || "N/A"), 42, y);

        if (rightLabel) {
          doc.setFont("helvetica", "bold");
          doc.setTextColor(...labelColor);
          doc.text(rightLabel, 132, y);

          doc.setFont("helvetica", "normal");
          doc.setTextColor(...textColor);
          doc.text(String(rightValue || "N/A"), 155, y);
        }

        doc.setDrawColor(...lineColor);
        doc.line(18, y + 4, 190, y + 4);
      };

      drawInfoRow(74, "Patient Name:", patientName, "Patient ID:", patientCode);
      drawInfoRow(83, "Treated By:", physioName, "", "");
      drawInfoRow(
        92,
        "Treated From:",
        fmt(fromDate),
        "Treated To:",
        fmt(toDate),
      );

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...labelColor);
      doc.text("No. of Sessions:", 18, 101);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(...textColor);
      doc.text(
        feeType === "permonth" ? "Monthly Plan" : `${totalSessions} Sessions`,
        50,
        101,
      );

      // ===== MAIN TABLE =====
      autoTable(doc, {
        startY: 107,
        margin: { left: 18, right: 20 },
        head: [["DESCRIPTION", "UNIT COST", "NO. OF SESSIONS", "TOTAL COST"]],
        body: [
          [
            descriptionText,
            `Rs. ${rate.toFixed(2)} ${rateLabel}`,
            sessionText,
            `Rs. ${totalAmount.toFixed(2)}`,
          ],
          ["", "", "", ""],
        ],
        theme: "grid",
        styles: {
          fontSize: 8,
          cellPadding: 4,
          textColor,
          lineColor: tealLine,
          lineWidth: 0.2,
          valign: "middle",
        },
        headStyles: {
          fillColor: [30, 170, 190],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          halign: "center",
        },
        columnStyles: {
          0: { cellWidth: 72, halign: "left" },
          1: { cellWidth: 30, halign: "center" },
          2: { cellWidth: 35, halign: "center" },
          3: { cellWidth: 35, halign: "center" },
        },
      });

      let yAfterTable = doc.lastAutoTable.finalY + 12;

      // ===== SUBTOTAL =====
      doc.setDrawColor(...lineColor);
      doc.line(18, yAfterTable, 190, yAfterTable);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(80, 80, 80);
      doc.text("Subtotal:", 22, yAfterTable + 8);

      doc.text(`Rs. ${totalAmount.toFixed(2)}`, 183, yAfterTable + 8, {
        align: "right",
      });

      doc.line(18, yAfterTable + 12, 190, yAfterTable + 12);

      // ===== COMPANY ONLY =====
      const companyY = yAfterTable + 20;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...labelColor);
      doc.text("Company Name:", 18, companyY);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(...textColor);
      doc.text("Neo Physio.", 50, companyY);

      doc.setDrawColor(...lineColor);
      doc.line(18, companyY + 4, 190, companyY + 4);

      // ===== ONLINE PAYMENT =====
      const paymentY = companyY + 14;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...labelColor);
      doc.text("Online Payment:", 18, paymentY);

      doc.addImage(neoQR, "PNG", 18, paymentY + 5, 32, 32);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...textColor);

      let paymentTextY = paymentY + 10;
      onlinePaymentDetails.forEach((line) => {
        doc.text(`• ${line}`, 56, paymentTextY);
        paymentTextY += 6;
      });

      if (includeSessions && sortedSessions.length > 0) {
        doc.addPage();

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(...labelColor);
        doc.text("BILLED SESSION DETAILS", 105, 18, { align: "center" });

        autoTable(doc, {
          startY: 28,
          margin: { left: 12, right: 12 },
          head: [["#", "Date", "Status", "Time", "Feedback / Notes"]],
          body: sortedSessions.map((s, idx) => [
            idx + 1,
            fmt(s.sessionDate),
            s?.sessionStatusId?.sessionStatusName || "N/A",
            s?.sessionFromTime && s?.sessionToTime
              ? `${s.sessionFromTime} - ${s.sessionToTime}`
              : "N/A",
            s?.sessionFeedbackPros ||
              s?.sessionFeedbackCons ||
              s?.sessionCancelReason ||
              "—",
          ]),
          theme: "grid",
          styles: {
            fontSize: 8,
            cellPadding: 3,
            lineColor: [180, 180, 180],
            lineWidth: 0.2,
          },
          headStyles: {
            fillColor: [31, 91, 163],
            textColor: [255, 255, 255],
            fontStyle: "bold",
          },
          columnStyles: {
            0: { cellWidth: 10, halign: "center" },
            1: { cellWidth: 28 },
            2: { cellWidth: 28 },
            3: { cellWidth: 35 },
            4: { cellWidth: 85 },
          },
        });
      } else {
        // ===== NOTE =====
        const noteY = paymentY + 45;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(6);
        doc.setTextColor(...labelColor);
        doc.text("Note:", 16, noteY);

        doc.setFont("helvetica", "italic");
        doc.setFontSize(5.5);
        doc.setTextColor(90, 90, 90);
        doc.text(
          " * This is a treatment estimate only. The invoice will be issued after completion of the treatment.",
          18,
          noteY + 5,
          { maxWidth: 170 },
        );

        // ===== PAGE 1 THANK YOU =====
        const thankY = Math.max(noteY + 18, 270);

        doc.setDrawColor(210, 210, 210);
        doc.line(18, thankY - 4, 190, thankY - 4);

        doc.setFont("helvetica", "bolditalic");
        doc.setFontSize(8.5);
        doc.setTextColor(...labelColor);
        doc.text("Thank you for your visit!", pageWidth / 2, thankY, {
          align: "center",
        });
      }

      const safeFrom = fmt(fromDate).replace(/\//g, "-");
      const safeTo = fmt(toDate).replace(/\//g, "-");

      const fileName = `Invoice_${patientName}_${safeFrom}_to_${safeTo}.pdf`
        .replaceAll(" ", "_")
        .replace(/[^\w\-.]/g, "");

      doc.save(fileName);
    } catch (error) {
      console.error("PDF generation error:", error);
    }
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
      const status = getBillPaymentStatus(b);
      if (status === "Paid") {
        paid.push(b);
      } else {
        pending.push(b);
      }
    });

    return [...pending, ...paid];
  }, [filteredBills]);
  const getBillPaymentType = (bill) => {
    const received = Number(bill?.ReceivedAmount || 0);
    const net = Number(bill?.NetBilledAmount || 0);
    const discount = Number(bill?.DiscountAmount || 0);
    const isBadDebt = Boolean(bill?.isBadDebt);

    const finalPayable = Math.max(net - discount, 0);

    if (isBadDebt) {
      return "Bad Debt";
    }

    if (received >= finalPayable && finalPayable > 0) return "Full Payment";
    if (received > 0 && received < finalPayable) return "Partial Payment";
    if (discount > 0 && received === 0) return "Discount";

    return "-";
  };
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-700";
      case "Partially Paid":
        return "bg-yellow-100 text-yellow-700";
      case "Bad Debt":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };
  // const handleMarkBadDebt = async (billId) => {
  //   try {
  //     const res = await apiRequest("Bill/markBadDebt", {
  //       method: "POST",
  //       body: JSON.stringify({ billId }),
  //     });

  //     if (!res.success) {
  //       throw new Error(res.message || "Failed to mark bad debt");
  //     }

  //     toast({
  //       title: "Success",
  //       description: res.message || "Marked as Bad Debt",
  //       variant: "default", // optional
  //     });

  //     setBills((prev) =>
  //       prev.map((b) =>
  //         b._id === billId
  //           ? {
  //               ...b,
  //               isBadDebt: true,
  //             }
  //           : b,
  //       ),
  //     );
  //   } catch (error) {
  //     console.error(error);

  //     toast({
  //       title: "Error",
  //       description: error.message || "Something went wrong",
  //       variant: "destructive",
  //     });
  //   }
  // };
  const confirmMarkBadDebt = async () => {
    const billId = badDebtDialog.billId;
    if (!billId) return;

    try {
      const res = await apiRequest("Bill/markBadDebt", {
        method: "POST",
        body: JSON.stringify({ billId }),
      });

      if (!res.success) {
        throw new Error(res.message || "Failed to mark bad debt");
      }

      toast({
        title: "Marked",
        description: res.message || "Marked as Bad Debt",
      });

      await fetchBills();

      setBadDebtDialog({ open: false, billId: null });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };
  const totalBadDebtAmount = useMemo(() => {
    return filteredBills
      .filter((b) => b.isBadDebt)
      .reduce((sum, b) => {
        const net = Number(b?.NetBilledAmount || 0);
        const received = Number(b?.ReceivedAmount || 0);
        return sum + Math.max(net - received, 0);
      }, 0);
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
                  Total Discount Amount:{" "}
                  <span className="ml-2 text-purple-600">
                    ₹{totalDiscountAmt.toFixed(2)}
                  </span>
                </h3>
                <h3 className="text-lg font-semibold">
                  Total Bad Debt:{" "}
                  <span className="ml-2 text-red-600">
                    ₹{totalBadDebtAmount.toFixed(2)}
                  </span>
                </h3>
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
                  <SelectContent
                    position="popper"
                    side="bottom"
                    align="start"
                    sideOffset={6}
                    avoidCollisions={false}
                    className="z-[99999] max-h-72 overflow-auto w-[--radix-select-trigger-width] bg-white border shadow-lg h-[200px]"
                  >
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
                  <SelectContent
                    position="popper"
                    side="bottom"
                    align="start"
                    sideOffset={6}
                    avoidCollisions={false}
                    className="z-[99999] max-h-72 overflow-auto w-[--radix-select-trigger-width] bg-white border shadow-lg h-[200px]"
                  >
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
                  <SelectContent
                    position="popper"
                    side="bottom"
                    align="start"
                    sideOffset={6}
                    avoidCollisions={false}
                    className="z-[99999] max-h-72 overflow-auto w-[--radix-select-trigger-width] bg-white border shadow-lg h-[200px]"
                  >
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

                <Button
                  className="ml-auto"
                  onClick={handleManualGenerateBill}
                  disabled={
                    !selectedBillPatientId || selectedBillPatientId === "ALL"
                  }
                >
                  Generate Manual Bill
                </Button>

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
              <Card className="medical-card hidden md:block">
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
                            Discount Amount
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
                          <th className="px-3 py-2 text-left">Is Bad Debt</th>
                        </tr>
                      </thead>

                      <tbody>
                        {sortedBills.length === 0 ? (
                          <tr>
                            <td
                              colSpan={16}
                              className="p-4 text-center text-gray-500"
                            >
                              No bills found for selected filters
                            </td>
                          </tr>
                        ) : (
                          sortedBills.map((b) => {
                            const status = getBillPaymentStatus(b);
                            const paymentType = getBillPaymentType(b);

                            const totalAmount = Number(
                              b?.TotalBilledAmount || 0,
                            );
                            const deductedAmount = Number(
                              b?.DeductedFromAdvance || 0,
                            );
                            const netAmount = Number(b?.NetBilledAmount || 0);
                            const discountAmount = Number(
                              b?.DiscountAmount || 0,
                            );
                            const receivedAmount = Number(
                              b?.ReceivedAmount || 0,
                            );

                            const finalPayable = Math.max(
                              netAmount - discountAmount,
                              0,
                            );
                            const pendingAmount = Math.max(
                              finalPayable - receivedAmount,
                              0,
                            );

                            const fromDate =
                              b?.patientId?.sessionStartDate || b?.startDate;
                            const toDate = b?.ToDate;

                            return (
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
                                </td>

                                <td className="p-2 border whitespace-nowrap">
                                  {fromDate
                                    ? new Date(fromDate)
                                        .toLocaleDateString("en-GB")
                                        .replace(/\//g, "-")
                                    : "-"}
                                  {" - "}
                                  {toDate
                                    ? new Date(toDate)
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

                                <td className="p-2 border text-center font-semibold whitespace-nowrap">
                                  ₹{totalAmount.toFixed(2)}
                                </td>

                                <td className="p-2 border text-center font-semibold whitespace-nowrap bg-yellow-100">
                                  ₹{deductedAmount.toFixed(2)}
                                </td>

                                <td className="p-2 border text-center font-semibold whitespace-nowrap bg-blue-100">
                                  ₹{netAmount.toFixed(2)}
                                </td>

                                <td className="p-2 border text-center whitespace-nowrap bg-green-300">
                                  ₹{receivedAmount.toFixed(2)}
                                </td>

                                <td className="p-2 border text-center whitespace-nowrap bg-red-100">
                                  ₹{pendingAmount.toFixed(2)}
                                </td>

                                <td className="p-2 border text-center whitespace-nowrap bg-purple-100">
                                  ₹{discountAmount.toFixed(2)}
                                </td>

                                <td className="p-2 border whitespace-nowrap">
                                  <span
                                    className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadgeClass(status)}`}
                                  >
                                    {status}
                                  </span>
                                </td>

                                <td className="p-2 border whitespace-nowrap">
                                  {paymentType || "-"}
                                </td>

                                <td className="p-2 border whitespace-nowrap">
                                  <Button
                                    onClick={() => {
                                      setBillPreview({
                                        open: true,
                                        bill: {
                                          ...b,
                                          pending: pendingAmount,
                                          finalPayable,
                                        },
                                        includeSessions: false,
                                        loading: false,
                                      });
                                    }}
                                  >
                                    Generate Bill
                                  </Button>
                                </td>

                                <td className="p-2 border whitespace-nowrap">
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      openPaymentDialog({
                                        ...b,
                                        pending: pendingAmount,
                                        finalPayable,
                                      })
                                    }
                                    disabled={
                                      status === "Paid" || status === "Bad Debt"
                                    }
                                    className={
                                      status === "Paid" || status === "Bad Debt"
                                        ? "bg-green-600 text-white hover:bg-green-600 cursor-not-allowed"
                                        : ""
                                    }
                                  >
                                    {status === "Paid" ? (
                                      <span className="flex items-center gap-2">
                                        <CheckCircle size={16} />
                                        Payment Received
                                      </span>
                                    ) : status === "Bad Debt" ? (
                                      "Bad Debt"
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

                                <td className="p-2 border whitespace-nowrap">
                                  <Button
                                    onClick={() =>
                                      setBadDebtDialog({
                                        open: true,
                                        billId: b._id,
                                      })
                                    }
                                    disabled={b?.isBadDebt || status === "Paid"}
                                    className={`px-2 py-1 text-xs rounded ${
                                      b?.isBadDebt || status === "Paid"
                                        ? "bg-gray-400 cursor-not-allowed text-white"
                                        : "bg-red-500 text-white hover:bg-red-600"
                                    }`}
                                  >
                                    {b?.isBadDebt
                                      ? "Bad Debt"
                                      : status === "Paid"
                                        ? "Paid"
                                        : "Mark Bad Debt"}
                                  </Button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
          {/*  MOBILE VIEW - BILL CARDS */}
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
                  const pending = getPendingAmount(b);
                  const status = getBillPaymentStatus(b);

                  const fromDate =
                    b?.patientId?.sessionStartDate || b?.startDate;
                  const toDate = b?.ToDate;

                  return (
                    <motion.div
                      key={b._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className="border rounded-xl p-4 bg-white shadow-sm"
                    >
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
                          className={`text-xs font-semibold px-2 py-1 rounded-full ${getStatusBadgeClass(status)}`}
                        >
                          {status}
                        </div>
                      </div>

                      <div className="mt-2 text-xs text-gray-600">
                        Period:{" "}
                        {fromDate
                          ? new Date(fromDate).toLocaleDateString()
                          : "-"}{" "}
                        - {toDate ? new Date(toDate).toLocaleDateString() : "-"}
                      </div>

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

                        <div className="p-2 rounded-lg bg-red-50">
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

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <Button
                          className="w-full"
                          onClick={() => {
                            setBillPreview({
                              open: true,
                              bill: { ...b, pending },
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
                          disabled={status === "Paid" || status === "Bad Debt"}
                        >
                          {status === "Paid" ? (
                            <span className="flex items-center gap-2">
                              <CheckCircle size={16} /> Paid
                            </span>
                          ) : status === "Bad Debt" ? (
                            "Bad Debt"
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

                        <Button
                          className="w-full col-span-2 bg-red-500 text-white hover:bg-red-600"
                          onClick={() =>
                            setBadDebtDialog({
                              open: true,
                              billId: b._id,
                            })
                          }
                          disabled={b?.isBadDebt || status === "Paid"}
                        >
                          {b?.isBadDebt
                            ? "Bad Debt"
                            : status === "Paid"
                              ? "Paid"
                              : "Mark Bad Debt"}
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
            <DialogDescription className="space-y-1">
              <div>
                {paymentDialog.bill?.patientId?.patientName || "Patient"} —
                Current Pending:{" "}
                <span className="font-semibold">
                  ₹ {Number(paymentDialog.bill?.pending || 0).toFixed(2)}
                </span>
              </div>

              <div>
                Remaining After This Action:{" "}
                <span className="font-semibold text-blue-600">
                  {(() => {
                    const pending = Number(paymentDialog.bill?.pending || 0);

                    if (paymentMode === "Full Payment") {
                      return `₹ ${(0).toFixed(2)}`;
                    }

                    if (paymentMode === "Partial Payment") {
                      const partial = Number(partialAmount || 0);
                      const finalPending = Math.max(pending - partial, 0);
                      return `₹ ${finalPending.toFixed(2)}`;
                    }

                    if (paymentMode === "Discount") {
                      const discount = Number(discountAmount || 0);
                      const finalPending = Math.max(pending - discount, 0);
                      return `₹ ${finalPending.toFixed(2)}`;
                    }

                    return `₹ ${pending.toFixed(2)}`;
                  })()}
                </span>
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label>Payment Type</Label>
            <Select
              value={paymentMode}
              onValueChange={(value) => {
                setPaymentMode(value);
                setPartialAmount("");
                setDiscountAmount("");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment type" />
              </SelectTrigger>
              <SelectContent className="h-[200px]">
                <SelectItem value="Full Payment">Full Payment</SelectItem>
                <SelectItem value="Partial Payment">Partial Payment</SelectItem>
                <SelectItem value="Discount">Discount</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {paymentMode === "Discount" && (
            <div className="space-y-2">
              <Label>Discount Amount</Label>
              <Input
                type="text"
                inputMode="numeric"
                value={discountAmount}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^\d.]/g, "");
                  setDiscountAmount(value);
                }}
                placeholder="Enter discount amount"
              />
              <p className="text-xs text-gray-500">
                Discount will be reduced from pending amount.
              </p>
            </div>
          )}

          {paymentMode === "Partial Payment" && (
            <div className="space-y-2">
              <Label>Partial Amount</Label>
              <Input
                type="text"
                inputMode="numeric"
                value={partialAmount}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^\d.]/g, "");
                  setPartialAmount(value);
                }}
                placeholder="Enter amount"
              />
              <p className="text-xs text-gray-500">
                Amount cannot exceed pending bill amount.
              </p>
            </div>
          )}

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

                if (!billId) return;

                let amt = 0;
                let discount = 0;

                if (paymentMode === "Full Payment") {
                  amt = pending;
                }

                if (paymentMode === "Partial Payment") {
                  amt = Number(partialAmount || 0);

                  if (amt <= 0) {
                    alert("Enter partial amount");
                    return;
                  }

                  if (amt > pending) {
                    alert("Amount cannot exceed pending amount");
                    return;
                  }
                }

                if (paymentMode === "Discount") {
                  discount = Number(discountAmount || 0);

                  if (discount <= 0) {
                    alert("Enter discount amount");
                    return;
                  }

                  if (discount > pending) {
                    alert("Discount cannot exceed pending amount");
                    return;
                  }
                }

                try {
                  await updateBillPayment(billId, amt, paymentMode, discount);
                  closePaymentDialog();
                  fetchBills();
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
      <Dialog
        open={badDebtDialog.open}
        onOpenChange={(open) =>
          setBadDebtDialog({ open, billId: open ? badDebtDialog.billId : null })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Bad Debt?</DialogTitle>
            <DialogDescription>
              This action will mark the bill as bad debt. This cannot be easily
              undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBadDebtDialog({ open: false, billId: null })}
            >
              Cancel
            </Button>

            <Button variant="destructive" onClick={confirmMarkBadDebt}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Income;
