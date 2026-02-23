import { useState, useEffect } from "react";
import { triggerScreenGlow } from "../utils/screenGlow";
import Navbar from "../components/layout/Navbar";
import PostCard from "../components/layout/PostCard";
import { searchPosts, getTrendingPosts } from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function KnowledgeHub() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [results, setResults] = useState([]);
  const [contentType, setContentType] = useState("all");
  const [sortBy, setSortBy] = useState("latest");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [trending, setTrending] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [trendingError, setTrendingError] = useState("");
  const navigate = useNavigate();

  // Using centralized screen glow (see src/utils/screenGlow.js)

  const doSearchNow = async () => {
    triggerScreenGlow();

    setLoading(true);
    setError("");
    try {
      const response = await searchPosts(
        searchQuery,
        selectedTags,
        contentType !== "all" ? contentType : "",
        sortBy
      );
      setResults(Array.isArray(response) ? response : response.results || []);
    } catch (err) {
      console.error('Immediate search failed', err);
      setError('Failed to search posts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => () => { }, []);

  useEffect(() => {
    let mounted = true;
    const fetchTrending = async () => {
      try {
        setTrendingLoading(true);
        setTrendingError("");
        const list = await getTrendingPosts(3, "10days");
        if (mounted) setTrending(list || []);
      } catch (err) {
        console.error('Failed to fetch trending posts', err);
        if (mounted) setTrendingError('Failed to load trending posts');
      } finally {
        if (mounted) setTrendingLoading(false);
      }
    };

    fetchTrending();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        const response = await searchPosts(
          searchQuery,
          selectedTags,
          contentType !== "all" ? contentType : "",
          sortBy
        );

        setResults(
          Array.isArray(response) ? response : response.results || []
        );
      } catch (err) {
        console.error("Error searching posts:", err);
        setError("Failed to search posts. Please try again.");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedTags, contentType, sortBy]);


  const contentTypes = [
    { label: "All", value: "all" },
    { label: "Reflection", value: "reflection" },
    { label: "Anonymous", value: "anonymous" },
  ];

  return (
    <div className="min-h-screen bg-[#1C1D25] text-white">
      <div className="w-full flex justify-center">
        <div className="w-[90%] grid grid-cols-1 lg:grid-cols-12 gap-10 px-6 py-8">

          {/* LEFT SIDEBAR (3 cols) */}
          <div className="lg:col-span-3 space-y-6 h-fit sticky top-24">
            <div className="relative bg-[#242631] rounded-2xl p-5 border border-white/10 shadow-md overflow-hidden">
              <div className="absolute left-0 top-0 h-full w-[6px] bg-[#F5C76A]" />

              <h3 className="text-lg font-bold mb-4 pl-3">
                Content Type
              </h3>

              <div className="space-y-2 pl-3">
                {contentTypes.map((type, index) => {
                  const pastel =
                    ["#4BA9FF", "#B9A6FF", "#F28B82", "#7FE6C5"][
                    index % 4
                    ];

                  const active = contentType === type.value;

                  return (
                    <button
                      key={type.value}
                      onClick={() => setContentType(type.value)}
                      className="w-full text-left px-4 py-2 rounded-xl text-sm font-medium transition"
                      style={{
                        backgroundColor: active ? pastel : "#1C1D25",
                        color: active ? "black" : "white",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      {type.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="bg-[#242631] rounded-2xl p-5 border border-white/10 shadow-md">
              <h3 className="text-lg font-semibold mb-4">Trending</h3>

              {trendingLoading ? (
                <div className="text-sm text-gray-400">Loading...</div>
              ) : trendingError ? (
                <div className="text-sm text-red-400">{trendingError}</div>
              ) : trending.length === 0 ? (
                <div className="text-sm text-gray-400">No trending posts</div>
              ) : (
                <ol className="space-y-3">
                  {trending.map((t, idx) => (
                    <li
                      key={t._id}
                      onClick={() => navigate(`/posts/${t._id}`)}
                      className="flex gap-3 items-start cursor-pointer hover:bg-[#2A2C38] p-2 rounded"
                    >
                      <div className="w-6 text-sm font-semibold text-gray-400">{idx + 1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white truncate">{t.title}</div>
                        <div className="text-xs text-gray-400 truncate">{t.summary || ''}</div>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>

          {/* CENTER CONTENT (9 cols) */}
          <div className="lg:col-span-9 space-y-6">
            <div>
              <h1 className="text-4xl font-bold">
                Knowledge Hub
              </h1>
              <p className="text-gray-400 mt-2">
                Search reflections, podcasts, and internal learnings across your org.
              </p>
            </div>

            <div className="flex gap-4 items-stretch">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search insights..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); doSearchNow(); } }}
                  onFocus={() => triggerScreenGlow()}
                  className="search-input w-full px-5 pr-14 py-3 bg-[#242631] border-2 border-white/20 rounded-xl text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#4BA9FF] focus:border-[#4BA9FF]"
                />

                <button
                  type="button"
                  aria-label="Search"
                  onClick={doSearchNow}
                  className="absolute right-2 top-[48%] transform -translate-y-1/2 text-gray-400 hover:text-white focus:outline-none transition flex items-center justify-center bg-[#4BA9FF] w-9 h-9 rounded-lg text-black hover:bg-[#3A99EF]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              <div className="relative min-w-[140px]">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-3 bg-[#242631] border-2 border-white/20 rounded-xl text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#4BA9FF] focus:border-[#4BA9FF] appearance-none cursor-pointer"
                >
                  <option value="latest">Latest</option>
                  <option value="oldest">Oldest</option>
                  <option value="upvotes">Most Liked</option>
                </select>
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {!loading && results.length > 0 && (
              <p className="text-gray-400 text-sm">
                Showing{" "}
                <span className="text-white font-semibold">
                  {results.length}
                </span>{" "}
                results
              </p>
            )}

            {loading && (
              <div className="text-center py-12">
                <p className="text-gray-400 italic">
                  Searching knowledge vault...
                </p>
              </div>
            )}

            {error && (
              <div className="bg-[#F28B82]/20 border border-[#F28B82] text-[#F28B82] px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            {!loading && results.length === 0 && !error && (
              <div className="bg-[#242631] border border-white/10 rounded-2xl p-10 text-center">
                <p className="text-gray-400 italic">
                  No results found. Try adjusting filters
                </p>
              </div>
            )}

            {!loading && results.length > 0 && (
              <div className="space-y-5">
                {results.map((post) => (
                  <PostCard key={post._id || post.id} post={post} />
                ))}
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR removed - trending moved into left column */}
        </div>
      </div>
    </div>
  );
}
