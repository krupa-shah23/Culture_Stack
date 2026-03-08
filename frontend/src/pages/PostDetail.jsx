import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import api, { voteOnPost, reactToComment, refreshAiFeedback } from "../api/axios";
import Navbar from "../components/layout/Navbar";

/* Persona Theme Palette (Beige Minimalist) */
const PERSONAS = [
  { key: "mentor", label: "Mentor", accent: "#1A1A1A" }, // Charcoal
  { key: "critic", label: "Critic", accent: "#8C7851" }, // Muted Gold
  { key: "strategist", label: "Strategist", accent: "#4A4A4A" }, // Soft Grey
  { key: "executionManager", label: "Execution Manager", accent: "#5AC8FA" }, // Soft Teal
  { key: "riskEvaluator", label: "Risk Evaluator", accent: "#7FE6C5" }, // Mint
  { key: "innovator", label: "Innovator", accent: "#F5C76A" }, // Warm Yellow
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

    const prevVote = userVote;
    let newVote = 'upvote';

    if (prevVote === 'upvote') {
      newVote = 'remove';
      setUserVote(null);
      setUpvoteCount(c => c - 1);
    } else {
      if (prevVote === 'downvote') {
        setDownvoteCount(c => c - 1);
      }
      setUserVote('upvote');
      setUpvoteCount(c => c + 1);
    }

    try {
      setVoteLoading(true);
      const res = await voteOnPost(post._id, newVote);
      setUserVote(res.userVote);
      setUpvoteCount(res.upvoteCount);
      setDownvoteCount(res.downvoteCount);
    } catch (err) {
      setUserVote(prevVote);
      if (newVote === 'upvote') setUpvoteCount(c => c - 1);
      if (newVote === 'remove') setUpvoteCount(c => c + 1);
      if (prevVote === 'downvote') setDownvoteCount(c => c + 1);
      setError('Failed to update vote');
      console.error('vote error', err);
    } finally {
      setVoteLoading(false);
    }
  };

  const handleDownvote = async () => {
    if (!post) return;

    const prevVote = userVote;
    let newVote = 'downvote';

    if (prevVote === 'downvote') {
      newVote = 'remove';
      setUserVote(null);
      setDownvoteCount(c => c - 1);
    } else {
      if (prevVote === 'upvote') {
        setUpvoteCount(c => c - 1);
      }
      setUserVote('downvote');
      setDownvoteCount(c => c + 1);
    }

    try {
      setVoteLoading(true);
      const res = await voteOnPost(post._id, newVote);
      setUserVote(res.userVote);
      setUpvoteCount(res.upvoteCount);
      setDownvoteCount(res.downvoteCount);
    } catch (err) {
      setUserVote(prevVote);
      if (newVote === 'downvote') setDownvoteCount(c => c - 1);
      if (newVote === 'remove') setDownvoteCount(c => c + 1);
      if (prevVote === 'upvote') setUpvoteCount(c => c + 1);
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
      <div className="flex-1 w-full relative py-10 px-4 flex items-center justify-center text-charcoal bg-[#F5F5F0]">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-charcoal shadow-sm z-10" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex-1 w-full relative py-10 px-4 flex items-center justify-center text-charcoal/80 bg-[#F5F5F0]">
        <p className="z-10 text-xl font-medium tracking-wide">Signal lost in the void. Post not found.</p>
      </div>
    );
  }

  const selectedPersonaData = post.aiFeedback?.[selectedPersona] || "";

  return (
    <div className="flex-1 w-full px-4 md:px-6 pb-12 relative flex flex-col h-[calc(100vh-6rem)] bg-[#F5F5F0]">
      {/* MASTER CONTAINER */}
      <div className="w-full max-w-6xl mx-auto flex-1 rounded-3xl border border-black/5 bg-white/40 backdrop-blur-xl shadow-sm overflow-y-auto custom-scrollbar p-6 md:p-10 relative z-10">
        <div className="max-w-4xl mx-auto flex flex-col gap-10">

          {/* MAIN POST AREA */}
          <div className="bg-white rounded-2xl border border-black/5 p-6 md:p-12 shadow-sm relative overflow-hidden">
            {/* Subtle border */}
            <div className="absolute inset-0 border-[1.5px] border-black/5 rounded-[16px] pointer-events-none mix-blend-overlay" />

            {/* Accent Highlight */}
            <div className="absolute left-0 top-0 h-full w-[4px] bg-charcoal opacity-80" />

            <div className="pl-3">
              <h1 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight leading-tight text-charcoal">
                {post.title}
              </h1>

              <div className="flex flex-wrap items-center gap-3 text-sm text-charcoal/80 mb-8 font-medium">
                <span className="text-charcoal bg-earth-bg py-1 px-3 rounded-full border border-black/5 shadow-sm">
                  {post.author?.fullName || "Anonymous"}
                </span>
                <span>•</span>
                <span>{formatDate(post.createdAt)}</span>
              </div>

              {post.mediaUrl && (
                <div className="mb-8 rounded-2xl overflow-hidden border border-black/5 shadow-sm bg-earth-surface p-2">
                  {post.mediaType === "video" ? (
                    <video
                      src={`http://localhost:5000${post.mediaUrl}`}
                      controls
                      className="w-full rounded-xl max-h-[600px] object-cover"
                    />
                  ) : (
                    <img
                      src={`http://localhost:5000${post.mediaUrl}`}
                      alt="Post Media"
                      className="w-full rounded-xl max-h-[600px] object-cover"
                    />
                  )}
                </div>
              )}

              <div className="prose max-w-none text-charcoal/80 text-lg leading-relaxed whitespace-pre-wrap font-medium">
                {post.content}
              </div>

              <hr className="my-8 border-black/10" />

              {/* Reactions & Stats */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-3 bg-earth-bg p-1.5 rounded-xl border border-black/5 shadow-inner">
                  <button
                    onClick={handleUpvote}
                    disabled={voteLoading}
                    className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all ${userVote === 'upvote' ? 'bg-earth-green text-white shadow-sm' : 'bg-transparent text-charcoal/80 hover:text-earth-green hover:bg-white/50'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={userVote === 'upvote' ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={userVote === 'upvote' ? 2 : 1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l7 7m-7-7l-7 7" />
                    </svg>
                  </button>
                  <span className="font-bold text-lg min-w-[20px] text-center text-charcoal">{upvoteCount - downvoteCount}</span>
                  <button
                    onClick={handleDownvote}
                    disabled={voteLoading}
                    className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all ${userVote === 'downvote' ? 'bg-red-500 text-white shadow-sm' : 'bg-transparent text-charcoal/80 hover:text-red-500 hover:bg-white/50'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={userVote === 'downvote' ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={userVote === 'downvote' ? 2 : 1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m0 0l-7-7m7 7l7-7" />
                    </svg>
                  </button>
                </div>

                <div className="flex gap-4 ml-auto text-sm text-charcoal/80 font-medium bg-earth-bg px-4 py-3 rounded-xl border border-black/5">
                  <span className="flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-zinc-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                    </svg>
                    {comments.length}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-zinc-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M11.3 1.046A12.014 12.014 0 0010 1C5.032 1 1 5.032 1 10s4.032 9 9 9 9-4.032 9-9a12.013 12.013 0 00-.046-1.3C17.02 9.531 14.73 11 12 11c-2.73 0-5.02-1.469-6.954-3.654A10.012 10.012 0 0110 3.003L11.3 1.046z" clipRule="evenodd" />
                    </svg>
                    Refines: {post.refineCount || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* AI ADVISORY PANEL */}
          <div className="bg-white rounded-2xl border border-black/5 p-6 md:p-8 shadow-sm">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-charcoal">
              <span className="text-[#1A1A1A]"></span> AI Advisory Panel
            </h2>

            {/* Persona Tiles */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
              {PERSONAS.map((p) => {
                const active = selectedPersona === p.key;

                return (
                  <button
                    key={p.key}
                    onClick={() => setSelectedPersona(p.key)}
                    className="relative px-3 py-4 w-full rounded-xl border flex flex-col items-center justify-center text-sm font-bold transition-all duration-300 shadow-sm"
                    style={{
                      backgroundColor: active ? p.accent : "#F5F5F0",
                      borderColor: active ? p.accent : "rgba(0,0,0,0.05)",
                      color: active ? "white" : "#4A4A4A",
                    }}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Feedback Box */}
            <div className="bg-earth-bg border border-black/5 rounded-2xl p-6 text-charcoal text-base leading-relaxed min-h-[160px] shadow-sm">
              {selectedPersonaData ? (
                <div className="animate-in fade-in duration-500">
                  {selectedPersonaData}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[120px] opacity-70">
                  <p className="italic text-charcoal/80">Seeking analytical counsel from the void...</p>
                </div>
              )}
            </div>

            {/* Generate AI */}
            {!selectedPersonaData && (
              <button
                onClick={handleGenerateAi}
                disabled={aiGenerating}
                className="w-full mt-6 bg-earth-green text-white py-4 rounded-xl font-bold hover:bg-[#A39066] transition shadow-sm"
              >
                {aiGenerating ? "Synthesizing Insights..." : "Generate Advisory Feedback"}
              </button>
            )}

            {aiError && (
              <p className="text-red-500 text-sm mt-4 italic bg-red-100 px-4 py-2 rounded-lg text-center font-medium border border-red-200">{aiError}</p>
            )}
          </div>

          {/* DISCOURSE (COMMENTS) */}
          <div className="bg-white rounded-2xl border border-black/5 p-6 md:p-10 shadow-sm">
            <h2 className="text-2xl font-bold mb-8 flex items-center text-charcoal">
              Discourse
              <span className="ml-3 text-sm font-medium bg-earth-surface px-3 py-1 rounded-full text-charcoal border border-black/5">
                {comments.length}
              </span>
            </h2>

            {/* Comment Input */}
            <div className="mb-10">
              <textarea
                ref={commentInputRef}
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Contribute to the narrative..."
                className="w-full bg-earth-bg border border-black/5 rounded-xl p-5 text-charcoal text-base resize-none focus:outline-none focus:border-black/20 focus:ring-1 focus:ring-black/20 shadow-sm transition"
                rows="3"
              />

              <div className="flex justify-end mt-4">
                <button
                  onClick={handleAddComment}
                  disabled={commentLoading}
                  className="px-8 py-3 bg-charcoal text-white rounded-xl font-bold hover:bg-black transition shadow-sm disabled:opacity-50"
                >
                  {commentLoading ? "Transmitting..." : "Post Contribution"}
                </button>
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-6">
              {comments.length === 0 ? (
                <div className="text-center py-10 bg-earth-bg rounded-2xl border text-charcoal/80 border-black/5 border-dashed">
                  <p className="italic">Silence reigns. Be the first to speak.</p>
                </div>
              ) : (
                comments.map((comment, i) => (
                  <div
                    key={comment._id}
                    className="group flex gap-4 bg-transparent border-b border-black/5 pb-6 last:border-0"
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    {/* Avatar Placeholder */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-earth-surface border border-black/5 flex items-center justify-center font-bold text-charcoal text-sm shadow-sm mt-1">
                      {(comment.author?.fullName?.[0] || "A").toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1 gap-2">
                        <p className="font-bold text-charcoal text-sm truncate">
                          {comment.author?.fullName || "Anonymous Traveler"}
                        </p>

                        {currentUserId === comment.author?._id && (
                          <button
                            onClick={() => handleDeleteComment(comment._id)}
                            className="text-red-500 text-xs font-semibold hover:text-red-700 transition opacity-0 group-hover:opacity-100 bg-red-100 px-2 py-1 rounded"
                          >
                            Delete
                          </button>
                        )}
                      </div>

                      <p className="text-charcoal/80 text-base leading-relaxed break-words whitespace-pre-wrap">
                        {comment.content}
                      </p>

                      {/* Comment-level reactions */}
                      <div className="flex items-center gap-5 mt-4 text-xs font-semibold text-charcoal/80">
                        <button
                          onClick={() => handleReactToComment(comment._id, comment.currentUserReaction === 'like' ? 'remove' : 'like')}
                          className={`flex items-center gap-1.5 transition ${comment.currentUserReaction === 'like' ? 'text-charcoal' : 'hover:text-charcoal hover:bg-black/5 px-1 py-0.5 rounded -ml-1'}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path d="M2 10a6 6 0 1112 0A6 6 0 012 10zm7-2a1 1 0 00-2 0v3a1 1 0 001 1h1v2h1v-3h1a1 1 0 001-1V8a1 1 0-1-1h-3z" />
                          </svg>
                          <span>{comment.likeCount || 0}</span>
                        </button>

                        <button
                          onClick={() => handleReactToComment(comment._id, comment.currentUserReaction === 'dislike' ? 'remove' : 'dislike')}
                          className={`flex items-center gap-1.5 transition ${comment.currentUserReaction === 'dislike' ? 'text-earth-green' : 'hover:text-earth-green hover:bg-black/5 px-1 py-0.5 rounded -ml-1'}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path d="M18 10a6 6 0 11-12 0 6 6 0 0112 0zm-9 2a1 1 0 012 0v3a1 1 0 01-1 1H9v-3H8v-1h1z" />
                          </svg>
                          <span>{comment.dislikeCount || 0}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
