
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { UserPlus, Search, Filter, Edit, Trash2, Upload, Paperclip, Check,User ,CheckCircle} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '@/components/CustomComponents/apiRequest';

const LeadManagement = () => {
  const { navigate } = useNavigate()
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
  const [reference, setReference] = useState([])
  const [ConsultationDate, setConsultationDate] = useState("")
  console.log(ConsultationDate, "ConsultationDate")
  const [open, setOpen] = useState(false)
  const [LeadQualify, setLeadQualify] = useState({})

  const initialFormState = {
    // _id:'',
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
    leadSourceName: '',
    leadDocuments: [],
    leadId: '',
    ReferenceId: '',
    sourceName: '',
    isQualified: true,
    LeadStatusId: '',
    leadStatusName: ''
  };
  const [leadStatus, setLeadStatus] = useState([])
  const [leadForm, setLeadForm] = useState(initialFormState);
  console.log(leadForm.LeadStatusId, "leadForm LeadStatusId")

  //  Load dropdown data
  useEffect(() => {
    getLeadSource();
    getPhysio();
    getGender();
    getLead();
    getReference()
    getLeadStatus()
  }, []);


  const { getPermissionsByPath } = useAuth();
  const [Permissions, setPermissions] = useState({ isAdd: false, isView: false, isEdit: false, isDelete: false })
  // console.log(Permissions,"Permissions")
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

  useEffect(() => {
    if (Permissions.isView) {
      getLead()
    }
  }, [Permissions])

  // api for leadStatus 

  const getLeadStatus = async () => {
    try {
      const res = await apiRequest('LeadStatus/getAllLeadStatus',
        {
          method: 'POST',
          body: JSON.stringify({})
        });
      setLeadStatus(res)

    } catch (error) {
      console.error('Error loading leadStatus:', error);

    }
  }




  //api for Reference 

  const getReference = async () => {
    try {
      const res = await apiRequest('References/getALLReferences',
        {
          method: 'POST',
          body: JSON.stringify({})
        });
      setReference(res);

    } catch (error) {
      console.error('Error loading Reference:', error);

    }
  }

  const QualifyLead = async (lead) => {
    try {
      const payload = lead
      payload.ConsultationDate = ConsultationDate
      payload.fromEmployeeId = user._id

      const res = await apiRequest('Lead/QualifyLead',
        {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      console.log(res, "res")
      if (res) {
        getLead()
        toast({ title: 'Success', description: 'Lead qualified successfully.' });
      } else {
        toast({ title: 'Failed', description: 'Lead qualify failed.' });
      }

    } catch (error) {
      console.error('Error loading Reference:', error);

    }
  }

  const getLeadSource = async () => {
    try {
      const res = await apiRequest('LeadSource/getAllLeadSource', {
        method: 'POST',
        body: JSON.stringify({})
      });
      setLeadSource(res || []);
    } catch (error) {
      console.error('Error loading LeadSource:', error);
    }
  };

  const getPhysio = async () => {
    try {
      const res = await apiRequest('PhysioCategory/getAllPhysioCategory', {
        method: 'POST', body: JSON.stringify({})
      }
      );
      setPhysioCate(res || []);
    } catch (error) {
      console.error('Error loading Physio:', error);
    }
  };

  const getGender = async () => {
    try {
      const res = await apiRequest('Gender/getAllGender', {
        method: 'POST',
        body: JSON.stringify({})
      }
      );
      setGender(res || []);
    } catch (error) {
      console.error('Error loading Gender:', error);
    }
  };

  //  Get all leads
  const getLead = async () => {
    try {
      const response = await apiRequest('Lead/getAllLead', {
        method: 'POST',
        body: JSON.stringify({})
      });
      setLeads(response.leads || []);
      setFilteredLeads(response.leads || []);
    } catch (error) {
      console.error('Error loading leads:', error);
    }
  };
  

  //  Create Lead
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

  //  Update Lead
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

  //  Delete Lead
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

  //  Handle Search and Filter
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
      filtered = filtered.filter((lead) => lead.isQualified?.toString() === (statusFilter === 'Qualified').toString());
    }
    setFilteredLeads(filtered);
  }, [searchTerm, statusFilter, leads]);

  //  Form Handlers
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

  //  Edit
  const handleEdit = (lead) => {
    setEditingLead(true);
    setLeadForm({
      // _id:lead._id?lead._id:'',
      leadName: lead.leadName || '',
      leadAge: lead.leadAge || '',
      leadGenderId: lead?.leadGenderId?._id || '',
      leadContactNo: lead.leadContactNo || '',
      leadAddress: lead.leadAddress || '',
      physioCategoryId: lead?.physioCategoryId?._id || '',
      leadSourceId: lead.leadSourceId ? lead.leadSourceId?._id : '',
      leadMedicalHistory: lead.leadMedicalHistory || '',
      leadId: lead._id || '',
      physioCateName: lead?.physioCategoryId?.physioCateName || '',
      genderName: lead?.leadGenderId?.genderName || '',
      leadSourceName: lead.leadSourceId.leadSourceName ? lead.leadSourceId.leadSourceName : null,
      ReferenceId: lead.ReferenceId ? lead.ReferenceId._id : '',
      sourceName: lead.ReferenceId ? lead.ReferenceId.sourceName : null,
      LeadStatusId: lead.LeadStatusId ? lead.LeadStatusId._id : null,
      leadStatusName: lead.LeadStatusId ? lead.LeadStatusId.leadSourceName : null,
      leadDocuments: lead.leadDocuments || [],
    });
    setIsFormOpen(true);
  };

  const openNewLeadDialog = () => {
    setEditingLead(null);
    setLeadForm(initialFormState);
    setIsFormOpen(true);
    // setQualified(true)

  };

  // const openQualifiedDialog = () =>{
  //   setQualified(true)
  // }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4 w-full "
      >
        <div>
          <h1 className="md:text-3xl text-xl font-bold text-gray-900">Lead Management</h1>
          <p className="text-gray-600 mt-1 text-sm md:text-xs">Manage and track potential patients from all sources.</p>
        </div>
        {
          Permissions.isAdd && <Button onClick={openNewLeadDialog} className="shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-shadow">
            <UserPlus size={18} className="mr-2 " /> Add New Lead
          </Button>
        }

      </motion.div>

      {/* Search & Filter */}
      <Card className='max-w-xs md:max-w-none'>
        <CardHeader><CardTitle className='text-md font-bold md:text-2xl'>Search & Filter</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 ">
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
      <Card className='hidden md:block'>
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
                  <td className="p-3"><span className='text-xs font-extralight border-2 border-blue-200 p-2 bg-blue-200 text-blue-700 rounded-2xl'>{lead.physioCategoryId.physioCateName}</span></td>
                  <td className="p-3">{lead.leadSourceId.leadSourceName}</td>
                  <td><span style={{ backgroundColor: lead.LeadStatusId.leadStatusColor ? lead.LeadStatusId.leadStatusColor : 'white' }} className='text-xs font-extralight border-2  p-2 rounded-2xl'> {lead.LeadStatusId.leadStatusName}</span></td>
                  {/* <td><span style={{backgroundColor:lead.LeadStatusId.leadStatusColor ? lead.LeadStatusId.leadStatusColor : 'white' ,color:lead.LeadStatusId.leadStatusTextColor}} className='text-xs font-extralight border-2  p-2 rounded-2xl'> {lead.LeadStatusId.leadStatusName}</span></td> */}
                  <td className="p-3 flex gap-2">

                    {/* <Button onClick={openNewLeadDialog}>Qualified</Button> */}
                    {lead.LeadStatusId.leadStatusName !== 'Qualified' &&
                      <>{Permissions.isEdit && <Button variant="default" onClick={() => { setLeadQualify(lead); setOpen(true) }} className="bg-blue-600 hover:bg-blue-700"  >
                        Qualify
                      </Button>}</>}
                    <Dialog open={open} onOpenChange={setOpen} >
                      <DialogContent className="max-w-md max-h-[90vh] backdrop-blur-lg">
                        <DialogHeader>
                          <DialogTitle>Qualify Lead</DialogTitle>
                          <td>Schedule the initial consultation for </td>

                        </DialogHeader>
                        <div className="space-y-3">
                          <Label>Consultation Date</Label>
                          <Input type="date" value={ConsultationDate} onChange={(e) => setConsultationDate(e.target.value)} min ={new Date().toISOString().split('T')[0]} />
                        </div>
                        <DialogFooter>
                          <Button onClick={() => setOpen(false)} variant="outline">
                            Cancel
                          </Button>

                          <Button onClick={() => { QualifyLead(LeadQualify); setOpen(false) }}  >
                            Qualify & Notify HOD
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>


                    {lead.LeadStatusId.leadStatusName !== 'Qualified' && (Permissions.isEdit && <Button size="sm" variant="outline" onClick={() => handleEdit(lead)}>
                      <Edit size={14} />
                    </Button>)}
                    {lead.LeadStatusId.leadStatusName !== 'Qualified' && (Permissions.isDelete && <AlertDialog>
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
                    </AlertDialog>)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* //Lead Card for Mobile view  */}
      <Card className="md:hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">
            Leads ({filteredLeads.length})
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="grid gap-3 ">
            {filteredLeads.map((lead) => (
              <div
                key={lead._id}
                className="border rounded-lg p-3 shadow-sm bg-white flex flex-col gap-3"
              >
                {/* Left Section */}
                <div className="space-y-1.5">
                  <div className='flex space-x-4 mb-3  justify-center'>
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center"><User className="text-blue-600" size={25} /></div>
                   <div className='space-y-1'>
                    <p className="text-xs text-gray-600">
                    <span className="font-normal text-gray-500 text-sm">{lead.leadName}</span>
                  </p>

                  <p className="text-xs text-gray-600">
                    <span className="font-normal text-gray-500 text-sm">   {lead.leadContactNo}</span>
                  </p>
                   </div>

                  </div>

                  <p className="text-xs text-gray-600 flex justify-center items-center me-4 gap-2">
                    <span className="font-semibold text-gray-900 text-sm">Status:</span>
                    <span
                      className="text-[10px] px-2 py-[2px] rounded-md inline-block"
                      style={{
                        backgroundColor: lead.LeadStatusId.leadStatusColor || "#e5e7eb",
                      }}
                    >
                      {lead.LeadStatusId.leadStatusName}
                    </span>
                  </p>
                </div>

                {/* Right Section – Buttons */}
                <div className="flex items-center gap-2 me-4 justify-center">
                  {/* Qualify */}
                  {lead.LeadStatusId.leadStatusName !== "Qualified" &&
                    Permissions.isEdit && (
                      <Button
                        size="icon"
                        variant="default"
                        onClick={() => {
                          setLeadQualify(lead);
                          setOpen(true);
                        }}
                        className="h-8 w-8 bg-blue-600 hover:bg-blue-700"
                      >
                        <CheckCircle size={14} />
                      </Button>
                    )}

                  {/* Edit */}
                  {lead.LeadStatusId.leadStatusName !== "Qualified" &&
                    Permissions.isEdit && (
                      <Button size="icon" variant="outline" className="h-8 w-8">
                        <Edit size={14} onClick={() => handleEdit(lead)} />
                      </Button>
                    )}

                  {/* Delete */}
                  {lead.LeadStatusId.leadStatusName !== "Qualified" &&
                    Permissions.isDelete && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="destructive" className="h-8 w-8">
                            <Trash2 size={14} />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the lead.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteLead(lead._id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                </div>
              </div>
            ))}
          </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Address</Label><Input name="leadAddress" value={leadForm.leadAddress} onChange={handleFormChange} />
              </div>
              <div>
                <Label>Lead Status</Label>
                <Select value={leadForm.LeadStatusId} onValueChange={(v) => handleSelectChange('LeadStatusId', v)}>
                  <SelectTrigger><SelectValue placeholder="Select Lead Status" /></SelectTrigger>
                  <SelectContent>
                    {leadStatus.map((leadst) => (
                      <SelectItem key={leadst._id} value={leadst._id}>{leadst.leadStatusName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

              </div>
            </div>

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
                {/* <Select value={leadForm.leadSourceId} onValueChange={(v) => handleSelectChange('leadSourceId', v)}>
                  <SelectTrigger><SelectValue placeholder="Select Lead Source" /></SelectTrigger>
                  <SelectContent>
                    {leadSource.map((leadS) => (
                      <SelectItem key={leadS.LeadIDPK} value={leadS.LeadIDPK}>{leadS.leadSourceName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select> */}

                <Select
                  value={JSON.stringify({ LeadIDPK: leadForm.leadSourceId, name: leadForm.leadSourceName })}
                  onValueChange={(v) => {
                    const selected = JSON.parse(v);
                    handleSelectChange('leadSourceId', selected.LeadIDPK);
                    handleSelectChange('leadSourceName', selected.name);
                  }}
                >  <SelectTrigger><SelectValue placeholder="Select Lead Source" /></SelectTrigger>
                  <SelectContent>
                    {leadSource.map((leads) => (
                      <SelectItem
                        key={leads.LeadIDPK}
                        value={JSON.stringify({ LeadIDPK: leads.LeadIDPK, name: leads.leadSourceName })}
                      >{leads.leadSourceName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {
                leadForm.leadSourceName === "Reference" ? <div className="space-y-2">
                  <Label>Reference</Label>
                  <Select
                    value={JSON.stringify({ id: leadForm.ReferenceId, name: leadForm.sourceName })}
                    onValueChange={(v) => {
                      const selected = JSON.parse(v);
                      handleSelectChange('ReferenceId', selected.id);
                      handleSelectChange('sourceName', selected.name);
                    }}
                  >  <SelectTrigger><SelectValue placeholder="Select Reference" /></SelectTrigger>
                    <SelectContent>
                      {reference.map((ref) => (
                        <SelectItem
                          key={ref._id}
                          value={JSON.stringify({ id: ref._id, name: ref.sourceName })}
                        >{ref.sourceName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div> : null
              }


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
