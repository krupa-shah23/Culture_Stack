import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getUserProfile, getUserPosts } from "../api/axios";
import ProfileSidebar from "../components/layout/ProfileSidebar";

export default function ProfilePosts() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [posts, setPosts] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [profileData, postsData] = await Promise.all([
                    getUserProfile(id),
                    getUserPosts(id)
                ]);
                setProfile(profileData);
                setPosts(postsData);
            } catch (err) {
                console.error("Failed to load profile posts", err);
                setError("Failed to load posts.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (loading) {
        return (
            <div className="flex-1 w-full pb-12 relative flex flex-col pt-6 md:pt-10">
                <div className="bg-mesh-gradient fixed inset-0 z-[-1]" />
                <div className="w-full px-6 md:px-12 lg:px-20 relative z-10 flex flex-col md:flex-row gap-8">
                    <div className="flex-[1] space-y-6">
                        <ProfileSidebar activeTab="posts" />
                    </div>
                    <div className="flex-[3] space-y-6">
                        <div className="bg-white border border-black/5 rounded-2xl shadow-sm p-6 lg:p-8 min-h-[50vh] flex items-center justify-center">
                            <div className="text-[#1A1A1A]/80 font-medium animate-pulse">Loading posts...</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 w-full pb-12 relative flex flex-col pt-6 md:pt-10">
            <div className="bg-mesh-gradient fixed inset-0 z-[-1]" />

            <div className="w-full px-6 md:px-12 lg:px-20 relative z-10 flex flex-col md:flex-row gap-8">
                {/* ================= LEFT SIDEBAR ================= */}
                <div className="flex-[1] space-y-6">
                    <ProfileSidebar activeTab="posts" />
                </div>

                {/* ================= RIGHT MAIN CONTENT ================= */}
                <div className="flex-[3] space-y-6">
                    <div className="bg-white border border-black/5 rounded-2xl shadow-sm p-6 lg:p-8 min-h-[50vh]">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-[#1A1A1A]">Posts & Reflections</h2>
                            <span className="text-sm text-charcoal/80 font-medium">{posts.length} total</span>
                        </div>

                        {error ? (
                            <div className="text-red-500 font-medium text-center py-10">{error}</div>
                        ) : posts.length === 0 ? (
                            <div className="text-[#1A1A1A]/80 font-medium text-center py-10">
                                No posts found.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {posts.map((post) => {
                                    const initial = profile?.user?.fullName ? profile.user.fullName[0].toUpperCase() : "?";
                                    const name = profile?.user?.fullName || "Unknown";
                                    const timeDisplay = new Date(post.createdAt).toLocaleString();

                                    return (
                                        <div
                                            key={post._id}
                                            onClick={() => navigate(`/posts/${post._id}`)}
                                            className="cursor-pointer relative bg-white rounded-2xl p-5 border border-gray-100 shadow-sm overflow-hidden hover:scale-[1.01] hover:shadow-md transition-all duration-300 group"
                                        >
                                            <div className="flex items-start gap-4">
                                                {/* Avatar */}
                                                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[#E5E5E5] text-[#1A1A1A] text-lg font-bold border border-black/5 shadow-sm shrink-0 mt-1">
                                                    {initial}
                                                </div>

                                                {/* Text */}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-[#1A1A1A] font-bold text-base md:text-lg mb-1 group-hover:text-charcoal transition-colors">
                                                        {post.title || "Untitled"}
                                                    </h3>
                                                    <p className="text-[#1A1A1A]/80 font-medium text-sm md:text-sm leading-relaxed mb-3 line-clamp-2">
                                                        {post.content}
                                                    </p>
                                                    <div className="flex items-center gap-3 text-[#1A1A1A]/70 text-xs font-medium">
                                                        <span>{name}</span>
                                                        <span>•</span>
                                                        <span>{timeDisplay}</span>
                                                        <span>•</span>
                                                        <span className="flex items-center gap-1">
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
                                                            {(post.upvoteCount || 0) - (post.downvoteCount || 0)}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                                                            {post.comments?.length || 0}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
