import { useState, useEffect } from "react";
import { triggerScreenGlow } from "../utils/screenGlow";
import Navbar from "../components/layout/Navbar";
import { searchPosts, getTrendingPosts } from "../api/axios";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";

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
    <div className="flex-1 w-full px-4 md:px-6 pb-12 relative flex flex-col h-[calc(100vh-6rem)] relative bg-[#F5F5F0]">
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-[radial-gradient(circle_at_top_right,rgba(140,120,81,0.03),transparent_40%)] pointer-events-none z-0" />

      {/* MASTER CONTAINER */}
      <div className="w-full max-w-6xl mx-auto flex-1 rounded-3xl border border-black/5 bg-white/40 backdrop-blur-xl shadow-sm overflow-y-auto no-scrollbar p-6 md:p-10 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* LEFT SIDEBAR (3 cols) */}
        <div className="lg:col-span-3 space-y-6 h-fit sticky top-6">
          <div className="relative bg-[#F5F5F0] border border-black/5 rounded-2xl shadow-sm p-5 overflow-hidden">
            <div className="absolute left-0 top-0 h-full w-[5px] bg-[#8C7851] shadow-sm" />

            <h3 className="text-lg font-bold mb-4 pl-3 text-[#1A1A1A]">
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
          <div className="bg-[#F5F5F0] backdrop-blur-md border border-black/5 rounded-2xl shadow-sm p-5 overflow-hidden relative">
            <div className="absolute left-0 top-0 h-full w-[5px] bg-[#8C7851] shadow-sm" />
            <h3 className="text-lg font-semibold mb-4 pl-3 text-[#1A1A1A]">Trending</h3>

            {trendingLoading ? (
              <div className="text-sm text-charcoal/80 font-medium">Loading...</div>
            ) : trendingError ? (
              <div className="text-sm text-red-500 font-medium">{trendingError}</div>
            ) : trending.length === 0 ? (
              <div className="text-sm text-charcoal/80 font-medium">No trending posts</div>
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
                      <div className="text-sm font-semibold text-charcoal truncate group-hover:text-earth-green transition-colors">{t.title}</div>
                      <div className="text-xs text-charcoal/80 truncate">{t.summary || ''}</div>
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
            <h1 className="text-4xl font-bold tracking-tight text-charcoal">
              Knowledge Hub
            </h1>
            <p className="text-charcoal/80 mt-2 font-medium">
              Search reflections, podcasts, and internal learnings across your org.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row w-full items-center gap-4 min-h-[60px]">
            {/* SEARCH BAR */}
            <div className="bg-white rounded-full border border-black/10 shadow-sm flex items-center flex-1 relative h-[60px]">
              <input
                type="text"
                className="w-full h-full bg-transparent border-none pl-6 pr-14 focus:outline-none focus:ring-0 text-[#1A1A1A] placeholder:text-black/50 rounded-full"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); doSearchNow(); } }}
                onFocus={() => triggerScreenGlow()}
              />
              <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none text-[#1A1A1A]">
                <Search className="w-5 h-5" />
              </div>
            </div>

            {/* FILTER BUTTON */}
            <div className="relative w-full sm:w-[200px] h-[60px]">
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className="w-full h-full bg-white rounded-full border border-black/10 shadow-sm flex items-center justify-between px-6 font-semibold text-[#1A1A1A] hover:bg-[#F5F5F0] transition"
              >
                <span className="text-[#1A1A1A] text-base">Filter</span>
                <svg className="w-5 h-5 text-earth-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                          ? "bg-earth-surface text-charcoal"
                          : "text-charcoal/80 hover:bg-black/5 hover:text-charcoal"
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
                <p className="text-charcoal/80 text-sm font-medium">
                  Showing{" "}
                  <span className="text-charcoal font-bold">
                    {results.length}
                  </span>{" "}
                  results
                </p>
              )}
            </div>

            {loading && (
              <div className="text-center py-12 w-full">
                <p className="text-charcoal/80 italic font-medium animate-pulse">
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
              <div className="bg-white/80 backdrop-blur-md border border-black/5 rounded-2xl shadow-sm p-16 text-center w-full max-w-full">
                <p className="text-charcoal/80 text-lg italic font-medium">
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
  );
}
