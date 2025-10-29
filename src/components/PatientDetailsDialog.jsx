import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { format } from "date-fns";

const DetailItem = ({ label, value }) => (
  value ? <p className="text-sm"><strong className="text-gray-600">{label}:</strong> {value}</p> : null
);

const DetailSection = ({ children }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">{children}</div>
);

const PatientDetailsDialog = ({ isOpen, onOpenChange, patient }) => {
  if (!patient) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Patient Details: {patient.name}</DialogTitle>
          <DialogDescription>
            Comprehensive overview of {patient.name}'s profile and medical history.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-6 -mr-6 mt-4">
          <Accordion type="multiple" defaultValue={['item-1', 'item-2', 'item-3', 'item-4', 'item-5', 'item-6', 'item-7']} className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>Patient Details</AccordionTrigger>
              <AccordionContent>
                <DetailSection>
                  <DetailItem label="Patient ID" value={patient.patientId} />
                  <DetailItem label="Consultation Date" value={patient.consultationDate ? format(new Date(patient.consultationDate), "PPP") : 'N/A'} />
                  <DetailItem label="Age" value={patient.age} />
                  <DetailItem label="Gender" value={patient.gender} />
                  <DetailItem label="Bystander Name" value={patient.bystanderName} />
                  <DetailItem label="Relation" value={patient.relationWithPatient} />
                  <DetailItem label="Mobile No." value={patient.contact} />
                  <DetailItem label="Alt. Mobile No." value={patient.altMobNo} />
                  <DetailItem label="Address" value={patient.address} />
                  <DetailItem label="PIN Code" value={patient.pin} />
                  <DetailItem label="Diagnosis" value={patient.diagnosis} />
                  <DetailItem label="Review Date" value={patient.reviewDate ? format(new Date(patient.reviewDate), "PPP") : 'N/A'} />
                </DetailSection>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2">
              <AccordionTrigger>Medical History & Risk Factors</AccordionTrigger>
              <AccordionContent>
                <DetailSection>
                  <DetailItem label="Diabetic" value={patient.diabetic} />
                  <DetailItem label="Hypertension" value={patient.hypertension} />
                  <DetailItem label="Arthritis" value={patient.arthritis} />
                  <DetailItem label="Trauma" value={patient.trauma} />
                  <DetailItem label="Osteoporosis" value={patient.osteoporosis} />
                </DetailSection>
                <div className="mt-2 space-y-2">
                  <DetailItem label="History of Surgery" value={`${patient.historyOfSurgery} ${patient.historyOfSurgery === 'yes' ? `(${patient.historyOfSurgeryDetails})` : ''}`} />
                  <DetailItem label="History of Fall" value={`${patient.historyOfFall} ${patient.historyOfFall === 'yes' ? `(${patient.historyOfFallDetails})` : ''}`} />
                  <DetailItem label="Other Medical Conditions" value={patient.otherMedicalConditions} />
                  <DetailItem label="Current Medications" value={patient.currentMedications} />
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-3">
              <AccordionTrigger>Lifestyle, Contraindications & HOD Notes</AccordionTrigger>
              <AccordionContent className="space-y-4">
                  <div><h4 className="font-semibold mb-1">Lifestyle Information</h4><DetailItem label="Lifestyle" value={patient.lifestyle} /><DetailItem label="Smoking/Alcohol" value={patient.smokingAlcohol} /><DetailItem label="Dietary Habits" value={patient.dietaryHabits} /></div>
                  <div><h4 className="font-semibold mb-1">Contraindications</h4><p className="text-sm p-2 bg-red-50/50 rounded">{patient.contraindications || 'None specified'}</p></div>
                  <div><h4 className="font-semibold mb-1">HOD Notes</h4><p className="text-sm p-2 bg-blue-50/50 rounded">{patient.hodNotes || 'No notes from HOD'}</p></div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-6">
              <AccordionTrigger>Treatment Plan</AccordionTrigger>
              <AccordionContent>
                  <DetailSection>
                      <DetailItem label="Short-term Goals" value={patient.shortTermGoals} />
                      <DetailItem label="Long-term Goals" value={patient.longTermGoals} />
                      <DetailItem label="Recommended Therapy" value={patient.recommendedTherapy} />
                      <DetailItem label="Frequency" value={`${patient.frequencyOfSessions} per week`} />
                      <DetailItem label="Duration" value={patient.durationOfTreatment} />
                      <DetailItem label="Modalities" value={`${patient.modalities} ${patient.modalities === 'yes' ? `(${patient.modalityList?.join(', ')})` : ''}`} />
                      <DetailItem label="Targeted Area" value={patient.targetedArea} />
                      <DetailItem label="No of Days" value={patient.noOfDays} />
                  </DetailSection>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PatientDetailsDialog;