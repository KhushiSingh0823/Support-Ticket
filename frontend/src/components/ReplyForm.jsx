import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import API from '../api/api';
import { useAuth } from '../context/AuthContext';
import { format, parseISO, isValid } from 'date-fns';
import { FiPaperclip, FiX } from 'react-icons/fi';
import { MdDoneAll } from 'react-icons/md';

//const socket = io('http://localhost:5000');
const socket = io('https://support-ticket-wcys.onrender.com');

const ReplyForm = ({ ticket }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [file, setFile] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [typingStatus, setTypingStatus] = useState('');
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const messageRefs = useRef({});

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await API.get(`/chat/ticket/${ticket._id}`);
        const allMessages = res.data || [];
        setMessages(allMessages);

        const unread = allMessages.filter(
          (m) =>
            !m.readBy?.some((rb) => {
              const id = typeof rb.user === 'string' ? rb.user : rb.user?._id;
              return id === user._id;
            })
        );

        if (unread.length > 0) {
          const now = new Date();
          for (let msg of unread) {
            socket.emit('message-read', {
              messageId: msg._id,
              reader: { user: user._id, at: now },
            });
          }
          await API.post('/chat/mark-read', { chatType: 'ticket' });
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
      }
    };

    if (ticket?._id) fetchMessages();
  }, [ticket?._id, user._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!ticket?._id) return;

    socket.emit('join-room', ticket._id);

    socket.on('receive-message', (msg) => {
      setMessages((prev) => {
        const exists = prev.some((m) => m._id === msg._id);
        return exists ? prev : [...prev, msg];
      });

      const alreadyRead = msg.readBy?.some((rb) => {
        const id = typeof rb.user === 'string' ? rb.user : rb.user?._id;
        return id === user._id;
      });

      if (!alreadyRead) {
        socket.emit('message-read', {
          messageId: msg._id,
          reader: { user: user._id, at: new Date() },
        });
        API.post('/chat/mark-read', { chatType: 'ticket' }).catch(() => {});
      }
    });

    socket.on('typing', (sender) => {
      if (sender !== user?.name) {
        setTypingStatus(`${sender} is typing...`);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setTypingStatus(''), 2000);
      }
    });

    return () => {
      socket.off('receive-message');
      socket.off('typing');
    };
  }, [ticket?._id, user?._id, user?.name]);

  const handleSend = async () => {
    if (!input.trim() && !file) return;

    try {
      const formData = new FormData();
      formData.append('chatType', 'ticket');
      if (input.trim()) formData.append('content', input);
      if (file) formData.append('file', file);
      if (replyTo) formData.append('replyTo', replyTo._id);

      const res = await API.post(`/chat/ticket/${ticket._id}/send`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const newMessage = res.data;
      setMessages((prev) => {
        const exists = prev.some((m) => m._id === newMessage._id);
        return exists ? prev : [...prev, newMessage];
      });

      socket.emit('send-message', newMessage);

      setInput('');
      setFile(null);
      setReplyTo(null);
      if (textareaRef.current) textareaRef.current.style.height = '40px';
    } catch (err) {
      console.error('Send error:', err);
    }
  };

  const adjustHeight = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  };

  const getFormattedTime = (timestamp) => {
    if (!timestamp) return '—';
    const date = typeof timestamp === 'string' ? parseISO(timestamp) : new Date(timestamp);
    return isValid(date) ? format(date, 'p') : '—';
  };

  const ReadMore = ({ text = '', maxChars = 200 }) => {
    const [expanded, setExpanded] = useState(false);
    const isLong = text.length > maxChars;

    return (
      <div>
        <p className="whitespace-pre-wrap break-words">
          {isLong && !expanded ? text.slice(0, maxChars) + '...' : text}
        </p>
        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[11px] text-blue-500 mt-1 focus:outline-none"
          >
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>
    );
  };

  const recipientId =
    user.role === 'admin'
      ? ticket.user?._id || ticket.user
      : ticket.assignedAdmin?._id || ticket.assignedAdmin;

  return (
    <div className="flex-1 flex flex-col bg-[#ece5dd] overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, index) => {
          const senderId = msg.sender?._id || msg.sender;
          const isSender = senderId === user._id;
          const isDelivered = !!msg._id;

          const isRead =
            isSender &&
            msg.readBy?.some((rb) => {
              const rbId = typeof rb.user === 'object' ? rb.user._id : rb.user;
              return rbId === recipientId;
            });

          const key = msg._id || `${index}-fallback`;

          return (
            <div
              key={key}
              ref={(el) => (messageRefs.current[msg._id] = el)}
              className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
            >
              <div className="flex flex-col items-end max-w-[75%]">
                <div
                  className={`relative w-fit px-4 py-2 rounded-2xl text-sm break-words whitespace-pre-wrap shadow-sm ${
                    isSender ? 'bg-blue-100 text-black rounded-br-none' : 'bg-white text-black rounded-bl-none'
                  }`}
                >
                  {msg.replyTo?.content && (
                    <div className="text-xs italic text-gray-500 border-l-2 border-gray-400 pl-2 mb-1">
                      <ReadMore text={`Replying to: "${msg.replyTo.content}"`} maxChars={100} />
                    </div>
                  )}
                  <ReadMore text={msg.content || ''} />
                  {msg.attachment?.base64 && (
                    <img
                      src={msg.attachment.base64}
                      alt={msg.attachment.name}
                      className="max-w-[200px] mt-2 rounded-lg shadow"
                    />
                  )}
                  <div className="text-[10px] text-gray-500 mt-1 flex justify-end items-center gap-1">
                    {getFormattedTime(msg.createdAt)}
                    {isSender && (
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
                    isSender ? 'text-right pr-1' : 'text-left pl-1'
                  }`}
                >
                  {isSender ? 'You' : user.role === 'admin' ? 'User' : 'Admin'}
                </div>
              </div>
            </div>
          );
        })}

        {typingStatus && (
          <div className="text-xs text-gray-500 italic px-2 mt-1 animate-pulse">{typingStatus}</div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {file && (
        <div className="bg-white px-4 py-2 border-t text-xs text-gray-700">
          <span className="font-medium">Attached:</span> {file.name}
        </div>
      )}

      {replyTo && (
        <div className="px-4 py-2 bg-white text-sm text-blue-800 flex items-center justify-between border-t">
          <span>
            Replying to: <i>{replyTo.content}</i>
          </span>
          <button onClick={() => setReplyTo(null)} className="text-red-400 hover:text-red-600">
            <FiX />
          </button>
        </div>
      )}

      <div className="px-4 py-3 bg-blue-50 flex items-center gap-2 border-t border-blue-200 rounded-b-xl">
        <label className="cursor-pointer text-blue-800 hover:text-blue-600">
          <FiPaperclip />
          <input
            type="file"
            hidden
            ref={fileInputRef}
            accept="image/*"
            onChange={(e) => setFile(e.target.files[0])}
          />
        </label>
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            adjustHeight();
            socket.emit('typing', user.name);
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => socket.emit('typing', false), 1000);
          }}
          onInput={adjustHeight}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
              setTimeout(adjustHeight, 0);
            }
          }}
          placeholder="Type a message"
          className="flex-1 max-h-40 px-4 py-2 rounded-full text-sm bg-white border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-hidden"
        />
        <button
          onClick={handleSend}
          className="px-4 py-2 rounded-full bg-blue-900 text-white text-sm font-semibold hover:bg-blue-800"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ReplyForm;
