import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserPlus, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import { apiRequest } from '@/components/CustomComponents/apiRequest'
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    lead: 0,
    patient: 0,
    session: 0,
    monthlyRevenue: 0,
    // physio: 0,
    sessionCompleted: 0
  });

  // useEffect(() => {
  //   Promise.all([
  //     fetch('/mockdata/leads.json').then(res => res.json()),
  //     fetch('/mockdata/patients.json').then(res => res.json()),
  //     fetch('/mockdata/sessions.json').then(res => res.json()),
  //     fetch('/mockdata/physios.json').then(res => res.json())
  //   ]).then(([leads, patients, sessions, physios]) => {
  //     const completedSessions = sessions.filter(s => s.status === 'completed');
  //     const monthlyRevenue = completedSessions.reduce((sum, session) => {
  //       const physio = physios.find(p => p.id === session.physioId);
  //       return sum + (physio?.ratePerSession || 0);
  //     }, 0);

  //     setStats({
  //       totalLeads: leads.length,
  //       totalPatients: patients.length,
  //       totalSessions: sessions.length,
  //       monthlyRevenue,
  //       completedSessions: completedSessions.length
  //     });
  //   }).catch(err => console.error('Error loading dashboard data:', err));
  // }, []);


  useEffect(()=>{
  getAllDashBoard()
  },[])
  
    const getAllDashBoard = async(data) => {
      try {
        const response = await apiRequest("DashBoard/getAllDashBoard", {
               method: 'POST',
               body: JSON.stringify(data),
              
             });
             setStats(response)
              console.log(response,"response")
     } catch (error) {
        console.error('Error:', error);
        throw error;
      }
    }

  const statCards = [
    {
      title: 'Total Leads',
      value: stats.lead,
      icon: UserPlus,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Total Patients',
      value: stats.patient,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Total Sessions',
      value: stats.session,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Monthly Revenue',
      value: `₹${stats.monthlyRevenue}`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100'
    },
    {
      title: 'Completed Sessions',
      value: stats.sessionCompleted,
      icon: TrendingUp,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100'
    }
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Comprehensive management overview including revenue insights</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="medical-card hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-full ${stat.bgColor}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    Updated in real-time
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card className="medical-card">
            <CardHeader>
              <CardTitle>Revenue Breakdown</CardTitle>
              <CardDescription>Monthly revenue analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Physiotherapy Sessions</span>
                  <span className="font-medium">₹{(stats.monthlyRevenue * 0.8) }</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Consultation Fees</span>
                  <span className="font-medium">₹{(stats.monthlyRevenue * 0.15)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Equipment Usage</span>
                  <span className="font-medium">₹{(stats.monthlyRevenue * 0.05)}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between items-center font-semibold">
                    <span>Total Revenue</span>
                    <span>₹{stats.monthlyRevenue}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <Card className="medical-card">
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>Key performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Lead Conversion Rate</span>
                  <span className="font-medium text-green-600">78%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Session Completion Rate</span>
                  <span className="font-medium text-blue-600">92%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Patient Satisfaction</span>
                  <span className="font-medium text-purple-600">4.8/5</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Average Revenue per Patient</span>
                  <span className="font-medium text-orange-600">₹2,450</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;