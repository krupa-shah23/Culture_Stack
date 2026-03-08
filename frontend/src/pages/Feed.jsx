import { useState, useEffect } from "react";
import PostCard from "../components/layout/PostCard";
import PodcastCard from "../components/layout/PodcastCard";
import api, { getTrendingPosts, searchPosts } from "../api/axios";
import { Link, useNavigate } from "react-router-dom";
import PostModal from "../components/layout/PostModal";
import PodcastModal from "../components/layout/PodcastModal";

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedPodcast, setSelectedPodcast] = useState(null);

  const navigate = useNavigate();

  // Filters from Knowledge Hub
  const [contentType, setContentType] = useState("all");
  const [sortBy, setSortBy] = useState("latest");

  // Trending state
  const [trending, setTrending] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [trendingError, setTrendingError] = useState("");

  // Fetch Posts with Filters
  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError("");

      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "null");

      if (!userInfo?.token) {
        throw new Error("Please login again.");
      }

      let fetchedPosts = [];
      let fetchedPodcasts = [];

      if (contentType !== "podcast") {
        const response = await searchPosts(
          "", // no text query
          [], // no tags
          contentType !== "all" ? contentType : "",
          sortBy
        );
        fetchedPosts = Array.isArray(response) ? response : response.results || [];
      }

      if (contentType === "all" || contentType === "podcast") {
        const response = await api.get("/podcasts");
        fetchedPodcasts = Array.isArray(response.data) ? response.data : [];
        fetchedPodcasts = fetchedPodcasts.map(p => ({ ...p, isPodcast: true }));
      }

      // Combine
      let combined = [...fetchedPosts, ...fetchedPodcasts];

      // Sort over combined
      if (sortBy === "latest") {
        combined.sort((a, b) => new Date(b.createdAt || b.createdAt) - new Date(a.createdAt || a.createdAt));
      } else if (sortBy === "oldest") {
        combined.sort((a, b) => new Date(a.createdAt || a.createdAt) - new Date(b.createdAt || b.createdAt));
      } else if (sortBy === "upvotes") {
        const getScore = (item) => (item.upvoteCount || 0) - (item.downvoteCount || 0);
        combined.sort((a, b) => getScore(b) - getScore(a));
      }

      setPosts(combined);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [contentType, sortBy]);

  useEffect(() => {
    let mounted = true;
    const fetchTrending = async () => {
      try {
        setTrendingLoading(true);
        setTrendingError("");
        const list = await getTrendingPosts(3, "10days");
        if (mounted) setTrending(list || []);
      } catch (err) {
        if (mounted) setTrendingError('Failed to load trending posts');
      } finally {
        if (mounted) setTrendingLoading(false);
      }
    };
    fetchTrending();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="flex-1 w-full pb-12 relative flex flex-col pt-6 md:pt-10">
      {/* Antigravity Mesh Background */}
      <div className="bg-mesh-gradient fixed inset-0 z-[-1]" />

      {/* MASTER CONTAINER (Full width instead of boxed) */}
      <div className="w-full px-6 md:px-12 lg:px-20 relative z-10 flex flex-col md:flex-row gap-8">

        {/* ================= LEFT FEED ================= */}
        <div className="flex-[3] space-y-6">

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

          {/* No Content */}
          {!loading && !error && posts.length === 0 && (
            <p className="text-charcoal/80 text-center">
              No content found. Start sharing your reflections or podcasts
            </p>
          )}

          {/* Posts & Podcasts */}
          <div className="flex flex-col gap-6">
            {!loading &&
              posts.map((item) => (
                <div key={`${item.isPodcast ? 'podcast' : 'post'}-${item._id}`} className="cursor-pointer">
                  {item.isPodcast ? (
                    <PodcastCard
                      podcast={item}
                      onOpenModal={(podcast) => setSelectedPodcast(podcast)}
                    />
                  ) : (
                    <PostCard
                      post={item}
                      onOpenModal={(post) => setSelectedPost(post)}
                    />
                  )}
                </div>
              ))}
          </div>
        </div>

        {/* ================= RIGHT SIDEBAR ================= */}
        <div className="flex-[1] space-y-10 pl-0">

          {/* Trending Discussions */}
          <div className="bg-[#F5F5F0] border border-black/5 rounded-2xl shadow-sm p-5 overflow-hidden relative">
            <div className="absolute left-0 top-0 h-full w-[5px] bg-[#8C7851] shadow-sm" />
            <h3 className="text-lg font-bold mb-4 pl-3 text-[#1A1A1A]">Trending Discussions</h3>

            {trendingLoading ? (
              <div className="text-sm text-charcoal/80 font-medium pl-3">Loading...</div>
            ) : trendingError ? (
              <div className="text-sm text-red-500 font-medium pl-3">{trendingError}</div>
            ) : trending.length === 0 ? (
              <div className="text-sm text-charcoal/80 font-medium pl-3">No trending posts</div>
            ) : (
              <ol className="space-y-3 pl-3">
                {trending.map((t, idx) => (
                  <li
                    key={t._id}
                    onClick={() => navigate(`/posts/${t._id}`)}
                    className="flex gap-3 items-start cursor-pointer hover:bg-black/5 p-2 rounded-lg transition-colors group"
                  >
                    <div className="w-6 text-sm font-bold text-charcoal">{idx + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-charcoal truncate group-hover:text-charcoal transition-colors">{t.title || 'Untitled Post'}</div>
                      <div className="text-xs text-charcoal/80 truncate">{(t.summary || t.content || '').substring(0, 60)}...</div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {/* AI Thought Starter */}
          <div className="bg-[#F5F5F0] border border-black/5 rounded-2xl shadow-sm p-5 overflow-hidden relative group w-full">
            <div className="absolute left-0 top-0 h-full w-[5px] bg-[#8C7851] shadow-sm" />
            <div className="pl-3">
              <h2 className="font-bold text-[#1A1A1A] mb-3">AI Thought Starter</h2>
              <p className="text-sm text-charcoal/80 mb-6">
                What's one thing your team should stop doing immediately?
              </p>
              <Link to="/write" className="flex items-center justify-center w-full bg-[#1A1A1A] text-white font-bold py-3 rounded-full shadow-sm hover:bg-black transition">
                Write Reflection
              </Link>
            </div>
          </div>

          {/* CONTENT TYPE FILTER */}
          <div className="relative bg-[#F5F5F0] border border-black/5 rounded-2xl shadow-sm p-5 overflow-hidden">
            <div className="absolute left-0 top-0 h-full w-[5px] bg-[#8C7851] shadow-sm" />
            <h3 className="text-lg font-bold mb-4 pl-3 text-[#1A1A1A]">
              Content Type
            </h3>
            <div className="space-y-2 pl-3">
              {[
                { label: "All", value: "all" },
                { label: "Reflection", value: "reflection" },
                { label: "Anonymous", value: "anonymous" },
                { label: "Podcast", value: "podcast" },
              ].map((type) => {
                const active = contentType === type.value;
                return (
                  <button
                    key={type.value}
                    onClick={() => setContentType(type.value)}
                    className="w-full text-left px-4 py-2 rounded-xl text-sm font-medium transition"
                    style={{
                      backgroundColor: active ? "#1A1A1A" : "white",
                      color: active ? "white" : "#1A1A1A",
                      border: "1px solid rgba(0,0,0,0.05)",
                    }}
                  >
                    {type.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SORT BY FILTER */}
          <div className="relative bg-[#F5F5F0] border border-black/5 rounded-2xl shadow-sm p-5 overflow-hidden">
            <div className="absolute left-0 top-0 h-full w-[5px] bg-[#8C7851] shadow-sm" />
            <div className="flex items-center justify-between mb-4 pl-3">
              <h3 className="text-lg font-bold text-[#1A1A1A]">Sort By</h3>
              <svg className="w-5 h-5 text-charcoal/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <div className="space-y-2 pl-3">
              {[
                { label: "Latest", value: "latest" },
                { label: "Oldest", value: "oldest" },
                { label: "Most Liked", value: "upvotes" },
              ].map((opt) => {
                const active = sortBy === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setSortBy(opt.value)}
                    className="w-full text-left px-4 py-2 rounded-xl text-sm font-medium transition"
                    style={{
                      backgroundColor: active ? "#1A1A1A" : "white",
                      color: active ? "white" : "#1A1A1A",
                      border: "1px solid rgba(0,0,0,0.05)",
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {selectedPost && (
        <PostModal post={selectedPost} onClose={() => setSelectedPost(null)} />
      )}
      {selectedPodcast && (
        <PodcastModal podcast={selectedPodcast} onClose={() => setSelectedPodcast(null)} />
      )}
    </div>
  );
}
