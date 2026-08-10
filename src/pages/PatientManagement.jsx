import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
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
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import Logo from "@/Assets/images/logo_png.png";

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
  PlusCircle,
  UserPlus,
  History,
  UserCheck,
  CheckCircle,
  Circle,
  User2,
  Eye,
  RefreshCcw,
  Award,
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

// ─────────────────────────────────────────────
// FIX 1: Memoized PatientRow to stop re-renders
// ─────────────────────────────────────────────
const getGenderName = (patient) => {
  if (
    typeof patient?.patientGenderId === "object" &&
    patient?.patientGenderId
  ) {
    return patient?.patientGenderId?.genderName || "N/A";
  }
  return patient?.genderName || "N/A";
};

const PatientRow = React.memo(function PatientRow({
  patient,
  user,
  Permissions,
  onViewConsultation,
  onScheduleReview,
  onViewHistory,
  onEditPatient,
  onDeletePatient,
  onAssignPhysio,
  onConsentClick,
  onViewPatientDocs,
  sessionResult,
  onRecoveryAction,
  badge,
  isMilestone,
}) {
  return (
    <tr
      className="border-t hover:bg-gray-50 align-top"
      style={isMilestone ? { backgroundColor: "#e8fde7", borderLeft: "4px solid #86F285" } : {}}
    >
      <td className="px-3 py-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="font-medium truncate max-w-[140px]">
            {patient.patientName}
          </div>
          {isMilestone && (
            <span
              className="flex items-center gap-0.5 px-2 py-0.5 text-[10px] rounded-full font-bold whitespace-nowrap"
              style={{ backgroundColor: "#e8fde7", color: "#2d7a2d", border: "1px solid #86F285" }}
            >
              <Award className="w-3 h-3" style={{ color: "#86F285" }} /> 26th Session!
            </span>
          )}
          {badge && (
            <span
              className={`px-2 py-0.5 text-[10px] rounded-full font-medium whitespace-nowrap ${badge.className}`}
            >
              {badge.label}
            </span>
          )}
        </div>
        <div className="text-xs text-gray-500 truncate max-w-[140px]">
          {patient.patientCode}
        </div>
      </td>

      {user?.role !== "HOD" && (
        <>
          <td className="px-3 py-2">
            {patient.patientAge || "N/A"} / {getGenderName(patient)}
          </td>
          <td className="px-3 py-2 hidden md:table-cell truncate max-w-[140px]">
            {patient.patientNumber}
          </td>
        </>
      )}

      <td className="px-3 py-2 hidden md:table-cell" style={isMilestone ? { fontWeight: "bold", color: "#2d7a2d" } : {}}>
        <div className="flex items-center gap-1">
          {patient.totalSessionCount || 0}
          {isMilestone && <Award className="w-4 h-4" style={{ color: "#86F285" }} />}
        </div>
      </td>

      <td className="px-3 py-2">
        Session {sessionResult.session}
        <br />
        <span className="text-xs text-gray-500">
          {sessionResult.date} ({sessionResult.sessionsNeeded} sessions left)
        </span>
      </td>

      <td className="px-3 py-2 hidden md:table-cell">
        {patient.patientCondition || "N/A"}
      </td>

      {user?.role !== "HOD" && (
        <td className="px-3 py-2 hidden lg:table-cell">
          {patient.consultationDate
            ? format(new Date(patient.consultationDate), "PP")
            : "Not set"}
        </td>
      )}

      <td className="px-3 py-2 hidden lg:table-cell">
        {patient.reviewDate
          ? format(new Date(patient.reviewDate), "PP")
          : "N/A"}
      </td>

      <td className="px-3 py-2 whitespace-nowrap">
        {patient.physioId?.physioName || "N/A"}
      </td>

      <td className="px-3 py-2 hidden sm:table-cell">
        <div className="flex flex-row flex-wrap gap-2 justify-center">
          {/* RECOVERY BUTTON */}
          <Button
            size="sm"
            variant={patient?.isRecovered ? "default" : "outline"}
            className={
              patient?.isRecovered
                ? "bg-orange-500 hover:bg-orange-600 text-white"
                : "border-orange-300 text-orange-600 hover:bg-orange-50"
            }
            onClick={(e) => {
              e.stopPropagation();
              onRecoveryAction(patient);
            }}
            title={
              patient?.isRecovered
                ? "Not Recovered / Restart Patient"
                : "Mark Recovered"
            }
          >
            <RefreshCcw size={14} />
          </Button>

          {/* CONSENT BUTTON */}
          <Button
            size="sm"
            variant={patient.isConsentReceived ? "secondary" : "outline"}
            className={
              patient.isConsentReceived
                ? "bg-green-100 text-green-700 border border-green-200"
                : "border-gray-300 text-gray-600"
            }
            onClick={() => onConsentClick(patient)}
            title={
              patient.isConsentReceived ? "Consent Received" : "Consent Pending"
            }
          >
            {patient.isConsentReceived ? (
              <CheckCircle size={14} className="pointer-events-none" />
            ) : (
              <Circle size={14} className="pointer-events-none" />
            )}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onViewConsultation(patient)}
          >
            <FileText size={14} />
          </Button>

          <Button size="sm" onClick={() => onScheduleReview(patient)}>
            <CalendarIcon size={14} />
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onViewHistory(patient)}
          >
            <History size={14} />
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onViewPatientDocs(patient)}
            disabled={!patient?.patientDocuments?.length}
          >
            <Eye size={14} />
          </Button>

          {Permissions.isEdit && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEditPatient(patient)}
            >
              <Edit size={14} />
            </Button>
          )}

          <Button
            size="sm"
            onClick={() =>
              onAssignPhysio(
                patient,
                user?.physioName || user?.name || "Unknown",
              )
            }
          >
            {patient.physioId ? (
              <UserCheck size={14} />
            ) : (
              <UserPlus size={14} />
            )}
          </Button>

          {Permissions.isDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive">
                  <Trash2 size={14} />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="w-[95vw] max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete patient?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the patient.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                  <AlertDialogCancel className="w-full sm:w-auto">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    className="w-full sm:w-auto"
                    onClick={() => onDeletePatient(patient._id)}
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
});

// ─────────────────────────────────────────────
// FIX 2: Memoized PatientCard (mobile)
// ─────────────────────────────────────────────
const PatientCard = React.memo(function PatientCard({
  patient,
  user,
  Permissions,
  onViewConsultation,
  onScheduleReview,
  onViewHistory,
  onEditPatient,
  onDeletePatient,
  onAssignPhysio,
  onConsentClick,
  onViewPatientDocs,
  onRecoveryAction,
  sessionResult,
  badge,
  isMilestone,
}) {
  return (
    <motion.div
      key={patient._id}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="border rounded-lg p-4 hover:shadow-md transition-shadow flex flex-col"
      style={isMilestone ? { borderColor: "#86F285", backgroundColor: "#e8fde7" } : {}}
    >
      {isMilestone && (
        <div className="flex items-center gap-1 mb-2">
          <Award className="w-4 h-4" style={{ color: "#86F285" }} />
          <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "#2d7a2d" }}>26th Session Milestone!</span>
        </div>
      )}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={isMilestone ? { backgroundColor: "#d4fbd3" } : { backgroundColor: "#dbeafe" }}>
          <User style={{ color: isMilestone ? "#2d7a2d" : "#2563eb" }} size={20} />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-800 break-words">
              {patient.patientName}
            </h3>
            {badge && (
              <span
                className={`px-2 py-0.5 text-[10px] rounded-full font-medium ${badge.className}`}
              >
                {badge.label}
              </span>
            )}
          </div>

          <p className="text-sm text-gray-600 break-all">
            {patient.patientCode}
          </p>

          <p className="text-sm text-gray-600 break-words">
            {patient.patientAge || "N/A"} years, {getGenderName(patient)}
          </p>
        </div>
      </div>

      <div className="space-y-1 mb-4 flex-grow text-sm">
        <p>
          <strong>Contact:</strong> {patient.patientNumber || "N/A"}
        </p>
        <p>
          <strong>Condition:</strong> {patient.patientCondition || "N/A"}
        </p>
        <p style={isMilestone ? { color: "#2d7a2d", fontWeight: "600" } : {}}>
          <strong>No of Sessions:</strong> {patient.sessionCount || 0}
          {isMilestone && <Award className="inline w-4 h-4 ml-1" style={{ color: "#86F285" }} />}
        </p>
        <p>
          <strong>Next Session:</strong>{" "}
          <span className="text-xs text-gray-500">
            {sessionResult.date} ({sessionResult.sessionsNeeded} sessions left)
          </span>
        </p>
        <p>
          <strong>Review Date:</strong>{" "}
          {patient.reviewDate
            ? format(new Date(patient.reviewDate), "PP")
            : "N/A"}
        </p>
        <p>Physio: {patient.physioId?.physioName || "N/A"}</p>
      </div>

      <div className="mt-2 grid grid-cols-3 gap-2">
        {/* RECOVERY BUTTON */}
        <Button
          size="sm"
          variant={patient?.isRecovered ? "default" : "outline"}
          className={
            patient?.isRecovered
              ? "bg-orange-500 hover:bg-orange-600 text-white"
              : "border-orange-300 text-orange-600 hover:bg-orange-50"
          }
          onClick={() => onRecoveryAction(patient)}
          title={
            patient?.isRecovered
              ? "Not Recovered / Restart Patient"
              : "Mark Recovered"
          }
        >
          <RefreshCcw size={14} />
        </Button>

        {/* CONSENT BUTTON */}
        <Button
          size="sm"
          variant={patient.isConsentReceived ? "secondary" : "outline"}
          className={
            patient.isConsentReceived
              ? "bg-green-100 text-green-700 border border-green-200"
              : "border-gray-300 text-gray-600"
          }
          onClick={() => onConsentClick(patient)}
          title={
            patient.isConsentReceived ? "Consent Received" : "Consent Pending"
          }
        >
          {patient.isConsentReceived ? (
            <CheckCircle size={14} className="pointer-events-none" />
          ) : (
            <Circle size={14} className="pointer-events-none" />
          )}
        </Button>

        <Button
          size="sm"
          onClick={() =>
            onAssignPhysio(patient, user?.physioName || user?.name || "Unknown")
          }
        >
          {patient.physioId ? <UserCheck size={14} /> : <UserPlus size={14} />}
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => onViewConsultation(patient)}
        >
          <FileText size={14} />
        </Button>

        <Button size="sm" onClick={() => onScheduleReview(patient)}>
          <CalendarIcon size={14} />
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => onViewHistory(patient)}
        >
          <History size={14} />
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => onViewPatientDocs(patient)}
          disabled={!patient?.patientDocuments?.length}
        >
          <Eye size={14} />
        </Button>

        {Permissions.isEdit && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEditPatient(patient)}
          >
            <Edit size={14} />
          </Button>
        )}

        {Permissions.isDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="destructive">
                <Trash2 size={14} />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="w-[95vw] max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete patient?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the patient.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDeletePatient(patient._id)}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </motion.div>
  );
});

// ─────────────────────────────────────────────
// FIX 3: Memoized RecoveredPatientRow
// ─────────────────────────────────────────────
const RecoveredPatientRow = React.memo(function RecoveredPatientRow({
  patient,
  user,
  Permissions,
  onViewConsultation,
  onScheduleReview,
  onViewHistory,
  onEditPatient,
  onDeletePatient,
  onAssignPhysio,
  onConsentClick,
  onRecoveryAction,
}) {
  return (
    <tr className="border-t hover:bg-gray-50 align-top">
      <td className="px-3 py-2">
        <div className="font-medium truncate max-w-[140px]">
          {patient.patientName}
        </div>
        <div className="text-xs text-gray-500 truncate max-w-[140px]">
          {patient.patientCode}
        </div>
      </td>
      {user?.role !== "HOD" && (
        <>
          <td className="px-3 py-2">
            {patient.patientAge} / {getGenderName(patient)}
          </td>
          <td className="px-3 py-2 hidden md:table-cell truncate max-w-[140px]">
            {patient.patientNumber}
          </td>
        </>
      )}
      <td className="px-3 py-2 hidden md:table-cell truncate max-w-[140px]">
        {patient.sessionCount || 0}
      </td>
      <td className="px-3 py-2 hidden md:table-cell truncate max-w-[140px]">
        {patient.patientCondition}
      </td>
      {user?.role !== "HOD" && (
        <td className="px-3 py-2 hidden lg:table-cell">
          {patient.consultationDate
            ? format(new Date(patient.consultationDate), "PP")
            : "Not set"}
        </td>
      )}
      <td className="px-3 py-2 hidden lg:table-cell">
        {patient.reviewDate
          ? format(new Date(patient.reviewDate), "PP")
          : "N/A"}
      </td>
      <td className="px-3 py-2 hidden lg:table-cell">
        {patient.recoveredAt
          ? format(new Date(patient.recoveredAt), "PP")
          : "N/A"}
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        {patient.physioId?.physioName}
      </td>
      <td className="px-3 py-2 hidden sm:table-cell">
        <div className="flex flex-row flex-wrap gap-2 justify-center">
          {/* RECOVERY BUTTON */}
          <Button
            size="sm"
            variant="default"
            className="bg-orange-500 hover:bg-orange-600 text-white"
            onClick={() => onRecoveryAction(patient)}
            title="Not Recovered / Restart Patient"
          >
            <RefreshCcw size={14} />
          </Button>

          {/* CONSENT BUTTON */}
          <Button
            size="sm"
            variant={patient.isConsentReceived ? "secondary" : "outline"}
            className={
              patient.isConsentReceived
                ? "bg-green-100 text-green-700 border border-green-200"
                : "border-gray-300 text-gray-600"
            }
            onClick={() => onConsentClick(patient)}
            title={
              patient.isConsentReceived ? "Consent Received" : "Consent Pending"
            }
          >
            {patient.isConsentReceived ? (
              <CheckCircle size={14} className="pointer-events-none" />
            ) : (
              <Circle size={14} className="pointer-events-none" />
            )}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onViewConsultation(patient)}
          >
            <FileText size={14} />
          </Button>

          <Button size="sm" onClick={() => onScheduleReview(patient)}>
            <CalendarIcon size={14} />
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onViewHistory(patient)}
          >
            <History size={14} />
          </Button>

          {Permissions.isEdit && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEditPatient(patient)}
            >
              <Edit size={14} />
            </Button>
          )}

          <Button
            size="sm"
            onClick={() =>
              onAssignPhysio(
                patient,
                user?.physioName || user?.name || "Unknown",
              )
            }
          >
            {patient.physioId ? (
              <UserCheck size={14} />
            ) : (
              <UserPlus size={14} />
            )}
          </Button>

          {Permissions.isDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive">
                  <Trash2 size={14} />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="w-[95vw] max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete patient?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the patient.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                  <AlertDialogCancel className="w-full sm:w-auto">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    className="w-full sm:w-auto"
                    onClick={() => onDeletePatient(patient._id)}
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
});

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════
const PatientManagement = () => {
  const [dateFilter, setDateFilter] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [physios, setPhysios] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const fileInputRef = useRef(null);
  const [openPdfDialog, setOpenPdfDialog] = useState(false);
  const [openExcelDialog, setOpenExcelDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("patient");
  const [downloadDialog, setDownloadDialog] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [openRecoveryChoice, setOpenRecoveryChoice] = useState(false);
  const [selectedPatientForRecovery, setSelectedPatientForRecovery] =
    useState(null);
  const [pendingPatient, setPendingPatient] = useState(null);
  const [openDialog, setOpendialog] = useState(false);
  const [pendingAction, setPendingAction] = useState("");
  const [recoveredType, setRecoveredType] = useState("");
  const [otherReason, setOtherReason] = useState("");
  const [openAlert, setOpenAlert] = useState(false);
  const [visitOrderError, setVisitOrderError] = useState("");
  const [isAssignPhysioOpen, setIsAssignPhysioOpen] = useState(false);
  const [assigningPatient, setAssigningPatient] = useState(null);
  const [isDocOpen, setIsDocOpen] = useState(false);
  const [patientDocs, setPatientDocs] = useState([]);
  const [selectedPatientName, setSelectedPatientName] = useState("");
  const [recoveryStatus, setRecoveryStatus] = useState("notRecovered");
  const [restartType, setRestartType] = useState("");
  const [isSavingPatient, setIsSavingPatient] = useState(false);
  const initialAssignState = {
    _id: "",
    physioName: "",
    Physiotherapist: "",
    physioId: "",
    sessionStartDate: "",
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
  const [sessionStatus, setSessionStatus] = useState({
    completed: false,
    cancelled: false,
    scheduled: false,
  });
  const [reviewFromDate, setReviewFromDate] = useState("");

  const [reviewToDate, setReviewToDate] = useState("");

  const [reviewStatus, setReviewStatus] = useState({
    completed: false,
    scheduled: false,
  });
  const handleViewPatientDocs = (patient) => {
    setPatientDocs(patient?.patientDocuments || []);
    setSelectedPatientName(patient?.patientName || "");
    setIsDocOpen(true);
  };
  const [activeHistoryTab, setActiveHistoryTab] = useState("sessions");
  const [assignForm, setAssignForm] = useState(initialAssignState);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [viewingPatient, setViewingPatient] = useState(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewingPatient, setReviewingPatient] = useState(null);
  const initialReviewState = { feedback: "", satisfaction: 0 };
  const [reviewForm, setReviewForm] = useState(initialReviewState);
  const [isNewGoalOpen, setIsNewGoalOpen] = useState(false);
  const initialNewGoalState = { newShortTermGoal: "", newGoalDuration: "" };
  const [newGoalForm, setNewGoalForm] = useState(initialNewGoalState);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyPatient, setHistoryPatient] = useState(null);
  const [patientHistory, setPatientHistory] = useState([]);
  const [sessionCount, setSessionCount] = useState({ total: 0, completed: 0 });

  const initialFormState = {
    _id: "",
    patientCode: "",
    patientName: "",
    patientAge: "",
    patientGenderId: "",
    patientNumber: "",
    patientAddress: "",
    category: "",
    MedicalHistoryAndRiskFactor: {},

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
    static: "",
    dynamic: "",
    coordination: "",
    ADLAbility: "",
    shortTermGoals: "",
    longTermGoals: "",
    RecomTherapy: "",
    Frequency: "",
    Duration: "",
    modalities: false,
    modalitiestype: "",
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
    patientDocuments: [],
    removedDocuments: [],

    isRecovered: false,
    recoveredType: "",
    stopReason: "",
    recoveredAt: "",
    isConsentReceived: false,
  };
  const [patientForm, setPatientForm] = useState(initialFormState);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [risk, setRisk] = useState([]);
  const [gender, setGender] = useState([]);
  const [radio, setRadio] = useState([]);
  const [feesType, setFeesType] = useState([]);
  const [reference, setReference] = useState([]);
  const [modalities, setModalities] = useState([]);
  const [machines, setMachines] = useState([]);
  const [selectedPhysioId, setSelectedPhysioId] = useState("ALL");

  const { getPermissionsByPath } = useAuth();
  const [Permissions, setPermissions] = useState({
    isAdd: false,
    isView: false,
    isEdit: false,
    isDelete: false,
  });

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // ─────────────────────────────────────────────
  // DATA FETCHING
  // ─────────────────────────────────────────────
  useEffect(() => {
    getAllRisk();
    getAllpshyio();
    getAllGender();
    getModalities();
    getFeesType();
    getReference();
    getAllMachine();
  }, []);

  useEffect(() => {
    getPermissionsByPath(window.location.pathname).then((res) => {
      if (res) setPermissions(res);
      else navigate("/dashboard");
    });
  }, []);

  useEffect(() => {
    if (Permissions.isView) getAllPatient();
    // FIX: removed dateFilter from deps — date filtering is done client-side via useMemo
  }, [Permissions, activeTab]);

  // ─────────────────────────────────────────────
  // FIX 4: Merged single filter effect (was two competing effects)
  // ─────────────────────────────────────────────
  useEffect(() => {
    const search = searchTerm.toLowerCase().trim();

    // Apply date filter client-side
    let result = patients;
    if (dateFilter) {
      const end = new Date(dateFilter);
      end.setHours(23, 59, 59, 999);
      result = result.filter((p) => {
        const created = p.createdAt || p.createdOn || p.createdDate;
        if (!created) return false;
        return new Date(created) <= end;
      });
    }

    // Apply search filter
    if (search) {
      result = result.filter(
        (p) =>
          p.patientName?.toLowerCase().includes(search) ||
          p.patientCode?.toLowerCase().includes(search) ||
          p.patientNumber?.toString().includes(search),
      );
    }

    // Apply physio filter
    if (selectedPhysioId !== "ALL") {
      result = result.filter((p) => p.physioId?._id === selectedPhysioId);
    }

    setFilteredPatients(result);
  }, [patients, searchTerm, dateFilter, selectedPhysioId]);

  // ─────────────────────────────────────────────
  // FIX 5: Memoized derived patient lists
  // ─────────────────────────────────────────────
  const activePatients = useMemo(
    () => filteredPatients.filter((p) => !p.isRecovered),
    [filteredPatients],
  );
  const recoveredPatients = useMemo(
    () => filteredPatients.filter((p) => !!p.isRecovered),
    [filteredPatients],
  );

  // ─────────────────────────────────────────────
  // FIX 6: Memoized monthly stats (was running inline every render)
  // ─────────────────────────────────────────────
  const {
    thisMonthCount,
    lastMonthCount,
    growth,
    getGrowthColor,
    getGrowthSymbol,
    thisMonthRecoveredCount,
    recoveryRate,
  } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
    const lastMonth = lastMonthDate.getMonth();
    const lastMonthYear = lastMonthDate.getFullYear();

    let thisMonthCount = 0;
    let lastMonthCount = 0;
    let thisMonthRecoveredCount = 0;

    filteredPatients.forEach((patient) => {
      if (patient?.createdAt) {
        const created = new Date(patient.createdAt);
        const m = created.getMonth();
        const y = created.getFullYear();
        if (m === currentMonth && y === currentYear) thisMonthCount++;
        if (m === lastMonth && y === lastMonthYear) lastMonthCount++;
      }

      if (patient?.isRecovered) {
        const recoveredDate = new Date(patient.updatedAt || patient.createdAt);
        if (
          recoveredDate.getMonth() === currentMonth &&
          recoveredDate.getFullYear() === currentYear
        ) {
          thisMonthRecoveredCount++;
        }
      }
    });

    const total = filteredPatients.length;
    const recoveryRate =
      total > 0 ? ((thisMonthRecoveredCount / total) * 100).toFixed(1) : "0.0";

    let growth = 0;
    if (lastMonthCount === 0 && thisMonthCount > 0) growth = 100;
    else if (lastMonthCount > 0)
      growth = (
        ((thisMonthCount - lastMonthCount) / lastMonthCount) *
        100
      ).toFixed(1);

    const getGrowthColor = () => {
      if (growth > 0) return "text-green-600";
      if (growth < 0) return "text-red-600";
      return "text-gray-500";
    };
    const getGrowthSymbol = () => {
      if (growth > 0) return "↑";
      if (growth < 0) return "↓";
      return "-";
    };

    return {
      thisMonthCount,
      lastMonthCount,
      growth,
      getGrowthColor,
      getGrowthSymbol,
      thisMonthRecoveredCount,
      recoveryRate,
    };
  }, [filteredPatients]);

  // ─────────────────────────────────────────────
  // FIX 7: Pre-computed session results & badges (was computed inside JSX render loop)
  // ─────────────────────────────────────────────
  const patientComputedData = useMemo(() => {
    const now = new Date();
    const tenDaysInMs = 10 * 24 * 60 * 60 * 1000;
    const map = new Map();

    filteredPatients.forEach((patient) => {
      // Session calc
      const currentSession = patient.totalSessionCount || 0;
      const targetSession = 26;
      let sessionsToAdd =
        (targetSession - (currentSession % targetSession)) % targetSession;
      if (sessionsToAdd === 0) sessionsToAdd = targetSession;

      let date = new Date();
      let added = 0;
      while (added < sessionsToAdd) {
        if (date.getDay() !== 0) {
          added++;
          if (added === sessionsToAdd) break;
        }
        date.setDate(date.getDate() + 1);
      }

      const formatDate = (d) => {
        if (!d) return "-";
        const x = new Date(d);
        if (isNaN(x.getTime())) return "-";
        const day = String(x.getDate()).padStart(2, "0");
        const month = String(x.getMonth() + 1).padStart(2, "0");
        const year = x.getFullYear();
        return `${day}-${month}-${year}`;
      };

      const sessionResult = {
        session: targetSession,
        date: formatDate(date),
        sessionsNeeded: sessionsToAdd,
      };

      // Badge calc
      let badge = null;
      if (patient?.createdAt) {
        const createdAt = new Date(patient.createdAt);
        if (!isNaN(createdAt.getTime()) && now - createdAt <= tenDaysInMs) {
          badge = {
            label: "New",
            className: "bg-blue-100 text-blue-700 border border-blue-200",
          };
        }
      }

      const totalSessions = Number(patient.totalSessionCount || 0);
      const isMilestone = totalSessions > 0 && totalSessions % 26 === 0;

      map.set(patient._id, { sessionResult, badge, isMilestone });
    });

    return map;
  }, [filteredPatients]);

  // ─────────────────────────────────────────────
  // API HELPERS
  // ─────────────────────────────────────────────
  const getReference = async () => {
    try {
      const res = await apiRequest("References/getALLReferences", {
        method: "POST",
        body: JSON.stringify({}),
      });
      setReference(res);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const getFeesType = async () => {
    try {
      const res = await apiRequest("FeesType/getAllFeesType", {
        method: "POST",
        body: JSON.stringify({}),
      });
      setFeesType(res);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const getAllpshyio = async () => {
    try {
      const res = await apiRequest("Physio/getAllPhysio", {
        method: "POST",
        body: JSON.stringify({}),
      });
      setPhysios(res.physios);
    } catch (error) {
      console.error("Error:", error);
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
    }
  };

  const getAllGender = async () => {
    try {
      const res = await apiRequest("Gender/getAllGender", {
        method: "POST",
        body: JSON.stringify({}),
      });
      setGender(res);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const getAllPatient = async () => {
    try {
      const body = { view: activeTab === "recover" ? "recovered" : "active" };
      const res = await apiRequest("Patient/getAllPatient", {
        method: "POST",
        body: JSON.stringify(body),
      });
      const list = Array.isArray(res) ? res : [];
      setPatients(list);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const getAllMachine = async (data) => {
    try {
      const res = await apiRequest("Machinery/getAllMachinery", {
        method: "POST",
        body: JSON.stringify(data),
      });
      const list = res?.machines ?? res ?? [];
      setMachines(list);
    } catch (error) {
      console.error("not able to getall Machine", error);
    }
  };

  const getModalities = async (data) => {
    try {
      const response = await apiRequest("Modalities/getAllModalities", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setModalities(response);
    } catch (error) {
      console.log(error, "error from frontend get All Modalities");
    }
  };

  // ─────────────────────────────────────────────
  // FIX 8: useCallback on all event handlers
  // ─────────────────────────────────────────────
  const deletePatient = useCallback(
    async (id) => {
      try {
        const res = await apiRequest("Patient/deletePatient", {
          method: "POST",
          body: JSON.stringify({ _id: id }),
        });
        toast({
          title: "Deleted",
          description: res.message,
          variant: "destructive",
        });
        getAllPatient();
      } catch (error) {
        console.error("Error:", error);
        toast({ title: "Error", description: error?.message, variant: "destructive" });
      }
    },
    [activeTab],
  );
  const markPatientRecovered = async ({
    patientId,
    recoveredType,
    stopReason,
  }) => {
    const res = await apiRequest("Patient/markPatientRecovered", {
      method: "POST",
      body: JSON.stringify({
        patientId,
        isRecovered: true,
        recoveredType,
        updatedBy: user?.physioName || user?.name || "Unknown",
        stopReason: recoveredType === "Other" ? stopReason : null,
      }),
    });
    if (res?.success === false || res?.error) {
      throw new Error(res?.message || res?.error || "Failed to mark patient as recovered.");
    }
    return res;
  };

  const startFreshCycleForPatient = async (patient) => {
    return await apiRequest("Patient/startFreshCycle", {
      method: "POST",
      body: JSON.stringify({
        patientId: patient._id,
        physioId: patient?.physioId?._id || patient?.physioId || "",
      }),
    });
  };

  const continueOldCycleForPatient = async (patient) => {
    return await apiRequest("Patient/continueOldCycle", {
      method: "POST",
      body: JSON.stringify({
        patientId: patient._id,
      }),
    });
  };
  const updatePatient = async (data) => {
    const formData = new FormData();

    Object.keys(data).forEach((key) => {
      if (key !== "patientDocuments" && key !== "removedDocuments") {
        if (typeof data[key] === "boolean") {
          formData.append(key, String(data[key]));
        } else if (data[key] !== undefined && data[key] !== null) {
          formData.append(key, data[key]);
        } else {
          formData.append(key, "");
        }
      }
    });
    formData.append("updatedBy", user?.physioName || user?.name || "Unknown");
    if (data.removedDocuments?.length) {
      formData.append(
        "removedDocuments",
        JSON.stringify(data.removedDocuments),
      );
    }

    if (data.patientDocuments?.length) {
      data.patientDocuments.forEach((file) => {
        if (file instanceof File) {
          formData.append("patientDocuments", file);
        }
      });
    }

    return await apiRequest("Patient/updatePatient", {
      method: "POST",
      body: formData,
    });
  };

  const createPatient = async (data) => {
    const formData = new FormData();

    Object.keys(data).forEach((key) => {
      if (key !== "patientDocuments" && key !== "removedDocuments") {
        if (typeof data[key] === "boolean") {
          formData.append(key, String(data[key]));
        } else {
          formData.append(key, data[key] ?? "");
        }
      }
    });
    formData.append("createdBy", user?.physioName || user?.name || "Unknown");
    if (data.patientDocuments?.length) {
      data.patientDocuments.forEach((file) => {
        if (file instanceof File) {
          formData.append("patientDocuments", file);
        }
      });
    }

    const response = await apiRequest("Patient/createPatients", {
      method: "POST",
      body: formData,
    });
    getAllPatient();
    return response;
  };

  const AssignPhysio = useCallback(
    async (data) => {
      try {
        const response = await apiRequest("Patient/AssignPhysio", {
          method: "POST",
          body: JSON.stringify(data),
        });

        toast({
          title: "Success",
          description: response.message,
        });

        getAllPatient();
        setIsAssignPhysioOpen(false);

        return response;
      } catch (error) {
        console.error("Error:", error);

        toast({
          title: "Error",
          description: error?.message,
          variant: "destructive",
        });
      }
    },
    [activeTab],
  );

  const handleDeletePatient = useCallback(
    (id) => {
      setPatients((prev) => prev.filter((p) => p._id !== id));
      deletePatient(id);
    },
    [deletePatient],
  );

  const handleViewConsultation = useCallback((patient) => {
    setViewingPatient(patient);
    setIsDetailsOpen(true);
  }, []);
  const handleSavePatient = async () => {
    try {
      setIsSavingPatient(true);

      if (editingPatient?._id) {
        const wasRecovered = !!editingPatient.isRecovered;
        const nowRecovered = recoveryStatus === "recovered";

        // CASE 1: active -> recovered
        if (!wasRecovered && nowRecovered) {
          if (!recoveredType) {
            toast({
              title: "Error",
              description: "Please select recovered type.",
              variant: "destructive",
            });
            return;
          }

          if (recoveredType === "Other" && !otherReason.trim()) {
            toast({
              title: "Error",
              description: "Please enter stop reason.",
              variant: "destructive",
            });
            return;
          }

          // first save normal edit data
          await updatePatient({
            ...patientForm,
            isRecovered: false,
            recoveredType: "",
            stopReason: "",
          });

          // then mark recovered using separate API
          const recoveredRes = await markPatientRecovered({
            patientId: editingPatient._id,
            recoveredType,
            stopReason: otherReason.trim(),
          });

          toast({
            title: "Success",
            description: recoveredRes.message,
          });
        }

        // CASE 2: recovered -> not recovered
        else if (wasRecovered && !nowRecovered) {
          setSelectedPatientForRecovery({
            ...editingPatient,
            physioId: patientForm.physioId || editingPatient.physioId,
          });
          setOpenRecoveryChoice(true);
          return;
        }

        // CASE 3: recovered -> recovered normal edit
        // CASE 4: active -> active normal edit
        else {
          const updateRes = await updatePatient({
            ...patientForm,
            isRecovered: wasRecovered,
            recoveredType: wasRecovered
              ? recoveredType || patientForm.recoveredType
              : "",
            stopReason:
              wasRecovered &&
              (recoveredType || patientForm.recoveredType) === "Other"
                ? otherReason || patientForm.stopReason
                : "",
          });

          toast({
            title: "Success",
            description: updateRes.message,
          });
        }
      } else {
        const createRes = await createPatient(patientForm);
        toast({
          title: "Success",
          description: createRes.message,
        });
      }

      setIsFormOpen(false);
      setEditingPatient(null);
      setPatientForm(initialFormState);
      setRecoveredType("");
      setOtherReason("");
      setRecoveryStatus("notRecovered");
      setRestartType("");
      getAllPatient();
    } catch (error) {
      toast({
        title: "Error",
        description: error?.message,
        variant: "destructive",
      });
    } finally {
      setIsSavingPatient(false);
    }
  };
  const handleScheduleReview = useCallback((patient) => {
    setReviewingPatient(patient);
    setIsReviewOpen(true);
  }, []);

  const openAssignPhysioDialog = useCallback((patient) => {
    setAssigningPatient(patient);
    setVisitOrderError("");
    setAssignForm({
      _id: patient._id ?? null,
      Physiotherapist: patient.physioId ? patient.physioId.physioName : null,
      physioId: patient.physioId ? patient.physioId._id : "",
      InitialShorttermGoal: patient.InitialShorttermGoal || "",
      goalDuration: patient.goalDuration || "",
      totalSessionDays: patient.totalSessionDays || "",
      sessionStartDate: patient.sessionStartDate
        ? new Date(patient.sessionStartDate)
        : "",
      updatedBy: user?.physioName || user?.name || "Unknown",
      sessionTime: patient.sessionTime || "",
      goalDescription: patient.goalDescription || " ",
      reviewFrequency: patient.reviewFrequency || "",
      visitOrder: patient.visitOrder || "",
      KmsfromHub: patient.KmsfromHub || "",
      KmsfLPatienttoHub: patient.KmsfLPatienttoHub || "",
      kmsFromPrevious: patient.kmsFromPrevious || "",
    });
    setIsAssignPhysioOpen(true);
  }, []);
  const handleConsentClick = useCallback((patient) => {
    setPendingPatient(patient);
    setOpendialog(true);
  }, []);

  const handleToggleClick = useCallback((patient) => {
    setPendingPatient(patient);
    setPendingAction(patient.isRecovered ? "notRecover" : "recover");
    setRecoveredType("");
    setOtherReason("");
    setOpenAlert(true);
  }, []);

  const handleEditPatient = useCallback((patient) => {
    setEditingPatient(patient);

    setPatientForm({
      ...initialFormState,
      ...patient,
      _id: patient._id,

      patientGenderId:
        patient.patientGenderId?._id || patient.patientGenderId || "",

      FeesTypeId: patient.FeesTypeId?._id || patient.FeesTypeId || "",

      feesTypeName:
        patient.FeesTypeId?.feesTypeName || patient.feesTypeName || "",

      ReferenceId: patient.ReferenceId?._id || patient.ReferenceId || "",

      physioId: patient.physioId?._id || patient.physioId || "",

      patientDocuments: patient.patientDocuments || [],
      removedDocuments: [],

      isRecovered: !!patient.isRecovered,
      recoveredType: patient.recoveredType || "",
      stopReason: patient.stopReason || "",
      recoveredAt: patient.recoveredAt || "",
      isConsentReceived: !!patient.isConsentReceived,
    });

    setRecoveryStatus(patient?.isRecovered ? "recovered" : "notRecovered");
    setRecoveredType(patient?.recoveredType || "");
    setOtherReason(patient?.stopReason || "");
    setRestartType("");
    setIsFormOpen(true);
  }, []);

  const handleNewPatient = useCallback(async () => {
    setEditingPatient(null);
    setPatientForm({ ...initialFormState, patientCode: "Generating..." });
    setIsFormOpen(true);
    try {
      const [activeRes, recoveredRes] = await Promise.all([
        apiRequest("Patient/getAllPatient", { method: "POST", body: JSON.stringify({ view: "active" }) }),
        apiRequest("Patient/getAllPatient", { method: "POST", body: JSON.stringify({ view: "recovered" }) }),
      ]);
      const all = [
        ...(Array.isArray(activeRes) ? activeRes : []),
        ...(Array.isArray(recoveredRes) ? recoveredRes : []),
      ];
      const lastId = all.length > 0
        ? Math.max(0, ...all.filter((p) => p.patientCode?.startsWith("HNP")).map((p) => parseInt(p.patientCode.replace("HNP", ""), 10) || 0))
        : 0;
      setPatientForm((prev) => ({ ...prev, patientCode: `HNP${String(lastId + 1).padStart(6, "0")}` }));
    } catch {
      setPatientForm((prev) => ({ ...prev, patientCode: generatePatientId() }));
    }
  }, [patients]);

  // ─────────────────────────────────────────────
  // FIX 9: physioModalityIds — stable useMemo
  // ─────────────────────────────────────────────
  const assignedPhysioIds =
    typeof patientForm.physioId === "object"
      ? patientForm.physioId?._id
      : patientForm.physioId;

  const physioModalityIds = useMemo(() => {
    if (!assignedPhysioIds || !Array.isArray(machines)) return [];
    const set = new Set();
    machines.forEach((m) => {
      const isAssigned =
        Array.isArray(m.Assignedto) &&
        m.Assignedto.some(
          (a) =>
            String(a.physioId) === String(assignedPhysioIds) &&
            Number(a.count || 0) > 0,
        );
      const modId = m.modalityId?._id ?? m.modalityId;
      if (isAssigned && modId) set.add(String(modId));
    });
    return Array.from(set);
  }, [machines, assignedPhysioIds]);

  // ─────────────────────────────────────────────
  // FORM HELPERS
  // ─────────────────────────────────────────────
  const generatePatientId = () => {
    const lastId =
      patients.length > 0
        ? Math.max(
            ...patients
              .filter((p) => p.patientCode?.startsWith("HNP"))
              .map((p) => parseInt(p.patientCode.replace("HNP", ""), 10)),
          )
        : 0;
    return `HNP${String(lastId + 1).padStart(6, "0")}`;
  };

  const handleFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setPatientForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSelectChange = useCallback((name, value) => {
    setPatientForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleRadioChange = useCallback((name, value) => {
    setPatientForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleRadio = useCallback((name, value, id) => {
    setRadio((prev) => [...prev, { RiskFactorID: id, isExist: value }]);
    setPatientForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleDateChange = useCallback((name, date) => {
    setPatientForm((prev) => ({ ...prev, [name]: date }));
  }, []);
  const handleRemovePatientDocument = (doc, index) => {
    setPatientForm((prev) => {
      const updatedDocs = [...(prev.patientDocuments || [])];
      updatedDocs.splice(index, 1);

      const updatedRemoved = [...(prev.removedDocuments || [])];

      if (doc?.fileUrl) {
        updatedRemoved.push(doc.fileUrl);
      }

      return {
        ...prev,
        patientDocuments: updatedDocs,
        removedDocuments: updatedRemoved,
      };
    });
  };
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);

    setPatientForm((prev) => ({
      ...prev,
      patientDocuments: [...(prev.patientDocuments || []), ...files],
    }));

    toast({
      title: "File Added",
      description: `${files.length} file(s) added.`,
    });
  };

  const FeesType =
    patientForm?.feesTypeName || patientForm?.FeesTypeId?.feesTypeName || "";

  const isPerSession =
    (FeesType || "").replace(/\s+/g, "").toLowerCase() === "persession";
  const handleFormSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!patientForm.patientName?.trim()) {
        toast({ title: "Alert", description: "Please Enter Patient Name", variant: "destructive" });
        return;
      }
      if (!patientForm.patientAge) {
        toast({ title: "Alert", description: "Please Enter Patient Age", variant: "destructive" });
        return;
      }
      if (!patientForm.patientGenderId) {
        toast({ title: "Alert", description: "Please Select Gender", variant: "destructive" });
        return;
      }
      if (!patientForm.byStandar?.trim()) {
        toast({ title: "Alert", description: "Please Enter Bystander Name", variant: "destructive" });
        return;
      }
      if (!patientForm.Relation?.trim()) {
        toast({ title: "Alert", description: "Please Enter Relation With Patient", variant: "destructive" });
        return;
      }
      if (!patientForm.patientNumber) {
        toast({ title: "Alert", description: "Please Enter Patient Mobile Number", variant: "destructive" });
        return;
      }
      if (!patientForm.patientAltNum) {
        toast({ title: "Alert", description: "Please Enter Alternate Mobile Number", variant: "destructive" });
        return;
      }
      if (!patientForm.patientAddress?.trim()) {
        toast({ title: "Alert", description: "Please Enter Address", variant: "destructive" });
        return;
      }
      if (!patientForm.patientPinCode?.toString().trim()) {
        toast({ title: "Alert", description: "Please Enter PIN Code", variant: "destructive" });
        return;
      }
      if (!patientForm.FeesTypeId) {
        toast({ title: "Alert", description: "Please Select Fees Type", variant: "destructive" });
        return;
      }
      if (!patientForm.feeAmount) {
        toast({ title: "Alert", description: "Please Enter Fees Amount", variant: "destructive" });
        return;
      }
      try {
        if (!editingPatient) {
          const response = await createPatient({
            ...patientForm,
            MedicalHistoryAndRiskFactor: radio,
          });
          if (response?.success === false) {
            toast({
              title: "Alert",
              description: "This phone number is already registered.",
              variant: "destructive",
            });
            return;
          }
          toast({ title: "Success", description: response.message });
        } else {
          await updatePatient({
            ...patientForm,
            MedicalHistoryAndRiskFactor: radio,
          });
        }
        if (patientForm.modalities === "yes") {
          if (!patientForm.modalityList?.length) {
            toast({
              title: "Alert",
              description: "Select at least one modality",
              variant: "destructive",
            });
            return;
          }
          if (!patientForm.targetedArea?.trim()) {
            toast({
              title: "Alert",
              description: "Enter the targeted area",
              variant: "destructive",
            });
            return;
          }
        }
        setIsFormOpen(false);
        setEditingPatient(null);
        setPatientForm(initialFormState);
      } catch (error) {
        toast({
          title: "Error",
          description: error?.message || "Something went wrong.",
          variant: "destructive",
        });
      }
    },
    [patientForm, editingPatient, radio, createPatient, updatePatient],
  );

  const handleAssignPhysioSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      try {
        if (visitOrderError) {
          toast({
            title: "Fix Error",
            description: visitOrderError,
            variant: "destructive",
          });
          return;
        }
        await AssignPhysio(assignForm);
        // toast is shown inside AssignPhysio
        setPatients((prev) => {
          const physioId = assignForm.physioId;
          const newOrder = Number(assignForm.visitOrder);

          // patients of same physio
          const physioPatients = prev.filter(
            (p) =>
              (p.physioId?._id || p.physioId) === physioId && !p.isRecovered,
          );

          // remove current patient
          const others = physioPatients.filter(
            (p) => p._id !== assigningPatient._id,
          );

          // updated patient object
          const updatedPatient = {
            ...assigningPatient,
            physioId: {
              _id: physioId,
              physioName: assignForm.Physiotherapist,
            },
            sessionStartDate: assignForm.sessionStartDate,
            sessionTime: assignForm.sessionTime,
            totalSessionDays: assignForm.totalSessionDays,
            InitialShorttermGoal: assignForm.InitialShorttermGoal,
            goalDuration: assignForm.goalDuration,
            goalDescription: assignForm.goalDescription,
            reviewFrequency: assignForm.reviewFrequency,
            visitOrder: newOrder,
            KmsfromHub: assignForm.KmsfromHub,
            KmsfLPatienttoHub: assignForm.KmsfLPatienttoHub,
            kmsFromPrevious: assignForm.kmsFromPrevious,
          };

          // insert patient at new position
          others.splice(newOrder - 1, 0, updatedPatient);

          // recalc visitOrder
          const reordered = others.map((p, index) => ({
            ...p,
            visitOrder: index + 1,
          }));

          // merge back with other patients
          return prev.map((p) => {
            const updated = reordered.find((r) => r._id === p._id);
            return updated ? updated : p;
          });
        });
        setIsAssignPhysioOpen(false);
        setAssigningPatient(null);
        setAssignForm(initialAssignState);
      } catch (error) {
        console.error("Error assigning physio:", error);
        toast({
          title: "Error",
          description: error?.message,
          variant: "destructive",
        });
      }
    },
    [AssignPhysio, assignForm, assigningPatient],
  );

  const handleConsentToggle = useCallback(async (patient) => {
    try {
      const newStatus = !patient.isConsentReceived;
      const res = await apiRequest("Patient/updatePatient", {
        method: "POST",
        body: JSON.stringify({
          _id: patient._id,
          isConsentReceived: newStatus,
        }),
      });
      if (res) {
        toast({
          title: "Status Updated",
          description: res.message,
        });
        setPatients((prev) =>
          prev.map((p) =>
            p._id === patient._id ? { ...p, isConsentReceived: newStatus } : p,
          ),
        );
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error?.message,
        variant: "destructive",
      });
    }
  }, []);

  const handleConfirmMarkRecovered = async () => {
    try {
      if (!pendingPatient?._id) return;

      if (!recoveredType) {
        toast({
          title: "Error",
          description: "Please select recovered type",
          variant: "destructive",
        });
        return;
      }

      if (recoveredType === "Other" && !otherReason.trim()) {
        toast({
          title: "Error",
          description: "Please enter reason",
          variant: "destructive",
        });
        return;
      }

      const res = await markPatientRecovered({
        patientId: pendingPatient._id,
        recoveredType,
        stopReason: otherReason.trim(),
      });

      toast({
        title: "Success",
        description: res.message,
      });

      setOpenedDialog(false);
      setPendingPatient(null);
      setRecoveredType("");
      setOtherReason("");
      getAllPatient();
    } catch (error) {
      toast({
        title: "Error",
        description: error?.message,
        variant: "destructive",
      });
    }
  };
  const [openedDialog, setOpenedDialog] = useState(false);
  const handleRecoveryActionClick = useCallback((patient) => {
    if (patient?.isRecovered) {
      setSelectedPatientForRecovery(patient);
      setOpenRecoveryChoice(true);
    } else {
      setPendingPatient(patient);
      setRecoveredType("");
      setOtherReason("");
      setOpenedDialog(true);
    }
  }, []);

  const handleRecoveryOption = useCallback(
    async (type) => {
      try {
        if (!selectedPatientForRecovery?._id) return;

        if (type === "fresh") {
          const res = await startFreshCycleForPatient(selectedPatientForRecovery);
          toast({
            title: "Success",
            description: res.message,
          });
        }

        if (type === "continue") {
          const res = await continueOldCycleForPatient(selectedPatientForRecovery);
          toast({
            title: "Success",
            description: res.message,
          });
        }

        setOpenRecoveryChoice(false);
        setSelectedPatientForRecovery(null);
        getAllPatient();
      } catch (error) {
        toast({
          title: "Error",
          description: error?.message,
          variant: "destructive",
        });
      }
    },
    [selectedPatientForRecovery],
  );

  // Review / goal handlers
  useEffect(() => {
    if (!isReviewOpen || !reviewingPatient) return;
    setReviewForm({
      feedback: reviewingPatient?.Feedback || "",
      satisfaction: reviewingPatient?.Satisfaction || null,
    });
  }, [isReviewOpen, reviewingPatient]);

  const handleUpdateFeedback = useCallback(async () => {
    if (!reviewingPatient) return;
    try {
      const res = await apiRequest("Patient/updatePatientFeedbacks", {
        method: "POST",
        body: JSON.stringify({
          patientId: reviewingPatient._id,
          updatedBy: user?.physioName || user?.name || "Unknown",
          Feedback: reviewForm.feedback,
          Satisfaction: reviewForm.satisfaction,
        }),
      });
      setPatients((prev) =>
        prev.map((p) =>
          p._id === reviewingPatient._id
            ? {
                ...p,
                Feedback: reviewForm.feedback,
                Satisfaction: reviewForm.satisfaction,
              }
            : p,
        ),
      );
      toast({
        title: "Feedback Updated",
        description: res.message,
      });
      setIsReviewOpen(false);
    } catch (err) {
      console.error("Failed to save feedback", err);
      toast({
        title: "Error",
        description: err?.message,
        variant: "destructive",
      });
    }
  }, [reviewingPatient, reviewForm]);

  const handleLogAndOpenNewGoal = useCallback(
    async (e) => {
      e.preventDefault();
      try {
        const res = await apiRequest("Patient/updatePatientFeedbacks", {
          method: "POST",
          body: JSON.stringify({
            patientId: reviewingPatient._id,
            Feedback: reviewForm.feedback,
            Satisfaction: reviewForm.satisfaction,
          }),
        });
        setPatients((prev) =>
          prev.map((p) =>
            p._id === reviewingPatient._id
              ? {
                  ...p,
                  Feedback: reviewForm.feedback,
                  Satisfaction: reviewForm.satisfaction,
                }
              : p,
          ),
        );
        toast({
          title: "Feedback Updated",
          description: res.message,
        });
        setIsReviewOpen(false);
        setIsNewGoalOpen(true);
      } catch (err) {
        console.error("Failed to save feedback", err);
        toast({
          title: "Error",
          description: err?.message,
          variant: "destructive",
        });
      }
    },
    [reviewingPatient, reviewForm],
  );

  const handleNewGoalSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!reviewingPatient?._id) return;
      try {
        const res = await apiRequest("Patient/updatePatientGoals", {
          method: "POST",
          body: JSON.stringify({
            patientId: reviewingPatient._id,
            shortTermGoals: newGoalForm.newShortTermGoal,
            goalDuration: newGoalForm.newGoalDuration,
            feedback: reviewForm.feedback,
            satisfaction: reviewForm.satisfaction,
          }),
        });
        toast({
          title: "New Goal Set!",
          description: res.message,
        });
        setIsNewGoalOpen(false);
        setNewGoalForm(initialNewGoalState);
        setReviewForm(initialReviewState);
        getAllPatient();
      } catch (err) {
        console.error(err);
        toast({
          title: "Error",
          description: err?.message,
          variant: "destructive",
        });
      }
    },
    [reviewingPatient, newGoalForm, reviewForm],
  );

  const handleViewHistory = useCallback(async (patient) => {
    setHistoryPatient(patient);
    setIsHistoryOpen(true);
    try {
      const patientId = patient?._id || patient?.patientId?._id;
      const [allSessions, allReviews] = await Promise.all([
        apiRequest("Session/getAllSessionsbyPatient", {
          method: "POST",
          body: JSON.stringify({ patientId }),
        }),
        apiRequest("Review/getSingleReview", {
          method: "POST",
          body: JSON.stringify({ patientId }),
        }),
      ]);

      const sessionsArr = Array.isArray(allSessions) ? allSessions : [];
      const reviewsArr = Array.isArray(allReviews) ? allReviews : [];

      const groupedByCycle = sessionsArr.reduce((acc, session) => {
        const cycleKey =
          session?.cycleId?._id || session?.cycleId || "no-cycle";
        if (!acc[cycleKey]) acc[cycleKey] = [];
        acc[cycleKey].push(session);
        return acc;
      }, {});

      const groupedReviewsByCycle = reviewsArr.reduce((acc, review) => {
        const cycleKey = review?.cycleId?._id || review?.cycleId || "no-cycle";
        if (!acc[cycleKey]) acc[cycleKey] = [];
        acc[cycleKey].push(review);
        return acc;
      }, {});

      const allCycleKeys = Array.from(
        new Set([
          ...Object.keys(groupedByCycle),
          ...Object.keys(groupedReviewsByCycle),
        ]),
      );

      const cycleHistory = allCycleKeys.map((cycleId, cycleIndex) => {
        const cycleSessions = groupedByCycle[cycleId] || [];
        const cycleReviews = groupedReviewsByCycle[cycleId] || [];

        const sortedSessionsAsc = [...cycleSessions].sort(
          (a, b) =>
            new Date(a?.sessionDate || 0) - new Date(b?.sessionDate || 0),
        );
        let runningCount = 0;
        let previousStatus = "";

        const sessionItems = sortedSessionsAsc.map((s, index) => {
          const currentStatus =
            s?.sessionStatusId?.sessionStatusName?.toLowerCase() || "";
          if (index === 0) runningCount = 1;
          else if (previousStatus !== "canceled") runningCount += 1;
          previousStatus = currentStatus;
          return {
            ...s,
            itemType: "session",
            type: "session",
            cycleId,
            date: s?.sessionDate || null,
            sortDate: s?.sessionDate ? new Date(s.sessionDate) : null,
            displaySessionCount: runningCount,
            title: `Session ${runningCount}`,
            status: s?.sessionStatusId?.sessionStatusName || "N/A",
            color: s?.sessionStatusId?.sessionStatusColor || "#4B5563",
            physioName: s?.physioId?.physioName || "N/A",
            sessionFromTime: s?.sessionFromTime || null,
            sessionToTime: s?.sessionToTime || null,
            feedback:
              s?.sessionFeedbackPros ||
              s?.sessionCancelReason ||
              s?.sessionFeedbackCons ||
              "No feedback",
          };
        });

        const sortedReviewsAsc = [...cycleReviews].sort(
          (a, b) => new Date(a?.reviewDate || 0) - new Date(b?.reviewDate || 0),
        );
        const reviewItems = sortedReviewsAsc.map((r, index) => ({
          ...r,
          itemType: "review",
          type: "review",
          cycleId,
          date: r?.reviewDate || null,
          sortDate: r?.reviewDate ? new Date(r.reviewDate) : null,
          reviewNumber: index + 1,
          title: `Review ${index + 1}`,
          status: r?.reviewStatusId?.reviewStatusName || "N/A",
          color: r?.reviewStatusId?.sessionStatusColor || "#2563EB",
          reviewType: r?.reviewTypeId?.reviewTypeName || "N/A",
          feedback: r?.feedback || "No feedback",
          physioName: r?.physioId?.physioName || "N/A",
          redFlags:
            Array.isArray(r?.redFlags) && r.redFlags.length > 0
              ? r.redFlags
                  .map((flag) => flag?.redFlagId?.redflagName)
                  .filter(Boolean)
                  .join(", ")
              : "No red flags",
        }));

        const mergedItems = [...sessionItems, ...reviewItems].sort(
          (a, b) => new Date(b?.sortDate || 0) - new Date(a?.sortDate || 0),
        );

        const dates = mergedItems
          .map((item) => item?.date)
          .filter(Boolean)
          .map((d) => new Date(d))
          .filter((d) => !isNaN(d.getTime()));
        const firstDate =
          dates.length > 0
            ? new Date(Math.min(...dates.map((d) => d.getTime())))
            : null;
        const lastDate =
          dates.length > 0
            ? new Date(Math.max(...dates.map((d) => d.getTime())))
            : null;

        const completedSessions = sessionItems.filter(
          (s) => s.status.toLowerCase() === "completed",
        ).length;
        const canceledSessions = sessionItems.filter(
          (s) => s.status.toLowerCase() === "canceled",
        ).length;
        const maxSessionNo = sessionItems.length > 0
          ? Math.max(...sessionItems.map((s) => s.displaySessionCount))
          : 0;

        return {
          cycleId,
          cycleTitle:
            cycleId === "no-cycle"
              ? "General History"
              : `Cycle ${cycleIndex + 1}`,
          firstDate,
          lastDate,
          totalSessions: sessionItems.length,
          completedSessions,
          canceledSessions,
          maxSessionNo,
          totalReviews: reviewItems.length,
          totalItems: mergedItems.length,
          sessions: mergedItems,
        };
      });

      cycleHistory.sort(
        (a, b) => new Date(b?.lastDate || 0) - new Date(a?.lastDate || 0),
      );
      setPatientHistory(cycleHistory);

      const totalRecords = cycleHistory.reduce(
        (sum, cycle) => sum + (cycle?.sessions?.length || 0),
        0,
      );
      const completedRecords = cycleHistory.reduce(
        (sum, cycle) =>
          sum +
          (cycle?.sessions || []).filter(
            (item) =>
              item?.itemType === "session" &&
              (item?.status || "").toLowerCase() === "completed",
          ).length,
        0,
      );
      const canceledRecords = cycleHistory.reduce(
        (sum, cycle) =>
          sum +
          (cycle?.sessions || []).filter(
            (item) =>
              item?.itemType === "session" &&
              (item?.status || "").toLowerCase() === "canceled",
          ).length,
        0,
      );
      const totalReviews = cycleHistory.reduce(
        (sum, cycle) =>
          sum +
          (cycle?.sessions || []).filter((item) => item?.itemType === "review")
            .length,
        0,
      );

      const currentSessionNo = cycleHistory.length > 0
        ? (cycleHistory[0].maxSessionNo ?? 0)
        : 0;

      setSessionCount({
        totalRecords,
        completed: completedRecords,
        canceled: canceledRecords,
        reviews: totalReviews,
        current: currentSessionNo,
      });
    } catch (error) {
      console.error("Failed to fetch history:", error);
      setPatientHistory([]);
      setSessionCount({
        totalRecords: 0,
        completed: 0,
        canceled: 0,
        reviews: 0,
      });
    }
  }, []);

  // ─────────────────────────────────────────────
  // PDF / EXCEL HELPERS
  // ─────────────────────────────────────────────
  const fmtDate = useCallback((d) => {
    if (!d) return "-";
    const x = new Date(d);
    if (isNaN(x.getTime())) return "-";
    return x.toLocaleDateString("en-GB");
  }, []);

  const formatDate = useCallback((date) => {
    if (!date) return "-";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "-";
    return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
  }, []);

  // date + time, e.g. "10 Aug 2026, 11:05 AM" - used for the session's
  // updatedAt timestamp in Session History
  const formatDateTime = useCallback((date) => {
    if (!date) return "-";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }, []);

  const getBase64FromUrl = useCallback(async (url) => {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }, []);

  const getSessionDateRange = useCallback(
    (sessions = []) => {
      if (!Array.isArray(sessions) || sessions.length === 0)
        return {
          sessionStartDate: "-",
          sessionEndDate: "-",
          lastSessionDate: "-",
        };
      const validDates = sessions
        .map((s) => s?.sessionDate)
        .filter(Boolean)
        .map((date) => new Date(date))
        .filter((d) => !isNaN(d.getTime()))
        .sort((a, b) => a - b);
      if (!validDates.length)
        return {
          sessionStartDate: "-",
          sessionEndDate: "-",
          lastSessionDate: "-",
        };
      return {
        sessionStartDate: formatDate(validDates[0]),
        sessionEndDate: formatDate(validDates[validDates.length - 1]),
        lastSessionDate: formatDate(validDates[validDates.length - 1]),
      };
    },
    [formatDate],
  );

  const downloadPatientsPdf = useCallback(
    async ({ title, rows, fileName }) => {
      const doc = new jsPDF();
      let logoBase64 = "";
      try {
        logoBase64 = await getBase64FromUrl(Logo);
      } catch (err) {
        console.log("Logo not loaded");
      }
      if (logoBase64) doc.addImage(logoBase64, "PNG", 14, 10, 20, 20);
      doc.setFontSize(16);
      doc.setTextColor(41, 128, 185);
      doc.text("NEO PHYSIO", 40, 18);
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(title, 40, 25);
      doc.setFontSize(10);
      doc.text(`Downloaded on: ${fmtDate(new Date())}`, 14, 35);
      doc.setDrawColor(41, 128, 185);
      doc.line(14, 38, 195, 38);
      autoTable(doc, {
        startY: 42,
        head: [
          [
            "#",
            "Patient Code",
            "Patient Name",
            "Age",
            "Gender",
            "Mobile",
            "Consultation",
            "Physio",
            "Status",
          ],
        ],
        body: rows.length
          ? rows.map((p, idx) => [
              idx + 1,
              p.patientCode || "-",
              p.patientName || "-",
              p.patientAge || "-",
              p.patientGenderId?.genderName || p.genderName || "-",
              p.patientNumber || "-",
              fmtDate(p.consultationDate),
              p.physioId?.physioName || p.physioName || "-",
              p.isRecovered ? "Recovered" : "Active",
            ])
          : [["", "No data", "", "", "", "", "", "", ""]],
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] },
        columnStyles: {
          0: { cellWidth: 8 },
          1: { cellWidth: 22 },
          2: { cellWidth: 35 },
          3: { cellWidth: 12 },
          4: { cellWidth: 18 },
          5: { cellWidth: 22 },
          6: { cellWidth: 22 },
          7: { cellWidth: 25 },
          8: { cellWidth: 16 },
        },
      });
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(9);
      doc.text("NEO PHYSIO - Patient Management System", 14, pageHeight - 10);
      doc.save(fileName);
    },
    [fmtDate, getBase64FromUrl],
  );

  const getPastMonthsRange = useCallback((monthsCount) => {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    const start = new Date(
      end.getFullYear(),
      end.getMonth() - (monthsCount - 1),
      1,
      0,
      0,
      0,
      0,
    );
    const toYMD = (d) => d.toISOString().slice(0, 10);
    return { startDate: toYMD(start), endDate: toYMD(end), start, end };
  }, []);

  const getCurrentMonthRange = useCallback(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );
    const toYMD = (d) => d.toISOString().slice(0, 10);
    return { startDate: toYMD(start), endDate: toYMD(end), start, end };
  }, []);

  const downloadPatientsByRange = useCallback(
    async ({ startDate, endDate, start, end }, filePrefix) => {
      const res = await apiRequest("Patient/downloadPatient", {
        method: "POST",
        body: JSON.stringify({ startDate, endDate, view: "all" }),
      });
      const title = `Patients (${start.toLocaleDateString("en-GB")} to ${end.toLocaleDateString("en-GB")})`;
      downloadPatientsPdf({
        title,
        rows: Array.isArray(res) ? res : [],
        fileName: `${filePrefix}_${startDate}_to_${endDate}.pdf`,
      });
    },
    [downloadPatientsPdf],
  );

  const downloadPatientsOfMonth = useCallback(
    () =>
      downloadPatientsByRange(getCurrentMonthRange(), "Patients_This_Month"),
    [downloadPatientsByRange, getCurrentMonthRange],
  );
  const downloadPatientsOfLastMonth = useCallback(
    () =>
      downloadPatientsByRange(getPastMonthsRange(1), "Patients_Last_1_Month"),
    [downloadPatientsByRange, getPastMonthsRange],
  );
  const downloadPatientsOfLast2Month = useCallback(
    () =>
      downloadPatientsByRange(getPastMonthsRange(2), "Patients_Last_2_Months"),
    [downloadPatientsByRange, getPastMonthsRange],
  );
  const downloadPatientsOfLast3Month = useCallback(
    () =>
      downloadPatientsByRange(getPastMonthsRange(3), "Patients_Last_3_Months"),
    [downloadPatientsByRange, getPastMonthsRange],
  );

  const downloadPatientsLastYear = useCallback(async () => {
    const res = await apiRequest("Patient/downloadPatient", {
      method: "POST",
      body: JSON.stringify({ rangeType: "lastYear", view: "all" }),
    });
    downloadPatientsPdf({
      title: "Last 1 Year Patients List",
      rows: Array.isArray(res) ? res : [],
      fileName: "Patients_Last_1_Year.pdf",
    });
  }, [downloadPatientsPdf]);

  const downloadPatientsPDFs = useCallback(async () => {
    try {
      const body = { month: selectedMonth, year: selectedYear, view: "all" };
      const res = await apiRequest("Patient/downloadPatientsMonthlyReport", {
        method: "POST",
        body: JSON.stringify(body),
      });
      const report = Array.isArray(res?.report) ? res.report : [];
      if (!report.length) {
        toast({
          title: "No Data",
          description: "No patient report found.",
          variant: "destructive",
        });
        return;
      }
      const doc = new jsPDF("landscape");
      let logoBase64 = "";
      try {
        logoBase64 = await getBase64FromUrl(Logo);
      } catch (err) {
        console.log("Logo not loaded");
      }
      if (logoBase64) doc.addImage(logoBase64, "PNG", 14, 10, 25, 25);
      doc.setFontSize(18);
      doc.setTextColor(41, 128, 185);
      doc.text("NEO PHYSIO", 45, 18);
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text("Monthly Patient Report", 45, 25);
      doc.setFontSize(10);
      doc.text(
        `Month: ${monthNames[selectedMonth - 1]} ${selectedYear}`,
        14,
        35,
      );
      doc.text(`Downloaded on: ${fmtDate(new Date())}`, 14, 42);
      doc.setDrawColor(41, 128, 185);
      doc.line(14, 45, 285, 45);
      const columns = [
        "S.No",
        "Patient Code",
        "Patient Name",
        "Age",
        "Gender",
        "Contact",
        "Condition",
        "Physio",
        "Start Date",
        "End Date",
        "Total Sessions",
        "Completed",
        "Cancelled",
        "Status",
      ];
      const rows = report.map((p, index) => {
        const { sessionStartDate, sessionEndDate } = getSessionDateRange(
          p.sessions,
        );
        return [
          index + 1,
          p.patientCode || "-",
          p.patientName || "-",
          p.age || "-",
          p.gender || "-",
          p.number || "-",
          p.condition || "-",
          p.assignedPhysio || "-",
          sessionStartDate,
          sessionEndDate,
          p.totalSessions ?? 0,
          p.completedSessions ?? 0,
          p.cancelledSessions ?? 0,
          p.recovered || (p.isRecovered ? "Recovered" : "Active"),
        ];
      });
      autoTable(doc, {
        startY: 50,
        head: [columns],
        body: rows,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [41, 128, 185] },
      });
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(9);
      doc.text("NEO PHYSIO - Patient Management System", 14, pageHeight - 10);
      doc.save(
        `Patients_Report_${monthNames[selectedMonth - 1]}_${selectedYear}.pdf`,
      );
    } catch (error) {
      console.error("PDF download error:", error);
      toast({
        title: "Error",
        description: "Failed to download monthly patient PDF.",
        variant: "destructive",
      });
    }
  }, [
    selectedMonth,
    selectedYear,
    fmtDate,
    getBase64FromUrl,
    getSessionDateRange,
  ]);

  const downloadPatientsExcel = useCallback(async () => {
    try {
      const body = { month: selectedMonth, year: selectedYear, view: "all" };
      const res = await apiRequest("Patient/downloadPatientsMonthlyReport", {
        method: "POST",
        body: JSON.stringify(body),
      });
      const report = Array.isArray(res?.report) ? res.report : [];
      if (!report.length) {
        toast({
          title: "No Data",
          description: "No patient report found.",
          variant: "destructive",
        });
        return;
      }
      const excelData = report.map((p, index) => {
        const { sessionStartDate, sessionEndDate, lastSessionDate } =
          getSessionDateRange(p.sessions);
        return {
          "S.No": index + 1,
          "Patient Code": p.patientCode || "-",
          "Patient Name": p.patientName || "-",
          Age: p.age || "-",
          Gender: p.gender || "-",
          Contact: p.number || "-",
          Address: p.address || "-",
          Condition: p.condition || "-",
          Physio: p.assignedPhysio || "-",
          "Consultation Date": formatDate(p.consultationDate),
          "Review Date": formatDate(p.reviewDate),
          "Session Start Date": sessionStartDate,
          "Session End Date": sessionEndDate,
          "Total Sessions": p.totalSessions ?? 0,
          Completed: p.completedSessions ?? 0,
          Cancelled: p.cancelledSessions ?? 0,
          Status: p.recovered || (p.isRecovered ? "Recovered" : "Active"),
        };
      });
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      worksheet["!cols"] = [
        { wch: 8 },
        { wch: 15 },
        { wch: 22 },
        { wch: 8 },
        { wch: 10 },
        { wch: 15 },
        { wch: 22 },
        { wch: 28 },
        { wch: 20 },
        { wch: 16 },
        { wch: 16 },
        { wch: 16 },
        { wch: 16 },
        { wch: 14 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
      ];
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Patients Report");
      XLSX.writeFile(
        workbook,
        `Patients_Report_${monthNames[selectedMonth - 1]}_${selectedYear}.xlsx`,
      );
    } catch (error) {
      console.error("Excel download error:", error);
      toast({
        title: "Error",
        description: "Failed to download Excel.",
        variant: "destructive",
      });
    }
  }, [selectedMonth, selectedYear, formatDate, getSessionDateRange]);

  const downloadFilteredPatientsPdf = useCallback(async () => {
    try {
      const rows = filteredPatients;
      if (!rows.length) {
        toast({
          title: "No Data",
          description: "No filtered patients found.",
          variant: "destructive",
        });
        return;
      }
      const doc = new jsPDF("l", "mm", "a4");
      let logoBase64 = "";
      try {
        logoBase64 = await getBase64FromUrl(Logo);
      } catch (err) {
        console.log("Logo not loaded");
      }
      if (logoBase64) doc.addImage(logoBase64, "PNG", 14, 10, 20, 20);
      doc.setFontSize(16);
      doc.setTextColor(41, 128, 185);
      doc.text("NEO PHYSIO", 40, 18);
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text("Filtered Patients Report", 40, 25);
      doc.setFontSize(10);
      doc.text(`Downloaded on: ${fmtDate(new Date())}`, 14, 35);
      doc.text(`Total: ${filteredPatients.length}`, 220, 35);
      doc.setDrawColor(41, 128, 185);
      doc.line(14, 38, 283, 38);
      autoTable(doc, {
        startY: 42,
        head: [
          [
            "#",
            "Patient Code",
            "Patient Name",
            "Age",
            "Gender",
            "Mobile",
            "Condition",
            "Physio",
            "Consultation",
            "Review",
            "Sessions",
            "Status",
          ],
        ],
        body: rows.map((p, idx) => [
          idx + 1,
          p.patientCode || "-",
          p.patientName || "-",
          p.patientAge || "-",
          p.patientGenderId?.genderName || p.genderName || "-",
          p.patientNumber || "-",
          p.patientCondition || "-",
          p.physioId?.physioName || p.physioName || "-",
          fmtDate(p.consultationDate),
          fmtDate(p.reviewDate),
          p.sessionCount ?? 0,
          p.isRecovered ? "Recovered" : "Active",
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] },
        columnStyles: {
          0: { cellWidth: 8 },
          1: { cellWidth: 22 },
          2: { cellWidth: 32 },
          3: { cellWidth: 10 },
          4: { cellWidth: 15 },
          5: { cellWidth: 22 },
          6: { cellWidth: 32 },
          7: { cellWidth: 24 },
          8: { cellWidth: 22 },
          9: { cellWidth: 22 },
          10: { cellWidth: 14 },
          11: { cellWidth: 18 },
        },
      });
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(9);
      doc.text("NEO PHYSIO - Patient Management System", 14, pageHeight - 10);
      doc.save("Filtered_Patients_Report.pdf");
    } catch (error) {
      console.error("Filtered PDF download error:", error);
      toast({
        title: "Error",
        description: "Failed to download filtered PDF.",
        variant: "destructive",
      });
    }
  }, [filteredPatients, fmtDate, getBase64FromUrl]);

  const downloadFilteredPatientsExcel = useCallback(() => {
    try {
      if (!filteredPatients?.length) {
        toast({
          title: "No Data",
          description: "No filtered patients found.",
          variant: "destructive",
        });
        return;
      }
      const excelData = filteredPatients.map((p, index) => ({
        "S.No": index + 1,
        "Patient Code": p.patientCode || "-",
        "Patient Name": p.patientName || "-",
        Age: p.patientAge || "-",
        Gender: p.patientGenderId?.genderName || p.genderName || "-",
        Contact: p.patientNumber || "-",
        Condition: p.patientCondition || "-",
        Physio: p.physioId?.physioName || p.physioName || "-",
        "Consultation Date": fmtDate(p.consultationDate),
        "Review Date": fmtDate(p.reviewDate),
        "No of Sessions": p.sessionCount ?? 0,
        Status: p.isRecovered ? "Recovered" : "Active",
      }));
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      worksheet["!cols"] = [
        { wch: 8 },
        { wch: 15 },
        { wch: 24 },
        { wch: 8 },
        { wch: 10 },
        { wch: 16 },
        { wch: 28 },
        { wch: 20 },
        { wch: 16 },
        { wch: 16 },
        { wch: 14 },
        { wch: 12 },
      ];
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Filtered Patients");
      XLSX.writeFile(workbook, "Filtered_Patients_Report.xlsx");
    } catch (error) {
      console.error("Filtered Excel download error:", error);
      toast({
        title: "Error",
        description: "Failed to download filtered Excel.",
        variant: "destructive",
      });
    }
  }, [filteredPatients, fmtDate]);
  const [selectedFields, setSelectedFields] = useState({
    reviewNumber: true,
    patientName: true,
    physioName: true,
    date: true,
    type: true,
    status: true,
    redFlag: true,
    feedback: false,
  });
  const handleSelectAll = (checked) => {
    const value = !!checked;

    setSelectedFields({
      reviewNumber: value,
      patientName: value,
      physioName: value,
      date: value,
      type: value,
      status: value,
      redFlag: value,
      feedback: value,
    });
  };
  const updateField = (key, value) => {
    setSelectedFields((prev) => ({
      ...prev,
      [key]: !!value,
    }));
  };
  const [openfeedbackdialog, setOpenfeedbackdialog] = useState(false);
  const [reviewFeedback, setReviewFeedback] = useState(false);
  const [openfeedbackdialogpdf, setOpenfeedbackdialogpdf] = useState(false);
  const [reviewFeedbackpdf, setReviewFeedbackpdf] = useState(false);

  const [sessionFields, setSessionFields] = useState({
    sessionCount: true,
    sessionCode: true,
    patientName: true,
    physioName: true,
    sessionDate: true,
    startTime: true,
    endTime: true,
    status: true,
    feedback: false,
  });
  const handleSessionSelectAll = (checked) => {
    const value = !!checked;

    setSessionFields({
      sessionCount: value,
      sessionCode: value,
      patientName: value,
      physioName: value,
      sessionDate: value,
      startTime: value,
      endTime: value,
      status: value,
      feedback: value,
    });
  };

  const downloadReview = useCallback(async () => {
    try {
      const rows = patientHistory
        .flatMap((cycle) => cycle.sessions || [])
        .filter((item) => {
          if (item.itemType !== "review") return false;

          const reviewDate = new Date(item.reviewDate);

          const from = reviewFromDate ? new Date(reviewFromDate) : null;

          const to = reviewToDate ? new Date(reviewToDate) : null;

          // FROM DATE
          if (from && reviewDate < from) return false;

          // TO DATE
          if (to) {
            to.setHours(23, 59, 59, 999);

            if (reviewDate > to) return false;
          }

          // REVIEW STATUS
          const status = item.reviewStatusId?.reviewStatusName?.toLowerCase();

          const noStatusSelected =
            !reviewStatus.completed && !reviewStatus.pending;

          // IF NO STATUS SELECTED -> SHOW ALL
          if (noStatusSelected) return true;

          if (reviewStatus.completed && status === "completed") return true;

          if (reviewStatus.pending && status === "pending") return true;

          return false;
        });
      if (!rows.length) {
        toast({
          title: "No Data",
          description: "No review sessions found.",
          variant: "destructive",
        });
        return;
      }

      const doc = new jsPDF("l", "mm", "a4");

      // HEADER
      doc.setFontSize(16);
      doc.setTextColor(41, 128, 185);
      doc.text("NEO PHYSIO", 40, 18);

      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text("Review History Report", 40, 25);

      doc.setFontSize(10);
      doc.text(`Downloaded on: ${fmtDate(new Date())}`, 14, 35);
      doc.text(`Total Reviews: ${rows.length}`, 220, 35);

      doc.line(14, 38, 283, 38);

      // DYNAMIC HEAD
      const headers = [];

      if (selectedFields.reviewNumber) headers.push("Review No");
      if (selectedFields.patientName) headers.push("Patient Name");
      if (selectedFields.physioName) headers.push("Physio Name");
      if (selectedFields.reviewDate) headers.push("Date");
      if (selectedFields.reviewType) headers.push("Type");
      if (selectedFields.status) headers.push("Status");
      if (selectedFields.redFlag) headers.push("Red Flag");
      if (selectedFields.feedback) headers.push("Feedback");

      // DYNAMIC BODY
      const body = rows.map((s, i) => {
        const row = [];

        if (selectedFields.reviewNumber) row.push(s.reviewNumber || i + 1);
        if (selectedFields.patientName)
          row.push(s.patientId?.patientName || "-");
        if (selectedFields.physioName) row.push(s.physioId?.physioName || "-");
        if (selectedFields.reviewDate) row.push(fmtDate(s.reviewDate));
        if (selectedFields.reviewType)
          row.push(s.reviewTypeId?.reviewTypeName || "-");
        if (selectedFields.status)
          row.push(s.reviewStatusId?.reviewStatusName || "-");
        if (selectedFields.redFlag) row.push(s.redFlags || "-");
        if (selectedFields.feedback) row.push(s.feedback || "-");

        return row;
      });

      autoTable(doc, {
        startY: 42,
        head: [headers],
        body,
        styles: {
          fontSize: 8,
          cellWidth: "wrap",
        },
        headStyles: {
          fillColor: [41, 128, 185],
        },
      });

      // FOOTER
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(9);
      doc.text("NEO PHYSIO - Patient Management System", 14, pageHeight - 10);

      doc.save("Review_History_Report.pdf");
    } catch (error) {
      console.error(error);
    }
  }, [
    patientHistory,
    fmtDate,
    selectedFields,
    reviewFromDate,
    reviewToDate,
    reviewStatus,
  ]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const downloadSessionHistory = useCallback(async () => {
    try {
      const rows = patientHistory
        .flatMap((cycle) => cycle.sessions || [])
        .filter((item) => {
          if (item.itemType !== "session") return false;

          const sessionDate = new Date(item.sessionDate);

          const from = fromDate ? new Date(fromDate) : null;
          const to = toDate ? new Date(toDate) : null;

          if (from && sessionDate < from) return false;

          if (to) {
            to.setHours(23, 59, 59, 999);

            if (sessionDate > to) return false;
          }

          const status = item.sessionStatusId?.sessionStatusName?.toLowerCase();

          const noStatusSelected =
            !sessionStatus.completed &&
            !sessionStatus.canceled &&
            !sessionStatus.scheduled;

          if (noStatusSelected) return true;

          if (sessionStatus.completed && status === "completed") return true;

          if (sessionStatus.canceled && status === "canceled") return true;

          if (sessionStatus.scheduled && status === "scheduled") return true;

          return false;
        });
      if (!rows.length) return;

      const doc = new jsPDF("l", "mm", "a4");

      const headers = [];

      if (sessionFields.sessionCount) headers.push("Session No");
      if (sessionFields.sessionCode) headers.push("Session Code");
      if (sessionFields.patientName) headers.push("Patient Name");
      if (sessionFields.physioName) headers.push("Physio Name");
      if (sessionFields.sessionDate) headers.push("Session Date");
      if (sessionFields.startTime) headers.push("Start Time");
      if (sessionFields.endTime) headers.push("End Time");
      if (sessionFields.status) headers.push("Status");
      if (sessionFields.feedback) headers.push("Feedback");

      const body = rows.map((s, i) => {
        const row = [];

        if (sessionFields.sessionCount)
          row.push(s.displaySessionCount || i + 1);

        if (sessionFields.sessionCode) row.push(s.sessionCode || "-");

        if (sessionFields.patientName)
          row.push(s.patientId?.patientName || "-");

        if (sessionFields.physioName) row.push(s.physioId?.physioName || "-");

        if (sessionFields.sessionDate) row.push(fmtDate(s.sessionDate));

        if (sessionFields.startTime) row.push(s.sessionFromTime || "-");

        if (sessionFields.endTime) row.push(s.sessionToTime || "-");

        if (sessionFields.status)
          row.push(s.sessionStatusId?.sessionStatusName || "-");

        if (sessionFields.feedback) row.push(s.feedback || "-");

        return row;
      });

      autoTable(doc, {
        startY: 42,
        head: [headers],
        body,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] },
      });

      doc.save("Session_History_Report.pdf");
    } catch (err) {
      console.error(err);
    }
  }, [patientHistory, fmtDate, sessionFields, fromDate, toDate, sessionStatus]);
  const downloadSessionHistoryExcel = useCallback(() => {
    try {
      const rows = patientHistory
        .flatMap((cycle) => cycle.sessions || [])
        .filter((item) => {
          if (item.itemType !== "session") return false;

          const sessionDate = new Date(item.sessionDate);

          const from = fromDate ? new Date(fromDate) : null;
          const to = toDate ? new Date(toDate) : null;

          if (from && sessionDate < from) return false;

          if (to) {
            to.setHours(23, 59, 59, 999);

            if (sessionDate > to) return false;
          }

          const status = item.sessionStatusId?.sessionStatusName?.toLowerCase();

          const noStatusSelected =
            !sessionStatus.completed &&
            !sessionStatus.canceled &&
            !sessionStatus.scheduled;

          if (noStatusSelected) return true;

          if (sessionStatus.completed && status === "completed") return true;

          if (sessionStatus.canceled && status === "canceled") return true;

          if (sessionStatus.scheduled && status === "scheduled") return true;

          return false;
        });
      if (!rows.length) return;

      // ✅ Define ORDERED columns
      const excelData = rows.map((s, i) => {
        const row = {};

        if (sessionFields.sessionCount)
          row["Session No"] = s.displaySessionCount || i + 1;

        if (sessionFields.sessionCode)
          row["Session Code"] = s.sessionCode || "-";

        if (sessionFields.patientName)
          row["Patient Name"] = s.patientId?.patientName || "-";

        if (sessionFields.physioName)
          row["Physio Name"] = s.physioId?.physioName || "-";

        if (sessionFields.sessionDate)
          row["Session Date"] = fmtDate(s.sessionDate);

        if (sessionFields.startTime)
          row["Start Time"] = s.sessionFromTime || "-";

        if (sessionFields.endTime) row["End Time"] = s.sessionToTime || "-";

        if (sessionFields.status)
          row["Status"] = s.sessionStatusId?.sessionStatusName || "-";

        if (sessionFields.feedback) row["Feedback"] = s.feedback || "-";

        return row;
      });

      // ✅ FIX: Build stable column list (IMPORTANT)
      const columns = [];

      if (sessionFields.sessionCount) columns.push("Session No");
      if (sessionFields.sessionCode) columns.push("Session Code");
      if (sessionFields.patientName) columns.push("Patient Name");
      if (sessionFields.physioName) columns.push("Physio Name");
      if (sessionFields.sessionDate) columns.push("Session Date");
      if (sessionFields.startTime) columns.push("Start Time");
      if (sessionFields.endTime) columns.push("End Time");
      if (sessionFields.status) columns.push("Status");
      if (sessionFields.feedback) columns.push("Feedback");

      // ✅ Convert properly ordered data
      const finalData = rows.map((s, i) => {
        const obj = {};

        columns.forEach((col) => {
          switch (col) {
            case "Session No":
              obj[col] = s.displaySessionCount || i + 1;
              break;
            case "Session Code":
              obj[col] = s.sessionCode || "-";
              break;
            case "Patient Name":
              obj[col] = s.patientId?.patientName || "-";
              break;
            case "Physio Name":
              obj[col] = s.physioId?.physioName || "-";
              break;
            case "Session Date":
              obj[col] = fmtDate(s.sessionDate);
              break;
            case "Start Time":
              obj[col] = s.sessionFromTime || "-";
              break;
            case "End Time":
              obj[col] = s.sessionToTime || "-";
              break;
            case "Status":
              obj[col] = s.sessionStatusId?.sessionStatusName || "-";
              break;
            case "Feedback":
              obj[col] = s.feedback || "-";
              break;
            default:
              obj[col] = "-";
          }
        });

        return obj;
      });

      // ✅ Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(finalData);

      // ✅ Auto column width safely
      worksheet["!cols"] = columns.map(() => ({ wch: 20 }));

      // ✅ Workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sessions");

      XLSX.writeFile(workbook, "Session_History_Report.xlsx");
    } catch (err) {
      console.error("Excel export error:", err);
    }
  }, [patientHistory, fmtDate, sessionFields, fromDate, toDate, sessionStatus]);
  const downloadReviewHistoryExcel = useCallback(() => {
    try {
      const rows = patientHistory
        .flatMap((cycle) => cycle.sessions || [])
        .filter((item) => {
          if (item.itemType !== "review") return false;

          const reviewDate = new Date(item.reviewDate);

          const from = reviewFromDate ? new Date(reviewFromDate) : null;

          const to = reviewToDate ? new Date(reviewToDate) : null;

          // FROM DATE
          if (from && reviewDate < from) return false;

          // TO DATE
          if (to) {
            to.setHours(23, 59, 59, 999);

            if (reviewDate > to) return false;
          }

          // STATUS FILTER
          const status = item.reviewStatusId?.reviewStatusName?.toLowerCase();

          const noStatusSelected =
            !reviewStatus.completed && !reviewStatus.pending;

          // IF NOTHING SELECTED -> SHOW ALL
          if (noStatusSelected) return true;

          if (reviewStatus.completed && status === "completed") return true;

          if (reviewStatus.pending && status === "pending") return true;

          return false;
        });

      if (!rows.length) {
        toast({
          title: "No Data",
          description: "No review sessions found.",
          variant: "destructive",
        });
        return;
      }

      // ✅ BUILD DYNAMIC ROWS
      const excelData = rows.map((s, i) => {
        const row = {};

        if (selectedFields.reviewNumber)
          row["Review No"] = s.reviewNumber || i + 1;

        if (selectedFields.patientName)
          row["Patient Name"] = s.patientId?.patientName || "-";

        if (selectedFields.physioName)
          row["Physio Name"] = s.physioId?.physioName || "-";

        if (selectedFields.reviewDate)
          row["Review Date"] = fmtDate(s.reviewDate);

        if (selectedFields.reviewType)
          row["Review Type"] = s.reviewTypeId?.reviewTypeName || "-";

        if (selectedFields.status)
          row["Status"] = s.reviewStatusId?.reviewStatusName || "-";

        if (selectedFields.redFlag) row["Red Flag"] = s.redFlags || "No";

        if (selectedFields.feedback) row["Feedback"] = s.feedback || "-";

        return row;
      });

      // ✅ CREATE WORKSHEET
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // ✅ AUTO COLUMN WIDTH
      const colWidths = Object.keys(excelData[0] || {}).map(() => ({
        wch: 20,
      }));
      worksheet["!cols"] = colWidths;

      // ✅ WORKBOOK
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Reviews");

      XLSX.writeFile(workbook, "Review_History_Report.xlsx");
    } catch (error) {
      console.error("Excel download error:", error);
    }
  }, [
    patientHistory,
    fmtDate,
    selectedFields,
    reviewFromDate,
    reviewToDate,
    reviewStatus,
  ]);
  const handleDownloadRecoveredPatientsPDF = useCallback(async () => {
    if (!recoveredPatients || recoveredPatients.length === 0) {
      toast({
        title: "No Data",
        description: "No recovered patients available",
        variant: "destructive",
      });
      return;
    }
    const doc = new jsPDF();
    let logoBase64 = "";
    try {
      logoBase64 = await getBase64FromUrl(Logo);
    } catch (err) {
      console.log("Logo not loaded");
    }
    if (logoBase64) doc.addImage(logoBase64, "PNG", 14, 10, 20, 20);
    doc.setFontSize(18);
    doc.setTextColor(41, 128, 185);
    doc.text("NEO PHYSIO", 40, 18);
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("Recovered Patients Report", 40, 26);
    doc.setFontSize(10);
    doc.text(`Downloaded on: ${format(new Date(), "PPpp")}`, 14, 35);
    const tableColumn = [
      "Patient Code",
      "Name",
      "Age/Gender",
      "Contact",
      "Condition",
      "Recovered Date",
      "Physio",
      "Sessions",
    ];
    const tableRows = recoveredPatients.map((p) => [
      p.patientCode || "-",
      p.patientName || "-",
      `${p.patientAge || "-"} / ${getGenderName(p)}`,
      p.patientNumber || "-",
      p.patientCondition || "-",
      p.recoveredAt ? format(new Date(p.recoveredAt), "PP") : "N/A",
      p.physioId?.physioName || "-",
      p.sessionCount || 0,
    ]);
    autoTable(doc, {
      startY: 42,
      head: [tableColumn],
      body: tableRows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
    });
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(9);
    doc.text("NEO PHYSIO - Patient Management System", 14, pageHeight - 10);
    doc.save("NEO_PHYSIO_Recovered_Patients.pdf");
  }, [recoveredPatients, getBase64FromUrl]);

  const handleDownloadRecovered = useCallback(() => {
    if (!recoveredPatients || recoveredPatients.length === 0) {
      alert("No recovered patients available");
      return;
    }
    const data = recoveredPatients.map((p) => ({
      PatientCode: p.patientCode,
      Name: p.patientName,
      Age: p.patientAge,
      Gender: p.patientGenderId?.genderName,
      Contact: p.patientNumber,
      Condition: p.patientCondition,
      Sessions: p.sessionCount || 0,
      Physio: p.physioId?.physioName,
      ReviewDate: p.reviewDate
        ? format(new Date(p.reviewDate), "dd-MM-yyyy")
        : "N/A",
      RecoveredDate: p.recoveredAt
        ? format(new Date(p.recoveredAt), "dd-MM-yyyy")
        : "N/A",
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Recovered Patients");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    saveAs(
      new Blob([excelBuffer], { type: "application/octet-stream" }),
      "Recovered_Patients.xlsx",
    );
  }, [recoveredPatients]);

  // ─────────────────────────────────────────────
  // SESSION STYLE HELPER
  // ─────────────────────────────────────────────
  const getSessionStyle = useCallback((status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-100 border-green-300";
      case "canceled":
        return "bg-red-100 border-red-300";
      case "scheduled":
        return "bg-blue-100 border-blue-300";
      default:
        return "bg-white border-gray-200";
    }
  }, []);

  // ─────────────────────────────────────────────
  // RENDER HELPERS
  // ─────────────────────────────────────────────
  const renderRadioGroup = useCallback(
    (label, name, value, id, group, dynamic) => (
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
    ),
    [patientForm, handleRadio, handleRadioChange],
  );

  // FIX 10: TabButton stable reference
  const TabButton = useCallback(
    ({ id, label, icon: Icon, isHistory }) => (
      <button
        onClick={() => (isHistory ? setActiveHistoryTab(id) : setActiveTab(id))}
        className={`relative flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all rounded-md ${
          (isHistory ? activeHistoryTab : activeTab) === id
            ? "bg-blue-600 text-white shadow-md"
            : "text-slate-500 hover:text-white hover:bg-blue-900"
        }`}
        type="button"
      >
        {Icon && <Icon className="w-4 h-4" />}
        {label}
        {(isHistory ? activeHistoryTab : activeTab) === id && (
          <motion.div
            layoutId={isHistory ? "activeHistoryTab" : "activetabpatient"}
            className="absolute inset-0 rounded-md bg-blue-600 -z-10"
          />
        )}
      </button>
    ),
    [activeTab, activeHistoryTab],
  );

  // ═══════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════
  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      <div className="w-full flex justify-center">
        <div className="flex items-center gap-2 p-1 rounded-lg border border-slate-800 overflow-x-auto max-w-full w-full sm:w-auto">
          <TabButton id="patient" label="PATIENTS" icon={User2} />
          <TabButton id="recover" label="RECOVERED" icon={UserCheck} />
        </div>
      </div>

      {activeTab === "patient" && (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center"
          >
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-2 break-words">
                Patient Management
              </h1>
              <p className="text-gray-600 text-sm sm:text-sm md:text-base">
                Manage registered patients and their treatment plans.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 w-full md:w-auto md:justify-end">
              <Button
                variant="outline"
                onClick={() => setDownloadDialog(true)}
                className="w-full sm:w-auto"
              >
                <FileText className="mr-2 h-4 w-4" />
                Download
              </Button>
              <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center flex-wrap w-full sm:w-auto">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="border rounded-md px-3 py-2 text-sm w-full sm:w-auto"
                >
                  {monthNames.map((month, index) => (
                    <option key={month} value={index + 1}>
                      {month}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="border rounded-md px-3 py-2 text-sm w-full sm:w-28"
                  min="2020"
                  max="2100"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full sm:w-auto">
                  <Button onClick={downloadPatientsPDFs} className="w-full">
                    Download PDF
                  </Button>
                  <Button onClick={downloadPatientsExcel} className="w-full">
                    Download Excel
                  </Button>
                </div>
              </div>
              {Permissions.isAdd && (
                <Button onClick={handleNewPatient} className="w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-4 w-4" /> New Patient
                </Button>
              )}
            </div>
          </motion.div>

          <Card className="medical-card">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-lg sm:text-xl">
                Search Patients
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-center">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, contact or Patient ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
                <div className="w-full">
                  <Input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select
                  value={selectedPhysioId}
                  onValueChange={(v) => setSelectedPhysioId(v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filter by Physiotherapist" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Physiotherapists</SelectItem>
                    {physios.map((p) => (
                      <SelectItem key={p._id} value={p._id}>
                        {p.physioName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={downloadFilteredPatientsPdf}
                  >
                    Export Filtered PDF
                  </Button>
                  <Button
                    variant="outline"
                    onClick={downloadFilteredPatientsExcel}
                  >
                    Export Filtered Excel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="bg-white rounded-xl shadow-sm border p-4 flex flex-col gap-2">
            <p className="text-sm text-gray-500">New Patients This Month</p>
            <p className="text-2xl font-bold">{thisMonthCount}</p>
            <p className={`text-sm font-medium ${getGrowthColor()}`}>
              {getGrowthSymbol()} {Math.abs(growth)}% vs last month
            </p>
            <p className="text-xs text-gray-400">
              Last month: {lastMonthCount}
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="medical-card">
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="text-lg sm:text-xl">
                  Patients ({filteredPatients.length})
                </CardTitle>
                <CardDescription>
                  All registered patients in the system
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                {/* Desktop table */}
                <div className="overflow-x-auto hidden sm:block">
                  <table className="min-w-full text-sm border rounded-lg">
                    <thead className="bg-gray-100 text-gray-700">
                      <tr>
                        <th className="px-3 py-2 text-left">Patient</th>
                        {user?.role !== "HOD" && (
                          <th className="px-3 py-2 text-left">Age / Gender</th>
                        )}
                        {user?.role !== "HOD" && (
                          <th className="px-3 py-2 text-left hidden md:table-cell">
                            Contact
                          </th>
                        )}
                        <th className="px-3 py-2 text-left hidden md:table-cell">
                          No of Sessions
                        </th>
                        <th className="px-3 py-2 text-left hidden md:table-cell">
                          Next 26th session date
                        </th>
                        <th className="px-3 py-2 text-left hidden md:table-cell">
                          Condition
                        </th>
                        {user?.role !== "HOD" && (
                          <th className="px-3 py-2 text-left hidden lg:table-cell">
                            Consultation
                          </th>
                        )}
                        <th className="px-3 py-2 text-left hidden lg:table-cell">
                          Review
                        </th>
                        <th className="px-3 py-2 text-left">Physio</th>
                        <th className="px-3 py-2 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* FIX: Using memoized PatientRow with pre-computed data */}
                      {filteredPatients.map((patient) => {
                        const computed =
                          patientComputedData.get(patient._id) || {};
                        return (
                          <PatientRow
                            key={patient._id}
                            patient={patient}
                            user={user}
                            Permissions={Permissions}
                            onViewConsultation={handleViewConsultation}
                            onScheduleReview={handleScheduleReview}
                            onViewHistory={handleViewHistory}
                            onEditPatient={handleEditPatient}
                            onDeletePatient={deletePatient}
                            onAssignPhysio={openAssignPhysioDialog}
                            onConsentClick={handleConsentClick}
                            onViewPatientDocs={handleViewPatientDocs}
                            onRecoveryAction={handleRecoveryActionClick}
                            sessionResult={
                              patientComputedData.get(patient._id)
                                ?.sessionResult
                            }
                            badge={patientComputedData.get(patient._id)?.badge}
                            isMilestone={patientComputedData.get(patient._id)?.isMilestone}
                          />
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* FIX: Mobile cards — single map, no nested maps */}
                <div className="grid grid-cols-1 gap-4 sm:hidden">
                  {filteredPatients.map((patient) => {
                    const computed = patientComputedData.get(patient._id) || {};
                    return (
                      <PatientCard
                        key={patient._id}
                        patient={patient}
                        user={user}
                        Permissions={Permissions}
                        onViewConsultation={handleViewConsultation}
                        onScheduleReview={handleScheduleReview}
                        onViewHistory={handleViewHistory}
                        onEditPatient={handleEditPatient}
                        onDeletePatient={deletePatient}
                        onAssignPhysio={openAssignPhysioDialog}
                        onConsentClick={handleConsentClick}
                        onViewPatientDocs={handleViewPatientDocs}
                        onRecoveryAction={handleRecoveryActionClick}
                        sessionResult={
                          patientComputedData.get(patient._id)?.sessionResult
                        }
                        badge={patientComputedData.get(patient._id)?.badge}
                        isMilestone={patientComputedData.get(patient._id)?.isMilestone}
                      />
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}

      {/* Download Dialog */}
      <Dialog open={downloadDialog} onOpenChange={setDownloadDialog}>
        <DialogContent className="w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Download Patient Report</DialogTitle>
            <DialogDescription>
              Choose which report you want to download as PDF.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Button
              className="w-full justify-start"
              onClick={downloadPatientsOfMonth}
              disabled={downloadLoading}
            >
              <FileText className="mr-2 h-4 w-4" />
              Patients of the Month
            </Button>
            <Button
              className="w-full justify-start"
              onClick={downloadPatientsOfLastMonth}
              disabled={downloadLoading}
            >
              <FileText className="mr-2 h-4 w-4" />
              Patients of the Last Month
            </Button>
            <Button
              className="w-full justify-start"
              onClick={downloadPatientsOfLast2Month}
              disabled={downloadLoading}
            >
              <FileText className="mr-2 h-4 w-4" />
              Patients of the Last 2 Month
            </Button>
            <Button
              className="w-full justify-start"
              onClick={downloadPatientsOfLast3Month}
              disabled={downloadLoading}
            >
              <FileText className="mr-2 h-4 w-4" />
              Patients of the Last 3 Month
            </Button>
            <Button
              className="w-full justify-start"
              onClick={downloadPatientsLastYear}
              disabled={downloadLoading}
            >
              <FileText className="mr-2 h-4 w-4" />
              Last 1 Year Patients List
            </Button>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDownloadDialog(false)}
              disabled={downloadLoading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {activeTab === "recover" && (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center"
          >
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-2 break-words">
                Recovered Patient Management
              </h1>
              <p className="text-gray-600 text-sm sm:text-sm md:text-base">
                Manage registered patients and their treatment plans.
              </p>
            </div>
            <Button onClick={handleDownloadRecovered}>
              Download Recovered Patients
            </Button>
            <Button
              onClick={handleDownloadRecoveredPatientsPDF}
              variant="outline"
              className="w-full sm:w-auto"
            >
              Download Recovered PDF
            </Button>
            {Permissions.isAdd && (
              <Button onClick={handleNewPatient} className="w-full sm:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" /> New Patient
              </Button>
            )}
          </motion.div>

          <Card className="medical-card">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-lg sm:text-xl">
                Search Patients
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-center">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, contact or Patient ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
                {user?.role !== "Physio" && (
                  <div className="w-full">
                    <Input
                      type="date"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="w-full"
                    />
                  </div>
                )}
                <Select
                  value={selectedPhysioId}
                  onValueChange={(v) => setSelectedPhysioId(v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filter by Physiotherapist" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Physiotherapists</SelectItem>
                    {physios.map((p) => (
                      <SelectItem key={p._id} value={p._id}>
                        {p.physioName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="bg-white rounded-xl shadow-sm border p-4 flex flex-col gap-2">
            <p className="text-sm text-gray-500">Recovery Rate (This Month)</p>
            <p className="text-2xl font-bold text-green-600">{recoveryRate}%</p>
            <p className="text-sm font-medium text-green-600">
              {thisMonthRecoveredCount} recovered this month
            </p>
            <p className="text-xs text-gray-400">
              of {filteredPatients.length} total patients
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="medical-card">
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="text-lg sm:text-xl">
                  Recovered Patients ({recoveredPatients.length})
                </CardTitle>
                <CardDescription>
                  All Recovered patients in the system
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                {/* Desktop table */}
                <div className="overflow-x-auto hidden sm:block">
                  <table className="min-w-full text-sm border rounded-lg">
                    <thead className="bg-gray-100 text-gray-700">
                      <tr>
                        <th className="px-3 py-2 text-left">Patient</th>
                        {user?.role !== "HOD" && (
                          <th className="px-3 py-2 text-left">Age / Gender</th>
                        )}
                        {user?.role !== "HOD" && (
                          <th className="px-3 py-2 text-left hidden md:table-cell">
                            Contact
                          </th>
                        )}
                        <th className="px-3 py-2 text-left hidden md:table-cell">
                          No of Sessions
                        </th>
                        <th className="px-3 py-2 text-left hidden md:table-cell">
                          Condition
                        </th>
                        {user?.role !== "HOD" && (
                          <th className="px-3 py-2 text-left hidden lg:table-cell">
                            Consultation
                          </th>
                        )}
                        <th className="px-3 py-2 text-left hidden lg:table-cell">
                          Review
                        </th>
                        <th className="px-3 py-2 text-left hidden lg:table-cell">
                          Recovered Date
                        </th>
                        <th className="px-3 py-2 text-left">Physio</th>
                        <th className="px-3 py-2 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recoveredPatients.map((patient) => (
                        <RecoveredPatientRow
                          key={patient._id}
                          patient={patient}
                          user={user}
                          Permissions={Permissions}
                          onViewConsultation={handleViewConsultation}
                          onScheduleReview={handleScheduleReview}
                          onViewHistory={handleViewHistory}
                          onEditPatient={handleEditPatient}
                          onDeletePatient={deletePatient}
                          onAssignPhysio={openAssignPhysioDialog}
                          onConsentClick={handleConsentClick}
                          onRecoveryAction={handleRecoveryActionClick}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile recovered cards */}
                <div className="grid grid-cols-1 gap-4 sm:hidden">
                  {recoveredPatients.map((patient) => (
                    <motion.div
                      key={patient._id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow flex flex-col"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                          <User className="text-blue-600" size={20} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-800 break-words">
                            {patient.patientName}
                          </h3>
                          <p className="text-sm text-gray-600 break-all">
                            {patient.patientCode}
                          </p>
                          <p className="text-sm text-gray-600 break-words">
                            {patient.patientAge} years, {getGenderName(patient)}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-1 mb-4 flex-grow text-sm">
                        <p>
                          <strong>Contact:</strong> {patient.patientNumber}
                        </p>
                        <p>
                          <strong>Consultation Date:</strong>{" "}
                          {patient.consultationDate
                            ? format(new Date(patient.consultationDate), "PP")
                            : "Not set"}
                        </p>
                        {user?.role === "HOD" && (
                          <>
                            <p>
                              <strong>Condition:</strong>{" "}
                              {patient.patientCondition}
                            </p>
                            <p>
                              <strong>No of Sessions:</strong>{" "}
                              {patient.sessionCount}
                            </p>
                          </>
                        )}
                        <p>
                          <strong>Review Date:</strong>{" "}
                          {patient.reviewDate
                            ? format(new Date(patient.reviewDate), "PP")
                            : "N/A"}
                        </p>
                        <p>
                          <strong>Recovered Date:</strong>{" "}
                          {patient.recoveredAt
                            ? format(new Date(patient.recoveredAt), "PP")
                            : "N/A"}
                        </p>
                        <p>
                          <strong>Session Count:</strong>{" "}
                          {patient.sessionCount || 0}
                        </p>
                        <p>Physio: {patient.physioId?.physioName}</p>
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-2">
                        <Button
                          size="sm"
                          variant={
                            patient.isConsentReceived ? "secondary" : "default"
                          }
                          onClick={() => handleConsentClick(patient)}
                        >
                          {patient.isConsentReceived ? (
                            <CheckCircle
                              size={14}
                              className="text-green-600 pointer-events-none"
                            />
                          ) : (
                            <Circle size={14} className="pointer-events-none" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => openAssignPhysioDialog(patient)}
                        >
                          {patient.physioId ? (
                            <UserCheck size={14} />
                          ) : (
                            <UserPlus size={14} />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewConsultation(patient)}
                        >
                          <FileText size={14} />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleScheduleReview(patient)}
                        >
                          <CalendarIcon size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewHistory(patient)}
                        >
                          <History size={14} />
                        </Button>
                        {Permissions.isEdit && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditPatient(patient)}
                          >
                            <Edit size={14} />
                          </Button>
                        )}
                        {Permissions.isDelete && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive">
                                <Trash2 size={14} />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="w-[95vw] max-w-md">
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete patient?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete the patient.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                <AlertDialogCancel className="w-full sm:w-auto">
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  className="w-full sm:w-auto"
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
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
      <Dialog open={isDocOpen} onOpenChange={setIsDocOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPatientName} - Documents</DialogTitle>
          </DialogHeader>

          {patientDocs.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {patientDocs.map((doc, index) => {
                const fileUrl = `http://localhost:8002${doc.fileUrl}`;
                const isImage = doc?.fileType?.startsWith("image/");

                return (
                  <div key={index} className="border rounded-lg p-2 space-y-2">
                    {isImage ? (
                      <img
                        src={fileUrl}
                        alt={doc.fileName}
                        className="w-full h-40 object-cover rounded cursor-pointer"
                        onClick={() => window.open(fileUrl, "_blank")}
                      />
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => window.open(fileUrl, "_blank")}
                      >
                        View File
                      </Button>
                    )}

                    <p className="text-xs text-center break-all">
                      {doc.fileName}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center">
              No documents found
            </p>
          )}
        </DialogContent>
      </Dialog>

      {/* Patient Details Dialog */}
      <PatientDetailsDialog
        isOpen={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        patient={viewingPatient}
      />

      {/* Review Dialog */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[95vh] flex flex-col p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>
              Review Goal for {reviewingPatient?.patientName}
            </DialogTitle>
            <DialogDescription>
              Update feedback and satisfaction for the current goal.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-1 sm:pr-4">
            <div className="space-y-4 pt-4">
              <div>
                <Label className="font-semibold">Current Goal</Label>
                <p className="text-sm text-gray-700 p-2 bg-gray-100 rounded-md mt-1 break-words">
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
          <DialogFooter className="pt-4 flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsReviewOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleUpdateFeedback}
              className="w-full sm:w-auto"
            >
              Update Feedback Only
            </Button>
            <Button
              type="button"
              onClick={handleLogAndOpenNewGoal}
              className="w-full sm:w-auto"
            >
              Log Goal & Set New One
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Goal Dialog */}
      <Dialog open={isNewGoalOpen} onOpenChange={setIsNewGoalOpen}>
        <DialogContent className="w-[95vw] max-w-lg p-4 sm:p-6">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newGoalDuration">
                  New Goal Duration (days)
                </Label>
                <Input
                  id="newGoalDuration"
                  type="number"
                  onWheel={(e) => e.target.blur()}
                  value={newGoalForm.newGoalDuration}
                  onChange={(e) =>
                    setNewGoalForm((p) => ({
                      ...p,
                      newGoalDuration: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsNewGoalOpen(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button type="submit" className="w-full sm:w-auto">
                Set New Goal
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="w-[95vw] md:max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Patient History: {historyPatient?.patientName || "Unknown"}
            </DialogTitle>
            <DialogDescription>
              Chronological log of all sessions and reviews.
            </DialogDescription>
          </DialogHeader>
          <div className="mb-3 grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
            {[
              ["Total Records", sessionCount?.totalRecords ?? 0],
              ["Completed", sessionCount?.completed ?? 0],
              ["Canceled", sessionCount?.canceled ?? 0],
              ["Reviews", sessionCount?.reviews ?? 0],
              ["Current Session No", sessionCount?.current ?? 0],
            ].map(([label, val]) => (
              <div key={label} className="rounded-lg border p-2 bg-slate-50">
                <p className="text-gray-500">{label}</p>
                <p className="font-semibold">{val}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mb-4">
            <TabButton id="sessions" label="Sessions" isHistory />
            <TabButton id="reviews" label="Reviews" isHistory />
          </div>
          <div className="flex-1 overflow-y-auto pr-1 sm:pr-4 mt-2">
            <div className="relative pl-6">
              <div
                className="absolute left-0 top-0 h-full w-0.5 bg-gray-200"
                style={{ transform: "translateX(2.5px)" }}
              />
              {patientHistory && patientHistory.length > 0 ? (
                patientHistory.map((cycle) => {
                  const filteredItems =
                    activeHistoryTab === "sessions"
                      ? cycle.sessions.filter(
                          (item) => item.itemType === "session",
                        )
                      : cycle.sessions.filter(
                          (item) => item.itemType === "review",
                        );
                  if (filteredItems.length === 0) return null;
                  return (
                    <div
                      key={cycle.cycleId}
                      className="mb-6 border rounded-lg p-4 bg-white"
                    >
                      {activeHistoryTab === "sessions" && (
                        <>
                          <div className="flex gap-[10px]">
                            <Button
                              onClick={() => setOpenPdfDialog(true)}
                              className="w-full"
                            >
                              Download History
                            </Button>
                            <Button
                              onClick={() => setOpenExcelDialog(true)}
                              className="w-full"
                            >
                              Download History (Excel)
                            </Button>
                          </div>
                        </>
                      )}
                      {activeHistoryTab === "reviews" && (
                        <>
                          <div className="flex gap-[10px]">
                            {" "}
                            <Button
                              onClick={() => setOpenfeedbackdialogpdf(true)}
                              className="w-full"
                            >
                              Download Review
                            </Button>
                            <Button
                              onClick={() => setOpenfeedbackdialog(true)}
                              className="w-full"
                            >
                              Download Review (Excel)
                            </Button>
                          </div>
                        </>
                      )}
                      <h3 className="text-lg font-semibold text-blue-600 mb-2">
                        {cycle.cycleTitle}
                      </h3>
                      <p className="text-sm text-gray-500 mb-1">
                        {formatDate(cycle.firstDate)} to{" "}
                        {formatDate(cycle.lastDate)}
                      </p>
                      <p className="text-xs text-gray-500 mb-4">
                        Completed: {cycle.completedSessions ?? 0} | Canceled:{" "}
                        {cycle.canceledSessions ?? 0} | Reviews:{" "}
                        {cycle.totalReviews ?? 0}
                      </p>

                      <div className="space-y-3">
                        {filteredItems.map((item, index) => (
                          <div
                            key={`${item.itemType}-${item._id || index}`}
                            className={`border rounded-md p-3 flex flex-col gap-1 ${item.itemType === "review" ? "bg-blue-50 border-blue-200" : getSessionStyle(item.status)}`}
                          >
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="font-medium">{item.title}</div>
                              <span
                                className={`text-xs px-2 py-1 rounded-full font-medium ${item.itemType === "review" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}
                              >
                                {item.itemType === "review"
                                  ? "Review"
                                  : "Session"}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">
                              Date: {formatDate(item.date)}
                            </div>
                            <div className="text-sm font-medium">
                              Status:{" "}
                              <span className="capitalize">
                                {item.status || "N/A"}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">
                              Physio: {item.physioName || "N/A"}
                            </div>
                            {item.itemType === "session" ? (
                              <>
                                <div className="text-sm text-gray-600">
                                  Time: {item.sessionFromTime || "-"} -{" "}
                                  {item.sessionToTime || "-"}
                                </div>
                                <div className="text-sm text-gray-600">
                                  Feedback: {item.feedback || "No feedback"}
                                </div>
                                <div className="text-sm text-gray-600">
                                  Updated Date &amp; Time:{" "}
                                  {formatDateTime(item.updatedAt)}
                                </div>
                                <div className="text-sm text-gray-600">
                                  Updated By: {item.updatedBy || "-"}
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="text-sm text-gray-600">
                                  Review Type: {item.reviewType || "N/A"}
                                </div>
                                <div className="text-sm text-gray-600">
                                  Feedback: {item.feedback || "No feedback"}
                                </div>
                                <div className="text-sm text-gray-600">
                                  Red Flags: {item.redFlags || "No red flags"}
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-gray-500">
                  No history found for this patient.
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={openRecoveryChoice} onOpenChange={setOpenRecoveryChoice}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Restart Patient</DialogTitle>
            <DialogDescription>
              {selectedPatientForRecovery?.patientName} is already recovered.
              Choose one option.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-3 justify-center">
            <Button onClick={() => handleRecoveryOption("fresh")}>
              Fresh Start
            </Button>
            <Button
              variant="outline"
              onClick={() => handleRecoveryOption("continue")}
            >
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Patient Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[95vh] flex flex-col p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>
              {editingPatient ? "Edit Patient" : "Create New Patient"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-1 sm:pr-4">
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
                        <Label>
                          Patient ID<span className="text-red-500 ml-1">*</span>
                        </Label>
                        <Input
                          name="patientCode"
                          value={patientForm.patientCode}
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
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <Label>
                          Name<span className="text-red-500 ml-1">*</span>
                        </Label>
                        <Input
                          name="patientName"
                          value={patientForm.patientName}
                          onChange={handleFormChange}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>
                          Age<span className="text-red-500 ml-1">*</span>
                        </Label>
                        <Input
                          name="patientAge"
                          type="number"
                          onWheel={(e) => e.target.blur()}
                          value={patientForm.patientAge}
                          onChange={handleFormChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>
                          Gender<span className="text-red-500 ml-1">*</span>
                        </Label>
                        <Select
                          value={patientForm.patientGenderId}
                          onValueChange={(v) =>
                            handleSelectChange("patientGenderId", v)
                          }
                        >
                          <SelectTrigger className="w-full">
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
                        <Label>
                          Bystander Name
                          <span className="text-red-500 ml-1">*</span>
                        </Label>
                        <Input
                          name="byStandar"
                          value={patientForm.byStandar}
                          onChange={handleFormChange}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>
                          Relation With Patient
                          <span className="text-red-500 ml-1">*</span>
                        </Label>
                        <Input
                          name="Relation"
                          value={patientForm.Relation}
                          onChange={handleFormChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>
                          Mobile No.<span className="text-red-500 ml-1">*</span>
                        </Label>
                        <Input
                          name="patientNumber"
                          value={patientForm.patientNumber}
                          onChange={handleFormChange}
                          maxLength={10}
                          inputMode="numeric"
                          pattern="[6-9][0-9]{9}"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>
                          Alt. Mobile No.
                          <span className="text-red-500 ml-1">*</span>
                        </Label>
                        <Input
                          name="patientAltNum"
                          value={patientForm.patientAltNum}
                          onChange={handleFormChange}
                          maxLength={10}
                          inputMode="numeric"
                          pattern="[6-9][0-9]{9}"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>
                          Address<span className="text-red-500 ml-1">*</span>
                        </Label>
                        <Input
                          name="patientAddress"
                          value={patientForm.patientAddress}
                          onChange={handleFormChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>
                          PIN Code<span className="text-red-500 ml-1">*</span>
                        </Label>
                        <Input
                          name="patientPinCode"
                          value={patientForm.patientPinCode}
                          onChange={handleFormChange}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>
                          Fees Type<span className="text-red-500 ml-1">*</span>
                        </Label>
                        <Select
                          value={patientForm?.FeesTypeId || ""}
                          onValueChange={(id) => {
                            const selected = feesType.find((f) => f._id === id);
                            if (!selected) return;
                            handleSelectChange("FeesTypeId", selected._id);
                            handleSelectChange(
                              "feesTypeName",
                              selected.feesTypeName,
                            );
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Fees" />
                          </SelectTrigger>
                          <SelectContent>
                            {feesType.map((fee) => (
                              <SelectItem key={fee._id} value={fee._id}>
                                {fee.feesTypeName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>
                          Fees Amount (
                          {isPerSession ? "PerSession" : "PerMonth"})
                          <span className="text-red-500 ml-1">*</span>
                        </Label>
                        <Input
                          name="feeAmount"
                          value={patientForm.feeAmount}
                          onChange={handleFormChange}
                          placeholder={isPerSession ? "PerSession" : "PerMonth"}
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
                              disabled={(date) =>
                                date < new Date(new Date().setHours(0, 0, 0, 0))
                              }
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
                            if (!v) return;
                            try {
                              const selected = JSON.parse(v);
                              handleSelectChange("ReferenceId", selected.id);
                              handleSelectChange("sourceName", selected.name);
                            } catch (err) {
                              console.error("Unable to parse JSON", v, err);
                            }
                          }}
                        >
                          <SelectTrigger className="w-full">
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
                      {selectedPatient && (
                        <div className="space-y-2">
                          <Label>Is Consent Received</Label>
                          <Button
                            type="button"
                            size="sm"
                            variant={
                              selectedPatient.isConsentReceived
                                ? "secondary"
                                : "default"
                            }
                            onClick={() => {
                              setPendingPatient(selectedPatient);
                              setOpendialog(true);
                            }}
                            className="w-full sm:w-auto"
                          >
                            {selectedPatient.isConsentReceived
                              ? "Mark Not Consent Received"
                              : "Mark Consent Received"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger>
                    Medical History & Risk Factors
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {risk.map((r) => (
                        <div key={r.RiskFactorIDPK}>
                          {renderRadioGroup(
                            r.RiskFactorName,
                            r.RiskFactorName.toLowerCase(),
                            patientForm[r.RiskFactorName.toLowerCase()],
                            r.RiskFactorIDPK,
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
                        className="flex flex-col sm:flex-row gap-4"
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
                          onWheel={(e) => e.target.blur()}
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
                          type="text"
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
                    <div className="w-full border rounded-md p-4 bg-gray-50">
                      <Label className="text-sm font-semibold text-gray-700 mb-3 block">
                        Balance
                      </Label>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Static</p>
                          <textarea
                            name="static"
                            rows={2}
                            className="w-full p-2 border rounded-md text-sm"
                            value={patientForm.static}
                            onChange={handleFormChange}
                          />
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Dynamic</p>
                          <textarea
                            name="dynamic"
                            rows={2}
                            className="w-full p-2 border rounded-md text-sm"
                            value={patientForm.dynamic}
                            onChange={handleFormChange}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Coordination</Label>
                      <textarea
                        name="coordination"
                        rows={2}
                        className="w-full p-2 border rounded-md"
                        value={patientForm.coordination}
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
                          onWheel={(e) => e.target.blur()}
                          value={patientForm.Frequency}
                          onChange={handleFormChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>No of Days</Label>
                        <Input
                          name="noOfDays"
                          type="number"
                          onWheel={(e) => e.target.blur()}
                          value={patientForm.noOfDays}
                          onChange={handleFormChange}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      {renderRadioGroup(
                        "Modalities",
                        "modalities",
                        patientForm.modalities,
                        "",
                        true,
                      )}
                    </div>
                    {patientForm.modalities === true && (
                      <div className="space-y-2">
                        <Label htmlFor="modalitiestype">Modalities Type</Label>
                        <Select
                          value={patientForm.modalitiestype}
                          onValueChange={(val) =>
                            setPatientForm((prev) => ({
                              ...prev,
                              modalitiestype: val,
                              modalityList: [],
                            }))
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Modalities Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Exercise Therapy">
                              Exercise Therapy
                            </SelectItem>
                            <SelectItem value="Electrotherapy">
                              Electrotherapy
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        {patientForm.modalitiestype && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="space-y-2 pl-0 sm:pl-4"
                          >
                            <Label>List of Modalities</Label>
                            <div className="p-3 border rounded-md grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                              {Array.isArray(modalities) &&
                                modalities
                                  .filter(
                                    (mod) =>
                                      mod.modalitiestype ===
                                        patientForm.modalitiestype &&
                                      physioModalityIds.includes(
                                        String(mod._id),
                                      ),
                                  )
                                  .map((mod) => {
                                    const isChecked = patientForm.modalityList
                                      .map((id) => String(id))
                                      .includes(String(mod._id));
                                    return (
                                      <div
                                        key={mod._id}
                                        className="flex items-center space-x-2"
                                      >
                                        <Checkbox
                                          id={`mod-${mod._id}`}
                                          checked={isChecked}
                                          onCheckedChange={(checked) => {
                                            const id = String(mod._id);
                                            setPatientForm((prev) => {
                                              const list = (
                                                prev.modalityList || []
                                              ).map((x) => String(x));
                                              return {
                                                ...prev,
                                                modalityList: checked
                                                  ? Array.from(
                                                      new Set([...list, id]),
                                                    )
                                                  : list.filter(
                                                      (m) => m !== id,
                                                    ),
                                              };
                                            });
                                          }}
                                        />
                                        <Label
                                          htmlFor={`mod-${mod._id}`}
                                          className="text-sm font-normal break-words"
                                        >
                                          {mod.modalitiesName}
                                        </Label>
                                      </div>
                                    );
                                  })}
                            </div>
                          </motion.div>
                        )}
                      </div>
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

              <div>
                <Label>Documents</Label>
                <Input type="file" multiple onChange={handleFileUpload} />

                <div className="mt-3 space-y-2">
                  {patientForm.patientDocuments?.length > 0 ? (
                    patientForm.patientDocuments.map((doc, index) => {
                      const isNewFile = doc instanceof File;
                      const fileUrl = isNewFile
                        ? URL.createObjectURL(doc)
                        : `http://localhost:8002${doc.fileUrl}`;

                      const isImage = isNewFile
                        ? doc.type?.startsWith("image/")
                        : doc.fileType?.startsWith("image/");

                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between border rounded p-2 gap-3"
                        >
                          <div className="flex items-center gap-3">
                            {isImage ? (
                              <img
                                src={fileUrl}
                                alt={isNewFile ? doc.name : doc.fileName}
                                className="w-12 h-12 rounded object-cover border cursor-pointer"
                                onClick={() => window.open(fileUrl, "_blank")}
                              />
                            ) : (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(fileUrl, "_blank")}
                              >
                                View
                              </Button>
                            )}

                            <span className="text-sm">
                              {isNewFile ? doc.name : doc.fileName}
                            </span>
                          </div>

                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              handleRemovePatientDocument(doc, index)
                            }
                          >
                            Remove
                          </Button>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-gray-400">No documents</p>
                  )}
                </div>
              </div>

              <DialogFooter className="pt-4 flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFormOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button type="submit" className="w-full sm:w-auto">
                  {editingPatient ? "Save Changes" : "Create Patient"}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={openedDialog} onOpenChange={setOpenedDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mark Patient Recovered</DialogTitle>
            <DialogDescription>
              Select recovered type for {pendingPatient?.patientName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Recovered Type</Label>
              <Select value={recoveredType} onValueChange={setRecoveredType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Patient Recovered">
                    Patient Recovered
                  </SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {recoveredType === "Other" && (
              <div>
                <Label>Reason</Label>
                <Input
                  value={otherReason}
                  onChange={(e) => setOtherReason(e.target.value)}
                  placeholder="Enter reason"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenedDialog(false);
                setPendingPatient(null);
                setRecoveredType("");
                setOtherReason("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmMarkRecovered}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openRecoveryChoice} onOpenChange={setOpenRecoveryChoice}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Restart Patient</DialogTitle>
            <DialogDescription>
              {selectedPatientForRecovery?.patientName} is already recovered.
              Choose one option.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-3 justify-center">
            <Button onClick={() => handleRecoveryOption("fresh")}>
              Fresh Start
            </Button>
            <Button
              variant="outline"
              onClick={() => handleRecoveryOption("continue")}
            >
              Continue
            </Button>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setOpenRecoveryChoice(false);
                setSelectedPatientForRecovery(null);
              }}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Physio Dialog */}
      <Dialog open={isAssignPhysioOpen} onOpenChange={setIsAssignPhysioOpen}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[95vh] flex flex-col p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>
              Assign Physio & Plan for {assigningPatient?.patientName}
            </DialogTitle>
            <DialogDescription>
              Schedule sessions, set goals, and configure travel details.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-1 sm:pr-4">
            <form
              onSubmit={handleAssignPhysioSubmit}
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
                      <Label>Assign Physiotherapist</Label>
                      <Select
                        onValueChange={(v) =>
                          setAssignForm((p) => ({ ...p, physioId: v }))
                        }
                        value={assignForm.physioId}
                      >
                        <SelectTrigger className="w-full">
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
                          onWheel={(e) => e.target.blur()}
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
                          onWheel={(e) => e.target.blur()}
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
                        min="1"
                        max={
                          physios.find((p) => p._id === assignForm.physioId)
                            ?.sessionPerDay || 1
                        }
                        onWheel={(e) => e.target.blur()}
                        placeholder="e.g. 1 for first visit"
                        value={assignForm.visitOrder}
                        onChange={(e) => {
                          const value = e.target.value;

                          setAssignForm((p) => ({
                            ...p,
                            visitOrder: value,
                          }));

                          if (!value) {
                            setVisitOrderError("");
                            return;
                          }

                          const num = Number(value);

                          if (num <= 0) {
                            setVisitOrderError(
                              "Visit order must be greater than 0",
                            );
                            return;
                          }

                          if (!assignForm.physioId) {
                            setVisitOrderError(
                              "Please select physiotherapist first",
                            );
                            return;
                          }

                          // ADD HERE
                          const selectedPhysio = physios.find(
                            (p) => p._id === assignForm.physioId,
                          );

                          const maxSessions = selectedPhysio?.sessionPerDay;
                          console.log(selectedPhysio, maxSessions);
                          if (num > maxSessions) {
                            setVisitOrderError(
                              `Visit order cannot exceed ${maxSessions}`,
                            );
                            return;
                          }
                          setVisitOrderError("");

                          // const duplicate = patients.find(
                          //   (p) =>
                          //     p._id !== assigningPatient?._id &&
                          //     (p.physioId?._id || p.physioId) ===
                          //       assignForm.physioId &&
                          //     Number(p.visitOrder) === num &&
                          //     !p.isRecovered,
                          // );

                          // if (duplicate) {
                          //   setVisitOrderError(
                          //     `Visit order ${num} already exists for this physio`,
                          //   );
                          // } else {
                          //   setVisitOrderError("");
                          // }
                        }}
                      />

                      {visitOrderError && (
                        <p className="text-red-500 text-sm">
                          {visitOrderError}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="KmsfromHub">Kms from Hub</Label>
                      <Input
                        id="KmsfromHub"
                        type="number"
                        onWheel={(e) => e.target.blur()}
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
                    {assignForm.visitOrder > 1 && (
                      <div className="space-y-2">
                        <Label htmlFor="kmsFromPrevious">
                          Kms from Previous Appointment
                        </Label>
                        <Input
                          id="kmsFromPrevious"
                          type="number"
                          onWheel={(e) => e.target.blur()}
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
                        onWheel={(e) => e.target.blur()}
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
              <DialogFooter className="pt-4 flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAssignPhysioOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button type="submit" className="w-full sm:w-auto">
                  Assign & Save Plan
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Consent Dialog */}
      <AlertDialog open={openDialog} onOpenChange={setOpendialog}>
        <AlertDialogContent className="w-[95vw] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark{" "}
              <strong>{pendingPatient?.patientName}</strong> as{" "}
              {!pendingPatient?.isConsentReceived
                ? "Consent Received"
                : "Not Consent Received"}
              ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="w-full sm:w-auto"
              onClick={() => handleConsentToggle(pendingPatient)}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Recovery Alert Dialog */}
      <AlertDialog open={openAlert} onOpenChange={setOpenAlert}>
        <AlertDialogContent className="w-[95vw] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <div>
                Are you sure you want to mark{" "}
                <strong>{pendingPatient?.patientName}</strong> as{" "}
                {!pendingPatient?.isRecovered ? "Recovered" : "Not Recovered"}?
              </div>
              {!pendingPatient?.isRecovered && (
                <>
                  <div className="space-y-1">
                    <Label>Recovered Type</Label>
                    <Select
                      value={recoveredType}
                      onValueChange={(value) => setRecoveredType(value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Patient Recovered">
                          Patient Recovered
                        </SelectItem>
                        <SelectItem value="Other">Stop</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {recoveredType === "Other" && (
                    <div className="space-y-1">
                      <Label>Stop Reason</Label>
                      <Input
                        type="text"
                        className="w-full border rounded px-2 py-1"
                        placeholder="Enter stop reason"
                        value={otherReason}
                        onChange={(e) => setOtherReason(e.target.value)}
                      />
                    </div>
                  )}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel
              className="w-full sm:w-auto"
              onClick={() => {
                setRecoveredType("");
                setOtherReason("");
                setPendingPatient(null);
                setOpenAlert(false);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="w-full sm:w-auto"
              disabled={
                !pendingPatient?.isRecovered &&
                (!recoveredType ||
                  (recoveredType === "Other" && !otherReason.trim()))
              }
              onClick={async () => {
                try {
                  if (!pendingPatient?.isRecovered) {
                    const res = await apiRequest("Patient/updatePatient", {
                      method: "POST",
                      body: JSON.stringify({
                        _id: pendingPatient._id,
                        isRecovered: true,
                        recoveredType,
                        stopReason:
                          recoveredType === "Other" ? otherReason : null,
                      }),
                    });
                    if (res?.success === false || res?.error) {
                      throw new Error(
                        res?.message || res?.error || "Failed to update patient status.",
                      );
                    }
                    toast({
                      title: "Recovered",
                      description: `${pendingPatient.patientName} marked as recovered.`,
                    });
                  } else {
                    setSelectedPatientForRecovery(pendingPatient);
                    setOpenRecoveryChoice(true);
                  }
                } catch (error) {
                  toast({
                    title: "Error",
                    description:
                      error?.message || "Failed to update patient status.",
                    variant: "destructive",
                  });
                } finally {
                  setRecoveredType("");
                  setOtherReason("");
                  setOpenAlert(false);
                  setPendingPatient(null);
                  getAllPatient();
                }
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Recovery Choice Dialog */}
      <Dialog open={openRecoveryChoice} onOpenChange={setOpenRecoveryChoice}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choose Recovery Option</DialogTitle>
            <DialogDescription>
              This patient already has old treatment history. What do you want
              to do?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-4">
            <Button
              onClick={() => handleRecoveryOption("fresh")}
              className="w-full"
            >
              Start Fresh
            </Button>
            <Button
              variant="outline"
              onClick={() => handleRecoveryOption("continue")}
              className="w-full"
            >
              Continue Old
            </Button>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setOpenRecoveryChoice(false);
                setSelectedPatientForRecovery(null);
              }}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={openfeedbackdialog} onOpenChange={setOpenfeedbackdialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Download Review Options</DialogTitle>
          </DialogHeader>

          {/* SELECT ALL */}
          <div className="flex items-center gap-2 mb-3">
            <Checkbox
              checked={Object.values(selectedFields).every(Boolean)}
              onCheckedChange={handleSelectAll}
            />
            <span className="font-semibold">Select All</span>
          </div>

          {/* FIELDS */}
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2">
              <Checkbox
                checked={selectedFields.reviewNumber}
                onCheckedChange={(v) => updateField("reviewNumber", v)}
              />
              Review No
            </label>

            <label className="flex items-center gap-2">
              <Checkbox
                checked={selectedFields.patientName}
                onCheckedChange={(v) => updateField("patientName", v)}
              />
              Patient Name
            </label>

            <label className="flex items-center gap-2">
              <Checkbox
                checked={selectedFields.physioName}
                onCheckedChange={(v) => updateField("physioName", v)}
              />
              Physio Name
            </label>

            <label className="flex items-center gap-2">
              <Checkbox
                checked={selectedFields.reviewDate}
                onCheckedChange={(v) => updateField("reviewDate", v)}
              />
              Review Date
            </label>

            <label className="flex items-center gap-2">
              <Checkbox
                checked={selectedFields.reviewType}
                onCheckedChange={(v) => updateField("reviewType", v)}
              />
              Review Type
            </label>

            <label className="flex items-center gap-2">
              <Checkbox
                checked={selectedFields.status}
                onCheckedChange={(v) => updateField("status", v)}
              />
              Status
            </label>

            <label className="flex items-center gap-2">
              <Checkbox
                checked={selectedFields.redFlag}
                onCheckedChange={(v) => updateField("redFlag", v)}
              />
              Red Flag
            </label>

            <label className="flex items-center gap-2">
              <Checkbox
                checked={selectedFields.feedback}
                onCheckedChange={(v) => updateField("feedback", v)}
              />
              Feedback
            </label>
          </div>
          {/* DATE FILTERS */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div>
              <label className="text-sm font-medium">From Date</label>

              <input
                type="date"
                value={reviewFromDate}
                onChange={(e) => setReviewFromDate(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">To Date</label>

              <input
                type="date"
                value={reviewToDate}
                onChange={(e) => setReviewToDate(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 mt-1"
              />
            </div>
          </div>
          {/* REVIEW STATUS FILTER */}
          <div className="space-y-3 mt-4">
            <label className="text-sm font-semibold">Review Status</label>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 rounded-lg border p-2 cursor-pointer hover:bg-gray-50">
                <Checkbox
                  checked={reviewStatus.completed}
                  onCheckedChange={(v) =>
                    setReviewStatus((p) => ({
                      ...p,
                      completed: !!v,
                    }))
                  }
                />
                <span>Completed Reviews</span>
              </label>

              <label className="flex items-center gap-2 rounded-lg border p-2 cursor-pointer hover:bg-gray-50">
                <Checkbox
                  checked={reviewStatus.pending}
                  onCheckedChange={(v) =>
                    setReviewStatus((p) => ({
                      ...p,
                      pending: !!v,
                    }))
                  }
                />
                <span>Pending Reviews</span>
              </label>
            </div>
          </div>
          {/* ACTIONS */}
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setOpenfeedbackdialog(false)}
            >
              Cancel
            </Button>

            <Button
              onClick={() => {
                downloadReviewHistoryExcel();
                setOpenfeedbackdialog(false);
              }}
            >
              Download
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={openfeedbackdialogpdf}
        onOpenChange={setOpenfeedbackdialogpdf}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Download Review Options</DialogTitle>
          </DialogHeader>

          {/* SELECT ALL */}
          <div className="flex items-center gap-2 mb-3">
            <Checkbox
              checked={Object.values(selectedFields).every(Boolean)}
              onCheckedChange={handleSelectAll}
            />
            <span className="font-semibold">Select All</span>
          </div>

          {/* FIELDS */}
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2">
              <Checkbox
                checked={selectedFields.reviewNumber}
                onCheckedChange={(v) => updateField("reviewNumber", v)}
              />
              Review No
            </label>

            <label className="flex items-center gap-2">
              <Checkbox
                checked={selectedFields.patientName}
                onCheckedChange={(v) => updateField("patientName", v)}
              />
              Patient Name
            </label>

            <label className="flex items-center gap-2">
              <Checkbox
                checked={selectedFields.physioName}
                onCheckedChange={(v) => updateField("physioName", v)}
              />
              Physio Name
            </label>

            <label className="flex items-center gap-2">
              <Checkbox
                checked={selectedFields.reviewDate}
                onCheckedChange={(v) => updateField("reviewDate", v)}
              />
              Review Date
            </label>

            <label className="flex items-center gap-2">
              <Checkbox
                checked={selectedFields.reviewType}
                onCheckedChange={(v) => updateField("reviewType", v)}
              />
              Review Type
            </label>

            <label className="flex items-center gap-2">
              <Checkbox
                checked={selectedFields.status}
                onCheckedChange={(v) => updateField("status", v)}
              />
              Status
            </label>

            <label className="flex items-center gap-2">
              <Checkbox
                checked={selectedFields.redFlag}
                onCheckedChange={(v) => updateField("redFlag", v)}
              />
              Red Flag
            </label>

            <label className="flex items-center gap-2">
              <Checkbox
                checked={selectedFields.feedback}
                onCheckedChange={(v) => updateField("feedback", v)}
              />
              Feedback
            </label>
          </div>
          {/* DATE FILTERS */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div>
              <label className="text-sm font-medium">From Date</label>

              <input
                type="date"
                value={reviewFromDate}
                onChange={(e) => setReviewFromDate(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">To Date</label>

              <input
                type="date"
                value={reviewToDate}
                onChange={(e) => setReviewToDate(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 mt-1"
              />
            </div>
          </div>
          {/* REVIEW STATUS FILTER */}
          <div className="space-y-3 mt-4">
            <label className="text-sm font-semibold">Review Status</label>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 rounded-lg border p-2 cursor-pointer hover:bg-gray-50">
                <Checkbox
                  checked={reviewStatus.completed}
                  onCheckedChange={(v) =>
                    setReviewStatus((p) => ({
                      ...p,
                      completed: !!v,
                    }))
                  }
                />
                <span>Completed Reviews</span>
              </label>

              <label className="flex items-center gap-2 rounded-lg border p-2 cursor-pointer hover:bg-gray-50">
                <Checkbox
                  checked={reviewStatus.pending}
                  onCheckedChange={(v) =>
                    setReviewStatus((p) => ({
                      ...p,
                      pending: !!v,
                    }))
                  }
                />
                <span>Pending Reviews</span>
              </label>
            </div>
          </div>
          {/* ACTIONS */}
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setOpenfeedbackdialogpdf(false)}
            >
              Cancel
            </Button>

            <Button
              onClick={() => {
                downloadReview();
                setOpenfeedbackdialogpdf(false);
              }}
            >
              Download
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={openPdfDialog} onOpenChange={setOpenPdfDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Download Session Options</DialogTitle>
          </DialogHeader>

          {/* FIELDS */}
          <div className="flex items-center gap-2 mb-3">
            <Checkbox
              checked={Object.values(sessionFields).every((v) => v === true)}
              onCheckedChange={handleSessionSelectAll}
            />
            <span className="font-semibold">Select All</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label>
              <Checkbox
                checked={sessionFields.sessionCount}
                onCheckedChange={(v) =>
                  setSessionFields((p) => ({ ...p, sessionCount: !!v }))
                }
              />
              Session No
            </label>{" "}
            <label>
              <Checkbox
                checked={sessionFields.sessionCode}
                onCheckedChange={(v) =>
                  setSessionFields((p) => ({ ...p, sessionCode: !!v }))
                }
              />
              Session Code
            </label>{" "}
            <label>
              <Checkbox
                checked={sessionFields.patientName}
                onCheckedChange={(v) =>
                  setSessionFields((p) => ({ ...p, patientName: !!v }))
                }
              />
              Patient Name
            </label>
            <label>
              <Checkbox
                checked={sessionFields.physioName}
                onCheckedChange={(v) =>
                  setSessionFields((p) => ({ ...p, physioName: !!v }))
                }
              />
              Physio Name
            </label>
            <label>
              <Checkbox
                checked={sessionFields.feedback}
                onCheckedChange={(v) =>
                  setSessionFields((p) => ({ ...p, feedback: !!v }))
                }
              />
              Feedback
            </label>
            <label>
              <Checkbox
                checked={sessionFields.sessionDate}
                onCheckedChange={(v) =>
                  setSessionFields((p) => ({ ...p, sessionDate: !!v }))
                }
              />
              Session Date
            </label>
            <label>
              <Checkbox
                checked={sessionFields.startTime}
                onCheckedChange={(v) =>
                  setSessionFields((p) => ({ ...p, startTime: !!v }))
                }
              />
              Start Time
            </label>
            <label>
              <Checkbox
                checked={sessionFields.endTime}
                onCheckedChange={(v) =>
                  setSessionFields((p) => ({ ...p, endTime: !!v }))
                }
              />
              End Time
            </label>
            <label>
              <Checkbox
                checked={sessionFields.status}
                onCheckedChange={(v) =>
                  setSessionFields((p) => ({ ...p, status: !!v }))
                }
              />
              Status
            </label>
          </div>
          {/* SESSION STATUS FILTER */}
          <div className="space-y-3 mb-4">
            <label className="text-sm font-semibold">Session Status</label>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 rounded-lg border p-2 cursor-pointer hover:bg-gray-50">
                <Checkbox
                  checked={sessionStatus.completed}
                  onCheckedChange={(v) =>
                    setSessionStatus((p) => ({
                      ...p,
                      completed: !!v,
                    }))
                  }
                />
                <span>Completed Session</span>
              </label>

              <label className="flex items-center gap-2 rounded-lg border p-2 cursor-pointer hover:bg-gray-50">
                <Checkbox
                  checked={sessionStatus.canceled}
                  onCheckedChange={(v) =>
                    setSessionStatus((p) => ({
                      ...p,
                      canceled: !!v,
                    }))
                  }
                />
                <span>Cancelled Session</span>
              </label>

              <label className="flex items-center gap-2 rounded-lg border p-2 cursor-pointer hover:bg-gray-50">
                <Checkbox
                  checked={sessionStatus.scheduled}
                  onCheckedChange={(v) =>
                    setSessionStatus((p) => ({
                      ...p,
                      scheduled: !!v,
                    }))
                  }
                />
                <span>Scheduled Session</span>
              </label>
            </div>
          </div>
          {/* DATE FILTERS */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-sm font-medium">From Date</label>

              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full border rounded-md px-3 py-2 mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">To Date</label>

              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full border rounded-md px-3 py-2 mt-1"
              />
            </div>
          </div>
          {/* ACTIONS */}
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setOpenfeedbackdialogpdf(false)}
            >
              Cancel
            </Button>

            <Button
              onClick={() => {
                downloadSessionHistory(); // ✅ correct
                setOpenPdfDialog(false);
              }}
            >
              Download
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={openExcelDialog} onOpenChange={setOpenExcelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Download Session Options</DialogTitle>
          </DialogHeader>

          {/* FIELDS */}
          <div className="flex items-center gap-2 mb-3">
            <Checkbox
              checked={Object.values(sessionFields).every((v) => v === true)}
              onCheckedChange={handleSessionSelectAll}
            />
            <span className="font-semibold">Select All</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label>
              <Checkbox
                checked={sessionFields.sessionCount}
                onCheckedChange={(v) =>
                  setSessionFields((p) => ({ ...p, sessionCount: !!v }))
                }
              />
              Session No
            </label>{" "}
            <label>
              <Checkbox
                checked={sessionFields.sessionCode}
                onCheckedChange={(v) =>
                  setSessionFields((p) => ({ ...p, sessionCode: !!v }))
                }
              />
              Session Code
            </label>{" "}
            <label>
              <Checkbox
                checked={sessionFields.patientName}
                onCheckedChange={(v) =>
                  setSessionFields((p) => ({ ...p, patientName: !!v }))
                }
              />
              Patient Name
            </label>
            <label>
              <Checkbox
                checked={sessionFields.physioName}
                onCheckedChange={(v) =>
                  setSessionFields((p) => ({ ...p, physioName: !!v }))
                }
              />
              Physio Name
            </label>
            <label>
              <Checkbox
                checked={sessionFields.feedback}
                onCheckedChange={(v) =>
                  setSessionFields((p) => ({ ...p, feedback: !!v }))
                }
              />
              Feedback
            </label>
            <label>
              <Checkbox
                checked={sessionFields.sessionDate}
                onCheckedChange={(v) =>
                  setSessionFields((p) => ({ ...p, sessionDate: !!v }))
                }
              />
              Session Date
            </label>
            <label>
              <Checkbox
                checked={sessionFields.startTime}
                onCheckedChange={(v) =>
                  setSessionFields((p) => ({ ...p, startTime: !!v }))
                }
              />
              Start Time
            </label>
            <label>
              <Checkbox
                checked={sessionFields.endTime}
                onCheckedChange={(v) =>
                  setSessionFields((p) => ({ ...p, endTime: !!v }))
                }
              />
              End Time
            </label>
            <label>
              <Checkbox
                checked={sessionFields.status}
                onCheckedChange={(v) =>
                  setSessionFields((p) => ({ ...p, status: !!v }))
                }
              />
              Status
            </label>
          </div>
          {/* SESSION STATUS FILTER */}
          <div className="space-y-3 mb-4">
            <label className="text-sm font-semibold">Session Status</label>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 rounded-lg border p-2 cursor-pointer hover:bg-gray-50">
                <Checkbox
                  checked={sessionStatus.completed}
                  onCheckedChange={(v) =>
                    setSessionStatus((p) => ({
                      ...p,
                      completed: !!v,
                    }))
                  }
                />
                <span>Completed Session</span>
              </label>

              <label className="flex items-center gap-2 rounded-lg border p-2 cursor-pointer hover:bg-gray-50">
                <Checkbox
                  checked={sessionStatus.canceled}
                  onCheckedChange={(v) =>
                    setSessionStatus((p) => ({
                      ...p,
                      cancelled: !!v,
                    }))
                  }
                />
                <span>Cancelled Session</span>
              </label>

              <label className="flex items-center gap-2 rounded-lg border p-2 cursor-pointer hover:bg-gray-50">
                <Checkbox
                  checked={sessionStatus.scheduled}
                  onCheckedChange={(v) =>
                    setSessionStatus((p) => ({
                      ...p,
                      scheduled: !!v,
                    }))
                  }
                />
                <span>Scheduled Session</span>
              </label>
            </div>
          </div>
          {/* DATE FILTERS */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-sm font-medium">From Date</label>

              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full border rounded-md px-3 py-2 mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">To Date</label>

              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full border rounded-md px-3 py-2 mt-1"
              />
            </div>
          </div>
          {/* ACTIONS */}
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setOpenfeedbackdialogpdf(false)}
            >
              Cancel
            </Button>

            <Button
              onClick={() => {
                downloadSessionHistoryExcel();
                setOpenExcelDialog(false);
              }}
            >
              Download
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PatientManagement;
