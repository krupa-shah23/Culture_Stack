import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { voteOnPost } from "../../api/axios";

export default function PostCard({ post, onOpenModal }) {
  const navigate = useNavigate();

  const [isExpanded, setIsExpanded] = useState(false);

  // Vote state (supports upvote / downvote / remove)
  // Safely initialize from post object if it exists
  const [userVote, setUserVote] = useState(post?.currentUserVote || null); // 'upvote' | 'downvote' | null
  const [upvoteCount, setUpvoteCount] = useState(post?.upvoteCount || 0);
  const [downvoteCount, setDownvoteCount] = useState(post?.downvoteCount || 0);

  if (!post) return null;

  // Author Info
  const authorName = post.author?.fullName || "Anonymous";
  const authorInitial = authorName[0]?.toUpperCase() || "A";
  const authorAvatar = post.author?.avatarUrl || null;

  const handleUpvote = async (e) => {
    e.stopPropagation();
    const prevVote = userVote;
    let newVote = 'upvote';

    // If already upvoted, clicking again removes the vote
    if (prevVote === 'upvote') {
      newVote = 'remove';
      setUserVote(null);
      setUpvoteCount(c => Math.max(0, c - 1));
    } else {
      // If switching from downvote
      if (prevVote === 'downvote') {
        setDownvoteCount(c => Math.max(0, c - 1));
      }
      setUserVote('upvote');
      setUpvoteCount(c => c + 1);
    }

    try {
      const res = await voteOnPost(post._id, newVote);
      // Synchronize with actual DB source of truth
      setUserVote(res.userVote);
      setUpvoteCount(res.upvoteCount);
      setDownvoteCount(res.downvoteCount);
    } catch (err) {
      // Revert optimistic changes on failure
      setUserVote(prevVote);
      if (newVote === 'upvote') setUpvoteCount(c => Math.max(0, c - 1));
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
      setDownvoteCount(c => Math.max(0, c - 1));
    } else {
      // If switching from upvote
      if (prevVote === 'upvote') {
        setUpvoteCount(c => Math.max(0, c - 1));
      }
      setUserVote('downvote');
      setDownvoteCount(c => c + 1);
    }

    try {
      const res = await voteOnPost(post._id, newVote);
      // Synchronize with actual DB source of truth
      setUserVote(res.userVote);
      setUpvoteCount(res.upvoteCount);
      setDownvoteCount(res.downvoteCount);
    } catch (err) {
      // Revert optimistic changes on failure
      setUserVote(prevVote);
      if (newVote === 'downvote') setDownvoteCount(c => Math.max(0, c - 1));
      if (newVote === 'remove') setDownvoteCount(c => c + 1);
      if (prevVote === 'upvote') setUpvoteCount(c => c + 1);
      console.error('Vote error', err);
    }
  };

  return (
    <div
      className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-1 p-5 md:p-6 relative overflow-hidden group w-full"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          {authorAvatar ? (
            <img
              src={authorAvatar}
              alt={authorName}
              className="w-10 h-10 rounded-full object-cover bg-gray-200 border border-gray-100 flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-semibold text-gray-600 flex-shrink-0">
              {authorInitial}
            </div>
          )}

          {/* Author */}
          <div>
            <h3 className="font-bold text-[#1A1A1A] cursor-pointer hover:underline" onClick={(e) => { e.stopPropagation(); navigate(`/profile/${post.author?._id}`); }}>{authorName}</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Posted {new Date(post.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onOpenModal) {
              onOpenModal(post);
            } else {
              navigate(`/posts/${post._id}`);
            }
          }}
          className="btn-secondary text-xs px-4 py-1.5"
        >
          See Post
        </button>
      </div>

      {/* Content */}
      <div className="text-gray-800 text-[15px] leading-relaxed mb-5">
        {post.mediaUrl && (
          <div className="mb-4">
            {post.mediaType === "video" ? (
              <video
                src={`http://localhost:5000${post.mediaUrl}`}
                controls
                className="w-full rounded-xl max-h-[450px] object-cover border border-gray-100"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <img
                src={`http://localhost:5000${post.mediaUrl}`}
                alt="Post Media"
                loading="lazy"
                className="w-full rounded-xl max-h-[450px] object-cover border border-gray-100"
              />
            )}
          </div>
        )}
        <p className="whitespace-pre-wrap">
          {post.content && post.content.length > 150 ? (
            <>
              {isExpanded ? post.content : post.content.substring(0, 150) + "..."}
              <span
                onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                className="text-sm text-gray-600 underline cursor-pointer hover:text-gray-900 inline ml-1 transition-colors duration-200"
              >
                {isExpanded ? "Show less" : "Read more"}
              </span>
            </>
          ) : (
            post.content
          )}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-6 mt-2 pt-4 border-t border-gray-50">
        {/* Vote controls: independent horizontal buttons */}
        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={handleUpvote}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md transition-colors duration-200 ${userVote === "upvote"
              ? "bg-green-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-green-100 border border-gray-200"
              }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              fill="none"
              className={`w-4 h-4 pointer-events-none ${userVote === "upvote" ? "text-white" : "text-gray-500"
                }`}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19.5v-15m0 0l-6.75 6.75M12 4.5l6.75 6.75" />
            </svg>

            <span className="font-semibold text-sm pointer-events-none">
              {upvoteCount}
            </span>
          </button>

          <button
            onClick={handleDownvote}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md transition-colors duration-200 ${userVote === "downvote"
              ? "bg-red-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-red-100 border border-gray-200"
              }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              fill="none"
              className={`w-4 h-4 pointer-events-none ${userVote === "downvote" ? "text-white" : "text-gray-500"
                }`}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m0 0l6.75-6.75M12 19.5l-6.75-6.75" />
            </svg>

            <span className="font-semibold text-sm pointer-events-none">
              {downvoteCount}
            </span>
          </button>


          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenModal) {
                onOpenModal(post);
              } else {
                navigate(`/posts/${post._id}`, { state: { focusComment: true } });
              }
            }}
            className="flex items-center gap-2 text-sm font-semibold bg-[#1A1A1A] text-white hover:bg-black px-4 py-2 rounded-full transition-colors duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 pointer-events-none">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 3.866-3.582 7-8 7a9.959 9.959 0 01-4.5-1.05L3 21l1.05-5.5A9.959 9.959 0 013 12c0-3.866 3.582-7 8-7s8 3.134 8 7z" />
            </svg>
            <span className="pointer-events-none">Add Comment</span>
          </button>
        </div>
      </div>
    </div>
  );
}
