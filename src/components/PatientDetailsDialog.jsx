import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { apiRequest } from "./CustomComponents/apiRequest";
import { format, isValid, parseISO } from "date-fns";

const DetailItem = ({ label, value }) =>
  value !== undefined && value !== null && value !== "" ? (
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
  const [reviews, setReviews] = useState([]);
  const user = JSON.parse(localStorage.getItem("user"));
  const [goalsForm, setGoalsForm] = useState({
    shortTermGoals: "",
    longTermGoals: "",
    physioshortTermGoals: "",
    physiolongTermGoals: "",
    goalDuration: "",
  });
  const isPhysioUser = user?.role === "Physio";

  const getReviewById = async (patientId) => {
    try {
      const response = await apiRequest("Review/getSingleReview", {
        method: "POST",
        body: JSON.stringify({ patientId }),
      });
      setReviews(response || []);
    } catch (error) {
      console.error("Error fetching patient reviews:", error);
      setReviews([]);
    }
  };

  useEffect(() => {
    if (patient?._id) {
      getReviewById(patient._id);
    }
  }, [patient]);

  useEffect(() => {
    setGoalsForm({
      shortTermGoals:
        patient?.shortTermGoals || patient?.patientId?.shortTermGoals || "",
      longTermGoals:
        patient?.longTermGoals || patient?.patientId?.longTermGoals || "",
      physioshortTermGoals:
        patient?.physioshortTermGoals ||
        patient?.patientId?.physioshortTermGoals ||
        "",
      physiolongTermGoals:
        patient?.physiolongTermGoals ||
        patient?.patientId?.physiolongTermGoals ||
        "",
      goalDuration:
        patient?.goalDuration || patient?.patientId?.goalDuration || "",
    });
  }, [patient]);
  const updatePatientGoals = async () => {
    try {
      const payload = {
        patientId: patient?.patientId?._id || patient?._id,
      };

      if (isPhysioUser) {
        payload.physioshortTermGoals = goalsForm.physioshortTermGoals;
        payload.physiolongTermGoals = goalsForm.physiolongTermGoals;
      } else {
        payload.shortTermGoals = goalsForm.shortTermGoals;
        payload.longTermGoals = goalsForm.longTermGoals;
        payload.goalDuration = goalsForm.goalDuration;
      }

      await apiRequest("Patient/updatePatientGoals", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      toast({
        title: "Success",
        description: "Patient goals updated successfully",
      });

      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to update patient goals",
        variant: "destructive",
      });
    }
  };

  if (!patient) return null;

  const consultationDate = (() => {
    const date =
      patient?.consultationDate || patient?.patientId?.consultationDate;
    return date ? format(new Date(date), "PPP") : "N/A";
  })();

  const sessionStartDate = (() => {
    const dateString =
      patient?.sessionStartDate || patient?.patientId?.sessionStartDate;
    if (!dateString) return "N/A";
    const date =
      typeof dateString === "string"
        ? parseISO(dateString)
        : new Date(dateString);
    return isValid(date) ? format(date, "PPP") : "N/A";
  })();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Patient Details:{" "}
            {patient?.patientName || patient?.patientId?.patientName}
          </DialogTitle>
          <DialogDescription>
            Comprehensive overview of{" "}
            {patient?.patientName || patient?.patientId?.patientName}'s profile
            and medical history.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-4 mt-4">
          <Accordion
            type="multiple"
            defaultValue={["item-1", "item-2", "item-3", "item-4", "item-5"]}
            className="w-full"
          >
            <AccordionItem value="item-1">
              <AccordionTrigger>Patient Details</AccordionTrigger>
              <AccordionContent>
                <DetailSection>
                  <DetailItem
                    label="Patient Code"
                    value={
                      patient?.patientCode || patient?.patientId?.patientCode
                    }
                  />

                  {!isPhysioUser && (
                    <DetailItem
                      label="Consultation Date"
                      value={consultationDate}
                    />
                  )}

                  <DetailItem
                    label="Physio Name"
                    value={patient?.physioId?.physioName}
                  />

                  <DetailItem
                    label="Age"
                    value={
                      patient?.patientAge || patient?.patientId?.patientAge
                    }
                  />

                  {!isPhysioUser && (
                    <>
                      <DetailItem
                        label="Gender"
                        value={
                          patient?.patientGenderId?.genderName ||
                          patient?.patientId?.patientGenderId?.genderName
                        }
                      />
                      <DetailItem
                        label="Bystander Name"
                        value={
                          patient?.byStandar || patient?.patientId?.byStandar
                        }
                      />
                      <DetailItem
                        label="Relation"
                        value={
                          patient?.Relation || patient?.patientId?.Relation
                        }
                      />
                      <DetailItem
                        label="Mobile No."
                        value={
                          patient?.patientNumber ||
                          patient?.patientId?.patientNumber
                        }
                      />
                      <DetailItem
                        label="Alt. Mobile No."
                        value={
                          patient?.patientAltNum ||
                          patient?.patientId?.patientAltNum
                        }
                      />
                      <DetailItem
                        label="Address"
                        value={
                          patient?.patientAddress ||
                          patient?.patientId?.patientAddress
                        }
                      />
                      <DetailItem
                        label="PIN Code"
                        value={
                          patient?.patientPinCode ||
                          patient?.patientId?.patientPinCode
                        }
                      />
                      <DetailItem
                        label="Session Start Date"
                        value={sessionStartDate}
                      />
                      <DetailItem
                        label="Total Session Days"
                        value={
                          patient?.totalSessionDays ||
                          patient?.patientId?.totalSessionDays
                        }
                      />
                      <DetailItem
                        label="Session Time"
                        value={
                          patient?.sessionTime ||
                          patient?.patientId?.sessionTime
                        }
                      />
                      <DetailItem
                        label="KM From Patient to Hub"
                        value={
                          patient?.KmsfLPatienttoHub ||
                          patient?.patientId?.KmsfLPatienttoHub
                        }
                      />
                      <DetailItem
                        label="KM From Hub"
                        value={
                          patient?.KmsfromHub || patient?.patientId?.KmsfromHub
                        }
                      />
                      <DetailItem
                        label="Initial Short-term Goal"
                        value={
                          patient?.InitialShorttermGoal ||
                          patient?.patientId?.InitialShorttermGoal
                        }
                      />
                      <DetailItem
                        label="Goal Duration"
                        value={
                          patient?.goalDuration ||
                          patient?.patientId?.goalDuration
                        }
                      />
                    </>
                  )}

                  <DetailItem
                    label="Patient Condition"
                    value={
                      patient?.patientCondition ||
                      patient?.patientId?.patientCondition
                    }
                  />
                </DetailSection>

                <div className="mt-4">
                  {Array.isArray(reviews) && reviews.length > 0 ? (
                    reviews.map((rev) => (
                      <div
                        key={rev._id}
                        className="w-full border rounded-lg mt-4 p-4 shadow-sm bg-sky-50"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <DetailItem
                            label="Review Date"
                            value={
                              rev?.reviewDate
                                ? new Date(rev.reviewDate).toLocaleDateString()
                                : "N/A"
                            }
                          />
                          <DetailItem
                            label="Review Status"
                            value={
                              rev?.reviewStatusId?.reviewStatusName || "N/A"
                            }
                          />
                          <DetailItem
                            label="Feedback"
                            value={rev?.feedback || "N/A"}
                          />
                          <DetailItem
                            label="Review Type"
                            value={rev?.reviewTypeId?.reviewTypeName || "N/A"}
                          />
                          <DetailItem
                            label="Red Flags"
                            value={
                              rev?.redFlags?.length
                                ? `${rev.redFlags.length}`
                                : "0"
                            }
                          />
                          {rev?.redFlags?.length > 0 && (
                            <DetailItem
                              label="Red Flag Names"
                              value={rev.redFlags
                                .map((x) => x?.redFlagId?.redflagName)
                                .filter(Boolean)
                                .join(", ")}
                            />
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <DetailItem label="Review" value="N/A" />
                  )}
                </div>
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
                    value={patient?.diabetic || patient?.patientId?.diabetic}
                  />
                  <DetailItem
                    label="Hypertension"
                    value={
                      patient?.hypertension || patient?.patientId?.hypertension
                    }
                  />
                  <DetailItem
                    label="Arthritis"
                    value={patient?.arthritis || patient?.patientId?.arthritis}
                  />
                  <DetailItem
                    label="Trauma"
                    value={patient?.trauma || patient?.patientId?.trauma}
                  />
                  <DetailItem
                    label="Osteoporosis"
                    value={
                      patient?.osteoporosis || patient?.patientId?.osteoporosis
                    }
                  />
                </DetailSection>

                <div className="mt-2 space-y-2">
                  <DetailItem
                    label="History of Surgery"
                    value={
                      (patient?.historyOfSurgery !== undefined
                        ? patient.historyOfSurgery
                          ? "Yes"
                          : "No"
                        : patient?.patientId?.historyOfSurgery
                          ? "Yes"
                          : "No") +
                      (patient?.historyOfSurgeryDetails
                        ? ` (${patient.historyOfSurgeryDetails})`
                        : "")
                    }
                  />

                  <DetailItem
                    label="History of Fall"
                    value={
                      (patient?.historyOfFall !== undefined
                        ? patient.historyOfFall
                          ? "Yes"
                          : "No"
                        : patient?.patientId?.historyOfFall
                          ? "Yes"
                          : "No") +
                      (patient?.historyOfFallDetails
                        ? ` (${patient.historyOfFallDetails})`
                        : "")
                    }
                  />

                  <DetailItem
                    label="Other Medical Conditions"
                    value={
                      patient?.otherMedicalConditions ||
                      patient?.patientId?.otherMedicalConditions ||
                      "-"
                    }
                  />

                  <DetailItem
                    label="Current Medications"
                    value={
                      patient?.currentMedications ||
                      patient?.patientId?.currentMedications ||
                      "-"
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
                      patient?.typesOfLifeStyle ||
                      patient?.patientId?.typesOfLifeStyle
                    }
                  />
                  <DetailItem
                    label="Smoking/Alcohol"
                    value={
                      patient?.smokingOrAlcohol ||
                      patient?.patientId?.smokingOrAlcohol
                    }
                  />
                  <DetailItem
                    label="Dietary Habits"
                    value={
                      patient?.dietaryHabits ||
                      patient?.patientId?.dietaryHabits
                    }
                  />
                </div>

                <div>
                  <h4 className="font-semibold mb-1">Contraindications</h4>
                  <p className="text-sm p-2 bg-red-50 rounded">
                    {patient?.Contraindications ||
                      patient?.patientId?.Contraindications ||
                      "None specified"}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-1">HOD Notes</h4>
                  <p className="text-sm p-2 bg-blue-50 rounded">
                    {patient?.hodNotes ||
                      patient?.patientId?.hodNotes ||
                      "No notes from HOD"}
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {!isPhysioUser && (
              <AccordionItem value="item-4">
                <AccordionTrigger>Treatment Plan</AccordionTrigger>
                <AccordionContent>
                  <DetailSection>
                    <DetailItem
                      label="Short-term Goals"
                      value={
                        patient?.shortTermGoals ||
                        patient?.patientId?.shortTermGoals
                      }
                    />
                    <DetailItem
                      label="Long-term Goals"
                      value={
                        patient?.longTermGoals ||
                        patient?.patientId?.longTermGoals
                      }
                    />
                    <DetailItem
                      label="Recommended Therapy"
                      value={
                        patient?.RecomTherapy ||
                        patient?.patientId?.RecomTherapy
                      }
                    />
                    <DetailItem
                      label="Review Frequency"
                      value={
                        patient?.patientId?.reviewFrequency
                          ? `${patient.patientId.reviewFrequency} Per Week`
                          : patient?.reviewFrequency
                            ? `${patient.reviewFrequency} Per Week`
                            : "-"
                      }
                    />
                    <DetailItem
                      label="Duration"
                      value={patient?.Duration || patient?.patientId?.Duration}
                    />
                    <DetailItem
                      label="Modalities"
                      value={(() => {
                        const names = (patient?.modalitiesList || [])
                          .filter((item) => item?.isOccurred === true)
                          .map((item) => item?.modalityId?.modalitiesName)
                          .filter(Boolean)
                          .join(", ");
                        return names ? `Yes (${names})` : "No";
                      })()}
                    />
                    <DetailItem
                      label="Machine Name"
                      value={
                        patient?.machineId?.machineName ||
                        patient?.patientId?.machineId?.machineName
                      }
                    />
                    <DetailItem
                      label="Targeted Area"
                      value={
                        patient?.targetedArea ||
                        patient?.patientId?.targetedArea
                      }
                    />
                    <DetailItem
                      label="No of Days"
                      value={patient?.noOfDays || patient?.patientId?.noOfDays}
                    />
                  </DetailSection>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>

          {isPhysioUser ? (
            <div className="mt-6 border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Physio Goals</h3>
              {isPhysioUser && (
                <DetailSection>
                  <DetailItem
                    label="Physio Short-term Goals"
                    value={
                      patient?.physioshortTermGoals ||
                      patient?.physioshortTermGoals ||
                      "-"
                    }
                  />
                  <DetailItem
                    label="Physio Long-term Goals"
                    value={
                      patient?.physiolongTermGoals ||
                      patient?.physiolongTermGoals ||
                      "-"
                    }
                  />
                </DetailSection>
              )}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Physio Short-term Goals</Label>
                  <textarea
                    className="w-full p-2 border rounded-md min-h-[100px]"
                    value={goalsForm.physioshortTermGoals}
                    onChange={(e) =>
                      setGoalsForm((prev) => ({
                        ...prev,
                        physioshortTermGoals: e.target.value,
                      }))
                    }
                    placeholder="Enter physio short-term goals"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Physio Long-term Goals</Label>
                  <textarea
                    className="w-full p-2 border rounded-md min-h-[100px]"
                    value={goalsForm.physiolongTermGoals}
                    onChange={(e) =>
                      setGoalsForm((prev) => ({
                        ...prev,
                        physiolongTermGoals: e.target.value,
                      }))
                    }
                    placeholder="Enter physio long-term goals"
                  />
                </div>

                <div className="flex justify-end gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={updatePatientGoals}>Save Changes</Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6 border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Treatment Goals</h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Short-term Goals</Label>
                  <textarea
                    className="w-full p-2 border rounded-md min-h-[100px]"
                    value={goalsForm.shortTermGoals}
                    onChange={(e) =>
                      setGoalsForm((prev) => ({
                        ...prev,
                        shortTermGoals: e.target.value,
                      }))
                    }
                    placeholder="Enter short-term goals"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Goal Duration (days)</Label>
                  <Input
                    type="number"
                    value={goalsForm.goalDuration}
                    onChange={(e) =>
                      setGoalsForm((prev) => ({
                        ...prev,
                        goalDuration: e.target.value,
                      }))
                    }
                    placeholder="Enter goal duration"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Long-term Goals</Label>
                  <textarea
                    className="w-full p-2 border rounded-md min-h-[100px]"
                    value={goalsForm.longTermGoals}
                    onChange={(e) =>
                      setGoalsForm((prev) => ({
                        ...prev,
                        longTermGoals: e.target.value,
                      }))
                    }
                    placeholder="Enter long-term goals"
                  />
                </div>

                <div className="flex justify-end gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={updatePatientGoals}>Save Changes</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PatientDetailsDialog;
