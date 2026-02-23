import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMyConversations, getMyOrganization } from '../api/axios';

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
    <div className="min-h-screen bg-[#1C1D25] text-white px-4 py-10">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-3">Messages</h1>
          <p className="text-gray-400">Connect with your team members</p>
        </div>

        {/* TEAM MEMBERS CARD - CENTERED */}
        <div className="bg-[#2B2D38] rounded-2xl border border-white/10 shadow-lg overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 border-b border-white/10 bg-[#242631]">
            <h2 className="text-xl font-bold text-[#7FE6C5] text-center">👥 Your Team</h2>
            <p className="text-sm text-gray-400 mt-1 text-center">{members.length} members available</p>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="text-gray-400 animate-pulse text-center">
                  <p className="mb-2">⏳ Loading team members...</p>
                </div>
              </div>
            ) : members.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-6xl mb-4">👥</div>
                <p className="text-gray-400 mb-2">No team members found</p>
                <p className="text-sm text-gray-500">You'll be able to message members once they join your organization</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                {members.map((member, idx) => (
                  <div key={member._id}>
                    <div
                      onClick={() => navigate(`/dm/${member._id}`)}
                      className="flex items-center gap-4 p-4 bg-[#1C1D25] hover:bg-[#242631] rounded-xl border border-white/5 hover:border-[#7FE6C5]/30 transition-all duration-200 group cursor-pointer"
                    >
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#B9A6FF] to-[#F28B82] flex items-center justify-center font-bold text-base text-white flex-shrink-0 group-hover:scale-110 transition">
                        {member.fullName?.[0] || '?'}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-base group-hover:text-[#7FE6C5] transition">
                          {member.fullName}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {member.department || 'Team Member'}
                        </p>
                      </div>

                      {/* Chat Button */}
                      <button className="text-sm bg-[#7FE6C5]/15 text-[#7FE6C5] hover:bg-[#7FE6C5]/30 px-4 py-2 rounded-lg font-semibold transition whitespace-nowrap">
                        💬 Message
                      </button>
                    </div>
                    {idx < members.length - 1 && (
                      <div className="my-2 h-px bg-white/5"></div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
