
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './src/theme';
import MainLayout from './components/layout/MainLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TractsPage from './pages/TractsPage';
import TractDetailPage from './pages/TractDetailPage';
import UnitsPage from './pages/UnitsPage';
import UnitDetailPage from './pages/UnitDetailPage';
import UnitFormPage from './pages/UnitFormPage';
import AssignmentsPage from './pages/AssignmentsPage';
import AssignmentDetailPage from './pages/AssignmentDetailPage';
import AssignmentFormPage from './pages/AssignmentFormPage';
import LeadsPage from './pages/LeadsPage';
import LeadDetailPage from './pages/LeadDetailPage';
import LeadFormPage from './pages/LeadFormPage';
import ContactsPage from './pages/ContactsPage';
import ContactDetailPage from './pages/ContactDetailPage';
import MessageCenterPage from './pages/MessageCenterPage';
import MappingPage from './pages/MappingPage';
import UsersPage from './pages/UsersPage';
import RolesPage from './pages/RolesPage';
import PrivilegesPage from './pages/PrivilegesPage';
import { useAuth } from './hooks/useAuth';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <ThemeProvider>
      <MainLayout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/tracts" element={<TractsPage />} />
          <Route path="/tracts/:tractId" element={<TractDetailPage />} />
          <Route path="/units" element={<UnitsPage />} />
          <Route path="/units/new" element={<UnitFormPage />} />
          <Route path="/units/:id" element={<UnitDetailPage />} />
          <Route path="/units/:id/edit" element={<UnitFormPage />} />
          <Route path="/assignments" element={<AssignmentsPage />} />
          <Route path="/assignments/new" element={<AssignmentFormPage />} />
          <Route path="/assignments/:id" element={<AssignmentDetailPage />} />
          <Route path="/assignments/:id/edit" element={<AssignmentFormPage />} />
          <Route path="/leads" element={<LeadsPage />} />
          <Route path="/leads/new" element={<LeadFormPage />} />
          <Route path="/leads/:id" element={<LeadDetailPage />} />
          <Route path="/leads/:id/edit" element={<LeadFormPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/contacts/new" element={<LeadFormPage />} />
          <Route path="/contacts/:id" element={<ContactDetailPage />} />
          <Route path="/contacts/:id/edit" element={<LeadFormPage />} />
          <Route path="/communication" element={<MessageCenterPage />} />
          <Route path="/mapping" element={<MappingPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/roles" element={<RolesPage />} />
          <Route path="/privileges" element={<PrivilegesPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MainLayout>
    </ThemeProvider>
  );
}

export default App;