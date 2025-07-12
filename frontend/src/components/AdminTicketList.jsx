import React, { useEffect, useState } from 'react';
import API from '../api/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { HiOutlineChatAlt2 } from 'react-icons/hi';
import { FiClock, FiTool, FiCheckCircle } from 'react-icons/fi';

const AdminTicketList = ({ onSelectTicket, searchQuery, onStatusUpdate }) => {
  const { token } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState([]);

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      const [ticketRes, adminRes] = await Promise.all([
        API.get('/tickets/admin/all-tickets', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        API.get('/tickets/admin/all-admins', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setTickets(ticketRes.data.map((t) => ({ ...t, _dropdownOpen: false, _statusOpen: false })));
      setAdmins(adminRes.data);
    } catch (error) {
      toast.error('Failed to load tickets/admins');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (ticketId, adminId) => {
  try {
    await API.post(
      `/tickets/${ticketId}/assign`, // ✅ CORRECT
      { adminId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    toast.success('Admin assigned!');
    fetchData();
    } catch (err) {
      toast.error('Failed to assign');
      console.error(err);
    }
  };


  const handleStatusChange = async (ticketId, newStatus) => {
  try {
    await API.put( // ✅ changed from patch → put
      `/tickets/${ticketId}/status`, // ✅ fixed route
      { status: newStatus },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    toast.success('Status updated!');
    fetchData();
    if (onStatusUpdate) onStatusUpdate();
    } catch (error) {
      toast.error('Failed to update status');
      console.error(error);
    }
  };


  const toggleDropdown = (ticketId) => {
    setTickets((prev) =>
      prev.map((t) =>
        t._id === ticketId
          ? { ...t, _dropdownOpen: !t._dropdownOpen }
          : { ...t, _dropdownOpen: false }
      )
    );
  };

  const toggleStatusDropdown = (ticketId) => {
    setTickets((prev) =>
      prev.map((t) =>
        t._id === ticketId
          ? { ...t, _statusOpen: !t._statusOpen }
          : { ...t, _statusOpen: false }
      )
    );
  };

  const getStatusColors = (status) => {
    switch (status) {
      case 'Open':
        return 'bg-red-100 text-red-800';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'Resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getAdminInitials = (name) => {
    if (!name) return 'A';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const filteredTickets = tickets.filter((t) => {
    const q = searchQuery?.toLowerCase() || '';
    return (
      t.issue?.toLowerCase().includes(q) ||
      t.user?.name?.toLowerCase().includes(q) ||
      t.name?.toLowerCase().includes(q) ||
      t.status?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-white shadow-xl rounded-3xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-[15px] text-left font-[500]">
          <thead className="bg-white/80 backdrop-blur shadow-sm text-gray-600 uppercase tracking-wide text-xs hidden md:table-header-group">
            <tr>
              <th className="py-3 px-6">Issue</th>
              <th className="py-3 px-6">User</th>
              <th className="py-3 px-6">Status</th>
              <th className="py-3 px-6">Assign Admin</th>
              <th className="py-3 px-6">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="text-center py-6 text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : filteredTickets.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-6 text-gray-500">
                  No tickets found.
                </td>
              </tr>
            ) : (
              filteredTickets.map((ticket) => (
                <tr key={ticket._id} className="border-t hover:bg-gray-50 transition md:table-row block p-4 md:p-0">
                  <td className="px-6 py-4 text-gray-800 md:table-cell block font-semibold">
                    <span className="md:hidden font-bold">Issue: </span>
                    {ticket.issue}
                  </td>
                  <td className="px-6 py-4 text-gray-800 md:table-cell block">
                    <span className="md:hidden font-bold">User: </span>
                    {ticket.user?.name || ticket.name}
                  </td>
                  <td className="px-6 py-4 md:table-cell block">
                    <span className="md:hidden font-bold">Status: </span>
                    <div className="relative w-44">
                      <button
                        onClick={() => toggleStatusDropdown(ticket._id)}
                        className={`w-full flex items-center justify-between px-4 py-2 rounded-xl shadow-md border border-gray-200 text-sm font-semibold ${getStatusColors(ticket.status)}`}
                      >
                        <span className="flex items-center gap-2">
                          {ticket.status === 'Open' && <FiClock />}
                          {ticket.status === 'In Progress' && <FiTool />}
                          {ticket.status === 'Resolved' && <FiCheckCircle />}
                          {ticket.status}
                        </span>
                        <span className="text-gray-600">▼</span>
                      </button>

                      {ticket._statusOpen && (
                        <ul className="absolute z-10 mt-2 w-full bg-white/90 backdrop-blur rounded-xl shadow-2xl border border-gray-200 text-sm max-h-60 overflow-auto animate-fadeIn">
                          {['Open', 'In Progress', 'Resolved'].map((status) => (
                            <li
                              key={status}
                              onClick={() => {
                                handleStatusChange(ticket._id, status);
                                toggleStatusDropdown(ticket._id);
                              }}
                              className={`flex items-center gap-2 px-4 py-2 cursor-pointer rounded-md ${
                                status === 'Open'
                                  ? 'hover:bg-red-100 text-red-700'
                                  : status === 'In Progress'
                                  ? 'hover:bg-yellow-100 text-yellow-800'
                                  : 'hover:bg-green-100 text-green-700'
                              } ${status === ticket.status ? 'bg-opacity-20 font-semibold' : ''}`}
                            >
                              {status === 'Open' && <FiClock />}
                              {status === 'In Progress' && <FiTool />}
                              {status === 'Resolved' && <FiCheckCircle />}
                              {status}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 md:table-cell block">
                    <span className="md:hidden font-bold">Admin: </span>
                    {ticket.assignedAdmin ? (
                      <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-100 to-indigo-200 text-indigo-700 px-4 py-1 rounded-full shadow-sm">
                        <div
                          title={ticket.assignedAdmin.name}
                          className="w-6 h-6 flex items-center justify-center rounded-full bg-indigo-500 text-white text-xs font-bold"
                        >
                          {getAdminInitials(ticket.assignedAdmin.name)}
                        </div>
                        <span className="hidden sm:inline">{ticket.assignedAdmin.name}</span>
                      </div>
                    ) : (
                      <div className="relative w-52">
                        <button
                          onClick={() => toggleDropdown(ticket._id)}
                          className="w-full px-4 pt-5 pb-2 text-left text-[15px] bg-white/70 backdrop-blur-md border border-gray-200 rounded-full shadow relative"
                        >
                          <span className="absolute left-4 top-2 text-xs text-gray-500">Admin</span>
                          <span className="text-gray-400 italic">Assign Admin</span>
                          <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500">▼</span>
                        </button>

                        {ticket._dropdownOpen && (
                          <ul className="absolute z-10 mt-2 w-full bg-white rounded-xl shadow-2xl border border-gray-100 text-[15px] max-h-60 overflow-auto animate-fadeIn">
                            {admins.map((admin) => (
                              <li
                                key={admin._id}
                                onClick={() => handleAssign(ticket._id, admin._id)}
                                className="px-4 py-2 hover:bg-indigo-100 hover:text-indigo-700 cursor-pointer"
                              >
                                {admin.name}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 md:table-cell block">
                    <span className="md:hidden font-bold">Chat: </span>
                    <button
                      onClick={() => onSelectTicket(ticket)}
                      className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <HiOutlineChatAlt2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Chat</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminTicketList;
