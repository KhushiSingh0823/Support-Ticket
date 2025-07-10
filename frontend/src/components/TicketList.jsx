import React, { useState } from "react";
import {
  Trash2,
  X,
  User2,
  Mail,
  BadgeCheck,
  Clock,
  FileText,
  LayoutGrid,
  MessageCircle,
} from "lucide-react";
import API from "../api/api";
import CustomerTicketChatModal from "./CustomerTicketChatModal";

const TicketList = ({ tickets, onDelete }) => {
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [chatTicket, setChatTicket] = useState(null);
  const [filter, setFilter] = useState("All");

  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const renderStatusBadge = (status) => {
    const base =
      "inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full";
    switch (status) {
      case "Resolved":
        return (
          <span className={`${base} bg-emerald-100 text-emerald-700 shadow`}>
            <BadgeCheck size={14} /> Resolved
          </span>
        );
      case "In Progress":
        return (
          <span className={`${base} bg-amber-100 text-amber-700 shadow`}>
            <Clock size={14} /> In Progress
          </span>
        );
      default:
        return (
          <span className={`${base} bg-rose-100 text-rose-600 shadow`}>
            <FileText size={14} /> Open
          </span>
        );
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this ticket?")) {
      try {
        await API.delete(`/tickets/${id}`);
        if (onDelete) onDelete(id);
      } catch (err) {
        alert("Failed to delete ticket.");
        console.error(err);
      }
    }
  };

  const filteredTickets =
    filter === "All" ? tickets : tickets.filter((t) => t.status === filter);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Filter Tabs */}
      <div className="mb-8 flex flex-wrap gap-3 justify-left">
        {[
          { label: "All", icon: LayoutGrid, color: "text-white-500" },
          { label: "Open", icon: FileText, color: "text-red-500" },
          { label: "In Progress", icon: Clock, color: "text-yellow-500" },
          { label: "Resolved", icon: BadgeCheck, color: "text-green-500" },
        ].map(({ label, icon: Icon, color }) => (
          <button
            key={label}
            onClick={() => setFilter(label)}
            className={`inline-flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-200 border shadow-sm
              ${
                filter === label
                  ? label === "All"
                    ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md"
                    : label === "Resolved"
                    ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                    : label === "In Progress"
                    ? "bg-amber-100 text-amber-700 border-amber-300"
                    : "bg-rose-100 text-rose-600 border-rose-300"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }
            `}
          >
            <Icon size={16} className={`${color}`} />
            {label}
          </button>
        ))}
      </div>

      {/* Ticket Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTickets.length > 0 ? (
          filteredTickets.map((ticket) => (
            <div
              key={ticket._id}
              className="bg-white border border-gray-200 rounded-xl shadow-md p-5 hover:shadow-xl transition-all duration-300 group"
            >
              <div className="flex justify-between items-start mb-1">
                <h2 className="text-lg font-semibold text-gray-800 group-hover:text-indigo-700 transition flex items-center gap-2">
                  <FileText size={18} className="text-indigo-500" />
                  {ticket.issue}
                </h2>
                {renderStatusBadge(ticket.status)}
              </div>
              <p className="text-sm text-gray-600">
                {ticket.name} • {ticket.email}
              </p>
              <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                <Clock size={14} /> {formatDate(ticket.createdAt)}
              </p>

              <div className="flex justify-between items-center mt-4">
                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedTicket(ticket)}
                    className="text-indigo-600 text-sm font-medium hover:underline hover:text-indigo-800"
                  >
                    View
                  </button>
                  <button
                    onClick={() => setChatTicket(ticket)}
                    className="text-blue-600 hover:text-blue-800"
                    title="Chat with Admin"
                  >
                    <MessageCircle size={18} />
                  </button>
                </div>
                <button
                  onClick={() => handleDelete(ticket._id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="col-span-full text-center text-gray-500 text-base">
            No tickets found.
          </p>
        )}
      </div>

      {/* Ticket Info Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg mx-auto bg-white rounded-xl p-6 shadow-2xl border border-gray-300 animate-fadeInUp">
            <button
              onClick={() => setSelectedTicket(null)}
              className="absolute top-4 right-4 text-gray-600 hover:text-red-600 transition"
            >
              <X size={22} />
            </button>
            <h2 className="text-2xl font-bold text-indigo-700 mb-4 flex items-center gap-2">
              <FileText size={24} /> Ticket Details
            </h2>
            <div className="space-y-3 text-sm text-gray-700">
              <p className="flex items-center gap-2">
                <User2 size={16} className="text-indigo-500" />
                <strong>Name:</strong> {selectedTicket.name}
              </p>
              <p className="flex items-center gap-2">
                <Mail size={16} className="text-indigo-500" />
                <strong>Email:</strong> {selectedTicket.email}
              </p>
              <div className="flex items-center gap-2">
                <strong>Status:</strong>
                {renderStatusBadge(selectedTicket.status)}
              </div>
              <p className="flex items-center gap-2">
                <Clock size={16} className="text-indigo-500" />
                <strong>Date:</strong> {formatDate(selectedTicket.createdAt)}
              </p>
              <div>
                <p><strong>Issue:</strong></p>
                <p className="bg-gray-50 p-3 rounded border border-gray-200 text-gray-800">
                  {selectedTicket.issue}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Chat Modal */}
      {chatTicket && (
        <div className="fixed bottom-4 right-4 z-50 w-[95%] sm:w-[25rem] md:w-[28rem] max-h-[90vh] flex flex-col items-end">
          <CustomerTicketChatModal
            ticket={chatTicket}
            onClose={() => setChatTicket(null)}
          />
        </div>
      )}

      {/* Animation */}
      <style>{`
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.35s ease-out;
        }
      `}</style>
    </div>
  );
};

export default TicketList;
