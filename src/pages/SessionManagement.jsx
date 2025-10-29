import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Calendar as CalendarIcon, Play, Square, MessageSquare, Search, PlusCircle, Edit, Trash2, Upload, Paperclip, XCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

const SessionManagement = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [physios, setPhysios] = useState([]);
  const [machines, setMachines] = useState([]);
  const [redFlags, setRedFlags] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const initialFormState = { patientId: '', physioId: '', sessionDate: null, sessionTime: '', machineId: '' };
  const [sessionForm, setSessionForm] = useState(initialFormState);

  const [feedbackDialog, setFeedbackDialog] = useState({ open: false, sessionId: null });
  const initialFeedbackState = { pros: '', redFlags: [], media: [], exerciseMode: 'passive', homeExercise: 'no', modalities: 'no', modalityList: [], targetedArea: '' };
  const [feedback, setFeedback] = useState(initialFeedbackState);
  const fileInputRef = useRef(null);

  const [cancelDialog, setCancelDialog] = useState({ open: false, sessionId: null });
  const [cancelledKms, setCancelledKms] = useState('');

  const modalitiesOptions = ["TENS", "IFT", "USD", "WAX", "ICE", "HOT", "Weights", "Band"];

  useEffect(() => {
    Promise.all([
      fetch('/mockdata/sessions.json').then(res => res.json()),
      fetch('/mockdata/patients.json').then(res => res.json()),
      fetch('/mockdata/physios.json').then(res => res.json()),
      fetch('/mockdata/machines.json').then(res => res.json()),
      fetch('/mockdata/redflags.json').then(res => res.json())
    ]).then(([sessionsData, patientsData, physiosData, machinesData, redFlagsData]) => {
      let userSessions = sessionsData;
      if (user?.role === 'physio') {
        userSessions = sessionsData.filter(session => session.physioId === 1); // Mock current physio ID
      }
      setSessions(userSessions);
      setFilteredSessions(userSessions);
      setPatients(patientsData);
      setPhysios(physiosData);
      setMachines(machinesData);
      setRedFlags(redFlagsData);
    }).catch(err => console.error('Error loading data:', err));
  }, [user]);

  useEffect(() => {
    let filtered = sessions;
    if (searchTerm) {
      filtered = filtered.filter(session => {
        const patient = patients.find(p => p.id === session.patientId);
        return patient?.name.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(session => session.status === statusFilter);
    }
    setFilteredSessions(filtered);
  }, [sessions, patients, searchTerm, statusFilter]);

  const getPatientName = (id) => patients.find(p => p.id === id)?.name || 'Unknown';
  const getPhysioName = (id) => physios.find(p => p.id === id)?.name || 'Unknown';
  const getMachineName = (id) => machines.find(m => m.id === id)?.name || 'No machine';

  const handleSessionAction = (sessionId, action) => {
    if (action === 'completed') {
      setFeedbackDialog({ open: true, sessionId: sessionId });
    } else if (action === 'canceled') {
      setCancelDialog({ open: true, sessionId: sessionId });
    } else {
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status: action } : s));
      toast({ title: "Session Updated", description: `Session has been marked as ${action}` });
    }
  };

  const handleCancelSubmit = () => {
    const { sessionId } = cancelDialog;
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status: 'canceled', cancelledKms: parseFloat(cancelledKms) || 0 } : s));
    toast({ title: "Session Canceled", description: "Session has been marked as canceled." });
    setCancelDialog({ open: false, sessionId: null });
    setCancelledKms('');
  };

  const handleFeedbackUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFeedback(prev => ({ ...prev, media: [...prev.media, file.name] }));
      toast({ title: "Media Added", description: `${file.name} staged for upload.` });
    }
  };

  const handleFeedbackSubmit = () => {
    const { sessionId } = feedbackDialog;
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status: 'completed', feedback } : s));
    if (feedback.redFlags.length > 0) {
      toast({ title: "HOD Notification", description: "Red flags have been reported to HOD for review." });
    }
    setFeedbackDialog({ open: false, sessionId: null });
    setFeedback(initialFeedbackState);
    toast({ title: "Session Completed", description: "Session feedback has been recorded." });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const formData = {
      ...sessionForm,
      patientId: parseInt(sessionForm.patientId),
      physioId: parseInt(sessionForm.physioId),
      machineId: sessionForm.machineId ? parseInt(sessionForm.machineId) : null,
      sessionDate: format(sessionForm.sessionDate, "yyyy-MM-dd"),
    };

    if (editingSession) {
      setSessions(prev => prev.map(s => s.id === editingSession.id ? { ...s, ...formData } : s));
      toast({ title: "Success", description: "Session updated." });
    } else {
      const newSession = { id: Date.now(), ...formData, status: 'scheduled', feedback: null };
      setSessions(prev => [newSession, ...prev]);
      toast({ title: "Success", description: "New session scheduled." });
    }
    setIsFormOpen(false);
    setEditingSession(null);
    setSessionForm(initialFormState);
  };

  const handleEditSession = (session) => {
    setEditingSession(session);
    setSessionForm({
      ...session,
      patientId: session.patientId.toString(),
      physioId: session.physioId.toString(),
      machineId: session.machineId ? session.machineId.toString() : '',
      sessionDate: new Date(session.sessionDate),
    });
    setIsFormOpen(true);
  };

  const handleDeleteSession = (sessionId) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    toast({ title: "Deleted", description: "Session has been removed.", variant: "destructive" });
  };

  const openNewSessionDialog = () => {
    setEditingSession(null);
    setSessionForm(initialFormState);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{user?.role === 'physio' ? 'My Sessions' : 'Session Management'}</h1>
          <p className="text-gray-600">{user?.role === 'physio' ? 'Manage your assigned patient sessions' : 'Manage all patient sessions and track progress'}</p>
        </div>
        {user?.role !== 'physio' && <Button onClick={openNewSessionDialog}><PlusCircle className="mr-2 h-4 w-4" /> Schedule Session</Button>}
      </motion.div>

      <Card className="medical-card">
        <CardHeader><CardTitle>Search & Filter</CardTitle></CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div className="flex-1 relative"><Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" /><Input placeholder="Search by patient name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" /></div>
            <div className="w-48"><Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="scheduled">Scheduled</SelectItem><SelectItem value="attended">Attended</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="canceled">Canceled</SelectItem></SelectContent></Select></div>
          </div>
        </CardContent>
      </Card>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
        <Card className="medical-card">
          <CardHeader><CardTitle>Sessions ({filteredSessions.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b"><th className="text-left p-2">Patient</th>{user?.role !== 'physio' && <th className="text-left p-2">Physiotherapist</th>}<th className="text-left p-2">Date & Time</th><th className="text-left p-2">Machine</th><th className="text-left p-2">Status</th><th className="text-left p-2">Feedback</th><th className="text-left p-2">Actions</th></tr></thead>
                <tbody>
                  {filteredSessions.map((session) => (
                    <tr key={session.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">{getPatientName(session.patientId)}</td>
                      {user?.role !== 'physio' && <td className="p-2">{getPhysioName(session.physioId)}</td>}
                      <td className="p-2"><div><p className="text-sm">{session.sessionDate}</p><p className="text-xs text-gray-600">{session.sessionTime}</p></div></td>
                      <td className="p-2">{getMachineName(session.machineId)}</td>
                      <td className="p-2"><span className={`px-2 py-1 rounded-full text-xs status-${session.status}`}>{session.status}</span></td>
                      <td className="p-2">{session.feedback ? <div className="text-xs">{session.feedback.pros && <p className="text-green-600">✓ {session.feedback.pros}</p>}{session.feedback.redFlags?.length > 0 && <p className="text-red-600">⚠ {session.feedback.redFlags.join(', ')}</p>}{session.feedback.media?.length > 0 && <p className="text-blue-600"><Paperclip size={12} className="inline-block mr-1" />{session.feedback.media.join(', ')}</p>}</div> : <span className="text-gray-400 text-xs">No feedback</span>}</td>
                      <td className="p-2">
                        <div className="flex space-x-1">
                          {session.status === 'scheduled' && <Button size="sm" onClick={() => handleSessionAction(session.id, 'attended')}><Play size={12} /></Button>}
                          {session.status === 'attended' && <Button size="sm" variant="outline" onClick={() => handleSessionAction(session.id, 'completed')}><Square size={12} /></Button>}
                          {session.status === 'completed' && !session.feedback && <Button size="sm" variant="outline" onClick={() => setFeedbackDialog({ open: true, sessionId: session.id })}><MessageSquare size={12} /></Button>}
                          {(session.status === 'scheduled' || session.status === 'attended') && <Button size="sm" variant="destructive" onClick={() => handleSessionAction(session.id, 'canceled')}><XCircle size={12} /></Button>}
                          {user?.role !== 'physio' && <>
                            <Button size="sm" variant="outline" onClick={() => handleEditSession(session)}><Edit size={12} /></Button>
                            <AlertDialog><AlertDialogTrigger asChild><Button size="sm" variant="destructive"><Trash2 size={12} /></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the session.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteSession(session.id)}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
                          </>}
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

      <Dialog open={feedbackDialog.open} onOpenChange={(open) => setFeedbackDialog({ open, sessionId: null })}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader><DialogTitle>Add Session Feedback</DialogTitle><DialogDescription>Provide feedback for the completed session.</DialogDescription></DialogHeader>
          <div className="flex-1 overflow-y-auto pr-6">
            <div className="space-y-6 pt-4">
              <div className="space-y-2"><Label htmlFor="pros">Positive Feedback (Pros)</Label><textarea id="pros" className="w-full p-2 border rounded-md" rows={2} value={feedback.pros} onChange={(e) => setFeedback({ ...feedback, pros: e.target.value })} placeholder="What went well..." /></div>
              
              <div className="space-y-2"><Label>Mode of Exercise</Label><RadioGroup defaultValue="passive" value={feedback.exerciseMode} onValueChange={(v) => setFeedback({...feedback, exerciseMode: v})} className="flex gap-4"><div className="flex items-center space-x-2"><RadioGroupItem value="active" id="ex-active" /><Label htmlFor="ex-active">Active</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="passive" id="ex-passive" /><Label htmlFor="ex-passive">Passive</Label></div></RadioGroup></div>

              <div className="space-y-2"><Label>Red Flags</Label><div className="p-3 border rounded-md grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">{redFlags.map(flag => (<div key={flag.id} className="flex items-center space-x-2"><Checkbox id={`rf-${flag.id}`} onCheckedChange={(checked) => { setFeedback(prev => ({ ...prev, redFlags: checked ? [...prev.redFlags, flag.name] : prev.redFlags.filter(f => f !== flag.name) })) }} /><Label htmlFor={`rf-${flag.id}`} className="text-sm font-normal">{flag.name}</Label></div>))}</div></div>

              <div className="space-y-2"><Label>Home Exercise Program Assigned</Label><RadioGroup value={feedback.homeExercise} onValueChange={(v) => setFeedback({...feedback, homeExercise: v})} className="flex gap-4"><div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="he-yes" /><Label htmlFor="he-yes">Yes</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="no" id="he-no" /><Label htmlFor="he-no">No</Label></div></RadioGroup></div>

              <div className="space-y-2"><Label>Modalities</Label><RadioGroup value={feedback.modalities} onValueChange={(v) => setFeedback({...feedback, modalities: v})} className="flex gap-4"><div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="mod-yes" /><Label htmlFor="mod-yes">Yes</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="no" id="mod-no" /><Label htmlFor="mod-no">No</Label></div></RadioGroup></div>
              
              {feedback.modalities === 'yes' && <motion.div initial={{opacity: 0, height: 0}} animate={{opacity: 1, height: 'auto'}} className="space-y-2 pl-4"><Label>List of Modalities</Label><div className="p-3 border rounded-md grid grid-cols-3 gap-2">{modalitiesOptions.map(mod => (<div key={mod} className="flex items-center space-x-2"><Checkbox id={`mod-${mod}`} onCheckedChange={(checked) => { setFeedback(prev => ({ ...prev, modalityList: checked ? [...prev.modalityList, mod] : prev.modalityList.filter(m => m !== mod) })) }} /><Label htmlFor={`mod-${mod}`} className="text-sm font-normal">{mod}</Label></div>))}</div></motion.div>}

              <div className="space-y-2"><Label htmlFor="targetedArea">Targeted Area</Label><Input id="targetedArea" value={feedback.targetedArea} onChange={(e) => setFeedback({ ...feedback, targetedArea: e.target.value })} placeholder="e.g., Lower back, right shoulder" /></div>

              {user?.role === 'physio' && (
                <div className="space-y-2">
                  <Label>Upload Image/Video</Label>
                  <Input type="file" accept="image/*,video/*" className="hidden" ref={fileInputRef} onChange={handleFeedbackUpload} />
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current.click()}><Upload size={16} className="mr-2" /> Attach Media</Button>
                  <div className="mt-2 space-y-1">
                    {feedback.media.map((doc, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-gray-600"><Paperclip size={14} /> {doc}</div>
                    ))}
                  </div>
                </div>
              )}
              <DialogFooter><Button type="button" variant="outline" onClick={() => setFeedbackDialog({ open: false, sessionId: null })}>Cancel</Button><Button onClick={handleFeedbackSubmit}>Submit Feedback</Button></DialogFooter>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelDialog.open} onOpenChange={(open) => setCancelDialog({ open, sessionId: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Session</DialogTitle>
            <DialogDescription>Enter the kilometers travelled before cancellation, if any.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Label htmlFor="cancelledKms">Cancelled Kms</Label>
            <Input id="cancelledKms" type="number" value={cancelledKms} onChange={(e) => setCancelledKms(e.target.value)} placeholder="e.g., 5" />
            <p className="text-xs text-gray-500">This amount will be deducted from the physio's daily total.</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCancelDialog({ open: false, sessionId: null })}>Back</Button>
            <Button onClick={handleCancelSubmit}>Confirm Cancellation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent><DialogHeader><DialogTitle>{editingSession ? 'Edit Session' : 'Schedule New Session'}</DialogTitle></DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-4 pt-4">
            <div className="space-y-2"><Label>Patient</Label><Select onValueChange={(v) => setSessionForm(p => ({ ...p, patientId: v }))} value={sessionForm.patientId}><SelectTrigger><SelectValue placeholder="Select a patient" /></SelectTrigger><SelectContent>{patients.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Physiotherapist</Label><Select onValueChange={(v) => setSessionForm(p => ({ ...p, physioId: v }))} value={sessionForm.physioId}><SelectTrigger><SelectValue placeholder="Select a physio" /></SelectTrigger><SelectContent>{physios.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Session Date</Label><Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !sessionForm.sessionDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{sessionForm.sessionDate ? format(sessionForm.sessionDate, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={sessionForm.sessionDate} onSelect={(d) => setSessionForm(p => ({ ...p, sessionDate: d }))} initialFocus /></PopoverContent></Popover></div>
            <div className="space-y-2"><Label htmlFor="sessionTime">Session Time</Label><Input id="sessionTime" type="time" value={sessionForm.sessionTime} onChange={(e) => setSessionForm(p => ({ ...p, sessionTime: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Machine Used (Optional)</Label><Select onValueChange={(v) => setSessionForm(p => ({ ...p, machineId: v }))} value={sessionForm.machineId}><SelectTrigger><SelectValue placeholder="Select a machine" /></SelectTrigger><SelectContent>{machines.map(m => <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>)}</SelectContent></Select></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button><Button type="submit">{editingSession ? 'Save Changes' : 'Schedule Session'}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SessionManagement;