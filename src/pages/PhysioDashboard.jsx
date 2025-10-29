import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, DollarSign, Clock, CheckCircle, User, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import PatientDetailsDialog from '@/components/PatientDetailsDialog';

const PhysioDashboard = () => {
  const [stats, setStats] = useState({
    todaySessions: 0,
    monthlyRevenue: 0,
    completedSessions: 0,
    upcomingSessions: 0
  });

  const [sessions, setSessions] = useState([]);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const currentPhysioId = 1; // Mock current physio ID

  useEffect(() => {
    Promise.all([
      fetch('/mockdata/sessions.json').then(res => res.json()),
      fetch('/mockdata/physios.json').then(res => res.json()),
      fetch('/mockdata/patients.json').then(res => res.json())
    ]).then(([allSessions, physios, patients]) => {
      const mySessions = allSessions.filter(s => s.physioId === currentPhysioId);
      const currentPhysio = physios.find(p => p.id === currentPhysioId);
      
      const today = new Date().toISOString().split('T')[0];
      const todaySessions = mySessions.filter(s => s.sessionDate === today);
      const completedSessions = mySessions.filter(s => s.status === 'completed');
      const upcomingSessions = mySessions.filter(s => s.status === 'scheduled');
      
      const monthlyRevenue = completedSessions.length * (currentPhysio?.ratePerSession || 0);

      const sessionsWithData = mySessions.map(session => {
        const patient = patients.find(p => p.id === session.patientId);
        return {
          ...session,
          patientName: patient?.name || 'Unknown',
          patientDetails: patient // Attach full patient details
        };
      });

      setStats({
        todaySessions: todaySessions.length,
        monthlyRevenue,
        completedSessions: completedSessions.length,
        upcomingSessions: upcomingSessions.length
      });

      setSessions(sessionsWithData.slice(0, 5));
    }).catch(err => console.error('Error loading dashboard data:', err));
  }, []);

  const handleSessionAction = (sessionId, action) => {
    setSessions(prev => prev.map(session => 
      session.id === sessionId 
        ? { ...session, status: action }
        : session
    ));
    
    toast({
      title: "Session Updated",
      description: `Session has been ${action}`
    });
  };

  const handleViewDetails = (patient) => {
    setSelectedPatient(patient);
    setIsDetailsOpen(true);
  };

  const statCards = [
    {
      title: "Today's Sessions",
      value: stats.todaySessions,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Monthly Revenue',
      value: `₹${stats.monthlyRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Completed Sessions',
      value: stats.completedSessions,
      icon: CheckCircle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Upcoming Sessions',
      value: stats.upcomingSessions,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Physiotherapist Dashboard</h1>
        <p className="text-gray-600">Your personal session management and revenue overview</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                    Your performance
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
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="medical-card">
            <CardHeader>
              <CardTitle>Upcoming Sessions</CardTitle>
              <CardDescription>Your scheduled patient sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="text-blue-600" size={16} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{session.patientName}</p>
                        <p className="text-sm text-gray-600">
                          {session.sessionDate} at {session.sessionTime}
                        </p>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full status-${session.status}`}>
                          {session.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {session.patientDetails && (
                        <Button size="sm" variant="ghost" onClick={() => handleViewDetails(session.patientDetails)}>
                          <Info size={16} />
                        </Button>
                      )}
                      {session.status === 'scheduled' && (
                        <Button
                          size="sm"
                          onClick={() => handleSessionAction(session.id, 'started')}
                        >
                          Start
                        </Button>
                      )}
                      {session.status === 'started' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSessionAction(session.id, 'completed')}
                        >
                          Complete
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card className="medical-card">
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
              <CardDescription>Your monthly performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Sessions This Month</span>
                  <span className="font-medium">{stats.completedSessions + stats.upcomingSessions}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Completion Rate</span>
                  <span className="font-medium text-green-600">95%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Average Session Duration</span>
                  <span className="font-medium">45 mins</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Patient Satisfaction</span>
                  <span className="font-medium text-blue-600">4.9/5</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between items-center font-semibold">
                    <span>Monthly Earnings</span>
                    <span className="text-green-600">₹{stats.monthlyRevenue.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <PatientDetailsDialog isOpen={isDetailsOpen} onOpenChange={setIsDetailsOpen} patient={selectedPatient} />

    </div>
  );
};

export default PhysioDashboard;