import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { voteOnPost } from "../../api/axios";

export default function PostCard({ post }) {
  const navigate = useNavigate();

  // ✅ Glass Variants
  const glassVariants = [
    "glass-surface",
    "glass-green",
    "glass-tan",
    "glass-sand"
  ];

  if (!post) return null;

  // Stable Glass Theme
  const cardTheme = glassVariants[(post._id?.charCodeAt(0) || 0) % glassVariants.length];

  // Tag
  const tag = post.tags?.[0] || "Reflection";

  // Author Info
  const authorName = post.author?.fullName || "Anonymous";
  const authorInitial = authorName[0]?.toUpperCase() || "A";

  // Vote state (supports upvote / downvote / remove)
  const [userVote, setUserVote] = useState(post.currentUserVote || null); // 'upvote' | 'downvote' | null
  const [upvoteCount, setUpvoteCount] = useState(post.upvoteCount || 0);
  const [downvoteCount, setDownvoteCount] = useState(post.downvoteCount || 0);

  const handleUpvote = async (e) => {
    e.stopPropagation();
    const prevVote = userVote;
    let newVote = 'upvote';

    // If already upvoted, clicking again removes the vote
    if (prevVote === 'upvote') {
      newVote = 'remove';
      setUserVote(null);
      setUpvoteCount(c => c - 1);
    } else {
      // If switching from downvote
      if (prevVote === 'downvote') {
        setDownvoteCount(c => c - 1);
      }
      setUserVote('upvote');
      setUpvoteCount(c => c + 1);
    }

    try {
      const res = await voteOnPost(post._id, newVote);
      setUserVote(res.userVote);
      setUpvoteCount(res.upvoteCount);
      setDownvoteCount(res.downvoteCount);
    } catch (err) {
      // Revert optimistic changes
      setUserVote(prevVote);
      if (newVote === 'upvote') setUpvoteCount(c => c - 1);
      if (newVote === 'remove') setUpvoteCount(c => c + 1);
      if (prevVote === 'downvote') setDownvoteCount(c => c + 1);
      console.error('Vote error', err);
    }
  };

  const handleDownvote = async (e) => {
    e.stopPropagation();
    const prevVote = userVote;
    let newVote = 'downvote';

    // If already downvoted, clicking again removes the vote
    if (prevVote === 'downvote') {
      newVote = 'remove';
      setUserVote(null);
      setDownvoteCount(c => c - 1);
    } else {
      // If switching from upvote
      if (prevVote === 'upvote') {
        setUpvoteCount(c => c - 1);
      }
      setUserVote('downvote');
      setDownvoteCount(c => c + 1);
    }

    try {
      const res = await voteOnPost(post._id, newVote);
      setUserVote(res.userVote);
      setUpvoteCount(res.upvoteCount);
      setDownvoteCount(res.downvoteCount);
    } catch (err) {
      // Revert optimistic changes
      setUserVote(prevVote);
      if (newVote === 'downvote') setDownvoteCount(c => c - 1);
      if (newVote === 'remove') setDownvoteCount(c => c + 1);
      if (prevVote === 'upvote') setUpvoteCount(c => c + 1);
      console.error('Vote error', err);
    }
  };

  return (
    <div
      onClick={() => navigate(`/posts/${post._id}`)}
      className={`
        relative ${cardTheme}
        p-7 transition-all duration-300 cursor-pointer
        overflow-hidden group hover:-translate-y-2
      `}
    >
      {/* Accent Strip */}
      <div
        className="absolute left-0 top-0 h-full w-[4px] bg-earth-green"
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
            <h3 className="font-bold cursor-pointer transition-colors opacity-90" onClick={(e) => { e.stopPropagation(); navigate(`/profile/${post.author?._id}`); }}>{authorName}</h3>
            <p className="text-xs opacity-70 mt-0.5">
              Posted {new Date(post.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Tag */}
        <span className="text-xs px-4 py-1.5 rounded-full bg-white/20 shadow-sm border border-white/10 opacity-90">
          {tag}
        </span>
      </div>

      {/* Content */}
      <div
        className="
          bg-white/10
          rounded-xl
          px-6 py-5
          ml-2
          opacity-90
          text-sm
          leading-relaxed
          border border-white/10
        "
      >
        {post.mediaUrl && (
          <div className="mb-4">
            {post.mediaType === "video" ? (
              <video
                src={`http://localhost:5000${post.mediaUrl}`}
                controls
                className="w-full rounded-lg border border-white/10 max-h-60 object-cover"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <img
                src={`http://localhost:5000${post.mediaUrl}`}
                alt="Post Media"
                className="w-full rounded-lg border border-white/10 h-auto object-cover max-h-80"
              />
            )}
          </div>
        )}
        {(post.content || "").length > 200
          ? (post.content || "").substring(0, 200) + "..."
          : post.content}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-10 pl-3 mt-5 opacity-80">

        {/* Vote controls: upvote - score - downvote */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleUpvote}
            className={`flex items-center justify-center p-2 rounded-full transition ${userVote === 'upvote' ? 'bg-earth-green/20 text-earth-green' : 'hover:bg-white/10'}`}
          >
            {/* Up arrow */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={userVote === 'upvote' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={userVote === 'upvote' ? 2 : 1.5} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75V5.25m0 0 6.75 6.75M12 5.25 5.25 12" />
            </svg>
          </button>

          <span className="font-bold text-base min-w-[2ch] text-center">
            {upvoteCount - downvoteCount}
          </span>

          <button
            onClick={handleDownvote}
            className={`flex items-center justify-center p-2 rounded-full transition ${userVote === 'downvote' ? 'bg-red-500/20 text-red-400' : 'hover:bg-white/10'}`}
          >
            {/* Down arrow */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={userVote === 'downvote' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={userVote === 'downvote' ? 2 : 1.5} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5.25v13.5m0 0-6.75-6.75M12 18.75L18.75 12" />
            </svg>
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
            text-base font-bold py-3 opacity-90
            hover:opacity-100 transition
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
