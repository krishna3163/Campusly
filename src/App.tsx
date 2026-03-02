import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@insforge/react';
import { Suspense, lazy, useEffect } from 'react';
import LoadingScreen from './components/ui/LoadingScreen';
import { syncService } from './services/syncService';
import { realtimeService } from './services/realtimeService';
import { ErrorLogger } from './services/ErrorLogger';
import { useUserPersistence } from './hooks/useUserPersistence';
import NotificationPrompt from './components/NotificationPrompt';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import CallManager from './components/CallManager';
import ToastQueue from './components/ToastQueue';


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
const StatusPage = lazy(() => import('./pages/status/StatusPage'));
const ProfileViewPage = lazy(() => import('./pages/profile/ProfileViewPage'));
const LeaderboardPage = lazy(() => import('./pages/leaderboard/LeaderboardPage'));
const GroupSettingsPage = lazy(() => import('./pages/chat/GroupSettingsPage'));
const ChatDiscoveryPage = lazy(() => import('./pages/chat/ChatDiscoveryPage'));
const ErrorDashboard = lazy(() => import('./pages/admin/ErrorDashboard'));

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

import { useGlobalNotifications } from './hooks/useGlobalNotifications';


export default function App() {
  useUserPersistence();
  useGlobalNotifications();
  // Start global services
  useEffect(() => {
    syncService.start(5000);

    // Initialize global error telemetry & monitoring
    ErrorLogger.init();

    return () => {
      syncService.stop();
      realtimeService.destroy();
    };
  }, []);

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingScreen />}>
        <ToastQueue />
        <NotificationPrompt />
        <CallManager />
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
              <Route path="discover" element={<ChatDiscoveryPage />} />
              <Route path=":chatId" element={<ChatPage />} />
              <Route path=":chatId/settings" element={<GroupSettingsPage />} />
            </Route>
            <Route path="feed" element={<CampusFeedPage />} />
            <Route path="campus" element={<CampusFeedPage />} />
            <Route path="study" element={<StudyDashboard />} />
            <Route path="placement" element={<PlacementHub />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="profile/:userId" element={<ProfileViewPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="career-overview" element={<CareerOverview />} />
            <Route path="status" element={<StatusPage />} />
            <Route path="status/:viewUserId" element={<StatusPage />} />
            <Route path="leaderboard" element={<LeaderboardPage />} />

            {/* Admin sub-routes */}
            <Route path="admin/errors" element={<ErrorDashboard />} />

            {/* Settings sub-routes */}
            <Route path="settings/developer" element={<DeveloperPage />} />
            <Route path="settings/bug-report" element={<BugReportPage />} />
          </Route>

          {/* Redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
