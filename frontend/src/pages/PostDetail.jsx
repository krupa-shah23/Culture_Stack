import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import api, { voteOnPost, reactToComment, refreshAiFeedback } from "../api/axios";
import Navbar from "../components/layout/Navbar";

/* ✅ Persona Theme Palette */
const PERSONAS = [
  { key: "mentor", label: "Mentor", accent: "#7FE6C5" },
  { key: "critic", label: "Critic", accent: "#F28B82" },
  { key: "strategist", label: "Strategist", accent: "#4BA9FF" },
  { key: "executionManager", label: "Execution Manager", accent: "#F5C76A" },
  { key: "riskEvaluator", label: "Risk Evaluator", accent: "#B9A6FF" },
  { key: "innovator", label: "Innovator", accent: "#7FE6C5" },
];

export default function PostDetail() {
  const { postId } = useParams();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [selectedPersona, setSelectedPersona] = useState("mentor");
  const [newCommentText, setNewCommentText] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [commentLoading, setCommentLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  /* Votes */
  const [upvoteCount, setUpvoteCount] = useState(0);
  const [downvoteCount, setDownvoteCount] = useState(0);
  const [userVote, setUserVote] = useState(null); // 'upvote' | 'downvote' | null
  const [voteLoading, setVoteLoading] = useState(false);

  /* AI */
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState(null);

  const commentInputRef = useRef(null);
  const location = useLocation();

  /* Load Data */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const userInfo = localStorage.getItem("userInfo");
        if (userInfo) setCurrentUserId(JSON.parse(userInfo)._id);

        const postRes = await api.get(`/posts/${postId}`);
        const fetchedPost = postRes.data;

        setPost(fetchedPost);
        setUpvoteCount(fetchedPost.upvoteCount || 0);
        setDownvoteCount(fetchedPost.downvoteCount || 0);
        setUserVote(fetchedPost.currentUserVote || null);

        const commentsRes = await api.get(`/comments/${postId}`);
        setComments(commentsRes.data || []);
      } catch (err) {
        setError("Failed to load post details");
      } finally {
        setLoading(false);
      }
    };

    if (postId) fetchData();
  }, [postId]);

  /* Focus Comment */
  useEffect(() => {
    if (location?.state?.focusComment && commentInputRef.current) {
      commentInputRef.current.focus();
    }
  }, [location, post]);

  /* Add Comment */
  const handleAddComment = async () => {
    if (!newCommentText.trim()) return;

    try {
      setCommentLoading(true);

      const response = await api.post(`/comments`, {
        postId,
        content: newCommentText,
      });

      setComments([...comments, response.data]);
      setNewCommentText("");
    } catch {
      setError("Failed to post comment");
    } finally {
      setCommentLoading(false);
    }
  };

  /* Delete Comment */
  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`/comments/${commentId}`);
      setComments(comments.filter((c) => c._id !== commentId));
    } catch {
      setError("Failed to delete comment");
    }
  };

  /* Comment reactions (like / dislike) - optimistic UI */
  const handleReactToComment = async (commentId, reactionType) => {
    // reactionType: 'like' | 'dislike' | 'remove'
    const prevComments = comments;
    const idx = comments.findIndex((c) => c._id === commentId);
    if (idx === -1) return;

    const prev = { ...comments[idx] };
    const updated = { ...prev };

    // optimistic changes
    if (reactionType === 'remove') {
      if (prev.currentUserReaction === 'like') updated.likeCount = Math.max(0, (prev.likeCount || 0) - 1);
      if (prev.currentUserReaction === 'dislike') updated.dislikeCount = Math.max(0, (prev.dislikeCount || 0) - 1);
      updated.currentUserReaction = null;
    } else if (reactionType === 'like') {
      if (prev.currentUserReaction === 'like') {
        // will be removed by server
        updated.likeCount = Math.max(0, (prev.likeCount || 0) - 1);
        updated.currentUserReaction = null;
      } else if (prev.currentUserReaction === 'dislike') {
        updated.dislikeCount = Math.max(0, (prev.dislikeCount || 0) - 1);
        updated.likeCount = (prev.likeCount || 0) + 1;
        updated.currentUserReaction = 'like';
      } else {
        updated.likeCount = (prev.likeCount || 0) + 1;
        updated.currentUserReaction = 'like';
      }
    } else if (reactionType === 'dislike') {
      if (prev.currentUserReaction === 'dislike') {
        updated.dislikeCount = Math.max(0, (prev.dislikeCount || 0) - 1);
        updated.currentUserReaction = null;
      } else if (prev.currentUserReaction === 'like') {
        updated.likeCount = Math.max(0, (prev.likeCount || 0) - 1);
        updated.dislikeCount = (prev.dislikeCount || 0) + 1;
        updated.currentUserReaction = 'dislike';
      } else {
        updated.dislikeCount = (prev.dislikeCount || 0) + 1;
        updated.currentUserReaction = 'dislike';
      }
    }

    const newComments = [...comments];
    newComments[idx] = updated;
    setComments(newComments);

    try {
      const res = await reactToComment(commentId, reactionType);
      // reconcile with server response
      newComments[idx] = { ...newComments[idx], likeCount: res.likeCount, dislikeCount: res.dislikeCount, currentUserReaction: res.userReaction };
      setComments(newComments);
    } catch (err) {
      // revert on error
      setComments(prevComments);
      console.error('Comment reaction failed', err);
      setError('Failed to update reaction');
    }
  };

  /* Vote handlers (optimistic) */
  const handleUpvote = async () => {
    if (!post) return;
    if (userVote) return; // Prevent multiple votes

    const prev = userVote;
    try {
      setVoteLoading(true);
      // new upvote
      setUserVote('upvote');
      setUpvoteCount((c) => c + 1);
      const res = await voteOnPost(post._id, 'upvote');
      setUserVote(res.userVote);
      setUpvoteCount(res.upvoteCount);
      setDownvoteCount(res.downvoteCount);
    } catch (err) {
      setUserVote(prev);
      setError('Failed to update vote');
      console.error('vote error', err);
    } finally {
      setVoteLoading(false);
    }
  };

  const handleDownvote = async () => {
    if (!post) return;
    if (userVote) return; // Prevent multiple votes

    const prev = userVote;
    try {
      setVoteLoading(true);
      // new downvote
      setUserVote('downvote');
      setDownvoteCount((c) => c + 1);
      const res = await voteOnPost(post._id, 'downvote');
      setUserVote(res.userVote);
      setUpvoteCount(res.upvoteCount);
      setDownvoteCount(res.downvoteCount);
    } catch (err) {
      setUserVote(prev);
      setError('Failed to update vote');
      console.error('vote error', err);
    } finally {
      setVoteLoading(false);
    }
  };

  /* Generate AI */
  const handleGenerateAi = async () => {
    if (!post) return;

    try {
      setAiGenerating(true);
      setAiError(null);

      const ai = await refreshAiFeedback(post._id);
      setPost((prev) => ({ ...prev, aiFeedback: ai }));
    } catch {
      setAiError("Failed to generate AI feedback");
    } finally {
      setAiGenerating(false);
    }
  };

  /* Date Format */
  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <>
        <div className="h-screen flex items-center justify-center bg-[#1C1D25] text-gray-400">
          Loading...
        </div>
      </>
    );
  }

  if (!post) {
    return (
      <>
        <div className="h-screen flex items-center justify-center bg-[#1C1D25] text-gray-400">
          Post not found
        </div>
      </>
    );
  }

  const selectedPersonaData = post.aiFeedback?.[selectedPersona] || "";

  return (
    <>

      <div className="min-h-screen bg-[#1C1D25] text-white px-6 py-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT SIDE */}
          <div className="lg:col-span-2 space-y-6">

            {/* Post Card */}
            <div className="relative bg-[#242631] rounded-2xl p-7 border border-white/10 shadow-md overflow-hidden">
              <div className="absolute left-0 top-0 h-full w-[6px] bg-[#4BA9FF]" />

              <h1 className="text-3xl font-bold mb-2 pl-3">
                {post.title}
              </h1>

              <p className="text-gray-400 text-sm mb-5 pl-3">
                {post.author?.fullName || "Anonymous"} • {formatDate(post.createdAt)}
              </p>

              <div className="mb-6 pl-3">
                {post.mediaUrl && (
                  <div className="mb-4">
                    {post.mediaType === "video" ? (
                      <video
                        src={`http://localhost:5000${post.mediaUrl}`}
                        controls
                        className="w-full rounded-xl border border-white/10 max-h-[500px] object-contain bg-black"
                      />
                    ) : (
                      <img
                        src={`http://localhost:5000${post.mediaUrl}`}
                        alt="Post Media"
                        className="w-full rounded-xl border border-white/10 max-h-[500px] object-contain bg-black"
                      />
                    )}
                  </div>
                )}
                <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {post.content}
                </p>
              </div>

              {/* Reactions */}
              <div className="flex gap-3 mt-6 pl-3">
                <div className="flex gap-3">
                  <button
                    onClick={handleUpvote}
                    disabled={voteLoading || !!userVote}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${userVote === 'upvote' ? 'bg-[#4BA9FF] text-black' : userVote ? 'bg-[#1C1D25] text-gray-600 cursor-not-allowed' : 'bg-[#1C1D25] text-gray-300 hover:bg-[#2A2C38]'}`}
                  >
                    ▲ Up {upvoteCount}
                  </button>

                  <button
                    onClick={handleDownvote}
                    disabled={voteLoading || !!userVote}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${userVote === 'downvote' ? 'bg-[#F28B82] text-black' : userVote ? 'bg-[#1C1D25] text-gray-600 cursor-not-allowed' : 'bg-[#1C1D25] text-gray-300 hover:bg-[#2A2C38]'}`}
                  >
                    ▼ Down {downvoteCount}
                  </button>

                  <div className="px-4 py-2 rounded-lg bg-[#1C1D25] text-gray-300 text-sm">
                    Score {upvoteCount - downvoteCount}
                  </div>
                </div>

                <div className="px-4 py-2 rounded-lg bg-[#1C1D25] text-gray-300 text-sm">
                  Refinements {post.refineCount || 0}
                </div>

                <div className="px-4 py-2 rounded-lg bg-[#1C1D25] text-gray-300 text-sm">
                  Comments {comments.length}
                </div>
              </div>
            </div>

            {/* Comments */}
            <div className="bg-[#242631] rounded-2xl p-7 border border-white/10 shadow-md">
              <h2 className="text-xl font-bold mb-5">
                Comments ({comments.length})
              </h2>

              <div className="space-y-4 max-h-72 overflow-y-auto pr-2">
                {comments.length === 0 ? (
                  <p className="text-gray-500 italic">
                    No comments yet. Be the first!
                  </p>
                ) : (
                  comments.map((comment) => (
                    <div
                      key={comment._id}
                      className="bg-[#1C1D25] border border-white/10 p-4 rounded-xl"
                    >
                      <div className="flex justify-between mb-2">
                        <p className="font-semibold text-sm">
                          {comment.author?.fullName || "Anonymous"}
                        </p>

                        {currentUserId === comment.author?._id && (
                          <button
                            onClick={() => handleDeleteComment(comment._id)}
                            className="text-red-400 text-xs hover:underline"
                          >
                            Delete
                          </button>
                        )}
                      </div>

                      <p className="text-gray-300 text-sm">
                        {comment.content}
                      </p>

                      {/* Comment-level reactions (smaller/subtle) */}
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                        <button
                          onClick={() => handleReactToComment(comment._id, comment.currentUserReaction === 'like' ? 'remove' : 'like')}
                          className={`flex items-center gap-2 transition ${comment.currentUserReaction === 'like' ? 'text-[#4BA9FF]' : 'hover:text-white'}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path d="M2 10a6 6 0 1112 0A6 6 0 012 10zm7-2a1 1 0 00-2 0v3a1 1 0 001 1h1v2h1v-3h1a1 1 0 001-1V8a1 1 0-1-1h-3z" />
                          </svg>
                          <span>{comment.likeCount || 0}</span>
                        </button>

                        <button
                          onClick={() => handleReactToComment(comment._id, comment.currentUserReaction === 'dislike' ? 'remove' : 'dislike')}
                          className={`flex items-center gap-2 transition ${comment.currentUserReaction === 'dislike' ? 'text-[#F28B82]' : 'hover:text-white'}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path d="M18 10a6 6 0 11-12 0 6 6 0 0112 0zm-9 2a1 1 0 012 0v3a1 1 0 01-1 1H9v-3H8v-1h1z" />
                          </svg>
                          <span>{comment.dislikeCount || 0}</span>
                        </button>

                        <div className="text-xs text-gray-500">{comment.currentUserReaction ? `You reacted: ${comment.currentUserReaction}` : ''}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Comment Input */}
              <textarea
                ref={commentInputRef}
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Share your thoughts..."
                className="w-full mt-5 bg-[#1C1D25] border border-white/10 rounded-xl p-4 text-gray-200 text-sm resize-none"
                rows="3"
              />

              <button
                onClick={handleAddComment}
                disabled={commentLoading}
                className="w-full mt-4 bg-[#4BA9FF] text-black py-3 rounded-lg font-semibold hover:opacity-90 transition"
              >
                {commentLoading ? "Posting..." : "Post Comment"}
              </button>
            </div>
          </div>

          {/* RIGHT SIDE AI PANEL */}
          <div className="bg-[#242631] rounded-2xl p-6 border border-white/10 shadow-md h-fit">

            <h2 className="text-lg font-bold mb-5">
              AI Feedback
            </h2>

            {/* Persona Tiles */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {PERSONAS.map((p) => {
                const active = selectedPersona === p.key;

                return (
                  <button
                    key={p.key}
                    onClick={() => setSelectedPersona(p.key)}
                    className="relative h-[70px] w-full rounded-lg border border-white/10 flex items-center justify-center text-sm font-semibold transition"
                    style={{
                      backgroundColor: active ? p.accent : "#1C1D25",
                      color: active ? "black" : "white",
                    }}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Feedback Box */}
            <div className="bg-[#1C1D25] border border-white/10 rounded-xl p-5 text-gray-300 text-sm min-h-[160px]">
              {selectedPersonaData ? (
                selectedPersonaData
              ) : (
                <p className="italic text-gray-500">
                  No feedback yet.
                </p>
              )}
            </div>

            {/* Generate AI */}
            {!selectedPersonaData && (
              <button
                onClick={handleGenerateAi}
                disabled={aiGenerating}
                className="w-full mt-5 bg-[#B9A6FF] text-black py-3 rounded-lg font-semibold hover:opacity-90 transition"
              >
                {aiGenerating ? "Generating..." : "Generate AI Feedback"}
              </button>
            )}

            {aiError && (
              <p className="text-red-400 text-sm mt-3 italic">{aiError}</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
