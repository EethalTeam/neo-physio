import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, Download, Calendar, Users, DollarSign } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const Reports = () => {
  const { user } = useAuth();
  const [reportData, setReportData] = useState({
    revenue: [],
    sessions: [],
    patients: [],
    feedback: []
  });
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');

  useEffect(() => {
    // Mock report data generation
    const generateMockData = () => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      const revenue = months.map(month => ({
        month,
        amount: Math.floor(Math.random() * 50000) + 20000
      }));

      const sessions = months.map(month => ({
        month,
        completed: Math.floor(Math.random() * 100) + 50,
        scheduled: Math.floor(Math.random() * 30) + 10
      }));

      const patients = months.map(month => ({
        month,
        new: Math.floor(Math.random() * 20) + 5,
        returning: Math.floor(Math.random() * 40) + 20
      }));

      const feedback = [
        { category: 'Excellent', count: 45, percentage: 60 },
        { category: 'Good', count: 22, percentage: 30 },
        { category: 'Average', count: 6, percentage: 8 },
        { category: 'Poor', count: 2, percentage: 2 }
      ];

      setReportData({ revenue, sessions, patients, feedback });
    };

    generateMockData();
  }, [selectedPeriod]);

  const handleExportCSV = () => {
    toast({
      title: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀"
    });
  };

  const handleExportPDF = () => {
    toast({
      title: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀"
    });
  };

  const getTotalRevenue = () => {
    if (reportData.revenue.length === 0) return 0;
    return reportData.revenue.reduce((sum, item) => sum + item.amount, 0);
  };

  const getTotalSessions = () => {
    if (reportData.sessions.length === 0) return 0;
    return reportData.sessions.reduce((sum, item) => sum + item.completed + item.scheduled, 0);
  };

  const getTotalPatients = () => {
    if (reportData.patients.length === 0) return 0;
    return reportData.patients.reduce((sum, item) => sum + item.new + item.returning, 0);
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Reports & Analytics</h1>
          <p className="text-gray-600">Comprehensive insights and performance metrics</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button variant="outline" onClick={handleExportPDF}>
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {user?.role !== 'hod' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="medical-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Revenue
                </CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-800">
                  ₹{getTotalRevenue().toLocaleString()}
                </div>
                <p className="text-xs text-green-600 mt-1">
                  +12% from last period
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="medical-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Sessions
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-800">
                {getTotalSessions()}
              </div>
              <p className="text-xs text-blue-600 mt-1">
                +8% from last period
              </p>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="medical-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Patients
              </CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-800">
                {getTotalPatients()}
              </div>
              <p className="text-xs text-purple-600 mt-1">
                +15% from last period
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts and Detailed Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {user?.role !== 'hod' && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="medical-card">
              <CardHeader>
                <CardTitle>Revenue Trends</CardTitle>
                <CardDescription>Monthly revenue breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.revenue.map((item) => (
                    <div key={item.month} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{item.month}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2.5">
                          {(() => {
                            const maxRevenue = Math.max(...reportData.revenue.map(r => r.amount));
                            const width = maxRevenue > 0 ? (item.amount / maxRevenue) * 100 : 0;
                            return (
                              <div
                                className="bg-green-500 rounded-full h-2.5"
                                style={{ width: `${width}%` }}
                              ></div>
                            );
                          })()}
                        </div>
                        <span className="text-xs font-medium">₹{item.amount.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="medical-card">
            <CardHeader>
              <CardTitle>Session History</CardTitle>
              <CardDescription>Completed vs. Scheduled sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.sessions.map((item) => (
                  <div key={item.month} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{item.month}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2.5">
                        {(() => {
                          const total = item.completed + item.scheduled;
                          const width = total > 0 ? (item.completed / total) * 100 : 0;
                          return (
                            <div
                              className="bg-blue-500 rounded-full h-2.5"
                              style={{ width: `${width}%` }}
                            ></div>
                          );
                        })()}
                      </div>
                      <span className="text-xs font-medium">{item.completed} / {item.scheduled}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card className="medical-card">
            <CardHeader>
              <CardTitle>Patient Feedback Summary</CardTitle>
              <CardDescription>Overall patient satisfaction</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.feedback.map((item) => (
                  <div key={item.category} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{item.category}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-purple-500 rounded-full h-2.5"
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-medium">{item.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Reports;