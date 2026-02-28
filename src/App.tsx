import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@insforge/react';
import { Suspense, lazy, useEffect } from 'react';
import LoadingScreen from './components/ui/LoadingScreen';
import { syncService } from './services/syncService';
import { realtimeService } from './services/realtimeService';
import { initErrorReporting } from './services/errorReporter';
import { useUserPersistence } from './hooks/useUserPersistence';

// Lazy load pages for code splitting
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const OnboardingPage = lazy(() => import('./pages/onboarding/OnboardingPage'));
const MainLayout = lazy(() => import('./components/layout/MainLayout'));
const ChatLayout = lazy(() => import('./pages/chat/ChatLayout'));
const ChatPage = lazy(() => import('./pages/chat/ChatPage'));
const CampusFeedPage = lazy(() => import('./pages/campus/CampusFeedPage'));
const StudyDashboard = lazy(() => import('./pages/study/StudyDashboard'));
const PlacementHub = lazy(() => import('./pages/placement/PlacementHub'));
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'));
const CareerOverview = lazy(() => import('./pages/placement/CareerOverview'));
const DeveloperPage = lazy(() => import('./pages/settings/DeveloperPage'));
const BugReportPage = lazy(() => import('./pages/settings/BugReportPage'));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) return <LoadingScreen />;
  if (!isSignedIn) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) return <LoadingScreen />;
  if (isSignedIn) return <Navigate to="/app/chats" replace />;

  return <>{children}</>;
}

export default function App() {
  useUserPersistence();
  // Start global services
  useEffect(() => {
    syncService.start(5000);

    // Initialize global error auto-reporting
    initErrorReporting();

    return () => {
      syncService.stop();
      realtimeService.destroy();
    };
  }, []);

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />

        {/* Onboarding */}
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="chats" replace />} />
          <Route path="chats" element={<ChatLayout />}>
            <Route index element={null} />
            <Route path=":chatId" element={<ChatPage />} />
          </Route>
          <Route path="feed" element={<CampusFeedPage />} />
          <Route path="campus" element={<CampusFeedPage />} />
          <Route path="study" element={<StudyDashboard />} />
          <Route path="placement" element={<PlacementHub />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="career-overview" element={<CareerOverview />} />

          {/* Settings sub-routes */}
          <Route path="settings/developer" element={<DeveloperPage />} />
          <Route path="settings/bug-report" element={<BugReportPage />} />
        </Route>

        {/* Redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}

