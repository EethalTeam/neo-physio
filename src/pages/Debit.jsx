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

const Debit = () => {
  const [patients, setPatients] = useState([]);
  const [debits, setDebits] = useState([]);

  const [selectedMonth, setSelectedMonth] = useState(
    new Date().getMonth() + 1, // 1-12
  );
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDebit, setEditingDebit] = useState(null);

  const [form, setForm] = useState({
    patientId: "",
    DebitAmount: "",
    DebitDate: new Date().toISOString().slice(0, 10), // yyyy-mm-dd
    Debitdescription: "",
    Debitfeedback: "",
    Debitnotes: "",
  });

  useEffect(() => {
    getPatients();
    getAllDebits();
  }, []);

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

  const getAllDebits = async () => {
    try {
      const res = await apiRequest("Debit/getAllDebit", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const list = res?.debits || res || [];
      setDebits(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("getAllDebits error:", err);
      setDebits([]);
    }
  };

  const resetForm = () => {
    setForm({
      patientId: "",
      DebitAmount: "",
      DebitDate: new Date().toISOString().slice(0, 10),
      DebitMonth: selectedMonth,
      DebitYear: selectedYear,
      Debitdescription: "",
      Debitfeedback: "",
      Debitnotes: "",
    });
  };

  const openCreate = () => {
    setEditingDebit(null);
    resetForm();
    setIsFormOpen(true);
  };

  const openEdit = (item) => {
    setEditingDebit(item);

    const patientId =
      typeof item.patientId === "object" ? item.patientId?._id : item.patientId;

    // date can be ISO or string
    const isoDate = item.DebitDate
      ? new Date(item.DebitDate).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);

    setForm({
      patientId: patientId || "",
      DebitAmount: item.DebitAmount ?? "",
      DebitDate: isoDate,
      DebitMonth: item.DebitMonth ?? selectedMonth,
      DebitYear: item.DebitYear ?? selectedYear,
      Debitdescription: item.Debitdescription ?? "",
      Debitfeedback: item.Debitfeedback ?? "",
      Debitnotes: item.Debitnotes ?? "",
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
    if (!form.DebitAmount || Number(form.DebitAmount) <= 0) {
      toast({
        title: "Alert",
        description: "Enter valid debit amount",
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
        DebitAmount: Number(form.DebitAmount),
        DebitDate: new Date(form.DebitDate),
        Debitdescription: form.Debitdescription,
        Debitfeedback: form.Debitfeedback,
        Debitnotes: form.Debitnotes,
      };

      if (editingDebit?._id) {
        await apiRequest("Debit/updateDebit", {
          method: "POST",
          body: JSON.stringify({ _id: editingDebit._id, ...payload }),
        });
        toast({ title: "Success", description: "Debit updated successfully" });
      } else {
        await apiRequest("Debit/createDebit", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast({ title: "Success", description: "Debit created successfully" });
      }

      setIsFormOpen(false);
      await getAllDebits();
    } catch (err) {
      toast({
        title: "Error",
        description: err?.message || "Failed",
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
  // console.log(Permissions,"Permissions")
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
  useEffect(() => {
    if (Permissions.isView) {
      getAllDebits();
    }
  }, [Permissions]);
  const handleDelete = async (id) => {
    try {
      await apiRequest("Debit/deleteDebit", {
        method: "POST",
        body: JSON.stringify({ _id: id }),
      });
      toast({ title: "Deleted", description: "Debit deleted successfully" });
      await getAllDebits();
    } catch (err) {
      toast({
        title: "Error",
        description: err?.message || "Delete failed",
        variant: "destructive",
      });
    }
  };

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

  const filteredDebits = useMemo(() => {
    return debits.filter((d) => {
      if (!d.DebitDate) return false;
      const date = new Date(d.DebitDate);
      return (
        date.getMonth() + 1 === selectedMonth &&
        date.getFullYear() === selectedYear
      );
    });
  }, [debits, selectedMonth, selectedYear]);

  return (
    <div className="space-y-6 overflow-x-hidden">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-start justify-between gap-3"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Debit Management</h1>
          <p className="text-gray-600 text-sm mt-1">
            Add, edit, and manage debit entries for patients.
          </p>
        </div>
        {Permissions.isAdd && (
          <Button onClick={openCreate}>
            <Plus size={16} className="mr-2" />
            Add Debit
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
            Total:{" "}
            <span className="font-semibold">{filteredDebits.length}</span>
          </div>
        </CardContent>
      </Card>
      {Permissions.isView && (
        <Card className="medical-card hidden sm:block">
          <CardHeader>
            <CardTitle>Debits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold text-gray-600">
                      Patient
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-600">
                      Date
                    </th>
                    <th className="text-right p-3 font-semibold text-gray-600">
                      Amount
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-600">
                      Description
                    </th>
                    <th className="text-center p-3 font-semibold text-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDebits.map((d) => {
                    const p =
                      typeof d.patientId === "object" ? d.patientId : null;
                    const name =
                      p?.patientName || d.patientName || "Unknown Patient";
                    const code = p?.patientCode || d.patientCode || "";
                    return (
                      <tr key={d._id} className="border-b hover:bg-gray-50/50">
                        <td className="p-3">
                          <div className="font-medium text-gray-800">
                            {name}
                          </div>
                          <div className="text-xs text-gray-500">{code}</div>
                        </td>
                        <td className="p-3">
                          {d.DebitDate
                            ? new Date(d.DebitDate).toLocaleDateString()
                            : "-"}
                        </td>
                        <td className="p-3 text-right font-semibold text-blue-700">
                          ₹{Number(d.DebitAmount || 0).toLocaleString()}
                        </td>
                        <td className="p-3">
                          <div className="line-clamp-2 text-gray-700">
                            {d.Debitdescription || "-"}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-2">
                            {Permissions.isEdit && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEdit(d)}
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
                                      onClick={() => handleDelete(d._id)}
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

                  {filteredDebits.length === 0 && (
                    <tr>
                      <td className="p-4 text-center text-gray-500" colSpan={5}>
                        No debits found for selected month/year.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
      {Permissions.isView && (
        <Card className="medical-card sm:hidden">
          <CardHeader>
            <CardTitle>Debits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredDebits.map((d) => {
              const p = typeof d.patientId === "object" ? d.patientId : null;
              const name = p?.patientName || d.patientName || "Unknown Patient";
              const code = p?.patientCode || d.patientCode || "";

              return (
                <div key={d._id} className="border rounded-xl p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-gray-800">{name}</div>
                      <div className="text-xs text-gray-500">{code}</div>
                    </div>
                    <div className="font-bold text-blue-700">
                      ₹{Number(d.DebitAmount || 0).toLocaleString()}
                    </div>
                  </div>

                  <div className="text-sm text-gray-600">
                    Date:{" "}
                    <span className="font-medium text-gray-800">
                      {d.DebitDate
                        ? new Date(d.DebitDate).toLocaleDateString()
                        : "-"}
                    </span>
                  </div>

                  <div className="text-sm text-gray-700">
                    {d.Debitdescription || "-"}
                  </div>

                  <div className="flex gap-2 pt-2">
                    {Permissions.isEdit && (
                      <Button
                        size="sm"
                        className="w-full"
                        variant="outline"
                        onClick={() => openEdit(d)}
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
                            <AlertDialogTitle>Delete patient?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the Debit.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(d._id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredDebits.length === 0 && (
              <div className="text-center text-gray-500">
                No debits found for selected month/year.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingDebit ? "Edit Debit" : "Create Debit"}
            </DialogTitle>
            <DialogDescription>
              Fill the debit details and save.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Patient */}
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

            {/* Amount + Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Debit Amount</Label>
                <Input
                  type="number"
                  onWheel={(e) => {
                    e.target.blur();
                  }}
                  name="DebitAmount"
                  value={form.DebitAmount}
                  onChange={handleChange}
                  placeholder="Enter amount"
                />
              </div>

              <div className="space-y-2">
                <Label>Debit Date</Label>
                <Input
                  type="date"
                  name="DebitDate"
                  value={form.DebitDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                />
              </div>
            </div>
            {/* 
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Debit Month</Label>
                <Input
                  type="number"
                  min={1}
                  max={12}
                  name="DebitMonth"
                  value={form.DebitMonth}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label>Debit Year</Label>
                <Input
                  type="number"
                  name="DebitYear"
                  value={form.DebitYear}
                  onChange={handleChange}
                />
              </div>
            </div> */}

            {/* Description */}
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                name="Debitdescription"
                value={form.Debitdescription}
                onChange={handleChange}
                placeholder="Enter description"
              />
            </div>

            {/* Feedback */}
            <div className="space-y-2">
              <Label>Feedback</Label>
              <Textarea
                name="Debitfeedback"
                value={form.Debitfeedback}
                onChange={handleChange}
                placeholder="Enter feedback"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                name="Debitnotes"
                value={form.Debitnotes}
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
              <Button type="submit">{editingDebit ? "Update" : "Save"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Debit;
