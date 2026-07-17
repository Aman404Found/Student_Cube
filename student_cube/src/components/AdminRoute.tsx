import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, token } = useAuth(); 

  if (!token || !user) {
    return <Navigate to="/getstarted" replace />;
  }

  const isAdmin = user?.role?.toLowerCase() === 'admin';

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;