import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import API from '../api/api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { FiPaperclip, FiX } from 'react-icons/fi';
import { MdDoneAll } from 'react-icons/md';

const socket = io('http://localhost:5000');

const ReplyForm = ({ ticket }) => {
  const { token, user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [file, setFile] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [typingStatus, setTypingStatus] = useState('');
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await API.get(`/tickets/${ticket._id}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessages(res.data);
      } catch (err) {
        console.error('Error fetching messages:', err);
      }
    };

    if (ticket?._id) fetchMessages();
  }, [ticket?._id, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!ticket?._id) return;
    socket.emit('join-room', ticket._id);

    socket.on('newMessage', (data) => {
      setMessages((prev) => [...prev, data.message]);
    });

    socket.on('typing', (sender) => {
      if (sender !== user?.name) {
        setTypingStatus(`${sender} is typing...`);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setTypingStatus(''), 2000);
      }
    });

    return () => {
      socket.off('newMessage');
      socket.off('typing');
    };
  }, [ticket?._id, user?.name]);

  const handleSend = async () => {
    if (!input.trim() && !file) return;
    try {
      const formData = new FormData();
      formData.append('chatType', 'ticket');
      if (input.trim()) formData.append('content', input);
      if (file) formData.append('file', file);
      if (replyTo) formData.append('replyTo', replyTo._id);

      const res = await API.post(`/tickets/${ticket._id}/reply`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      socket.emit('send-message', { chatType: 'ticket', ...res.data });
      setInput('');
      setFile(null);
      setReplyTo(null);
      textareaRef.current.style.height = '40px';
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
    const date = new Date(timestamp);
    return format(date, 'p');
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
    <div className="w-full h-full flex flex-col bg-[#ece5dd]">
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-3">
        {messages.map((msg) => {
          const senderId = msg.sender?._id || msg.sender;
          const isSender = senderId === user._id;

          return (
            <div key={msg._id} className={`flex w-full ${isSender ? 'justify-end' : 'justify-start'}`}>
              <div className="flex flex-col items-end max-w-[75%]">
                <div
                  className={`relative w-fit px-4 py-2 rounded-2xl text-sm break-words whitespace-pre-wrap shadow-sm ${
                    isSender ? 'bg-blue-100 text-black rounded-br-none' : 'bg-white text-black rounded-bl-none'
                  }`}
                >
                  {msg.replyTo?.content && (
                    <div className="text-xs italic text-gray-500 border-l-2 border-gray-400 pl-2 mb-1">
                      <ReadMore text={`Replying to: \"${msg.replyTo.content}\"`} maxChars={100} />
                    </div>
                  )}

                  <ReadMore text={msg.content || ''} />

                  {msg.attachment?.url && msg.attachment?.name && (
                    <a
                      href={`http://localhost:5000/${msg.attachment.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline text-xs block mt-1"
                    >
                      📎 {msg.attachment.name}
                    </a>
                  )}

                  <div className="text-[10px] text-gray-500 mt-1 flex justify-end items-center gap-1">
                    {getFormattedTime(msg.createdAt)}
                    {isSender && <MdDoneAll className="text-blue-500 text-sm" />}
                  </div>
                </div>

                <div className={`text-[10px] text-gray-500 mt-[2px] ${isSender ? 'text-right pr-1' : 'text-left pl-1'}`}>
                  {isSender ? 'You' : 'Admin'}
                </div>
              </div>
            </div>
          );
        })}

        {typingStatus && (
          <div className="text-xs text-gray-500 italic px-2 mt-1 animate-pulse">
            {typingStatus}
          </div>
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
          <span>Replying to: <i>{replyTo.content}</i></span>
          <button onClick={() => setReplyTo(null)} className="text-red-400 hover:text-red-600">
            <FiX />
          </button>
        </div>
      )}

      <div className="px-4 py-3 bg-blue-50 flex items-center gap-2 border-t border-blue-200">
        <label className="cursor-pointer text-blue-800 hover:text-blue-600">
          <FiPaperclip />
          <input
            type="file"
            hidden
            ref={fileInputRef}
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
