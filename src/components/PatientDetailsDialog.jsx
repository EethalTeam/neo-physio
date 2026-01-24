import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { apiRequest } from "./CustomComponents/apiRequest";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { format } from "date-fns";
import { toast } from "./ui/use-toast";
import { Input } from "./ui/input";

const DetailItem = ({ label, value }) =>
  value ? (
    <p className="text-sm">
      <strong className="text-gray-600">{label}:</strong> {value}
    </p>
  ) : null;

const DetailSection = ({ children }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
    {children}
  </div>
);

const PatientDetailsDialog = ({ isOpen, onOpenChange, patient }) => {
  const [isAssignPhysioOpen, setIsAssignPhysioOpen] = useState(false);
  const initialAssignState = {
    // _id: "",
    // physioName: "",
    // Physiotherapist: "",
    // physioId: "",
    // sessionStartDate: "",
    // sessionTime: "",
    // totalSessionDays: "",
    InitialShorttermGoal: "",
    goalDuration: "",
    goalDescription: "",
    // reviewFrequency: "",
    // visitOrder: 1,
    // KmsfromHub: "",
    // KmsfLPatienttoHub: "",
    // kmsFromPrevious: "",
  };
  const [assignForm, setAssignForm] = useState(initialAssignState);
  const [goalsForm, setGoalsForm] = useState({
    shortTermGoals:
      patient?.shortTermGoals || patient?.patientId?.shortTermGoals || "",
    longTermGoals:
      patient?.longTermGoals || patient?.patientId?.longTermGoals || "",
  });
  useEffect(() => {
    setGoalsForm({
      shortTermGoals:
        patient?.shortTermGoals || patient?.patientId?.shortTermGoals || "",
      longTermGoals:
        patient?.longTermGoals || patient?.patientId?.longTermGoals || "",
    });
  }, [patient]);
  const updatePatientGoals = async () => {
    try {
      await apiRequest("Patient/updatePatientGoals", {
        method: "POST",
        body: JSON.stringify({
          patientId: patient?.patientId?._id || patient?._id,
          shortTermGoals: goalsForm.shortTermGoals,
          longTermGoals: goalsForm.longTermGoals,
          goalDuration: goalsForm.goalDuration,
        }),
      });

      toast({
        title: "Success",
        description: "Patient goals updated successfully",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to update patient goals",
      });
    }
  };

  console.log(patient, "patient");
  if (!patient) return null;
  const user = JSON.parse(localStorage.getItem("user"));
  const reviewDateValue = (() => {
    const rawDate = patient?.reviewDate || patient?.patientId?.reviewDate;

    if (!rawDate) return "N/A";

    const date = new Date(rawDate);
    return isNaN(date.getTime()) ? "N/A" : format(date, "PPP");
  })();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Patient Details:
            {patient.patientName || patient?.patientId?.patientName}
          </DialogTitle>
          <DialogDescription>
            Comprehensive overview of{" "}
            {patient.patientName || patient?.patientId?.patientName}'s profile
            and medical history.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-6 -mr-6 mt-4">
          <Accordion
            type="multiple"
            defaultValue={[
              "item-1",
              "item-2",
              "item-3",
              "item-4",
              "item-5",
              "item-6",
              "item-7",
            ]}
            className="w-full"
          >
            <AccordionItem value="item-1">
              <AccordionTrigger>Patient Details</AccordionTrigger>
              <AccordionContent>
                <DetailSection>
                  <DetailItem
                    label="Patient Code "
                    value={
                      patient?.patientId?.patientCode || patient.patientCode
                    }
                  />
                  {user?.role !== "Physio" && user?.role !== "HOD" ? (
                    <>
                      <DetailItem
                        label="Consultation Date"
                        value={
                          patient.consultationDate
                            ? format(new Date(patient.consultationDate), "PPP")
                            : "N/A" || patient?.patientId?.consultationDate
                              ? format(
                                  new Date(
                                    patient?.patientId?.consultationDate,
                                  ),
                                  "PPP",
                                )
                              : "N/A"
                        }
                      />
                    </>
                  ) : null}

                  <DetailItem
                    label="Physio Name"
                    value={patient.physioId?.physioName}
                  />
                  <DetailItem
                    label="Age"
                    value={patient.patientAge || patient?.patientId?.patientAge}
                  />
                  {user?.role !== "Physio" && user?.role !== "HOD" ? (
                    <>
                      {" "}
                      <DetailItem
                        label="Gender"
                        value={
                          patient.patientGenderId?.genderName ||
                          patient?.patientId?.patientGenderId?.genderName
                        }
                      />
                      <DetailItem
                        label="Bystander Name"
                        value={
                          patient.byStandar || patient?.patientId?.byStandar
                        }
                      />
                      <DetailItem
                        label="Relation"
                        value={patient.Relation || patient?.patientId?.Relation}
                      />
                      <DetailItem
                        label="Mobile No."
                        value={
                          patient.patientNumber ||
                          patient?.patientId?.patientNumber
                        }
                      />
                      <DetailItem
                        label="Alt. Mobile No."
                        value={
                          patient.patientAltNum ||
                          patient?.patientId?.patientAltNum
                        }
                      />
                      <DetailItem
                        label="Address"
                        value={
                          patient.patientAddress ||
                          patient?.patientId?.patientAddress
                        }
                      />
                      <DetailItem
                        label="PIN Code"
                        value={
                          patient.patientPinCode ||
                          patient?.patientId?.patientPinCode
                        }
                      />
                    </>
                  ) : null}
                  <DetailItem label="Review Date" value={reviewDateValue} />

                  {user?.role !== "Physio" && user?.role !== "HOD" ? (
                    <>
                      <DetailItem
                        label="Session Start Date"
                        value={
                          patient.sessionStartDate
                            ? format(new Date(patient.sessionStartDate), "PPP")
                            : "N/A" || patient?.patientId?.sessionStartDate
                              ? format(
                                  new Date(
                                    patient?.patientId?.sessionStartDate,
                                  ),
                                  "PPP",
                                )
                              : "N/A"
                        }
                      />
                      <DetailItem
                        label=" Total Session Days"
                        value={
                          patient.totalSessionDays ||
                          patient?.patientId?.totalSessionDays
                        }
                      />
                      <DetailItem
                        label="Session Time"
                        value={
                          patient.sessionTime || patient?.patientId?.sessionTime
                        }
                      />
                      <DetailItem
                        label="KM From Patient to Hub"
                        value={
                          patient.KmsfLPatienttoHub ||
                          patient?.patientId?.KmsfLPatienttoHub
                        }
                      />
                      <DetailItem
                        label="KM from Hub"
                        value={
                          patient.KmsfromHub || patient?.patientId?.KmsfromHub
                        }
                      />
                      <DetailItem
                        label="Initial Short term Goal"
                        value={
                          patient.InitialShorttermGoal ||
                          patient?.patientId?.InitialShorttermGoal
                        }
                      />
                      <DetailItem
                        label="Goal Duration"
                        value={
                          patient.goalDuration ||
                          patient?.patientId?.goalDuration
                        }
                      />
                    </>
                  ) : null}
                  <DetailItem
                    label="Patient Condition"
                    value={
                      patient.patientCondition ||
                      patient?.patientId?.patientCondition
                    }
                  />
                </DetailSection>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger>
                Medical History & Risk Factors
              </AccordionTrigger>
              <AccordionContent>
                <DetailSection>
                  <DetailItem
                    label="Diabetic"
                    value={patient.diabetic || patient?.patientId?.diabetic}
                  />
                  <DetailItem
                    label="Hypertension"
                    value={
                      patient.hypertension || patient?.patientId?.hypertension
                    }
                  />
                  <DetailItem
                    label="Arthritis"
                    value={patient.arthritis || patient?.patientId?.arthritis}
                  />
                  <DetailItem
                    label="Trauma"
                    value={patient.trauma || patient?.patientId?.trauma}
                  />
                  <DetailItem
                    label="Osteoporosis"
                    value={
                      patient.osteoporosis || patient?.patientId?.osteoporosis
                    }
                  />
                </DetailSection>
                <div className="mt-2 space-y-2">
                  <DetailItem
                    label="History of Surgery"
                    value={
                      `${patient.historyOfSurgery} ${
                        patient.historyOfSurgery === "yes"
                          ? `(${patient.historyOfSurgeryDetails})`
                          : ""
                      }` || patient?.patientId?.historyOfSurgery
                    }
                  />
                  <DetailItem
                    label="History of Fall"
                    value={
                      `${patient.historyOfFall} ${
                        patient.historyOfFall === "yes"
                          ? `(${patient.historyOfFallDetails})`
                          : ""
                      }` || patient?.patientId?.historyOfFall
                    }
                  />
                  <DetailItem
                    label="Other Medical Conditions"
                    value={
                      patient.otherMedicalConditions ||
                      patient?.patientId?.otherMedicalConditions
                    }
                  />
                  <DetailItem
                    label="Current Medications"
                    value={
                      patient.currentMedications ||
                      patient?.patientId?.currentMedications
                    }
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger>
                Lifestyle, Contraindications & HOD Notes
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-1">Lifestyle Information</h4>
                  <DetailItem
                    label="Lifestyle"
                    value={
                      patient.typesOfLifeStyle ||
                      patient?.patientId?.typesOfLifeStyle
                    }
                  />
                  <DetailItem
                    label="Smoking/Alcohol"
                    value={
                      patient.smokingOrAlcohol ||
                      patient?.patientId?.smokingOrAlcohol
                    }
                  />
                  <DetailItem
                    label="Dietary Habits"
                    value={
                      patient.dietaryHabits || patient?.patientId?.dietaryHabits
                    }
                  />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Contraindications</h4>
                  <p className="text-sm p-2 bg-red-50/50 rounded">
                    {patient.Contraindications ||
                      "None specified" ||
                      patient?.patientId?.Contraindications}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">HOD Notes</h4>
                  <p className="text-sm p-2 bg-blue-50/50 rounded">
                    {patient.hodNotes ||
                      "No notes from HOD" ||
                      patient?.patientId?.hodNotes}
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6">
              <AccordionTrigger>Treatment Plan</AccordionTrigger>
              <AccordionContent>
                <DetailSection>
                  <DetailItem
                    label="Short-term Goals"
                    value={
                      patient.shortTermGoals ||
                      patient?.patientId?.shortTermGoals ||
                      goalsForm.shortTermGoals
                    }
                  />
                  <DetailItem
                    label="Long-term Goals"
                    value={
                      patient.longTermGoals ||
                      patient?.patientId?.longTermGoals ||
                      goalsForm.longTermGoals
                    }
                  />
                  <DetailItem
                    label="Recommended Therapy"
                    value={
                      patient.RecomTherapy || patient?.patientId?.RecomTherapy
                    }
                  />
                  <DetailItem
                    label="Review Frequency"
                    value={
                      `${patient?.patientId?.reviewFrequency} Per Week` ||
                      `${patient.reviewFrequency} Per Week`
                    }
                  />
                  <DetailItem
                    label="Duration"
                    value={patient.Duration || patient?.patientId?.Duration}
                  />
                  <DetailItem
                    label="Modalities"
                    value={
                      `${patient.modalities} ${
                        patient.modalities === "yes"
                          ? `(${patient.modalityList?.join(", ")})`
                          : ""
                      }` ||
                      `${patient?.patientId?.modalities} ${
                        patient?.patientId?.modalities === "yes"
                          ? `(${patient?.patientId?.modalityList?.join(", ")})`
                          : ""
                      }`
                    }
                  />
                  <DetailItem
                    label="Targeted Area"
                    value={
                      patient.targetedArea || patient?.patientId?.targetedArea
                    }
                  />
                  <DetailItem
                    label="No of Days"
                    value={patient.noOfDays || patient?.patientId?.noOfDays}
                  />
                </DetailSection>
                <div className="flex justify-center">
                  <div className="space-y-6 w-full max-w-3xl">
                    {/* GOALS BLOCK */}
                    <div className="grid grid-cols-2 gap-4 border rounded-lg p-4">
                      {/* Short-term Goals */}
                      <div className="space-y-2 col-span-2">
                        <Label>Short-term Goals</Label>
                        <textarea
                          className="w-full p-2 border rounded-md min-h-[80px]"
                          onChange={(e) =>
                            setGoalsForm((p) => ({
                              ...p,
                              shortTermGoals: e.target.value,
                            }))
                          }
                        />
                      </div>

                      {/* Goal Duration */}
                      <div className="space-y-2">
                        <Label>Goal Duration (days)</Label>
                        <Input
                          type="number"
                          className="w-full"
                          onChange={(e) =>
                            setGoalsForm((p) => ({
                              ...p,
                              goalDuration: e.target.value,
                            }))
                          }
                        />
                      </div>

                      {/* Long-term Goals */}
                      <div className="space-y-2 col-span-2">
                        <Label>Long-term Goals</Label>
                        <textarea
                          className="w-full p-2 border rounded-md min-h-[80px]"
                          onChange={(e) =>
                            setGoalsForm((p) => ({
                              ...p,
                              longTermGoals: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="flex justify-end gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAssignPhysioOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={updatePatientGoals}>Save Changes</Button>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PatientDetailsDialog;
