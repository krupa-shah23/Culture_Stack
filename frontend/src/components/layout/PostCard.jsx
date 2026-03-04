import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { voteOnPost } from "../../api/axios";

export default function PostCard({ post }) {
  const navigate = useNavigate();

  // ✅ Beige Minimalist Accent Palette
  const antigravityPalette = [
    "#8C7851", // Muted Gold
    "#1A1A1A", // Charcoal
    "#8C7851",
    "#1A1A1A",
  ];

  // ✅ Stable Accent Color per Post
  const accentColor =
    antigravityPalette[post._id.charCodeAt(0) % antigravityPalette.length];

  // Tag
  const tag = post.tags?.[0] || "Reflection";

  // Author Info
  const authorName = post.author?.fullName || "Anonymous";
  const authorInitial = authorName[0]?.toUpperCase() || "A";

  // Vote state (supports upvote / downvote / remove)
  const [userVote, setUserVote] = useState(post.currentUserVote || null); // 'upvote' | 'downvote' | null
  const [upvoteCount, setUpvoteCount] = useState(post.upvoteCount || 0);
  const [downvoteCount, setDownvoteCount] = useState(post.downvoteCount || 0);

  // Vote handlers (optimistic UI)
  const handleUpvote = async (e) => {
    e.stopPropagation();
    if (userVote) return; // Prevent multiple votes/toggling

    const prevVote = userVote;

    try {
      // new upvote
      setUserVote('upvote');
      setUpvoteCount((c) => c + 1);
      const res = await voteOnPost(post._id, 'upvote');
      setUserVote(res.userVote);
      setUpvoteCount(res.upvoteCount);
      setDownvoteCount(res.downvoteCount);
    } catch (err) {
      // revert optimistic change on error
      setUserVote(prevVote);
      if (prevVote === 'upvote') setUpvoteCount((c) => c + 1);
      if (prevVote === 'downvote') setDownvoteCount((c) => c + 1);
      console.error('Vote error', err);
    }
  };

  const handleDownvote = async (e) => {
    e.stopPropagation();
    if (userVote) return; // Prevent multiple votes/toggling

    const prevVote = userVote;

    try {
      // new downvote
      setUserVote('downvote');
      setDownvoteCount((c) => c + 1);
      const res = await voteOnPost(post._id, 'downvote');
      setUserVote(res.userVote);
      setUpvoteCount(res.upvoteCount);
      setDownvoteCount(res.downvoteCount);
    } catch (err) {
      // revert optimistic change on error
      setUserVote(prevVote);
      if (prevVote === 'upvote') setUpvoteCount((c) => c + 1);
      if (prevVote === 'downvote') setDownvoteCount((c) => c + 1);
      console.error('Vote error', err);
    }
  };

  return (
    <div
      onClick={() => navigate(`/posts/${post._id}`)}
      className="
        relative glass-card
        p-7 transition-all duration-300 cursor-pointer
        overflow-hidden group hover:-translate-y-2
      "
    >
      {/* ✅ Accent Strip */}
      <div
        style={{ backgroundColor: accentColor }}
        className="absolute left-0 top-0 h-full w-[4px]"
      />

      {/* Header */}
      <div className="flex justify-between items-center mb-6 pl-3">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-14 h-14 rounded-full bg-charcoal flex items-center justify-center font-bold text-lg text-white shadow-sm">
            {authorInitial}
          </div>

          {/* Author */}
          <div>
            <h3 className="text-charcoal font-bold cursor-pointer hover:text-[#8C7851] transition-colors" onClick={(e) => { e.stopPropagation(); navigate(`/profile/${post.author?._id}`); }}>{authorName}</h3>
            <p className="text-xs text-[#4A4A4A] mt-0.5">
              Posted {new Date(post.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Tag */}
        <span className="text-xs px-4 py-1.5 rounded-full bg-white shadow-sm border border-black/5 text-[#4A4A4A]">
          {tag}
        </span>
      </div>

      {/* Content */}
      <div
        className="
          glass-card
          px-6 py-5
          ml-2
          text-[#4A4A4A]
          text-sm
          leading-relaxed
        "
      >
        {post.mediaUrl && (
          <div className="mb-4">
            {post.mediaType === "video" ? (
              <video
                src={`http://localhost:5000${post.mediaUrl}`}
                controls
                className="w-full rounded-lg border border-black/5 max-h-60 object-cover"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <img
                src={`http://localhost:5000${post.mediaUrl}`}
                alt="Post Media"
                className="w-full rounded-lg border border-black/5 h-auto object-cover max-h-80"
              />
            )}
          </div>
        )}
        {post.content.length > 200
          ? post.content.substring(0, 200) + "..."
          : post.content}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-10 pl-3 mt-5 text-[#4A4A4A]">

        {/* Vote controls: upvote / score / downvote */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleUpvote}
            disabled={!!userVote}
            className={`flex items-center gap-2 text-sm font-bold transition py-3 ${userVote === 'upvote' ? 'text-charcoal' : userVote ? 'text-zinc-400 cursor-not-allowed' : 'text-[#8C7851] hover:text-charcoal'}`}
          >
            {/* Up arrow */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={userVote === 'upvote' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75V5.25m0 0 6.75 6.75M12 5.25 5.25 12" />
            </svg>
            <span className="text-base font-semibold">{upvoteCount}</span>
          </button>

          <button
            onClick={handleDownvote}
            disabled={!!userVote}
            className={`flex items-center gap-2 text-sm font-bold transition py-3 ${userVote === 'downvote' ? 'text-red-700' : userVote ? 'text-zinc-400 cursor-not-allowed' : 'text-[#8C7851] hover:text-red-700'}`}
          >
            {/* Down arrow */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={userVote === 'downvote' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5.25v13.5m0 0-6.75-6.75M12 18.75L18.75 12" />
            </svg>
            <span className="text-base font-semibold">{downvoteCount}</span>
          </button>
        </div>

        {/* Discuss */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/posts/${post._id}`);
          }}
          className="
            flex items-center gap-2
            text-base font-bold py-3 text-[#4A4A4A]
            hover:text-charcoal transition
          "
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 3.866-3.582 7-8 7a9.959 9.959 0 01-4.5-1.05L3 21l1.05-5.5A9.959 9.959 0 013 12c0-3.866 3.582-7 8-7s8 3.134 8 7z" />
          </svg>
          Discuss
        </button>
      </div>
    </div>
  );
}
