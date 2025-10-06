import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/LoginPage";
import { apiClient } from "./lib/api";
import { authService } from "./services/authService";

// Import placeholder pages for new modules
import CurriculumManagementPage from "./pages/CurriculumManagementPage";
import ClassManagementPage from "./pages/ClassManagementPage";
import AssignmentsGamesPage from "./pages/AssignmentsGamesPage";
import ExamManagementPage from "./pages/ExamManagementPage";
import DocumentLibraryPage from "./pages/DocumentLibraryPage";
import CalendarAttendancePage from "./pages/CalendarAttendancePage";
import GamificationGradingPage from "./pages/GamificationGradingPage";
import ActivitiesPage from "./pages/ActivitiesPage";
import UsersRolesPermissionsPage from "./pages/UsersRolesPermissionsPage";
import ERPIntegrationPage from "./pages/ERPIntegrationPage";

// New placeholder pages
import CourseManagementPage from "./pages/CourseManagementPage";
import AnalyticsReportsPage from "./pages/AnalyticsReportsPage";
import SettingsPage from "./pages/SettingsPage";
import AssignmentPracticePage from "./pages/AssignmentPracticePage";


const queryClient = new QueryClient();

// Simple authentication guard
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = authService.isAuthenticated();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <>{children}</>;
};

// Role-based route guard
const RoleBasedRoute = ({
  children,
  allowedRoles
}: {
  children: React.ReactNode;
  allowedRoles: string[]
}) => {
  const isAuthenticated = authService.isAuthenticated();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // For now, we'll assume user info is stored in localStorage or can be decoded from token
  // In a real app, you'd want to get this from a user context or API call
  const accessToken = authService.getAccessToken();
  if (accessToken) {
    try {
      // Decode token to get user role (simplified - in real app use proper JWT library)
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      const userRole = payload.role;

      if (!allowedRoles.includes(userRole)) {
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
              <p className="text-gray-600 mb-4">
                You don't have permission to access this page.
              </p>
              <p className="text-sm text-gray-500">
                Required roles: {allowedRoles.join(', ')}
              </p>
            </div>
          </div>
        );
      }
    } catch (error) {
      console.error('Error decoding token:', error);
      return <LoginPage />;
    }
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={
            <ProtectedRoute>
              <MainLayout>
                <Index />
              </MainLayout>
            </ProtectedRoute>
          } />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="/curriculum-management" element={
            <ProtectedRoute>
              <MainLayout>
                <CurriculumManagementPage />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/class-management" element={
            <ProtectedRoute>
              <MainLayout>
                <ClassManagementPage />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/assignments-games" element={
            <ProtectedRoute>
              <MainLayout>
                <AssignmentsGamesPage />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/assignments/:id/practice" element={
            <ProtectedRoute>
              <MainLayout>
                <AssignmentPracticePage />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/exam-management" element={
            <ProtectedRoute>
              <MainLayout>
                <ExamManagementPage />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/document-library" element={
            <ProtectedRoute>
              <MainLayout>
                <DocumentLibraryPage />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/calendar-attendance" element={
            <ProtectedRoute>
              <MainLayout>
                <CalendarAttendancePage />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/gamification-grading" element={
            <ProtectedRoute>
              <MainLayout>
                <GamificationGradingPage />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/activities" element={
            <ProtectedRoute>
              <MainLayout>
                <ActivitiesPage />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/users-roles-permissions" element={
            <RoleBasedRoute allowedRoles={['admin', 'super_admin']}>
              <MainLayout>
                <UsersRolesPermissionsPage />
              </MainLayout>
            </RoleBasedRoute>
          } />
          <Route path="/erp-integration" element={
            <ProtectedRoute>
              <MainLayout>
                <ERPIntegrationPage />
              </MainLayout>
            </ProtectedRoute>
          } />
          {/* New routes */}
          <Route path="/course-management" element={
            <ProtectedRoute>
              <MainLayout>
                <CourseManagementPage />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/analytics-reports" element={
            <ProtectedRoute>
              <MainLayout>
                <AnalyticsReportsPage />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <MainLayout>
                <SettingsPage />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;