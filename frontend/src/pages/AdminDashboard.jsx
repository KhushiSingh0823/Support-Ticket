import React, { useEffect, useState, useRef } from 'react';
import {
  FiClock, FiTool, FiCheckCircle, FiUsers, FiX, FiMessageSquare,
} from 'react-icons/fi';
import { HiOutlineLogout } from 'react-icons/hi';
import AdminTicketList from '../components/AdminTicketList';
import { useAuth } from '../context/AuthContext';
import API from '../api/api';
import toast, { Toaster } from 'react-hot-toast';
import ReplyForm from '../components/ReplyForm';
import AdminGeneralChatModal from '../components/AdminGeneralChatModal'; // to be created

const AdminDashboard = () => {
  const { logout, token, user } = useAuth();
  const [ticketStats, setTicketStats] = useState({ open: 0, inProgress: 0, resolved: 0 });
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showAdminList, setShowAdminList] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [filteredAdmins, setFilteredAdmins] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showGeneralChat, setShowGeneralChat] = useState(false); // new
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await API.get('/tickets/admin/ticket-stats');
      setTicketStats(res.data);
    } catch (err) {
      toast.error('Failed to fetch stats');
    }
  };

  const handleOpenAdminList = async () => {
    if (!showAdminList) {
      try {
        const res = await API.get('/tickets/admin/all-admins');
        setAdmins(res.data);
        setFilteredAdmins(res.data);
      } catch (err) {
        toast.error('Failed to fetch admin list');
      }
    }
    setShowAdminList(!showAdminList);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowAdminList(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const closeModal = () => {
    setSelectedTicket(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f4ff] to-[#e2eaff] p-6 font-sans">
      <Toaster position="top-right" />

      {/* HEADER */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-[32px] font-extrabold bg-gradient-to-r from-indigo-600 to-cyan-500 text-transparent bg-clip-text leading-tight">
            Admin Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage your support tickets efficiently</p>
        </div>
        <div className="flex items-center gap-4">
          {/* ADMIN LIST */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={handleOpenAdminList}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white shadow-lg bg-gradient-to-r from-indigo-500 via-blue-600 to-cyan-500 hover:scale-105"
            >
              <FiUsers className="text-base" />
              Admins
              <svg
                className={`ml-1 ${showAdminList ? 'rotate-180' : ''}`}
                width="12" height="12" viewBox="0 0 20 20" fill="none"
              >
                <path d="M5 8L10 13L15 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            {showAdminList && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl z-50 border">
                <div className="px-4 py-3">
                  <div className="flex items-center font-semibold text-indigo-600 mb-2">
                    <FiUsers className="mr-2" /> Search Admins
                  </div>
                  <input
                    type="text"
                    placeholder="Type to filter..."
                    className="w-full border px-3 py-2 rounded-md text-sm focus:ring-indigo-400"
                    onChange={(e) => {
                      const q = e.target.value.toLowerCase();
                      setFilteredAdmins(admins.filter(a =>
                        a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q)
                      ));
                    }}
                  />
                </div>
                <ul className="max-h-64 overflow-y-auto px-3 pb-2">
                  {filteredAdmins.map((admin) => (
                    <li key={admin._id} className="flex items-center gap-4 p-2 rounded-xl hover:bg-indigo-100 cursor-pointer">
                      <div className="w-10 h-10 bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold rounded-full">
                        {admin.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-800">{admin.name}</span>
                        <p className="text-xs text-gray-500">{admin.email}</p>
                      </div>
                    </li>
                  ))}
                  {filteredAdmins.length === 0 && (
                    <div className="text-center text-sm text-gray-500 py-4">No admins found</div>
                  )}
                </ul>
              </div>
            )}
          </div>

          {/* GENERAL CHAT BUTTON */}
          <button
            onClick={() => setShowGeneralChat(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white shadow-lg bg-gradient-to-r from-blue-600 to-indigo-500 hover:scale-105"
          >
            <FiMessageSquare className="text-base" />
            General Chat
          </button>

          {/* LOGOUT */}
          <button
            onClick={() => {
              logout();
              toast.success('Logged out');
            }}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white text-sm rounded-lg shadow"
          >
            Logout
            <HiOutlineLogout className="ml-2" />
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <StatCard title="Open Tickets" count={ticketStats.open} icon={<FiClock />} color="blue" />
        <StatCard title="In Progress" count={ticketStats.inProgress} icon={<FiTool />} color="yellow" />
        <StatCard title="Resolved" count={ticketStats.resolved} icon={<FiCheckCircle />} color="green" />
      </div>

      {/* TICKET LIST */}
      <div className="shadow-md rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 via-blue-600 to-cyan-500 px-6 py-3 rounded-t-xl flex justify-between items-center">
          <h2 className="text-white text-lg font-semibold">Assigned Tickets</h2>
          <div className="relative">
            <svg
              className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1112 4.5a7.5 7.5 0 014.35 12.15z" />
            </svg>
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/80 text-gray-700 placeholder-gray-500 pl-10 pr-4 py-2 rounded-full text-sm border border-white/40 focus:outline-none focus:ring-2 focus:ring-white/60"
            />
          </div>
        </div>
        <div className="bg-white rounded-b-2xl">
          <AdminTicketList
            onSelectTicket={setSelectedTicket}
            searchQuery={searchQuery}
            onStatusUpdate={fetchStats}
          />
        </div>
      </div>

      {/* GENERAL CHAT MODAL */}
      {showGeneralChat && (
        <AdminGeneralChatModal onClose={() => setShowGeneralChat(false)} />
      )}

      {/* TICKET CHAT MODAL */}
      {selectedTicket && (
        <div className="fixed bottom-4 right-4 z-50 w-[95%] sm:w-[25rem] md:w-[28rem] max-h-[90vh] flex flex-col items-end">
          <div className="w-full h-full bg-slate-50 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-blue-200 animate-slideUp">
            <div className="bg-blue-900 text-white px-4 py-3 flex items-center justify-between border-b border-blue-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white text-blue-900 font-bold flex items-center justify-center ring-2 ring-blue-300">
                  {selectedTicket.user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <h3 className="text-sm font-semibold leading-tight">
                    {selectedTicket.user?.name || 'User'}
                  </h3>
                  <div className="flex items-center gap-1 mt-0.5 text-xs">
                    <span className={`h-2 w-2 rounded-full ${selectedTicket.user?.isActive ? 'bg-green-400' : 'bg-red-400'} animate-pulse`} />
                    <span className={`${selectedTicket.user?.isActive ? 'text-green-300' : 'text-red-300'}`}>
                      {selectedTicket.user?.isActive ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="text-white hover:bg-white/10 p-1.5 rounded-full transition"
              >
                <FiX className="text-base" />
              </button>
            </div>

            <ReplyForm ticket={selectedTicket} />
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, count, icon, color }) => (
  <div className="bg-white rounded-2xl shadow-md p-6 flex items-center gap-4">
    <div className={`text-${color}-500 text-3xl`}>{icon}</div>
    <div>
      <h3 className="text-[15px] font-semibold text-gray-700">{title}</h3>
      <p className="text-xl font-bold text-gray-800">{count}</p>
    </div>
  </div>
);

export default AdminDashboard;
