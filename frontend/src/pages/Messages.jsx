import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMyConversations, getMyOrganization } from '../api/axios';
import { Users, Hourglass, MessageSquare } from 'lucide-react';

export default function Messages() {
  const [conversations, setConversations] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const currentUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('userInfo') || 'null') : null;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [convData, orgData] = await Promise.all([
          getMyConversations(),
          getMyOrganization()
        ]);
        setConversations(convData || []);

        // Filter out current user from members list
        if (orgData && orgData.members) {
          setMembers(orgData.members.filter(m => m._id !== currentUser?._id));
        }
      } catch (err) {
        console.error('Failed to load messages data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="flex-1 w-full px-4 md:px-6 pb-12 relative flex flex-col h-[calc(100vh-6rem)] relative bg-[#F5F5F0]">
      {/* MASTER CONTAINER */}
      <div className="w-full max-w-6xl mx-auto flex-1 flex flex-col items-center rounded-3xl border border-black/5 bg-white/40 backdrop-blur-xl shadow-sm overflow-y-auto no-scrollbar p-6 md:p-10 relative z-10">
        <div className="max-w-2xl w-full">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-extrabold mb-3">Messages</h1>
            <p className="text-charcoal/80">Connect with your team members</p>
          </div>

          {/* TEAM MEMBERS CARD - CENTERED */}
          <div className="bg-white border border-black/5 rounded-2xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-black/5 bg-black/5 flex flex-col items-center">
              <h2 className="text-xl font-bold text-[#1A1A1A] flex items-center justify-center gap-2">
                <Users className="w-5 h-5 text-[#1A1A1A]" /> Your Team
              </h2>
              <p className="text-sm text-[#1A1A1A]/80 mt-1 text-center">{members.length} members available</p>
            </div>

            {/* Content */}
            <div className="p-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="text-[#1A1A1A]/80 animate-pulse text-center flex flex-col items-center">
                    <p className="mb-2 flex items-center gap-2">
                      <Hourglass className="w-5 h-5 text-[#1A1A1A]/80 animate-spin" /> Loading team members...
                    </p>
                  </div>
                </div>
              ) : members.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="w-16 h-16 text-[#1A1A1A]/30 mb-4" />
                  <p className="text-[#1A1A1A]/80 mb-2">No team members found</p>
                  <p className="text-sm text-[#1A1A1A]/80">You'll be able to message members once they join your organization</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                  {members.map((member, idx) => (
                    <div key={member._id}>
                      <div
                        onClick={() => navigate(`/dm/${member._id}`)}
                        className="flex items-center gap-4 p-4 bg-white hover:bg-black/5 rounded-xl border border-black/5 transition-all duration-300 group cursor-pointer hover:shadow-md"
                      >
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-full bg-charcoal flex items-center justify-center font-bold text-base text-white flex-shrink-0 group-hover:scale-105 transition shadow-sm">
                          {member.fullName?.[0] || '?'}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-base text-charcoal group-hover:text-earth-green transition-colors">
                            {member.fullName}
                          </h4>
                          <p className="text-sm text-charcoal/80">
                            {member.department || 'Team Member'}
                          </p>
                        </div>

                        {/* Chat Button */}
                        <button className="flex items-center gap-2 text-sm bg-white border border-black/5 text-[#1A1A1A]/80 hover:border-black hover:text-black hover:bg-[#F5F5F0] px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap shadow-sm">
                          <MessageSquare className="w-4 h-4" /> Message
                        </button>
                      </div>
                      {idx < members.length - 1 && (
                        <div className="my-2 h-px bg-black/5"></div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
