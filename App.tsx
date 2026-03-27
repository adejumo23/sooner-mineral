
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './src/theme';
import MainLayout from './components/layout/MainLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import SectionsPage from './pages/SectionsPage';
import SectionDetailPage from './pages/SectionDetailPage';
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
import UnassignedOwnersPage from './pages/UnassignedOwnersPage';
import MessageCenterPage from './pages/MessageCenterPage';
import MappingPage from './pages/MappingPage';
import CalendarTaskPage from './pages/CalendarTaskPage';
import DocumentGenerationPage from './pages/DocumentGenerationPage';
import ReportingPage from './pages/ReportingPage';
import ESGPage from './pages/ESGPage';
import LPPortalPage from './pages/LPPortalPage';
import DataImportPage from './pages/DataImportPage';
import AcreageSchedulePage from './pages/AcreageSchedulePage';
import PricingPage from './pages/PricingPage';
import UsersPage from './pages/UsersPage';
import RolesPage from './pages/RolesPage';
import PrivilegesPage from './pages/PrivilegesPage';
import TractTestComponent from './components/TractTestComponent';
import DatabaseTestComponent from './components/DatabaseTestComponent';
// New modules
import DealsPage from './pages/DealsPage';
import DealDetailPage from './pages/DealDetailPage';
import DealFormPage from './pages/DealFormPage';
import ProductionPage from './pages/ProductionPage';
import CompliancePage from './pages/CompliancePage';
import FinancialsPage from './pages/FinancialsPage';
import MobilePage from './pages/MobilePage';
import AIInsightsPage from './pages/AIInsightsPage';
import IntegrationsPage from './pages/IntegrationsPage';
import TicketsPage from './pages/TicketsPage';
import TicketDetailPage from './pages/TicketDetailPage';
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
          <Route path="/sections" element={<SectionsPage />} />
          <Route path="/sections/:sectionId" element={<SectionDetailPage />} />
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
          <Route path="/unassigned-owners" element={<UnassignedOwnersPage />} />
          <Route path="/communication" element={<MessageCenterPage />} />
          <Route path="/mapping" element={<MappingPage />} />
          <Route path="/calendar-tasks" element={<CalendarTaskPage />} />
          <Route path="/document-generation" element={<DocumentGenerationPage />} />
          <Route path="/reporting" element={<ReportingPage />} />
          <Route path="/esg" element={<ESGPage />} />
          <Route path="/lp-portal" element={<LPPortalPage />} />
          <Route path="/data-import" element={<DataImportPage />} />
            <Route path="/acreage-schedule" element={<AcreageSchedulePage />} />
            <Route path="/pricing" element={<PricingPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/roles" element={<RolesPage />} />
          <Route path="/privileges" element={<PrivilegesPage />} />
          
          {/* New modules */}
          <Route path="/deals" element={<DealsPage />} />
          <Route path="/deals/new" element={<DealFormPage />} />
          <Route path="/deals/:id" element={<DealDetailPage />} />
          <Route path="/deals/:id/edit" element={<DealFormPage />} />
          
          <Route path="/production" element={<ProductionPage />} />
          
          <Route path="/compliance" element={<CompliancePage />} />
          
          <Route path="/financials" element={<FinancialsPage />} />
          
          <Route path="/mobile" element={<MobilePage />} />
          
          <Route path="/ai-insights" element={<AIInsightsPage />} />
          
          <Route path="/integrations" element={<IntegrationsPage />} />
          
          <Route path="/tickets" element={<TicketsPage />} />
          <Route path="/tickets/:id" element={<TicketDetailPage />} />
          
          <Route path="/test-normalized" element={<TractTestComponent />} />
          <Route path="/test-database" element={<DatabaseTestComponent />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MainLayout>
    </ThemeProvider>
  );
}

export default App;