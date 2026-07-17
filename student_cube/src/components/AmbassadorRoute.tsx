import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AmbassadorRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, token } = useAuth(); 

  if (!token || !user) {
    return <Navigate to="/getstarted" replace />;
  }

  const isAmbassador = user?.role?.toLowerCase() === 'ambassador';

  if (!isAmbassador) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AmbassadorRoute;