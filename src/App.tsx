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
  const isAuthenticated = apiClient.isAuthenticated();

  if (!isAuthenticated) {
    return <LoginPage />;
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
            <ProtectedRoute>
              <MainLayout>
                <UsersRolesPermissionsPage />
              </MainLayout>
            </ProtectedRoute>
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