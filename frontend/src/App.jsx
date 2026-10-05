import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute, { PublicOnlyRoute } from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import Loading from './components/Loading';

import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';

import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminUserDetails from './pages/admin/UserDetails';
import AdminStores from './pages/admin/Stores';
import AdminStoreDetails from './pages/admin/StoreDetails';

import UserStores from './pages/user/Stores';
import ChangePassword from './pages/user/ChangePassword';

import OwnerDashboard from './pages/owner/Dashboard';
import OwnerRatings from './pages/owner/Ratings';

function HomeRedirect() {
  const { isAuthenticated, checking, homePath } = useAuth();
  if (checking) return <Loading full />;
  return <Navigate to={isAuthenticated ? homePath : '/login'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />

      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* System administrator */}
      <Route element={<ProtectedRoute roles={['ADMIN']} />}>
        <Route element={<Layout />}>
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/users/:id" element={<AdminUserDetails />} />
          <Route path="/admin/stores" element={<AdminStores />} />
          <Route path="/admin/stores/:id" element={<AdminStoreDetails />} />
          <Route path="/admin/change-password" element={<ChangePassword />} />
        </Route>
      </Route>

      {/* Normal user */}
      <Route element={<ProtectedRoute roles={['USER']} />}>
        <Route element={<Layout />}>
          <Route path="/user" element={<Navigate to="/user/stores" replace />} />
          <Route path="/user/stores" element={<UserStores />} />
          <Route path="/user/change-password" element={<ChangePassword />} />
        </Route>
      </Route>

      {/* Store owner */}
      <Route element={<ProtectedRoute roles={['OWNER']} />}>
        <Route element={<Layout />}>
          <Route path="/owner" element={<Navigate to="/owner/dashboard" replace />} />
          <Route path="/owner/dashboard" element={<OwnerDashboard />} />
          <Route path="/owner/ratings" element={<OwnerRatings />} />
          <Route path="/owner/change-password" element={<ChangePassword />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
