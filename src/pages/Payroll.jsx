import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Logo from "../Assets/images/logo_png.png";

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
  Trash2,
  Edit,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const Payroll = () => {
  const [employees, setEmployees] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [payrollData, setPayrollData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isPayslipOpen, setIsPayslipOpen] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  // useEffect(() => {
  //   Promise.all([
  //     fetch("/mockdata/physios.json").then((res) => res.json()),
  //     fetch("/mockdata/sessions.json").then((res) => res.json()),
  //   ])
  //     .then(([physiosData, sessionsData]) => {
  //       setEmployees(physiosData.filter((p) => p.active));
  //       setSessions(sessionsData);
  //     })
  //     .catch((err) => console.error("Error loading data:", err));
  // }, []);
  useEffect(() => {
    getPhysio();
    getSessions();
    getPayrolls();
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
  const getCompletedSessionsCount = (physioId) => {
    return sessions.filter(
      (s) =>
        (s.physioId?._id || s.physioId) === physioId &&
        s.sessionStatusId?.sessionStatusName.toLowerCase() === "completed",
    ).length;
  };

  // useEffect(() => {
  //   if (employees.length > 0 && sessions.length > 0) {
  //     const data = employees.map((emp) => {
  //       const employeeSessions = sessions.filter(
  //         (s) =>
  //           s.physioId === emp.id &&
  //           s.status === "completed" &&
  //           new Date(s.sessionDate).getMonth() === selectedMonth &&
  //           new Date(s.sessionDate).getFullYear() === selectedYear,
  //       );
  //       const totalSessions = employeeSessions.length;
  //       const grossRevenue = totalSessions * emp.ratePerSession;
  //       const deductions = grossRevenue * 0.1; // Mock 10% deduction
  //       const netPay = grossRevenue - deductions;

  //       return {
  //         ...emp,
  //         totalSessions,
  //         grossRevenue,
  //         deductions,
  //         netPay,
  //       };
  //     });
  //     setPayrollData(data);
  //   }
  // }, [employees, sessions, selectedMonth, selectedYear]);
  useEffect(() => {
    if (!employees.length || !sessions.length) {
      setPayrollData([]);
      return;
    }

    const data = employees.map((physio) => {
      const employeeSessions = sessions.filter((s) => {
        if (s.sessionStatusId?.sessionStatusName.toLowerCase() !== "completed")
          return false;

        const physioId = s.physioId
          ? typeof s.physioId === "object"
            ? s.physioId._id
            : s.physioId
          : null;

        if (!physioId || physioId !== physio._id) return false;

        const date = new Date(s.sessionDate);
        return (
          date.getMonth() === selectedMonth &&
          date.getFullYear() === selectedYear
        );
      });

      const totalSessions = employeeSessions.length;

      // const grossRevenue =
      //   (physio.ratePerSession || 0) * totalSessions +
      //   (physio.physioPetrolAlw || 0) +
      //   (physio.physioVehicleMTC || 0);
      const grossRevenue =
        physio.physioSalary + physio.physioPetrolAlw + physio.physioVehicleMTC;
      // const deductions = grossRevenue * 0.1;
      const netPay = grossRevenue;
      // const netPay = grossRevenue - deductions;
      const completedSessions = getCompletedSessionsCount(physio._id);

      return {
        _id: physio._id,
        name: physio.physioName,
        specialization: physio.physioSpcl,
        role: physio.roleId?.RoleName,
        salary: physio.physioSalary,
        // totalSessions,
        grossRevenue,
        // deductions,
        netPay,
        totalSessions: completedSessions,
      };
    });

    setPayrollData(data);
  }, [employees, sessions, selectedMonth, selectedYear]);

  const handleViewPayslip = (employeeData) => {
    setSelectedPayslip(employeeData);
    setIsPayslipOpen(true);
  };

  const handlePrint = () => {
    const el = document.getElementById("payslip-content");
    if (!el) {
      toast({ title: "Error", description: "Payslip content not found" });
      return;
    }

    const printWindow = window.open("", "_blank", "width=900,height=650");
    if (!printWindow) {
      toast({
        title: "Popup blocked",
        description: "Allow popups to print",
        variant: "destructive",
      });
      return;
    }

    // copy styles from current page (tailwind/shadcn styles)
    const styles = Array.from(
      document.querySelectorAll("link[rel='stylesheet'], style"),
    )
      .map((node) => node.outerHTML)
      .join("\n");

    printWindow.document.write(`
    <html>
      <head>
        <title>Payslip</title>
        ${styles}
        <style>
          body { padding: 20px; }
          @media print { 
            button { display: none !important; } 
          }
        </style>
      </head>
      <body>
        ${el.outerHTML}
      </body>
    </html>
  `);

    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    };
  };

  const handleDownload = async () => {
    const el = document.getElementById("payslip-content");
    if (!el) {
      toast({ title: "Error", description: "Payslip content not found" });
      return;
    }

    try {
      toast({ title: "Generating PDF...", description: "Please wait" });

      // make canvas
      const canvas = await html2canvas(el, {
        scale: 2, // clarity
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");

      // A4 size in jsPDF (pt)
      const pdf = new jsPDF("p", "pt", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // image size fit to page
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let y = 0;
      let remainingHeight = imgHeight;

      // multi-page support
      pdf.addImage(imgData, "PNG", 0, y, imgWidth, imgHeight);
      remainingHeight -= pageHeight;

      while (remainingHeight > 0) {
        pdf.addPage();
        y = remainingHeight - imgHeight; // negative offset trick
        pdf.addImage(imgData, "PNG", 0, y, imgWidth, imgHeight);
        remainingHeight -= pageHeight;
      }

      const fileName =
        `Payslip_${selectedPayslip?.name || "Employee"}_${months[selectedMonth]}_${selectedYear}`
          .replaceAll(" ", "_")
          .replace(/[^\w\-]/g, "");

      pdf.save(`${fileName}.pdf`);

      toast({ title: "Downloaded", description: "Payslip PDF saved" });
    } catch (err) {
      console.error(err);
      toast({
        title: "PDF Failed",
        description: "Could not generate PDF",
        variant: "destructive",
      });
    }
  };
  const { getPermissionsByPath } = useAuth();

  const [Permissions, setPermissions] = useState({
    isAdd: false,
    isView: false,
    isEdit: false,
    isDelete: false,
  });
  useEffect(() => {
    getPermissionsByPath(window.location.pathname).then((res) => {
      if (res) {
        console.log(res, "res");
        setPermissions(res);
      } else {
        navigate("/dashboard");
      }
    });
  }, []);
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
  const years = [
    2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035, 2036, 2037,
    2038, 2039, 2040,
  ];
  const [dbPayrolls, setDbPayrolls] = useState([]);

  const getPayrolls = async () => {
    try {
      const res = await apiRequest("Payroll/getAllPayroll", {
        method: "POST",
        body: JSON.stringify({}),
      });

      // your API returns array
      setDbPayrolls(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error("Error loading payrolls:", e);
      setDbPayrolls([]);
    }
  };
  const selectedMonthName = months[selectedMonth];

  const payrollFromDb = dbPayrolls.filter(
    (p) =>
      p.payrRollMonth === selectedMonthName &&
      Number(p.payrRollYear) === Number(selectedYear),
  );
  const payrollUi = payrollFromDb.map((p) => ({
    _id: p._id,
    physioId: p.physioId?._id || p.physioId,

    name: p.physioId?.physioName || "N/A",
    specialization: p.physioId?.physioSpcl || "",
    role: p.physioId?.roleId?.RoleName || "",

    totalSessions: p.payrRollCompletedSessions ?? 0,
    cancelledSessions: p.payrRollCancelledSession ?? 0,

    grossRevenue: p.TotalSalary ?? 0, // or totalGrossSalary
    netPay: p.NetSalary ?? 0,

    basicSalary: p.basicSalary ?? 0,
    vehicleMaintanance: p.vehicleMaintanance ?? 0,
    petrolKm: p.PetrolKm ?? 0,
    petrolAmount: p.PetrolAmount ?? 0,
    incentive: p.Incentive ?? 0,
    leaveDays: p.NoofLeave ?? 0,
    deducted: p.TotalAmountDeducted ?? 0,
    ESI: p.ESI ?? 0,
    PF: p.PF ?? 0,

    payRollDate: p.payRollDate,
    month: p.payrRollMonth,
    year: p.payrRollYear,
  }));
  const handleDelete = async (id) => {
    try {
      if (!id) {
        toast({
          title: "Error",
          description: "Payroll id missing",
          variant: "destructive",
        });
        return;
      }

      await apiRequest("Payroll/deletePayroll", {
        method: "POST",
        body: JSON.stringify({ _id: id }),
      });

      toast({ title: "Deleted", description: "Payroll deleted successfully" });
      await getPayrolls(); // ✅ refresh
    } catch (err) {
      toast({
        title: "Error",
        description: err?.message || "Delete failed",
        variant: "destructive",
      });
    }
  };
  return (
    // <div className="space-y-6">
    <div className="space-y-6 overflow-x-hidden">
      {/* // <div className="min-h-screen w-full overflow-x-hidden"> */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Payroll Management
          </h1>
          <p className="text-gray-600 text-sm md:text-xs">
            Generate monthly payslips and calculate revenue for employees.
          </p>
        </div>
      </motion.div>

      <Card className="medical-card  ">
        <CardHeader>
          <CardTitle>Generate Payroll</CardTitle>
          <CardDescription>
            Select a month and year to calculate payroll.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          {/* <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-4"> */}
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-500" />
            <Select
              value={selectedMonth.toString()}
              onValueChange={(val) => setSelectedMonth(parseInt(val))}
            >
              {/* <SelectTrigger className="w-40"> */}
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((m, i) => (
                  <SelectItem key={i} value={i.toString()}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={selectedYear.toString()}
              onValueChange={(val) => setSelectedYear(parseInt(val))}
            >
              {/* <SelectTrigger className="w-28"> */}
              <SelectTrigger className="w-full sm:w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="medical-card hidden sm:block">
          <CardHeader>
            <CardTitle>
              Payroll for {months[selectedMonth]} {selectedYear}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold text-gray-600">
                      Employee
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-600">
                      Role
                    </th>
                    <th className="text-center p-3 font-semibold text-gray-600">
                      Completed Sessions
                    </th>
                    <th className="text-right p-3 font-semibold text-gray-600">
                      Gross Revenue
                    </th>
                    <th className="text-right p-3 font-semibold text-gray-600">
                      Net Pay
                    </th>
                    <th className="text-center p-3 font-semibold text-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {payrollUi
                    .filter(
                      (emp) =>
                        emp.role !== "Admin" && emp.role !== "SuperAdmin",
                    )
                    .map((emp) => (
                      <tr
                        key={emp._id}
                        className="border-b hover:bg-gray-50/50"
                      >
                        <td className="p-3">
                          <p className="font-medium text-gray-800">
                            {emp.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {emp.specialization}
                          </p>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              emp.role === "HOD"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {emp.role}
                          </span>
                        </td>
                        <td className="p-3 text-center font-medium">
                          {emp.totalSessions}
                        </td>
                        <td className="p-3 text-right text-green-600 font-medium">
                          ₹{Number(emp.grossRevenue || 0).toLocaleString()}
                        </td>
                        <td className="p-3 text-right text-blue-600 font-bold">
                          ₹{Number(emp.netPay || 0).toLocaleString()}
                        </td>
                        <td className="p-3 text-center">
                          <Button
                            size="sm"
                            onClick={() => handleViewPayslip(emp)}
                          >
                            <FileSpreadsheet size={14} className="mr-2" /> View
                            Payslip
                          </Button>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-2">
                            {/* {Permissions.isEdit && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEdit(emp)}
                              >
                                <Edit size={14} className="m-2" />
                              </Button>
                            )} */}
                            {Permissions.isDelete && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="destructive">
                                    <Trash2 size={14} />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Delete patient?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently delete the Debit.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(emp._id)}
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="medical-card sm:hidden">
          <CardHeader>
            <CardTitle>
              Payroll for {months[selectedMonth]} {selectedYear}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {payrollUi.map((emp) => (
              <motion.div
                key={emp._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border rounded-xl">
                  <CardContent className="p-4 space-y-3">
                    {/* Employee Info */}
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          {emp.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {emp.specialization}
                        </p>
                      </div>
                      {/* 
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          emp.role === "HOD"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {emp.role}
                      </span> */}
                    </div>

                    {/* Payroll Details */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sessions</span>
                        <span className="font-medium">
                          {emp.totalSessions ?? 0}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-600">Gross Revenue</span>
                        <span className="text-green-600 font-medium">
                          ₹{emp.grossRevenue.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-600">Net Pay</span>
                        <span className="text-blue-600 font-bold">
                          ₹{emp.netPay.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        {/* {Permissions.isEdit && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEdit(d)}
                          >
                            <Edit size={14} className="m-2" />
                          </Button>
                        )} */}
                        {Permissions.isDelete && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive">
                                <Trash2 size={14} />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete patient?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete the Debit.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(emp._id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>

                    {/* Action */}
                    <Button
                      size="sm"
                      className="w-full mt-3"
                      onClick={() => handleViewPayslip(emp)}
                    >
                      <FileSpreadsheet size={14} className="mr-2" />
                      View Payslip
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={isPayslipOpen} onOpenChange={setIsPayslipOpen}>
        {/* <DialogContent className="max-w-2xl"> */}
        <DialogContent className="w-[95vw] max-w-2xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Payslip for {selectedPayslip?.name}</DialogTitle>
            <DialogDescription>
              Period: {months[selectedMonth]} {selectedYear}
            </DialogDescription>
          </DialogHeader>
          {selectedPayslip && (
            // <div className="mt-4" id="payslip-content">
            <div className="mt-4 overflow-x-auto" id="payslip-content">
              <div className="border rounded-lg p-6 bg-white">
                <div className="flex justify-between items-start pb-4 border-b">
                  <div className="flex items-center gap-3">
                    <img
                      src={Logo}
                      alt="NEO Physio Logo"
                      className="h-12 w-12 object-contain"
                    />

                    <div>
                      <h2 className="text-2xl font-bold text-blue-600">
                        NEO Physio
                      </h2>
                      <p className="text-sm text-gray-500">Coimbatore</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <h3 className="text-lg font-semibold">Payslip</h3>
                    <p className="text-sm">
                      Date: {new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="font-semibold">{selectedPayslip.name}</p>
                    <p className="text-sm text-gray-600">
                      {selectedPayslip.specialization}
                    </p>
                    <p className="text-sm text-gray-600">
                      Role: {selectedPayslip.role}
                    </p>
                  </div>
                </div>
                <div className="mt-6 hidden sm:block">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="text-left p-2 font-semibold">
                          Description
                        </th>
                        <th className="text-right p-2 font-semibold">
                          Amount (₹)
                        </th>
                      </tr>
                    </thead>
                    {/* <tbody>
                      <tr className="border-b">
                        <td className="p-2">Completed Sessions</td>
                        <td className="p-2 text-right">
                          {selectedPayslip.totalSessions}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">Rate per Session</td>
                        <td className="p-2 text-right">
                          ₹{selectedPayslip.ratePerSession.toLocaleString()}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2 font-semibold">Gross Revenue</td>
                        <td className="p-2 text-right font-semibold">
                          ₹{selectedPayslip.grossRevenue.toLocaleString()}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2 text-red-600">
                          Deductions (TDS, etc.)
                        </td>
                        <td className="p-2 text-right text-red-600">
                          - ₹{selectedPayslip.deductions.toLocaleString()}
                        </td>
                      </tr>
                    </tbody> */}
                    <tbody>
                      <tr className="border-b">
                        <td className="p-2">Completed Sessions</td>
                        <td className="p-2 text-right">
                          {selectedPayslip?.totalSessions ?? 0}
                        </td>
                      </tr>

                      <tr className="border-b">
                        <td className="p-2">Basic Salary</td>
                        <td className="p-2 text-right">
                          ₹
                          {Number(
                            selectedPayslip?.basicSalary || 0,
                          ).toLocaleString()}
                        </td>
                      </tr>

                      <tr className="border-b">
                        <td className="p-2">Vehicle Maintenance</td>
                        <td className="p-2 text-right">
                          ₹
                          {Number(
                            selectedPayslip?.vehicleMaintanance || 0,
                          ).toLocaleString()}
                        </td>
                      </tr>

                      <tr className="border-b">
                        <td className="p-2">Petrol Allowance</td>
                        <td className="p-2 text-right">
                          ₹
                          {Number(
                            selectedPayslip?.petrolAmount || 0,
                          ).toLocaleString()}
                        </td>
                      </tr>

                      <tr className="border-b">
                        <td className="p-2">Incentive</td>
                        <td className="p-2 text-right">
                          ₹
                          {Number(
                            selectedPayslip?.incentive || 0,
                          ).toLocaleString()}
                        </td>
                      </tr>

                      <tr className="border-b">
                        <td className="p-2 text-red-600">Leave Deduction</td>
                        <td className="p-2 text-right text-red-600">
                          - ₹
                          {Number(
                            selectedPayslip?.deducted || 0,
                          ).toLocaleString()}
                        </td>
                      </tr>

                      <tr className="border-b">
                        <td className="p-2 font-semibold">Gross Revenue</td>
                        <td className="p-2 text-right font-semibold">
                          ₹
                          {(
                            selectedPayslip?.grossRevenue ?? 0
                          ).toLocaleString()}
                        </td>
                      </tr>

                      {/* <tr className="border-b">
                        <td className="p-2 text-red-600">
                          Deductions (TDS, etc.)
                        </td>
                        <td className="p-2 text-right text-red-600">
                          - ₹
                          {(selectedPayslip?.deductions ?? 0).toLocaleString()}
                        </td>
                      </tr> */}
                    </tbody>

                    <tfoot>
                      <tr className="bg-gray-100">
                        <td className="p-2 font-bold text-lg">Net Payable</td>
                        <td className="p-2 text-right font-bold text-lg">
                          ₹
                          {Number(
                            selectedPayslip?.netPay || 0,
                          ).toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                {/* MOBILE CARD VIEW */}
                <div className="sm:hidden mt-6 space-y-3">
                  <div className="border rounded-lg p-3 flex justify-between">
                    <span className="text-gray-600">Sessions</span>
                    <span className="font-medium">
                      {selectedPayslip.totalSessions}
                    </span>
                  </div>

                  <div className="border rounded-lg p-3 flex justify-between">
                    <span className="text-gray-600">Rate / Session</span>
                    <span className="font-medium">
                      ₹{(selectedPayslip?.ratePerSession ?? 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="border rounded-lg p-3 flex justify-between">
                    <span className="text-gray-600">Gross Revenue</span>
                    <span className="font-medium text-green-600">
                      ₹{selectedPayslip.grossRevenue.toLocaleString()}
                    </span>
                  </div>

                  {/* <div className="border rounded-lg p-3 flex justify-between">
                    <span className="text-red-600">Deductions</span>
                    <span className="font-medium text-red-600">
                      - ₹{selectedPayslip.deductions.toLocaleString()}
                    </span>
                  </div> */}

                  <div className="border rounded-lg p-4 bg-blue-50 flex justify-between">
                    <span className="font-bold text-blue-800">Net Pay</span>
                    <span className="font-bold text-blue-800 text-lg">
                      ₹{selectedPayslip.netPay.toLocaleString()}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-gray-500 mt-6 text-center">
                  This is a computer-generated payslip and does not require a
                  signature.
                </p>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={handlePrint}>
              <Printer size={16} className="mr-2" /> Print
            </Button>
            <Button onClick={handleDownload}>
              <Download size={16} className="mr-2" /> Download PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Payroll;
