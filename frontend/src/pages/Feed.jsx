import { useState, useEffect } from "react";
import PostCard from "../components/layout/PostCard";
import api, { getTrendingPosts } from "../api/axios";
import { Link } from "react-router-dom";

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch Posts
  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError("");

      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "null");

      if (!userInfo?.token) {
        throw new Error("Please login again.");
      }

      const response = await api.get("/posts");

      if (!Array.isArray(response.data)) {
        throw new Error("Invalid posts format from backend.");
      }

      setPosts(response.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Trending Posts (server-side ranking)
  const [trendingPosts, setTrendingPosts] = useState([]);

  const fetchTrending = async () => {
    try {
      const res = await getTrendingPosts(3);
      setTrendingPosts(res || []);
    } catch (err) {
      // fallback: compute client-side from net votes
      setTrendingPosts([
        ...posts
      ].sort((a, b) => ((b.upvoteCount || 0) - (b.downvoteCount || 0)) - ((a.upvoteCount || 0) - (a.downvoteCount || 0))).slice(0, 3));
    }
  };

  useEffect(() => { fetchTrending(); }, [posts]);

  return (
    <div className="flex-1 w-full px-4 md:px-6 pb-12 relative flex flex-col h-[calc(100vh-6rem)]">
      {/* Antigravity Mesh Background */}
      <div className="bg-mesh-gradient" />

      {/* MASTER CONTAINER */}
      <div className="w-full max-w-6xl mx-auto flex-1 rounded-3xl border border-black/5 bg-white/40 backdrop-blur-xl shadow-sm overflow-y-auto no-scrollbar p-6 md:p-10 relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">

        {/* ================= LEFT FEED ================= */}
        <div className="md:col-span-1 lg:col-span-2 space-y-6">

          {/* Loading */}
          {loading && (
            <p className="text-charcoal/80 text-center">Loading posts...</p>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-100 border border-red-200 text-red-500 p-4 rounded-xl shadow-sm">
              <p>{error}</p>
              <button
                onClick={fetchPosts}
                className="mt-3 px-4 py-2 bg-red-500 text-white rounded-lg shadow-sm font-bold hover:bg-red-600 transition"
              >
                Retry
              </button>
            </div>
          )}

          {/* No Posts */}
          {!loading && !error && posts.length === 0 && (
            <p className="text-charcoal/80 text-center">
              No posts yet. Start sharing reflections
            </p>
          )}

          {/* Posts */}
          {!loading &&
            posts.map((post) => (
              <PostCard key={post._id} post={post} />
            ))}
        </div>

        {/* ================= RIGHT SIDEBAR ================= */}
        <div className="space-y-10 pl-0 lg:pl-6">

          {/* Trending Discussions */}
          <div className="relative bg-[#F5F5F0] border border-black/5 rounded-2xl shadow-sm p-6 overflow-hidden">

            {/* Muted Gold Strip */}
            <div className="absolute left-0 top-0 h-full w-[5px] bg-[#8C7851] shadow-sm" />

            <h2 className="font-bold text-charcoal mb-3 pl-3">
              Trending Discussions
            </h2>

            <ul className="text-sm text-charcoal/80 space-y-3 pl-5">
              {trendingPosts && trendingPosts.length > 0 ? (
                trendingPosts.map((post) => (
                  <li key={post._id} className="truncate">
                    {post.summary ||
                      (post.content || "").split(" ").slice(0, 6).join(" ") + "..."}
                  </li>
                ))
              ) : (
                <li>No trending discussions yet.</li>
              )}
            </ul>
          </div>

          {/* AI Thought Starter */}
          <div className="relative bg-[#F5F5F0] rounded-2xl p-6 border border-black/5 shadow-sm">
            <div className="absolute left-0 top-0 h-full w-[5px] bg-[#8C7851]" />
            <h2 className="font-bold text-[#1A1A1A] mb-3 pl-4">AI Thought Starter</h2>

            <p className="text-sm text-charcoal/80 mb-6 pl-4">
              What's one thing your team should stop doing immediately?
            </p>

            <Link to="/write" className="flex items-center justify-center w-full bg-[#1A1A1A] text-white font-bold py-3 rounded-full shadow-sm hover:bg-black transition">
              Write Reflection
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
