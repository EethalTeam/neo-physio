import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { Trash2, Edit, Plus, Calendar } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { apiRequest } from "@/components/CustomComponents/apiRequest";

const Credit = () => {
  const navigate = useNavigate();
  const { getPermissionsByPath } = useAuth();

  const [Permissions, setPermissions] = useState({
    isAdd: false,
    isView: false,
    isEdit: false,
    isDelete: false,
  });

  const [patients, setPatients] = useState([]);
  const [credits, setCredits] = useState([]);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCredit, setEditingCredit] = useState(null);

  const [form, setForm] = useState({
    patientId: "",
    CreditAmount: "",
    CreditDate: new Date().toISOString().slice(0, 10), // yyyy-mm-dd
    Creditdescription: "",
    Creditfeedback: "",
    Creditnotes: "",
  });

  // ✅ Permissions
  useEffect(() => {
    getPermissionsByPath(window.location.pathname).then((res) => {
      if (res) setPermissions(res);
      else navigate("/dashboard");
    });
  }, []);

  // ✅ Patients (for Add/Edit)
  const getPatients = async () => {
    try {
      const res = await apiRequest("Patient/getAllPatient", {
        method: "POST",
        body: JSON.stringify({}),
      });
      const list = res?.patients || res || [];
      setPatients(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("getPatients error:", err);
      setPatients([]);
    }
  };

  // ✅ Credits list
  const getAllCredits = async () => {
    try {
      const res = await apiRequest("Credit/getAllCredit", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const list = res?.credits || res || [];
      setCredits(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("getAllCredits error:", err);
      setCredits([]);
    }
  };

  // Load data only if View permission
  useEffect(() => {
    if (Permissions.isView) {
      getAllCredits();
      getPatients();
    }
  }, [Permissions.isView]);

  const resetForm = () => {
    setForm({
      patientId: "",
      CreditAmount: "",
      CreditDate: new Date().toISOString().slice(0, 10),
      Creditdescription: "",
      Creditfeedback: "",
      Creditnotes: "",
    });
  };

  const openCreate = () => {
    setEditingCredit(null);
    resetForm();
    setIsFormOpen(true);
  };

  const openEdit = (item) => {
    setEditingCredit(item);

    const patientId =
      typeof item.patientId === "object" ? item.patientId?._id : item.patientId;

    const isoDate = item.CreditDate
      ? new Date(item.CreditDate).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);

    setForm({
      patientId: patientId || "",
      CreditAmount: item.CreditAmount ?? "",
      CreditDate: isoDate,
      Creditdescription: item.Creditdescription ?? "",
      Creditfeedback: item.Creditfeedback ?? "",
      Creditnotes: item.Creditnotes ?? "",
    });

    setIsFormOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const validate = () => {
    if (!form.patientId) {
      toast({
        title: "Alert",
        description: "Select a patient",
        variant: "destructive",
      });
      return false;
    }
    if (!form.CreditAmount || Number(form.CreditAmount) <= 0) {
      toast({
        title: "Alert",
        description: "Enter valid credit amount",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const payload = {
        patientId: form.patientId,
        CreditAmount: Number(form.CreditAmount),
        CreditDate: new Date(form.CreditDate),
        Creditdescription: form.Creditdescription,
        Creditfeedback: form.Creditfeedback,
        Creditnotes: form.Creditnotes,
      };

      if (editingCredit?._id) {
        await apiRequest("Credit/updateCredit", {
          method: "POST",
          body: JSON.stringify({ _id: editingCredit._id, ...payload }),
        });
        toast({ title: "Success", description: "Credit updated successfully" });
      } else {
        await apiRequest("Credit/createCredit", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast({ title: "Success", description: "Credit created successfully" });
      }

      setIsFormOpen(false);
      await getAllCredits();
    } catch (err) {
      toast({
        title: "Error",
        description: err?.message || "Failed",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiRequest("Credit/deleteCredit", {
        method: "POST",
        body: JSON.stringify({ _id: id }),
      });
      toast({ title: "Deleted", description: "Credit deleted successfully" });
      await getAllCredits();
    } catch (err) {
      toast({
        title: "Error",
        description: err?.message || "Delete failed",
        variant: "destructive",
      });
    }
  };

  // Filters
  const months = useMemo(
    () => [
      { label: "January", value: 1 },
      { label: "February", value: 2 },
      { label: "March", value: 3 },
      { label: "April", value: 4 },
      { label: "May", value: 5 },
      { label: "June", value: 6 },
      { label: "July", value: 7 },
      { label: "August", value: 8 },
      { label: "September", value: 9 },
      { label: "October", value: 10 },
      { label: "November", value: 11 },
      { label: "December", value: 12 },
    ],
    [],
  );

  const years = useMemo(() => {
    const y = new Date().getFullYear();
    return Array.from({ length: 10 }, (_, i) => y - 3 + i);
  }, []);

  const filteredCredits = useMemo(() => {
    return credits.filter((c) => {
      if (!c.CreditDate) return false;
      const date = new Date(c.CreditDate);
      return (
        date.getMonth() + 1 === selectedMonth &&
        date.getFullYear() === selectedYear
      );
    });
  }, [credits, selectedMonth, selectedYear]);
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [payingCredit, setPayingCredit] = useState(null);

  const [payForm, setPayForm] = useState({
    receivedAmount: "",
    receivedDate: new Date().toISOString().slice(0, 10),
    notes: "",
  });
  const openPay = (credit) => {
    setPayingCredit(credit);
    setPayForm({
      receivedAmount: "",
      receivedDate: new Date().toISOString().slice(0, 10),
      notes: "",
    });
    setIsPayOpen(true);
  };

  const handlePay = async (e) => {
    e.preventDefault();
    if (!payingCredit?._id) return;

    const received = Number(payForm.receivedAmount || 0);
    if (received <= 0) {
      toast({
        title: "Alert",
        description: "Enter valid received amount",
        variant: "destructive",
      });
      return;
    }

    const total = Number(payingCredit?.CreditAmount || 0);
    if (received > total) {
      toast({
        title: "Alert",
        description: `Received amount cannot be greater than ₹${total}`,
        variant: "destructive",
      });
      return;
    }

    try {
      await apiRequest("Credit/payCredit", {
        method: "POST",
        body: JSON.stringify({
          creditId: payingCredit._id,
          receivedAmount: received,
          receivedDate: payForm.receivedDate,
          notes: payForm.notes,
        }),
      });

      toast({ title: "Success", description: "Payment recorded successfully" });
      setIsPayOpen(false);
      setPayingCredit(null);
      await getAllCredits();
    } catch (err) {
      toast({
        title: "Error",
        description: err?.message || "Payment failed",
        variant: "destructive",
      });
    }
  };

  const totalCreditAmount = filteredCredits.reduce(
    (sum, p) => sum + Number(p.CreditAmount || 0),
    0,
  );
  return (
    <div className="space-y-6 overflow-x-hidden">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-start justify-between gap-3"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Credit Management
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Add, edit, and manage credit entries for patients.
          </p>
        </div>

        {Permissions.isAdd && (
          <Button onClick={openCreate}>
            <Plus size={16} className="mr-2" />
            Add Credit
          </Button>
        )}
      </motion.div>

      {/* Filters */}
      <Card className="medical-card">
        <CardHeader>
          <CardTitle>Filter</CardTitle>
          <CardDescription>Select month and year</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-500" />
            <Select
              value={String(selectedMonth)}
              onValueChange={(v) => setSelectedMonth(Number(v))}
            >
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={m.value} value={String(m.value)}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Select
            value={String(selectedYear)}
            onValueChange={(v) => setSelectedYear(Number(v))}
          >
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="text-sm text-gray-600 sm:ml-auto">
            Total Credit Amount:{" "}
            <span className="font-semibold">{totalCreditAmount}</span>
          </div>
          <div className="text-sm text-gray-600 sm:ml-auto">
            Total:{" "}
            <span className="font-semibold">{filteredCredits.length}</span>
          </div>
        </CardContent>
      </Card>

      {/* VIEW ONLY if permitted */}
      {Permissions.isView && (
        <Card className="medical-card hidden sm:block">
          <CardHeader>
            <CardTitle>Credits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold text-gray-600">
                      Patient
                    </th>
                    <th className="text-right p-3 font-semibold text-gray-600">
                      Amount
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-600">
                      Description
                    </th>
                    {Permissions.isEdit && Permissions.isDelete && (
                      <th className="text-center p-3 font-semibold text-gray-600">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {filteredCredits.map((c) => {
                    const p =
                      typeof c.patientId === "object" ? c.patientId : null;
                    const name =
                      p?.patientName || c.patientName || "Unknown Patient";
                    const code = p?.patientCode || c.patientCode || "";

                    return (
                      <tr key={c._id} className="border-b hover:bg-gray-50/50">
                        <td className="p-3">
                          <div className="font-medium text-gray-800">
                            {name}
                          </div>
                          <div className="text-xs text-gray-500">{code}</div>
                        </td>
                        {/* 
                        <td className="p-3">
                          {c.CreditDate
                            ? new Date(c.CreditDate).toLocaleDateString()
                            : "-"}
                        </td> */}

                        <td className="p-3 text-right font-semibold text-green-700">
                          ₹{Number(c.CreditAmount || 0).toLocaleString()}
                        </td>

                        <td className="p-3">
                          <div className="line-clamp-2 text-gray-700">
                            {c.Creditdescription || "-"}
                          </div>
                        </td>
                        <td>
                          <Button size="sm" onClick={() => openPay(c)}>
                            Pay
                          </Button>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-2">
                            {Permissions.isEdit && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEdit(c)}
                              >
                                <Edit size={14} className="m-2" />
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
                                      Delete credit?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently delete the credit
                                      entry.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(c._id)}
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
                    );
                  })}

                  {filteredCredits.length === 0 && (
                    <tr>
                      <td className="p-4 text-center text-gray-500" colSpan={5}>
                        No credits found for selected month/year.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
      <Dialog open={isPayOpen} onOpenChange={setIsPayOpen}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle>Receive Payment</DialogTitle>
            <DialogDescription>
              Enter received amount for this credit.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePay} className="space-y-4">
            <div className="text-sm text-gray-700">
              <div className="flex justify-between">
                <span>Total Credit</span>
                <span className="font-semibold">
                  ₹{Number(payingCredit?.CreditAmount || 0).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Received Amount</Label>
              <Input
                type="number"
                value={payForm.receivedAmount}
                onChange={(e) =>
                  setPayForm((p) => ({ ...p, receivedAmount: e.target.value }))
                }
                placeholder="Enter received amount"
              />
            </div>

            <div className="space-y-2">
              <Label>Received Date</Label>
              <Input
                type="date"
                value={payForm.receivedDate}
                onChange={(e) =>
                  setPayForm((p) => ({ ...p, receivedDate: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={payForm.notes}
                onChange={(e) =>
                  setPayForm((p) => ({ ...p, notes: e.target.value }))
                }
                placeholder="Optional notes"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPayOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Confirm</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      {/* Create/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCredit ? "Edit Credit" : "Create Credit"}
            </DialogTitle>
            <DialogDescription>
              Fill the credit details and save.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Patient</Label>
              <Select
                value={form.patientId}
                onValueChange={(val) =>
                  setForm((p) => ({ ...p, patientId: val }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((p) => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.patientName} ({p.patientCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Credit Amount</Label>
                <Input
                  type="number"
                  name="CreditAmount"
                  value={form.CreditAmount}
                  onChange={handleChange}
                  placeholder="Enter amount"
                />
              </div>

              <div className="space-y-2">
                <Label>Credit Date</Label>
                <Input
                  type="date"
                  name="CreditDate"
                  value={form.CreditDate}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                name="Creditdescription"
                value={form.Creditdescription}
                onChange={handleChange}
                placeholder="Enter description"
              />
            </div>

            <div className="space-y-2">
              <Label>Feedback</Label>
              <Textarea
                name="Creditfeedback"
                value={form.Creditfeedback}
                onChange={handleChange}
                placeholder="Enter feedback"
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                name="Creditnotes"
                value={form.Creditnotes}
                onChange={handleChange}
                placeholder="Enter notes"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">{editingCredit ? "Update" : "Save"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Credit;
