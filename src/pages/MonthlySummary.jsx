
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, CheckCircle, BarChart2, Calendar } from 'lucide-react';

const MonthlySummary = () => {
    const [summary, setSummary] = useState({
        monthlyRevenue: 0,
        completedSessions: 0,
        averageSatisfaction: 0,
        mostFrequentPatient: '',
    });

    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const currentPhysioId = 1; // Mock current physio ID

    useEffect(() => {
        Promise.all([
            fetch('/mockdata/sessions.json').then(res => res.json()),
            fetch('/mockdata/physios.json').then(res => res.json()),
            fetch('/mockdata/patients.json').then(res => res.json())
        ]).then(([allSessions, physios, patients]) => {
            const mySessions = allSessions.filter(s =>
                s.physioId === currentPhysioId &&
                new Date(s.sessionDate).getMonth() === selectedMonth &&
                new Date(s.sessionDate).getFullYear() === selectedYear
            );
            const currentPhysio = physios.find(p => p.id === currentPhysioId);
            
            const completedSessions = mySessions.filter(s => s.status === 'completed');
            const monthlyRevenue = completedSessions.length * (currentPhysio?.ratePerSession || 0);

            let totalSatisfaction = 0;
            let satisfactionCount = 0;
            completedSessions.forEach(s => {
                if (s.feedback && s.feedback.satisfaction) {
                    totalSatisfaction += s.feedback.satisfaction;
                    satisfactionCount++;
                }
            });
            const averageSatisfaction = satisfactionCount > 0 ? (totalSatisfaction / satisfactionCount).toFixed(1) : 0;
            
            const patientSessionCounts = mySessions.reduce((acc, session) => {
                acc[session.patientId] = (acc[session.patientId] || 0) + 1;
                return acc;
            }, {});
            
            let mostFrequentPatientId = null;
            let maxSessions = 0;
            for (const patientId in patientSessionCounts) {
                if (patientSessionCounts[patientId] > maxSessions) {
                    maxSessions = patientSessionCounts[patientId];
                    mostFrequentPatientId = patientId;
                }
            }
            
            const mostFrequentPatientName = mostFrequentPatientId
                ? patients.find(p => p.id === parseInt(mostFrequentPatientId))?.name
                : 'N/A';

            setSummary({
                monthlyRevenue,
                completedSessions: completedSessions.length,
                averageSatisfaction,
                mostFrequentPatient: mostFrequentPatientName
            });

        }).catch(err => console.error('Error loading summary data:', err));
    }, [selectedMonth, selectedYear]);
    
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const years = [new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2];

    const statCards = [
        {
            title: "Monthly Revenue",
            value: `₹${summary.monthlyRevenue.toLocaleString()}`,
            icon: DollarSign,
            color: 'text-green-600',
            bgColor: 'bg-green-100'
        },
        {
            title: 'Completed Sessions',
            value: summary.completedSessions,
            icon: CheckCircle,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100'
        },
        {
            title: 'Avg. Patient Satisfaction',
            value: `${summary.averageSatisfaction}%`,
            icon: BarChart2,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100'
        },
    ];

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Monthly Summary</h1>
                    <p className="text-gray-600">Your financial and performance overview.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-gray-500" />
                        <Select value={selectedMonth.toString()} onValueChange={(val) => setSelectedMonth(parseInt(val))}>
                            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                            <SelectContent>{months.map((m, i) => <SelectItem key={i} value={i.toString()}>{m}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center gap-2">
                        <Select value={selectedYear.toString()} onValueChange={(val) => setSelectedYear(parseInt(val))}>
                            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                            <SelectContent>{years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                </div>
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
                                    <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
                                    <div className={`p-2 rounded-full ${stat.bgColor}`}><Icon className={`h-4 w-4 ${stat.color}`} /></div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
                                    <p className="text-xs text-gray-500 mt-1">{months[selectedMonth]} {selectedYear}</p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
                <Card className="medical-card">
                    <CardHeader>
                        <CardTitle>Performance Insights</CardTitle>
                        <CardDescription>Key metrics for {months[selectedMonth]} {selectedYear}</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <h3 className="font-semibold text-gray-700">Most Frequent Patient</h3>
                            <p className="text-2xl font-bold text-blue-600">{summary.mostFrequentPatient}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <h3 className="font-semibold text-gray-700">Revenue per Session</h3>
                            <p className="text-2xl font-bold text-green-600">₹{summary.completedSessions > 0 ? (summary.monthlyRevenue / summary.completedSessions).toFixed(2) : 0}</p>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

        </div>
    );
};

export default MonthlySummary;
