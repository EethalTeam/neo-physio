
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutDashboard, Users, UserPlus, Calendar, Settings, BarChart3, Stethoscope, ChevronLeft, HeartPulse, Share2, FileSpreadsheet, Flag, Wallet, Layers, Database, Map , SquareCode  } from 'lucide-react';  
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

 

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user } = useAuth();
  const location = useLocation();

  const getMenuItems = () => {
    const baseItems = [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    ];

    const mastersSubmenu = {
        icon: Database,
        label: 'Masters',
        isMenu: true,
        submenu: [
             { icon: Layers, label: 'Categories', path: '/categories' },
             { icon: Flag, label: 'Red Flags', path: '/red-flags' },
             { icon: Map, label : 'Country',path :'/country'},
             { icon: Map, label : 'State',path :'/state'},
             { icon: Map, label : 'City',path :'/city'},
             { icon: Layers , label : 'Physio Category',path :'/physioCategory'},
             { icon: SquareCode, label : 'Lead Source', path : '/leadSource' },
             { icon: SquareCode, label : 'Gender', path : '/gender' },
           
             

            ]
    };
    
    const roleBasedItems = {
      super_admin: [
        { icon: UserPlus, label: 'Leads', path: '/leads' },
        { icon: Users, label: 'Patients', path: '/patients' },
        { icon: Calendar, label: 'Sessions', path: '/sessions' },
        { icon: Stethoscope, label: 'Physios', path: '/physios' },
        { icon: Settings, label: 'Machinery', path: '/machinery' },
        { icon: Share2, label: 'References', path: '/references' },
        mastersSubmenu,
        { icon: Wallet, label: 'Expenses', path: '/expenses' },
        { icon: Wallet, label: 'Petrol Allowance', path: '/petrol-allowance' },
        { icon: FileSpreadsheet, label: 'Payroll', path: '/payroll' },
        { icon: BarChart3, label: 'Reports', path: '/reports' }        
      ],
      admin: [
        { icon: UserPlus, label: 'Leads', path: '/leads' },
        { icon: Users, label: 'Patients', path: '/patients' },
        { icon: Calendar, label: 'Sessions', path: '/sessions' },
        { icon: Stethoscope, label: 'Physios', path: '/physios' },
        { icon: Settings, label: 'Machinery', path: '/machinery' },
        { icon: Share2, label: 'References', path: '/references' },
        mastersSubmenu,
        { icon: Flag, label: 'Red Flags', path: '/red-flags' },
        { icon: FileSpreadsheet, label: 'Payroll', path: '/payroll' },
        { icon: BarChart3, label: 'Reports', path: '/reports' },
          { icon: Map, label : 'Country',path :'/country'}

      ],
      hod: [
        { icon: Users, label: 'Patients', path: '/patients' },
        { icon: Calendar, label: 'Sessions', path: '/sessions' },
        { icon: Settings, label: 'Machinery', path: '/machinery' },
        { icon: Flag, label: 'Red Flags', path: '/red-flags' },
        { icon: BarChart3, label: 'Reports', path: '/reports' },
      ],
      physio: [
        { icon: Calendar, label: 'My Sessions', path: '/sessions' },
        { icon: FileSpreadsheet, label: 'Monthly Summary', path: '/monthly-summary'}
      ],
    };
    
    if(user?.role === 'physio' && !roleBasedItems.physio.find(item => item.path === '/monthly-summary')) {
        roleBasedItems.physio.push({ icon: FileSpreadsheet, label: 'Monthly Summary', path: '/monthly-summary'});
    }


    return [...baseItems, ...(roleBasedItems[user?.role] || [])];
  };
  
  const [openAccordion, setOpenAccordion] = useState('');

  const menuItems = getMenuItems();

  const sidebarVariants = {
    open: { width: '16rem', transition: { type: 'spring', stiffness: 300, damping: 30 } },
    closed: { width: '5rem', transition: { type: 'spring', stiffness: 300, damping: 30 } },
  };

  const textVariants = {
    open: { opacity: 1, x: 0, transition: { delay: 0.1 } },
    closed: { opacity: 0, x: -10 },
  };

  const NavItem = ({ item }) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path;
    return (
        <Link
          to={item.path}
          title={item.label}
          className={`flex items-center h-12 rounded-lg transition-all duration-200 ${
            isActive ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'
          } ${isOpen ? 'px-4' : 'justify-center'}`}
        >
          <Icon size={20} className="shrink-0" />
          {isOpen && (
            <motion.span
              initial={false}
              animate={isOpen ? 'open' : 'closed'}
              variants={textVariants}
              className="ml-3 font-medium whitespace-nowrap"
            >
              {item.label}
            </motion.span>
          )}
        </Link>
    );
  };
  
  return (
    <>
      <div
        className={`fixed inset-0 bg-black/30 z-40 lg:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      />
      <motion.div
        variants={sidebarVariants}
        animate={isOpen ? 'open' : 'closed'}
        className="fixed left-0 top-0 h-full bg-white shadow-lg z-50 flex flex-col"
      >
        <div className={`flex items-center border-b h-16 shrink-0 ${isOpen ? 'justify-between px-4' : 'justify-center'}`}>
          {isOpen ? (
            <motion.div
              initial={false}
              animate={isOpen ? 'open' : 'closed'}
              variants={textVariants}
              className="flex items-center gap-2"
            >
              <HeartPulse className="text-blue-600" size={28} />
              <span className="text-xl font-bold text-blue-600">NEO Physio</span>
            </motion.div>
          ): <HeartPulse className="text-blue-600" size={28} />}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors absolute -right-4 top-5 bg-white border shadow-sm hidden lg:block"
          >
            <ChevronLeft size={16} className={`transition-transform ${isOpen ? '' : 'rotate-180'}`} />
          </button>
        </div>

        <nav className="mt-4 flex-1 overflow-y-auto overflow-x-hidden">
        <Accordion type="single" collapsible value={openAccordion} onValueChange={setOpenAccordion} className="w-full">
          {menuItems.map((item, index) => (
             <div key={index} className="mx-3 my-1">
                {item.isMenu ? (
                    <AccordionItem value={item.label} className="border-none">
                       <AccordionTrigger className={`flex items-center h-12 rounded-lg transition-all duration-200 text-gray-600 hover:bg-gray-100 hover:no-underline ${isOpen ? 'px-4' : 'justify-center'}`}>
                           <div className="flex items-center">
                            <item.icon size={20} className="shrink-0" />
                            {isOpen && (
                                <motion.span
                                initial={false}
                                animate={isOpen ? 'open' : 'closed'}
                                variants={textVariants}
                                className="ml-3 font-medium whitespace-nowrap"
                                >
                                {item.label}
                                </motion.span>
                            )}
                           </div>
                       </AccordionTrigger>
                        <AccordionContent className="pl-6 pr-2 py-0">
                           {isOpen && item.submenu.map((subItem, subIndex) => (
                                <div key={subIndex} className="my-1">
                                    <NavItem item={subItem} />
                                </div>
                           ))}
                        </AccordionContent>
                    </AccordionItem>
                ) : (
                    <NavItem item={item} />
                )}
            </div>
          ))}
        </Accordion>
        </nav>
      </motion.div>
    </>
  );
};

export default Sidebar;
