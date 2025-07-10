import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ProtectedRoute = ({ children, role }) => {
  const { user, token, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user || user.role !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
