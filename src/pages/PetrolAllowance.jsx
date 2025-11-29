import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Calendar as CalendarIcon, Download, Filter, Fuel, User, PlusCircle, MinusCircle, FileText } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '@/components/CustomComponents/apiRequest'

const PetrolAllowance = () => {
  const navigate = useNavigate()
  const [physios, setPhysios] = useState([]);
  const [patients, setPatients] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [dailyData, setDailyData] = useState([]);

  const initialState = {
    physioId: '',
    date: '',
    completedKms: '',
    canceledKms: '',
    manualKms: '',
    finalDailyKms: '',
    amountPerKm: '',
    totalAmount: '',
    status: '',
    notes: ''
  }
  const [filteredData, setFilteredData] = useState(initialState);
  console.log(filteredData,"filteredData")


  const [dateRange, setDateRange] = useState({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) });
  const [physioFilter, setPhysioFilter] = useState('all');

  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [ratePerKm, setRatePerKm] = useState(10);
  const [monthlyReport, setMonthlyReport] = useState(null);
  const [auditLog, setAuditLog] = useState([]);
   const { getPermissionsByPath } = useAuth();
    const [Permissions, setPermissions] = useState({ isAdd: false, isView: false, isEdit: false, isDelete: false })

  // useEffect(() => {
  //   Promise.all([
  //     fetch('/mockdata/physios.json').then(res => res.json()),
  //     fetch('/mockdata/patients.json').then(res => res.json()),
  //     fetch('/mockdata/sessions.json').then(res => res.json())
  //   ]).then(([physiosData, patientsData, sessionsData]) => {
  //     setPhysios(physiosData.filter(p => p.role === 'Physio'));
  //     setPatients(patientsData);
  //     setSessions(sessionsData);
  //     // Initialize audit log from a mock source or keep it in state
  //     const initialLog = JSON.parse(localStorage.getItem('petrolAuditLog')) || [];
  //     setAuditLog(initialLog);
  //   }).catch(err => console.error('Error loading data:', err));
  // }, []);



  //Api for get Physio
  useEffect(() => {
    getPhysio()
   
  }, [])


  useEffect(() => {
      getPermissionsByPath(window.location.pathname).then(res => {
        if (res) {
          console.log(res, "res")
          setPermissions(res)
        } else {
          navigate('/dashboard')
        }
      })
  
    }, [])
  
  useEffect(()=>{
      if (Permissions.isView) {
         getPetrol()
      }
  },[Permissions])

    
   

  const getPhysio = async (data) => {
    try {
      const response = await apiRequest("Physio/getAllPhysio", {
        method: 'POST',
        body: JSON.stringify(data)
      });
      setPhysios(response.physios)

    } catch (error) {
      console.log(error, "error from frontend get All Physio")
    }
  }

  const logAuditEvent = (message) => {
    const newLogEntry = { timestamp: new Date().toISOString(), message };
    setAuditLog(prev => {
      const updatedLog = [newLogEntry, ...prev];
      localStorage.setItem('petrolAuditLog', JSON.stringify(updatedLog));
      return updatedLog;
    });
  };

  const processedData = useMemo(() => {
    if (!sessions.length || !patients.length || !physios.length || !dateRange.from || !dateRange.to) return [];

    const dailyTravel = {};
    const interval = { start: dateRange.from, end: dateRange.to };
    const dateArray = eachDayOfInterval(interval);

    dateArray.forEach(date => {
      const dateKey = format(date, 'yyyy-MM-dd');
      physios.forEach(physio => {
        const physioId = physio._id.toString();
        if (!dailyTravel[dateKey]) dailyTravel[dateKey] = {};
        if (!dailyTravel[dateKey][physioId]) {
          dailyTravel[dateKey][physioId] = {
            physioId,
            date: dateKey,
            attendedCompletedKms: 0,
            cancelledKms: 0,
            manualAdjustment: 0,
            finalKms: 0,
            visits: [],
          };
        }
      });
    });

    sessions.forEach(session => {
      const sessionDate = new Date(session.sessionDate);
      if (!isWithinInterval(sessionDate, interval)) return;

      const dateKey = format(sessionDate, 'yyyy-MM-dd');
      const physioId = session.physioId.toString();
      const patient = patients.find(p => p.id === session.patientId);

      if (!patient || !patient.travelDetails) return;
      if (!dailyTravel[dateKey] || !dailyTravel[dateKey][physioId]) return;

      dailyTravel[dateKey][physioId].visits.push({
        ...session,
        travelDetails: patient.travelDetails
      });
    });

    Object.values(dailyTravel).forEach(physioVisitsByDate => {
      Object.values(physioVisitsByDate).forEach(dayData => {
        dayData.visits.sort((a, b) => a.travelDetails.visitOrder - b.travelDetails.visitOrder);

        let attendedCompletedKms = 0;

        dayData.visits.forEach(visit => {
          if (visit.status === 'attended' || visit.status === 'completed') {
            if (visit.travelDetails.visitOrder === 1) {
              attendedCompletedKms += visit.travelDetails.kmsFromHub || 0;
            } else {
              attendedCompletedKms += visit.travelDetails.kmsFromPrevious || 0;
            }
          } else if (visit.status === 'canceled') {
            dayData.cancelledKms += visit.cancelledKms || 0;
          }
        });

        dayData.attendedCompletedKms = attendedCompletedKms;
        dayData.finalKms = attendedCompletedKms - dayData.cancelledKms + dayData.manualAdjustment;
      });
    });

    return Object.values(dailyTravel).flatMap(Object.values);
  }, [sessions, patients, physios, dateRange]);

  // useEffect(() => {
  //   setDailyData(processedData);
  // }, [processedData]);



  //APi for get Petrol

  const getPetrol = async (data) => {
    try {
      const response = await apiRequest("PetrolAllowance/getAllPetrolAllowance", {
        method: 'POST',
        body: JSON.stringify(data)
      });
      setDailyData(response)
    } catch (error) {
      console.log(error, "Error")
    }
  }

  useEffect(() => {
    let data = dailyData;
    if (physioFilter !== 'all') {
      data = data.filter(d => d.physioId === physioFilter);
    }
    setFilteredData(data);
  }, [dailyData, physioFilter]);

  const handleAdjustment = (date, physioId, amount) => {
    setDailyData(prevData => prevData.map(d => {
      if (d.date === date && d.physioId === physioId) {
        const newAdjustment = d.manualKms + amount;
        logAuditEvent(`Manual adjustment of ${amount}km for ${physioId.physioName} on ${date}.`);
        return {
          ...d,
          manualKms: newAdjustment,
          finalDailyKms: d.finalDailyKms + amount
        };
      }
      return d;
    }));
  };

  const handleGenerateReport = () => {
    const summary = physios.map(physio => {
      const physioId = physio._id.toString();
      const physioData = dailyData.filter(d => d.physioId === physioId);

      const totalAttendedCompletedKms = physioData.reduce((sum, day) => sum + day.attendedCompletedKms, 0);
      const totalCancelledKms = physioData.reduce((sum, day) => sum + day.cancelledKms, 0);
      const totalManualAdjustment = physioData.reduce((sum, day) => sum + day.manualAdjustment, 0);
      const finalKms = totalAttendedCompletedKms - totalCancelledKms + totalManualAdjustment;
      const allowance = finalKms * ratePerKm;

      return {
        physioName: physio.name,
        month: format(dateRange.from, 'MMM-yyyy'),
        totalAttendedCompletedKms,
        totalCancelledKms,
        totalManualAdjustment,
        finalKms,
        allowance
      };
    }).filter(r => r.finalKms !== 0 || r.totalAttendedCompletedKms !== 0 || r.totalCancelledKms !== 0);

    setMonthlyReport(summary);
    setIsGenerateOpen(false);
    logAuditEvent(`Generated petrol allowance report for ${format(dateRange.from, 'MMM-yyyy')} with rate ₹${ratePerKm}/km.`);
    toast({ title: "Report Generated", description: "Monthly petrol allowance report is ready." });
  };

  const handleExport = (format) => {
    toast({
      title: `Exporting as ${format.toUpperCase()}`,
      description: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
    });
  };

  return (
    <div className="space-y-6 ms-20 md:ms-0 lg:ms-0">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="md:flex justify-between items-center space-y-4 ">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Petrol Allowance</h1>
          <p className="text-gray-600">Calculate and track daily travel expenses for physiotherapists.</p>
        </div>
        <Button onClick={() => setIsGenerateOpen(true)}><Fuel className="mr-2 h-4 w-4" /> Generate Monthly Allowance</Button>
      </motion.div>

      <Card className="medical-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Filter size={20} /> Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div className="space-y-2">
            <Label>Date Range</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !dateRange.from && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (dateRange.to ? `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}` : format(dateRange.from, "LLL dd, y")) : <span>Pick a date range</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="range" selected={dateRange} onSelect={setDateRange} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label>Physiotherapist</Label>
            <Select value={physioFilter} onValueChange={setPhysioFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Physiotherapists</SelectItem>
                {physios.map(p => <SelectItem key={p._id} value={p._id.toString()}>{p.physioName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
        <Card className="medical-card">
          <CardHeader>
            <CardTitle>Daily Kms Summary</CardTitle>
            <CardDescription>Editable summary of daily travel for each physiotherapist.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold text-gray-600">Date</th>
                    <th className="text-left p-3 font-semibold text-gray-600">Physiotherapist</th>
                    <th className="text-center p-3 font-semibold text-gray-600">Attended/Completed Kms</th>
                    <th className="text-center p-3 font-semibold text-gray-600">Canceled Kms</th>
                    <th className="text-center p-3 font-semibold text-gray-600">Manual Adjustments</th>
                    <th className="text-right p-3 font-semibold text-gray-600">Final Daily Kms</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length > 0 ? filteredData.map((item) => (
                    <tr key={item._id} className="border-b hover:bg-gray-50/50">
                      <td className="p-3">{format(new Date(item.date), 'PPP')}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-gray-500" />
                          <span className="font-medium text-gray-800">{item.physioId.physioName}</span>
                        </div>
                      </td>
                      <td className="p-3 text-center text-green-600 font-medium">{item.completedKms.toFixed(2)}</td>
                      <td className="p-3 text-center text-red-600 font-medium">{item.canceledKms.toFixed(2)}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleAdjustment(item.date, item.physioId, -1)}><MinusCircle size={14} /></Button>
                          <span className={cn("font-medium w-12 text-center", item.manualKms > 0 && "text-blue-600", item.manualKms < 0 && "text-orange-600")}>{item.manualKms.toFixed(2)}</span>
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleAdjustment(item.date, item.physioId, 1)}><PlusCircle size={14} /></Button>
                        </div>
                      </td>
                      <td className="p-3 text-right font-bold text-lg">{item.finalDailyKms.toFixed(2)} km</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="6" className="text-center p-8 text-gray-500">No travel data found for the selected criteria.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {monthlyReport && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.4 }}>
          <Card className="medical-card bg-blue-50/50">
            <CardHeader className="flex flex-row justify-between items-center">
              <div>
                <CardTitle>Monthly Allowance Report ({monthlyReport[0]?.month})</CardTitle>
                <CardDescription>Rate: ₹{ratePerKm.toFixed(2)}/km</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleExport('CSV')}><Download size={16} className="mr-2" /> Export CSV</Button>
                <Button variant="outline" onClick={() => handleExport('PDF')}><Download size={16} className="mr-2" /> Export PDF</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-semibold text-gray-600">Physio Name</th>
                      <th className="text-center p-3 font-semibold text-gray-600">Attended+Completed Kms</th>
                      <th className="text-center p-3 font-semibold text-gray-600">Canceled Kms</th>
                      <th className="text-center p-3 font-semibold text-gray-600">Manual Adjustments</th>
                      <th className="text-center p-3 font-semibold text-gray-600">Final Kms</th>
                      <th className="text-right p-3 font-semibold text-gray-600">Petrol Allowance (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyReport.map((row, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50/50">
                        <td className="p-3 font-medium">{row.physioName}</td>
                        <td className="p-3 text-center text-green-600">{row.totalAttendedCompletedKms.toFixed(2)}</td>
                        <td className="p-3 text-center text-red-600">{row.totalCancelledKms.toFixed(2)}</td>
                        <td className="p-3 text-center font-medium">{row.totalManualAdjustment > 0 ? `+${row.totalManualAdjustment.toFixed(2)}` : row.totalManualAdjustment.toFixed(2)}</td>
                        <td className="p-3 text-center font-bold">{row.finalKms.toFixed(2)}</td>
                        <td className="p-3 text-right font-bold text-indigo-600">₹{row.allowance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.6 }}>
        <Card className="medical-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText size={20} /> Audit Trail</CardTitle>
            <CardDescription>Log of adjustments, cancellations, and allowance generations.</CardDescription>
          </CardHeader>
          <CardContent className="max-h-60 overflow-y-auto">
            <ul className="space-y-2">
              {auditLog.length > 0 ? auditLog.map((log, index) => (
                <li key={index} className="text-xs text-gray-600 border-b pb-1">
                  <span className="font-mono bg-gray-100 p-1 rounded-sm">{format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}</span>: {log.message}
                </li>
              )) : (
                <p className="text-sm text-gray-500">No audit events recorded yet.</p>
              )}
            </ul>
          </CardContent>
        </Card>
      </motion.div> */}

      <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Monthly petrol allowance will be generated</DialogTitle>
            {/* <DialogDescription>Enter the rate per km to calculate the allowance for the selected period ({dateRange.from ? format(dateRange.from, 'MMMM yyyy') : ''}).</DialogDescription> */}
          </DialogHeader>
          {/* <div className="space-y-4 pt-4">
            <Label htmlFor="ratePerKmGenerate">Rate per Km (₹)</Label>
            <Input id="ratePerKmGenerate" type="number" value={ratePerKm} onChange={(e) => setRatePerKm(Number(e.target.value))} />
          </div> */}
          {/* <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsGenerateOpen(false)}>Cancel</Button>
            <Button onClick={handleGenerateReport}>Generate Report</Button>
          </DialogFooter> */}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PetrolAllowance;