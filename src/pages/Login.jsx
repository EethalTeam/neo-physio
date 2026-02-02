import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Stethoscope, Eye, EyeOff } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { apiRequest } from "@/components/CustomComponents/apiRequest";

const Login = () => {
  const [physio, setPhysio] = useState([]);
  console.log(physio, "physio");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    physioCode: "",
    password: "",
    // role: ''
  });
  const { login } = useAuth();
  const { getPermissionsByPath } = useAuth();
  const navigate = useNavigate();

  // const roles = [
  //   { value: 'SuperAdmin', label: 'SuperAdmin' },
  //   { value: 'Admin', label: 'Admin' },
  //   { value: 'HOD', label: 'Head of Department' },
  //   { value: 'physio', label: 'Physiotherapist' }
  // ];

  //api for physio Code

  useEffect(() => {
    getPhysio();
  }, []);

  const getPhysio = async (data) => {
    try {
      // const getcode = {
      //   physioCode:data.physioCode
      // }
      const response = await apiRequest("Physio/getAllPhysio", {
        method: "POST",
        body: JSON.stringify({}),
      });
      setPhysio(response.physios || []);
    } catch (error) {
      console.error("Error loading physios:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.physioCode || !formData.password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    try {
      const res = await login(formData.physioCode, formData.password);
      if (res?.success) {
        toast({
          title: "Success",
          description: "Login successful!",
        });
        navigate("/dashboard");
      } else {
        toast({
          title: "Login Failed",
          description: res?.message || "Invalid physio code or password",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: res?.message,
        variant: "alert",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-[350px]">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-blue-600 rounded-full">
                <Stethoscope className="text-white" size={32} />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800">
              NEO DESK
            </CardTitle>
            <CardDescription>Sign in to access your dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="physioCode">Physio Code</Label>
                <Input
                  id="physioCode"
                  type="type"
                  placeholder="Enter your Employe Code"
                  value={formData.physioCode}
                  onChange={(e) =>
                    setFormData({ ...formData, physioCode: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="relative left-60 bottom-9  transform translate-y text-gray-400 hover:text-white"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div> */}

              <Button type="submit" className="w-full">
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Login;
