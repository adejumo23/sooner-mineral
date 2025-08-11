
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

import MainLayout from './components/layout/MainLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import RolesPage from './pages/RolesPage';
import PrivilegesPage from './pages/PrivilegesPage';
import TractsPage from './pages/TractsPage';
import TractDetailPage from './pages/TractDetailPage';
import UnitsPage from './pages/UnitsPage';
import UnitDetailPage from './pages/UnitDetailPage';
import UnitFormPage from './pages/UnitFormPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/roles" element={<RolesPage />} />
                <Route path="/privileges" element={<PrivilegesPage />} />
                <Route path="/tracts" element={<TractsPage />} />
                <Route path="/tracts/:tractId" element={<TractDetailPage />} />
                <Route path="/units" element={<UnitsPage />} />
                <Route path="/units/new" element={<UnitFormPage />} />
                <Route path="/units/:id" element={<UnitDetailPage />} />
                <Route path="/units/:id/edit" element={<UnitFormPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </MainLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;