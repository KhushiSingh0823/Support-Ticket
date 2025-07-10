import React, { useEffect, useRef, useState } from 'react';
import { FiX, FiPaperclip, FiTrash2 } from 'react-icons/fi';
import { MdDoneAll } from 'react-icons/md';
import { useAuth } from '../context/AuthContext';
import { format, isValid, parseISO } from 'date-fns';
import { io } from 'socket.io-client';
import { getTicketMessages, sendTicketMessage } from '../api/api';

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
    if (!user?._id) return;

    socket.emit('join-room', roomId);

    const fetchMessages = async () => {
      try {
        const res = await getTicketMessages(ticket._id);
        setMessages(res.data || []);
      } catch (err) {
        console.error('Failed to load messages:', err);
      }
    };

    fetchMessages();

    socket.on('receive-message', (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    });

    socket.on('typing', (status) => setTyping(status));

    return () => {
      socket.off('receive-message');
      socket.off('typing');
    };
  }, [roomId, user, ticket._id]);

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

    const message = {
      sender: user._id,
      role: 'user',
      content: input,
      replyTo,
      ticketId: ticket._id,
      room: roomId,
    };

    if (attachment) {
      message.attachment = {
        name: attachment.name,
        url: URL.createObjectURL(attachment),
      };
    }

    socket.emit('send-message', message);

    try {
      await sendTicketMessage(ticket._id, message);
    } catch (err) {
      console.error('Failed to send message to DB:', err);
    }

    setMessages((prev) => [...prev, message]);
    setInput('');
    setReplyTo(null);
    setAttachment(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = '40px';
    }
  };

  const handleDelete = (id) => {
    setMessages((prev) => prev.filter((msg) => msg._id !== id));
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

  const ReadMore = ({ text, maxChars = 200 }) => {
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
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-blue-900 text-white rounded-t-xl">
        <h2 className="text-lg font-semibold">Ticket Chat — {ticket.issue}</h2>
        <button onClick={onClose} className="hover:text-red-300">
          <FiX size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg) => {
          const senderId = msg.sender?._id || msg.sender;
          const isSender = senderId === user._id;
          const key = msg._id || `${senderId}-${msg.createdAt}`;

          return (
            <div
              key={key}
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
                  {/* Reply Section with Read More */}
                  {msg.replyTo && (
                    <div
                      onClick={() => scrollToMessage(msg.replyTo._id)}
                      className="text-xs italic text-gray-500 border-l-2 border-gray-400 pl-2 mb-1 cursor-pointer"
                    >
                      <ReadMore text={`Replying to: "${msg.replyTo?.content || ''}"`} maxChars={100} />
                    </div>
                  )}

                  {/* Main Message with Read More */}
                  <ReadMore text={msg.content} />

                  {/* Attachment */}
                  {msg.attachment?.url && msg.attachment?.name && (
                    <a
                      href={msg.attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline text-xs block mt-1"
                    >
                      📎 {msg.attachment.name}
                    </a>
                  )}

                  {/* Time + Read */}
                  <div className="text-[10px] text-gray-500 mt-1 flex justify-end items-center gap-1">
                    {getFormattedTime(msg.createdAt)}
                    {isSender && <MdDoneAll className="text-blue-500 text-sm" />}
                  </div>
                </div>

                {/* Sender Label */}
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
          <div className="text-xs text-gray-500 italic mt-2 animate-pulse">
            Admin is typing...
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Attachment Preview */}
      {attachment && (
        <div className="bg-white px-4 py-2 text-xs text-gray-700 border-t">
          <span className="font-medium">Attached:</span> {attachment.name}
        </div>
      )}

      {/* Reply Preview */}
      {replyTo && (
        <div className="px-4 py-2 bg-white text-sm text-blue-800 flex items-center justify-between border-t">
          <span>Replying to: <i>{replyTo.content}</i></span>
          <button onClick={() => setReplyTo(null)} className="text-red-400 hover:text-red-600">
            <FiX />
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="px-4 py-3 bg-blue-50 flex items-center gap-2 border-t border-blue-200 rounded-b-xl">
        <label className="cursor-pointer text-blue-800 hover:text-blue-600">
          <FiPaperclip />
          <input
            type="file"
            hidden
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
