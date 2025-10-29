import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { FileSpreadsheet, Calendar, Download, Printer } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const Payroll = () => {
  const [employees, setEmployees] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [payrollData, setPayrollData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isPayslipOpen, setIsPayslipOpen] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch('/mockdata/physios.json').then(res => res.json()),
      fetch('/mockdata/sessions.json').then(res => res.json())
    ]).then(([physiosData, sessionsData]) => {
      setEmployees(physiosData.filter(p => p.active));
      setSessions(sessionsData);
    }).catch(err => console.error('Error loading data:', err));
  }, []);

  useEffect(() => {
    if (employees.length > 0 && sessions.length > 0) {
      const data = employees.map(emp => {
        const employeeSessions = sessions.filter(s =>
          s.physioId === emp.id &&
          s.status === 'completed' &&
          new Date(s.sessionDate).getMonth() === selectedMonth &&
          new Date(s.sessionDate).getFullYear() === selectedYear
        );
        const totalSessions = employeeSessions.length;
        const grossRevenue = totalSessions * emp.ratePerSession;
        const deductions = grossRevenue * 0.1; // Mock 10% deduction
        const netPay = grossRevenue - deductions;

        return {
          ...emp,
          totalSessions,
          grossRevenue,
          deductions,
          netPay
        };
      });
      setPayrollData(data);
    }
  }, [employees, sessions, selectedMonth, selectedYear]);

  const handleViewPayslip = (employeeData) => {
    setSelectedPayslip(employeeData);
    setIsPayslipOpen(true);
  };

  const handlePrint = () => {
    toast({ title: "Printing...", description: "Your payslip is being sent to the printer." });
  };

  const handleDownload = () => {
    toast({ title: "Downloading...", description: "Payslip PDF is being generated." });
  };

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const years = [new Date().getFullYear(), new Date().getFullYear() - 1];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Payroll Management</h1>
          <p className="text-gray-600">Generate monthly payslips and calculate revenue for employees.</p>
        </div>
      </motion.div>

      <Card className="medical-card">
        <CardHeader>
          <CardTitle>Generate Payroll</CardTitle>
          <CardDescription>Select a month and year to calculate payroll.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-500" />
            <Select value={selectedMonth.toString()} onValueChange={(val) => setSelectedMonth(parseInt(val))}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>{months.map((m, i) => <SelectItem key={i} value={i.toString()}>{m}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedYear.toString()} onValueChange={(val) => setSelectedYear(parseInt(val))}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>{years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
        <Card className="medical-card">
          <CardHeader>
            <CardTitle>Payroll for {months[selectedMonth]} {selectedYear}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold text-gray-600">Employee</th>
                    <th className="text-left p-3 font-semibold text-gray-600">Role</th>
                    <th className="text-center p-3 font-semibold text-gray-600">Completed Sessions</th>
                    <th className="text-right p-3 font-semibold text-gray-600">Gross Revenue</th>
                    <th className="text-right p-3 font-semibold text-gray-600">Net Pay</th>
                    <th className="text-center p-3 font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payrollData.map(emp => (
                    <tr key={emp.id} className="border-b hover:bg-gray-50/50">
                      <td className="p-3">
                        <p className="font-medium text-gray-800">{emp.name}</p>
                        <p className="text-xs text-gray-500">{emp.specialization}</p>
                      </td>
                      <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${emp.role === 'hod' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>{emp.role}</span></td>
                      <td className="p-3 text-center font-medium">{emp.totalSessions}</td>
                      <td className="p-3 text-right text-green-600 font-medium">₹{emp.grossRevenue.toLocaleString()}</td>
                      <td className="p-3 text-right text-blue-600 font-bold">₹{emp.netPay.toLocaleString()}</td>
                      <td className="p-3 text-center">
                        <Button size="sm" onClick={() => handleViewPayslip(emp)}>
                          <FileSpreadsheet size={14} className="mr-2" /> View Payslip
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={isPayslipOpen} onOpenChange={setIsPayslipOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payslip for {selectedPayslip?.name}</DialogTitle>
            <DialogDescription>Period: {months[selectedMonth]} {selectedYear}</DialogDescription>
          </DialogHeader>
          {selectedPayslip && (
            <div className="mt-4" id="payslip-content">
              <div className="border rounded-lg p-6 bg-white">
                <div className="flex justify-between items-start pb-4 border-b">
                  <div>
                    <h2 className="text-2xl font-bold text-blue-600">NEO Physio</h2>
                    <p className="text-sm text-gray-500">123 Health St, Wellness City</p>
                  </div>
                  <div className="text-right">
                    <h3 className="text-lg font-semibold">Payslip</h3>
                    <p className="text-sm">Date: {new Date().toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="font-semibold">{selectedPayslip.name}</p>
                    <p className="text-sm text-gray-600">{selectedPayslip.specialization}</p>
                    <p className="text-sm text-gray-600">Role: {selectedPayslip.role}</p>
                  </div>
                </div>
                <div className="mt-6">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="text-left p-2 font-semibold">Description</th>
                        <th className="text-right p-2 font-semibold">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b"><td className="p-2">Completed Sessions</td><td className="p-2 text-right">{selectedPayslip.totalSessions}</td></tr>
                      <tr className="border-b"><td className="p-2">Rate per Session</td><td className="p-2 text-right">₹{selectedPayslip.ratePerSession.toLocaleString()}</td></tr>
                      <tr className="border-b"><td className="p-2 font-semibold">Gross Revenue</td><td className="p-2 text-right font-semibold">₹{selectedPayslip.grossRevenue.toLocaleString()}</td></tr>
                      <tr className="border-b"><td className="p-2 text-red-600">Deductions (TDS, etc.)</td><td className="p-2 text-right text-red-600">- ₹{selectedPayslip.deductions.toLocaleString()}</td></tr>
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-100">
                        <td className="p-2 font-bold text-lg">Net Payable</td>
                        <td className="p-2 text-right font-bold text-lg">₹{selectedPayslip.netPay.toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <p className="text-xs text-gray-500 mt-6 text-center">This is a computer-generated payslip and does not require a signature.</p>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={handlePrint}><Printer size={16} className="mr-2" /> Print</Button>
            <Button onClick={handleDownload}><Download size={16} className="mr-2" /> Download PDF</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Payroll;