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
  const [filterOpen, setFilterOpen] = useState(false);
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

  const sortOptions = [
    { label: "Latest", value: "latest" },
    { label: "Oldest", value: "oldest" },
    { label: "Most Liked", value: "upvotes" },
  ];

  return (
    <div className="flex-1 w-full text-[#1A1A1A] relative bg-[#F5F5F0] min-h-screen">
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-[radial-gradient(circle_at_top_right,rgba(140,120,81,0.03),transparent_40%)] pointer-events-none z-0" />
      <div className="w-full flex justify-center relative z-10">
        <div className="w-[90%] grid grid-cols-1 lg:grid-cols-12 gap-10 px-6 py-8">

          {/* LEFT SIDEBAR (3 cols) */}
          <div className="lg:col-span-3 space-y-6 h-fit sticky top-28">
            <div className="relative bg-white border border-black/5 rounded-2xl shadow-sm p-5 overflow-hidden">
              <div className="absolute left-0 top-0 h-full w-[4px] bg-[#8C7851] shadow-sm" />

              <h3 className="text-lg font-bold mb-4 pl-3 text-charcoal">
                Content Type
              </h3>

              <div className="space-y-2 pl-3">
                {contentTypes.map((type, index) => {
                  const active = contentType === type.value;

                  return (
                    <button
                      key={type.value}
                      onClick={() => setContentType(type.value)}
                      className="w-full text-left px-4 py-2 rounded-xl text-sm font-medium transition"
                      style={{
                        backgroundColor: active ? "#EBE8E0" : "rgba(0,0,0,0.02)",
                        color: active ? "black" : "#4A4A4A",
                        border: "1px solid rgba(0,0,0,0.05)",
                      }}
                    >
                      {type.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-md border border-black/5 rounded-2xl shadow-sm p-5 overflow-hidden relative">
              <div className="absolute left-0 top-0 h-full w-[4px] bg-[#8C7851] shadow-sm" />
              <h3 className="text-lg font-semibold mb-4 pl-3 text-[#1A1A1A]">Trending</h3>

              {trendingLoading ? (
                <div className="text-sm text-[#4A4A4A] font-medium">Loading...</div>
              ) : trendingError ? (
                <div className="text-sm text-red-500 font-medium">{trendingError}</div>
              ) : trending.length === 0 ? (
                <div className="text-sm text-[#4A4A4A] font-medium">No trending posts</div>
              ) : (
                <ol className="space-y-3">
                  {trending.map((t, idx) => (
                    <li
                      key={t._id}
                      onClick={() => navigate(`/posts/${t._id}`)}
                      className="flex gap-3 items-start cursor-pointer hover:bg-black/5 p-2 rounded-lg transition-colors group"
                    >
                      <div className="w-6 text-sm font-bold text-charcoal">{idx + 1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-[#1A1A1A] truncate group-hover:text-[#8C7851] transition-colors">{t.title}</div>
                        <div className="text-xs text-[#4A4A4A] truncate">{t.summary || ''}</div>
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
              <h1 className="text-4xl font-bold tracking-tight text-[#1A1A1A]">
                Knowledge Hub
              </h1>
              <p className="text-[#4A4A4A] mt-2 font-medium">
                Search reflections, podcasts, and internal learnings across your org.
              </p>
            </div>

            <div className="flex w-full flex-col lg:flex-row items-center gap-4 h-auto lg:h-[60px]">
              {/* SEARCH BAR */}
              <div className="bg-white rounded-full border border-black/10 shadow-sm flex items-center w-full lg:w-3/4 relative h-[60px] lg:h-full">
                <input
                  type="text"
                  className="w-full h-full bg-transparent border-none pl-6 pr-14 focus:outline-none focus:ring-0 text-[#1A1A1A] placeholder:text-[#4A4A4A] rounded-full"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); doSearchNow(); } }}
                  onFocus={() => triggerScreenGlow()}
                />
                <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none text-[#8C7851]">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* FILTER BUTTON */}
              <div className="relative w-full lg:w-1/4 h-[60px] lg:h-full">
                <button
                  onClick={() => setFilterOpen(!filterOpen)}
                  className="w-full h-full bg-white rounded-full border border-black/10 shadow-sm flex items-center justify-between px-6 font-semibold text-[#1A1A1A] hover:bg-[#F5F5F0] transition"
                >
                  <span className="text-[#1A1A1A] text-base">Filter</span>
                  <svg className="w-5 h-5 text-[#8C7851]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {filterOpen && (
                  <div className="absolute top-full left-0 mt-2 w-full bg-white border border-black/10 rounded-2xl shadow-lg z-50 overflow-hidden">
                    <div className="p-2 space-y-1">
                      {sortOptions.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => {
                            setSortBy(opt.value);
                            setFilterOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition ${sortBy === opt.value
                            ? "bg-[#EBE8E0] text-[#1A1A1A]"
                            : "text-[#4A4A4A] hover:bg-black/5 hover:text-[#1A1A1A]"
                            }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 w-full flex flex-col">
              <div className="w-full flex justify-between items-center mb-4">
                {!loading && results.length > 0 && (
                  <p className="text-[#4A4A4A] text-sm font-medium">
                    Showing{" "}
                    <span className="text-[#1A1A1A] font-bold">
                      {results.length}
                    </span>{" "}
                    results
                  </p>
                )}
              </div>

              {loading && (
                <div className="text-center py-12 w-full">
                  <p className="text-[#4A4A4A] italic font-medium animate-pulse">
                    Searching knowledge vault...
                  </p>
                </div>
              )}

              {error && (
                <div className="bg-red-100 border border-red-200 text-red-500 px-4 py-3 rounded-xl shadow-sm w-full">
                  {error}
                </div>
              )}

              {!loading && results.length === 0 && !error && (
                <div className="bg-white/80 backdrop-blur-md border border-black/5 rounded-2xl shadow-sm p-16 text-center w-full">
                  <p className="text-[#4A4A4A] text-lg italic font-medium">
                    No results found. Try adjusting filters.
                  </p>
                </div>
              )}

              {!loading && results.length > 0 && (
                <div className="space-y-5 w-full">
                  {results.map((post) => (
                    <PostCard key={post._id || post.id} post={post} />
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
