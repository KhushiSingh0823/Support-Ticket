import React, { useEffect, useRef, useState } from 'react';
import { FiX, FiPaperclip } from 'react-icons/fi';
import { MdDoneAll } from 'react-icons/md';
import { useAuth } from '../context/AuthContext';
import { format, isValid, parseISO } from 'date-fns';
import { io } from 'socket.io-client';
import API, { getTicketMessages, sendTicketMessage } from '../api/api'; // ✅ Fixed import

const socket = io('http://localhost:5000');

const CustomerTicketChatModal = ({ ticket, onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [attachment, setAttachment] = useState(null);

  const bottomRef = useRef();
  const messageRefs = useRef({});
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const roomId = `ticket-${ticket._id}`;

  useEffect(() => {
    socket.emit('join-room', roomId);

    const fetchMessages = async () => {
      try {
        const res = await getTicketMessages(ticket._id);
        const allMessages = res.data || [];
        setMessages(allMessages);

        // ✅ Mark admin messages as read
        const unread = allMessages.filter(
          (m) =>
            m.role === 'admin' &&
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

          // ✅ FIXED: Use API wrapper (not fetch)
          await API.post('/chat/mark-read', { chatType: 'ticket' });
        }
      } catch (err) {
        console.error('Failed to load messages:', err);
      }
    };

    fetchMessages();

    socket.on('receive-message', (msg) => {
      setMessages((prev) => {
        if (prev.find((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });

      // ✅ Mark admin message as read if user hasn't read it yet
      if (
        msg.role === 'admin' &&
        !msg.readBy?.some((rb) => {
          const id = typeof rb.user === 'string' ? rb.user : rb.user?._id;
          return id === user._id;
        })
      ) {
        socket.emit('message-read', {
          messageId: msg._id,
          reader: { user: user._id, at: new Date() },
        });

        // ✅ FIXED: Use API wrapper (not fetch)
        API.post('/chat/mark-read', { chatType: 'ticket' }).catch(() => {});
      }
    });

    socket.on('typing', (status) => setTyping(status));

    socket.on('message-read', ({ messageId, reader }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId && !m.readBy?.some((rb) => rb.user === reader.user)
            ? { ...m, readBy: [...(m.readBy || []), reader] }
            : m
        )
      );
    });

    return () => {
      socket.off('receive-message');
      socket.off('typing');
      socket.off('message-read');
    };
  }, [ticket._id, roomId, user._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const adjustHeight = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  };

  const handleSend = async () => {
    if (!input.trim() && !attachment) return;

    try {
      const formData = new FormData();
      formData.append('content', input);
      if (attachment) formData.append('file', attachment);
      if (replyTo?._id) formData.append('replyTo', replyTo._id);

      const res = await sendTicketMessage(ticket._id, formData);

      socket.emit('send-message', res.data);
      setMessages((prev) => [...prev, res.data]);

      setInput('');
      setReplyTo(null);
      setAttachment(null);
      if (textareaRef.current) textareaRef.current.style.height = '40px';
    } catch (err) {
      console.error('Send error:', err);
    }
  };

  const scrollToMessage = (id) => {
    const el = messageRefs.current[id];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-indigo-400');
      setTimeout(() => el.classList.remove('ring-2', 'ring-indigo-400'), 2000);
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

  return (
    <div className="w-full max-h-[90vh] rounded-xl shadow-xl flex flex-col border border-gray-200 bg-[#ece5dd]">
      <div className="flex items-center justify-between px-4 py-3 bg-blue-900 text-white rounded-t-xl">
        <h2 className="text-lg font-semibold">Ticket Chat — {ticket.issue}</h2>
        <button onClick={onClose} className="hover:text-red-300">
          <FiX size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, index) => {
          const senderId = msg.sender?._id || msg.sender;
          const isSender = senderId === user._id;
          const isDelivered = !!msg._id;

          const adminId = ticket.assignedAdmin?._id || ticket.assignedAdmin;
          const isRead =
            isSender &&
            msg.readBy?.some((rb) => {
              const rbId = typeof rb.user === 'object' ? rb.user._id : rb.user;
              return rbId === adminId;
            });

          const uniqueKey = msg._id || `${index}-${Date.now()}`; // Prevent duplicate key error

          return (
            <div
              key={uniqueKey}
              ref={(el) => (messageRefs.current[msg._id] = el)}
              className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
            >
              <div className="flex flex-col items-end max-w-[75%]">
                <div
                  className={`relative w-fit px-4 py-2 rounded-2xl text-sm break-words whitespace-pre-wrap shadow-sm ${
                    isSender
                      ? 'bg-blue-100 text-black rounded-br-none'
                      : 'bg-white text-black rounded-bl-none'
                  }`}
                >
                  {msg.replyTo?.content && (
                    <div
                      onClick={() => scrollToMessage(msg.replyTo._id)}
                      className="text-xs italic text-gray-500 border-l-2 border-gray-400 pl-2 mb-1 cursor-pointer"
                    >
                      <ReadMore text={`Replying to: "${msg.replyTo.content}"`} maxChars={100} />
                    </div>
                  )}

                  <ReadMore text={msg.content || ''} />

                  {msg.attachment?.base64 && (
                    <img
                      src={msg.attachment.base64}
                      alt={msg.attachment.name || 'attachment'}
                      className="mt-2 max-w-[200px] rounded-md shadow-sm border"
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
                  {isSender ? 'You' : 'Admin'}
                </div>
              </div>
            </div>
          );
        })}

        {typing && (
          <div className="text-xs text-gray-500 italic mt-2 animate-pulse">Admin is typing...</div>
        )}

        <div ref={bottomRef} />
      </div>

      {attachment && (
        <div className="bg-white px-4 py-2 text-xs text-gray-700 border-t">
          <span className="font-medium">Attached:</span> {attachment.name}
        </div>
      )}

      {replyTo && (
        <div className="px-4 py-2 bg-white text-sm text-blue-800 flex items-center justify-between border-t">
          <span>Replying to: <i>{replyTo.content}</i></span>
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
            accept="image/*"
            onChange={(e) => setAttachment(e.target.files[0])}
          />
        </label>
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            adjustHeight();
            socket.emit('typing', true);
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

export default CustomerTicketChatModal;
