import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const TicketDetail = () => {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);

  useEffect(() => {
    // Replace with real API call
    setTicket({
      _id: id,
      name: "User A",
      email: "user@example.com",
      issue: "App crashes when submitting form.",
      status: "Resolved",
      responses: [
        { from: "Support", message: "We're looking into this." },
        { from: "Support", message: "Issue resolved. Try again now." },
      ],
    });
  }, [id]);

  if (!ticket) return <p>Loading...</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-3xl mx-auto glass-container p-8">
        <h1 className="text-2xl font-bold text-indigo-700 mb-4">Ticket Details</h1>
        <p><strong>Name:</strong> {ticket.name}</p>
        <p><strong>Email:</strong> {ticket.email}</p>
        <p><strong>Status:</strong> {ticket.status}</p>
        <p className="mt-4"><strong>Issue:</strong></p>
        <p className="bg-gray-100 p-3 rounded">{ticket.issue}</p>

        <div className="mt-6">
          <h2 className="text-lg font-semibold text-indigo-600">Support Responses</h2>
          <ul className="mt-2 space-y-2">
            {ticket.responses.map((resp, idx) => (
              <li key={idx} className="p-3 bg-white border rounded shadow-sm">
                <strong>{resp.from}:</strong> {resp.message}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <style jsx>{`
        .glass-container {
          backdrop-filter: blur(16px) saturate(180%);
          background-color: rgba(255, 255, 255, 0.75);
          border-radius: 16px;
          border: 1px solid rgba(209, 213, 219, 0.3);
        }
      `}</style>
    </div>
  );
};

export default TicketDetail;
