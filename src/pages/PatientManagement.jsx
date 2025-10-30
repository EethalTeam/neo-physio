import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Search, FileText, Calendar as CalendarIcon, User, Edit, Trash2, Upload, Paperclip, ClipboardList, PlusCircle, UserPlus, History } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import PatientDetailsDialog from '@/components/PatientDetailsDialog';

const PatientManagement = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [physios, setPhysios] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const fileInputRef = useRef(null);

  const [isAssignPhysioOpen, setIsAssignPhysioOpen] = useState(false);
  const [assigningPatient, setAssigningPatient] = useState(null);
  const initialAssignState = { 
    physiotherapistAssigned: '', 
    startDate: null, 
    sessionTime: '', 
    totalDays: '', 
    shortTermGoal: '', 
    goalDuration: '', 
    goalDescription: '', 
    reviewFrequency: '',
    visitOrder: 1,
    kmsFromHub: '',
    kmsFromPrevious: '',
    returnToHubKms: '',
  };
  const [assignForm, setAssignForm] = useState(initialAssignState);
  
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [viewingPatient, setViewingPatient] = useState(null);

  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewingPatient, setReviewingPatient] = useState(null);
  const initialReviewState = { feedback: '', satisfaction: 0 };
  const [reviewForm, setReviewForm] = useState(initialReviewState);

  const [isNewGoalOpen, setIsNewGoalOpen] = useState(false);
  const initialNewGoalState = { newShortTermGoal: '', newGoalDuration: '', nextReviewDate: null };
  const [newGoalForm, setNewGoalForm] = useState(initialNewGoalState);

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyPatient, setHistoryPatient] = useState(null);
  const [patientHistory, setPatientHistory] = useState([]);

  const initialFormState = {
    patientId: '', name: '', age: '', gender: '', contact: '', address: '', category: '', medicalHistory: '', documents: [],
    consultationDate: null, bystanderName: '', relationWithPatient: '', altMobNo: '', pin: '', diagnosis: '', physiotherapistAssigned: '', reviewDate: null,
    diabetic: 'no', hypertension: 'no', arthritis: 'no', trauma: 'no', osteoporosis: 'no', historyOfSurgery: 'no', historyOfSurgeryDetails: '', historyOfFall: 'no', historyOfFallDetails: '', otherMedicalConditions: '', currentMedications: '',
    lifestyle: 'sedentary', smokingAlcohol: 'no', dietaryHabits: '',
    contraindications: '',
    painLevel: '', rangeOfMotion: '', muscleStrength: '', postureGaitAnalysis: '', functionalLimitations: '', adlAbility: '',
    shortTermGoals: '', longTermGoals: '', recommendedTherapy: '', frequencyOfSessions: '', durationOfTreatment: '', modalities: 'no', modalityList: [], targetedArea: '', noOfDays: '',
    hodNotes: '',
    goalLog: [],
    travelDetails: null,
  };
  const [patientForm, setPatientForm] = useState(initialFormState);
  const modalitiesOptions = ["TENS", "IFT", "USD", "WAX", "ICE", "HOT", "Weights", "Band"];

  useEffect(() => {
    Promise.all([
      fetch('/mockdata/patients.json').then(res => res.json()),
      fetch('/mockdata/physios.json').then(res => res.json()),
      fetch('/mockdata/sessions.json').then(res => res.json())
    ]).then(([patientsData, physiosData, sessionsData]) => {
      setPatients(patientsData);
      setFilteredPatients(patientsData);
      setPhysios(physiosData);
      setSessions(sessionsData);
    }).catch(err => console.error('Error loading data:', err));
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = patients.filter(patient =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.contact.includes(searchTerm) ||
        patient.patientId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPatients(filtered);
    } else {
      setFilteredPatients(patients);
    }
  }, [patients, searchTerm]);

  const generatePatientId = () => {
    const lastId = patients.length > 0 ? Math.max(...patients.map(p => parseInt(p.patientId.replace('PAT', '')))) : 0;
    const newId = lastId + 1;
    return `PAT${String(newId).padStart(6, '0')}`;
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setPatientForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setPatientForm(prev => ({ ...prev, [name]: value }));
  };

  const handleRadioChange = (name, value) => {
    setPatientForm(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name, date) => {
    setPatientForm(prev => ({ ...prev, [name]: date }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPatientForm(prev => ({ ...prev, documents: [...prev.documents, file.name] }));
      toast({ title: "File Added", description: `${file.name} has been staged for upload.` });
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (editingPatient) {
      setPatients(prev => prev.map(p => p.id === editingPatient.id ? { ...p, ...patientForm } : p));
      toast({ title: "Success", description: "Patient details updated." });
    } else {
      const newPatient = { id: Date.now(), ...patientForm, patientId: generatePatientId(), registeredAt: new Date().toISOString().split('T')[0] };
      setPatients(prev => [newPatient, ...prev]);
      toast({ title: "Success", description: "New patient created." });
    }
    setIsFormOpen(false);
    setEditingPatient(null);
    setPatientForm(initialFormState);
  };

  const handleEditPatient = (patient) => {
    if (user?.role === 'hod' || user?.role === 'admin' || user?.role === 'super_admin') {
      setEditingPatient(patient);
      const formData = { ...initialFormState, ...patient };
      if (patient.consultationDate) formData.consultationDate = new Date(patient.consultationDate);
      if (patient.reviewDate) formData.reviewDate = new Date(patient.reviewDate);
      setPatientForm(formData);
      setIsFormOpen(true);
    } else {
      toast({ title: "Access Denied", description: "You do not have permission to edit patient details.", variant: "destructive" });
    }
  };

  const handleNewPatient = () => {
    setEditingPatient(null);
    setPatientForm({ ...initialFormState, patientId: generatePatientId() });
    setIsFormOpen(true);
  };

  const handleDeletePatient = (patientId) => {
    setPatients(prev => prev.filter(p => p.id !== patientId));
    toast({ title: "Deleted", description: "Patient has been removed.", variant: "destructive" });
  };

  const handleViewConsultation = (patient) => {
    setViewingPatient(patient);
    setIsDetailsOpen(true);
  };
  
  const handleUpdateFeedback = () => {
    setPatients(prev => prev.map(p => {
      if (p.id === reviewingPatient.id) {
        const newGoalLog = [...(p.goalLog || [])];
        const lastLogIndex = newGoalLog.length - 1;

        if (lastLogIndex >= 0 && newGoalLog[lastLogIndex].goal === p.shortTermGoals) {
          newGoalLog[lastLogIndex] = {
            ...newGoalLog[lastLogIndex],
            feedback: reviewForm.feedback,
            satisfaction: reviewForm.satisfaction,
            status: 'Feedback Updated'
          };
        } else {
           newGoalLog.push({
            goal: p.shortTermGoals || 'Initial Goal',
            date: new Date().toISOString().split('T')[0],
            status: 'Feedback Updated',
            feedback: reviewForm.feedback,
            satisfaction: reviewForm.satisfaction
          });
        }
        return { ...p, goalLog: newGoalLog };
      }
      return p;
    }));
    toast({ title: "Feedback Updated", description: `Feedback for ${reviewingPatient.name} has been saved.` });
    setIsReviewOpen(false);
    setReviewForm(initialReviewState);
  };

  const handleLogAndOpenNewGoal = () => {
     setPatients(prev => prev.map(p => {
      if (p.id === reviewingPatient.id) {
        const newGoalLog = [...(p.goalLog || [])];
        if (p.shortTermGoals) {
            newGoalLog.push({
                goal: p.shortTermGoals,
                date: new Date().toISOString().split('T')[0],
                status: 'Reviewed & Completed',
                feedback: reviewForm.feedback,
                satisfaction: reviewForm.satisfaction
            });
        }
        return { ...p, goalLog: newGoalLog };
      }
      return p;
    }));
    toast({ title: "Goal Logged", description: "Current goal has been logged. Now set the next goal." });
    setIsReviewOpen(false);
    setIsNewGoalOpen(true);
  };

  const handleNewGoalSubmit = (e) => {
    e.preventDefault();
    setPatients(prev => prev.map(p => {
        if (p.id === reviewingPatient.id) {
            return {
                ...p,
                shortTermGoals: newGoalForm.newShortTermGoal,
                goalDuration: newGoalForm.newGoalDuration,
                reviewDate: newGoalForm.nextReviewDate,
            };
        }
        return p;
    }));
    toast({ title: "New Goal Set!", description: `A new goal has been set for ${reviewingPatient.name}.` });
    setIsNewGoalOpen(false);
    setNewGoalForm(initialNewGoalState);
    setReviewForm(initialReviewState);
  };

  const handleScheduleReview = (patient) => {
    if (user?.role === 'hod' || user?.role === 'admin' || user?.role === 'super_admin') {
      setReviewingPatient(patient);
      setIsReviewOpen(true);
    } else {
      toast({ title: "Access Denied", description: "You do not have permission to conduct reviews.", variant: "destructive" });
    }
  };

  const openAssignPhysioDialog = (patient) => {
    if (user?.role === 'hod' || user?.role === 'admin' || user?.role === 'super_admin') {
      setAssigningPatient(patient);
      setAssignForm({
        ...initialAssignState,
        physiotherapistAssigned: patient.physiotherapistAssigned || '',
        shortTermGoal: patient.shortTermGoals || '',
        goalDuration: patient.goalDuration || '',
        totalDays: patient.noOfDays || '',
        ...(patient.travelDetails || {})
      });
      setIsAssignPhysioOpen(true);
    } else {
       toast({ title: "Access Denied", description: "You do not have permission to assign physiotherapists.", variant: "destructive" });
    }
  };

  const handleAssignPhysioSubmit = (e) => {
    e.preventDefault();
    setPatients(prev => prev.map(p => {
      if (p.id === assigningPatient.id) {
        return { 
          ...p, 
          physiotherapistAssigned: assignForm.physiotherapistAssigned,
          sessionStartDate: assignForm.startDate,
          sessionTime: assignForm.sessionTime,
          noOfDays: assignForm.totalDays,
          shortTermGoals: assignForm.shortTermGoal,
          goalDuration: assignForm.goalDuration,
          treatmentPlan: { ...(p.treatmentPlan || {}), description: assignForm.goalDescription },
          reviewFrequency: assignForm.reviewFrequency,
          travelDetails: {
            visitOrder: parseInt(assignForm.visitOrder),
            kmsFromHub: assignForm.visitOrder == 1 ? parseFloat(assignForm.kmsFromHub) : null,
            kmsFromPrevious: assignForm.visitOrder > 1 ? parseFloat(assignForm.kmsFromPrevious) : null,
            returnToHubKms: parseFloat(assignForm.returnToHubKms),
          }
        };
      }
      return p;
    }));
    toast({ title: "Success", description: `Physio assigned and plan updated for ${assigningPatient.name}.` });
    setIsAssignPhysioOpen(false);
    setAssigningPatient(null);
    setAssignForm(initialAssignState);
  };

  const handleViewHistory = (patient) => {
    setHistoryPatient(patient);
    const patientSessions = sessions.filter(s => s.patientId === patient.id).map(s => ({
      type: 'session',
      date: s.sessionDate,
      title: `Session ${s.status}`,
      details: s.feedback ? `Feedback: ${s.feedback.pros}` : `Status: ${s.status}`,
    }));

    const patientGoalLog = (patient.goalLog || []).map(log => ({
      type: 'review',
      date: log.date,
      title: `HOD Review: ${log.status}`,
      details: `Goal: ${log.goal}. Feedback: ${log.feedback || 'N/A'}. Satisfaction: ${log.satisfaction || 'N/A'}%`,
    }));

    const combinedHistory = [...patientSessions, ...patientGoalLog].sort((a, b) => new Date(b.date) - new Date(a.date));
    setPatientHistory(combinedHistory);
    setIsHistoryOpen(true);
  };

  const renderRadioGroup = (label, name, value) => (
    <div className="flex items-center space-x-4">
      <Label className="w-24">{label}</Label>
      <RadioGroup value={value} onValueChange={(v) => handleRadioChange(name, v)} className="flex gap-4">
        <div className="flex items-center space-x-2"><RadioGroupItem value="yes" id={`${name}-yes`} /><Label htmlFor={`${name}-yes`}>Yes</Label></div>
        <div className="flex items-center space-x-2"><RadioGroupItem value="no" id={`${name}-no`} /><Label htmlFor={`${name}-no`}>No</Label></div>
      </RadioGroup>
    </div>
  );

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Patient Management</h1>
          <p className="text-gray-600">Manage registered patients and their treatment plans.</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'super_admin') && (
          <Button onClick={handleNewPatient}><PlusCircle className="mr-2 h-4 w-4" /> New Patient</Button>
        )}
      </motion.div>

      <Card className="medical-card">
        <CardHeader><CardTitle>Search Patients</CardTitle></CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input placeholder="Search by name, contact or Patient ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
        </CardContent>
      </Card>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
        <Card className="medical-card">
          <CardHeader><CardTitle>Patients ({filteredPatients.length})</CardTitle><CardDescription>All registered patients in the system</CardDescription></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPatients.map((patient) => (
                <motion.div key={patient.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="border rounded-lg p-4 hover:shadow-md transition-shadow flex flex-col">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center"><User className="text-blue-600" size={20} /></div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{patient.name}</h3>
                      <p className="text-sm text-gray-600">{patient.patientId}</p>
                      <p className="text-sm text-gray-600">{patient.age} years, {patient.gender}</p>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4 flex-grow">
                    <p className="text-sm"><strong>Contact:</strong> {patient.contact}</p>
                    <p className="text-sm"><strong>Category:</strong><span className="ml-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">{patient.category}</span></p>
                    <p className="text-sm"><strong>Consultation:</strong> {patient.consultationDate ? format(new Date(patient.consultationDate), "PPP") : 'Not set'}</p>
                    <p className="text-sm"><strong>Next Review:</strong> {patient.reviewDate ? format(new Date(patient.reviewDate), "PPP") : 'N/A'}</p>
                    {patient.shortTermGoals && (
                      <div className="text-sm mt-2 p-2 bg-blue-50 border-l-4 border-blue-400 rounded-r-md">
                        <p><strong>Goal:</strong> {patient.shortTermGoals} ({patient.goalDuration} days)</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    {(user?.role === 'hod' || user?.role === 'admin' || user?.role === 'super_admin') && (
                      <Button size="sm" onClick={() => openAssignPhysioDialog(patient)} className="w-full flex items-center gap-2"><UserPlus size={14} /> Assign Physio</Button>
                    )}
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleViewConsultation(patient)} className="flex-1"><FileText size={14} /><span>Consultation</span></Button>
                      <Button size="sm" onClick={() => handleScheduleReview(patient)} className="flex-1"><CalendarIcon size={14} /><span>Review</span></Button>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleViewHistory(patient)} className="flex-1"><History size={14} /><span>History</span></Button>
                      {(user?.role === 'hod' || user?.role === 'admin' || user?.role === 'super_admin') && (
                        <Button size="sm" variant="outline" onClick={() => handleEditPatient(patient)} className="flex-1"><Edit size={14} /><span>Edit</span></Button>
                      )}
                      {(user?.role === 'admin' || user?.role === 'super_admin') && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button size="sm" variant="destructive" className="flex-1"><Trash2 size={14} /><span>Delete</span></Button></AlertDialogTrigger>
                          <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the patient and all their records.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeletePatient(patient.id)}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
      
      <PatientDetailsDialog isOpen={isDetailsOpen} onOpenChange={setIsDetailsOpen} patient={viewingPatient} />
      
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="max-w-2xl max-h-[95vh] flex flex-col">
          <DialogHeader><DialogTitle>Review Goal for {reviewingPatient?.name}</DialogTitle><DialogDescription>Update feedback and satisfaction for the current goal.</DialogDescription></DialogHeader>
          <div className="flex-1 overflow-y-auto pr-6 -mr-6">
            <div className="space-y-4 pt-4">
              <div>
                <Label className="font-semibold">Current Goal</Label>
                <p className="text-sm text-gray-700 p-2 bg-gray-100 rounded-md mt-1">{reviewingPatient?.shortTermGoals || "No current goal set."}</p>
              </div>
              <div className="space-y-2"><Label htmlFor="feedback">Feedback / Suggestions</Label><textarea id="feedback" className="w-full p-2 border rounded-md" value={reviewForm.feedback} onChange={(e) => setReviewForm(p => ({...p, feedback: e.target.value}))} /></div>
              <div className="space-y-2"><Label>Satisfaction (%)</Label><div className="flex items-center gap-2 flex-wrap">{[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(p => (<Button key={p} type="button" variant={reviewForm.satisfaction === p ? 'default' : 'outline'} size="sm" onClick={() => setReviewForm(f => ({...f, satisfaction: p}))}>{p}%</Button>))}</div></div>
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setIsReviewOpen(false)}>Cancel</Button>
            <Button type="button" variant="secondary" onClick={handleUpdateFeedback}>Update Feedback Only</Button>
            <Button type="button" onClick={handleLogAndOpenNewGoal}>Log Goal & Set New One</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isNewGoalOpen} onOpenChange={setIsNewGoalOpen}>
          <DialogContent className="max-w-lg">
              <DialogHeader>
                  <DialogTitle>Set Next Goal for {reviewingPatient?.name}</DialogTitle>
                  <DialogDescription>Define the next short-term goal and review date.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleNewGoalSubmit} className="space-y-4 pt-4">
                  <div className="space-y-2"><Label htmlFor="newShortTermGoal">New Short-term Goal</Label><Input id="newShortTermGoal" value={newGoalForm.newShortTermGoal} onChange={(e) => setNewGoalForm(p => ({...p, newShortTermGoal: e.target.value}))} /></div>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label htmlFor="newGoalDuration">New Goal Duration (days)</Label><Input id="newGoalDuration" type="number" value={newGoalForm.newGoalDuration} onChange={(e) => setNewGoalForm(p => ({...p, newGoalDuration: e.target.value}))} /></div>
                      <div className="space-y-2"><Label>Next Review Date</Label><Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !newGoalForm.nextReviewDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{newGoalForm.nextReviewDate ? format(newGoalForm.nextReviewDate, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={newGoalForm.nextReviewDate} onSelect={(d) => setNewGoalForm(p => ({...p, nextReviewDate: d}))} initialFocus /></PopoverContent></Popover></div>
                  </div>
                  <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsNewGoalOpen(false)}>Cancel</Button>
                      <Button type="submit">Set New Goal</Button>
                  </DialogFooter>
              </form>
          </DialogContent>
      </Dialog>

      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Patient History: {historyPatient?.name}</DialogTitle>
            <DialogDescription>Chronological log of all sessions and reviews.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-6 -mr-6 mt-4">
            <div className="relative pl-6">
              <div className="absolute left-0 top-0 h-full w-0.5 bg-gray-200" style={{ transform: 'translateX(2.5px)' }}></div>
              {patientHistory.length > 0 ? patientHistory.map((item, index) => (
                <div key={index} className="mb-8 relative">
                  <div className={`absolute left-0 top-1 h-3 w-3 rounded-full ${item.type === 'session' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                  <div className="pl-6">
                    <p className="text-xs text-gray-500">{format(new Date(item.date), 'PPP')}</p>
                    <h4 className="font-semibold text-md">{item.title}</h4>
                    <p className="text-sm text-gray-600">{item.details}</p>
                  </div>
                </div>
              )) : (
                <p className="text-center text-gray-500">No history found for this patient.</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[95vh] flex flex-col">
          <DialogHeader><DialogTitle>{editingPatient ? 'Edit Patient' : 'Create New Patient'}</DialogTitle></DialogHeader>
          <div className="flex-1 overflow-y-auto pr-6 -mr-6">
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <Accordion type="multiple" defaultValue={['item-1']} className="w-full">
                <AccordionItem value="item-1"><AccordionTrigger>Patient Details</AccordionTrigger><AccordionContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2"><Label>Patient ID</Label><Input value={patientForm.patientId} disabled /></div>
                    <div className="space-y-2"><Label>Consultation Date</Label><Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !patientForm.consultationDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{patientForm.consultationDate ? format(patientForm.consultationDate, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={patientForm.consultationDate} onSelect={(d) => handleDateChange('consultationDate', d)} initialFocus /></PopoverContent></Popover></div>
                    <div className="space-y-2"><Label>Name</Label><Input name="name" value={patientForm.name} onChange={handleFormChange} required /></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2"><Label>Age</Label><Input name="age" type="number" value={patientForm.age} onChange={handleFormChange} required /></div>
                    <div className="space-y-2"><Label>Gender</Label><Select onValueChange={(v) => handleSelectChange('gender', v)} value={patientForm.gender}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select></div>
                    <div className="space-y-2"><Label>Bystander Name</Label><Input name="bystanderName" value={patientForm.bystanderName} onChange={handleFormChange} /></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2"><Label>Relation With Patient</Label><Input name="relationWithPatient" value={patientForm.relationWithPatient} onChange={handleFormChange} /></div>
                    <div className="space-y-2"><Label>Mobile No.</Label><Input name="contact" value={patientForm.contact} onChange={handleFormChange} required /></div>
                    <div className="space-y-2"><Label>Alt. Mobile No.</Label><Input name="altMobNo" value={patientForm.altMobNo} onChange={handleFormChange} /></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Address</Label><Input name="address" value={patientForm.address} onChange={handleFormChange} required /></div>
                    <div className="space-y-2"><Label>PIN Code</Label><Input name="pin" value={patientForm.pin} onChange={handleFormChange} required /></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2"><Label>Diagnosis / Condition</Label><Input name="diagnosis" value={patientForm.diagnosis} onChange={handleFormChange} /></div>
                    <div className="space-y-2"><Label>Physiotherapist Assigned</Label><Select onValueChange={(v) => handleSelectChange('physiotherapistAssigned', v)} value={patientForm.physiotherapistAssigned}><SelectTrigger><SelectValue placeholder="Select Physio" /></SelectTrigger><SelectContent>{physios.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-2"><Label>Review Date</Label><Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !patientForm.reviewDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{patientForm.reviewDate ? format(patientForm.reviewDate, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={patientForm.reviewDate} onSelect={(d) => handleDateChange('reviewDate', d)} initialFocus /></PopoverContent></Popover></div>
                  </div>
                </AccordionContent></AccordionItem>
                
                <AccordionItem value="item-2"><AccordionTrigger>Medical History & Risk Factors</AccordionTrigger><AccordionContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {renderRadioGroup('Diabetic', 'diabetic', patientForm.diabetic)}
                    {renderRadioGroup('Hypertension', 'hypertension', patientForm.hypertension)}
                    {renderRadioGroup('Arthritis', 'arthritis', patientForm.arthritis)}
                    {renderRadioGroup('Trauma', 'trauma', patientForm.trauma)}
                    {renderRadioGroup('Osteoporosis', 'osteoporosis', patientForm.osteoporosis)}
                  </div>
                  <div className="space-y-2">{renderRadioGroup('History of Surgery', 'historyOfSurgery', patientForm.historyOfSurgery)}</div>
                  {patientForm.historyOfSurgery === 'yes' && <div className="space-y-2"><Label>Details</Label><textarea name="historyOfSurgeryDetails" rows={2} className="w-full p-2 border rounded-md" value={patientForm.historyOfSurgeryDetails} onChange={handleFormChange} /></div>}
                  <div className="space-y-2">{renderRadioGroup('History of Fall', 'historyOfFall', patientForm.historyOfFall)}</div>
                  {patientForm.historyOfFall === 'yes' && <div className="space-y-2"><Label>Details</Label><textarea name="historyOfFallDetails" rows={2} className="w-full p-2 border rounded-md" value={patientForm.historyOfFallDetails} onChange={handleFormChange} /></div>}
                  <div className="space-y-2"><Label>Other Medical Conditions</Label><textarea name="otherMedicalConditions" rows={2} className="w-full p-2 border rounded-md" value={patientForm.otherMedicalConditions} onChange={handleFormChange} /></div>
                  <div className="space-y-2"><Label>Current Medications</Label><textarea name="currentMedications" rows={2} className="w-full p-2 border rounded-md" value={patientForm.currentMedications} onChange={handleFormChange} /></div>
                </AccordionContent></AccordionItem>

                <AccordionItem value="item-3"><AccordionTrigger>Lifestyle Information</AccordionTrigger><AccordionContent className="space-y-4">
                  <div className="space-y-2"><Label>Type of Lifestyle</Label><RadioGroup value={patientForm.lifestyle} onValueChange={(v) => handleRadioChange('lifestyle', v)} className="flex gap-4"><div className="flex items-center space-x-2"><RadioGroupItem value="sedentary" id="ls-sedentary" /><Label htmlFor="ls-sedentary">Sedentary</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="moderate" id="ls-moderate" /><Label htmlFor="ls-moderate">Moderate</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="active" id="ls-active" /><Label htmlFor="ls-active">Active</Label></div></RadioGroup></div>
                  <div className="space-y-2">{renderRadioGroup('Smoking / Alcohol', 'smokingAlcohol', patientForm.smokingAlcohol)}</div>
                  <div className="space-y-2"><Label>Dietary Habits</Label><textarea name="dietaryHabits" rows={2} className="w-full p-2 border rounded-md" value={patientForm.dietaryHabits} onChange={handleFormChange} /></div>
                </AccordionContent></AccordionItem>

                <AccordionItem value="item-4"><AccordionTrigger>Contraindications</AccordionTrigger><AccordionContent><textarea name="contraindications" rows={3} className="w-full p-2 border rounded-md" value={patientForm.contraindications} onChange={handleFormChange} /></AccordionContent></AccordionItem>

                <AccordionItem value="item-5"><AccordionTrigger>Assessment Parameters</AccordionTrigger><AccordionContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2"><Label>Pain Level (0-10)</Label><Input name="painLevel" type="number" value={patientForm.painLevel} onChange={handleFormChange} /></div>
                    <div className="space-y-2"><Label>Range of Motion</Label><Input name="rangeOfMotion" value={patientForm.rangeOfMotion} onChange={handleFormChange} /></div>
                    <div className="space-y-2"><Label>Muscle Strength (0-5)</Label><Input name="muscleStrength" type="number" value={patientForm.muscleStrength} onChange={handleFormChange} /></div>
                  </div>
                  <div className="space-y-2"><Label>Posture / Gait Analysis</Label><textarea name="postureGaitAnalysis" rows={2} className="w-full p-2 border rounded-md" value={patientForm.postureGaitAnalysis} onChange={handleFormChange} /></div>
                  <div className="space-y-2"><Label>Functional Limitations</Label><textarea name="functionalLimitations" rows={2} className="w-full p-2 border rounded-md" value={patientForm.functionalLimitations} onChange={handleFormChange} /></div>
                  <div className="space-y-2"><Label>ADL Ability</Label><textarea name="adlAbility" rows={2} className="w-full p-2 border rounded-md" value={patientForm.adlAbility} onChange={handleFormChange} /></div>
                </AccordionContent></AccordionItem>

                <AccordionItem value="item-6"><AccordionTrigger>Treatment Plan</AccordionTrigger><AccordionContent className="space-y-4">
                  <div className="space-y-2"><Label>Short-term Goals</Label><textarea name="shortTermGoals" rows={2} className="w-full p-2 border rounded-md" value={patientForm.shortTermGoals} onChange={handleFormChange} /></div>
                  <div className="space-y-2"><Label>Long-term Goals</Label><textarea name="longTermGoals" rows={2} className="w-full p-2 border rounded-md" value={patientForm.longTermGoals} onChange={handleFormChange} /></div>
                  <div className="space-y-2"><Label>Recommended Therapy</Label><textarea name="recommendedTherapy" rows={2} className="w-full p-2 border rounded-md" value={patientForm.recommendedTherapy} onChange={handleFormChange} /></div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2"><Label>Frequency (per week)</Label><Input name="frequencyOfSessions" type="number" value={patientForm.frequencyOfSessions} onChange={handleFormChange} /></div>
                    <div className="space-y-2"><Label>Duration (weeks/months)</Label><Input name="durationOfTreatment" value={patientForm.durationOfTreatment} onChange={handleFormChange} /></div>
                    <div className="space-y-2"><Label>No of Days</Label><Input name="noOfDays" type="number" value={patientForm.noOfDays} onChange={handleFormChange} /></div>
                  </div>
                  <div className="space-y-2">{renderRadioGroup('Modalities', 'modalities', patientForm.modalities)}</div>
                  {patientForm.modalities === 'yes' && <motion.div initial={{opacity: 0, height: 0}} animate={{opacity: 1, height: 'auto'}} className="space-y-2 pl-4"><Label>List of Modalities</Label><div className="p-3 border rounded-md grid grid-cols-3 gap-2">{modalitiesOptions.map(mod => (<div key={mod} className="flex items-center space-x-2"><Checkbox id={`mod-${mod}`} checked={patientForm.modalityList.includes(mod)} onCheckedChange={(checked) => { setPatientForm(prev => ({ ...prev, modalityList: checked ? [...prev.modalityList, mod] : prev.modalityList.filter(m => m !== mod) })) }} /><Label htmlFor={`mod-${mod}`} className="text-sm font-normal">{mod}</Label></div>))}</div></motion.div>}
                  <div className="space-y-2"><Label>Targeted Area</Label><Input name="targetedArea" value={patientForm.targetedArea} onChange={handleFormChange} /></div>
                </AccordionContent></AccordionItem>

                <AccordionItem value="item-7"><AccordionTrigger>HOD Notes</AccordionTrigger><AccordionContent><textarea name="hodNotes" rows={3} className="w-full p-2 border rounded-md" value={patientForm.hodNotes} onChange={handleFormChange} /></AccordionContent></AccordionItem>
              </Accordion>
              
              <div className="space-y-2 pt-4">
                <Label>Upload Documents</Label>
                <Input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                <Button type="button" variant="outline" onClick={() => fileInputRef.current.click()}><Upload size={16} className="mr-2" /> Attach File</Button>
                <div className="mt-2 space-y-1">
                  {patientForm.documents.map((doc, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-gray-600"><Paperclip size={14} /> {doc}</div>
                  ))}
                </div>
              </div>
              <DialogFooter className="pt-4"><Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button><Button type="submit">{editingPatient ? 'Save Changes' : 'Create Patient'}</Button></DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAssignPhysioOpen} onOpenChange={setIsAssignPhysioOpen}>
        <DialogContent className="max-w-2xl max-h-[95vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Assign Physio & Plan for {assigningPatient?.name}</DialogTitle>
            <DialogDescription>Schedule sessions, set goals, and configure travel details.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-6 -mr-6">
            <form onSubmit={handleAssignPhysioSubmit} className="space-y-4 pt-4">
              <Accordion type="multiple" defaultValue={['plan', 'travel']} className="w-full">
                <AccordionItem value="plan">
                  <AccordionTrigger>Treatment Plan</AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label>Physiotherapist</Label>
                      <Select onValueChange={(v) => setAssignForm(p => ({ ...p, physiotherapistAssigned: v }))} value={assignForm.physiotherapistAssigned}>
                        <SelectTrigger><SelectValue placeholder="Select a physiotherapist" /></SelectTrigger>
                        <SelectContent>{physios.filter(p => p.role === 'physio').map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Session Start Date</Label>
                        <Popover>
                          <PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !assignForm.startDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{assignForm.startDate ? format(assignForm.startDate, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger>
                          <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={assignForm.startDate} onSelect={(d) => setAssignForm(p => ({ ...p, startDate: d }))} initialFocus /></PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sessionTime">Session Time</Label>
                        <Input id="sessionTime" type="time" value={assignForm.sessionTime} onChange={(e) => setAssignForm(p => ({ ...p, sessionTime: e.target.value }))} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="totalDays">Total Session Days</Label>
                        <Input id="totalDays" type="number" placeholder="e.g., 30" value={assignForm.totalDays} onChange={(e) => setAssignForm(p => ({ ...p, totalDays: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reviewFrequency">Review Frequency (in days)</Label>
                        <Input id="reviewFrequency" type="number" placeholder="e.g., 15" value={assignForm.reviewFrequency} onChange={(e) => setAssignForm(p => ({ ...p, reviewFrequency: e.target.value }))} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shortTermGoal">Initial Short-term Goal</Label>
                      <Input id="shortTermGoal" placeholder="e.g., Walk for 15 mins without pain" value={assignForm.shortTermGoal} onChange={(e) => setAssignForm(p => ({ ...p, shortTermGoal: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="goalDuration">Goal Duration (in days)</Label>
                      <Input id="goalDuration" type="number" placeholder="e.g., 10" value={assignForm.goalDuration} onChange={(e) => setAssignForm(p => ({ ...p, goalDuration: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="goalDescription">Goal Description</Label>
                      <textarea id="goalDescription" className="w-full p-2 border rounded-md min-h-[100px]" placeholder="Describe the exercises and focus for this goal..." value={assignForm.goalDescription} onChange={(e) => setAssignForm(p => ({ ...p, goalDescription: e.target.value }))} />
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="travel">
                  <AccordionTrigger>Travel Details</AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="visitOrder">Visit Order</Label>
                      <Input id="visitOrder" type="number" min="1" placeholder="e.g., 1 for first visit" value={assignForm.visitOrder} onChange={(e) => setAssignForm(p => ({ ...p, visitOrder: e.target.value }))} />
                    </div>
                    {assignForm.visitOrder == 1 && (
                      <div className="space-y-2">
                        <Label htmlFor="kmsFromHub">Kms from Hub</Label>
                        <Input id="kmsFromHub" type="number" placeholder="Distance from hub to first patient" value={assignForm.kmsFromHub} onChange={(e) => setAssignForm(p => ({ ...p, kmsFromHub: e.target.value }))} />
                      </div>
                    )}
                    {assignForm.visitOrder > 1 && (
                      <div className="space-y-2">
                        <Label htmlFor="kmsFromPrevious">Kms from Previous Appointment</Label>
                        <Input id="kmsFromPrevious" type="number" placeholder="Distance from previous patient" value={assignForm.kmsFromPrevious} onChange={(e) => setAssignForm(p => ({ ...p, kmsFromPrevious: e.target.value }))} />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="returnToHubKms">Kms from Last Patient to Hub</Label>
                      <Input id="returnToHubKms" type="number" placeholder="Distance for return trip" value={assignForm.returnToHubKms} onChange={(e) => setAssignForm(p => ({ ...p, returnToHubKms: e.target.value }))} />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAssignPhysioOpen(false)}>Cancel</Button>
                <Button type="submit">Assign & Save Plan</Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PatientManagement;