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
import { FaWhatsapp } from "react-icons/fa";
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
import { useAuth } from "@/contexts/AuthContext";

import html2canvas from "html2canvas";

const Income = () => {
  const [patients, setPatients] = useState([]);
  const [badDebtDialog, setBadDebtDialog] = useState({
    open: false,
    billId: null,
  });
  const { user, getPermissionsByPath } = useAuth();

  const loadImage = (src) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous"; // needed for external images
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = reject;
      img.src = src;
    });

  // Function to download all bills as PDF
  const downloadAllBillsPDF = async () => {
    try {
      const res = await apiRequest("Bill/getAllBill", {
        method: "POST",
        body: JSON.stringify({
          month: months[selectedBillMonth - 1],
          year: selectedBillYear,
          patientId: selectedBillPatientId,
          filterType: billFilterType,
        }),
      });

      const bills = Array.isArray(res) ? res : [];

      if (!bills.length) {
        toast({
          title: "No Bills Found",
          description: "There are no bills for the selected filters.",
          variant: "destructive",
        });
        return;
      }

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();

      const logoBase64 = await loadImage(neoLogo);
      pdf.addImage(logoBase64, "PNG", 10, 10, 25, 25);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(18);
      pdf.text("NEO PHYSIO", 40, 20);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);

      const today = new Date().toLocaleDateString("en-GB");

      pdf.text(`Download Date : ${today}`, pageWidth - 60, 20);
      pdf.text(`Total Bills : ${bills.length}`, 40, 28);
      const totalAmount = bills.reduce(
        (sum, bill) =>
          sum + (bill.NetBilledAmount || bill.TotalBilledAmount || 0),
        0,
      );
      const tableRows = bills.map((bill, index) => [
        index + 1,
        bill.invoiceNo || "-",
        bill.patientId?.patientName || "-",
        bill.NetBilledAmount || bill.TotalBilledAmount || 0,
        bill.createdAt
          ? new Date(bill.createdAt).toLocaleDateString("en-GB")
          : "-",
        bill.paymentType || "-",
      ]);

      autoTable(pdf, {
        startY: 40,
        head: [
          ["#", "Invoice", "Patient Name", "Amount", "Date", "Payment Type"],
        ],
        body: tableRows,
        theme: "grid",
        styles: { fontSize: 10 },
        headStyles: { fillColor: [0, 102, 204] },
      });
      const finalY = pdf.lastAutoTable.finalY + 10;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);

      pdf.text(`Total Amount : Rs. ${totalAmount}`, 14, finalY);

      pdf.save(`Filtered_Bills_${today}.pdf`);
    } catch (err) {
      console.error(err);
    }
  };

  const addHeaderAndContentToPDF = async (elementId, fileName) => {
    const input = document.getElementById(elementId);

    if (!input) {
      console.error("Element not found");
      return;
    }

    const canvas = await html2canvas(input, {
      scale: 2,
    });

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");

    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`${fileName}.pdf`);
  };
  // Usage
  const downloadPageAsPDF = () =>
    addHeaderAndContentToPDF("pageContent", "Full_Page");
  // const downloadbillPageAsPdf = () =>
  //   downloadAllBillsPDF("pageContent1", "Bill_Page");
  // const downloadPageAsPDF = async () => {
  //   const element = document.getElementById("pageContent"); // wrap your page in a div with this id
  //   const canvas = await html2canvas(element, { scale: 2 });

  //   const imgData = canvas.toDataURL("image/png");
  //   const pdf = new jsPDF("p", "mm", "a4");
  //   const imgProps = pdf.getImageProperties(imgData);
  //   const pdfWidth = pdf.internal.pageSize.getWidth();
  //   const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

  //   pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
  //   pdf.save("Page_Download.pdf");
  // };
  // const downloadbillPageAsPdf = async () => {
  //   const element = document.getElementById("pageContent1"); // wrap your page in a div with this id
  //   const canvas = await html2canvas(element, { scale: 2 });

  //   const imgData = canvas.toDataURL("image/png");
  //   const pdf = new jsPDF("p", "mm", "a4");
  //   const imgProps = pdf.getImageProperties(imgData);
  //   const pdfWidth = pdf.internal.pageSize.getWidth();
  //   const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

  //   pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
  //   pdf.save("Page_Download.pdf");
  // };
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [selectedBillMonth, setSelectedBillMonth] = useState(
    new Date().getMonth() + 1,
  );
  const [selectedBillYear, setSelectedBillYear] = useState(
    new Date().getFullYear(),
  );

  const [activeTab, setActiveTab] = useState("income");
  const [billFilterType, setBillFilterType] = useState("lastSession");
  const [physios, setPhysios] = useState([]);
  const [feesType, setFeesType] = useState([]);
  const [billPreview, setBillPreview] = useState({
    open: false,
    bill: null,
    includeSessions: false,
    loading: false,
    mode: "download",
  });
  const [selectedPhysioId, setSelectedPhysioId] = useState("ALL");
  const [selectedPatientId, setSelectedPatientId] = useState("ALL");
  const [selectedBillPatientId, setSelectedBillPatientId] = useState("ALL");
  const [selectedFeeTypeId, setSelectedFeeTypeId] = useState("ALL");
  const [discountAmount, setDiscountAmount] = useState("");
  const monthlyId = "691af5c343be7d5e2861981f"; // monthly
  const sessionId = "691af5dc43be7d5e28619825"; // per session
  const [revertConfirmDialog, setRevertConfirmDialog] = useState({
    open: false,
    bill: null,
  });
  console.log("Phone number for WhatsApp sharing:", billPreview);
  const generateBillPDF = async () => {
    const bill = billPreview.bill;
    if (!bill) return null;

    let billedSessions = [];

    if (billPreview.includeSessions) {
      billedSessions = await fetchBilledSessionsForBill(bill);
    }

    const doc = downloadBillPdf({
      bill,
      includeSessions: billPreview.includeSessions,
      billedSessions,
    });

    return doc.output("blob");
  };
  const handleShareWhatsAppPDF = async () => {
    const pdfBlob = await generateBillPDF();
    if (!pdfBlob) return;

    const fileName = `Bill_${billPreview.bill?.patientId?.patientName || "Patient"}.pdf`;
    const pdfFile = new File([pdfBlob], fileName, { type: "application/pdf" });

    const phone =
      billPreview.bill?.patientId?.patientNumber ||
      billPreview.bill?.patientId?.patientAltNum;

    const billId = billPreview.bill?._id;

    // ✅ Try Web Share API first (works on mobile — can share file directly to WhatsApp)
    if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      try {
        await navigator.share({
          files: [pdfFile],
          title: "Bill",
          text: "Please find your bill attached.",
        });
        if (billId) await handleSendBill(billId);
        return; // Done — user picks WhatsApp from share sheet
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Share failed:", err);
        }
      }
    }

    // ✅ Fallback for desktop: auto-download PDF + open WhatsApp Web
    const url = window.URL.createObjectURL(pdfBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    if (!phone) {
      toast({
        title: "Phone number not found",
        description: "Please share the downloaded PDF manually.",
        variant: "destructive",
      });
      if (billId) await handleSendBill(billId);
      return;
    }

    const message =
      `Hi, please find your bill attached.\n\n` +
      `📎 File "${fileName}" has been downloaded to your device.\n` +
      `Please attach it to this chat and tap Send.`;

    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");

    if (billId) await handleSendBill(billId);

    // Show instruction toast on desktop
    toast({
      title: "PDF Downloaded",
      description:
        "WhatsApp is opening. Attach the downloaded PDF and tap Send.",
      duration: 6000,
    });
  };
  const openRevertConfirmDialog = (bill) => {
    setRevertConfirmDialog({
      open: true,
      bill,
    });
  };

  const closeRevertConfirmDialog = () => {
    setRevertConfirmDialog({
      open: false,
      bill: null,
    });
  };
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
          createdBy: user.physioName,
        }),
      });

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

      toast({ title: "Success", description: response?.message });

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
    return x.toLocaleDateString("en-GB");
  };

  const fetchData = async () => {
    try {
      const patientsRes = await apiRequest("Patient/getAllPatientsIncome", {
        method: "POST",
        body: JSON.stringify({ month: selectedMonth, year: selectedYear }),
      });

      setPatients(Array.isArray(patientsRes) ? patientsRes : []);
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
  const [billspending, setBillspending] = useState([]);

  const fetchBills = async () => {
    try {
      const res = await apiRequest("Bill/getAllBill", {
        method: "POST",
        body: JSON.stringify({
          month: months[selectedBillMonth - 1],
          year: selectedBillYear,
          patientId: selectedBillPatientId,
          filterType: billFilterType,
        }),
      });

      setBills(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error(e);
      setBills([]);
    }
  };
  const fetchBill = async () => {
    try {
      const res = await apiRequest("Dashboard/getAllBillforDashboard", {
        method: "POST",
        body: JSON.stringify({}),
      });

      setBillspending(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error(e);
      setBillspending([]);
    }
  };
  const monthlyPending = useMemo(() => {
    const months = [
      { month: "Jan", pending: 0 },
      { month: "Feb", pending: 0 },
      { month: "Mar", pending: 0 },
      { month: "Apr", pending: 0 },
      { month: "May", pending: 0 },
      { month: "Jun", pending: 0 },
      { month: "Jul", pending: 0 },
      { month: "Aug", pending: 0 },
      { month: "Sep", pending: 0 },
      { month: "Oct", pending: 0 },
      { month: "Nov", pending: 0 },
      { month: "Dec", pending: 0 },
    ];

    const monthMap = {
      January: 0,
      February: 1,
      March: 2,
      April: 3,
      May: 4,
      June: 5,
      July: 6,
      August: 7,
      September: 8,
      October: 9,
      November: 10,
      December: 11,
    };

    billspending.forEach((bill) => {
      const monthIndex = monthMap[bill.month];

      if (monthIndex === undefined) return;

      const total = Number(bill.NetBilledAmount || bill.TotalBilledAmount || 0);
      const received = Number(bill.ReceivedAmount || 0);
      const discount = Number(bill.DiscountAmount || 0);
      const badDebtAmount = Number(bill.badDebtAmount || 0);
      const pending = Math.max(total - discount - received - badDebtAmount, 0);

      months[monthIndex].pending += pending;
    });

    return months;
  }, [billspending]);
  console.log();
  useEffect(() => {
    if (activeTab === "bill") {
      fetchBills();
      fetchBill();
    }
  }, [
    activeTab,
    selectedBillMonth,
    selectedBillYear,
    selectedBillPatientId,
    billFilterType,
  ]);
  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      const pid = getId(b.patientId);

      const matchPatient =
        selectedBillPatientId === "ALL" ? true : pid === selectedBillPatientId;

      const refDate =
        billFilterType === "lastSession"
          ? new Date(b.ToDate)
          : new Date(b.createdAt);

      const refMonth = refDate.getMonth() + 1;
      const refYear = refDate.getFullYear();

      const matchMonth = refMonth === Number(selectedBillMonth);
      const matchYear = refYear === Number(selectedBillYear);

      return matchPatient && matchMonth && matchYear;
    });
  }, [
    bills,
    selectedBillPatientId,
    selectedBillMonth,
    selectedBillYear,
    billFilterType,
  ]);
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

  const selectedBillPatient = useMemo(() => {
    if (selectedBillPatientId === "ALL") return null;
    return patients.find((p) => p._id === selectedBillPatientId) || null;
  }, [patients, selectedBillPatientId]);

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

    if (partialAmount === "") return;

    const n = Number(partialAmount);
    if (Number.isNaN(n)) return;

    if (n === pending && pending > 0) {
      setPaymentMode("Full Payment");
    }
  }, [paymentMode, partialAmount, paymentDialog.open, paymentDialog.bill]);

  const handlePartialChange = (e) => {
    const pending = Number(paymentDialog.bill?.pending || 0);
    const val = e.target.value;

    if (val === "") {
      setPartialAmount("");
      return;
    }

    if (!/^\d*$/.test(val)) return;

    const num = Number(val);

    if (num > pending) {
      setPartialAmount(String(pending));
      return;
    }

    setPartialAmount(val);
  };

  const selectedGeneratedBill = useMemo(() => {
    if (selectedBillPatientId === "ALL") return null;

    const list = filteredBills.filter(
      (b) => getId(b.patientId) === selectedBillPatientId,
    );

    if (list.length === 0) return null;

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
        updatedBy: user?.physioName || "Unknown User",
      }),
    });
  };

  const fetchBilledSessionsForBill = async (bill) => {
    try {
      const patientId = getId(bill?.patientId);

      if (!patientId) return [];

      const allSessions = await apiRequest("Session/getAllSessionsbyPatient", {
        method: "POST",
        body: JSON.stringify({ patientId }),
      });

      const sessionsArr = Array.isArray(allSessions)
        ? allSessions
        : Array.isArray(allSessions?.data)
          ? allSessions.data
          : [];

      // Bill period
      const startDate = new Date(bill?.startDate);
      const endDate = new Date(bill?.ToDate);

      // include full last day
      endDate.setHours(23, 59, 59, 999);

      const filtered = sessionsArr
        .filter((s) => {
          const sessionDate = new Date(s.sessionDate);

          const isCompleted =
            (s?.sessionStatusId?.sessionStatusName || "").toLowerCase() ===
            "completed";

          // session inside bill period
          const isWithinBillPeriod =
            sessionDate >= startDate && sessionDate <= endDate;

          return isCompleted && isWithinBillPeriod;
        })
        .sort((a, b) => new Date(a.sessionDate) - new Date(b.sessionDate));

      console.log("Filtered sessions (BILL PERIOD):", filtered);

      return filtered;
    } catch (error) {
      console.error("Failed to fetch billed sessions:", error);
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

        console.log("includeSessions:", billPreview.includeSessions);
        console.log("Fetched billedSessions:", billedSessions);
      }

      await downloadBillPdf({
        bill,
        includeSessions: billPreview.includeSessions,
        billedSessions,
      });

      setBillPreview((s) => ({
        ...s,
        open: false,
        loading: false,
      }));
    } catch (err) {
      console.error("Bill PDF download failed:", err);

      setBillPreview((s) => ({
        ...s,
        loading: false,
      }));
    }
  };

  const downloadBillPdf = ({ bill, includeSessions, billedSessions = [] }) => {
    try {
      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

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
        rate =
          Number(bill?.ratePerSession || 0) > 0
            ? Number(bill?.ratePerSession || 0)
            : totalSessions > 0
              ? Number((totalAmount / totalSessions).toFixed(2))
              : 0;

        rateLabel = "(Per Session)";
        descriptionText = "Physiotherapy Monthly Package";
        sessionText = `${totalSessions}`;
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

      const fmt = (date) => {
        if (!date) return "N/A";
        const d = new Date(date);
        if (Number.isNaN(d.getTime())) return "N/A";
        const day = String(d.getUTCDate()).padStart(2, "0");
        const month = String(d.getUTCMonth() + 1).padStart(2, "0");
        const year = d.getUTCFullYear();
        return `${day}/${month}/${year}`;
      };

      const invoiceNo = bill?.invoiceNo || "N/A";

      const clinicAddress = [
        "Coimbatore, Tamil Nadu",
        "Phone: +91 99439 23231",
        "Email: info@neophysio.in",
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

      // ===== FULL PAGE BACKGROUND =====
      // Full background (no margin)
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, 210, 297, "F");

      // Light header background (optional but nice)
      doc.setFillColor(245, 248, 252);
      doc.rect(0, 0, 210, 56, "F");

      //  Big logo, no top gap but small padding from edge
      doc.addImage(neoLogo, "PNG", 5, 2, 60, 60);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(24);
      doc.setTextColor(...labelColor);
      doc.text("NEO PHYSIO", 72, 18);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text("We Are Changing Lives", 72, 26);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...textColor);

      let rightY = 12;
      clinicAddress.forEach((line) => {
        doc.text(line, 138, rightY);
        rightY += 5;
      });

      doc.setFont("helvetica", "bold");
      doc.setTextColor(...labelColor);
      doc.text("No:", 138, 35);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(...textColor);
      doc.text(String(invoiceNo), 145, 35);

      doc.setDrawColor(...lineColor);
      doc.setLineWidth(0.4);
      doc.line(10, 56, 200, 56);

      // ===== TITLE =====
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(...labelColor);
      doc.text("Treatment Estimate", pageWidth / 2, 64, { align: "center" });

      doc.setDrawColor(...lineColor);
      doc.line(10, 68, 200, 68);

      // ===== INFO ROWS =====
      const drawInfoRow = (
        y,
        leftLabel,
        leftValue,
        rightLabel = "",
        rightValue = "",
      ) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...labelColor);
        doc.text(leftLabel, 12, y);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(...textColor);
        doc.text(String(leftValue || "N/A"), 40, y);

        if (rightLabel) {
          doc.setFont("helvetica", "bold");
          doc.setTextColor(...labelColor);
          doc.text(rightLabel, 118, y);

          doc.setFont("helvetica", "normal");
          doc.setTextColor(...textColor);
          doc.text(String(rightValue || "N/A"), 148, y);
        }

        doc.setDrawColor(...lineColor);
        doc.line(10, y + 4, 200, y + 4);
      };

      drawInfoRow(76, "Patient Name:", patientName, "Patient ID:", patientCode);
      drawInfoRow(85, "Treated By:", physioName, "", "");
      drawInfoRow(
        94,
        "Treated From:",
        fmt(fromDate),
        "Treated To:",
        fmt(toDate),
      );

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...labelColor);
      doc.text("No. of Sessions:", 12, 103);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(...textColor);
      doc.text(`${totalSessions} Sessions`, 45, 103);

      // ===== TABLE =====
      autoTable(doc, {
        startY: 108,
        margin: { left: 10, right: 10 },
        head: [["DESCRIPTION", "UNIT COST", "NO. OF SESSIONS", "TOTAL COST"]],
        body: [
          [
            descriptionText,
            `Rs. ${rate.toFixed(2)} ${rateLabel}`,
            sessionText,
            `Rs. ${totalAmount.toFixed(2)}`,
          ],
        ],
        theme: "grid",
        styles: {
          fontSize: 10,
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
          fontSize: 10,
          halign: "center",
        },
        columnStyles: {
          0: { cellWidth: 82, halign: "left" },
          1: { cellWidth: 34, halign: "center" },
          2: { cellWidth: 35, halign: "center" },
          3: { cellWidth: 35, halign: "center" },
        },
      });

      let yAfterTable = doc.lastAutoTable.finalY + 8;

      // ===== SUBTOTAL =====
      doc.setDrawColor(...lineColor);
      doc.line(10, yAfterTable, 200, yAfterTable);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(80, 80, 80);
      doc.text("Subtotal:", 14, yAfterTable + 7);
      doc.text(`Rs. ${totalAmount.toFixed(2)}`, 195, yAfterTable + 7, {
        align: "right",
      });

      doc.line(10, yAfterTable + 11, 200, yAfterTable + 11);

      // ===== PAYMENT SECTION =====
      const paymentY = yAfterTable + 18;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...labelColor);
      doc.text("Online Payment:", 12, paymentY);

      doc.addImage(neoQR, "PNG", 12, paymentY + 4, 38, 38);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
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
        const noteY = paymentY + 48;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(6.5);
        doc.setTextColor(...labelColor);
        doc.text("Note:", 12, noteY);

        doc.setFont("helvetica", "italic");
        doc.setFontSize(6);
        doc.setTextColor(90, 90, 90);
        doc.text(
          "* This is a treatment estimate only. The invoice will be issued after completion of the treatment.",
          18,
          noteY + 5,
          { maxWidth: 172 },
        );

        const thankY = Math.min(noteY + 22, pageHeight - 18);

        doc.setDrawColor(210, 210, 210);
        doc.line(10, thankY - 4, 200, thankY - 4);

        doc.setFont("helvetica", "bolditalic");
        doc.setFontSize(11);
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
      return doc;
    } catch (error) {
      console.error("PDF generation error:", error);
    }
  };

  const billedAmountFromBills = filteredPatients.reduce(
    (sum, p) => sum + Number(p.Billed || 0),
    0,
  );

  const formatDate = (date) => {
    if (!date) return "-";
    const d = new Date(date);
    const day = String(d.getUTCDate()).padStart(2, "0");
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const year = d.getUTCFullYear();
    return `${day}-${month}-${year}`;
  };

  const unbilledAmountFromIncome = useMemo(() => {
    return Math.max(totalIncomeByFilter - billedAmountFromBills, 0);
  }, [totalIncomeByFilter, billedAmountFromBills]);

  const handleSendBill = async (id) => {
    try {
      await apiRequest("Bill/updateSendStatus", {
        method: "POST",
        body: JSON.stringify({ billId: id }),
      });

      setBills((prev) =>
        prev.map((b) => (b._id === id ? { ...b, isSend: true } : b)),
      );
    } catch (error) {
      console.error(error);
    }
  };

  const handleSaveBill = async (bill) => {
    try {
      await handleSendBill(bill._id);
      setBillPreview((s) => ({ ...s, open: false }));
    } catch (err) {
      console.error("Save bill failed:", err);
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
  const handleRevertPayment = async (billId) => {
    try {
      const res = await apiRequest("Bill/revertPayment", {
        method: "POST",
        body: JSON.stringify({
          billId,
          updatedBy: user?.physioName || "Unknown User",
        }),
      });

      if (!res.success) {
        throw new Error(res.message);
      }

      toast({ title: "Success", description: res.message });

      closeRevertConfirmDialog();
      await fetchBills();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const confirmMarkBadDebt = async () => {
    const billId = badDebtDialog.billId;
    if (!billId) return;

    try {
      const res = await apiRequest("Bill/markBadDebt", {
        method: "POST",
        body: JSON.stringify({
          billId,
          updatedBy: user?.physioName || "Unknown User",
        }),
      });

      if (!res.success) {
        throw new Error(res.message);
      }

      toast({ title: "Marked", description: res.message });

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
    <div
      className="p-4 space-y-4"
      style={{
        width: "calc(100vw - var(--sidebar-width, 140px))",
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      <div className="w-full flex justify-center">
        <div className="flex items-center gap-2 p-1 rounded-lg border border-slate-800 overflow-x-auto max-w-full">
          <TabButton id="income" label="INCOME" icon={InboxIcon} />
          <TabButton id="bill" label="BILL GENERATE" icon={Bitcoin} />
        </div>
      </div>
      <div id="pageContent">
        {activeTab === "income" && (
          <>
            {/* DASHBOARD HEADER */}
            <Card>
              <CardHeader>
                <CardTitle>Income Dashboard</CardTitle>
              </CardHeader>

              <CardContent>
                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                  {/* SUMMARY */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm font-semibold w-full xl:w-auto">
                    <div className="flex justify-between bg-gray-50 p-2 rounded-md">
                      <span>Total Income:</span>
                      <span>₹{totalIncomeByFilter.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between bg-green-50 text-green-700 p-2 rounded-md">
                      <span>Billed Amount:</span>
                      <span>₹{billedAmountFromBills.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between bg-red-50 text-red-600 p-2 rounded-md">
                      <span>Unbilled Amount:</span>
                      <span>₹{unbilledAmountFromIncome.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* PDF BUTTON */}
                  <div>
                    <button
                      onClick={downloadPageAsPDF}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
                    >
                      Download PDF
                    </button>
                  </div>
                </div>

                {/* FILTERS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 mt-4">
                  <Select
                    value={selectedPhysioId}
                    onValueChange={(v) => setSelectedPhysioId(v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Physiotherapist" />
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
                      <SelectValue placeholder="Patients" />
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
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Fees Type" />
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
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Month" />
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
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent className="h-[200px]">
                      {[
                        2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034,
                        2035,
                      ].map((y) => (
                        <SelectItem key={y} value={y}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* DESKTOP TABLE */}
            <Card className="hidden md:block">
              <CardContent>
                <div className="overflow-x-auto mt-5">
                  <table className="min-w-[750px] w-full text-sm border rounded-lg">
                    <thead className="bg-gray-100 text-gray-700">
                      <tr>
                        <th className="px-3 py-2 text-left">Patient Name</th>
                        <th className="px-3 py-2 text-left">Physio Name</th>
                        <th className="px-3 py-2 text-left">
                          Completed Sessions
                        </th>
                        <th className="px-3 py-2 text-left">Fees</th>
                        <th className="px-3 py-2 text-left">Total Income</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredPatients
                        .filter((p) => p.totalCompletedSessions > 0)
                        .map((p) => (
                          <tr key={p._id} className="hover:bg-gray-50">
                            <td className="p-2 border whitespace-nowrap">
                              {p.patientName}
                            </td>

                            <td className="p-2 border whitespace-nowrap">
                              {selectedPhysioId !== "ALL"
                                ? p.physioDetails?.find(
                                    (physio) =>
                                      physio.physioId === selectedPhysioId,
                                  )?.physioName
                                : p.physioDetails
                                    ?.map((physio) => physio.physioName)
                                    .join(", ") || "N/A"}
                            </td>

                            <td className="p-2 border text-center">
                              {selectedPhysioId !== "ALL"
                                ? p.physioDetails?.find(
                                    (physio) =>
                                      physio.physioId === selectedPhysioId,
                                  )?.sessionCount
                                : p.totalCompletedSessions}
                            </td>

                            <td className="p-2 border text-center whitespace-nowrap">
                              ₹{p.feePerSession || 0} ({p.feeType || "N/A"})
                            </td>

                            <td className="p-2 border text-center font-semibold whitespace-nowrap">
                              ₹{Number(p.totalIncome || 0).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* MOBILE CARDS */}
            <Card className="md:hidden">
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
                    No income records found
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
                        <div className="flex justify-between">
                          <div>
                            <p className="font-semibold">{p.patientName}</p>
                            <p className="text-xs text-gray-500">
                              {p.patientCode || ""}
                            </p>
                          </div>
                        </div>
                        <div className="text-right mr-1 ">
                          <p className="text-xs text-gray-500">Income</p>
                          <p className="font-bold">
                            ₹{Number(p.totalIncome || 0).toFixed(2)}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                          <div className="bg-gray-50 p-2 rounded">
                            <p className="text-xs text-gray-500">Physio</p>
                            <p className="font-medium">
                              {selectedPhysioId !== "ALL"
                                ? p.physioDetails?.find(
                                    (physio) =>
                                      physio.physioId === selectedPhysioId,
                                  )?.physioName
                                : p.physioDetails
                                    ?.map((physio) => physio.physioName)
                                    .join(", ") || "N/A"}
                            </p>
                          </div>

                          <div className="bg-gray-50 p-2 rounded col-span-2">
                            <p className="text-xs text-gray-500">Fees</p>
                            <p className="font-medium">
                              ₹{p.feePerSession || 0} ({p.feeType || "N/A"})
                            </p>
                          </div>
                          <div className="bg-gray-50 p-2 rounded">
                            <p className="text-xs text-gray-500">Completed</p>
                            <p className="font-medium">
                              {p.totalCompletedSessions || 0}
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
      </div>
      <div id="pageContent1">
        {activeTab === "bill" && (
          <>
            <Card className="medical-card mt-6 mb-6">
              <CardHeader>
                <CardTitle>Monthly Pending Amount</CardTitle>
              </CardHeader>

              <CardContent>
                <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
                  {monthlyPending
                    .filter((m) => m.pending > 0)
                    .map((m, i) => (
                      <div
                        key={i}
                        className="border rounded-lg p-4 text-center bg-gray-50"
                      >
                        <p className="text-sm text-gray-500">{m.month}</p>

                        <p className="text-lg font-semibold text-red-600">
                          ₹ {m.pending.toLocaleString()}
                        </p>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
            <Card className="w-full overflow-hidden">
              <CardHeader>
                <CardTitle>Bill Generate Dashboard</CardTitle>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* SUMMARY */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 text-sm font-semibold">
                  <div className="bg-gray-50 p-3 rounded">
                    Generated Bills
                    <div className="text-lg font-bold">
                      {filteredBills.length}
                    </div>
                  </div>

                  <div className="bg-green-50 text-green-700 p-3 rounded">
                    Received Amount
                    <div className="text-lg font-bold">
                      ₹{totalReceivedAmt.toFixed(2)}
                    </div>
                  </div>

                  <div className="bg-red-50 text-red-600 p-3 rounded">
                    Pending Amount
                    <div className="text-lg font-bold">
                      ₹{totalPendingAmt.toFixed(2)}
                    </div>
                  </div>

                  <div className="bg-purple-50 text-purple-600 p-3 rounded">
                    Discount
                    <div className="text-lg font-bold">
                      ₹{totalDiscountAmt.toFixed(2)}
                    </div>
                  </div>

                  <div className="bg-red-100 text-red-700 p-3 rounded">
                    Bad Debt
                    <div className="text-lg font-bold">
                      ₹{totalBadDebtAmount.toFixed(2)}
                    </div>
                  </div>

                  <div className="bg-blue-50 text-blue-700 p-3 rounded">
                    Total Billed
                    <div className="text-lg font-bold">
                      ₹{totalGeneratedBillAmount.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* FILTERS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                  <Select
                    value={selectedBillPatientId}
                    onValueChange={(v) => setSelectedBillPatientId(v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Patients" />
                    </SelectTrigger>

                    <SelectContent className="max-h-60 overflow-auto">
                      <SelectItem value="ALL">All Patients</SelectItem>
                      {patients.map((p) => (
                        <SelectItem key={p._id} value={p._id}>
                          {p.patientName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={billFilterType}
                    onValueChange={setBillFilterType}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Filter Type" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="created">
                        Bill Created Month
                      </SelectItem>

                      <SelectItem value="lastSession">
                        Last Session Wise
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    onValueChange={(val) => setSelectedBillMonth(Number(val))}
                    value={String(selectedBillMonth)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>

                    <SelectContent className="max-h-60 overflow-auto">
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
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>

                    <SelectContent className="max-h-60 overflow-auto">
                      {[
                        2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034,
                      ].map((y) => (
                        <SelectItem key={y} value={String(y)}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button onClick={fetchBills}>Apply</Button>

                  <Button variant="outline" onClick={downloadAllBillsPDF}>
                    Download PDF
                  </Button>

                  <Button
                    className="xl:ml-auto"
                    onClick={handleManualGenerateBill}
                    disabled={
                      !selectedBillPatientId || selectedBillPatientId === "ALL"
                    }
                  >
                    Generate Manual Bill
                  </Button>
                </div>

                {/* DESKTOP TABLE */}
                <div className="hidden md:block border rounded-lg bg-white">
                  <div className="overflow-x-auto max-h-[520px]">
                    <table className="min-w-[1200px] w-full text-sm border-collapse">
                      <thead className="bg-gray-100 sticky top-0 z-20">
                        <tr>
                          <th className="p-3 text-left sticky left-0 bg-gray-100 z-30">
                            Patient
                          </th>
                          <th className="p-3 text-left sticky top-0 bg-gray-100">
                            Physio
                          </th>
                          <th className="p-3 text-left sticky top-0 bg-gray-100">
                            Session Period
                          </th>
                          <th className="p-3 text-center sticky top-0 bg-gray-100">
                            Sessions
                          </th>
                          <th className="p-3 text-center sticky top-0 bg-gray-100">
                            Rate
                          </th>
                          <th className="p-3 text-center sticky top-0 bg-gray-100">
                            Total
                          </th>
                          <th className="p-3 text-center sticky top-0 bg-gray-100">
                            Advance Deducted
                          </th>
                          <th className="p-3 text-center sticky top-0 bg-gray-100">
                            Net
                          </th>
                          <th className="p-3 text-center sticky top-0 bg-gray-100">
                            Received
                          </th>
                          <th className="p-3 text-center sticky top-0 bg-gray-100">
                            Pending
                          </th>
                          <th className="p-3 text-center sticky top-0 bg-gray-100">
                            Discount
                          </th>{" "}
                          <th className="p-3 text-center sticky top-0 bg-gray-100">
                            Is BadDebt
                          </th>
                          <th className="p-3 text-center sticky top-0 bg-gray-100">
                            Revert Payment
                          </th>
                          <th className="p-3 text-left sticky top-0 bg-gray-100">
                            Status
                          </th>
                          <th className="p-3 text-left sticky top-0 bg-gray-100">
                            Payment Type
                          </th>
                          <th className="p-3 text-center sticky top-0 bg-gray-100">
                            Actions
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {sortedBills.length === 0 ? (
                          <tr>
                            <td
                              colSpan={14}
                              className="text-center p-5 text-gray-500"
                            >
                              No bills found
                            </td>
                          </tr>
                        ) : (
                          sortedBills.map((b) => {
                            const net = Number(b?.NetBilledAmount || 0);
                            const received = Number(b?.ReceivedAmount || 0);
                            const discount = Number(b?.DiscountAmount || 0);
                            const badDebtAmount = Number(b?.badDebtAmount || 0);
                            const final = Math.max(net - discount, 0);
                            const pending = Math.max(
                              final - received - badDebtAmount,
                              0,
                            );

                            const status = getBillPaymentStatus(b);

                            return (
                              <tr
                                key={b._id}
                                className="border-b hover:bg-gray-50"
                              >
                                <td className="p-3 sticky left-0 bg-white">
                                  {b?.patientId?.patientName}
                                </td>
                                <td className="p-3">
                                  {b?.physioId?.physioName}
                                </td>
                                <td className="p-3 whitespace-nowrap">
                                  {formatDate(b?.startDate)} -{" "}
                                  {formatDate(b?.ToDate)}
                                </td>
                                <td className="p-3 text-center">
                                  {b?.TotalSessionCount}
                                </td>
                                <td className="p-3 text-center">
                                  ₹{b?.ratePerSession}
                                  {/* ₹{b?.ratePerSession.toFixed(0)} */}
                                </td>
                                <td className="p-3 text-center font-semibold">
                                  ₹{b?.TotalBilledAmount}
                                </td>
                                <td className="p-3 text-center bg-yellow-100">
                                  ₹{b?.DeductedFromAdvance}
                                </td>
                                <td className="p-3 text-center bg-blue-100">
                                  ₹{net.toFixed(2)}
                                </td>
                                <td className="p-3 text-center bg-green-200">
                                  ₹{received.toFixed(2)}
                                </td>
                                <td className="p-3 text-center bg-red-100">
                                  ₹{pending.toFixed(2)}
                                </td>
                                <td className="p-3 text-center bg-purple-100">
                                  ₹{discount.toFixed(2)}
                                </td>{" "}
                                <td className="p-3 text-center">
                                  <Button
                                    disabled={b.isBadDebt}
                                    onClick={() =>
                                      setBadDebtDialog({
                                        open: true,
                                        billId: b._id,
                                      })
                                    }
                                  >
                                    {b.isBadDebt ? "Bad Debt" : "Mark Bad Debt"}
                                  </Button>
                                </td>
                                <td className="p-3 text-center">
                                  <Button
                                    onClick={() => openRevertConfirmDialog(b)}
                                  >
                                    Revert Payment
                                  </Button>
                                </td>
                                <td className="p-3">
                                  <span
                                    className={`px-2 py-1 rounded text-xs ${getStatusBadgeClass(status)}`}
                                  >
                                    {status}
                                  </span>
                                </td>
                                <td className="p-3">{getBillPaymentType(b)}</td>
                                <td className="p-3">
                                  <div className="flex flex-col gap-2">
                                    {/* Receive Payment Button */}
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        openPaymentDialog({
                                          ...b,
                                          pending,
                                          final,
                                        })
                                      }
                                      disabled={
                                        status === "Paid" ||
                                        b?.isBadDebt ||
                                        pending <= 0
                                      }
                                      className={
                                        status === "Paid"
                                          ? "bg-green-500 text-white cursor-not-allowed"
                                          : b?.isBadDebt
                                            ? "bg-red-500 text-white cursor-not-allowed"
                                            : pending <= 0
                                              ? "bg-gray-400 text-white cursor-not-allowed"
                                              : ""
                                      }
                                    >
                                      {status === "Paid"
                                        ? "Paid"
                                        : b?.isBadDebt
                                          ? "Bad Debt"
                                          : "Receive"}
                                    </Button>
                                    {/* Send Bill Button */}
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        setBillPreview({
                                          open: true,
                                          bill: b,
                                          includeSessions: false,
                                          loading: false,
                                          mode: "share", // 👈 important
                                        })
                                      }
                                      disabled={b?.isSend}
                                      className={
                                        b?.isSend
                                          ? "bg-blue-500 text-white cursor-not-allowed"
                                          : "bg-red-300 text-white"
                                      }
                                    >
                                      {b?.isSend ? "Sent" : "Send"}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      onClick={() =>
                                        setBillPreview({
                                          open: true,
                                          bill: b,
                                          includeSessions: false,
                                          loading: false,
                                          mode: "download",
                                        })
                                      }
                                    >
                                      Generate PDF
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* MOBILE CARDS */}

            <Card className="md:hidden">
              <CardHeader>
                <CardTitle>Bills ({sortedBills.length})</CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                {sortedBills.length === 0 ? (
                  <div className="text-center text-gray-500 py-6">
                    No bills found
                  </div>
                ) : (
                  sortedBills.map((b) => {
                    const net = Number(b?.NetBilledAmount || 0);
                    const received = Number(b?.ReceivedAmount || 0);
                    const pending = getPendingAmount(b);
                    const status = getBillPaymentStatus(b);

                    return (
                      <div
                        key={b._id}
                        className="border rounded-xl p-4 bg-white shadow-sm"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">
                              {b?.patientId?.patientName}
                            </p>

                            <p className="text-xs text-gray-500">
                              Physio: {b?.physioId?.physioName}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`text-xs px-2 py-1 rounded ${getStatusBadgeClass(status)}`}
                        >
                          {status}
                        </span>
                        <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                          <div className="bg-gray-50 p-2 rounded">
                            Sessions
                            <p className="font-bold">{b?.TotalSessionCount}</p>
                          </div>

                          <div className="bg-gray-50 p-2 rounded">
                            Rate
                            <p className="font-bold">
                              ₹{b?.ratePerSession}
                              {/* ₹{b?.ratePerSession.toFixed(0)} */}
                            </p>
                          </div>

                          <div className="bg-blue-50 p-2 rounded">
                            Net
                            <p className="font-bold">₹{net.toFixed(0)}</p>
                          </div>

                          <div className="bg-red-50 p-2 rounded">
                            Pending
                            <p className="font-bold">₹{pending.toFixed(0)}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-3">
                          <Button
                            onClick={() => openPaymentDialog(b)}
                            disabled={
                              Number(b?.NetBilledAmount || 0) -
                                Number(b?.ReceivedAmount || 0) -
                                Number(b?.DiscountAmount || 0) <=
                                0 || b?.isBadDebt
                            }
                          >
                            Receive
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setBillPreview({
                                open: true,
                                bill: b,
                                includeSessions: false,
                                loading: false,
                                mode: "share", // 👈 important
                              })
                            }
                            disabled={b?.isSend}
                            className={
                              b?.isSend
                                ? "bg-blue-500 text-white cursor-not-allowed"
                                : "bg-red-300 text-white"
                            }
                          >
                            {b?.isSend ? "Sent" : "Send"}
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() =>
                              setBillPreview({
                                open: true,
                                bill: b,
                                includeSessions: false,
                                loading: false,
                              })
                            }
                          >
                            PDF
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Payment Dialog */}
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

      {/* Bill Preview Dialog */}
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
                  Sessions: {Number(billPreview.bill?.TotalSessionCount || 0)}
                </div>

                <div className="p-2 border rounded">
                  Period:{" "}
                  {billPreview.bill?.startDate
                    ? formatDate(billPreview.bill?.startDate)
                    : "-"}{" "}
                  -{" "}
                  {billPreview.bill?.ToDate
                    ? formatDate(billPreview.bill?.ToDate)
                    : "-"}
                  {/* Period: {formatBillDate(billPreview.bill?.startDate)} -{" "}
                  {formatBillDate(billPreview.bill?.ToDate)} */}
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
                  Pending: ₹
                  {(
                    Number(billPreview.bill?.NetBilledAmount || 0) -
                    Number(billPreview.bill?.ReceivedAmount || 0) -
                    Number(billPreview.bill?.DiscountAmount || 0) -
                    Number(billPreview.bill?.badDebtAmount || 0)
                  ).toFixed(2)}
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

            {billPreview.mode === "download" ? (
              <Button
                onClick={handleDownloadBill}
                disabled={billPreview.loading}
              >
                {billPreview.loading ? "Preparing..." : "Download PDF"}
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleSaveBill(billPreview.bill)}
                  disabled={billPreview.bill?.isSend}
                  className={
                    billPreview.bill?.isSend
                      ? "bg-gray-400 text-white cursor-not-allowed"
                      : "bg-indigo-500 text-white hover:bg-indigo-600"
                  }
                >
                  {billPreview.bill?.isSend ? "Saved" : "Save"}
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                  onClick={handleShareWhatsAppPDF}
                >
                  <FaWhatsapp className="h-4 w-4" />
                  Share via WhatsApp
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bad Debt Confirmation Dialog */}
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
      <Dialog
        open={revertConfirmDialog.open}
        onOpenChange={(open) => {
          if (!open) closeRevertConfirmDialog();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Revert Payment</DialogTitle>
            <DialogDescription>
              Are you sure you want to revert this payment?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-sm">
            <div className="rounded-lg border p-3 bg-slate-50">
              <p>
                <span className="font-medium">Patient:</span>{" "}
                {revertConfirmDialog.bill?.patientId?.patientName || "N/A"}
              </p>
              <p>
                <span className="font-medium">Bill Amount:</span> ₹
                {Number(revertConfirmDialog.bill?.NetBilledAmount || 0).toFixed(
                  2,
                )}
              </p>
              <p>
                <span className="font-medium">Received Amount:</span> ₹
                {Number(revertConfirmDialog.bill?.ReceivedAmount || 0).toFixed(
                  2,
                )}
              </p>
              <p>
                <span className="font-medium">Discount Amount:</span> ₹
                {Number(revertConfirmDialog.bill?.DiscountAmount || 0).toFixed(
                  2,
                )}
              </p>
            </div>

            <p className="text-red-600 text-xs">
              This will reset received amount and discount amount for this bill.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeRevertConfirmDialog}>
              Cancel
            </Button>
            <Button
              className="bg-orange-500 text-white hover:bg-orange-600"
              onClick={() => handleRevertPayment(revertConfirmDialog.bill?._id)}
            >
              Confirm Revert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Income;
