import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/components/CustomComponents/apiRequest'
import { toast } from '@/components/ui/use-toast';

const HODDashboard = () => {
  const [stats, setStats] = useState({

    patient: 0,
    session: 0,
    alertsCount: 0,
    pendingReviews: 0,
    sessionCompleted: 0
  });


  const [reviews, setReviews] = useState([]);

  // useEffect(() => {
  //   Promise.all([
  //     fetch('/mockdata/patients.json').then(res => res.json()),
  //     fetch('/mockdata/sessions.json').then(res => res.json())
  //   ]).then(([patients, sessions]) => {
  //     const completedSessions = sessions.filter(s => s.status === 'completed');
  //     const alertSessions = sessions.filter(s => s.feedback && s.feedback.cons);

  //     // Mock pending reviews
  //     const mockReviews = patients.slice(0, 3).map(patient => ({
  //       id: patient.id,
  //       patientName: patient.name,
  //       reviewDate: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  //       status: 'pending'
  //     }));

  //     setStats({
  //       totalPatients: patients.length,
  //       totalSessions: sessions.length,
  //       pendingReviews: mockReviews.length,
  //       completedSessions: completedSessions.length,
  //       alertsCount: alertSessions.length
  //     });

  //     setReviews(mockReviews);
  //   }).catch(err => console.error('Error loading dashboard data:', err));
  // }, []);

  // const handleReviewAction = (reviewId, action) => {
  //   setReviews(prev => prev.map(review => 
  //     review.id === reviewId 
  //       ? { ...review, status: action }
  //       : review
  //   ));

  //   toast({
  //     title: "Review Updated",
  //     description: `Review has been marked as ${action}`
  //   });
  // };


  useEffect(() => {
    getAllDashBoard()
  }, [])

  const getAllDashBoard = async (data) => {
    try {
      const response = await apiRequest("DashBoard/getAllDashBoard", {
        method: 'POST',
        body: JSON.stringify(data),

      });
      setStats(response)
      console.log(response, "response")
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }




  const statCards = [
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
      title: 'Pending Reviews',
      value: stats.pendingReviews,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      title: 'Completed Sessions',
      value: stats.sessionCompleted,
      icon: CheckCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Alerts',
      value: stats.alertsCount,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    }
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-800 mb-2">HOD Dashboard</h1>
        <p className="text-gray-600">Department oversight and review management</p>
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
                    Requires attention
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
              <CardTitle>Pending Reviews</CardTitle>
              <CardDescription>15-day patient reviews requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800">{review.patientName}</p>
                      <p className="text-sm text-gray-600">Review Date: {review.reviewDate}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReviewAction(review.id, 'done')}
                        disabled={review.status !== 'pending'}
                      >
                        Done
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReviewAction(review.id, 'postponed')}
                        disabled={review.status !== 'pending'}
                      >
                        Postpone
                      </Button>
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
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <Card className="medical-card">
            <CardHeader>
              <CardTitle>Session Alerts</CardTitle>
              <CardDescription>Sessions with reported issues</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle className="text-red-500" size={20} />
                  <div>
                    <p className="font-medium text-red-800">Equipment Issue Reported</p>
                    <p className="text-sm text-red-600">Patient: John Doe - Machine: Ultrasound Unit</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertTriangle className="text-yellow-500" size={20} />
                  <div>
                    <p className="font-medium text-yellow-800">Session Feedback Concern</p>
                    <p className="text-sm text-yellow-600">Patient: Jane Smith - Discomfort reported</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <AlertTriangle className="text-orange-500" size={20} />
                  <div>
                    <p className="font-medium text-orange-800">Late Session Start</p>
                    <p className="text-sm text-orange-600">Patient: Mike Johnson - 30 min delay</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default HODDashboard;