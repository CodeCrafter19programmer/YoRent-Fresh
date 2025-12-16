import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Lazy load pages for better performance
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Properties = lazy(() => import("./pages/Properties"));
const Tenants = lazy(() => import("./pages/Tenants"));
const RentManagement = lazy(() => import("./pages/RentManagement"));
const Expenses = lazy(() => import("./pages/Expenses"));
const Policies = lazy(() => import("./pages/Policies"));
const Settings = lazy(() => import("./pages/Settings"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const TenantDashboard = lazy(() => import("./pages/TenantDashboard"));
const AdminPayments = lazy(() => import("./pages/AdminPayments"));
const AdminNotifications = lazy(() => import("./pages/AdminNotifications"));
const TaxAccountability = lazy(() => import("./pages/TaxAccountability"));
const Unauthorized = lazy(() => import("./pages/Unauthorized"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
  </div>
);

const queryClient = new QueryClient();

// FRONTEND ONLY - No authentication, no database connections
// Backend will be reconfigured separately
const RootRedirect = () => {
  const { profile, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  return profile.role === "admin"
    ? <Navigate to="/admin/dashboard" replace />
    : <Navigate to="/tenant/dashboard" replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* Root redirect based on role */}
              <Route path="/" element={<RootRedirect />} />

              {/* Admin routes */}
              <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
                <Route path="/admin/dashboard" element={<Layout><Dashboard /></Layout>} />
                <Route path="/properties" element={<Layout><Properties /></Layout>} />
                <Route path="/tenants" element={<Layout><Tenants /></Layout>} />
                <Route path="/rent" element={<Layout><RentManagement /></Layout>} />
                <Route path="/expenses" element={<Layout><Expenses /></Layout>} />
                <Route path="/admin/payments" element={<Layout><AdminPayments /></Layout>} />
                <Route path="/admin/notifications" element={<Layout><AdminNotifications /></Layout>} />
                <Route path="/admin/tax" element={<Layout><TaxAccountability /></Layout>} />
                <Route path="/settings" element={<Layout><Settings /></Layout>} />
                <Route path="/policies" element={<Layout><Policies /></Layout>} />
              </Route>

              {/* Tenant routes */}
              <Route element={<ProtectedRoute allowedRoles={["tenant"]} />}>
                <Route path="/tenant/dashboard" element={<TenantDashboard />} />
              </Route>

              {/* Catch all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
