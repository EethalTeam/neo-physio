// import React, { useState, useEffect, useRef } from 'react';
// import { motion } from 'framer-motion';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
// import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
// import { UserPlus, Search, Filter, CheckCircle, Edit, Trash2, Calendar as CalendarIcon, Upload, Paperclip } from 'lucide-react';
// import { toast } from '@/components/ui/use-toast';
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
// import { Calendar } from "@/components/ui/calendar";
// import { format } from "date-fns";
// import { cn } from "@/lib/utils";
// import { useAuth } from '@/contexts/AuthContext';
// import { apiRequest } from '@/components/CustomComponents/apiRequest'

// const LeadManagement = () => {
//   const [leadSource,SetleadSource] = useState([])
//   const [physioCate,SetPhysioCate] = useState([])
//   const [gender,SetGender] = useState([])
//   const { user } = useAuth();
//   const [leads, setLeads] = useState([]);
//   const [patients, setPatients] = useState([]);
//   const [references, setReferences] = useState([]);
//   const [filteredLeads, setFilteredLeads] = useState([]);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [statusFilter, setStatusFilter] = useState('all');
//   const [isFormOpen, setIsFormOpen] = useState(false);
//   const [isQualifyOpen, setIsQualifyOpen] = useState(false);
//   const [editingLead, setEditingLead] = useState(null);
//   const [qualifyingLead, setQualifyingLead] = useState(null);
//   const fileInputRef = useRef(null);


//   const initialFormState = { 
//   leadCode: '',  leadName: '', leadAge: '', gender: '', leadContactNo: '', leadAddress: '', physioCategory: '', leadCategory: '', referenceId: '', leadMedicalHistory: '',leadGenderId: '',physioCategoryId:'',leadSourceId:'',isQualified: '', leadDocuments: [] };
//   const [leadForm, setLeadForm] = useState(initialFormState);

//   const initialQualifyState = { consultationDate: null };
//   const [qualifyForm, setQualifyForm] = useState(initialQualifyState);



//   useEffect(()=>{
//     getLeadSource(),
//     getPhysio(),
//     getGender()
//   },[])
// const getLeadSource = async () => {
//   try {
//     const res = await apiRequest("LeadSource/getAllLeadSource",
//  { 
//     method: 'POST',
//      body: JSON.stringify({}) 
//     });
//     SetleadSource(res);
//   } catch (error) {
//     console.error("Error loading countries:", error);
//   }
// };

// const getPhysio = async () => {
//   try {
//     const res = await apiRequest("PhysioCategory/getAllPhysioCategory",
//  { 
//     method: 'POST',
//      body: JSON.stringify({}) 
//     });
//     SetPhysioCate(res);
//   } catch (error) {
//     console.error("Error loading countries:", error);
//   }
// };

// const getGender = async () => {
//   try {
//     const res = await apiRequest("Gender/getAllGender",
//  { 
//     method: 'POST',
//      body: JSON.stringify({}) 
//     });
//     SetGender(res);
//   } catch (error) {
//     console.error("Error loading countries:", error);
//   }
// };


// useEffect(()=>{
//   getLead()
// })
//    const getLead = async () => {
//     try {
//       const response = await apiRequest("Lead/getAllLead", {
//         method: 'POST',
//         body: JSON.stringify({}),
//       });
//       setCity(response)
//     } catch (error) {
//       console.error('Error:', error);
//       throw error;
//     }
//   }

//    const deleteLead = async(id)=>{
//       try {
//           console.log("Deleting ID:", id); 
//         const response = await apiRequest("Lead/deleteLead", {
//           method: 'POST',
//           body: JSON.stringify({_id:id}),
//         });
//           toast({ title: "Deleted", description: "Lead has been removed.", variant: "destructive" });
//         getLead();
//         return response;
//       } catch (error) {0
//         console.error('Error:', error);
//         throw error;    
//       }
//     }

//       const createLead = async (data) => {
//           try {
//             const response = await apiRequest("Lead/createLead", {
//               method: 'POST',
//               body: JSON.stringify(data),
//             });
//              toast({ title: "Success", description: "Lead Create successfully." });
//             getLead()
//             setIsFormOpen(false)
//             return response;
//           } catch (error) {
//             console.error('Error:', error);
//             throw error;
//           }
//         };

//          const updateLead = async(data)=>{
//          try {
//               const response = await apiRequest("Lead/updateLead", {
//                 method: 'POST',
//                 body: JSON.stringify(data),
//               });
//                 toast({ title: "Success", description: "Lead updated successfully." });
//                 getLead()
//                setIsFormOpen(false)
//               return response;
//             } catch (error) {
//               console.error('Error:', error);
//               throw error;
//             }
//            }


//             const handleDelete = (id) => {
//     // setCategories(prev => prev.filter(cat => cat.id !== categoryId));
//     deleteLead(id)
//     // toast({ title: "Deleted", description: "Country has been removed.", variant: "destructive" });
//   };

//     const  openNewLeadDialog = () => {
//     setEditingLead(null);
//     setLeadForm(initialFormState);
//     setIsFormOpen(true);
//   };

//    const handleFormSubmit = (e) => {
//     e.preventDefault();
//     if(editingLead){
//       updateLead(leadForm)
//     }else{
//       createLead(leadForm)
//     }
//      setIsFormOpen(false)
//   };

//     const handleEdit = (data) => {
//     setEditingLead(true);
//    setLeadForm(initialFormState)

//     // setCountry(countryData);
//     setIsFormOpen(true);
//   };


 








//   useEffect(() => {
//     Promise.all([
//       fetch('/mockdata/leads.json').then(res => res.json()),
//       fetch('/mockdata/references.json').then(res => res.json()),
//       fetch('/mockdata/patients.json').then(res => res.json()),
//     ]).then(([leadsData, referencesData, patientsData]) => {
//       setLeads(leadsData);
//       setReferences(referencesData);
//       setFilteredLeads(leadsData);
//       setPatients(patientsData);
//     }).catch(err => console.error('Error loading data:', err));
//   }, []);

//   useEffect(() => {
//     let filtered = leads;
//     if (searchTerm) {
//       filtered = filtered.filter(lead => lead.name.toLowerCase().includes(searchTerm.toLowerCase()) || lead.contact.includes(searchTerm));
//     }
//     if (statusFilter !== 'all') {
//       filtered = filtered.filter(lead => lead.status === statusFilter);
//     }
//     setFilteredLeads(filtered);
//   }, [leads, searchTerm, statusFilter]);

//   const handleFormChange = (e) => {
//     const { name, value } = e.target;
//     setLeadForm(prev => ({ ...prev, [name]: value }));
//   };

//   const handleSelectChange = (name, value) => {
//     const newFormState = { ...leadForm, [name]: value };
//     if (name === 'leadCategory' && value !== 'reference') {
//       newFormState.referenceId = '';
//     }
//     setLeadForm(newFormState);
//   };

//   const handleFileUpload = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       setLeadForm(prev => ({ ...prev, documents: [...prev.documents, file.name] }));
//       toast({ title: "File Added", description: `${file.name} has been staged for upload.` });
//     }
//   };

//   // const handleFormSubmit = (e) => {
//   //   e.preventDefault();
//   //   const submissionData = {
//   //     ...leadForm,
//   //     referenceId: leadForm.leadCategory === 'reference' && leadForm.referenceId ? parseInt(leadForm.referenceId) : null,
//   //   };

//   //   if (editingLead) {
//   //     setLeads(prev => prev.map(l => l.id === editingLead.id ? { ...l, ...submissionData } : l));
//   //     toast({ title: "Success", description: "Lead updated successfully." });
//   //   } else {
//   //     const newLead = { id: Date.now(), ...submissionData, status: 'pending', createdAt: new Date().toISOString().split('T')[0] };
//   //     setLeads(prev => [newLead, ...prev]);
//   //     toast({ title: "Success", description: "New lead created." });
//   //   }
//   //   setIsFormOpen(false);
//   //   setEditingLead(null);
//   //   setLeadForm(initialFormState);
//   // };

//   // const handleEditLead = (lead) => {
//   //   setEditingLead(lead);
//   //   setLeadForm({ ...initialFormState, ...lead, referenceId: lead.referenceId ? lead.referenceId.toString() : '', documents: lead.documents || [] });
//   //   setIsFormOpen(true);
//   // };

//   // const handleDeleteLead = (leadId) => {
//   //   setLeads(prev => prev.filter(l => l.id !== leadId));
//   //   toast({ title: "Deleted", description: "Lead has been removed.", variant: "destructive" });
//   // };

//   // const openNewLeadDialog = () => {
//   //   setEditingLead(null);
//   //   setLeadForm(initialFormState);
//   //   setIsFormOpen(true);
//   // };

//   const openQualifyDialog = (lead) => {
//     setQualifyingLead(lead);
//     setIsQualifyOpen(true);
//   };

//   const handleQualifySubmit = (e) => {
//     e.preventDefault();
//     const { consultationDate } = qualifyForm;
//     if (!consultationDate) {
//       toast({ title: "Error", description: "Please select a consultation date.", variant: "destructive" });
//       return;
//     }

//     setLeads(prev => prev.map(lead => lead.id === qualifyingLead.id ? { ...lead, status: 'qualified' } : lead));

//     const newPatient = {
//       id: Date.now(),
//       patientId: `PAT${String(patients.length + 1).padStart(6, '0')}`,
//       name: qualifyingLead.name,
//       age: qualifyingLead.age,
//       gender: qualifyingLead.gender,
//       contact: qualifyingLead.contact,
//       address: qualifyingLead.address,
//       category: qualifyingLead.physioCategory,
//       medicalHistory: qualifyingLead.medicalHistory,
//       registeredAt: new Date().toISOString().split('T')[0],
//       consultationDate: format(consultationDate, "yyyy-MM-dd"),
//       documents: qualifyingLead.documents || [],
//       goalLog: [],
//     };
//     setPatients(prev => [newPatient, ...prev]);

//     // This is a mock for creating a notification. In a real app, this would be an API call.
//     console.log(`New Notification for HOD: Upcoming consultation for ${newPatient.name} on ${newPatient.consultationDate}`);
    
//     toast({ title: "Success", description: `${qualifyingLead.name} has been qualified. HOD notified for consultation.` });
//     setIsQualifyOpen(false);
//     setQualifyingLead(null);
//     setQualifyForm(initialQualifyState);
//   };

//   const getReference = (referenceId) => references.find(ref => ref.id === referenceId);

//   return (
//     <div className="space-y-6">
//       <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
//         <div>
//           <h1 className="text-3xl font-bold text-gray-900">Lead Management</h1>
//           <p className="text-gray-600 mt-1">Manage and track potential patients from all sources.</p>
//         </div>
//         <Button onClick={openNewLeadDialog} className="shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-shadow"><UserPlus size={18} className="mr-2" /> Add New Lead</Button>
//       </motion.div>

//       <Card className="medical-card">
//         <CardHeader><CardTitle>Search & Filter</CardTitle></CardHeader>
//         <CardContent>
//           <div className="flex flex-col sm:flex-row gap-4">
//             <div className="flex-1 relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder="Search by name or contact..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" /></div>
//             <div className="w-full sm:w-48">
//               <Select value={statusFilter} onValueChange={setStatusFilter}>
//                 <SelectTrigger><Filter className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
//                 <SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="qualified">Qualified</SelectItem></SelectContent>
//               </Select>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
//         <Card className="medical-card">
//           <CardHeader><CardTitle>Leads ({filteredLeads.length})</CardTitle><CardDescription>All potential patients in the system</CardDescription></CardHeader>
//           <CardContent>
//             <div className="table-responsive-wrapper">
//               <table className="w-full text-sm">
//                 <thead><tr className="border-b"><th className="text-left p-3 font-semibold text-gray-600">Name</th><th className="text-left p-3 font-semibold text-gray-600">Contact</th><th className="text-left p-3 font-semibold text-gray-600">Physio Category</th><th className="text-left p-3 font-semibold text-gray-600">Lead Source</th><th className="text-left p-3 font-semibold text-gray-600">Status</th><th className="text-left p-3 font-semibold text-gray-600">Actions</th></tr></thead>
//                 <tbody>
//                   {filteredLeads.map((lead) => {
//                     const reference = getReference(lead.referenceId);
//                     return (
//                       <tr key={lead.id} className="border-b hover:bg-gray-50/50 transition-colors">
//                         <td className="p-3"><div><p className="font-medium text-gray-800">{lead.name}</p><p className="text-xs text-gray-500">{lead.age} years, {lead.gender}</p></div></td>
//                         <td className="p-3 text-gray-600">{lead.contact}</td>
//                         <td className="p-3"><span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">{lead.physioCategory}</span></td>
//                         <td className="p-3 text-gray-600">{lead.leadCategory === 'reference' && reference ? <div><p className="font-medium">{reference.name}</p><p className="text-xs text-gray-500">({lead.leadCategory})</p></div> : lead.leadCategory}</td>
//                         <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs font-semibold status-${lead.status}`}>{lead.status}</span></td>
//                         <td className="p-3">
//                           <div className="flex items-center gap-2">
//                             {lead.status === 'pending' && (user?.role === 'admin' || user?.role === 'super_admin') && <Button size="sm" onClick={() => openQualifyDialog(lead)} className="flex items-center gap-1"><CheckCircle size={14} /><span>Qualify</span></Button>}
//                             <Button size="sm" variant="outline" onClick={() => handleEditLead(lead)}><Edit size={14} /></Button>
//                             <AlertDialog>
//                               <AlertDialogTrigger asChild><Button size="sm" variant="destructive"><Trash2 size={14} /></Button></AlertDialogTrigger>
//                               <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the lead.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteLead(lead.id)}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
//                             </AlertDialog>
//                           </div>
//                         </td>
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//               </table>
//             </div>
//           </CardContent>
//         </Card>
//       </motion.div>

//       <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
//         <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
//           <DialogHeader><DialogTitle>{editingLead ? 'Edit Lead' : 'Create New Lead'}</DialogTitle></DialogHeader>
//           <div className="flex-1 overflow-y-auto pr-6">
//             <form onSubmit={handleFormSubmit} className="space-y-4">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div className="space-y-2"><Label htmlFor="name">Name</Label><Input id="name" name="name" value={leadForm.name} onChange={handleFormChange} required /></div>
//                 <div className="space-y-2"><Label htmlFor="age">Age</Label><Input id="age" name="age" type="number" value={leadForm.age} onChange={handleFormChange} required /></div>
//               </div>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 {/* <div className="space-y-2"><Label>Gender</Label><Select onValueChange={(v) => handleSelectChange('gender', v)} value={leadForm.gender}><SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger><SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select></div>
//                  */}
//                    {/* <Label htmlFor="leadGenderId">Gender</Label> */}
//                     <div className="space-y-2"><Label>Gender</Label>
//                    <Select
//                    onValueChange={(v) => handleSelectChange((prev) => ({ ...prev, leadGenderId: v }))}
//                    value={leadForm.leadGenderId}
//                  >
//                    <SelectTrigger>
//                      <SelectValue placeholder="Select Gender" />
//                    </SelectTrigger>
//                    <SelectContent>
//                      {gender.map((gen) => (
//                        <SelectItem key={gen.GenderIDPK} value={gen.GenderIDPK}>
//                          {gen.genderName}
//                        </SelectItem>
//                      ))}
//                    </SelectContent>
//                  </Select>
//                  </div>
//                 <div className="space-y-2"><Label htmlFor="contact">Contact</Label><Input id="contact" name="contact" value={leadForm.contact} onChange={handleFormChange} required /></div>
//               </div>
//               <div className="space-y-2"><Label htmlFor="address">Address</Label><Input id="address" name="address" value={leadForm.address} onChange={handleFormChange} required /></div>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 {/* <div className="space-y-2"><Label>Physio Category</Label><Select onValueChange={(v) => handleSelectChange('physioCategory', v)} value={leadForm.physioCategory}><SelectTrigger><SelectValue placeholder="Select physio category" /></SelectTrigger><SelectContent><SelectItem value="sports_injury">Sports Injury</SelectItem><SelectItem value="chronic_pain">Chronic Pain</SelectItem><SelectItem value="post_surgery">Post Surgery</SelectItem><SelectItem value="neurological">Neurological</SelectItem><SelectItem value="orthopedic">Orthopedic</SelectItem></SelectContent></Select></div>
//                  */}
//                  {/* <Label htmlFor="physioCategoryId">physioCategory</Label> */}
//                  <div className="space-y-2"><Label>Physio Category</Label>
//                    <Select
//                    onValueChange={(v) => handleSelectChange((prev) => ({ ...prev, physioCategoryId: v }))}
//                    value={leadForm.physioCategoryId}
//                  >
//                    <SelectTrigger>
//                      <SelectValue placeholder="Select physioCategory" />
//                    </SelectTrigger>
//                    <SelectContent>
//                      {physioCate.map((physio) => (
//                        <SelectItem key={physio.PhysioCateIDPK} value={physio.PhysioCateIDPK}>
//                          {physio.physioCateName}
//                        </SelectItem>
//                      ))}
//                    </SelectContent>
//                  </Select>
//                  </div>
//                 {/* <div className="space-y-2"><Label>Lead Source</Label><Select onValueChange={(v) => handleSelectChange('leadCategory', v)} value={leadForm.leadCategory}><SelectTrigger><SelectValue placeholder="Select lead source" /></SelectTrigger><SelectContent><SelectItem value="social_media">Social Media</SelectItem><SelectItem value="doctor_consultation">Doctor Consultation</SelectItem><SelectItem value="reference">Reference</SelectItem></SelectContent></Select></div>
//                  */}
//                  {/* <Label htmlFor="physioCategoryId">physioCategory</Label> */}
//                  <div className="space-y-2"><Label>Lead Source</Label>
//                    <Select
//                    onValueChange={(v) => handleSelectChange((prev) => ({ ...prev, leadSourceId: v }))}
//                    value={leadForm.leadSourceId}
//                  >
//                    <SelectTrigger>
//                      <SelectValue placeholder="Select Lead Source" />
//                    </SelectTrigger>
//                    <SelectContent>
//                      {leadSource.map((leads) => (
//                        <SelectItem key={leads.LeadIDPK} value={leads.LeadIDPK}>
//                          {leads.leadSourceName}
//                        </SelectItem>
//                      ))}
//                    </SelectContent>
//                  </Select>
//                  </div>
//               </div>
//               {leadForm.leadCategory === 'reference' && (
//                 <div className="space-y-2"><Label>Referred By</Label><Select onValueChange={(v) => handleSelectChange('referenceId', v)} value={leadForm.referenceId}><SelectTrigger><SelectValue placeholder="Select reference" /></SelectTrigger><SelectContent>{references.map((ref) => (<SelectItem key={ref.id} value={ref.id.toString()}>{ref.name} ({ref.commission}%)</SelectItem>))}</SelectContent></Select></div>
//               )}
//               <div className="space-y-2"><Label htmlFor="medicalHistory">Medical History</Label><textarea id="medicalHistory" name="medicalHistory" className="w-full p-2 border rounded-md min-h-[100px]" value={leadForm.medicalHistory} onChange={handleFormChange} placeholder="Enter medical history details..." /></div>
//               <div className="space-y-2">
//                 <Label>Upload Documents</Label>
//                 <Input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
//                 <Button type="button" variant="outline" onClick={() => fileInputRef.current.click()}><Upload size={16} className="mr-2" /> Attach File</Button>
//                 <div className="mt-2 space-y-1">
//                   {leadForm.documents.map((doc, index) => (
//                     <div key={index} className="flex items-center gap-2 text-sm text-gray-600"><Paperclip size={14} /> {doc}</div>
//                   ))}
//                 </div>
//               </div>
//               <DialogFooter className="pt-4"><Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button><Button type="submit">{editingLead ? 'Save Changes' : 'Create Lead'}</Button></DialogFooter>
//             </form>
//           </div>
//         </DialogContent>
//       </Dialog>

//       <Dialog open={isQualifyOpen} onOpenChange={setIsQualifyOpen}>
//         <DialogContent className="max-w-md">
//           <DialogHeader><DialogTitle>Qualify Lead</DialogTitle><DialogDescription>Schedule the initial consultation for {qualifyingLead?.name}.</DialogDescription></DialogHeader>
//           <form onSubmit={handleQualifySubmit} className="space-y-4 pt-4">
//             <div className="space-y-2"><Label>Consultation Date</Label>
//               <Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !qualifyForm.consultationDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{qualifyForm.consultationDate ? format(qualifyForm.consultationDate, "PPP") : <span>Pick a consultation date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={qualifyForm.consultationDate} onSelect={(date) => setQualifyForm(p => ({ ...p, consultationDate: date }))} initialFocus /></PopoverContent></Popover>
//             </div>
//             <DialogFooter><Button type="button" variant="outline" onClick={() => setIsQualifyOpen(false)}>Cancel</Button><Button type="submit">Qualify & Notify HOD</Button></DialogFooter>
//           </form>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// };

// export default LeadManagement;




import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { UserPlus, Search, Filter, Edit, Trash2, Upload, Paperclip } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/components/CustomComponents/apiRequest';

const LeadManagement = () => {
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [leadSource, setLeadSource] = useState([]);
  const [physioCate, setPhysioCate] = useState([]);
  const [gender, setGender] = useState([]);
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);

  const initialFormState = {
    leadName: '',
    leadAge: '',
    leadGenderId: '',
    leadContactNo: '',
    leadAddress: '',
    physioCategoryId: '',
    leadSourceId: '',
    leadMedicalHistory: '',
    //  physioCateName: '',
     genderName: '',
     leadSourceName:'',
    leadDocuments: [],
    leadId:'',
    isQualified: false
  };

  const [leadForm, setLeadForm] = useState(initialFormState);

  //  Load dropdown data
  useEffect(() => {
    getLeadSource();
    getPhysio();
    getGender();
    getLead();
  }, []);

  const getLeadSource = async () => {
    try {
      const res = await apiRequest('LeadSource/getAllLeadSource', { method: 'POST', body: JSON.stringify({}) });
      setLeadSource(res || []);
    } catch (error) {
      console.error('Error loading LeadSource:', error);
    }
  };

  const getPhysio = async () => {
    try {
      const res = await apiRequest('PhysioCategory/getAllPhysioCategory', { method: 'POST', body: JSON.stringify({}) });
      setPhysioCate(res || []);
    } catch (error) {
      console.error('Error loading Physio:', error);
    }
  };

  const getGender = async () => {
    try {
      const res = await apiRequest('Gender/getAllGender', { method: 'POST', body: JSON.stringify({}) });
      setGender(res || []);
    } catch (error) {
      console.error('Error loading Gender:', error);
    }
  };

  // ✅ Get all leads
  const getLead = async () => {
    try {
      const response = await apiRequest('Lead/getAllLead', { method: 'POST', body: JSON.stringify({}) });
      setLeads(response.leads || []);
      setFilteredLeads(response.leads || []);
    } catch (error) {
      console.error('Error loading leads:', error);
    }
  };

  // ✅ Create Lead
  const createLead = async (data) => {
    try {
      const response = await apiRequest('Lead/createLead', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      toast({ title: 'Success', description: 'Lead created successfully.' });
      getLead();
      setIsFormOpen(false);
      return response;
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // ✅ Update Lead
  const updateLead = async (data) => {
    try {
      const response = await apiRequest('Lead/updateLead', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      toast({ title: 'Updated', description: 'Lead updated successfully.' });
      getLead();
      setIsFormOpen(false);
      return response;
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // ✅ Delete Lead
  const deleteLead = async (id) => {
    try {
      await apiRequest('Lead/deleteLead', {
        method: 'POST',
        body: JSON.stringify({ _id: id }),
      });
      toast({ title: 'Deleted', description: 'Lead has been removed.', variant: 'destructive' });
      getLead();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // ✅ Handle Search and Filter
  useEffect(() => {
    let filtered = leads;
    if (searchTerm) {
      filtered = filtered.filter(
        (lead) =>
          lead.leadName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.leadContactNo?.includes(searchTerm)
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter((lead) => lead.isQualified?.toString() === (statusFilter === 'qualified').toString());
    }
    setFilteredLeads(filtered);
  }, [searchTerm, statusFilter, leads]);

  // ✅ Form Handlers
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setLeadForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setLeadForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLeadForm((prev) => ({
        ...prev,
        leadDocuments: [...prev.leadDocuments, file.name],
      }));
      toast({ title: 'File Added', description: `${file.name} has been added.` });
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (editingLead) {
      updateLead(leadForm);
    } else {
      createLead(leadForm);
    }
  };

  // ✅ Edit
  const handleEdit = (lead) => {
    setEditingLead(true);
    setLeadForm({
      leadName: lead.leadName || '',
      leadAge: lead.leadAge || '',
      leadGenderId: lead?.leadGenderId?._id || '',
      leadContactNo: lead.leadContactNo || '',
      leadAddress: lead.leadAddress || '',
      physioCategoryId: lead?.physioCategoryId?._id|| '',
      leadSourceId: lead?.leadSourceId?._id || '',
      leadMedicalHistory: lead.leadMedicalHistory || '',
      leadId:lead._id || '',
      physioCateName:lead?.physioCategoryId?.physioCateName || '',
      genderName:lead?.leadGenderId?.genderName || '',
      leadSourceName: lead?.leadSourceId?.leadSourceName || '',
      leadDocuments: lead.leadDocuments || [],
    });
    setIsFormOpen(true);
  };

  const openNewLeadDialog = () => {
    setEditingLead(null);
    setLeadForm(initialFormState);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lead Management</h1>
          <p className="text-gray-600 mt-1">Manage and track potential patients from all sources.</p>
        </div>
        <Button onClick={openNewLeadDialog} className="shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-shadow">
          <UserPlus size={18} className="mr-2" /> Add New Lead
        </Button>
      </motion.div>

      {/* Search & Filter */}
      <Card>
        <CardHeader><CardTitle>Search & Filter</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search by name or contact..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Filter by Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lead Table */}
      <Card>
        <CardHeader><CardTitle>Leads ({filteredLeads.length})</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Contact</th>
                <th className="p-3 text-left">Physio Category</th>
                <th className="p-3 text-left">Lead Source</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <tr key={lead._id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{lead.leadName}</td>
                  <td className="p-3">{lead.leadContactNo}</td>
                  <td className="p-3">{lead?.physioCategoryId?.physioCateName}</td>
                  <td className="p-3">{lead?.leadSourceId?.leadSourceName}</td>
                  <td className="p-3">{lead.isQualified ? 'Qualified' : 'Pending'}</td>
                  <td className="p-3 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(lead)}>
                      <Edit size={14} />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive"><Trash2 size={14} /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the lead.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteLead(lead._id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Create / Edit Lead Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingLead ? 'Edit Lead' : 'Create Lead'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Name</Label><Input name="leadName" value={leadForm.leadName} onChange={handleFormChange} required /></div>
              <div><Label>Age</Label><Input name="leadAge" value={leadForm.leadAge} onChange={handleFormChange} required /></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Gender</Label>
                <Select value={leadForm.leadGenderId} onValueChange={(v) => handleSelectChange('leadGenderId', v)}>
                  <SelectTrigger><SelectValue placeholder="Select Gender" /></SelectTrigger>
                  <SelectContent>
                    {gender.map((g) => (
                      <SelectItem key={g.GenderIDPK} value={g.GenderIDPK}>{g.genderName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Contact</Label><Input name="leadContactNo" value={leadForm.leadContactNo} onChange={handleFormChange} required /></div>
            </div>

            <div><Label>Address</Label><Input name="leadAddress" value={leadForm.leadAddress} onChange={handleFormChange} /></div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Physio Category</Label>
                <Select value={leadForm.physioCategoryId} onValueChange={(v) => handleSelectChange('physioCategoryId', v)}>
                  <SelectTrigger><SelectValue placeholder="Select Physio Category" /></SelectTrigger>
                  <SelectContent>
                    {physioCate.map((physio) => (
                      <SelectItem key={physio.PhysioCateIDPK} value={physio.PhysioCateIDPK}>{physio.physioCateName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Lead Source</Label>
                <Select value={leadForm.leadSourceId} onValueChange={(v) => handleSelectChange('leadSourceId', v)}>
                  <SelectTrigger><SelectValue placeholder="Select Lead Source" /></SelectTrigger>
                  <SelectContent>
                    {leadSource.map((leadS) => (
                      <SelectItem key={leadS.LeadIDPK} value={leadS.LeadIDPK}>{leadS.leadSourceName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div><Label>Medical History</Label><textarea name="leadMedicalHistory" value={leadForm.leadMedicalHistory} onChange={handleFormChange} className="w-full border p-2 rounded-md" /></div>

            <div>
              <Label>Upload Documents</Label>
              <Input type="file" ref={fileInputRef} onChange={handleFileUpload} />
              <div className="mt-2 text-sm text-gray-600 flex flex-col gap-1">
                {leadForm.leadDocuments.map((doc, i) => (
                  <div key={i} className="flex items-center gap-2"><Paperclip size={14} /> {doc}</div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
              <Button type="submit">{editingLead ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeadManagement;
