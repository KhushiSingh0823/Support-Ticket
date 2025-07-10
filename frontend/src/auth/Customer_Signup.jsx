import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaUser, FaLock, FaEnvelope } from 'react-icons/fa';
import { IoEye, IoEyeOff } from 'react-icons/io5';
import API from '../api/api';
import { useAuth } from '../context/AuthContext';

const Customer_Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSignup = async (e) => {
    e.preventDefault();

    if (password.length < 8) {
      alert('Password must be at least 8 characters long');
      return;
    }

    try {
      // ✅ Use correct user endpoint
      const res = await API.post('/auth/user/signup', { name, email, password });

      login({ token: res.data.token, user: res.data.user });
      setPassword('');
      document.getElementById('password')?.blur();
      navigate('/user/dashboard');
    } catch (err) {
      alert('Signup failed. Please check your details or try again later.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fef9f5] via-[#f3f4ff] to-[#edfaff] flex items-center justify-center px-4">
      <div className="relative max-w-3xl w-full bg-white shadow-[0_10px_40px_rgba(0,0,0,0.06)] rounded-[2.5rem] overflow-hidden">

        {/* Top Wave */}
        <svg className="absolute top-0 left-0 w-full h-24" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="#f0f4ff" d="M0,64L60,85.3C120,107,240,149,360,154.7C480,160,600,128,720,106.7C840,85,960,75,1080,85.3C1200,96,1320,128,1380,144L1440,160L1440,0L0,0Z"></path>
        </svg>

        <div className="relative z-10 p-14 sm:p-20">
          <h2 className="text-5xl font-extrabold text-[#2d2f48] text-center mb-4 tracking-tight">Create Account</h2>
          <p className="text-center text-gray-500 text-lg mb-12">Join the support system and start your journey</p>

          <form onSubmit={handleSignup} className="space-y-10">
            <div className="relative group">
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="peer w-full px-5 pt-6 pb-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-500"
                placeholder="Your Name"
              />
              <label htmlFor="name" className="absolute left-5 top-3 text-gray-500 text-sm transition-all peer-placeholder-shown:top-5 peer-placeholder-shown:text-base peer-focus:top-3 peer-focus:text-sm">
                Full Name
              </label>
              <FaUser className="absolute right-4 top-5 text-gray-400 group-focus-within:text-purple-500 transition duration-300 group-hover:scale-110" />
            </div>

            <div className="relative group">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="peer w-full px-5 pt-6 pb-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-500"
                placeholder="Your Email"
              />
              <label htmlFor="email" className="absolute left-5 top-3 text-gray-500 text-sm transition-all peer-placeholder-shown:top-5 peer-placeholder-shown:text-base peer-focus:top-3 peer-focus:text-sm">
                Email Address
              </label>
              <FaEnvelope className="absolute right-4 top-5 text-gray-400 group-focus-within:text-sky-500 transition duration-300 group-hover:scale-110" />
            </div>

            <div className="relative group">
              <input
                type="text"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="off"
                inputMode="text"
                style={{
                  WebkitTextSecurity: showPassword ? 'none' : 'disc',
                  appearance: 'none',
                }}
                className="peer w-full px-5 pt-6 pb-2 pr-20 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-500"
                placeholder="Your Password"
              />
              <label htmlFor="password" className="absolute left-5 top-3 text-gray-500 text-sm transition-all peer-placeholder-shown:top-5 peer-placeholder-shown:text-base peer-focus:top-3 peer-focus:text-sm">
                Password
              </label>

              <FaLock className="absolute right-4 top-5 text-gray-400 group-focus-within:text-pink-500 transition duration-300 group-hover:scale-110" />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-10 top-5 text-xl text-gray-400 hover:text-pink-500 transition duration-300 focus:outline-none"
              >
                {showPassword ? <IoEyeOff /> : <IoEye />}
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-tr from-purple-500 to-indigo-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold text-lg rounded-xl shadow-lg transition-transform transform hover:scale-[1.02]"
            >
              Sign Up
            </button>

            <p className="text-center text-gray-500 text-sm">
              Already have an account?{' '}
              <Link to="/customerLogin" className="text-indigo-600 hover:underline font-medium">Login</Link>
            </p>
          </form>
        </div>

        {/* Bottom Wave */}
        <svg className="absolute bottom-0 left-0 w-full h-24 rotate-180" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="#f0f4ff" d="M0,64L60,85.3C120,107,240,149,360,154.7C480,160,600,128,720,106.7C840,85,960,75,1080,85.3C1200,96,1320,128,1380,144L1440,160L1440,320L0,320Z"></path>
        </svg>
      </div>
    </div>
  );
};

export default Customer_Signup;
