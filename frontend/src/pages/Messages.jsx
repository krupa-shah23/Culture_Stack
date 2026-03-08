import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyOrganization, createOrGetConversation, getConversationMessages, sendChatMessage, markMessagesAsRead, getMyConversations } from '../api/axios';
import { Search, Send, ChevronDown, Check, CheckCheck } from 'lucide-react';
import { socket } from '../utils/socket';

export default function Messages() {
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const navigate = useNavigate();

  // Selected State
  const [selectedMember, setSelectedMember] = useState(null);

  // UI Toggles
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Conversation & Messaging State
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const bottomRef = useRef(null);

  const currentUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('userInfo') || 'null') : null;

  // 1. Load team members and unread counts
  useEffect(() => {
    const fetchOrgAndConvs = async () => {
      try {
        setLoadingMembers(true);
        const [orgData, convs] = await Promise.all([
          getMyOrganization(),
          getMyConversations()
        ]);

        if (orgData && orgData.members) {
          // Exclude self and attach unread count from existing conversations
          const enrichedMembers = orgData.members
            .filter(m => m._id !== currentUser?._id)
            .map(m => {
              const mId = m._id?.toString() || m?.toString();
              const conv = convs.find(c => c.participants.some(p => {
                const pId = typeof p === 'object' ? p._id?.toString() : p?.toString();
                return pId === mId;
              }));

              const lastActivity = conv?.lastMessage
                ? new Date(conv.lastMessage.createdAt).getTime()
                : (conv?.updatedAt ? new Date(conv.updatedAt).getTime() : 0);

              return {
                ...m,
                unreadCount: conv ? conv.unreadCount : 0,
                lastActivity
              };
            })
            // Sort by last activity descending (newest messages at the top)
            .sort((a, b) => b.lastActivity - a.lastActivity);

          setMembers(enrichedMembers);
        }
      } catch (err) {
        console.error('Failed to load org members', err);
      } finally {
        setLoadingMembers(false);
      }
    };
    fetchOrgAndConvs();
  }, [currentUser?._id]);

  // 2. Load conversation when a member is clicked
  useEffect(() => {
    if (!selectedMember) return;

    const loadChat = async () => {
      try {
        setLoadingChat(true);
        // Create or get conversation with this specific user
        const conv = await createOrGetConversation(selectedMember._id);
        setConversation(conv);

        // Fetch their messages
        const msgs = await getConversationMessages(conv._id);
        const sortedMsgs = msgs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        setMessages(sortedMsgs || []);

        // Mark messages as read natively
        if (selectedMember?._id) {
          await markMessagesAsRead(conv._id, selectedMember._id);

          const unreadIds = sortedMsgs.filter(m => {
            const mSenderId = typeof m.sender === 'object' ? m.sender._id?.toString() : m.sender?.toString();
            return mSenderId === selectedMember._id?.toString() && m.status !== 'read';
          }).map(m => m._id);

          if (unreadIds.length > 0) {
            socket.emit("message-read", { messageIds: unreadIds, senderId: selectedMember._id });
          }

          // Clear the unread badge visually
          setMembers(prev => prev.map(m =>
            m._id?.toString() === selectedMember._id?.toString()
              ? { ...m, unreadCount: 0 }
              : m
          ));
        }
      } catch (error) {
        console.error('Error loading chat credentials', error);
      } finally {
        setLoadingChat(false);
      }
    };

    // Reset toggle to chat view when switching users
    setShowProfile(false);
    loadChat();
  }, [selectedMember]);

  // 3. Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loadingChat]);

  // Handle Receiving Real-time message & Statuses
  useEffect(() => {
    // Redundantly announce presence upon entering message views
    if (currentUser?._id) {
      socket.emit("join-user", currentUser._id);
    }

    // Also re-announce if socket reconnects under the hood
    const handleConnect = () => {
      if (currentUser?._id) socket.emit("join-user", currentUser._id);
    };

    const handleReceiveMessage = (message) => {
      const msgConvId = typeof message.conversation === 'object' ? message.conversation._id : message.conversation;
      const senderId = typeof message.sender === 'object' ? message.sender._id : message.sender;
      const isFromMe = senderId === currentUser?._id;

      // 1. Update the left sidebar (members list)
      setMembers(prev => {
        return prev.map(m => {
          const mId = m._id?.toString() || m?.toString();
          const sId = senderId?.toString();
          const smId = selectedMember?._id?.toString() || selectedMember?.toString();

          if (!isFromMe && mId === sId) {
            const isCurrentlyViewing = smId === sId;
            return {
              ...m,
              lastActivity: new Date(message.createdAt || Date.now()).getTime(),
              unreadCount: isCurrentlyViewing ? m.unreadCount : (m.unreadCount || 0) + 1
            };
          }
          if (isFromMe && mId === smId) {
            return {
              ...m,
              lastActivity: new Date(message.createdAt || Date.now()).getTime()
            };
          }
          return m;
        }).sort((a, b) => (b.lastActivity || 0) - (a.lastActivity || 0));
      });

      // 2. Update the active conversation messages if it matches
      if (conversation && msgConvId === conversation._id) {
        setMessages((prev) => {
          if (prev.some(m => m._id === message._id)) return prev;

          // Emit message-delivered since we received it
          if (!isFromMe) {
            socket.emit("message-delivered", { messageId: message._id, senderId });
          }

          // Mark as read natively if currently viewing their chat
          if (senderId === selectedMember?._id) {
            markMessagesAsRead(conversation._id, selectedMember._id);
            socket.emit("message-read", { messageIds: [message._id], senderId: selectedMember._id });
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

    const handleOnlineUsers = (users) => setOnlineUsers(users);
    const handleUserOnline = (userId) => setOnlineUsers(prev => [...new Set([...prev, userId])]);
    const handleUserOffline = (userId) => setOnlineUsers(prev => prev.filter(id => id !== userId));

    socket.on("connect", handleConnect);
    socket.on("receive-message", handleReceiveMessage);
    socket.on("message-status-update", handleMessageStatusUpdate);
    socket.on("online-users", handleOnlineUsers);
    socket.on("user-online", handleUserOnline);
    socket.on("user-offline", handleUserOffline);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("receive-message", handleReceiveMessage);
      socket.off("message-status-update", handleMessageStatusUpdate);
      socket.off("online-users", handleOnlineUsers);
      socket.off("user-online", handleUserOnline);
      socket.off("user-offline", handleUserOffline);
    };
  }, [conversation, selectedMember, currentUser]);

  // 4. Handle sending message
  const handleSend = async () => {
    if (!newMessage.trim() || !conversation) return;
    try {
      setSending(true);
      const payload = { conversationId: conversation._id, content: newMessage.trim() };
      const res = await sendChatMessage(payload);

      setMessages((prev) => [...prev, res.message]);
      setNewMessage("");

      setMembers(prev => prev.map(m => {
        const mId = m._id?.toString() || m?.toString();
        const smId = selectedMember._id?.toString() || selectedMember?.toString();
        return mId === smId
          ? { ...m, lastActivity: new Date(res.message.createdAt || Date.now()).getTime() }
          : m;
      }).sort((a, b) => (b.lastActivity || 0) - (a.lastActivity || 0)));

      socket.emit("send-message", { ...res.message, receiver: selectedMember._id });
    } catch (err) {
      console.error('Send message error', err);
    } finally {
      setSending(false);
    }
  };

  const filteredMembers = members.filter(m => m.fullName?.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex-1 w-full min-h-[calc(100vh-6rem)] bg-[#F5F5F0] pt-6 md:pt-10 pb-6 px-6 md:px-8 lg:px-12">

      {/* Centered Main Layout */}
      <div className="max-w-7xl mx-auto w-full h-[80vh] grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">

        {/* ================= LEFT PANEL (Chats list / Profile Preview) ================= */}
        <div className="hidden lg:flex bg-white rounded-3xl shadow-sm border border-gray-100 flex-col overflow-hidden">

          {!showProfile || !selectedMember ? (
            /* DEFAULT MODE: CHATS LIST */
            <div className="flex flex-col h-full p-6">

              <div className="mb-6">
                <h2 className="text-2xl font-bold text-charcoal mb-4">Messages</h2>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#8C7851]/30 transition-all text-charcoal"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1">
                {loadingMembers ? (
                  <p className="text-center text-charcoal/50 text-sm py-10">Loading members...</p>
                ) : filteredMembers.length === 0 ? (
                  <p className="text-center text-charcoal/50 text-sm py-10">No team members found</p>
                ) : (
                  filteredMembers.map((member) => {
                    const isActive = selectedMember?._id === member._id;
                    const isUnread = member.unreadCount > 0;
                    return (
                      <div
                        key={member._id}
                        onClick={() => setSelectedMember(member)}
                        className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition ${isActive ? "bg-gray-50 border-l-4 border-[#8C7851]" :
                          isUnread ? "bg-emerald-50/40 border-l-4 border-emerald-400 hover:bg-emerald-50/80" :
                            "hover:bg-gray-50 border-l-4 border-transparent"
                          }`}
                      >
                        <div className="w-12 h-12 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-semibold flex-shrink-0 relative">
                          {member.fullName?.[0]}
                          <div className={`absolute bottom-0 right-0 w-3 h-3 ${onlineUsers.includes(member._id) ? 'bg-emerald-400' : 'bg-gray-400'} border-2 border-white rounded-full`}></div>
                        </div>
                        <div className="flex-1 min-w-0 flex items-center justify-between">
                          <div>
                            <h4 className={`text-sm truncate ${isUnread ? "font-bold text-emerald-900" : "font-bold text-charcoal"}`}>{member.fullName}</h4>
                            <p className={`text-xs truncate ${isUnread ? "font-semibold text-emerald-700" : "text-charcoal/60"}`}>{member.department || "Team Member"}</p>
                          </div>
                          {member.unreadCount > 0 && (
                            <span className="bg-emerald-500 text-white rounded-full text-[10px] min-w-[20px] h-5 px-1.5 flex items-center justify-center font-bold shadow-md">
                              {member.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          ) : (
            /* PROFILE PREVIEW MODE */
            <div className="flex flex-col h-full p-6 items-center animate-in slide-in-from-left-8 duration-300">

              <div className="w-full mb-8">
                <button
                  onClick={() => setShowProfile(false)}
                  className="text-sm font-bold text-charcoal flex items-center gap-2 hover:text-[#8C7851] transition"
                >
                  <ChevronDown className="rotate-90" size={18} /> Back to Chats
                </button>
              </div>

              <div className="w-28 h-28 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-4xl font-semibold shadow-md mb-4 relative">
                {selectedMember.fullName?.[0]}
                <div className={`absolute bottom-2 right-2 w-5 h-5 ${onlineUsers.includes(selectedMember._id) ? 'bg-emerald-400' : 'bg-gray-400'} border-4 border-white rounded-full`}></div>
              </div>

              <h2 className="text-2xl font-bold text-charcoal text-center mb-1">{selectedMember.fullName}</h2>
              <p className={`text-sm font-medium px-3 py-1 rounded-full mb-6 ${onlineUsers.includes(selectedMember._id) ? 'text-emerald-500 bg-emerald-50' : 'text-gray-500 bg-gray-100'}`}>
                {onlineUsers.includes(selectedMember._id) ? 'Active now' : 'Offline'}
              </p>

              <div className="w-full bg-gray-50 rounded-2xl p-5 border border-gray-100">
                <p className="text-xs font-bold text-charcoal/40 uppercase tracking-wider mb-1">Email address</p>
                <p className="text-sm font-medium text-charcoal truncate">{selectedMember.email}</p>
              </div>
            </div>
          )}

        </div>


        {/* ================= MIDDLE PANEL (Conversation) ================= */}
        <div className="bg-[#F5F6FA] rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden max-h-full relative">

          {!selectedMember ? (
            /* EMPTY STATE */
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-20 h-20 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">👋</span>
              </div>
              <h2 className="text-xl font-bold text-charcoal mb-2">Your messages</h2>
              <p className="text-sm text-charcoal/60 max-w-xs mx-auto">Select a team member from the left to start collaborating.</p>
            </div>
          ) : (
            /* ACTIVE CONVERSATION */
            <>
              {/* CHAT HEADER */}
              <div className="bg-white px-6 py-4 flex items-center gap-4 shadow-sm z-10 border-b border-gray-100">
                <button
                  onClick={() => setSelectedMember(null)}
                  className="p-2 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition lg:hidden"
                >
                  ←
                </button>

                <div
                  className="flex items-center gap-3 cursor-pointer group"
                  onClick={() => setShowProfile(!showProfile)}
                >
                  <div className="w-12 h-12 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-semibold text-[19px] flex-shrink-0 group-hover:scale-105 transition-transform">
                    {selectedMember.fullName?.[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-charcoal text-[17px] group-hover:text-[#8C7851] transition-colors leading-tight">{selectedMember.fullName}</h3>
                    <p className="text-xs text-charcoal/50 font-medium flex items-center gap-1.5 mt-0.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${onlineUsers.includes(selectedMember._id) ? 'bg-emerald-400' : 'bg-gray-400'}`}></span> {onlineUsers.includes(selectedMember._id) ? 'Active now' : 'Offline'}
                    </p>
                  </div>
                </div>
              </div>

              {/* MESSAGES AREA */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col">
                {loadingChat ? (
                  <div className="flex-1 flex items-center justify-center text-charcoal/50 text-sm font-medium">
                    Loading conversation...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-charcoal/40 text-sm">
                    <span>No messages yet.</span>
                    <span>Send a secure message to start the conversation.</span>
                  </div>
                ) : (
                  <>
                    {messages.map((m, idx) => {
                      const isMine = m.sender._id === currentUser?._id;
                      return (
                        <div key={m._id || idx} className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                          <div
                            className={`px-5 py-3.5 rounded-2xl max-w-[65%] text-[15px] leading-relaxed shadow-sm relative flex flex-col ${isMine
                              ? "bg-[#1A1A1A] text-white rounded-tr-sm"
                              : "bg-white text-charcoal border border-gray-100 rounded-tl-sm"
                              }`}
                          >
                            <span className={`${isMine ? "pr-5" : ""}`}>{m.content}</span>
                            {isMine && (
                              <span className="absolute bottom-1 right-2 text-white/70">
                                {m.status === "sent" && <Check size={12} />}
                                {m.status === "delivered" && <CheckCheck size={12} />}
                                {m.status === "read" && <CheckCheck size={12} className="text-blue-400" />}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-charcoal/40 font-medium mt-1.5 px-1">
                            {new Date(m.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )
                    })}
                    <div ref={bottomRef} />
                  </>
                )}
              </div>

              {/* INPUT AREA */}
              <div className="p-4 m-4 mt-0 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Write your message..."
                  className="flex-1 bg-transparent py-2 px-2 text-[15px] text-charcoal outline-none placeholder-gray-400"
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !newMessage.trim()}
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${sending || !newMessage.trim()
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-emerald-500 text-white hover:bg-emerald-600 shadow-md hover:scale-105 hover:shadow-lg"
                    }`}
                >
                  <Send size={18} className={newMessage.trim() ? "ml-1" : ""} />
                </button>
              </div>

            </>
          )}

        </div>

      </div>
    </div>
  );
}