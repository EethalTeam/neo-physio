import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog , AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Calendar as CalendarIcon, Play, Square, MessageSquare, Search, PlusCircle, Edit, Trash2, Upload, Paperclip, XCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, isMonday } from "date-fns";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '@/components/CustomComponents/apiRequest'


const SessionManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [physios, setPhysios] = useState([]);
  const [machines, setMachines] = useState([]);
  const [redFlags, setRedFlags] = useState([]);
  const [Modalities, setModalities] = useState([])
  // console.log(Modalities,"Modalities")
  const [sessionStatus, setSessionStatus] = useState([])
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('Date')


  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const initialFormState =
  {
    // patientId: '',
    //  physioId: '', 
    //  sessionDate: null, 
    //  sessionTime: '', 
    //  machineId: ''

    sessionCode: '',
    patientId: '',
    physioId: '',
    sessionDate: "",
    sessionDay: '',
    sessionTime: '',
    sessionStatusId: '691ecb36b87c5c57dead47a7',
    // machineId:''

  };
  const [sessionForm, setSessionForm] = useState(initialFormState);
  const [feedbackDialog, setFeedbackDialog] = useState({ open: false, sessionId: null });
  console.log(feedbackDialog,"feedbackDialog")
  const initialFeedbackState = {
    sessionFeedbackPros: '',
    redFlags: [],
    media: [],
    modeOfExercise: '',
    homeExerciseAssigned: '',
    modalities: '',
    modalitiesList: [],
    targetArea: '',
    machineId: ""
  };
  const [feedback, setFeedback] = useState(initialFeedbackState);
  const fileInputRef = useRef(null);

  const [cancelDialog, setCancelDialog] = useState({ open: false, sessionId: null });
  const [cancelledKms, setCancelledKms] = useState('');
  const [radio, setRadio] = useState([])
  const { getPermissionsByPath } = useAuth();
  const [Permissions, setPermissions] = useState({ isAdd: false, isView: false, isEdit: false, isDelete: false })

  // const modalitiesOptions = ["TENS", "IFT", "USD", "WAX", "ICE", "HOT", "Weights", "Band"];




  useEffect(() => {

    getPhysio()
    getPatient()
    getSessionStatus()
    getMachinery()
    getRedFlag()
    getModalities()
  }, [])



  useEffect(() => {
    getPermissionsByPath(window.location.pathname).then(res => {
      if (res) {
        setPermissions(res)
      } else {
        navigate('/dashboard')
      }
    })

  }, [])

  useEffect(() => {
    if (Permissions.isView) {
      getSession()
    }
  }, [Permissions])


  // const getSession = async (data) => {
  //   try {
  //     let date = new Date().toISOString()
  //     let nextdate1 = Number(date.split('T')[0].split('-')[2]) + 1
  //     console.log(nextdate1, "nextdate")
  //     let filter = `${date.split('T')[0]}T00:00:00Z`
  //     const [year, month] = date.split("T")[0].split("-");
  //     let nextdate = `${year}-${month}-${nextdate1}T00:00:00Z`;
  //     //  let nextdate=`${date.split('T')[0].split('-')[0]}-${date.split('T')[0].split('-')[1]}-${nextdate1}T00:00:00Z`
  //     console.log(nextdate, "nextdate")
  //     const response = await apiRequest("Session/getAllSession", {
  //       method: 'POST',
  //       body: JSON.stringify({ sessionDate: filter, nextDate: nextdate, physioId: user._id })
  //     });
  //     setSessions(response)
  //     setFilteredSessions(response)

  //   } catch (error) {
  //     console.log(error, "error from frontend get All  Session")
  //   }
  // }




  const getSession = async (data) => {
    try {
      const storedRole = localStorage.getItem('userRole');
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      let date = today.toISOString();
      let filter = `${date.split('T')[0]}T00:00:00Z`

      let nextdate = `${tomorrow.toISOString().split('T')[0]}T00:00:00Z`

      const response = await apiRequest("Session/getAllSession", {
        method: 'POST',
        body: JSON.stringify({
          sessionDate: filter,
          nextDate: nextdate,
          physioId: user._id,
          storedRole: storedRole

        })
      });

      setSessions(response);
      setFilteredSessions(response);

    } catch (error) {
      console.log(error, "error from frontend get All Session");
    }
  }


  const getCreateSession = async (data) => {
    try {
      if (!data.sessionDate) {
        return
      }
      let [month, date, year] = data.sessionDate.toLocaleDateString().split('/')
      let date1 = `${year}-${month}-${date}`
      const create = {
        sessionStatusId: data.sessionStatusId,
        patientId: data.patientId,
        physioId: data.physioId,
        sessionDate: new Date(date1).toISOString(),
        sessionTime: data.sessionTime,
        sessionDay: data.sessionDay
      }
      const response = await apiRequest("Session/createSession", {
        method: 'POST',
        body: JSON.stringify(create)
      });
      getSession()

    } catch (error) {
      console.log(error, "error from frontend get All  Session")
    }
  }

  const updateSession = async (data) => {
    try {
      const response = await apiRequest("Session/updateSession", {
        method: 'POST',
        body: JSON.stringify(data)
      });
      getSession()

    } catch (error) {
      console.log(error, "error from frontend update  Session")
    }
  }


  const deleteSession = async (data) => {
    try {
      const response = await apiRequest("Session/deleteSession", {
        method: 'POST',
        body: JSON.stringify(data)
      });
      getSession()

    } catch (error) {
      console.log(error, "error   Session delete")
    }
  }



  const getPatient = async (data) => {
    try {
      const response = await apiRequest("Patient/getAllPatient", {
        method: 'POST',
        body: JSON.stringify(data)
      });
      setPatients(response)

    } catch (error) {
      console.log(error, "error from frontend get All patient")
    }
  }

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


  const getSessionStatus = async (data) => {
    try {
      const response = await apiRequest("SessionStatus/getAllSessionStatus", {
        method: 'POST',
        body: JSON.stringify(data)
      });
      // setSessionStatus(response)
      setSessionStatus(response.sessionStatuses);

    } catch (error) {
      console.log(error, "error from frontend get All Session Status")
    }
  }


  const getMachinery = async (data) => {
    try {
      const response = await apiRequest("Machinery/getAllMachinery", {
        method: 'POST',
        body: JSON.stringify(data)
      });
      setMachines(response)

    } catch (error) {
      console.log(error, "error from frontend get All Machinery")
    }
  }


  const getRedFlag = async (data) => {
    try {
      const response = await apiRequest("Redflag/getAllRedflag", {
        method: 'POST',
        body: JSON.stringify(data)
      });
      setRedFlags(response)

    } catch (error) {
      console.log(error, "error from frontend get All RedFlag")
    }
  }


  const getModalities = async (data) => {
    try {
      const response = await apiRequest("Modalities/getAllModalities", {
        method: 'POST',
        body: JSON.stringify(data)
      });
      setModalities(response)

    } catch (error) {
      console.log(error, "error from frontend get All Modalities")
    }
  }


  const SessionStart = async (data) => {
    try {
      const response = await apiRequest("Session/SessionStart", {
        method: 'POST',
        body: JSON.stringify(data)
      })
      getSession()
      return response
    } catch (error) {
      console.log(error, "error from frontend get All Session Start")
    }
  }

  const SessionCancel = async (data) => {
    try {
      const response = await apiRequest("Session/SessionCancel", {
        method: 'POST',
        body: JSON.stringify(data)
      })
      getSession()
      return response

    } catch (error) {
      console.log(error, "error from frontend get All Session Cancel")
    }
  }



  const SessionEnd = async (data) => {
    console.log("SessionEnd")
    try {
      const response = await apiRequest("Session/SessionEnd", {
        method: 'POST',
        body: JSON.stringify(data)
      })

      if (response) {
        if (feedback.redFlags.length > 0) {
          toast({ title: "HOD Notification", description: "Red flags have been reported to HOD for review." });
        }
        setFeedbackDialog({ open: false, sessionId: null });
        setFeedback(initialFeedbackState);
        toast({ title: "Session Completed", description: "Session feedback has been recorded." });
        getSession()
      }
    } catch (error) {
      console.log(error, "error from frontend get All Session Start")
    }
  }

  //convert the time 

  const Converttime = (time) => {
    const [hours, minutes] = time.split(':')
    const data = new Date();
    data.setHours(hours, minutes);
    return data.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }



  // getDayName
  const getDayName = (date) => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    return days[new Date(date).getDay()]
  }


  const CovertTdyTim = () => {
    return new Date().toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    })
  }


  // useEffect(() => {
  //   Promise.all([
  //     fetch('/mockdata/sessions.json').then(res => res.json()),
  //     fetch('/mockdata/patients.json').then(res => res.json()),
  //     fetch('/mockdata/physios.json').then(res => res.json()),
  //     fetch('/mockdata/machines.json').then(res => res.json()),
  //     fetch('/mockdata/redflags.json').then(res => res.json())
  //   ]).then(([sessionsData, patientsData, physiosData, machinesData, redFlagsData]) => {
  //     let userSessions = sessionsData;
  //     if (user?.role === 'Physio') {
  //       userSessions = sessionsData.filter(session => session.physioId === 1); // Mock current physio ID
  //     }
  //     setSessions(userSessions);
  //     setFilteredSessions(userSessions);
  //     setPatients(patientsData);
  //     setPhysios(physiosData);
  //     setMachines(machinesData);
  //     setRedFlags(redFlagsData);
  //   }).catch(err => console.error('Error loading data:', err));
  // }, [user]);

  // useEffect(() => {
  //   let filtered = sessions;
  //   if (searchTerm) {
  //     filtered = filtered.filter(session => {  session.patientId?.patientName?.toLowerCase().includes(searchTerm.toLowerCase())
  //       const patient = patients.find(p => p.id === session.patientId);
  //       return patient?.name.toLowerCase().includes(searchTerm.toLowerCase());
  //     });
  //   }
  //   if (statusFilter !== 'all') {
  //     console.log(filtered, "object")
  //     filtered = filtered.filter(session => session.sessionStatusId.sessionStatusName === statusFilter);
  //     console.log(filtered, "filtered")
  //   }
  //   setFilteredSessions(filtered);
  // }, [sessions, patients, searchTerm, statusFilter]);


  useEffect(() => {
  let filtered = sessions;

  // Search by patient name
  if (searchTerm)
     { 
    filtered = filtered.filter(session => session.patientId?.patientName?.toLowerCase().includes(searchTerm.toLowerCase()));
    }

  // Filter by status
  if (statusFilter !== 'all') {
    filtered = filtered.filter(
      session => session.sessionStatusId?.sessionStatusName === statusFilter
    );
  }

  setFilteredSessions(filtered);
}, [sessions, searchTerm, statusFilter]);


  const getPatientName = (id) => patients.find(p => p.id === id)?.name || 'Unknown';
  const getPhysioName = (id) => physios.find(p => p.id === id)?.name || 'Unknown';
  const getMachineName = (id) => machines.find(m => m.id === id)?.name || 'No machine';

  const handleSessionAction = (sessionId, action) => {
    console.log(sessionId,"sessionId")
    if (action === 'Completed') {
      setFeedbackDialog({ open: true, sessionId: sessionId });
      // handleActionEnd(sessionId, action)
    } else if (action === 'Canceled') {
      setCancelDialog({ open: true, sessionId: sessionId });
    } else {
      handleActionStart(sessionId, action)

      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status: action } : s));
      toast({ title: "Session Updated", description: `Session has been marked as ${action}` });
    }
  };

  const handleCancelSubmit = () => {
    const { sessionId } = cancelDialog;
    handleActionCancel(sessionId, 'Canceled', cancelledKms)
    setSessions(prev => prev.map(s => s._id === sessionId ? { ...s, status: 'Canceled', cancelledKms: parseFloat(cancelledKms) || 0 } : s));
    toast({ title: "Session Canceled", description: "Session has been marked as Canceled." });
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
    console.log(sessionId,"sessionId")
    handleActionEnd(feedback, 'Completed', sessionId)
    // setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status: 'Completed', feedback } : s));

  };


  const handleActionStart = (session, action) => {
    SessionStart({
      _id: session, sessionFromTime: CovertTdyTim(), action: action
    })

  }

  const handleActionCancel = (session, action, cancelledKms) => {
    SessionCancel({
      _id: session,
      action: action,
      cancelledKms: cancelledKms
    })
  }


  const handleActionEnd = (session, action, id) => {
    SessionEnd({
      _id: id,
      sessionToTime: CovertTdyTim(),
      action: action,
      machineId: session.machineId,
      sessionFeedbackPros: session.sessionFeedbackPros,
      redFlags: session.redFlags,
      targetArea: session.targetArea,
      modalitiesList: session.modalitiesList,
      modalities: feedback.modalities === 'yes' ? true : false

    })

  }



  const handleFormSubmit = (e) => {
    e.preventDefault();

    if (!sessionForm.patientId) {
      alert("select the patient")
    }

    if (!sessionForm.physioId) {
      alert("select the physio")
    }

    const formData = {
      ...sessionForm,
      patientId: parseInt(sessionForm.patientId),
      physioId: parseInt(sessionForm.physioId),
      machineId: sessionForm.machineId ? parseInt(sessionForm.machineId) : null,
      sessionDate: sessionForm.sessionDate
    };

    if (editingSession) {
      updateSession({ ...sessionForm, redFlags: radio })
      toast({ title: "Success", description: "Session updated." });
    } else {
      const newSession = { id: Date.now(), ...formData, status: 'scheduled', feedback: null };
      getCreateSession({ ...sessionForm, redFlags: radio })
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
      // patientId: session.patientId.toString(),
      // physioId: session.physioId.toString(),
      // machineId: session.machineId ? session.machineId.toString() : '',
      // sessionDate: new Date(session.sessionDate),

      sessionCode: session.sessionCode ? session.sessionCode : '',
      patientId: session.patientId ? session.patientId._id : '',
      physioId: session.physioId ? session.physioId._id : '',
      sessionDate: session.sessionDate ? new Date(session.sessionDate) : '',
      sessionDay: session.sessionDay ? session.sessionDay : '',
      sessionTime: session.sessionTime ? session.sessionTime : '',
      sessionFromTime: session.sessionFromTime ? session.sessionFromTime : '',
      sessionToTime: session.sessionToTime ? session.sessionToTime : '',
      // machineId: session.machineId?session.machineId._id:'',
      sessionStatusId: session.sessionStatusId ? session.sessionStatusId._id : '',

    });
    setIsFormOpen(true);
  };

  const handleDeleteSession = (id) => {
    // setSessions(prev => prev.filter(s => s.id !== sessionId));
    deleteSession({ _id: id })
    toast({ title: "Deleted", description: "Session has been removed.", variant: "destructive" });
  };

  const openNewSessionDialog = () => {
    setEditingSession(null);
    setSessionForm(initialFormState);
    setIsFormOpen(true);
  };

  // const handleRadio = (name,value) => {
  //   setRadio(prev =>[...prev, { redFlagIdID: RedflagIDPK, isOccurred: value }] )
  //   setFeedback(prev => ({ ...prev, [name]: value }))

  // }
  // const handleRadioChange = (name, value) => {
  //   setFeedback(prev => ({ ...prev, [name]: value }));
  // };




  //  const renderRadioGroup = (label, name, value, id, group, dynamic) => (
  //     <div className="flex items-center space-x-4">
  //       <Label className="w-24">{label}</Label>
  //       <RadioGroup value={feedback[name] || (group ? false : 'no')} onValueChange={(v) => { dynamic ? handleRadio(name, v, id) : handleRadioChange(name, v) }} className="flex gap-4">
  //         <div className="flex items-center space-x-2"><RadioGroupItem value={group ? true : 'yes'} id={`${name}-yes`} /><Label htmlFor={`${name}-yes`}>Yes</Label></div>
  //         <div className="flex items-center space-x-2"><RadioGroupItem value={group ? false : 'no'} id={`${name}-no`} /><Label htmlFor={`${name}-no`}>No</Label></div>
  //       </RadioGroup>
  //     </div>  )


  return (
    <div className="md:space-y-6  space-y-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="md:flex md:justify-between md:items-center lg:flex lg:justify-between lg:items-center space-y-5">
        <div>
          <h1 className="md:text-3xl text-xl font-bold text-gray-800 mb-2">{user?.role === 'Physio' ? 'My Sessions' : 'Session Management'}</h1>
          <p className="text-gray-600">{user?.role === 'Physio' ? 'Manage your assigned patient sessions' : 'Manage all patient sessions and track progress'}</p>
        </div>
        {user?.role !== 'physio' && (Permissions.isAdd && <Button onClick={openNewSessionDialog}><PlusCircle className="mr-2 h-4 w-4" /> Schedule Session</Button>)}
      </motion.div>

      <Card className="medical-card max-w-fit md:max-w-full  ">
        <CardHeader><CardTitle>Search & Filter</CardTitle></CardHeader>
        <CardContent>
          <div className="flex md:flex-row  flex-col items-center gap-4  md:space-x-4  ">
            <div className="flex-1 relative"><Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" /><Input placeholder="Search by patient name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" /></div>
            <div className="w-48"><Select value={dateFilter} onValueChange={setDateFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Date">Date</SelectItem><Input type='Date' value={sessionForm.sessionDate} /></SelectContent></Select></div>
            <div className="w-48"><Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="Scheduled">Scheduled</SelectItem><SelectItem value="Attended">Attended</SelectItem><SelectItem value="Completed">Completed</SelectItem><SelectItem value="Canceled">Canceled</SelectItem></SelectContent></Select></div>
          </div>
        </CardContent>
      </Card>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
        <Card className="medical-card hidden md:block">
          <CardHeader><CardTitle>Sessions ({filteredSessions.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b"><th className="text-left p-2">Patient</th>{user?.role !== 'physio' && <th className="text-left p-2">Physiotherapist</th>}<th className="text-left p-2">Date & Time</th><th className="text-left p-2">Machine</th><th className="text-left p-2">Status</th><th className="text-left p-2">Feedback</th><th className="text-left p-2">Actions</th></tr></thead>
                <tbody>
                  {filteredSessions.map((session) => (
                    <tr key={session._id} className="border-b hover:bg-gray-50">
                      <td className="p-2">{session.patientId?.patientName}</td>
                      {/* <td className="p-2">{session.patientId.patientName}</td> */}
                      {/* <td className='p-2'>
                        {
                          patients.map((pat)=>{
                              <div key={pat._id}>{pat.patientName}</div> 
                          })
                        }
                          
                      </td> */}

                      {user?.role !== 'physio' && <td className="p-2">{session.physioId?.physioName || '-'}</td>}
                      {/* {user?.role !== 'physio' && <td className="p-2">{session.physioId.physioName}</td>} */}
                      <td className="p-2"><div><p className="text-sm">{session.sessionDate.split('T')[0].split('-').reverse().join('-')} ({session.sessionDay})</p><p className="text-xs text-gray-600">{Converttime(session.sessionTime)}</p></div></td>
                      <td className="p-2">{session.machineId ? session.machineId.machineName : '-'}</td>
                      <td className="p-2"><span className={`px-2 py-1 rounded-full text-xs status-${session.status}`} style={{ backgroundColor: session.sessionStatusId ? session.sessionStatusId.sessionStatusColor : 'white', color: session.sessionStatusId ? session.sessionStatusId.sessionStatusTextColor : 'black' }}> {session.sessionStatusId ? session.sessionStatusId.sessionStatusName : ''}</span></td>
<td className="p-2">
  <div className="text-xs space-y-1">
    {/* Session Feedback Pros */}
    {session.sessionFeedbackPros && (
      <p className="text-green-600">
        ✓ {session.sessionFeedbackPros}
      </p>
    )}

    {/* Red Flags */}
    {session.redFlags?.length > 0 ? (
      session.redFlags.map(flag => (
        flag.isOccurred && (
          <p
            key={flag._id}
            className="text-red-600"
          >
            ⚠ {flag.redFlagId?.redflagName}
          </p>
        )
      ))
    ) : (
      !session.sessionFeedbackPros && (
        <span className="text-gray-400">No feedback</span>
      )
    )}
  </div>
</td>
{/* <td className="p-2">{session.feedback ? <div className="text-xs">{session.feedback.sessionFeedbackPros && <p className="text-green-600">✓ {session.feedback.sessionFeedbackPros}</p>}{session.feedback.redFlags?.length > 0 && <p className="text-red-600">⚠ {session.feedback.redFlags.join(', ')}</p>}{session.feedback.media?.length > 0 && <p className="text-blue-600"><Paperclip size={12} className="inline-block mr-1" />{session.feedback.media.join(', ')}</p>}</div> : <span className="text-gray-400 text-xs">No feedback</span>}</td> */}
                      <td className="p-2">
                        <div className="flex space-x-1">
                          {session.sessionStatusId.sessionStatusName.toLowerCase() === 'scheduled' && <Button size="sm" onClick={() => handleSessionAction(session._id, 'Attended')}><Play size={12} /></Button>}
                          {session.sessionStatusId.sessionStatusName.toLowerCase() === 'attended' && <Button size="sm" variant="outline" onClick={() => handleSessionAction(session._id, 'Completed')}><Square size={12} /></Button>}
                          {session.sessionStatusId.sessionStatusName.toLowerCase() === 'completed' && !session.feedback && <Button size="sm" variant="outline" onClick={() => setFeedbackDialog({ open: true, sessionId: session._id })}><MessageSquare size={12} /></Button>}
                          {(session.sessionStatusId.sessionStatusName.toLowerCase() === 'scheduled' || session.sessionStatusId.sessionStatusName === 'Attended') && <Button size="sm" variant="destructive" onClick={() => handleSessionAction(session._id, 'Canceled')}><XCircle size={12} /></Button>}
                          {user?.role !== 'physio' && <>
                            <Button size="sm" variant="outline" onClick={() => handleEditSession(session)}><Edit size={12} /></Button>
                            <AlertDialog><AlertDialogTrigger asChild><Button size="sm" variant="destructive"><Trash2 size={12} /></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the session.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteSession(session._id)}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
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

         
        {/* //card for mobile view */}
        {/* <Card className="medical-card  md:hidden"> */}
          {/* <CardHeader><CardTitle>Sessions ({filteredSessions.length})</CardTitle></CardHeader> */}
          {/* <CardContent> */}
            {/* Mobile view */}
            {/* <div className="md:hidden space-y-4">
              {filteredSessions.map((session) => (
                <Card key={session._id} className="p-4 shadow-lg rounded-2xl border"> */}

                  {/* --- Top Section --- */}
                  {/* <div className="mb-2">
                    <p className="text-base font-bold">{session.patientId.patientName}</p>

                    {user?.role !== 'physio' && (
                      <p className="text-sm text-gray-500">
                        Physio: <span className="font-medium">{session.physioId.physioName}</span>
                      </p>
                    )}
                  </div> */}

                  {/* --- Date + Time Badge --- */}
                  {/* <div className="bg-gray-100 rounded-md p-2 text-xs mb-2">
                    <p className="font-semibold">
                      {session.sessionDate.split('T')[0].split('-').reverse().join('-')} ({session.sessionDay})
                    </p>
                    <p className="text-gray-700">
                      {Converttime(session.sessionTime)}
                    </p>
                  </div> */}

                  {/* --- Machine & Status --- */}
                  {/* <div className="flex justify-between text-xs mb-2">
                    <p className="font-medium">
                      Machine: {session.machineId ? session.machineId.machineName : '-'}
                    </p>

                    <span
                      className="px-2 py-1 rounded-sm text-[10px]"
                      style={{
                        backgroundColor: session.sessionStatusId?.sessionStatusColor,
                        color: session.sessionStatusId?.sessionStatusTextColor,
                      }}
                    >
                      {session.sessionStatusId?.sessionStatusName}
                    </span>
                  </div> */}

                  {/* --- Feedback --- */}
                  {/* <div className="text-xs mb-3">
                    {session.feedback ? (
                      <>
                        {session.feedback.sessionFeedbackPros && (
                          <p className="text-green-600">✓ {session.feedback.sessionFeedbackPros}</p>
                        )}
                        {session.feedback.redFlags?.length > 0 && (
                          <p className="text-red-600">⚠ {session.feedback.redFlags.join(', ')}</p>
                        )}
                        {session.feedback.media?.length > 0 && (
                          <p className="text-blue-600">
                            <Paperclip size={12} className="inline-block mr-1" />
                            {session.feedback.media.join(', ')}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-gray-400">No feedback</p>
                    )}
                  </div> */}

                  {/* --- Action Buttons --- */}
                  {/* <div className="flex flex-wrap gap-2">
                    {session.sessionStatusId.sessionStatusName.toLowerCase() === 'scheduled' && (
                      <Button size="sm" onClick={() => handleSessionAction(session._id, 'Attended')}>
                        <Play size={12} />
                      </Button>
                    )}

                    {session.sessionStatusId.sessionStatusName.toLowerCase() === 'attended' && (
                      <Button size="sm" variant="outline" onClick={() => handleSessionAction(session._id, 'Completed')}>
                        <Square size={12} />
                      </Button>
                    )}

                    {session.sessionStatusId.sessionStatusName.toLowerCase() === 'completed' && !session.feedback && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setFeedbackDialog({ open: true, sessionId: session.sessionId })}
                      >
                        <MessageSquare size={12} />
                      </Button>
                    )}

                    {(session.sessionStatusId.sessionStatusName.toLowerCase() === 'scheduled' ||
                      session.sessionStatusId.sessionStatusName === 'Attended') && (
                        <Button size="sm" variant="destructive" onClick={() => handleSessionAction(session._id, 'Canceled')}>
                          <XCircle size={12} />
                        </Button>
                      )}

                    {user?.role !== 'physio' && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleEditSession(session)}>
                          <Edit size={12} />
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              <Trash2 size={12} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>This will permanently delete the session.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteSession(session._id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </div>
                </Card>
              ))}
            </div>

          </CardContent>
        </Card> */}

{/* Mobile view card */}
<Card className="medical-card md:hidden">
  <CardHeader>
    <CardTitle>Sessions ({filteredSessions.length})</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="md:hidden space-y-4">
      {filteredSessions.map((session) => (
        <Card key={session._id} className="p-4 shadow-lg rounded-2xl border">

          {/* Top Section */}
          <div className="mb-2">
            <p className="text-base font-bold">{session.patientId?.patientName || '-'}</p>

            {user?.role !== 'physio' && (
              <p className="text-sm text-gray-500">
                Physio: <span className="font-medium">{session.physioId?.physioName || '-'}</span>
              </p>
            )}
          </div>

          {/* Date + Time */}
          <div className="bg-gray-100 rounded-md p-2 text-xs mb-2">
            <p className="font-semibold">
              {session.sessionDate
                ? new Date(session.sessionDate).toLocaleDateString('en-GB') + ` (${session.sessionDay || '-'})`
                : '-'}
            </p>
            <p className="text-gray-700">
              {session.sessionTime ? Converttime(session.sessionTime) : '-'}
            </p>
          </div>

          {/* Machine & Status */}
          <div className="flex justify-between text-xs mb-2">
            <p className="font-medium">
              Machine: {session.machineId?.machineName || '-'}
            </p>
            <span
              className="px-2 py-1 rounded-sm text-[10px]"
              style={{
                backgroundColor: session.sessionStatusId?.sessionStatusColor || 'white',
                color: session.sessionStatusId?.sessionStatusTextColor || 'black',
              }}
            >
              {session.sessionStatusId?.sessionStatusName || '-'}
            </span>
          </div>

          {/* Feedback */}
          <div className="text-xs mb-3">
            {session.feedback ? (
              <>
                {session.feedback.sessionFeedbackPros && (
                  <p className="text-green-600">✓ {session.feedback.sessionFeedbackPros}</p>
                )}
                {session.feedback.redFlags?.length > 0 && (
                  <p className="text-red-600">⚠ {session.feedback.redFlags.join(', ')}</p>
                )}
                {session.feedback.media?.length > 0 && (
                  <p className="text-blue-600">
                    <Paperclip size={12} className="inline-block mr-1" />
                    {session.feedback.media.join(', ')}
                  </p>
                )}
              </>
            ) : (
              <p className="text-gray-400">No feedback</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {session.sessionStatusId?.sessionStatusName?.toLowerCase() === 'scheduled' && (
              <Button size="sm" onClick={() => handleSessionAction(session._id, 'Attended')}>
                <Play size={12} />
              </Button>
            )}

            {session.sessionStatusId?.sessionStatusName?.toLowerCase() === 'attended' && (
              <Button size="sm" variant="outline" onClick={() => handleSessionAction(session._id, 'Completed')}>
                <Square size={12} />
              </Button>
            )}

            {session.sessionStatusId?.sessionStatusName?.toLowerCase() === 'completed' && !session.feedback && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setFeedbackDialog({ open: true, sessionId: session._id })}
              >
                <MessageSquare size={12} />
              </Button>
            )}

            {(session.sessionStatusId?.sessionStatusName?.toLowerCase() === 'scheduled' ||
              session.sessionStatusId?.sessionStatusName?.toLowerCase() === 'attended') && (
              <Button size="sm" variant="destructive" onClick={() => handleSessionAction(session._id, 'Canceled')}>
                <XCircle size={12} />
              </Button>
            )}

            {user?.role !== 'physio' && (
              <>
                <Button size="sm" variant="outline" onClick={() => handleEditSession(session)}>
                  <Edit size={12} />
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive">
                      <Trash2 size={12} />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>This will permanently delete the session.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteSession(session._id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </Card>
      ))}
    </div>
  </CardContent>
</Card>



      </motion.div>

      <Dialog open={feedbackDialog.open} onOpenChange={(open) => setFeedbackDialog({ open, sessionId: null })}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader><DialogTitle>Add Session Feedback</DialogTitle><DialogDescription>Provide feedback for the completed session.</DialogDescription></DialogHeader>
          <div className="flex-1 overflow-y-auto pr-6">
            <div className="space-y-6 pt-4">
              <div className="space-y-2"><Label htmlFor="sessionFeedbackPros ">Positive Feedback (Pros)</Label><textarea id="sessionFeedbackPros " className="w-full p-2 border rounded-md" rows={2} value={feedback.sessionFeedbackPros} onChange={(e) => setFeedback({ ...feedback, sessionFeedbackPros: e.target.value })} placeholder="What went well..." /></div>

              <div className="space-y-2"><Label>Mode of Exercise</Label><RadioGroup defaultValue="passive" value={feedback.modeOfExercise} onValueChange={(v) => setFeedback({ ...feedback, modeOfExercise: v })} className="flex gap-4"><div className="flex items-center space-x-2"><RadioGroupItem value="active" id="ex-active" /><Label htmlFor="ex-active">Active</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="passive" id="ex-passive" /><Label htmlFor="ex-passive">Passive</Label></div></RadioGroup></div>


              <div className="space-y-2"><Label>Red Flags</Label><div className="p-3 border rounded-md grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">{redFlags.map(flag => (<div key={flag._id} className="flex items-center space-x-2"><Checkbox id={`rf-${flag._id}`} onCheckedChange={(checked) => {
                setFeedback(prev => (checked ? { ...prev, redFlags: [...prev.redFlags, { redFlagId: flag.RedflagIDPK, isOccurred: true }] } : { ...prev, redFlags: prev.redFlags.filter(f => f.redFlagId !== flag.RedflagIDPK) })
                )
              }} /><Label htmlFor={`rf-${flag.RedflagIDPK}`} className="text-sm font-normal">{flag.redflagName}</Label></div>))}</div></div>
              {/* <div className="space-y-2"><Label>Red Flags</Label>
              <div className="p-3 border rounded-md grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {  
                redFlags.map((red)=>{
                      <div key={red.RedflagIDPK}>
                          {renderRadioGroup(red.redflagName, red.redflagName.toLowerCase(), feedback[red.redflagName.toLowerCase()], red.RedflagIDPK, true, true)}
                        </div>
                  })
                }
                </div>
                </div> */}

              <div className="space-y-2"><Label>Home Exercise Program Assigned</Label><RadioGroup value={feedback.homeExerciseAssigned} onValueChange={(v) => setFeedback({ ...feedback, homeExerciseAssigned: v })} className="flex gap-4"><div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="he-yes" /><Label htmlFor="he-yes">Yes</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="no" id="he-no" /><Label htmlFor="he-no">No</Label></div></RadioGroup></div>

              <div className="space-y-2"><Label>Modalities</Label><RadioGroup value={feedback.modalities} onValueChange={(v) => setFeedback({ ...feedback, modalities: v })} className="flex gap-4"><div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="mod-yes" /><Label htmlFor="mod-yes">Yes</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="no" id="mod-no" /><Label htmlFor="mod-no">No</Label></div></RadioGroup></div>

              {feedback.modalities === 'yes' && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2 pl-4"><Label>List of Modalities</Label>
                <div className="p-3 border rounded-md grid grid-cols-3 gap-2">{Modalities.map(mod => (<div key={mod._id} className="flex items-center space-x-2"><Checkbox id={`mod-${mod._id}`} onCheckedChange={(checked) => {
                  setFeedback(prev => (checked ? { ...prev, modalitiesList: [...prev.modalitiesList, { modalityId: mod._id, isOccurred: true }] } : { ...prev, modalitiesList: prev.modalitiesList.filter(m => m.modalityId !== mod._id) }))
                }} /><Label htmlFor={`rf-${mod._id}`} className="text-sm font-normal">{mod.modalitiesName}</Label></div>))}</div></motion.div>}
              <div className="space-y-2"><Label>Machine Used</Label><Select onValueChange={(v) => setFeedback(p => ({ ...p, machineId: v }))} value={feedback.machineId}><SelectTrigger><SelectValue placeholder="Select a machine" /></SelectTrigger><SelectContent>{machines.map(m => <SelectItem key={m._id} value={m._id}>{m.machineName}</SelectItem>)}</SelectContent></Select></div>

              <div className="space-y-2"><Label htmlFor="targetArea">Targeted Area</Label><Input id="targetArea" value={feedback.targetArea} onChange={(e) => setFeedback({ ...feedback, targetArea: e.target.value })} placeholder="e.g., Lower back, right shoulder" /></div>





              {user?.role === 'Physio' && (
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

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen} >
        <DialogContent className="max-h-[80vh] overflow-y-auto scrollbar-hide"><DialogHeader><DialogTitle>{editingSession ? 'Edit Session' : 'Schedule New Session'}</DialogTitle></DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-4 pt-4">
            <div className="space-y-2"><Label>Patient</Label>
              <Select onValueChange={(v) => setSessionForm(p => ({ ...p, patientId: v }))} value={sessionForm.patientId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a patient" />
                </SelectTrigger>
                <SelectContent>{patients.map(p => <SelectItem key={p._id} value={p._id}>{p.patientName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Physiotherapist</Label><Select onValueChange={(v) => setSessionForm(p => ({ ...p, physioId: v }))} value={sessionForm.physioId}><SelectTrigger><SelectValue placeholder="Select a physio" /></SelectTrigger><SelectContent>{physios.map(p => <SelectItem key={p._id} value={p._id}>{p.physioName}</SelectItem>)}</SelectContent></Select></div>
            {/* <div className="space-y-2"><Label>Session Date</Label><Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !sessionForm.sessionDate && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {sessionForm.sessionDate ? sessionForm.sessionDate : <span>Pick a date</span>}
              </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={sessionForm.sessionDate} onSelect={(d) => setSessionForm(p => ({ ...p, sessionDate: d , }))} initialFocus /></PopoverContent></Popover></div> */}
            <div className="space-y-2"><Label>Session Date</Label><Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !sessionForm.sessionDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{sessionForm.sessionDate ? format(sessionForm.sessionDate, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={sessionForm.sessionDate} onSelect={(d) => setSessionForm(p => ({ ...p, sessionDate: d, sessionDay: getDayName(d) }))} initialFocus disabled={(date)=>date<new Date(new Date().setHours(0,0,0,0))} /></PopoverContent></Popover></div>
            <div className="space-y-2"><Label htmlFor="sessionDay">Session Day</Label><Input id="sessionDay" disabled type="text" value={sessionForm.sessionDay} onChange={(e) => setSessionForm(p => ({ ...p, sessionDay: e.target.value }))} /></div>
            <div className="space-y-2"><Label htmlFor="sessionTime">Session Time</Label><Input id="sessionTime" type="time" value={sessionForm.sessionTime} onChange={(e) => setSessionForm(p => ({ ...p, sessionTime: e.target.value }))} /></div>
            {/* <div className="space-y-2"><Label>Machine Used (Optional)</Label><Select onValueChange={(v) => setSessionForm(p => ({ ...p, machineId: v }))} value={sessionForm.machineId}><SelectTrigger><SelectValue placeholder="Select a machine" /></SelectTrigger><SelectContent>{machines.map(m => <SelectItem key={m._id} value={m._id}>{m.machineName}</SelectItem>)}</SelectContent></Select></div> */}
            <DialogFooter><Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button><Button type="submit">{editingSession ? 'Save Changes' : 'Schedule Session'}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SessionManagement;