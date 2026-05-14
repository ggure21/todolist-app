import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

function PublicRoute() {
  const accessToken = useAuthStore((s) => s.accessToken);

  if (accessToken) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default PublicRoute;
