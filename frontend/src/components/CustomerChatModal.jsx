import React, { useEffect, useRef, useState } from 'react';
import {
  FiX, FiPaperclip, FiEdit2, FiTrash2,
} from 'react-icons/fi';
import { format } from 'date-fns';
import { io } from 'socket.io-client';
import API from '../api/api';
import { useAuth } from '../context/AuthContext';

const socket = io('http://localhost:5000');

const CustomerChatModal = ({ onClose }) => {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [attachment, setAttachment] = useState(null);
  const inputRef = useRef();
  const bottomRef = useRef();
  const typingTimeoutRef = useRef(null);

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
        setMessages(sortMessages(res.data));
      } catch (err) {
        console.error('Error fetching messages:', err);
      }
    };

    fetchMessages();

    socket.on('receive-message', (msg) => {
      setMessages((prev) => sortMessages([...prev, msg]));
    });

    socket.on('typing', (status) => setTyping(status));

    return () => {
      socket.off('receive-message');
      socket.off('typing');
    };
  }, [token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() && !attachment) return;

    const message = {
      content: input,
      chatType: 'general',
      replyTo,
      role: 'user',
      sender: user._id,
    };

    // ✅ Only attach if valid file
    if (attachment?.name && attachment?.size > 0) {
      message.attachment = {
        name: attachment.name,
        url: URL.createObjectURL(attachment),
      };
    }

    try {
      const res = await API.post('/chat/send', message, {
        headers: { Authorization: `Bearer ${token}` },
      });

      socket.emit('send-message', res.data);

      setInput('');
      setAttachment(null);
      setReplyTo(null);
      setEditingId(null);
      inputRef.current?.focus();
    } catch (err) {
      console.error('❌ Send failed:', err);
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    socket.emit('typing', true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', false);
    }, 1000);
  };

  const handleEdit = (id, content) => {
    setEditingId(id);
    setInput(content);
  };

  const handleDelete = (id) => {
    setMessages((prev) => prev.filter((msg) => msg._id !== id));
  };

  return (
    <div className="fixed bottom-4 right-4 w-full sm:w-[25rem] md:w-[28rem] max-h-[90vh] bg-white shadow-xl rounded-xl flex flex-col z-50 border border-gray-200">
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-3 border-b bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-xl">
        <h2 className="text-lg font-semibold">General Query Chat</h2>
        <button onClick={onClose}>
          <FiX className="hover:text-red-300" size={18} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 bg-gray-50">
        {messages.map((msg, index) => {
          const senderId = typeof msg.sender === 'string' ? msg.sender : msg.sender?._id;
          const role = msg.sender?.role || msg.role || 'user';
          const isUser = String(senderId) === String(user._id) || role === 'user';

          const bubbleClass = isUser
            ? 'bg-indigo-500 text-white ml-auto rounded-br-none'
            : 'bg-gray-200 text-gray-900 mr-auto rounded-bl-none';

          const tailClass = isUser
            ? 'right-[-6px] bg-indigo-500 rounded-bl-sm'
            : 'left-[-6px] bg-gray-200 rounded-br-sm';

          const key = `${msg._id}_${index}`;

          return (
            <div key={key} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`relative px-4 py-2 max-w-[75%] rounded-2xl break-words shadow-md ${bubbleClass}`}>
                <div className={`text-xs font-semibold mb-1 ${role === 'admin' ? 'text-blue-300' : 'text-green-300'}`}>
                  {isUser ? 'You' : 'Admin'}
                </div>

                {msg.replyTo && (
                  <div
                    onClick={() => {
                      const el = document.getElementById(msg.replyTo._id);
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="text-xs italic text-blue-100 mb-1 cursor-pointer"
                  >
                    ↪ {msg.replyTo?.content?.slice(0, 40)}...
                  </div>
                )}

                <p className="text-sm">{msg.content}</p>

                {/* 📎 Only render if real attachment exists */}
                {msg.attachment?.name && msg.attachment?.url && (
                  <a
                    href={msg.attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block mt-1 text-xs underline text-blue-200"
                  >
                    📎 {msg.attachment.name}
                  </a>
                )}

                <div className={`text-[10px] mt-1 flex justify-between items-center ${isUser ? 'text-white/80' : 'text-gray-500'}`}>
                  <span>{format(new Date(msg.timestamp || msg.createdAt), 'p')}</span>
                  {isUser && (
                    <div className="flex gap-2">
                      <FiEdit2
                        onClick={() => handleEdit(msg._id, msg.content)}
                        className="cursor-pointer hover:text-yellow-200"
                        size={14}
                      />
                      <FiTrash2
                        onClick={() => handleDelete(msg._id)}
                        className="cursor-pointer hover:text-red-300"
                        size={14}
                      />
                    </div>
                  )}
                </div>

                <div className={`absolute bottom-0 w-3 h-3 rotate-45 ${tailClass}`}></div>
              </div>
            </div>
          );
        })}

        {typing && (
          <div className="text-xs italic text-gray-500">Admin is typing...</div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Reply Preview */}
      {replyTo && (
        <div className="bg-indigo-50 text-indigo-800 text-sm px-3 py-1 flex items-center justify-between border-t">
          <span>Replying to: {replyTo.content}</span>
          <button
            onClick={() => setReplyTo(null)}
            className="text-red-500 hover:text-red-700"
          >
            <FiX size={14} />
          </button>
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-2 px-3 py-2 border-t bg-white rounded-b-xl">
        <label className="text-gray-600 cursor-pointer">
          <FiPaperclip />
          <input
            type="file"
            hidden
            onChange={(e) => setAttachment(e.target.files[0])}
          />
        </label>
        <input
          ref={inputRef}
          className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none"
          value={input}
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type a message..."
        />
        <button
          onClick={handleSend}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-full text-sm"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default CustomerChatModal;
