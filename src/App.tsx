import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import RoleBasedRedirect from "@/components/RoleBasedRedirect";
import NotificationService from "@/services/notificationService";
import Dashboard from "./pages/Dashboard";
import Properties from "./pages/Properties";
import Tenants from "./pages/Tenants";
import RentManagement from "./pages/RentManagement";
import Expenses from "./pages/Expenses";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import TenantDashboard from "./pages/TenantDashboard";
import AdminPayments from "./pages/AdminPayments";
import AdminNotifications from "./pages/AdminNotifications";
import TaxAccountability from "./pages/TaxAccountability";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Initialize notification service
NotificationService.initializeNotificationChecking();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Role-based redirect for root path */}
            <Route path="/" element={<RoleBasedRedirect />} />
            
            {/* Protected admin routes */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute requiredRole="admin">
                <Layout><Dashboard /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/properties" element={
              <ProtectedRoute requiredRole="admin">
                <Layout><Properties /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/tenants" element={
              <ProtectedRoute requiredRole="admin">
                <Layout><Tenants /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/rent" element={
              <ProtectedRoute requiredRole="admin">
                <Layout><RentManagement /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/expenses" element={
              <ProtectedRoute requiredRole="admin">
                <Layout><Expenses /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/payments" element={
              <ProtectedRoute requiredRole="admin">
                <Layout><AdminPayments /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/notifications" element={
              <ProtectedRoute requiredRole="admin">
                <Layout><AdminNotifications /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/tax" element={
              <ProtectedRoute requiredRole="admin">
                <Layout><TaxAccountability /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute requiredRole="admin">
                <Layout><Settings /></Layout>
              </ProtectedRoute>
            } />
            
            {/* Protected tenant routes */}
            <Route path="/tenant/dashboard" element={
              <ProtectedRoute requiredRole="tenant">
                <TenantDashboard />
              </ProtectedRoute>
            } />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
