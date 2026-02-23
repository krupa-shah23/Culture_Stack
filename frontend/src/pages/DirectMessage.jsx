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
    <div className="min-h-screen bg-[#1C1D25] text-white px-6 py-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="text-sm text-gray-400 hover:text-white">← Back</button>
          <div className="w-12 h-12 rounded-full bg-[#303241] flex items-center justify-center text-xl font-bold">{otherParticipant?.fullName?.[0] || '?'}</div>
          <div>
            <div className="text-lg font-semibold">{otherParticipant?.fullName || 'Direct Message'}</div>
            <div className="text-xs text-gray-400">Private conversation</div>
          </div>
        </div>

        <div className="bg-[#242631] rounded-2xl p-6 border border-white/5 shadow-md min-h-[400px] flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">Loading messages…</div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-4 pb-4">
              {messages.length === 0 && (
                <div className="text-center text-gray-400 mt-10">No messages yet — say hello</div>
              )}

              {messages.map((m) => {
                const mine = m.sender._id === currentUser?._id;
                return (
                  <div key={m._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] px-4 py-2 rounded-xl ${mine ? 'bg-[#4BA9FF] text-black' : 'bg-[#1C1D25] text-gray-200'} `}>
                      <div className="text-sm leading-relaxed">{m.content}</div>
                      <div className="text-[10px] text-gray-400 text-right mt-1">{new Date(m.createdAt).toLocaleTimeString()}</div>
                    </div>
                  </div>
                );
              })}

              <div ref={bottomRef} />
            </div>
          )}

          {/* Input */}
          <div className="mt-4 pt-4 border-t border-white/5">
            <div className="flex gap-3">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={2}
                className="flex-1 resize-none bg-[#1C1D25] border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none"
                placeholder={`Message ${otherParticipant?.fullName || 'user'}...`}
              />
              <div className="flex flex-col justify-end">
                <button
                  onClick={handleSend}
                  disabled={sending || !text.trim()}
                  className={`px-5 py-3 rounded-full font-semibold ${sending || !text.trim() ? 'bg-gray-600/40 text-gray-300 cursor-not-allowed' : 'bg-[#4BA9FF] text-black'}`}
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
