import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, User, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { config } from "./CustomComponents/config";
import profile from "../Assets/images/profile.png";
import NotificationPanel from "@/components/NotificationPanel";
// import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@radix-ui/react-dropdown-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { apiRequest } from "../components/CustomComponents/apiRequest";
const Header = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const [isAssignPhysioOpen, setIsAssignPhysioOpen] = useState(false);
  const [assignForm, setAssignForm] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const userNotifications = notifications.filter(
    (n) => n.toEmployeeId === user._id && n.status === "unseen",
  );
  const { toast } = useToast();

  const getRoleDisplayName = (role) => {
    const roleNames = {
      SuperAdmin: "Super Admin",
      Admin: "Admin",
      HOD: "Head of Department",
      physio: "Physiotherapist",
    };
    return roleNames[role] || role;
  };

  const handleNotificationAction = async (notification, action) => {
    try {
      const res = await apiRequest("Notifications/updateNotificationStatus", {
        method: "POST",
        body: JSON.stringify({ notificationId: notification._id, action }),
      });

      if (res) {
        // Re-fetch updated notifications
        fetchNotifications();
        toast({
          title: `Request ${action}d`,
          description: `The request has been ${action}d.`,
        });
      } else {
        toast({
          title: "Error",
          description: res.message,
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error updating notification:", err);
      toast({
        title: "Error",
        description: "Failed to update notification.",
        variant: "destructive",
      });
    }
  };
  useEffect(() => {
    fetchNotifications();
  }, [user._id]);

  const markAsRead = async (notificationId) => {
    try {
      const res = await apiRequest("Notifications/markAsSeen/", {
        method: "POST",
        body: JSON.stringify({ notificationId }),
      });

      if (res) {
        // Re-fetch updated notifications
        fetchNotifications();
        toast({
          title: "Marked as read",
          description: "Notification marked as seen.",
        });
      } else {
        toast({
          title: "Error",
          description: res.message,
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error marking notification:", err);
      toast({
        title: "Error",
        description: "Failed to mark notification as seen.",
        variant: "destructive",
      });
    }
  };
  const fetchNotifications = async () => {
    try {
      const res = await apiRequest("Notifications/getNotifications", {
        method: "POST",
        body: JSON.stringify({ employeeId: user._id }),
      });
      const data = res;
      if (data?.data) setNotifications(data.data);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };
  const [physioData, setPhysioData] = useState(null);
  const handleUserClick = async () => {
    try {
      const res = await apiRequest("Physio/getAllPhysio", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const physios = res.physios;

      const fullPhysioData = physios.find((p) => p._id === user._id);

      if (!fullPhysioData) {
        console.error("Physio not found for logged-in user");
        return;
      }

      setPhysioData(fullPhysioData);
      setIsAssignPhysioOpen(true);
    } catch (error) {
      console.error(error);
    }
  };
  const [previewUrl, setPreviewUrl] = useState(null);
  console.log(previewUrl, "previewUrl");

  useEffect(() => {
    if (physioData?.physioPic) {
      const url = `${config.Api}/${physioData.physioPic.replace(/\\/g, "/")}`;
      setPreviewUrl(url);
    }
  }, [physioData]);

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="bg-white/80 backdrop-blur-lg sticky top-0 z-40 shadow-sm border-b px-4 sm:px-6 py-3  "
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="lg:hidden "
          >
            <Menu size={22} />
          </Button>
          <div className="hidden sm:block">
            <h2 className="text-lg font-semibold text-gray-800">
              Welcome back, {user?.physioName || "User"}!
            </h2>
            <p className="text-xs text-gray-500">
              {getRoleDisplayName(user?.role)}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          {/*<div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative rounded-full"
            >
              <Bell size={20} />
              <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center border-2 border-white">
                3
              </span>
            </Button>
            {showNotifications && (
              <NotificationPanel onClose={() => setShowNotifications(false)} />
            )}
          </div> */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-white/10"
              >
                <Bell className="w-5 h-5" />
                {userNotifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center animate-pulse">
                    {userNotifications.length}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-80 glass-effect border-white/10"
              style={{
                overflowY: "auto",
                height: "300px",
                scrollbarWidth: "none",
              }}
            >
              <div className="p-2 font-semibold">Notifications</div>
              <DropdownMenuSeparator />
              {userNotifications.length > 0 ? (
                userNotifications.map((notification) => (
                  <div key={notification._id} className="px-2 py-1.5 text-sm">
                    <p className="mb-2">{notification.message}</p>
                    {(notification.type === "permission-request" ||
                      notification.type === "leave-request" ||
                      notification.type === "task-complete") &&
                      notification.fromEmployeeId !== user._id &&
                      notification.status !== "approved" &&
                      notification.status !== "rejected" && (
                        <div className="flex gap-2 mt-1">
                          <Button
                            size="sm"
                            className="bg-green-500/80 hover:bg-green-500 h-7"
                            onClick={() =>
                              handleNotificationAction(notification, "approve")
                            }
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            className="bg-red-500/80 hover:bg-red-500 h-7"
                            onClick={() =>
                              handleNotificationAction(notification, "reject")
                            }
                          >
                            <X className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    {notification.type !== "permission-request" &&
                      notification.type !== "leave-request" &&
                      notification.type !== "task-complete" && (
                        <div className="flex gap-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7"
                            onClick={() => markAsRead(notification._id)}
                          >
                            Mark as read
                          </Button>
                          <p>
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                      )}
                  </div>
                ))
              ) : (
                <div className="px-2 py-4 text-center text-sm text-gray-400">
                  No new notifications
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <div
            onClick={handleUserClick}
            className="flex items-center space-x-2 cursor-pointer"
          >
            <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
              <User size={18} className="text-white" />
            </div>

            <span className="hidden md:inline text-sm font-medium text-gray-700">
              {user?.physioName || "User"}
            </span>
          </div>
          {physioData && (
            <Dialog
              open={isAssignPhysioOpen}
              onOpenChange={setIsAssignPhysioOpen}
            >
              <DialogContent className="max-w-2xl max-h-[95vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle>
                    Profile Details {physioData.physioName}
                  </DialogTitle>
                  <DialogDescription>
                    View the physiotherapist's personal information.
                  </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto pr-6 -mr-6 mt-4">
                  <h2 className="text-lg font-semibold mb-4">
                    Personal Information
                  </h2>
                  <div className="flex-1 flex items-center justify-center overflow-hidden p-2">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Physio"
                        className="w-32 h-32 rounded-full object-cover border shadow transition-transform duration-200 hover:scale-110 hover:shadow-xl"
                      />
                    ) : (
                      <img
                        src={profile}
                        alt="Physio"
                        className="w-32 h-32 rounded-full object-cover border shadow "
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col">
                      <Label>Physio Name</Label>
                      <p className="mt-1">{user?.physioName}</p>
                    </div>

                    <div className="flex flex-col">
                      <Label>Physio Code</Label>
                      <p className="mt-1">{user?.physioCode}</p>
                    </div>

                    <div className="flex flex-col">
                      <Label>Role</Label>
                      <p className="mt-1">{user?.role}</p>
                    </div>

                    <div className="flex flex-col">
                      <Label>Age</Label>
                      <p className="mt-1">{physioData.physioAge}</p>
                    </div>

                    <div className="flex flex-col">
                      <Label>Gender</Label>
                      <p className="mt-1">
                        {physioData.physioGenderId?.genderName}
                      </p>
                    </div>

                    <div className="flex flex-col">
                      <Label>Contact Number</Label>
                      <p className="mt-1">{physioData.physioContactNo}</p>
                    </div>

                    <div className="flex flex-col">
                      <Label>Years of Experience</Label>
                      <p className="mt-1">{physioData.physioExp}</p>
                    </div>

                    <div className="flex flex-col">
                      <Label>Aadhar Number</Label>
                      <p className="mt-1">{physioData.physioAadhar}</p>
                    </div>

                    <div className="flex flex-col">
                      <Label>PAN Number</Label>
                      <p className="mt-1">{physioData.physioPAN}</p>
                    </div>

                    <div className="flex flex-col">
                      <Label>Qualification</Label>
                      <p className="mt-1">{physioData.physioQulifi}</p>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full"
          >
            <LogOut size={20} />
          </Button>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
