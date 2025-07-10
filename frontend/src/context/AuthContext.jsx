import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const navigate = useNavigate();

  // Load from localStorage on app start
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const _id = localStorage.getItem('_id');
    const name = localStorage.getItem('name');
    const email = localStorage.getItem('email');
    const role = localStorage.getItem('role');

    if (savedToken && _id && name && email && role) {
      setUser({ _id, name, email, role });
      setToken(savedToken);
    }
  }, []);

  // ✅ FIXED login with fallback for missing _id
  const login = ({ token, user }) => {
    const userId = user._id || user.id || user.userId; // fallback

    // Debug logs
    console.log('🔐 Logging in user:', user);
    console.log('✅ Resolved user ID:', userId);

    localStorage.setItem('token', token);
    localStorage.setItem('_id', userId);
    localStorage.setItem('name', user.name);
    localStorage.setItem('email', user.email);
    localStorage.setItem('role', user.role);

    setUser({
      _id: userId,
      name: user.name,
      email: user.email,
      role: user.role,
    });
    setToken(token);

    if (user.role === 'admin') {
      navigate('/admin/dashboard');
    } else {
      navigate('/user/dashboard');
    }
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    setToken('');
    navigate('/');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
