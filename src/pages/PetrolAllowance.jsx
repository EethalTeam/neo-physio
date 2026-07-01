import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Calendar as CalendarIcon,
  Filter,
  Fuel,
  User,
  PlusCircle,
  MinusCircle,
} from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "@/components/CustomComponents/apiRequest";

const PetrolAllowance = () => {
  const navigate = useNavigate();
  const [physios, setPhysios] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [physioFilter, setPhysioFilter] = useState("all");

  const [openPhysios, setOpenPhysios] = useState({});
  const [openPatients, setOpenPatients] = useState({});

  const togglePhysio = (id) => setOpenPhysios((p) => ({ ...p, [id]: !p[id] }));
  const togglePatient = (id) =>
    setOpenPatients((p) => ({ ...p, [id]: !p[id] }));

  const { getPermissionsByPath } = useAuth();
  const [Permissions, setPermissions] = useState({ isView: false });

  useEffect(() => {
    getPhysio();
    getPermissionsByPath(window.location.pathname).then((res) => {
      if (res) setPermissions(res);
      else navigate("/dashboard");
    });
  }, []);

  useEffect(() => {
    if (Permissions.isView && dateRange?.from && dateRange?.to) {
      getPetrol();
    }
  }, [Permissions, dateRange, physioFilter]);
  const getPhysio = async () => {
    try {
      const response = await apiRequest("Physio/getAllPhysio", {
        method: "POST",
      });
      setPhysios(response.physios);
    } catch (error) {
      console.error(error);
    }
  };

  const getPetrol = async () => {
    // Guard clause: Don't fetch if dateRange is incomplete
    if (!dateRange?.from || !dateRange?.to) return;

    try {
      const response = await apiRequest(
        "PetrolAllowance/getAllPetrolAllowance",
        {
          method: "POST",
          body: JSON.stringify({
            from: format(dateRange.from, "yyyy-MM-dd"),
            to: format(dateRange.to, "yyyy-MM-dd"),
            physioId: physioFilter === "all" ? null : physioFilter, // Optional: if your backend supports filtering at query level
          }),
        },
      );
      setDailyData(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error("Fetch Error:", error);
      toast({
        title: "Error",
        description: "Could not fetch allowance data.",
        variant: "destructive",
      });
    }
  };

  const handleAdjustment = async (allowanceId, delta) => {
    try {
      const res = await apiRequest("PetrolAllowance/updateManualKms", {
        method: "POST",
        body: JSON.stringify({
          petrolAllowanceId: allowanceId,
          amount: Number(delta),
        }),
      });
      getPetrol();
      toast({ title: "Success", description: res.message });
    } catch (err) {
      toast({
        title: "Error",
        description: err?.message,
        variant: "destructive",
      });
    }
  };

  // --- DATA TRANSFORMATION LOGIC ---
  // Transforms DailyLogs into Patient-grouped data
  const transformedData = useMemo(() => {
    return dailyData.map((physio) => {
      const patientMap = {};

      physio.patients.forEach((logItem) => {
        const log = logItem.dailyLogs;

        log.patientDetails.forEach((detail) => {
          const pId = detail.patientId;
          if (!patientMap[pId]) {
            patientMap[pId] = {
              patientId: pId,
              patientName: detail.patientName,
              totalKm: 0,
              dateLogs: [],
            };
          }
          patientMap[pId].totalKm += detail.km;
          patientMap[pId].dateLogs.push({
            date: log.date,
            km: detail.km,
            status: log.status,
          });
        });
      });

      return {
        ...physio,
        groupedPatients: Object.values(patientMap).sort((a, b) =>
          a.patientName.localeCompare(b.patientName),
        ),
      };
    });
  }, [dailyData]);

  const filteredData = useMemo(() => {
    if (physioFilter === "all") return transformedData;
    return transformedData.filter((g) => g.physioId === physioFilter);
  }, [transformedData, physioFilter]);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex md:flex-row flex-col md:justify-between items-start space-y-3"
      >
        <div>
          <h1 className="md:text-3xl text-xl font-bold text-gray-800 mb-2">
            Petrol Allowance
          </h1>
          <p className="text-gray-600">
            Physio Wise → Patient Wise → Date Wise
          </p>
        </div>
      </motion.div>

      {/* FILTERS */}
      <Card className="medical-card">
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
          <div className="space-y-2">
            <Label>Date Range</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.to && dateRange?.from
                    ? `${format(dateRange?.from, "PP")} - ${format(dateRange?.to, "PP")}`
                    : "Pick dates"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label>Physiotherapist</Label>
            <Select value={physioFilter} onValueChange={setPhysioFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Physiotherapists</SelectItem>
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

      {/* DATA VIEW */}
      <div className="space-y-4">
        {filteredData.map((physio) => {
          const isPhysioOpen = !!openPhysios[physio.physioId];
          return (
            <Card
              key={physio.physioId}
              className="medical-card overflow-hidden"
            >
              <div
                className="p-4 bg-gray-50 flex items-center justify-between cursor-pointer border-b"
                onClick={() => togglePhysio(physio.physioId)}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "transition-transform",
                      isPhysioOpen ? "rotate-90" : "rotate-0",
                    )}
                  >
                    ▶
                  </span>
                  <User size={18} className="text-blue-600" />
                  <span className="font-bold text-gray-800">
                    {physio.physioName}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-500 uppercase">
                    Total KM:{" "}
                  </span>
                  <span className="font-bold text-blue-700">
                    {physio.grandTotalPhysioKm.toFixed(2)}
                  </span>
                </div>
              </div>

              {isPhysioOpen && (
                <div className="divide-y">
                  {physio.groupedPatients.map((patient) => {
                    const patientKey = `${physio.physioId}-${patient.patientId}`;
                    const isPatientOpen = !!openPatients[patientKey];
                    return (
                      <div key={patient.patientId} className="bg-white">
                        <div
                          className="p-3 pl-10 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                          onClick={() => togglePatient(patientKey)}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "text-xs transition-transform",
                                isPatientOpen ? "rotate-90" : "rotate-0",
                              )}
                            >
                              ▶
                            </span>
                            <span className="font-semibold text-gray-700">
                              {patient.patientName}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-gray-500">
                            {patient.totalKm.toFixed(2)} km total
                          </span>
                        </div>

                        {isPatientOpen && (
                          <div className="p-4 pl-16 bg-gray-50/50">
                            <table className="w-full text-xs text-gray-600">
                              <thead>
                                <tr className="border-b text-left">
                                  <th className="pb-2">Date</th>
                                  <th className="pb-2 text-center">Status</th>
                                  <th className="pb-2 text-right">KM</th>
                                </tr>
                              </thead>
                              <tbody>
                                {patient.dateLogs.map((log, idx) => (
                                  <tr
                                    key={idx}
                                    className="border-b last:border-0"
                                  >
                                    <td className="py-2">
                                      {format(new Date(log.date), "PPP")}
                                    </td>
                                    <td className="py-2 text-center font-medium text-blue-600">
                                      {log.status}
                                    </td>
                                    <td className="py-2 text-right font-bold text-gray-800">
                                      {log.km.toFixed(2)} km
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {physio.groupedPatients.length === 0 && (
                    <div className="p-4 text-center text-gray-500 text-sm italic">
                      No patient travel records found for this period.
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default PetrolAllowance;
