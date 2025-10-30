
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import Login from '@/pages/Login';
import SuperAdminDashboard from '@/pages/SuperAdminDashboard';
import AdminDashboard from '@/pages/AdminDashboard';
import HODDashboard from '@/pages/HODDashboard';
import PhysioDashboard from '@/pages/PhysioDashboard';
import LeadManagement from '@/pages/LeadManagement';
import PatientManagement from '@/pages/PatientManagement';
import SessionManagement from '@/pages/SessionManagement';
import PhysioManagement from '@/pages/PhysioManagement';
import MachineryMaster from '@/pages/MachineryMaster';
import Reports from '@/pages/Reports';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import ReferenceMaster from '@/pages/ReferenceMaster';
import Payroll from '@/pages/Payroll';
import RedFlagsMaster from '@/pages/RedFlagsMaster';
import PetrolAllowance from '@/pages/PetrolAllowance';
import MonthlySummary from '@/pages/MonthlySummary';

function App() {
  return (
    <>
      <Helmet>
        <title>NEO Physio</title>
        <meta name="description" content="Comprehensive physiotherapy service management system with role-based access control" />
      </Helmet>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout>
                  <DashboardRouter />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/leads" element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                <Layout>
                  <LeadManagement />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/patients" element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin', 'hod']}>
                <Layout>
                  <PatientManagement />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/sessions" element={
              <ProtectedRoute>
                <Layout>
                  <SessionManagement />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/physios" element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                <Layout>
                  <PhysioManagement />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/machinery" element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin', 'hod']}>
                <Layout>
                  <MachineryMaster />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/references" element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                <Layout>
                  <ReferenceMaster />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/reports" element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin', 'hod']}>
                <Layout>
                  <Reports />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/payroll" element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                <Layout>
                  <Payroll />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/petrol-allowance" element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin', 'hod']}>
                <Layout>
                  <PetrolAllowance />
                </Layout>
              </ProtectedRoute>
            } />

             <Route path="/monthly-summary" element={
              <ProtectedRoute allowedRoles={['physio']}>
                <Layout>
                  <MonthlySummary />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/red-flags" element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin', 'hod']}>
                <Layout>
                  <RedFlagsMaster />
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
        </Router>
        <Toaster />
      </AuthProvider>
    </>
  );
}

function DashboardRouter() {
  const userRole = localStorage.getItem('userRole');
  
  switch (userRole) {
    case 'super_admin':
      return <SuperAdminDashboard />;
    case 'admin':
      return <AdminDashboard />;
    case 'hod':
      return <HODDashboard />;
    case 'physio':
      return <PhysioDashboard />;
    default:
      return <Navigate to="/login" replace />;
  }
}

export default App;
