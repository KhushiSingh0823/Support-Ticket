import React, { useEffect, useRef, useState } from 'react';
import { FiX, FiPaperclip } from 'react-icons/fi';
import { MdDoneAll } from 'react-icons/md';
import { format, parseISO, isValid } from 'date-fns';
import { io } from 'socket.io-client';
import API from '../api/api';
import { useAuth } from '../context/AuthContext';

const socket = io('http://localhost:5000');

const AdminGeneralChatModal = ({ onClose }) => {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [attachment, setAttachment] = useState(null);
  const [typing, setTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef();
  const bottomRef = useRef();
  const messageRefs = useRef({});

  const sortMessages = (msgs) =>
    [...msgs].sort((a, b) =>
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

        const unread = sorted.filter(
          (msg) =>
            msg.sender._id !== user._id &&
            !msg.readBy?.some((r) => String(r.user) === String(user._id))
        );

        if (unread.length) {
          await API.post(
            '/chat/mark-read',
            { chatType: 'general' },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          unread.forEach((msg) =>
            socket.emit('message-read', {
              chatType: 'general',
              messageId: msg._id,
              reader: { user: user._id, at: new Date() },
            })
          );
        }
      } catch (err) {
        console.error('❌ Fetch error:', err);
      }
    };

    fetchMessages();

    socket.on('receive-message', (msg) => {
      setMessages((prev) => {
        const exists = prev.some((m) => m._id === msg._id);
        return exists ? prev : sortMessages([...prev, msg]);
      });

      const alreadyRead = msg.readBy?.some((rb) =>
        String(rb.user?._id || rb.user) === String(user._id)
      );

      if (!alreadyRead) {
        socket.emit('message-read', {
          chatType: 'general',
          messageId: msg._id,
          reader: { user: user._id, at: new Date() },
        });

        API.post('/chat/mark-read', { chatType: 'general' }).catch(() => {});
      }
    });

    socket.on('typing', (status) => setTyping(status));

    return () => {
      socket.off('receive-message');
      socket.off('typing');
    };
  }, [token, user._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() && !attachment) return;

    const formData = new FormData();
    formData.append('content', input);
    formData.append('chatType', 'general');
    if (replyTo) formData.append('replyTo', replyTo._id);
    if (attachment) formData.append('file', attachment);

    try {
      const res = await API.post('/chat/send', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      socket.emit('send-message', res.data);
      setInput('');
      setAttachment(null);
      setReplyTo(null);
      inputRef.current?.focus();
    } catch (err) {
      console.error('❌ Send failed:', err);
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    socket.emit('typing', true);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', false);
    }, 1000);
  };

  const getFormattedTime = (timestamp) => {
    const date = typeof timestamp === 'string' ? parseISO(timestamp) : new Date(timestamp);
    return isValid(date) ? format(date, 'p') : '—';
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
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 bg-[#ece5dd]">
        {messages.map((msg, index) => {
          const senderId = typeof msg.sender === 'string' ? msg.sender : msg.sender?._id;
          const isUser = String(senderId) === String(user._id);
          const isDelivered = !!msg._id;
          const isRead = isUser && msg.readBy?.length > 1;
          const key = msg._id || `${index}-fallback`;

          return (
            <div
              key={key}
              ref={(el) => (messageRefs.current[msg._id] = el)}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div className="flex flex-col items-end max-w-[75%]">
                <div
                  className={`relative w-fit px-4 py-2 rounded-2xl text-sm break-words whitespace-pre-wrap shadow-sm ${
                    isUser
                      ? 'bg-blue-100 text-black rounded-br-none'
                      : 'bg-white text-black rounded-bl-none'
                  }`}
                >
                  {msg.replyTo?.content && (
                    <div
                      className="text-xs italic text-gray-500 border-l-2 border-gray-400 pl-2 mb-1 cursor-pointer"
                      onClick={() => {
                        const el = messageRefs.current[msg.replyTo._id];
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      ↪ {msg.replyTo.content.slice(0, 40)}...
                    </div>
                  )}

                  {msg.content && (
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  )}

                  {msg.attachment?.base64 && (
                    <img
                      src={msg.attachment.base64}
                      alt={msg.attachment.name || 'attachment'}
                      className="max-w-[220px] mt-2 rounded-md shadow"
                    />
                  )}

                  <div className="text-[10px] text-gray-500 mt-1 flex justify-end items-center gap-1">
                    {getFormattedTime(msg.createdAt)}
                    {isUser && (
                      <>
                        {isRead ? (
                          <MdDoneAll className="text-blue-500 text-sm" />
                        ) : isDelivered ? (
                          <MdDoneAll className="text-gray-400 text-sm" />
                        ) : (
                          <span className="text-sm">✓</span>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <div
                  className={`text-[10px] text-gray-500 mt-[2px] ${
                    isUser ? 'text-right pr-1' : 'text-left pl-1'
                  }`}
                >
                  {isUser ? 'You' : 'User'}
                </div>
              </div>
            </div>
          );
        })}
        {typing && (
          <div className="text-xs italic text-gray-500">User is typing...</div>
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
            accept="image/*"
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

export default AdminGeneralChatModal;
