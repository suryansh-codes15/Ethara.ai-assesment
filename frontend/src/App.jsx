import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Loader from './components/Loader';
import ToastProvider from './components/Toast';

// ── Lazy-load every page so only the current route is downloaded ──
const Landing      = lazy(() => import('./pages/Landing'));
const Login        = lazy(() => import('./pages/Login'));
const Signup       = lazy(() => import('./pages/Signup'));
const Dashboard    = lazy(() => import('./pages/Dashboard'));
const Projects     = lazy(() => import('./pages/Projects'));
const ProjectView  = lazy(() => import('./pages/ProjectView'));
const Sprints      = lazy(() => import('./pages/Sprints'));
const Profile      = lazy(() => import('./pages/Profile'));
const Analytics    = lazy(() => import('./pages/Analytics'));
const Settings     = lazy(() => import('./pages/Settings'));
const NotFound     = lazy(() => import('./pages/NotFound'));
const Layout       = lazy(() => import('./components/Layout'));
const CommandPalette = lazy(() => import('./components/CommandPalette'));

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loader fullScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loader fullScreen />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

function AppRoutes() {
  return (
    <Suspense fallback={<Loader fullScreen />}>
      <CommandPalette />
      <Routes>
        <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="dashboard"       element={<Dashboard />} />
          <Route path="projects"        element={<Projects />} />
          <Route path="projects/:id"    element={<ProjectView />} />
          <Route path="sprints"         element={<Sprints />} />
          <Route path="analytics"       element={<Analytics />} />
          <Route path="settings"        element={<Settings />} />
          <Route path="profile"         element={<Profile />} />
        </Route>

        <Route path="/404" element={<NotFound />} />
        <Route path="*"   element={<Navigate to="/404" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
