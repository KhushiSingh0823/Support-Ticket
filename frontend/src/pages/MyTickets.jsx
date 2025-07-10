import React, { useEffect, useState } from "react";
import TicketList from "../components/TicketList";
import { useAuth } from "../context/AuthContext";

const MyTickets = () => {
  const { token } = useAuth();
  const [tickets, setTickets] = useState([]);

  // Fetch user-specific tickets
  const fetchTickets = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/tickets/my-tickets", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Fetch failed");
      const data = await res.json();
      setTickets(data);
    } catch (err) {
      console.error("Error fetching tickets:", err);
    }
  };

  // Handle deletion of a ticket and update UI
  const handleDeleteTicket = (id) => {
    setTickets((prev) => prev.filter((t) => t._id !== id));
  };

  useEffect(() => {
    if (token) {
      fetchTickets();
    }
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4">
      <div className="max-w-4xl mx-auto rounded-xl overflow-hidden bg-white shadow-[0_20px_50px_-10px_rgba(0,0,0,0.1)]">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8">
          <h2 className="text-3xl font-semibold text-white">My Support Tickets</h2>
        </div>

        <div className="p-8">
          {tickets.length > 0 ? (
            <TicketList tickets={tickets} onDelete={handleDeleteTicket} />
          ) : (
            <div className="text-center py-12">
              <div className="mx-auto w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-10 h-10 text-blue-500"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-800 mb-1">No Tickets Found</h3>
              <p className="text-gray-500">When you create tickets, they'll appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyTickets;
