import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createOrGetConversation, getConversationMessages, sendChatMessage } from '../api/axios';
import { Search, FileText, Image as ImageIcon, Video, Folder, Paperclip, Send, MoreVertical, ChevronDown, Clock, CheckCircle2, Check, CheckCheck } from 'lucide-react';
import { socket } from '../utils/socket';
import { markMessagesAsRead } from '../api/axios';

export default function DirectMessage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const bottomRef = useRef(null);

  const currentUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('userInfo') || 'null') : null;

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        // create or fetch existing conversation
        const conv = await createOrGetConversation(userId);
        setConversation(conv);

        // fetch messages
        const msgs = await getConversationMessages(conv._id);
        const sortedMsgs = msgs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        setMessages(sortedMsgs || []);

        // Mark messages as read
        const otherParticipantId = conv.participants?.find((p) => typeof p === 'object' ? p._id !== currentUser?._id : p !== currentUser?._id);
        const actualOtherId = typeof otherParticipantId === 'object' ? otherParticipantId._id : otherParticipantId;
        if (actualOtherId) {
          await markMessagesAsRead(conv._id, actualOtherId);
          socket.emit("message-read", { messageIds: sortedMsgs.filter(m => m.sender._id === actualOtherId && m.status !== 'read').map(m => m._id), senderId: actualOtherId });
        }
      } catch (err) {
        console.error('DM init error', err);
      } finally {
        setLoading(false);
      }
    };
    init();

    const handleOnlineUsers = (users) => setOnlineUsers(users);
    const handleUserOnline = (userId) => setOnlineUsers(prev => [...new Set([...prev, userId])]);
    const handleUserOffline = (userId) => setOnlineUsers(prev => prev.filter(id => id !== userId));

    socket.on("online-users", handleOnlineUsers);
    socket.on("user-online", handleUserOnline);
    socket.on("user-offline", handleUserOffline);

    return () => {
      socket.off("online-users", handleOnlineUsers);
      socket.off("user-online", handleUserOnline);
      socket.off("user-offline", handleUserOffline);
    };
  }, [userId]);

  useEffect(() => {
    // scroll to bottom whenever messages change
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (currentUser?._id) {
      socket.emit("join-user", currentUser._id);
    }

    const handleConnect = () => {
      if (currentUser?._id) socket.emit("join-user", currentUser._id);
    };

    const handleReceiveMessage = (message) => {
      const msgConvId = typeof message.conversation === 'object' ? message.conversation._id : message.conversation;
      if (conversation && msgConvId === conversation._id) {
        setMessages((prev) => {
          if (prev.some(m => m._id === message._id)) return prev;

          // Emit message-delivered since we received it
          if (message.sender._id !== currentUser?._id && message.sender !== currentUser?._id) {
            socket.emit("message-delivered", { messageId: message._id, senderId: message.sender._id || message.sender });
          }

          // Mark as read natively if currently viewing their chat
          const otherParticipantId = typeof otherParticipant?._id === 'object' ? otherParticipant?._id?._id : otherParticipant?._id;
          if ((message.sender._id || message.sender) === otherParticipantId) {
            markMessagesAsRead(conversation._id, otherParticipantId);
            socket.emit("message-read", { messageIds: [message._id], senderId: otherParticipantId });
          }

          const newMsgs = [...prev, message];
          return newMsgs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        });
      }
    };

    const handleMessageStatusUpdate = ({ messageId, messageIds, status }) => {
      setMessages((prev) => prev.map(m => {
        if (messageId && m._id === messageId) return { ...m, status };
        if (messageIds && messageIds.includes(m._id)) return { ...m, status };
        return m;
      }));
    };

    socket.on("connect", handleConnect);
    socket.on("receive-message", handleReceiveMessage);
    socket.on("message-status-update", handleMessageStatusUpdate);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("receive-message", handleReceiveMessage);
      socket.off("message-status-update", handleMessageStatusUpdate);
    };
  }, [conversation, otherParticipant, currentUser]);

  const handleSend = async () => {
    if (!text.trim() || !conversation) return;
    try {
      setSending(true);
      const payload = { conversationId: conversation._id, content: text.trim() };
      const res = await sendChatMessage(payload);
      // res.message contains populated message
      setMessages((m) => [...m, res.message]);
      setText('');
      socket.emit("send-message", { ...res.message, receiver: otherParticipant._id });
    } catch (err) {
      console.error('Send message error', err);
      alert(err?.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const otherParticipant = conversation?.participants?.find((p) => p._id !== currentUser?._id) || null;

  // UI STATE FOR NEW LAYOUT
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Dummy chats to mimic the screenshot
  const dummyChats = [
    { id: 1, name: "Real estate deals", time: "11:15", preview: "typing...", active: false },
    { id: 2, name: "Kate Johnson", time: "11:15", preview: "I will send the document s...", active: false },
    { id: 3, name: "Tamara Shevchenko", time: "10:05", preview: "Are you going to a busine...", active: false },
    { id: 4, name: "Joshua Clarkson", time: "15:09", preview: "I suggest to start, I have n...", active: false },
  ];

  return (
    <div className="flex-1 w-full h-[calc(100vh-6rem)] pt-6 md:pt-10 pb-6">
      <div className="bg-mesh-gradient fixed inset-0 z-[-1]" />

      <div className="w-full h-full max-w-[1400px] mx-auto px-4 md:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-[300px_1fr_320px] gap-6 pb-6">

        {/* ================= LEFT SIDEBAR (Chats List) ================= */}
        <div className="hidden lg:flex bg-white rounded-3xl shadow-sm border border-gray-100 flex-col overflow-hidden">
          <div className="p-6 pb-4">
            <div className="flex items-center gap-4 mb-6 text-charcoal">
              <button onClick={() => navigate(-1)} className="p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
                ←
              </button>
              <h2 className="text-xl font-bold">Chat</h2>
            </div>

            {/* Current User Profile Snippet */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-charcoal to-[#8C7851] text-white flex items-center justify-center text-2xl font-bold shadow-md mb-3 relative">
                {currentUser?.fullName?.[0] || "U"}
                <div className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-400 border-2 border-white rounded-full"></div>
              </div>
              <h3 className="font-bold text-charcoal text-lg">{currentUser?.fullName || "User"}</h3>
              <div className="flex items-center gap-1 text-xs text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full mt-1 font-medium">
                available <ChevronDown size={14} className="ml-1" />
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C7851]/20 transition-all text-charcoal"
              />
            </div>

            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-charcoal/60">Last chats</h4>
              <button className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center hover:bg-emerald-100 transition">
                +
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1">
            {/* Active Chat (Current) */}
            <div className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer hover:bg-gray-50 transition border-l-4 border-l-[#8C7851] bg-[#F9F9FA]">
              <div className="w-12 h-12 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-semibold flex-shrink-0 relative">
                {otherParticipant?.fullName?.[0] || "?"}
                <div className={`absolute bottom-0 right-0 w-3 h-3 ${onlineUsers.includes(otherParticipant?._id) ? 'bg-emerald-400' : 'bg-gray-400'} border-2 border-white rounded-full`}></div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-0.5">
                  <h4 className="font-bold text-charcoal text-sm truncate">{otherParticipant?.fullName || "Group Chat"}</h4>
                  <span className="text-[10px] text-charcoal/40">Now</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-charcoal/60 truncate flex-1">
                    {messages.length > 0 ? messages[messages.length - 1].content : "Say hello!"}
                  </p>
                </div>
              </div>
            </div>

            {/* Dummy Chats */}
            {dummyChats.map(chat => (
              <div key={chat.id} className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer hover:bg-gray-50 transition border-l-4 border-l-transparent">
                <div className="w-12 h-12 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-semibold flex-shrink-0">
                  {chat.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <h4 className="font-bold text-charcoal text-sm truncate">{chat.name}</h4>
                    <span className="text-[10px] text-charcoal/40">{chat.time}</span>
                  </div>
                  <p className={`text-xs truncate ${chat.preview === 'typing...' ? 'text-emerald-500 italic' : 'text-charcoal/60'}`}>
                    {chat.preview}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ================= MIDDLE CHAT AREA ================= */}
        <div className="bg-[#F5F6FA] border border-gray-100 rounded-3xl shadow-sm flex flex-col overflow-hidden max-h-full relative">

          {/* Header */}
          <div className="bg-white px-6 py-5 flex items-center justify-between shadow-sm z-10">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 bg-gray-50 border border-gray-200 rounded-xl hover:bg-black/5 transition lg:hidden"
              >
                ←
              </button>

              <div
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => setShowProfile(!showProfile)}
              >
                <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-semibold text-[17px] flex-shrink-0 group-hover:scale-105 transition-transform">
                  {otherParticipant?.fullName?.[0] || "?"}
                </div>
                <div>
                  <h2 className="font-bold text-charcoal group-hover:text-[#8C7851] transition-colors leading-tight">{otherParticipant?.fullName || "Group Chat"}</h2>
                  <p className="text-xs text-charcoal/50 flex items-center gap-1.5 mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${onlineUsers.includes(otherParticipant?._id) ? 'bg-emerald-400' : 'bg-gray-400'}`}></span> {onlineUsers.includes(otherParticipant?._id) ? 'Active now' : 'Offline'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
              <button className="px-4 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 font-bold text-sm shadow-sm">Messages</button>
              <button className="px-4 py-1.5 rounded-lg text-charcoal/50 hover:text-charcoal text-sm font-medium transition">Participants</button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col">
            {loading ? (
              <div className="flex-1 flex items-center justify-center text-charcoal/60 font-medium">
                Loading messages...
              </div>
            ) : (
              <>
                {messages.length === 0 && (
                  <div className="text-center text-charcoal/50 mt-10 p-6 bg-white rounded-3xl border border-gray-100/50 mx-auto max-w-sm">
                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="text-emerald-500" size={24} />
                    </div>
                    <h3 className="font-bold text-charcoal mb-2">No messages yet</h3>
                    <p className="text-sm">Start the conversation by sending a message below.</p>
                  </div>
                )}

                {messages.map((m) => {
                  const mine = m.sender._id === currentUser?._id;

                  return (
                    <div key={m._id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
                      <span className="text-[10px] font-medium text-charcoal/40 mb-1 ml-1 mr-1">
                        {mine ? 'You' : m.sender.fullName}, {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div className={`flex gap-2 max-w-[70%] ${mine ? "flex-row-reverse" : "flex-row"}`}>
                        {!mine && (
                          <div className="w-8 h-8 rounded-full bg-charcoal text-white flex items-center justify-center font-bold text-xs flex-shrink-0 mt-auto">
                            {m.sender.fullName[0]}
                          </div>
                        )}
                        <div
                          className={`px-5 py-3.5 rounded-2xl shadow-sm text-sm leading-relaxed relative flex flex-col ${mine
                            ? "bg-charcoal text-white rounded-br-sm"
                            : "bg-white text-charcoal border border-gray-100 rounded-bl-sm"
                            }`}
                        >
                          <span className={`${mine ? "pr-4" : ""}`}>{m.content}</span>
                          {mine && (
                            <span className="absolute bottom-1 right-1.5 text-white/70">
                              {m.status === "sent" && <Check size={12} />}
                              {m.status === "delivered" && <CheckCheck size={12} />}
                              {m.status === "read" && <CheckCheck size={12} className="text-blue-400" />}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </>
            )}
          </div>

          {/* Typing indicator placeholder */}
          {!loading && dummyChats[0].preview === 'typing...' && (
            <div className="px-8 pb-2 flex items-center gap-2">
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
              <span className="text-xs text-charcoal/50 font-medium">{otherParticipant?.fullName} is typing</span>
            </div>
          )}

          {/* Input Area */}
          <div className="bg-white p-4 m-4 mt-0 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
            <button className="p-2 text-gray-400 hover:text-charcoal transition rounded-full hover:bg-gray-50 flex-shrink-0">
              <Paperclip size={20} />
            </button>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 bg-transparent py-2 focus:outline-none text-charcoal text-sm placeholder-gray-400"
              placeholder="Write your message..."
            />
            <button className="p-2 text-gray-400 hover:text-charcoal transition rounded-full hover:bg-gray-50 flex-shrink-0">
              <span className="text-xl leading-none">☺</span>
            </button>
            <button
              onClick={handleSend}
              disabled={sending || !text.trim()}
              className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-all flex-shrink-0 ${sending || !text.trim()
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-emerald-500 text-white hover:bg-emerald-600 hover:shadow-md hover:scale-105'
                }`}
            >
              <Send size={18} className={text.trim() ? "ml-1" : ""} />
            </button>
          </div>
        </div>

        {/* ================= RIGHT SIDEBAR ================= */}
        <div className="hidden lg:flex bg-white rounded-3xl shadow-sm border border-gray-100 flex-col overflow-hidden relative">

          {!showProfile ? (
            /* SHARED FILES VIEW (Default) */
            <div className="p-6 h-full flex flex-col">
              <div className="flex justify-between items-center mb-8 text-charcoal">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <ChevronDown className="rotate-90 text-gray-400" size={20} /> Shared files
                </h2>
              </div>

              <div className="flex flex-col items-center mb-8">
                <div className="w-24 h-24 rounded-full bg-charcoal flex items-center justify-center text-3xl font-bold text-white mb-4 shadow-lg">
                  {otherParticipant?.fullName?.[0] || "P"}
                </div>
                <h3 className="font-bold text-xl text-charcoal mb-1">{otherParticipant?.fullName || "Real estate deals"}</h3>
                <p className="text-sm text-charcoal/50">10 members</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100/50 flex flex-col pointer-events-none">
                  <div className="flex items-center justify-between mb-2">
                    <Folder className="text-emerald-500" size={24} />
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-auto"></div>
                  </div>
                  <p className="text-xs text-emerald-800/60 font-medium mb-0.5">All files</p>
                  <p className="text-xl font-bold text-emerald-900">231</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <Folder className="text-gray-400" size={24} />
                  </div>
                  <p className="text-xs text-charcoal/50 font-medium mb-0.5">All links</p>
                  <p className="text-xl font-bold text-charcoal">45</p>
                </div>
              </div>

              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-bold text-charcoal">File type</h4>
                <button><MoreVertical size={16} className="text-gray-400" /></button>
              </div>

              <div className="space-y-1 flex-1 overflow-y-auto">

                <div className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition group">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                    <FileText size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-charcoal group-hover:text-blue-600 transition">Documents</p>
                    <p className="text-xs text-charcoal/50">126 files, 193MB</p>
                  </div>
                  <ChevronDown className="-rotate-90 text-gray-300 group-hover:text-blue-400 transition" size={16} />
                </div>

                <div className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition group">
                  <div className="w-12 h-12 rounded-xl bg-yellow-50 text-yellow-600 flex items-center justify-center">
                    <ImageIcon size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-charcoal group-hover:text-yellow-600 transition">Photos</p>
                    <p className="text-xs text-charcoal/50">53 files, 321MB</p>
                  </div>
                  <ChevronDown className="-rotate-90 text-gray-300 group-hover:text-yellow-400 transition" size={16} />
                </div>

                <div className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition group">
                  <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                    <Video size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-charcoal group-hover:text-cyan-600 transition">Movies</p>
                    <p className="text-xs text-charcoal/50">3 files, 210MB</p>
                  </div>
                  <ChevronDown className="-rotate-90 text-gray-300 group-hover:text-cyan-400 transition" size={16} />
                </div>

              </div>
            </div>
          ) : (
            /* PROFILE VIEW (Toggled when clicking avatar) */
            <div className="p-6 h-full flex flex-col animate-in slide-in-from-right-8 duration-300">
              <div className="flex justify-between items-center mb-8 text-charcoal">
                <h2 className="text-lg font-bold flex items-center gap-2 cursor-pointer hover:text-charcoal/70" onClick={() => setShowProfile(false)}>
                  <ChevronDown className="rotate-90" size={20} /> Back to files
                </h2>
              </div>

              <div className="flex flex-col items-center mb-6">
                <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-charcoal to-[#8C7851] flex items-center justify-center text-4xl font-bold text-white mb-4 shadow-xl border-4 border-white relative">
                  {otherParticipant?.fullName?.[0] || "?"}
                  <div className={`absolute bottom-2 right-2 w-5 h-5 ${onlineUsers.includes(otherParticipant?._id) ? 'bg-emerald-400' : 'bg-gray-400'} border-4 border-white rounded-full`}></div>
                </div>
                <h3 className="font-bold text-2xl text-charcoal mb-1">{otherParticipant?.fullName || "User Profile"}</h3>
                <p className={`text-sm font-medium px-3 py-1 rounded-full mb-6 ${onlineUsers.includes(otherParticipant?._id) ? 'text-emerald-500 bg-emerald-50' : 'text-gray-500 bg-gray-100'}`}>
                  {onlineUsers.includes(otherParticipant?._id) ? 'Active now' : 'Offline'}
                </p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-5 mb-6 border border-gray-100 space-y-4">
                <div>
                  <p className="text-xs text-charcoal/50 font-bold uppercase tracking-wider mb-1">Email</p>
                  <p className="text-sm text-charcoal font-medium">{otherParticipant?.email || "Hidden"}</p>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs text-charcoal/50 font-bold uppercase tracking-wider mb-1">Joined</p>
                  <p className="text-sm text-charcoal flex items-center gap-1 font-medium"><Clock size={14} className="text-charcoal/40" /> {otherParticipant?.createdAt ? new Date(otherParticipant.createdAt).toLocaleDateString() : 'Recently'}</p>
                </div>
              </div>

              <button className="w-full py-4 rounded-xl bg-charcoal text-white font-bold hover:bg-black transition-all shadow-md mt-auto flex items-center justify-center gap-2">
                View Full Profile
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
