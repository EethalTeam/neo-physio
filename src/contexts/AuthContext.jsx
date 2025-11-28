import React, { createContext, useContext, useState, useEffect } from 'react';
import { config } from '@/components/CustomComponents/config';
import { apiRequest } from '@/components/CustomComponents/apiRequest'
import { toast } from '@/components/ui/use-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);




  // const [roles, setRoles] = useState([])
  // const [menuPermissions, setMenuPermissions] = useState({})
  // console.log(menuPermissions,"menuPermissions")
 
  // useEffect(() => {
  //   let rolepath = roles.reduce((acc, curr) => {
  //     if (!acc[curr.RoleName]) {
  //       return { ...acc, [curr.RoleName]: curr.permissions.map(val => val.menuDetails.path) }
  //     } else {
  //       return acc
  //     }
  //   }, {})
  //   console.log(rolepath,"rolepath")
  //   setMenuPermissions(rolepath)
  // }, [roles])
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedRole = localStorage.getItem('userRole');

    if (storedUser && storedRole) {
      setUser({ ...JSON.parse(storedUser), role: storedRole });
      setIsAuthenticated(true);
    }
    setLoading(false);
        // getRole()
  }, []);

  // const login = (physioCode, password) => {
  //   const userWithRole = { ...userData, role };
  //   setUser(userWithRole);
  //   setIsAuthenticated(true);
  //   localStorage.setItem('user', JSON.stringify(userData));
  //   localStorage.setItem('userRole', role);
  // };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    // setMenuPermissions([])
    // setRoles([])
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
  };


  const login = async (physioCode, password) => {
    try {
      let url = config.Api + "/api/Physio/loginPhysio";
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ physioCode, password }),
      });
      const data = await response.json();
      // Handle mobile restriction (403)
      if (response.status == 403) {
        toast({
          title: "Login failed",
          description: data.message || "Login not allowed",
        });
        return { success: false };
      }

      // Handle other errors
      if (!response.ok) {
        toast({
          title: "Login failed",
          description: data.message || "Login failed",
        });
        throw new Error(data.message || "Login failed");
      } else {
        //  socket.connect();
        // socket.emit("joinRoom", { employeeId:data.employee._id });
        setUser(data.physio);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(data.physio));
        localStorage.setItem('userRole', data.physio.role);
         toast({
                  title: "Login Successful",
                  description: `Welcome back, ${data.physio.physioName}!`,
                });
      }


      // store token in localStorage for later API calls
      if (data.token) {
        localStorage.setItem("token", data.token);
      }
      // setUser(data.employee);
      // localStorage.setItem('hrms_user', JSON.stringify(data.employee));
      // localStorage.setItem('userId', json.stringify(data.employee._id))
      // localStorage.setItem('hrms_userEmail', JSON.stringify(data.employee.email));
      return { ...data.physio, success: true };
    } catch (error) {
      console.error("Login Error:", error.message);
      throw error;
    }
  };

  // const logout = async () => {
  //   try {
  //     let email = JSON.parse(localStorage.getItem("hrms_user"));
  //     let url = config.Api + "/api/Physio/logoutPhysio";

  //     const response = await fetch(url, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({ email:email.email }),
  //     });

  //     const data = await response.json();

  //     // Clear user state and localStorage
  //     setUser(null);
  //     localStorage.clear();

  //     // Disconnect socket
  //     if (socket.connected) {
  //       socket.disconnect();
  //     }

  //     // toast({
  //     //   title: "Logged Out",
  //     //   description: "You have been successfully logged out.",
  //     // });

  //   } catch (error) {
  //     console.error("Logout Error:", error.message);
  //     throw error;
  //   }
  // };

  // utils/getPermissions.js

  // const getRole = async () => {
  //   try {
  //     const response = await apiRequest("RoleBased/getAllRoles", {
  //       method: 'POST',
  //       body: JSON.stringify({}),
  //     });
  //     setRoles(response.data || []);
  //   } catch (error) {
  //     console.error("Failed to fetch roles", error);
  //     setRoles([]);
  //   }
  // };



  const getPermissionsByPath = async (path) => {
    console.log(user, "user")
    const RoleName = user.role; // read role from localStorage
    if (!RoleName) return null;

    try {
      const res = await apiRequest("RoleBased/getPermissions", {
        method: "POST",
        body: JSON.stringify({ RoleName, path }),
      });

      const data = res
      if (data.success) {
        return data.permissions;
      } else {
        navigate('/dashboard')
        return null;
      }
    } catch (err) {
      console.error("Error fetching permissions:", err);
      return null;
    }
  }

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    getPermissionsByPath,
    // menuPermissions,
    // getRole,
  

  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};