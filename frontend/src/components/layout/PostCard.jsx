import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { voteOnPost } from "../../api/axios";

export default function PostCard({ post }) {
  const navigate = useNavigate();

  // ✅ Pastel Accent Palette
  const pastelPalette = [
    "#7FE6C5", // Mint Green
    "#4BA9FF", // Sky Blue
    "#F5C76A", // Warm Yellow
    "#F28B82", // Coral Pink
    "#B9A6FF", // Lavender
  ];

  // ✅ Stable Accent Color per Post
  const accentColor =
    pastelPalette[post._id.charCodeAt(0) % pastelPalette.length];

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
        relative bg-[#242631]
        border border-white/5
        rounded-2xl p-7
        shadow-md hover:shadow-lg
        transition cursor-pointer
        overflow-hidden
      "
    >
      {/* ✅ Pastel Accent Strip */}
      <div
        style={{ backgroundColor: accentColor }}
        className="absolute left-0 top-0 h-full w-[7px] rounded-l-2xl"
      />

      {/* Header */}
      <div className="flex justify-between items-center mb-6 pl-5">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-14 h-14 rounded-full bg-[#303241] flex items-center justify-center font-bold text-lg text-white">
            {authorInitial}
          </div>

          {/* Author */}
          <div>
            <h3 className="text-white font-semibold cursor-pointer" onClick={(e) => { e.stopPropagation(); navigate(`/profile/${post.author?._id}`); }}>{authorName}</h3>
            <p className="text-xs text-gray-400 italic">
              Posted {new Date(post.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Tag */}
        <span className="text-xs px-4 py-1 rounded-full bg-[#1C1D25] border border-white/10 text-gray-200">
          {tag}
        </span>
      </div>

      {/* Content */}
      <div
        className="
          bg-[#1C1D25]
          border border-white/10
          rounded-xl
          px-6 py-5
          ml-5
          text-gray-200
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
                className="w-full rounded-lg border border-white/10 max-h-60 object-cover"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <img
                src={`http://localhost:5000${post.mediaUrl}`}
                alt="Post Media"
                className="w-full rounded-lg border border-white/10 max-h-60 object-cover"
              />
            )}
          </div>
        )}
        {post.content.length > 200
          ? post.content.substring(0, 200) + "..."
          : post.content}
      </div>

      {/* ✅ Instagram Style Actions */}
      <div className="flex items-center gap-10 pl-5 mt-5 text-gray-400">

        {/* Vote controls: upvote / score / downvote */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleUpvote}
            disabled={!!userVote}
            className={`flex items-center gap-2 text-sm font-medium transition ${userVote === 'upvote' ? 'text-[#4BA9FF] opacity-100' : userVote ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-white'}`}
          >
            {/* Up arrow (swapped) */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={userVote === 'upvote' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75V5.25m0 0 6.75 6.75M12 5.25 5.25 12" />
            </svg>
            <span>{upvoteCount}</span>
          </button>

          <button
            onClick={handleDownvote}
            disabled={!!userVote}
            className={`flex items-center gap-2 text-sm font-medium transition ${userVote === 'downvote' ? 'text-[#F28B82] opacity-100' : userVote ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-white'}`}
          >
            {/* Down arrow (swapped) */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={userVote === 'downvote' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5.25v13.5m0 0-6.75-6.75M12 18.75L18.75 12" />
            </svg>
            <span>{downvoteCount}</span>
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
            text-sm font-medium
            hover:text-white transition
          "
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 3.866-3.582 7-8 7a9.959 9.959 0 01-4.5-1.05L3 21l1.05-5.5A9.959 9.959 0 013 12c0-3.866 3.582-7 8-7s8 3.134 8 7z" />
          </svg>
          Discuss
        </button>
      </div>
    </div>
  );
}
