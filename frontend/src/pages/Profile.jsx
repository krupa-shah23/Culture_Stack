import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getUserProfile, getUserPosts } from "../api/axios";
import api from "../api/axios";
import PostCard from "../components/layout/PostCard";
import PodcastCard from "../components/layout/PodcastCard";

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("posts"); // 'posts' | 'podcasts' | 'comments' | 'reactions'
  const [selectedStat, setSelectedStat] = useState(null); // For dropdown panel: 'posts' | 'podcasts' | 'comments' | 'reactions' | null
  const [isExpanded, setIsExpanded] = useState(false); // For dropdown expansion
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [podcasts, setPodcasts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [podcastsLoading, setPodcastsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetcher with local fallback (so page still renders if server is unreachable)
  const currentUserInfo =
    typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('userInfo') || 'null')
      : null;

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUserProfile(id);
      setProfile(data);
    } catch (err) {
      console.error('Failed to load profile', err);
      const serverMessage = err?.response?.data?.message || err?.message || 'Failed to load profile';
      setError(`Server Error: ${serverMessage}`);

      // If the requested profile is the currently-logged-in user, show a local fallback
      if (currentUserInfo && currentUserInfo._id === id) {
        const fallback = {
          user: {
            _id: currentUserInfo._id,
            fullName: currentUserInfo.fullName || 'You',
            department: currentUserInfo.department || '',
            createdAt: currentUserInfo.createdAt || new Date().toISOString(),
            defaultAnonymityLevel: 2,
            visibility: 'organization',
            allowAiFeedback: true,
            allowAnonymousComments: false,
          },
          stats: { postsCount: 0, podcastsCount: 0, commentsCount: 0, reactionsCount: 0 },
          badges: [],
          reflectionJourney: { joinedOrg: currentUserInfo.createdAt || new Date().toISOString(), firstReflection: null, topPostTitle: null, topPodcastTitle: null, aiTheme: null },
          aiPersonalitySummary: null,
        };
        setProfile(fallback);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    if (userPosts.length > 0) return; // avoid refetch
    setPostsLoading(true);
    try {
      const posts = await getUserPosts(id);
      setUserPosts(posts);
    } catch (err) {
      console.error("Failed to fetch user posts", err);
    } finally {
      setPostsLoading(false);
    }
  };

  const fetchPodcasts = async () => {
    if (podcasts.length > 0) return; // avoid refetch
    setPodcastsLoading(true);
    try {
      const res = await api.get(`/podcasts/user/${id}`);
      setPodcasts(res.data);
    } catch (err) {
      console.error("Failed to fetch user podcasts", err);
      setPodcasts([]);
    } finally {
      setPodcastsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Fetch content based on active tab
  useEffect(() => {
    if (activeTab === 'posts') {
      fetchPosts();
    } else if (activeTab === 'podcasts') {
      fetchPodcasts();
    }
  }, [activeTab]);

  // Fetch data when dropdown stat is selected
  useEffect(() => {
    if (selectedStat === 'podcasts') {
      fetchPodcasts();
    }
  }, [selectedStat]);

  const retry = () => {
    fetchProfile();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1C1D25] text-white px-6 py-10">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="h-56 bg-[#242631] rounded-2xl animate-pulse" />
          <div className="h-40 bg-[#242631] rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#1C1D25] text-white px-6 py-10">
        <div className="max-w-4xl mx-auto text-center text-gray-300">
          <h2 className="text-2xl font-semibold mb-4">Profile unavailable</h2>
          <p className="mb-6">{error || 'This profile could not be loaded.'}</p>
          <div className="flex justify-center gap-3">
            <button onClick={retry} className="px-4 py-2 bg-[#4BA9FF] text-black rounded-full font-semibold">Retry</button>
            <button onClick={() => window.location.href = '/knowledge'} className="px-4 py-2 bg-[#1C1D25] border border-white/10 text-gray-300 rounded-full">Go back</button>
          </div>
        </div>
      </div>
    );
  }

  const { user, stats, badges, reflectionJourney, aiPersonalitySummary } = profile;
  const initial = user.fullName ? user.fullName.trim()[0].toUpperCase() : 'U';

  return (
    <div className="min-h-screen bg-[#1C1D25] text-white px-6 py-10">
      <div className="max-w-6xl mx-auto space-y-10">
        {error && (
          <div className="rounded-md bg-yellow-900/10 border border-yellow-500/10 px-4 py-2 text-sm text-yellow-300">
            Showing local profile — server error: {error}
          </div>
        )}

        {/* PROFILE HEADER */}
        <div className="relative bg-[#242631] rounded-2xl p-8 border border-white/5 shadow-md overflow-hidden">
          <div className="absolute left-0 top-0 h-full w-[6px] bg-[#4BA9FF] rounded-l-2xl" />

          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center pl-3">

            <div className="w-24 h-24 rounded-full bg-[#303241] flex items-center justify-center text-3xl font-bold ring-2 ring-[#4BA9FF]">
              {initial}
            </div>

            <div className="flex-1 space-y-2">
              <h1 className="text-3xl font-bold">{user.fullName}</h1>
              <p className="text-gray-400 text-sm">{user.department}</p>
              <p className="text-gray-300 italic">{reflectionJourney.aiTheme ? `"${reflectionJourney.aiTheme} - theme detected"` : 'No bio available.'}</p>

              <div className="flex flex-wrap gap-3 mt-3">
                {badges.map((b) => (
                  <span key={b} className="px-3 py-1 text-xs rounded-full bg-[#1C1D25] border border-white/10">{b}</span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <Stat
                label="Posts"
                value={stats.postsCount}
                isActive={selectedStat === 'posts'}
                onClick={() => {
                  if (selectedStat === 'posts') {
                    setIsExpanded(!isExpanded);
                  } else {
                    setSelectedStat('posts');
                    setIsExpanded(true);
                  }
                }}
              />
              <Stat
                label="Podcasts"
                value={stats.podcastsCount}
                isActive={selectedStat === 'podcasts'}
                onClick={() => {
                  if (selectedStat === 'podcasts') {
                    setIsExpanded(!isExpanded);
                  } else {
                    setSelectedStat('podcasts');
                    setIsExpanded(true);
                  }
                }}
              />
              <Stat
                label="Comments"
                value={stats.commentsCount}
                isActive={selectedStat === 'comments'}
                onClick={() => {
                  if (selectedStat === 'comments') {
                    setIsExpanded(!isExpanded);
                  } else {
                    setSelectedStat('comments');
                    setIsExpanded(true);
                  }
                }}
              />
              <Stat
                label="Reactions"
                value={stats.reactionsCount}
                isActive={selectedStat === 'reactions'}
                onClick={() => {
                  if (selectedStat === 'reactions') {
                    setIsExpanded(!isExpanded);
                  } else {
                    setSelectedStat('reactions');
                    setIsExpanded(true);
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* STATS FILTER DROPDOWN PANEL - Standalone Section Below Profile Card */}
        {selectedStat && (
          <StatsFilterDropdown
            selectedStat={selectedStat}
            setSelectedStat={setSelectedStat}
            isExpanded={isExpanded}
            setIsExpanded={setIsExpanded}
            stats={stats}
            userPosts={userPosts}
            podcasts={podcasts}
          />
        )}

        {/* CONTENT AREA */}
        <div className="bg-[#242631] rounded-2xl border border-white/5 shadow-md p-6 min-h-[300px]">
          {activeTab === 'posts' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">Posts & Reflections</h3>
                <span className="text-sm text-gray-400">{stats.postsCount} total</span>
              </div>

              {postsLoading ? (
                <div className="text-center py-10 text-gray-400 animate-pulse">Loading posts...</div>
              ) : userPosts.length > 0 ? (
                <div className="space-y-4">
                  {userPosts.map(post => (
                    <PostCard key={post._id} post={post} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>No posts visible or available.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'podcasts' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">Podcasts</h3>
                <span className="text-sm text-gray-400">{stats.podcastsCount} total</span>
              </div>

              {podcastsLoading ? (
                <div className="text-center py-10 text-gray-400 animate-pulse">Loading podcasts...</div>
              ) : podcasts.length > 0 ? (
                <div className="space-y-4">
                  {podcasts.map(podcast => (
                    <PodcastCard key={podcast._id} podcast={podcast} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>No podcasts visible or available.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold text-white mb-2">Comments</h3>
              <p className="text-gray-400">Comment history is private or coming soon...</p>
            </div>
          )}

          {activeTab === 'reactions' && (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold text-white mb-2">Reactions</h3>
              <p className="text-gray-400">Reaction history coming soon...</p>
            </div>
          )}
        </div>

        {/* REFLECTION JOURNEY */}
        <div className="relative bg-[#242631] rounded-2xl p-7 border border-white/5 shadow-md overflow-hidden">
          <div className="absolute left-0 top-0 h-full w-[6px] bg-[#B9A6FF] rounded-l-2xl" />

          <h2 className="text-lg font-semibold mb-4 pl-3">Reflection Journey</h2>

          <div className="space-y-3 text-sm text-gray-300 pl-3">
            <p>Joined Org: {new Date(user.createdAt).toLocaleDateString()}</p>
            <p>First Reflection Written: {reflectionJourney.firstReflection ? new Date(reflectionJourney.firstReflection).toLocaleDateString() : '—'}</p>
            <p>Most Discussed Post: {reflectionJourney.topPostTitle || '—'}</p>
            <p>Top Podcast Episode: {reflectionJourney.topPodcastTitle || '—'}</p>
            {reflectionJourney.aiTheme && <p className="text-[#7FE6C5] font-medium">AI Theme Detected: {reflectionJourney.aiTheme}</p>}
          </div>
        </div>

        {/* SAFETY CONTROLS */}
        <div className="relative bg-[#242631] rounded-2xl p-6 border border-white/5 shadow-md overflow-hidden">
          <div className="absolute left-0 top-0 h-full w-[6px] bg-[#F5C76A] rounded-l-2xl" />

          <h2 className="text-lg font-semibold mb-5 pl-3 flex items-center gap-2">Psychological Safety Controls</h2>

          <div className="space-y-5 pl-3">
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <p className="text-sm text-gray-300">Default Anonymity Level</p>
              <span className="px-3 py-1 rounded-full bg-[#1C1D25] border border-white/10 text-sm text-gray-200">Level {user.defaultAnonymityLevel}</span>
            </div>

            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <p className="text-sm text-gray-300">Who can see my reflections?</p>
              <span className="px-3 py-1 rounded-full bg-[#1C1D25] border border-white/10 text-sm text-gray-200">{user.visibility}</span>
            </div>

            <ToggleRow label="Allow AI feedback on my posts" defaultOn={user.allowAiFeedback} />
            <ToggleRow label="Allow comments on anonymous posts" defaultOn={user.allowAnonymousComments} />
          </div>
        </div>

        {/* AI INSIGHT */}
        <div className="relative bg-[#242631] rounded-2xl p-7 border border-white/5 shadow-md overflow-hidden">
          <div className="absolute left-0 top-0 h-full w-[6px] bg-[#7FE6C5] rounded-l-2xl" />

          <h2 className="text-lg font-semibold mb-4 pl-3">AI Personality Insight</h2>

          <p className="text-gray-300 text-sm leading-relaxed pl-3">{aiPersonalitySummary || 'No AI personality summary available.'}</p>
        </div>
      </div>
    </div>
  );
}

/* ✅ STATS FILTER DROPDOWN PANEL - Appears Below Profile Card */
function StatsFilterDropdown({ selectedStat, setSelectedStat, isExpanded, setIsExpanded, stats, userPosts, podcasts }) {
  const navigate = useNavigate();

  // Dynamic data map - maps stat key to actual data
  const dataMap = {
    posts: userPosts || [],
    podcasts: podcasts || [],
    comments: [],
    reactions: []
  };

  const statConfigs = [
    {
      key: 'posts',
      label: 'Posts',
      value: stats.postsCount,
      icon: '📝'
    },
    {
      key: 'podcasts',
      label: 'Podcasts',
      value: stats.podcastsCount,
      icon: '🎙️'
    },
    {
      key: 'comments',
      label: 'Comments',
      value: stats.commentsCount,
      icon: '💬'
    },
    {
      key: 'reactions',
      label: 'Reactions',
      value: stats.reactionsCount,
      icon: '👍'
    }
  ];

  const currentConfig = statConfigs.find(c => c.key === selectedStat);
  const currentItems = dataMap[selectedStat] || [];

  const getItemLabel = (item) => {
    if (!item) return '';
    if (selectedStat === 'posts' || selectedStat === 'podcasts') {
      return item.title || 'Untitled';
    }
    return item;
  };

  return (
    <div className="relative bg-[#242631] rounded-2xl border border-white/5 shadow-md overflow-hidden transition-all duration-300">
      <div className="absolute left-0 top-0 h-full w-[6px] bg-gradient-to-b from-[#4BA9FF] to-[#7FE6C5] rounded-l-2xl" />

      {/* Panel Header - Always Visible */}
      <div className="flex items-center justify-between p-6 pl-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{currentConfig?.icon}</span>
          <h3 className="text-xl font-semibold text-white">{currentConfig?.label}</h3>
          <span className="ml-2 px-3 py-1 text-sm rounded-full bg-[#1C1D25] border border-white/10 text-gray-300">
            {currentConfig?.value} total
          </span>
        </div>

        {/* Dropdown Arrow Button - Points DOWN when collapsed, UP when expanded */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 rounded-lg bg-[#1C1D25] hover:bg-[#2A2E3E] text-gray-400 hover:text-white transition-all duration-200"
        >
          {isExpanded ? (
            // ChevronUp - pointing UP
            <svg
              className="w-5 h-5 transition-transform duration-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          ) : (
            // ChevronDown - pointing DOWN
            <svg
              className="w-5 h-5 transition-transform duration-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          )}
        </button>
      </div>

      {/* Expandable Content */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-out ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
      >
        <div className="border-t border-white/5 p-6 space-y-3">
          {currentItems && currentItems.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {currentItems.map((item, idx) => (
                <div
                  key={item._id || idx}
                  onClick={() => {
                    // Navigate to the detail page based on selected stat
                    if (selectedStat === 'posts') {
                      navigate(`/posts/${item._id}`);
                    } else if (selectedStat === 'podcasts') {
                      navigate(`/podcasts/${item._id}`);
                    }
                  }}
                  className="group bg-[#1C1D25] border border-white/5 rounded-lg p-4 hover:border-[#4BA9FF]/30 hover:bg-[#2A2E3E] transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm group-hover:text-[#4BA9FF] transition-colors line-clamp-2">
                        {getItemLabel(item)}
                      </p>
                      <p className="text-gray-500 text-xs mt-2">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Date unavailable'}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-gray-500 group-hover:text-[#4BA9FF] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <p className="text-sm">No {currentConfig?.label?.toLowerCase()} to display</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ✅ Premium Stat Card with Click State */
function Stat({ label, value, isActive, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 bg-[#1C1D25] 
      border rounded-xl px-4 py-3
      hover:scale-[1.02] transition cursor-pointer
      ${isActive ? 'border-[#4BA9FF] ring-1 ring-[#4BA9FF]/50' : 'border-white/10 hover:border-white/20'}
      `}
    >
      {/* Icon Bubble */}
      <div className={`w-10 h-10 flex items-center justify-center rounded-full text-lg transition
        ${isActive ? 'bg-[#4BA9FF] text-black' : 'bg-[#242631] text-white'}
      `}>
        {label.charAt(0)}
      </div>

      {/* Text */}
      <div>
        <p className={`text-xs font-medium transition ${isActive ? 'text-[#4BA9FF]' : 'text-gray-400'}`}>
          {label}
        </p>
        <h3 className="text-xl font-bold text-white leading-tight">
          {value}
        </h3>
      </div>
    </div>
  );
}


/* ✅ Toggle Row Component */
function ToggleRow({ label, defaultOn }) {
  const [enabled, setEnabled] = useState(defaultOn);

  return (
    <div className="flex justify-between items-center border-b border-white/5 pb-4">
      <p className="text-sm text-gray-300">{label}</p>

      {/* ✅ Toggle Switch */}
      <button
        onClick={() => setEnabled(!enabled)}
        className="relative w-14 h-8 rounded-full transition-all duration-300"
        style={{
          backgroundColor: enabled ? "#7FE6C5" : "#FFFFFF", // ✅ ON mint, OFF white
          boxShadow: enabled ? "0 0 10px #7FE6C5" : "none",
        }}
      >
        {/* ✅ Knob */}
        <span
          className="absolute top-1 left-1 w-6 h-6 rounded-full shadow-md transition-all duration-300"
          style={{
            backgroundColor: enabled ? "#FFFFFF" : "#242631", // knob dark when OFF
            transform: enabled ? "translateX(22px)" : "translateX(0px)",
          }}
        />
      </button>
    </div>
  );
}
