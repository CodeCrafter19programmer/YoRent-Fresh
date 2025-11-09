import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const RoleBasedRedirect: React.FC = () => {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect based on user role
  if (userRole === 'admin') {
    return <Navigate to="/admin/payments" replace />;
  } else if (userRole === 'tenant') {
    return <Navigate to="/tenant/dashboard" replace />;
  } else {
    // If no role is assigned, show unauthorized
    return <Navigate to="/unauthorized" replace />;
  }
};

export default RoleBasedRedirect;
