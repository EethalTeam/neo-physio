import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, User, LogOut, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import NotificationPanel from '@/components/NotificationPanel';

const Header = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  const getRoleDisplayName = (role) => {
    const roleNames = {
      super_admin: 'Super Admin',
      admin: 'Admin',
      hod: 'Head of Department',
      physio: 'Physiotherapist'
    };
    return roleNames[role] || role;
  };

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className="bg-white/80 backdrop-blur-lg sticky top-0 z-40 shadow-sm border-b px-4 sm:px-6 py-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="lg:hidden"
          >
            <Menu size={22} />
          </Button>
          <div className="hidden sm:block">
            <h2 className="text-lg font-semibold text-gray-800">
              Welcome back, {user?.name || 'User'}!
            </h2>
            <p className="text-xs text-gray-500">
              {getRoleDisplayName(user?.role)}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className="relative">
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
          </div>

          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
              <User size={18} className="text-white" />
            </div>
            <span className="hidden md:inline text-sm font-medium text-gray-700">
              {user?.name || 'User'}
            </span>
          </div>

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