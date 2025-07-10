import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import RaiseTicket from './pages/RaiseTicket';
import MyTickets from './pages/MyTickets';
import AuthProvider from './context/AuthContext'; 
import Customer_Login from './auth/Customer_Login';
import Customer_Signup from './auth/Customer_Signup';
import Admin_Login from './auth/Admin_Login';
import Admin_Signup from './auth/Admin_Signup';
import ProtectedRoute from './context/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider> 
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/customerLogin" element={<Customer_Login />} />
          <Route path="/customerSignup" element={<Customer_Signup />} />
          <Route path="/adminLogin" element={<Admin_Login />} />
          <Route path="/adminSignup" element={<Admin_Signup />} />

          {/* Protected Dashboards */}
          <Route 
            path="/user/dashboard" 
            element={
              <ProtectedRoute role="user">
                <UserDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />

          {/* User-Only Routes */}
          <Route 
            path="/raise-ticket" 
            element={
              <ProtectedRoute role="user">
                <RaiseTicket />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/my-tickets" 
            element={
              <ProtectedRoute role="user">
                <MyTickets />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
