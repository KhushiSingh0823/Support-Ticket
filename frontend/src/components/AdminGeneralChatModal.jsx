import React, { useEffect, useRef, useState } from 'react';
import { FiX, FiSend } from 'react-icons/fi';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import API from '../api/api';
import { format } from 'date-fns';

const socket = io('http://localhost:5000');

const AdminGeneralChatModal = ({ onClose }) => {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [typing, setTyping] = useState(false);
  const [isUserTyping, setIsUserTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const bottomRef = useRef(null);

  const sortMessages = (msgs) =>
    [...msgs].sort(
      (a, b) =>
        new Date(a.timestamp || a.createdAt) - new Date(b.timestamp || b.createdAt)
    );

  useEffect(() => {
    socket.emit('join-room', 'general');

    const fetchMessages = async () => {
      try {
        const res = await API.get('/chat/general', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const sorted = sortMessages(res.data);
        setMessages(sorted);

        // 🔁 Mark unread messages as read
        const unread = sorted.filter(
          (msg) =>
            msg.sender._id !== user._id &&
            !msg.readBy?.some((r) => r.user === user._id)
        );

        if (unread.length) {
          await API.post(
            '/chat/mark-read',
            { chatType: 'general' },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          unread.forEach((msg) => {
            socket.emit('message-read', {
              chatType: 'general',
              messageId: msg._id,
              reader: { user: user._id, at: new Date() },
            });
          });
        }
      } catch (err) {
        console.error('Error fetching messages', err);
      }
    };

    fetchMessages();

    socket.on('receive-message', (msg) => {
      setMessages((prev) => sortMessages([...prev, msg]));
    });

    socket.on('message-read', ({ messageId, reader }) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg._id === messageId &&
          !msg.readBy?.some((r) => String(r.user) === String(reader.user))
            ? { ...msg, readBy: [...(msg.readBy || []), reader] }
            : msg
        )
      );
    });

    socket.on('typing', (senderId) => {
      if (senderId !== user._id) setIsUserTyping(true);
    });

    socket.on('stop-typing', () => setIsUserTyping(false));

    return () => {
      socket.off('receive-message');
      socket.off('message-read');
      socket.off('typing');
      socket.off('stop-typing');
    };
  }, [token, user._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (!typing) {
      setTyping(true);
      socket.emit('typing', { room: 'general', senderId: user._id });
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop-typing', { room: 'general' });
      setTyping(false);
    }, 1500);
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const msgData = {
      content: newMessage,
      chatType: 'general',
    };

    try {
      const res = await API.post('/chat/send', msgData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const savedMessage = res.data;
      socket.emit('send-message', savedMessage);
      setNewMessage('');
      socket.emit('stop-typing', { room: 'general' });
      setTyping(false);
    } catch (error) {
      console.error('❌ Error sending message:', error);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[95%] sm:w-[25rem] md:w-[28rem] max-h-[90vh] flex flex-col items-end">
      <div className="w-full bg-white rounded-2xl shadow-xl border border-blue-200 flex flex-col overflow-hidden animate-slideUp">
        {/* Header */}
        <div className="bg-blue-900 text-white px-4 py-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">General Query Chat</h3>
          <button
            onClick={onClose}
            className="hover:bg-white/10 p-1.5 rounded-full transition"
            aria-label="Close chat"
          >
            <FiX />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 bg-slate-50 space-y-3">
          {messages.map((msg) => {
            const senderId = msg.sender?._id || msg.sender;
            const senderRole = msg.sender?.role?.toLowerCase?.() || msg.role?.toLowerCase?.() || 'user';
            const isAdminMessage = senderRole === 'admin';

            const alignmentClass = isAdminMessage ? 'justify-end' : 'justify-start';
            const bubbleClass = isAdminMessage
              ? 'bg-blue-600 text-white rounded-br-none ml-auto'
              : 'bg-gray-200 text-gray-800 rounded-bl-none mr-auto';
            const tailClass = isAdminMessage
              ? 'right-[-6px] bg-blue-600 rotate-45 rounded-bl-sm'
              : 'left-[-6px] bg-gray-200 rotate-45 rounded-br-sm';
            const timeClass = isAdminMessage ? 'text-white/70' : 'text-gray-500';
            const roleColor = isAdminMessage ? 'text-blue-500' : 'text-green-600';

            return (
              <div key={msg._id} className={`flex ${alignmentClass}`}>
                <div className={`relative px-4 py-2 max-w-[75%] rounded-2xl break-words shadow-md ${bubbleClass}`}>
                  <div className={`text-xs font-semibold mb-1 ${roleColor}`}>
                    {isAdminMessage ? 'Admin' : 'User'}
                  </div>
                  <div>{msg.content}</div>
                  <div className="text-[10px] mt-1 flex justify-end items-center gap-1">
                    <span className={timeClass}>
                      {format(new Date(msg.timestamp || msg.createdAt), 'p')}
                    </span>
                    {isAdminMessage && (
                      <span className="text-[12px]">
                        {
                          (msg.readBy?.filter((r) => String(r.user) !== String(user._id)).length || 0) > 0
                            ? '✅✅'
                            : '✅'
                        }
                      </span>
                    )}
                  </div>
                  <div className={`absolute bottom-0 w-3 h-3 ${tailClass}`} />
                </div>
              </div>
            );
          })}
          {isUserTyping && (
            <div className="text-xs italic text-gray-500 mt-2 pl-1">User is typing...</div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 px-4 py-3 border-t border-blue-200 bg-white">
          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={newMessage}
            onChange={handleTyping}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button
            onClick={sendMessage}
            className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700"
            aria-label="Send message"
          >
            <FiSend />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminGeneralChatModal;
