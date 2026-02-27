import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  Search,
  FileText,
  Calendar as CalendarIcon,
  User,
  Edit,
  Trash2,
  Upload,
  Paperclip,
  ClipboardList,
  PlusCircle,
  UserPlus,
  History,
  UserCheck,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import PatientDetailsDialog from "@/components/PatientDetailsDialog";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "@/components/CustomComponents/apiRequest";

const Consulation = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [physios, setPhysios] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const fileInputRef = useRef(null);

  const [isAssignPhysioOpen, setIsAssignPhysioOpen] = useState(false);
  const [assigningPatient, setAssigningPatient] = useState(null);
  const initialAssignState = {
    _id: "",
    physioName: "",
    Physiotherapist: "",
    physioId: "",
    sessionStartDate: "",
    consultationNumber: "",
    sessionTime: "",
    totalSessionDays: "",
    InitialShorttermGoal: "",
    goalDuration: "",
    goalDescription: "",
    reviewFrequency: "",
    visitOrder: 1,
    KmsfromHub: "",
    KmsfLPatienttoHub: "",
    kmsFromPrevious: "",
  };
  const [assignForm, setAssignForm] = useState(initialAssignState);
  console.log(assignForm, "assignForm");
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [viewingPatient, setViewingPatient] = useState(null);

  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewingPatient, setReviewingPatient] = useState(null);
  const initialReviewState = { feedback: "", satisfaction: 0 };
  const [reviewForm, setReviewForm] = useState(initialReviewState);

  const [isNewGoalOpen, setIsNewGoalOpen] = useState(false);
  const initialNewGoalState = {
    newShortTermGoal: "",
    newGoalDuration: "",
    nextReviewDate: null,
  };
  const [newGoalForm, setNewGoalForm] = useState(initialNewGoalState);

  // const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  // const [historyPatient, setHistoryPatient] = useState(null);
  // const [patientHistory, setPatientHistory] = useState([]);

  const initialFormState = {
    _id: "",
    patientCode: "",
    patientName: "",
    patientAge: "",
    patientGenderId: "",
    patientNumber: "",
    patientAddress: "",
    category: "",
    MedicalHistoryAndRiskFactor: "",
    documents: [],
    consultationDate: null,
    byStandar: "",
    Relation: "",
    patientAltNum: "",
    patientPinCode: "",
    patientCondition: "",
    Physiotherapist: "",
    reviewDate: null,
    historyOfSurgery: false,
    historyOfSurgeryDetails: "",
    historyOfFall: false,
    historyOfFallDetails: "",
    otherMedCon: "",
    currMed: "",
    typesOfLifeStyle: "",
    smokingOrAlcohol: false,
    dietaryHabits: "",
    Contraindications: "",
    goalDescription: "",
    painLevel: "",
    rangeOfMotion: "",
    muscleStrength: "",
    postureOrGaitAnalysis: "",
    functionalLimitations: "",
    ADLAbility: "",
    shortTermGoals: "",
    longTermGoals: "",
    RecomTherapy: "",
    Frequency: "",
    Duration: "",
    Modalities: false,
    modalityList: [],
    targetedArea: "",
    noOfDays: "",
    hodNotes: "",
    goalLog: [],
    travelDetails: null,
    genderName: "",
    FeesTypeId: "",
    feeAmount: "",
    feesTypeAmount: "",
    ReferenceId: "",
    sourceName: "",
  };
  const [patientForm, setPatientForm] = useState(initialFormState);

  const modalitiesOptions = [
    "TENS",
    "IFT",
    "USD",
    "WAX",
    "ICE",
    "HOT",
    "Weights",
    "Band",
  ];
  const [risk, setRisk] = useState([]); //for dropdown

  const [gender, setGender] = useState([]);
  const [radio, setRadio] = useState([]);
  const [feesType, setFeesType] = useState([]);
  const [reference, setReference] = useState([]);
  // console.log(radio,"radio")
  const { getPermissionsByPath } = useAuth();
  const [Permissions, setPermissions] = useState({
    isAdd: false,
    isView: false,
    isEdit: false,
    isDelete: false,
  });

  //api call  and get all risk Factor

  useEffect(() => {
    getAllRisk();
    getAllpshyio();
    getAllGender();

    getFeesType();
    getReference();
  }, []);

  // console.log(Permissions,"Permissions")
  useEffect(() => {
    getPermissionsByPath(window.location.pathname).then((res) => {
      if (res) {
        setPermissions(res);
      } else {
        navigate("/dashboard");
      }
    });
  }, []);

  useEffect(() => {
    if (Permissions.isView) {
      getAllConsultation();
    }
  }, [Permissions]);

  //api for Reference

  const getReference = async () => {
    try {
      const res = await apiRequest("References/getALLReferences", {
        method: "POST",
        body: JSON.stringify({}),
      });
      setReference(res);
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  };

  //api for FeesType

  const getFeesType = async () => {
    try {
      const res = await apiRequest("FeesType/getAllFeesType", {
        method: "POST",
        body: JSON.stringify({}),
      });
      setFeesType(res);
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  };

  //api for getall pshyio
  const getAllpshyio = async () => {
    try {
      const res = await apiRequest("Physio/getAllPhysio", {
        method: "POST",
        body: JSON.stringify({}),
      });
      setPhysios(res.physios);
      // setAssignForm(res.physio)
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  };

  const getAllRisk = async () => {
    try {
      const res = await apiRequest("RiskFactor/getAllRiskFactor", {
        method: "POST",
        body: JSON.stringify({}),
      });
      setRisk(res);
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  };

  //Gender api for drop down
  const getAllGender = async () => {
    try {
      const res = await apiRequest("Gender/getAllGender", {
        method: "POST",
        body: JSON.stringify({}),
      });
      setGender(res);
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  };

  // const getAllPatient = async () => {
  //   try {
  //     const res = await apiRequest("Consultation/getAllConsultation", {
  //       method: 'POST',
  //       body: JSON.stringify({}),
  //     })

  //     setFilteredPatients(res);
  //     setPatients(res);
  //   } catch (error) {
  //     console.error('Error:', error);
  //     throw error;
  //   }
  // // }

  const getAllConsultation = async () => {
    try {
      const res = await apiRequest("Consultation/getAllConsultation", {
        method: "POST",
        body: JSON.stringify({}),
      });
      //     const consultantPatients = res.filter((item) => item.status !== "Lead");

      const unassignedPatients = (res || []).filter(
        (patient) => !patient.physioId,
      );

      setFilteredPatients(unassignedPatients);
      setPatients(unassignedPatients);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  //api call and delete Patients
  const deletePatient = async (id) => {
    if (user?.role === "Admin" || user?.role === "SuperAdmin") {
      try {
        const response = await apiRequest("Consultation/deleteConsultation", {
          method: "POST",
          body: JSON.stringify({ _id: id }),
        });
        toast({
          title: "Deleted",
          description: "Patients has been removed.",
          variant: "destructive",
        });
        getAllConsultation();

        // setFilteredPatients(response);
        // setPhysios(response);
        // setSessions(response);

        return response;
      } catch (error) {
        console.error("Error:", error);
        throw error;
      }
    }
  };

  //api for update Patients

  const updatePatient = async (data) => {
    try {
      const response = await apiRequest("Consultation/updateConsultation", {
        method: "POST",
        body: JSON.stringify(data),
      });
      toast({ title: "Success", description: "Patient updated successfully." });
      getAllConsultation();
      setIsFormOpen(false);
      // setFilteredPatients(response);
      // setPhysios(response);
      // setSessions(response);
      return response;
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  };

  //api for create patients

  const createConsultation = async (data) => {
    try {
      const response = await apiRequest("Consultation/createConsultation", {
        method: "POST",
        body: JSON.stringify(data),
      });
      toast({ title: "Success", description: "Patient Create successfully." });
      getAllConsultation();
      setIsFormOpen(false);
      return response;
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  };

  // useEffect(() => {
  //   AssignPhysio()
  // }, [])
  //api for Assign physio

  // const AssignPhysio = async (data) => {
  //   try {
  //     const response = await apiRequest("Consultation/AssignPhysio", {
  //       method: 'POST',
  //       body: JSON.stringify(data),
  //     });
  //     toast({ title: "Success", description: "Assign updated successfully." });
  //     getAllPatient()
  //     setIsAssignPhysioOpen(false)

  //     return response;
  //   } catch (error) {

  //     console.error('Error:', error);
  //     throw error;
  //   }
  // }

  const AssignPhysio = async (data) => {
    console.log(data, "data");

    try {
      const response = await apiRequest("Consultation/AssignPhysio", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (!response.success) {
        toast({
          title: "Error",
          description: response.message || "Failed to assign physio.",
          variant: "destructive",
        });
        return response;
      } else {
        toast({
          title: "Success",
          description: "Physio assigned and sessions created.",
        });
      }
      setIsAssignPhysioOpen(false);

      await getAllConsultation();

      // Wait for Patients list to refresh
      // await getAllConsultation();

      // Navigate to Sessions page with sessions data
      if (response.sessions && response.sessions.length > 0) {
        navigate("/sessions", {
          state: { refresh: true, sessions: response.sessions },
        });
      }

      return response;
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    getAllConsultation();
  }, []);

  // useEffect(() => {
  //   Promise.all([
  //     fetch('/mockdata/patients.json').then(res => res.json()),
  //     fetch('/mockdata/physios.json').then(res => res.json()),
  //     fetch('/mockdata/sessions.json').then(res => res.json())
  //   ]).then(([patientsData, physiosData, sessionsData]) => {
  //     setPatients(patientsData);
  //     setFilteredPatients(patientsData);
  //     setPhysios(physiosData);
  //     setSessions(sessionsData);
  //   }).catch(err => console.error('Error loading data:', err));
  // }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = patients.filter(
        (patient) =>
          patient.patientName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          // patient.patientNumber.includes(searchTerm) ||
          patient.patientCode?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setFilteredPatients(filtered);
    } else {
      setFilteredPatients(patients);
    }
  }, [patients, searchTerm]);
  // const generatePatientId = () => {
  //   const ids = patients
  //     .map((p) => parseInt(p.patientCode?.replace("CON", ""), 10))
  //     .filter((num) => !isNaN(num));

  //   const lastId = ids.length > 0 ? Math.max(...ids) : 0;
  //   const newId = lastId + 1;

  //   return `CON${String(newId).padStart(6, "0")}`;
  // };
  const generatePatientId = () => {
    const hnpIds = patients
      .map((p) => {
        if (!p.patientCode) return null;
        if (!p.patientCode.startsWith("HNP")) return null;

        const num = parseInt(p.patientCode.replace("HNP", ""), 10);
        return isNaN(num) ? null : num;
      })
      .filter((num) => num !== null);

    const lastId = hnpIds.length > 0 ? Math.max(...hnpIds) : 0;
    const newId = lastId + 1;

    return `HNP${String(newId).padStart(4, "0")}`;
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setPatientForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setPatientForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRadioChange = (name, value) => {
    setPatientForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRadio = (name, value, id) => {
    // setRadio(prev => ({ ...prev, [name]: value }));
    setRadio((prev) => [...prev, { RiskFactorID: id, isExist: value }]);
    setPatientForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name, date) => {
    setPatientForm((prev) => ({ ...prev, [name]: date }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPatientForm((prev) => ({
        ...prev,
        documents: [...prev.documents, file.name],
      }));
      toast({
        title: "File Added",
        description: `${file.name} has been staged for upload.`,
      });
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (editingPatient) {
      // setPatients(prev => prev.map(p => p.id === editingPatient.id ? { ...p, ...patientForm } : p));
      updatePatient({ ...patientForm, MedicalHistoryAndRiskFactor: radio });
      toast({ title: "Success", description: "Patient details updated." });
    } else {
      // const newPatient = { id: Date.now(), ...patientForm, patientId: generatePatientId(), registeredAt: new Date().toISOString().split('T')[0] };
      // setPatients(prev => [newPatient, ...prev]);
      createConsultation({
        ...patientForm,
        MedicalHistoryAndRiskFactor: radio,
      });
      toast({ title: "Success", description: "New patient created." });
    }
    setIsFormOpen(false);
    setEditingPatient(null);
    setPatientForm(initialFormState);
  };

  const handleEditPatient = (patient) => {
    if (
      user?.role === "HOD" ||
      user?.role === "Admin" ||
      user?.role === "SuperAdmin"
    ) {
      setEditingPatient(true);
      const formData = {
        _id: patient._id ? patient._id : null,
        patientCode: patient.patientCode ? patient.patientCode : null,
        patientName: patient.patientName ? patient.patientName : null,
        patientAge: patient.patientAge ? patient.patientAge : null,
        patientGenderId: patient.patientGenderId._id
          ? patient.patientGenderId._id
          : null,
        patientNumber: patient.patientNumber ? patient.patientNumber : null,
        patientAddress: patient.patientAddress ? patient.patientAddress : null,
        // category: patient.category ? patient.category : null,
        MedicalHistoryAndRiskFactor: patient.MedicalHistoryAndRiskFactor
          ? patient.MedicalHistoryAndRiskFactor
          : null,
        documents: patient.documents ? patient.documents : [],
        consultationDate: patient.consultationDate
          ? new Date(patient.consultationDate)
          : "",
        byStandar: patient.byStandar ? patient.byStandar : null,
        Relation: patient.Relation ? patient.Relation : null,
        patientAltNum: patient.patientAltNum ? patient.patientAltNum : null,
        patientPinCode: patient.patientPinCode ? patient.patientPinCode : null,
        patientCondition: patient.patientCondition
          ? patient.patientCondition
          : null,
        Physiotherapist: patient.Physiotherapist
          ? patient.Physiotherapist
          : null,
        reviewDate: patient.reviewDate ? new Date(patient.reviewDate) : "",
        historyOfSurgery: patient.historyOfSurgery
          ? patient.historyOfSurgery
          : null,
        historyOfSurgeryDetails: patient.historyOfSurgeryDetails
          ? patient.historyOfSurgeryDetails
          : null,
        historyOfFall: patient.historyOfFall ? patient.historyOfFall : null,
        historyOfFallDetails: patient.historyOfFallDetails
          ? patient.historyOfFallDetails
          : null,
        otherMedCon: patient.otherMedCon ? patient.otherMedCon : null,
        currMed: patient.currMed ? patient.currMed : null,
        typesOfLifeStyle: patient.typesOfLifeStyle
          ? patient.typesOfLifeStyle
          : null,
        smokingOrAlcohol: patient.smokingOrAlcohol
          ? patient.smokingOrAlcohol
          : false,
        dietaryHabits: patient.dietaryHabits ? patient.dietaryHabits : null,
        Contraindications: patient.Contraindications
          ? patient.Contraindications
          : null,
        goalDescription: patient.goalDescription
          ? patient.goalDescription
          : null,
        painLevel: patient.painLevel ? patient.painLevel : null,
        rangeOfMotion: patient.rangeOfMotion ? patient.rangeOfMotion : null,
        muscleStrength: patient.muscleStrength ? patient.muscleStrength : null,
        postureOrGaitAnalysis: patient.postureOrGaitAnalysis
          ? patient.postureOrGaitAnalysis
          : null,
        functionalLimitations: patient.functionalLimitations
          ? patient.functionalLimitations
          : null,
        ADLAbility: patient.ADLAbility ? patient.ADLAbility : null,
        shortTermGoals: patient.shortTermGoals ? patient.shortTermGoals : null,
        longTermGoals: patient.longTermGoals ? patient.longTermGoals : null,
        RecomTherapy: patient.RecomTherapy ? patient.RecomTherapy : null,
        Frequency: patient.Frequency ? patient.Frequency : null,
        Duration: patient.Duration ? patient.Duration : null,
        Modalities: patient.Modalities ? patient.Modalities : false,
        modalityList: patient.modalityList ? patient.modalityList : [],
        targetedArea: patient.targetedArea ? patient.targetedArea : null,
        noOfDays: patient.noOfDays ? patient.noOfDays : null,
        hodNotes: patient.hodNotes ? patient.hodNotes : null,
        goalLog: patient.goalLog ? patient.goalLog : [],
        travelDetails: patient.travelDetails ? patient.travelDetails : null,
        genderName: patient.patientGenderId
          ? patient.patientGenderId.genderName
          : null,
        FeesTypeId: patient.FeesTypeId ? patient.FeesTypeId._id : null,
        feesTypeName: patient.FeesTypeId
          ? patient.FeesTypeId.feesTypeName
          : null,
        feeAmount: patient.feeAmount ? patient.feeAmount : null,
        ReferenceId: patient.ReferenceId ? patient.ReferenceId._id : null,
        sourceName: patient.ReferenceId ? patient.ReferenceId.sourceName : null,
      };
      if (patient.consultationDate)
        formData.consultationDate = new Date(patient.consultationDate);
      if (patient.reviewDate)
        formData.reviewDate = new Date(patient.reviewDate);
      let radio = [];
      const RiskFactor = patient.MedicalHistoryAndRiskFactor.map((val) => {
        if (val.isExist) {
          radio.push({
            RiskFactorID: val.RiskFactorID._id,
            isExist: val.isExist,
          });
        }
        return { [val.RiskFactorID.RiskFactorName]: val.isExist.toString() };
      });
      setRadio(radio);
      if (RiskFactor.length > 0) {
        RiskFactor.map(
          (val) =>
            (formData[Object.keys(val)[0].toLowerCase()] =
              val[Object.keys(val)[0]] == "true"),
        );
      }
      setPatientForm(formData);
      setIsFormOpen(true);
    } else {
      toast({
        title: "Access Denied",
        description: "You do not have permission to edit patient details.",
        variant: "destructive",
      });
    }
  };

  const handleNewPatient = () => {
    setEditingPatient(null);
    setPatientForm({
      ...initialFormState,
      patientCode: generatePatientId(),
    });
    setIsFormOpen(true);
  };

  const handleDeletePatient = (id) => {
    setPatients((prev) => prev.filter((p) => p.id !== id));
    deletePatient(id);

    toast({
      title: "Deleted",
      description: "Patient has been removed.",
      variant: "destructive",
    });
  };

  const handleViewConsultation = (patient) => {
    setViewingPatient(patient);
    setIsDetailsOpen(true);
  };

  const handleUpdateFeedback = () => {
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === reviewingPatient.id) {
          const newGoalLog = [...(p.goalLog || [])];
          const lastLogIndex = newGoalLog.length - 1;

          if (
            lastLogIndex >= 0 &&
            newGoalLog[lastLogIndex].goal === p.shortTermGoals
          ) {
            newGoalLog[lastLogIndex] = {
              ...newGoalLog[lastLogIndex],
              feedback: reviewForm.feedback,
              satisfaction: reviewForm.satisfaction,
              status: "Feedback Updated",
            };
          } else {
            newGoalLog.push({
              goal: p.shortTermGoals || "Initial Goal",
              date: new Date().toISOString().split("T")[0],
              status: "Feedback Updated",
              feedback: reviewForm.feedback,
              satisfaction: reviewForm.satisfaction,
            });
          }
          return { ...p, goalLog: newGoalLog };
        }
        return p;
      }),
    );
    toast({
      title: "Feedback Updated",
      description: `Feedback for ${reviewingPatient.name} has been saved.`,
    });
    setIsReviewOpen(false);
    setReviewForm(initialReviewState);
  };

  const handleLogAndOpenNewGoal = () => {
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === reviewingPatient.id) {
          const newGoalLog = [...(p.goalLog || [])];
          if (p.shortTermGoals) {
            newGoalLog.push({
              goal: p.shortTermGoals,
              date: new Date().toISOString().split("T")[0],
              status: "Reviewed & Completed",
              feedback: reviewForm.feedback,
              satisfaction: reviewForm.satisfaction,
            });
          }
          return { ...p, goalLog: newGoalLog };
        }
        return p;
      }),
    );
    toast({
      title: "Goal Logged",
      description: "Current goal has been logged. Now set the next goal.",
    });
    setIsReviewOpen(false);
    setIsNewGoalOpen(true);
  };

  const handleNewGoalSubmit = (e) => {
    e.preventDefault();
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === reviewingPatient.id) {
          return {
            ...p,
            shortTermGoals: newGoalForm.newShortTermGoal,
            goalDuration: newGoalForm.newGoalDuration,
            reviewDate: newGoalForm.nextReviewDate,
          };
        }
        return p;
      }),
    );
    toast({
      title: "New Goal Set!",
      description: `A new goal has been set for ${reviewingPatient.name}.`,
    });
    setIsNewGoalOpen(false);
    setNewGoalForm(initialNewGoalState);
    setReviewForm(initialReviewState);
  };

  const handleScheduleReview = (patient) => {
    if (
      user?.role === "HOD" ||
      user?.role === "Admin" ||
      user?.role === "SuperAdmin"
    ) {
      setReviewingPatient(patient);
      setIsReviewOpen(true);
    } else {
      toast({
        title: "Access Denied",
        description: "You do not have permission to conduct reviews.",
        variant: "destructive",
      });
    }
  };

  const openLead = async (patient) => {
    if (
      user?.role === "HOD" ||
      user?.role === "Admin" ||
      user?.role === "SuperAdmin"
    ) {
      try {
        // Call backend to revert the patient
        const response = await apiRequest("Consultation/revertConsultation", {
          method: "POST",
          body: JSON.stringify({ id: patient._id, status: "Pending" }), // optional: send "Pending" status
        });

        const data = response; // API returns updated patient

        // Remove from Consultant page
        setPatients((prev) => prev.filter((p) => p._id !== patient._id));
        setFilteredPatients((prev) =>
          prev.filter((p) => p._id !== patient._id),
        );

        toast({
          title: "Reverted",
          description: `${
            patient.patientName || "Patient"
          } has been reverted to lead.`,
          variant: "default",
        });

        // Navigate to Lead page and send reverted patient data
        navigate("/leads", {
          state: { refresh: true, patient: data.leadDetails },
        });
      } catch (error) {
        console.error("Error:", error);
        toast({
          title: "Error",
          description: error.message || "Something went wrong",
          variant: "destructive",
        });
      }
    }
  };

  const openAssignPhysioDialog = (patient) => {
    if (
      user?.role === "HOD" ||
      user?.role === "Admin" ||
      user?.role === "SuperAdmin"
    ) {
      setAssigningPatient(patient);
      setAssignForm({
        _id: patient._id ? patient._id : null,
        Physiotherapist: patient.physioId ? patient.physioId.physioName : null,
        physioId: patient.physioId ? patient.physioId._id : "",
        InitialShorttermGoal: patient.InitialShorttermGoal || "",
        goalDuration: patient.goalDuration || "",
        totalSessionDays: patient.totalSessionDays || "",
        consultationNumber: patient.patientNumber || "",
        sessionStartDate: patient.sessionStartDate
          ? new Date(patient.sessionStartDate)
          : "",
        sessionTime: patient.sessionTime || "",
        goalDescription: patient.goalDescription || " ",
        reviewFrequency: patient.reviewFrequency || "",
        visitOrder: patient.visitOrder || "",
        KmsfromHub: patient.KmsfromHub || "",
        KmsfLPatienttoHub: patient.KmsfLPatienttoHub || "",
        kmsFromPrevious: patient.kmsFromPrevious || "",
      });
      setIsAssignPhysioOpen(true);
    } else {
      toast({
        title: "Access Denied",
        description: "You do not have permission to assign physiotherapists.",
        variant: "destructive",
      });
    }
  };

  const handleAssignPhysioSubmit = (e) => {
    e.preventDefault();
    if (!assignForm.physioId) {
      toast({
        title: "Alert",
        description: "Please Select Physiotherapist.",
        variant: "destructive",
      });
      return false;
    } else if (!assignForm.sessionStartDate) {
      toast({
        title: "Alert",
        description: "Please Select Session Start Date.",
        variant: "destructive",
      });
      return false;
    } else if (!assignForm.sessionTime) {
      toast({
        title: "Alert",
        description: "Please Select Session Time.",
        variant: "destructive",
      });
      return false;
    }
    if (!assignForm.totalSessionDays) {
      toast({
        title: "Alert",
        description: "Please Enter Total Session Days.",
        variant: "destructive",
      });
      return false;
    }
    if (!assignForm.totalSessionDays) {
      toast({
        title: "Alert",
        description: "Please Enter Total Session Days.",
        variant: "destructive",
      });
      return false;
    }
    if (!assignForm.reviewFrequency) {
      toast({
        title: "Alert",
        description: "Please Enter Review Frequency.",
        variant: "destructive",
      });
      return false;
    }
    // if (!assignForm.InitialShorttermGoal) {
    //   toast({
    //     title: "Alert",
    //     description: "Please Enter Initial Short term Goal.",
    //     variant: "destructive",
    //   });
    //   return false;
    // }
    // if (!assignForm.goalDuration) {
    //   toast({
    //     title: "Alert",
    //     description: "Please Enter Goal Duration.",
    //     variant: "destructive",
    //   });
    //   return false;
    // }
    if (!assignForm.visitOrder) {
      toast({
        title: "Alert",
        description: "Please Enter Visit Order.",
        variant: "destructive",
      });
      return false;
    }
    if (!assignForm.kmsFromPrevious && assignForm.visitOrder > 1) {
      toast({
        title: "Alert",
        description: "Please Enter Kms From Previous.",
        variant: "destructive",
      });
      return false;
    }
    // setPatients(prev => prev.map(p => {
    //   if (p._id === assigningPatient._id) {
    //     return {
    //       ...p,
    //       physiotherapistAssigned: assignForm.Physiotherapist,
    //       sessionStartDate: assignForm.sessionStartDate,
    //       sessionTime: assignForm.sessionTime,
    //       totalSessionDays: assignForm.totalSessionDays,
    //       InitialShorttermGoal: assignForm.InitialShorttermGoal,
    //       goalDuration: assignForm.goalDuration,
    //       treatmentPlan: { ...(p.treatmentPlan || {}), goalDescription: assignForm.goalDescription },
    //       reviewFrequency: assignForm.reviewFrequency,
    //       travelDetails: {
    //         visitOrder: parseInt(assignForm.visitOrder),
    //         KmsfromHub: assignForm.visitOrder == 1 ? parseFloat(assignForm.KmsfromHub) : null,
    //         kmsFromPrevious: assignForm.visitOrder > 1 ? parseFloat(assignForm.kmsFromPrevious) : null,
    //         returnToHubKms: parseFloat(assignForm.returnToHubKms),
    //       }
    //     };
    //   }
    //   return p;
    // }));
    console.log(assignForm, "...assigningPatient,...assignForm");

    AssignPhysio(assignForm);
    toast({
      title: "Success",
      description: `Physio assigned and plan updated for ${assigningPatient.patientName}.`,
    });
    getAllConsultation();
    // setIsAssignPhysioOpen(false);
    // setAssigningPatient(null);
    // setAssignForm(initialAssignState);
  };

  // const handleViewHistory = (patient) => {
  //   setHistoryPatient(patient);
  //   const patientSessions = sessions.filter(s => s.patientCode === patient.id).map(s => ({
  //     type: 'session',
  //     date: s.sessionDate,
  //     title: `Session ${s.status}`,
  //     details: s.feedback ? `Feedback: ${s.feedback.pros}` : `Status: ${s.status}`,
  //   }));

  //   const patientGoalLog = (patient.goalLog || []).map(log => ({
  //     type: 'review',
  //     date: log.date,
  //     title: `HOD Review: ${log.status}`,
  //     details: `Goal: ${log.goal}. Feedback: ${log.feedback || 'N/A'}. Satisfaction: ${log.satisfaction || 'N/A'}%`,
  //   }));

  //   const combinedHistory = [...patientSessions, ...patientGoalLog].sort((a, b) => new Date(b.date) - new Date(a.date));
  //   setPatientHistory(combinedHistory);
  //   setIsHistoryOpen(true);
  // };

  const renderRadioGroup = (label, name, value, id, group, dynamic) => (
    <div className="flex items-center space-x-4">
      <Label className="w-24">{label}</Label>
      <RadioGroup
        value={patientForm[name] || (group ? false : "no")}
        onValueChange={(v) => {
          dynamic ? handleRadio(name, v, id) : handleRadioChange(name, v);
        }}
        className="flex gap-4"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value={group ? true : "yes"} id={`${name}-yes`} />
          <Label htmlFor={`${name}-yes`}>Yes</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value={group ? false : "no"} id={`${name}-no`} />
          <Label htmlFor={`${name}-no`}>No</Label>
        </div>
      </RadioGroup>
    </div>
  );
  // const renderRadioGroup = (label, name, value, id, group) => (
  //   <div className="flex items-center space-x-4">
  //     <Label className="w-24">{label}</Label>
  //     <RadioGroup value={patientForm[name] || value} onValueChange={(v) => { group ? handleRadio(name, v, id) : handleRadioChange(name, v) }} className="flex gap-4">
  //       <div className="flex items-center space-x-2"><RadioGroupItem value={true} id={`${name}-yes`} /><Label htmlFor={`${name}-yes`}>Yes</Label></div>
  //       <div className="flex items-center space-x-2"><RadioGroupItem value={false} active='no' id={`${name}-no`} /><Label htmlFor={`${name}-no`}>No</Label></div>
  //     </RadioGroup>
  //   </div>

  // );

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="md:flex justify-between items-center space-y-5"
      >
        <div>
          <h1 className="md:text-3xl text-lg font-bold text-gray-800 mb-2">
            Consultation Management
          </h1>
          <p className="text-gray-600 text-sm md:text-xs">
            Manage consultation, client details,and treatment records.
          </p>
        </div>
        {/* {(user?.role === 'Admin' || user?.role === 'SuperAdmin') && (
          <>{
            Permissions.isAdd &&
              <Button onClick={handleNewPatient}><PlusCircle className="mr-2 h-4 w-4" /> New Consultation</Button>
          }
        
          </>
        )} */}
      </motion.div>

      <Card className="medical-card">
        <CardHeader>
          <CardTitle>Search Consultations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, contact or Consultation ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="medical-card">
          <CardHeader>
            <CardTitle>Consultations ({filteredPatients.length})</CardTitle>
            <CardDescription>
              All registered consultations in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPatients.map((patient) => (
                <motion.div
                  key={patient.PatientIDPK}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow flex flex-col"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {patient.patientName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {patient.patientCode}
                      </p>
                      <p className="text-sm text-gray-600">
                        {patient.patientAge} years,{" "}
                        {patient.patientGenderId.genderName}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4 flex-grow">
                    <p className="text-sm">
                      <strong>Contact:</strong> {patient.patientNumber}
                    </p>
                    {/* <p className="text-sm"><strong>Category:</strong><span className="ml-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">{patient.category}</span></p> */}
                    <p className="text-sm">
                      <strong>Consultation:</strong>{" "}
                      {patient.consultationDate
                        ? format(new Date(patient.consultationDate), "PP")
                        : "Not set"}
                    </p>
                    <p className="text-sm">
                      <strong>Next Review:</strong>{" "}
                      {patient.reviewDate
                        ? format(new Date(patient.reviewDate), "PP")
                        : "N/A"}
                    </p>
                    {patient.shortTermGoals && (
                      <div className="text-sm mt-2 p-2 bg-blue-50 border-l-4 border-blue-400 rounded-r-md">
                        <p>
                          <strong>Goal:</strong> {patient.InitialShorttermGoal}{" "}
                          ({patient.goalDuration} days)
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    {(user?.role === "HOD" ||
                      user?.role === "Admin" ||
                      user?.role === "SuperAdmin") && (
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          disabled={!!patient.physioId}
                          onClick={() => openAssignPhysioDialog(patient)}
                          className="w-full flex items-center gap-2"
                        >
                          {patient.physioId ? (
                            <>
                              <UserCheck size={14} />
                              Physio Assigned
                            </>
                          ) : (
                            <>
                              <UserPlus size={14} />
                              Assign Physio
                            </>
                          )}
                        </Button>
                        {/* <Button size="sm" onClick={() => openAssignPhysioDialog(patient)} className="w-full flex items-center gap-2"><UserPlus size={14} /> Assign Physio</Button>*/}
                        <Button
                          size="sm"
                          disabled={!!patient.physioId}
                          onClick={() => openLead(patient)}
                          className="w-full flex items-center gap-2"
                        >
                          <UserPlus size={14} /> Revert
                        </Button>
                      </div>
                    )}
                    {/* <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleViewConsultation(patient)} className="flex-1"><FileText size={14} /><span>Consultation</span></Button>
                    <Button size="sm" onClick={() => handleScheduleReview(patient)} className="flex-1"><CalendarIcon size={14} /><span className='hidden md:inline lg:inline'>Review</span></Button> 
                    </div> */}
                    <div className="flex space-x-2">
                      {/* <Button size="sm" variant="outline" onClick={() => handleViewHistory(patient)} className="flex-1"><History size={14} /><span className="hidden md:inline lg:inline">History</span></Button> */}
                      {(user?.role === "HOD" ||
                        user?.role === "Admin" ||
                        user?.role === "SuperAdmin") && (
                        <>
                          {Permissions.isEdit && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditPatient(patient)}
                              className="flex-1"
                            >
                              <Edit size={14} />
                              <span className="hidden md:inline lg:inline">
                                Edit
                              </span>
                            </Button>
                          )}
                        </>
                      )}
                      {(user?.role === "Admin" ||
                        user?.role === "SuperAdmin") && (
                        <>
                          {Permissions.isDelete && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="flex-1"
                                >
                                  <Trash2 size={14} />
                                  <span className="hidden md:inline lg:inline">
                                    Delete
                                  </span>
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Are you sure?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete the patient and
                                    all their records.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      handleDeletePatient(patient._id)
                                    }
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <PatientDetailsDialog
        isOpen={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        patient={viewingPatient}
      />

      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="max-w-2xl max-h-[95vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Review Goal for {reviewingPatient?.patientName}
            </DialogTitle>
            <DialogDescription>
              Update feedback and satisfaction for the current goal.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-6 -mr-6">
            <div className="space-y-4 pt-4">
              <div>
                <Label className="font-semibold">Current Goal</Label>
                <p className="text-sm text-gray-700 p-2 bg-gray-100 rounded-md mt-1">
                  {reviewingPatient?.shortTermGoals || "No current goal set."}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="feedback">Feedback / Suggestions</Label>
                <textarea
                  id="feedback"
                  className="w-full p-2 border rounded-md"
                  value={reviewForm.feedback}
                  onChange={(e) =>
                    setReviewForm((p) => ({ ...p, feedback: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Satisfaction (%)</Label>
                <div className="flex items-center gap-2 flex-wrap">
                  {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((p) => (
                    <Button
                      key={p}
                      type="button"
                      variant={
                        reviewForm.satisfaction === p ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() =>
                        setReviewForm((f) => ({ ...f, satisfaction: p }))
                      }
                    >
                      {p}%
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsReviewOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleUpdateFeedback}
            >
              Update Feedback Only
            </Button>
            <Button type="button" onClick={handleLogAndOpenNewGoal}>
              Log Goal & Set New One
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isNewGoalOpen} onOpenChange={setIsNewGoalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Set Next Goal for {reviewingPatient?.patientName}
            </DialogTitle>
            <DialogDescription>
              Define the next short-term goal and review date.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleNewGoalSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="newShortTermGoal">New Short-term Goal</Label>
              <Input
                id="newShortTermGoal"
                value={newGoalForm.newShortTermGoal}
                onChange={(e) =>
                  setNewGoalForm((p) => ({
                    ...p,
                    newShortTermGoal: e.target.value,
                  }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newGoalDuration">
                  New Goal Duration (days)
                </Label>
                <Input
                  id="newGoalDuration"
                  type="number"
                  onWheel={(e) => {
                    e.target.blur();
                  }}
                  value={newGoalForm.newGoalDuration}
                  onChange={(e) =>
                    setNewGoalForm((p) => ({
                      ...p,
                      newGoalDuration: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Next Review Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !newGoalForm.nextReviewDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newGoalForm.nextReviewDate ? (
                        format(newGoalForm.nextReviewDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newGoalForm.nextReviewDate}
                      onSelect={(d) =>
                        setNewGoalForm((p) => ({ ...p, nextReviewDate: d }))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsNewGoalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Set New Goal</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
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
      </Dialog> */}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[95vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {editingPatient ? "Edit Patient" : "Create New Patient"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-6 -mr-6">
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <Accordion
                type="multiple"
                defaultValue={["item-1"]}
                className="w-full"
              >
                <AccordionItem value="item-1">
                  <AccordionTrigger>Patient Details</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Patient ID</Label>
                        <Input
                          name="patientCode"
                          value={patientForm.patientCode}
                          onChange={handleFormChange}
                          required
                          disabled
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Consultation Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !patientForm.consultationDate &&
                                  "text-muted-foreground",
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {patientForm.consultationDate ? (
                                format(patientForm.consultationDate, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={patientForm.consultationDate}
                              onSelect={(d) =>
                                handleDateChange("consultationDate", d)
                              }
                              initialFocus
                              // disabled={(date) =>
                              //   date < new Date(new Date().setHours(0, 0, 0, 0))
                              // }
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          name="patientName"
                          value={patientForm.patientName}
                          onChange={handleFormChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Age</Label>
                        <Input
                          name="patientAge"
                          type="number"
                          onWheel={(e) => {
                            e.target.blur();
                          }}
                          value={patientForm.patientAge}
                          onChange={handleFormChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Gender</Label>
                        <Select
                          value={patientForm.patientGenderId}
                          onValueChange={(v) =>
                            handleSelectChange("patientGenderId", v)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Gender" />
                          </SelectTrigger>
                          <SelectContent>
                            {gender.map((g) => (
                              <SelectItem
                                key={g.GenderIDPK}
                                value={g.GenderIDPK}
                              >
                                {g.genderName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Bystander Name</Label>
                        <Input
                          name="byStandar"
                          value={patientForm.byStandar}
                          onChange={handleFormChange}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Relation With Patient</Label>
                        <Input
                          name="Relation"
                          value={patientForm.Relation}
                          onChange={handleFormChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Mobile No.</Label>
                        <Input
                          name="patientNumber"
                          value={patientForm.patientNumber}
                          onChange={handleFormChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Alt. Mobile No.</Label>
                        <Input
                          name="patientAltNum"
                          value={patientForm.patientAltNum}
                          onChange={handleFormChange}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Address</Label>
                        <Input
                          name="patientAddress"
                          value={patientForm.patientAddress}
                          onChange={handleFormChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>PIN Code</Label>
                        <Input
                          name="patientPinCode"
                          value={patientForm.patientPinCode}
                          onChange={handleFormChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Fees Type</Label>
                        <Select
                          value={JSON.stringify({
                            id: patientForm.FeesTypeId,
                            name: patientForm.FeesTypeName,
                          })}
                          onValueChange={(v) => {
                            const selected = JSON.parse(v);
                            handleSelectChange("FeesTypeId", selected.id);
                            handleSelectChange("FeesTypeName", selected.name);
                          }}
                        >
                          {" "}
                          <SelectTrigger>
                            <SelectValue placeholder="Select Fees" />
                          </SelectTrigger>
                          <SelectContent>
                            {feesType.map((fee) => (
                              <SelectItem
                                key={fee._id}
                                value={JSON.stringify({
                                  id: fee._id,
                                  name: fee.feesTypeName,
                                })}
                              >
                                {fee.feesTypeName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>
                          Fees Amount (
                          {patientForm.FeesTypeName == "PerSession"
                            ? "PerSession"
                            : "PerMonth"}
                          )
                        </Label>
                        <Input
                          name="feeAmount"
                          value={patientForm.feeAmount}
                          onChange={handleFormChange}
                          placeholder={
                            patientForm.FeesTypeName == "PerSession"
                              ? "PerSession"
                              : "PerMonth"
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Diagnosis / Condition</Label>
                        <Input
                          name="patientCondition"
                          value={patientForm.patientCondition}
                          onChange={handleFormChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Physiotherapist Assigned</Label>
                        <Select
                          onValueChange={(v) =>
                            handleSelectChange("Physiotherapist", v)
                          }
                          value={patientForm.Physiotherapist}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Physio" />
                          </SelectTrigger>
                          <SelectContent>
                            {physios.map((p) => (
                              <SelectItem key={p._id} value={p._id.toString()}>
                                {p.physioName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Review Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !patientForm.reviewDate &&
                                  "text-muted-foreground",
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {patientForm.reviewDate ? (
                                format(patientForm.reviewDate, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={patientForm.reviewDate}
                              onSelect={(d) =>
                                handleDateChange("reviewDate", d)
                              }
                              initialFocus
                              // disabled={(date) =>
                              //   date < new Date().setHours(0, 0, 0, 0)
                              // }
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <Label>Reference</Label>
                        <Select
                          value={JSON.stringify({
                            id: patientForm.ReferenceId,
                            name: patientForm.sourceName,
                          })}
                          onValueChange={(v) => {
                            const selected = JSON.parse(v);
                            handleSelectChange("ReferenceId", selected.id);
                            handleSelectChange("sourceName", selected.name);
                          }}
                        >
                          {" "}
                          <SelectTrigger>
                            <SelectValue placeholder="Select Reference" />
                          </SelectTrigger>
                          <SelectContent>
                            {reference.map((ref) => (
                              <SelectItem
                                key={ref._id}
                                value={JSON.stringify({
                                  id: ref._id,
                                  name: ref.sourceName,
                                })}
                              >
                                {ref.sourceName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger>
                    Medical History & Risk Factors
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {risk.map((risk) => (
                        <div key={risk.RiskFactorIDPK}>
                          {renderRadioGroup(
                            risk.RiskFactorName,
                            risk.RiskFactorName.toLowerCase(),
                            patientForm[risk.RiskFactorName.toLowerCase()],
                            risk.RiskFactorIDPK,
                            true,
                            true,
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      {renderRadioGroup(
                        "History of Surgery",
                        "historyOfSurgery",
                        patientForm.historyOfSurgery,
                      )}
                    </div>
                    {patientForm.historyOfSurgery === "yes" && (
                      <div className="space-y-2">
                        <Label>Details</Label>
                        <textarea
                          name="historyOfSurgeryDetails"
                          rows={2}
                          className="w-full p-2 border rounded-md"
                          value={patientForm.historyOfSurgeryDetails}
                          onChange={handleFormChange}
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      {renderRadioGroup(
                        "History of Fall",
                        "historyOfFall",
                        patientForm.historyOfFall,
                      )}
                    </div>
                    {patientForm.historyOfFall === "yes" && (
                      <div className="space-y-2">
                        <Label>Details</Label>
                        <textarea
                          name="historyOfFallDetails"
                          rows={2}
                          className="w-full p-2 border rounded-md"
                          value={patientForm.historyOfFallDetails}
                          onChange={handleFormChange}
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>Other Medical Conditions</Label>
                      <textarea
                        name="otherMedCon"
                        rows={2}
                        className="w-full p-2 border rounded-md"
                        value={patientForm.otherMedCon}
                        onChange={handleFormChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Current Medications</Label>
                      <textarea
                        name="currMed"
                        rows={2}
                        className="w-full p-2 border rounded-md"
                        value={patientForm.currMed}
                        onChange={handleFormChange}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3">
                  <AccordionTrigger>Lifestyle Information</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Type of Lifestyle</Label>
                      <RadioGroup
                        value={patientForm.typesOfLifeStyle}
                        onValueChange={(v) =>
                          handleRadioChange("typesOfLifeStyle", v)
                        }
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="sedentary" id="ls-sedentary" />
                          <Label htmlFor="ls-sedentary">Sedentary</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="moderate" id="ls-moderate" />
                          <Label htmlFor="ls-moderate">Moderate</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="active" id="ls-active" />
                          <Label htmlFor="ls-active">Active</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div className="space-y-2">
                      {renderRadioGroup(
                        "Smoking / Alcohol",
                        "smokingOrAlcohol",
                        patientForm.smokingOrAlcohol,
                        "",
                        true,
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Dietary Habits</Label>
                      <textarea
                        name="dietaryHabits"
                        rows={2}
                        className="w-full p-2 border rounded-md"
                        value={patientForm.dietaryHabits}
                        onChange={handleFormChange}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4">
                  <AccordionTrigger>Contraindications</AccordionTrigger>
                  <AccordionContent>
                    <textarea
                      name="Contraindications"
                      rows={3}
                      className="w-full p-2 border rounded-md"
                      value={patientForm.Contraindications}
                      onChange={handleFormChange}
                    />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5">
                  <AccordionTrigger>Assessment Parameters</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Pain Level (0-10)</Label>
                        <Input
                          name="painLevel"
                          type="number"
                          onWheel={(e) => {
                            e.target.blur();
                          }}
                          value={patientForm.painLevel}
                          onChange={handleFormChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Range of Motion</Label>
                        <Input
                          name="rangeOfMotion"
                          value={patientForm.rangeOfMotion}
                          onChange={handleFormChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Muscle Strength (0-5)</Label>
                        <Input
                          name="muscleStrength"
                          type="number"
                          onWheel={(e) => {
                            e.target.blur();
                          }}
                          value={patientForm.muscleStrength}
                          onChange={handleFormChange}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Posture / Gait Analysis</Label>
                      <textarea
                        name="postureOrGaitAnalysis"
                        rows={2}
                        className="w-full p-2 border rounded-md"
                        value={patientForm.postureOrGaitAnalysis}
                        onChange={handleFormChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Functional Limitations</Label>
                      <textarea
                        name="functionalLimitations"
                        rows={2}
                        className="w-full p-2 border rounded-md"
                        value={patientForm.functionalLimitations}
                        onChange={handleFormChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>ADL Ability</Label>
                      <textarea
                        name="ADLAbility"
                        rows={2}
                        className="w-full p-2 border rounded-md"
                        value={patientForm.ADLAbility}
                        onChange={handleFormChange}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6">
                  <AccordionTrigger>Treatment Plan</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Short-term Goals</Label>
                      <textarea
                        name="shortTermGoals"
                        rows={2}
                        className="w-full p-2 border rounded-md"
                        value={patientForm.shortTermGoals}
                        onChange={handleFormChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Long-term Goals</Label>
                      <textarea
                        name="longTermGoals"
                        rows={2}
                        className="w-full p-2 border rounded-md"
                        value={patientForm.longTermGoals}
                        onChange={handleFormChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Recommended Therapy</Label>
                      <textarea
                        name="RecomTherapy"
                        rows={2}
                        className="w-full p-2 border rounded-md"
                        value={patientForm.RecomTherapy}
                        onChange={handleFormChange}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Frequency (per week)</Label>
                        <Input
                          name="Frequency"
                          type="number"
                          onWheel={(e) => {
                            e.target.blur();
                          }}
                          value={patientForm.Frequency}
                          onChange={handleFormChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Duration (weeks/months)</Label>
                        <Input
                          name="Duration"
                          value={patientForm.Duration}
                          onChange={handleFormChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>No of Days</Label>
                        <Input
                          name="noOfDays"
                          type="number"
                          onWheel={(e) => {
                            e.target.blur();
                          }}
                          value={patientForm.noOfDays}
                          onChange={handleFormChange}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      {renderRadioGroup(
                        "Modalities",
                        "Modalities",
                        patientForm.Modalities,
                        "",
                        true,
                      )}
                    </div>
                    {patientForm.Modalities === true && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="space-y-2 pl-4"
                      >
                        <Label>List of Modalities</Label>
                        <div className="p-3 border rounded-md grid grid-cols-3 gap-2">
                          {modalitiesOptions.map((mod) => (
                            <div
                              key={mod}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={`mod-${mod}`}
                                checked={patientForm.modalityList.includes(mod)}
                                onCheckedChange={(checked) => {
                                  setPatientForm((prev) => ({
                                    ...prev,
                                    modalityList: checked
                                      ? [...prev.modalityList, mod]
                                      : prev.modalityList.filter(
                                          (m) => m !== mod,
                                        ),
                                  }));
                                }}
                              />
                              <Label
                                htmlFor={`mod-${mod}`}
                                className="text-sm font-normal"
                              >
                                {mod}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                    <div className="space-y-2">
                      <Label>Targeted Area</Label>
                      <Input
                        name="targetedArea"
                        value={patientForm.targetedArea}
                        onChange={handleFormChange}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-7">
                  <AccordionTrigger>HOD Notes</AccordionTrigger>
                  <AccordionContent>
                    <textarea
                      name="hodNotes"
                      rows={3}
                      className="w-full p-2 border rounded-md"
                      value={patientForm.hodNotes}
                      onChange={handleFormChange}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="space-y-2 pt-4">
                <Label>Upload Documents</Label>
                <Input
                  type="file"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current.click()}
                >
                  <Upload size={16} className="mr-2" /> Attach File
                </Button>
                <div className="mt-2 space-y-1">
                  {patientForm.documents.map((doc, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm text-gray-600"
                    >
                      <Paperclip size={14} /> {doc}
                    </div>
                  ))}
                </div>
              </div>
              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFormOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingPatient ? "Save Changes" : "Create Patient"}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={isAssignPhysioOpen} onOpenChange={setIsAssignPhysioOpen}>
        <DialogContent className="max-w-2xl max-h-[95vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Assign Physio & Plan for {assigningPatient?.patientName}
            </DialogTitle>
            <DialogDescription>
              Schedule sessions, set goals, and configure travel details.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-6 -mr-6">
            <form
              onSubmit={handleAssignPhysioSubmit}
              // onSubmit={handleFormSubmit}
              className="space-y-4 pt-4"
            >
              <Accordion
                type="multiple"
                defaultValue={["plan", "travel"]}
                className="w-full"
              >
                <AccordionItem value="plan">
                  <AccordionTrigger>Treatment Plan</AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label> Assign Physiotherapist</Label>
                      <Select
                        onValueChange={(v) =>
                          setAssignForm((p) => ({ ...p, physioId: v }))
                        }
                        value={assignForm.physioId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a physiotherapist" />
                        </SelectTrigger>
                        <SelectContent>
                          {physios.map((p) => (
                            <SelectItem key={p._id} value={p._id.toString()}>
                              {p.physioName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* <div className="space-y-2"><Label>Physiotherapist Assigned</Label><Select onValueChange={(v) => handleSelectChange('Physiotherapist', v)} value={patientForm.Physiotherapist}><SelectTrigger><SelectValue placeholder="Select Physio" /></SelectTrigger><SelectContent>{physios.map(p => <SelectItem key={p._id} value={p._id.toString()}>{p.physioName}</SelectItem>)}</SelectContent></Select></div> */}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Session Start Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !assignForm.sessionStartDate &&
                                  "text-muted-foreground",
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {assignForm.sessionStartDate ? (
                                format(assignForm.sessionStartDate, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={assignForm.sessionStartDate}
                              onSelect={(d) =>
                                setAssignForm((p) => ({
                                  ...p,
                                  sessionStartDate: d,
                                }))
                              }
                              initialFocus
                              // disabled={(date) =>
                              //   date < new Date(new Date().setHours(0, 0, 0, 0))
                              // }
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sessionTime">Session Time</Label>
                        <Input
                          id="sessionTime"
                          type="time"
                          value={assignForm.sessionTime}
                          onChange={(e) =>
                            setAssignForm((p) => ({
                              ...p,
                              sessionTime: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="totalSessionDays">
                          Total Session Days
                        </Label>
                        <Input
                          id="totalSessionDays"
                          type="number"
                          onWheel={(e) => {
                            e.target.blur();
                          }}
                          placeholder="e.g., 30"
                          value={assignForm.totalSessionDays}
                          onChange={(e) =>
                            setAssignForm((p) => ({
                              ...p,
                              totalSessionDays: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reviewFrequency">
                          Review Frequency (in days)
                        </Label>
                        <Input
                          id="reviewFrequency"
                          type="number"
                          onWheel={(e) => {
                            e.target.blur();
                          }}
                          placeholder="e.g., 15"
                          value={assignForm.reviewFrequency}
                          onChange={(e) =>
                            setAssignForm((p) => ({
                              ...p,
                              reviewFrequency: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                    {/* <div className="space-y-2">
                      <Label htmlFor="InitialShorttermGoal">
                        Initial Short-term Goal
                      </Label>
                      <Input
                        id="InitialShorttermGoal"
                        placeholder="e.g., Walk for 15 mins without pain"
                        value={assignForm.InitialShorttermGoal}
                        onChange={(e) =>
                          setAssignForm((p) => ({
                            ...p,
                            InitialShorttermGoal: e.target.value,
                          }))
                        }
                      />
                    </div> */}
                    {/* <div className="space-y-2">
                      <Label htmlFor="goalDuration">
                        Goal Duration (in days)
                      </Label>
                      <Input
                        id="goalDuration"
                        type="number"
                        placeholder="e.g., 10"
                        value={assignForm.goalDuration}
                        onChange={(e) =>
                          setAssignForm((p) => ({
                            ...p,
                            goalDuration: e.target.value,
                          }))
                        }
                      />
                    </div> */}
                    {/* <div className="space-y-2">
                      <Label htmlFor="goalDescription">Goal Description</Label>
                      <textarea
                        id="goalDescription"
                        className="w-full p-2 border rounded-md min-h-[100px]"
                        placeholder="Describe the exercises and focus for this goal..."
                        value={assignForm.goalDescription}
                        onChange={(e) =>
                          setAssignForm((p) => ({
                            ...p,
                            goalDescription: e.target.value,
                          }))
                        }
                      />
                    </div> */}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="travel">
                  <AccordionTrigger>Travel Details</AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="visitOrder">Visit Order</Label>
                      <Input
                        id="visitOrder"
                        type="number"
                        onWheel={(e) => {
                          e.target.blur();
                        }}
                        min="1"
                        placeholder="e.g., 1 for first visit"
                        value={assignForm.visitOrder}
                        onChange={(e) =>
                          setAssignForm((p) => ({
                            ...p,
                            visitOrder: e.target.value,
                          }))
                        }
                      />
                    </div>
                    {assignForm.visitOrder == 1 && (
                      <div className="space-y-2">
                        <Label htmlFor="KmsfromHub">Kms from Hub</Label>
                        <Input
                          id="KmsfromHub"
                          type="number"
                          onWheel={(e) => {
                            e.target.blur();
                          }}
                          placeholder="Distance from hub to first patient"
                          value={assignForm.KmsfromHub}
                          onChange={(e) =>
                            setAssignForm((p) => ({
                              ...p,
                              KmsfromHub: e.target.value,
                            }))
                          }
                        />
                      </div>
                    )}
                    {assignForm.visitOrder > 1 && (
                      <div className="space-y-2">
                        <Label htmlFor="kmsFromPrevious">
                          Kms from Previous Appointment
                        </Label>
                        <Input
                          id="kmsFromPrevious"
                          type="number"
                          onWheel={(e) => {
                            e.target.blur();
                          }}
                          placeholder="Distance from previous patient"
                          value={assignForm.kmsFromPrevious}
                          onChange={(e) =>
                            setAssignForm((p) => ({
                              ...p,
                              kmsFromPrevious: e.target.value,
                            }))
                          }
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="KmsfLPatienttoHub">
                        Kms from Last Patient to Hub
                      </Label>
                      <Input
                        id="KmsfLPatienttoHub"
                        type="number"
                        onWheel={(e) => {
                          e.target.blur();
                        }}
                        placeholder="Distance for return trip"
                        value={assignForm.KmsfLPatienttoHub}
                        onChange={(e) =>
                          setAssignForm((p) => ({
                            ...p,
                            KmsfLPatienttoHub: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAssignPhysioOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Assign & Save Plan</Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Consulation;
