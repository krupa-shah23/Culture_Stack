import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createOrGetConversation, getConversationMessages, sendChatMessage } from '../api/axios';

export default function DirectMessage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState('');
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
        setMessages(msgs || []);
      } catch (err) {
        console.error('DM init error', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [userId]);

  useEffect(() => {
    // scroll to bottom whenever messages change
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || !conversation) return;
    try {
      setSending(true);
      const payload = { conversationId: conversation._id, content: text.trim() };
      const res = await sendChatMessage(payload);
      // res.message contains populated message
      setMessages((m) => [...m, res.message]);
      setText('');
    } catch (err) {
      console.error('Send message error', err);
      alert(err?.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const otherParticipant = conversation?.participants?.find((p) => p._id !== currentUser?._id) || null;

  return (
    <div className="flex-1 w-full px-4 md:px-6 pb-12 relative flex flex-col h-[calc(100vh-6rem)] relative bg-[#F5F5F0]">
      {/* MASTER CONTAINER */}
      <div className="w-full max-w-6xl mx-auto flex-1 flex flex-col rounded-3xl border border-black/5 bg-white/40 backdrop-blur-xl shadow-sm p-6 md:p-10 relative z-10">
        <div className="max-w-4xl w-full mx-auto flex flex-col flex-1 pb-4">
          <div className="flex items-center gap-4 mb-4">
            <button onClick={() => navigate(-1)} className="text-sm text-[#1A1A1A]/80 hover:text-[#1A1A1A] transition-colors">&larr; Back</button>
            <div className="w-12 h-12 rounded-full bg-charcoal text-white flex items-center justify-center text-xl font-bold shadow-sm">{otherParticipant?.fullName?.[0] || '?'}</div>
            <div>
              <div className="text-lg font-bold text-charcoal">{otherParticipant?.fullName || 'Direct Message'}</div>
              <div className="text-xs text-[#1A1A1A]/80">Private conversation</div>
            </div>
          </div>

          <div className="bg-[#F5F5F0] border border-black/5 rounded-2xl p-6 shadow-sm flex flex-col flex-1 overflow-hidden min-h-[400px]">
            {loading ? (
              <div className="flex-1 flex items-center justify-center text-charcoal/80">Loading messages...</div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-4 pb-4 custom-scrollbar pr-2">
                {messages.length === 0 && (
                  <div className="text-center text-charcoal/80 mt-10">No messages yet - say hello</div>
                )}

                {messages.map((m) => {
                  const mine = m.sender._id === currentUser?._id;
                  return (
                    <div key={m._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] px-5 py-3 rounded-2xl shadow-sm ${mine ? 'bg-charcoal text-white' : 'bg-earth-bg border border-black/5 text-charcoal'} `}>
                        <div className="text-sm leading-relaxed">{m.content}</div>
                        <div className={`text-[10px] text-right mt-1 ${mine ? 'text-white/70' : 'text-charcoal/80'}`}>{new Date(m.createdAt).toLocaleTimeString()}</div>
                      </div>
                    </div>
                  );
                })}

                <div ref={bottomRef} />
              </div>
            )}

            {/* Input */}
            <div className="mt-4 pt-4 border-t border-black/5">
              <div className="flex gap-3">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={2}
                  className="flex-1 resize-none bg-white border border-black/5 rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:border-black/20 focus:ring-1 focus:ring-black/20 transition-colors shadow-sm"
                  placeholder={`Message ${otherParticipant?.fullName || 'user'}...`}
                />
                <div className="flex flex-col justify-end">
                  <button
                    onClick={handleSend}
                    disabled={sending || !text.trim()}
                    className={`px-6 py-3 rounded-full font-bold transition-all ${sending || !text.trim() ? 'bg-[#E5E5E0] text-[#1A1A1A]/40 cursor-not-allowed border border-black/5' : 'bg-[#1A1A1A] text-white hover:bg-black transition hover:shadow-md'}`}
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
