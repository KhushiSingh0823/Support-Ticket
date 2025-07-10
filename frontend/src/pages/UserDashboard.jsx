import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiClock,
  FiTool,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";
import { HiOutlineLogout } from "react-icons/hi";
import { useAuth } from "../context/AuthContext";
import CustomerChatModal from "../components/CustomerChatModal";

const UserDashboard = () => {
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [showChatModal, setShowChatModal] = useState(false);

  const fetchTickets = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/tickets/my-tickets", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setTickets(data);
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
    }
  };

  useEffect(() => {
    if (token) fetchTickets();
  }, [token]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const total = tickets.length;
  const open = tickets.filter((t) => t.status === "Open").length;
  const progress = tickets.filter((t) => t.status === "In Progress").length;
  const resolved = tickets.filter((t) => t.status === "Resolved").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 font-sans relative">
      {/* Top Right Buttons */}
      <div className="absolute top-4 right-6 flex items-center gap-4 z-50">
        <button
          onClick={() => setShowChatModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg shadow-md hover:scale-105 transition"
        >
          ❓ General Query Chat
        </button>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 via-blue-600 to-cyan-500 rounded-lg shadow-md hover:shadow-xl hover:scale-105 transition duration-300 ease-in-out"
        >
          Logout
          <HiOutlineLogout className="text-base" />
        </button>
      </div>

      {/* Header */}
      <header className="dashboard-header mb-6 mx-auto max-w-6xl">
        <div className="py-5 px-6">
          <h1 className="text-3xl md:text-4xl font-medium text-center">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Customer Support Portal
            </span>
          </h1>
          <div className="flex justify-center mt-3">
            <div className="h-[2px] w-32 bg-gradient-to-r from-transparent via-blue-400 to-transparent"></div>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-4 mb-10">
          <StatsCard
            icon={<FiAlertCircle className="text-blue-500 text-2xl" />}
            label="Total Tickets Raised"
            count={total}
            info={total > 0 ? "Updated" : "No change"}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatusCard
            icon={<FiClock className="text-red-500 text-4xl" />}
            title="OPEN TICKETS"
            count={open}
            color="red"
          />
          <StatusCard
            icon={<FiTool className="text-yellow-500 text-4xl" />}
            title="IN PROGRESS"
            count={progress}
            color="yellow"
          />
          <StatusCard
            icon={<FiCheckCircle className="text-green-500 text-4xl" />}
            title="RESOLVED"
            count={resolved}
            color="green"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-8">
          <button
            onClick={() => navigate("/raise-ticket")}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl shadow-lg transition"
          >
            ➕ Raise New Ticket
          </button>
          <button
            onClick={() => navigate("/my-tickets")}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg transition"
          >
            📋 View My Tickets
          </button>
        </div>
      </div>

      {/* Chat Modal */}
      {showChatModal && (
        <div className="fixed inset-0 z-50 flex justify-center items-center">
          <CustomerChatModal onClose={() => setShowChatModal(false)} />
        </div>
      )}

      {/* Glass Style */}
      <style>{`
        .glass-container {
          backdrop-filter: blur(16px) saturate(180%);
          -webkit-backdrop-filter: blur(16px) saturate(180%);
          background-color: rgba(255, 255, 255, 0.75);
          border: 1px solid rgba(209, 213, 219, 0.3);
          border-radius: 16px;
        }
      `}</style>
    </div>
  );
};

const StatusCard = ({ icon, title, count, color }) => {
  const barColor = {
    red: "bg-red-500",
    yellow: "bg-yellow-500",
    green: "bg-green-500",
  };

  return (
    <div className="glass-container p-8 text-center transition-all duration-300 hover:shadow-xl group">
      <div
        className={`w-24 h-24 bg-${color}-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-${color}-200 transition-colors`}
      >
        {icon}
      </div>
      <h4 className="text-sm font-semibold text-gray-500 mb-2">{title}</h4>
      <p className="text-4xl font-bold text-gray-800 mb-3">{count}</p>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-4">
        <div
          className={`h-full ${barColor[color]} rounded-full`}
          style={{ width: `${count > 0 ? 100 : 0}%` }}
        ></div>
      </div>
      <p className="text-sm text-gray-500">
        {count > 0 ? "In queue" : "No tickets yet"}
      </p>
    </div>
  );
};

const StatsCard = ({ icon, label, count, info }) => (
  <div className="glass-container p-5 flex-1 transition-all duration-300 hover:shadow-xl">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-500 mb-1 text-sm">{label}</p>
        <p className="text-3xl font-bold text-blue-600">{count}</p>
      </div>
      <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
        {icon}
      </div>
    </div>
    <div className="mt-3 pt-3 border-t border-gray-200">
      <p className="text-xs text-gray-500">{info}</p>
    </div>
  </div>
);

export default UserDashboard;
