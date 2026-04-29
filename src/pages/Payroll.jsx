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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

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
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);

  const [editForm, setEditForm] = useState({
    basicSalary: 0,
    vehicleMaintanance: 0,
    petrolKm: 0,
    petrolAmount: 0,
    incentive: 0,
    leaveDays: 0,
    deducted: 0,
    ESI: 0,
    PF: 0,
    savings: 0,
    paidLeaves: 0,
    unpaidLeaves: 0,
    totalLeaves: 0,
    petrolAmountPerKm: 0,
    totalWorkingDays: 0,
    attendedDays: 0,
  });
  const [originalForm, setOriginalForm] = useState({});
  const openEdit = (emp) => {
    console.log("Editing payroll for:", emp);
    setEditRow(emp);

    const formData = {
      _id: emp._id,
      name: emp.name ?? "",
      role: emp.role ?? "",
      specialization: emp.specialization ?? "",
      month: emp.month ?? "",
      year: emp.year ?? new Date().getFullYear(),
      payRollDate: emp.payRollDate ?? "",
      basicSalary: Number(emp.basicSalary ?? 0),
      vehicleMaintanance: Number(emp.vehicleMaintanance ?? 0),
      petrolKm: Number(emp.petrolKm ?? 0),
      petrolAmount: Number(emp.petrolAmount ?? 0),
      petrolAmountPerKm: Number(emp.petrolAmountPerKm ?? 0),
      incentive: Number(emp.incentive ?? 0),
      paidLeaves: Number(emp.paidLeaves ?? 0),
      unpaidLeaves: Number(emp.unpaidLeaves ?? 0),
      totalLeaves: Number(emp.totalLeaves ?? 0),
      deducted: Number(emp.manualDeduction ?? 0),
      TotalAmountDeducted: Number(emp.TotalAmountDeducted ?? 0),
      ESI: Number(emp.ESI ?? 0),
      PF: Number(emp.PF ?? 0),
      savings: Number(emp.savings ?? 0),
      totalWorkingDays: Number(emp.totalWorkingDays ?? 0),
      attendedDays: Number(emp.attendedDays ?? 0),
      grossRevenue: Number(emp.grossRevenue ?? 0),
      netPay: Number(emp.netPay ?? 0),
      totalSessions: Number(emp.totalSessions ?? 0),
    };

    setEditForm(formData);
    setOriginalForm(formData);
    setIsEditOpen(true);
  };
  // const onEditChange = (e) => {
  //   const { name, value } = e.target;
  //   // setEditForm((p) => ({ ...p, [name]: value === "" ? "" : Number(value) }));
  //   setEditForm((p) => ({ ...p, [name]: value }));
  // };
  const onEditChange = (e) => {
    const { name, value, type } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };
  const saveEdit = async () => {
    if (!editRow?._id) {
      toast({
        title: "Error",
        description: "Payroll id missing",
        variant: "destructive",
      });
      return;
    }

    try {
      const payload = { _id: editRow._id };

      // compare edited values with original
      Object.keys(editForm).forEach((key) => {
        const newValue = Number(editForm[key] ?? 0);
        const oldValue = Number(originalForm[key] ?? 0);

        if (newValue !== oldValue) {
          switch (key) {
            case "basicSalary":
              payload.basicSalary = newValue;
              break;

            case "vehicleMaintanance":
              payload.vehicleMaintanance = newValue;
              break;

            case "petrolKm":
              payload.PetrolKm = newValue;
              break;

            case "petrolAmount":
              payload.PetrolAmount = newValue;
              break;
            case "petrolAmountPerKm":
              payload.amountperKm = newValue;
              break;

            case "totalWorkingDays":
              payload.totalWorkingDays = newValue;
              break;

            case "attendedDays":
              payload.attendedDays = newValue;
              break;
            case "incentive":
              payload.Incentive = newValue;
              break;

            case "leaveDays":
              payload.TotalLeaves = newValue;
              break;

            case "deducted":
              payload.ManualDeduction = newValue;
              break;
            case "TotalAmountDeducted":
              payload.TotalAmountDeducted = newValue;
              break;
            case "ESI":
              payload.ESI = newValue;
              break;

            case "PF":
              payload.PF = newValue;
              break;

            case "savings":
              payload.savings = newValue;
              break;

            default:
              break;
          }
        }
      });

      // if no fields changed
      if (Object.keys(payload).length === 1) {
        toast({
          title: "No Changes",
          description: "Nothing was modified",
        });
        return;
      }

      await apiRequest("Payroll/updatePayroll", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      toast({ title: "Updated", description: "Payroll updated successfully" });

      setIsEditOpen(false);
      setEditRow(null);
      await getPayrolls();
    } catch (err) {
      console.log(err);
      toast({
        title: "Update Failed",
        description: err?.message || "Could not update payroll",
        variant: "destructive",
      });
    }
  };
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
      console.log("Loaded payrolls:", res);
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

  const totalNetPay = dbPayrolls
    .filter(
      (p) =>
        p.payrRollMonth === selectedMonthName &&
        Number(p.payrRollYear) === Number(selectedYear) &&
        p?.physioId?.roleId?.RoleName !== "SuperAdmin",
    )
    .reduce((sum, p) => sum + Number(p.NetSalary || 0), 0);

  const payrollUi = payrollFromDb.map((p) => {
    const paid = Number(p.PaidLeaves ?? 0);
    const unpaid = Number(p.NoofLeave ?? 0);
    const total = paid + unpaid; // calculate total dynamically

    return {
      _id: p._id,
      physioId: p.physioId?._id || p.physioId,
      name: p.physioId?.physioName || "N/A",
      specialization: p.physioId?.physioSpcl || "",
      role: p.physioId?.roleId?.RoleName || "",
      savings: p.savings ?? 0,
      totalSessions: p.payrRollCompletedSessions ?? 0,
      grossRevenue: p.TotalSalary ?? 0,
      netPay: p.NetSalary ?? 0,
      manualDeduction: p.ManualDeduction ?? 0,
      TotalAmountDeducted: p.TotalAmountDeducted ?? 0,
      basicSalary: p.basicSalary ?? 0,
      vehicleMaintanance: p.vehicleMaintanance ?? 0,
      petrolKm: p.PetrolKm ?? 0,
      petrolAmount: p.PetrolAmount ?? 0,
      petrolAmountPerKm: p.amountperKm ?? 0,
      totalWorkingDays: p.totalWorkingDays ?? 0,
      attendedDays: p.attendedDays ?? 0,
      incentive: p.Incentive ?? 0,

      paidLeaves: paid,
      unpaidLeaves: unpaid,
      totalLeaves: total, // dynamically calculated

      ESI: p.ESI ?? 0,
      PF: p.PF ?? 0,
      payRollDate: p.payRollDate,
      month: p.payrRollMonth,
      year: p.payrRollYear,
    };
  });
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
    <div className="w-full max-w-full min-w-0 space-y-4 sm:space-y-6 px-3 sm:px-4 md:px-6 pb-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col gap-2 sm:gap-3"
      >
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">
            Payroll Management
          </h1>
          <p className="text-gray-600 text-xs sm:text-sm">
            Generate monthly payslips and calculate revenue for employees.
          </p>
        </div>
      </motion.div>

      <Card className="medical-card w-full max-w-full overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">
            Generate Payroll
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Select a month and year to calculate payroll.
          </CardDescription>
        </CardHeader>

        <CardContent className="w-full">
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-2 min-w-0">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 shrink-0" />
                <Select
                  value={selectedMonth.toString()}
                  onValueChange={(val) => setSelectedMonth(parseInt(val))}
                >
                  <SelectTrigger className="w-full min-w-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    side="bottom"
                    align="start"
                    sideOffset={6}
                    avoidCollisions={false}
                    className="z-[99999] max-h-72 overflow-auto w-[--radix-select-trigger-width] bg-white border shadow-lg h-[200px]"
                  >
                    {months.map((m, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 min-w-0">
                <Select
                  value={selectedYear.toString()}
                  onValueChange={(val) => setSelectedYear(parseInt(val))}
                >
                  <SelectTrigger className="w-full min-w-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    side="bottom"
                    align="start"
                    sideOffset={6}
                    avoidCollisions={false}
                    className="z-[99999] max-h-72 overflow-auto w-[--radix-select-trigger-width] bg-white border shadow-lg h-[200px]"
                  >
                    {years.map((y) => (
                      <SelectItem key={y} value={y.toString()}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="w-full rounded-lg border bg-slate-50 px-3 py-3">
              <p className="text-[11px] sm:text-xs text-gray-500">
                Total Net Salary
              </p>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 break-words">
                ₹{Number(totalNetPay || 0).toLocaleString("en-IN")}
              </h2>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* desktop table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="hidden xl:block"
      >
        <Card className="medical-card w-full">
          <CardHeader>
            <CardTitle>
              Payroll for {months[selectedMonth]} {selectedYear}
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="w-full overflow-x-auto">
              <table className="min-w-full text-sm">
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
                    .filter((emp) => emp.role !== "SuperAdmin")
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
                          ₹
                          {Number(emp.grossRevenue || 0).toLocaleString(
                            "en-IN",
                          )}
                        </td>
                        <td className="p-3 text-right text-blue-600 font-bold">
                          ₹{Number(emp.netPay || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-2 flex-wrap">
                            <Button
                              size="sm"
                              onClick={() => handleViewPayslip(emp)}
                            >
                              <FileSpreadsheet size={14} className="mr-2" />
                              View Payslip
                            </Button>

                            {Permissions.isEdit && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEdit(emp)}
                              >
                                <Edit size={14} />
                              </Button>
                            )}

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
                                      Delete payroll?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently delete the payroll.
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

      {/* mobile + tablet cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="xl:hidden"
      >
        <Card className="medical-card w-full max-w-full overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm sm:text-base">
              Payroll for {months[selectedMonth]} {selectedYear}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            {payrollUi
              .filter((emp) => emp.role !== "SuperAdmin")
              .map((emp) => (
                <motion.div
                  key={emp._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="w-full border rounded-xl shadow-sm overflow-hidden">
                    <CardContent className="p-3 sm:p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm sm:text-base font-semibold text-gray-800 break-words">
                            {emp.name}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-500 break-words">
                            {emp.specialization}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 px-2 py-1 rounded-full text-[10px] sm:text-xs font-medium ${
                            emp.role === "HOD"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {emp.role}
                        </span>
                      </div>

                      <div className="space-y-2 text-xs sm:text-sm">
                        <div className="flex justify-between gap-3">
                          <span className="text-gray-600">Sessions</span>
                          <span className="font-medium">
                            {emp.totalSessions ?? 0}
                          </span>
                        </div>

                        <div className="flex justify-between gap-3">
                          <span className="text-gray-600">Gross Revenue</span>
                          <span className="text-green-600 font-medium text-right break-words">
                            ₹
                            {Number(emp.grossRevenue || 0).toLocaleString(
                              "en-IN",
                            )}
                          </span>
                        </div>

                        <div className="flex justify-between gap-3">
                          <span className="text-gray-600">Net Pay</span>
                          <span className="text-blue-600 font-bold text-right break-words">
                            ₹{Number(emp.netPay || 0).toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => handleViewPayslip(emp)}
                        >
                          <FileSpreadsheet size={14} className="mr-2" />
                          View Payslip
                        </Button>

                        <div className="flex items-center justify-center sm:justify-end gap-2">
                          {Permissions.isEdit && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEdit(emp)}
                            >
                              <Edit size={14} />
                            </Button>
                          )}

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
                                    Delete payroll?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete the payroll.
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
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={isPayslipOpen} onOpenChange={setIsPayslipOpen}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              Payslip for {selectedPayslip?.name}
            </DialogTitle>
            <DialogDescription>
              Period: {months[selectedMonth]} {selectedYear}
            </DialogDescription>
          </DialogHeader>

          {selectedPayslip && (
            <div className="mt-4 overflow-x-auto" id="payslip-content">
              <div className="border rounded-lg p-4 sm:p-6 bg-white">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b">
                  <div className="flex items-center gap-3">
                    <img
                      src={Logo}
                      alt="NEO Physio Logo"
                      className="h-10 w-10 sm:h-12 sm:w-12 object-contain"
                    />
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-blue-600">
                        NEO Physio
                      </h2>
                      <p className="text-sm text-gray-500">Coimbatore</p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <h3 className="text-base sm:text-lg font-semibold">
                      Payslip
                    </h3>
                    <p className="text-sm">
                      Date: {new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
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
                          ).toLocaleString("en-IN")}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">Vehicle Maintenance</td>
                        <td className="p-2 text-right">
                          ₹
                          {Number(
                            selectedPayslip?.vehicleMaintanance || 0,
                          ).toLocaleString("en-IN")}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">Petrol Allowance</td>
                        <td className="p-2 text-right">
                          ₹
                          {Number(
                            selectedPayslip?.petrolAmount || 0,
                          ).toLocaleString("en-IN")}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">Incentive</td>
                        <td className="p-2 text-right">
                          ₹
                          {Number(
                            selectedPayslip?.incentive || 0,
                          ).toLocaleString("en-IN")}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2 text-gray-600">No of Leave Days</td>
                        <td className="p-2 text-right text-gray-600">
                          {Number(
                            selectedPayslip?.leaveDays || 0,
                          ).toLocaleString("en-IN")}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2 text-red-600">Total Deduction</td>
                        <td className="p-2 text-right text-red-600">
                          - ₹
                          {Number(
                            selectedPayslip?.TotalAmountDeducted || 0,
                          ).toLocaleString("en-IN")}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2 text-red-600">Leave Deduction</td>
                        <td className="p-2 text-right text-red-600">
                          - ₹
                          {Number(
                            selectedPayslip?.deducted || 0,
                          ).toLocaleString("en-IN")}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2 font-semibold">Gross Revenue</td>
                        <td className="p-2 text-right font-semibold">
                          ₹
                          {Number(
                            selectedPayslip?.grossRevenue || 0,
                          ).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-100">
                        <td className="p-2 font-bold text-lg">Net Payable</td>
                        <td className="p-2 text-right font-bold text-lg">
                          ₹
                          {Number(selectedPayslip?.netPay || 0).toLocaleString(
                            "en-IN",
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="sm:hidden mt-6 space-y-3">
                  <div className="border rounded-lg p-3 flex justify-between">
                    <span className="text-gray-600">Sessions</span>
                    <span className="font-medium">
                      {selectedPayslip?.totalSessions ?? 0}
                    </span>
                  </div>

                  <div className="border rounded-lg p-3 flex justify-between">
                    <span className="text-gray-600">Basic Salary</span>
                    <span className="font-medium">
                      ₹
                      {Number(selectedPayslip?.basicSalary || 0).toLocaleString(
                        "en-IN",
                      )}
                    </span>
                  </div>

                  <div className="border rounded-lg p-3 flex justify-between">
                    <span className="text-gray-600">Vehicle Maintenance</span>
                    <span className="font-medium">
                      ₹
                      {Number(
                        selectedPayslip?.vehicleMaintanance || 0,
                      ).toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="border rounded-lg p-3 flex justify-between">
                    <span className="text-gray-600">Petrol Allowance</span>
                    <span className="font-medium">
                      ₹
                      {Number(
                        selectedPayslip?.petrolAmount || 0,
                      ).toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="border rounded-lg p-3 flex justify-between">
                    <span className="text-gray-600">Incentive</span>
                    <span className="font-medium">
                      ₹
                      {Number(selectedPayslip?.incentive || 0).toLocaleString(
                        "en-IN",
                      )}
                    </span>
                  </div>

                  <div className="border rounded-lg p-3 flex justify-between">
                    <span className="text-gray-600">Leave Days</span>
                    <span className="font-medium">
                      {Number(selectedPayslip?.leaveDays || 0).toLocaleString(
                        "en-IN",
                      )}
                    </span>
                  </div>

                  <div className="border rounded-lg p-3 flex justify-between">
                    <span className="text-red-600">Leave Deduction</span>
                    <span className="font-medium text-red-600">
                      - ₹
                      {Number(selectedPayslip?.deducted || 0).toLocaleString(
                        "en-IN",
                      )}
                    </span>
                  </div>

                  <div className="border rounded-lg p-3 flex justify-between">
                    <span className="text-gray-600">Gross Revenue</span>
                    <span className="font-medium text-green-600">
                      ₹
                      {Number(
                        selectedPayslip?.grossRevenue || 0,
                      ).toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="border rounded-lg p-4 bg-blue-50 flex justify-between">
                    <span className="font-bold text-blue-800">Net Pay</span>
                    <span className="font-bold text-blue-800 text-lg">
                      ₹
                      {Number(selectedPayslip?.netPay || 0).toLocaleString(
                        "en-IN",
                      )}
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

          <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={handlePrint}
              className="w-full sm:w-auto"
            >
              <Printer size={16} className="mr-2" /> Print
            </Button>
            <Button onClick={handleDownload} className="w-full sm:w-auto">
              <Download size={16} className="mr-2" /> Download PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="w-[95vw] max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Payroll</DialogTitle>
            <DialogDescription>
              {editRow?.name} • {months[selectedMonth]} {selectedYear}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Basic Salary</Label>
              <Input
                name="basicSalary"
                type="number"
                value={editForm.basicSalary}
                onChange={onEditChange}
                onWheel={(e) => e.target.blur()}
              />
            </div>
            <div className="space-y-2">
              <Label>Total Working Days</Label>
              <Input
                name="totalWorkingDays"
                type="number"
                value={editForm.totalWorkingDays}
                onChange={onEditChange}
                onWheel={(e) => e.target.blur()}
              />
            </div>
            <div className="space-y-2">
              <Label>Physio Working Days (Includes Sunday)</Label>
              <Input
                name="attendedDays"
                type="number"
                value={editForm.attendedDays}
                onChange={onEditChange}
                onWheel={(e) => e.target.blur()}
              />
            </div>
            <div className="space-y-2">
              <Label>Paid Leaves</Label>
              <Input
                name="paidLeaves"
                type="number"
                value={editForm.paidLeaves}
                onChange={onEditChange}
                disabled
                onWheel={(e) => e.target.blur()}
              />
            </div>
            <div className="space-y-2">
              <Label>Unpaid Leaves</Label>
              <Input
                name="unpaidLeaves"
                type="number"
                value={editForm.unpaidLeaves}
                onChange={onEditChange}
                disabled
                onWheel={(e) => e.target.blur()}
              />
            </div>
            <div className="space-y-2">
              <Label>Total Leave</Label>
              <Input
                name="noOfLeave"
                type="number"
                disabled
                value={editForm.totalLeaves}
                onChange={onEditChange}
                onWheel={(e) => e.target.blur()}
              />
            </div>
            <div className="space-y-2">
              <Label>Vehicle Maintenance</Label>
              <Input
                name="vehicleMaintanance"
                type="number"
                value={editForm.vehicleMaintanance}
                onChange={onEditChange}
                onWheel={(e) => e.target.blur()}
              />
            </div>
            <div className="space-y-2">
              <Label>Petrol Km</Label>
              <Input
                name="petrolKm"
                type="number"
                value={editForm.petrolKm}
                onChange={onEditChange}
                onWheel={(e) => e.target.blur()}
              />
            </div>
            <div className="space-y-2">
              <Label>Petrol Amount</Label>
              <Input
                name="petrolAmount"
                type="number"
                disabled
                value={editForm.petrolAmount}
                onChange={onEditChange}
                onWheel={(e) => e.target.blur()}
              />
            </div>{" "}
            <div className="space-y-2">
              <Label>Petrol Amount / KM</Label>
              <Input
                name="petrolAmountPerKm"
                type="number"
                value={editForm.petrolAmountPerKm}
                onChange={onEditChange}
                onWheel={(e) => e.target.blur()}
              />
            </div>
            <div className="space-y-2">
              <Label>Incentive</Label>
              <Input
                name="incentive"
                type="number"
                value={editForm.incentive}
                onChange={onEditChange}
                onWheel={(e) => e.target.blur()}
              />
            </div>
            {/* <div className="space-y-2">
              <Label>No. of Leave</Label>
              <Input
                name="leaveDays"
                type="number"
                value={editForm.leaveDays}
                onChange={onEditChange}
                onWheel={(e) => e.target.blur()}
              />
            </div> */}
            <div className="space-y-2">
              <Label>Deducted Amount</Label>
              <Input
                name="deducted"
                type="number"
                value={editForm.deducted}
                onChange={onEditChange}
                onWheel={(e) => e.target.blur()}
              />
            </div>
            <div className="space-y-2">
              <Label>Total Deducted Amount</Label>
              <Input
                name="TotalAmountDeducted"
                type="number"
                value={editForm.TotalAmountDeducted}
                onChange={onEditChange}
                onWheel={(e) => e.target.blur()}
              />
            </div>
            <div className="space-y-2">
              <Label>ESI</Label>
              <Input
                name="ESI"
                type="number"
                value={editForm.ESI}
                onChange={onEditChange}
                onWheel={(e) => e.target.blur()}
              />
            </div>
            <div className="space-y-2">
              <Label>PF</Label>
              <Input
                name="PF"
                type="number"
                value={editForm.PF}
                onChange={onEditChange}
                onWheel={(e) => e.target.blur()}
              />
            </div>
            <div className="space-y-2">
              <Label>Savings</Label>
              <Input
                name="savings"
                type="number"
                value={editForm.savings}
                onChange={onEditChange}
                onWheel={(e) => e.target.blur()}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setIsEditOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button onClick={saveEdit} className="w-full sm:w-auto">
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Payroll;
