import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function PodcastCard({ podcast }) {
  const navigate = useNavigate();

  // ✅ Glass Variants
  const glassVariants = [
    "glass-surface",
    "glass-green",
    "glass-tan",
    "glass-sand"
  ];

  // ✅ Stable Glass Theme
  const cardTheme = glassVariants[podcast._id.charCodeAt(0) % glassVariants.length];

  // Author Info
  const authorName = podcast.author?.fullName || "Anonymous";
  const authorInitial = authorName[0]?.toUpperCase() || "A";

  // Local display duration (fallback to metadata if backend missing)
  const [displayDuration, setDisplayDuration] = useState(podcast.duration || 0);

  useEffect(() => {
    if ((!podcast.duration || podcast.duration === 0) && podcast.audioUrl) {
      const audio = new Audio(`http://localhost:5000${podcast.audioUrl}`);
      audio.preload = "metadata";
      audio.onloadedmetadata = () => {
        const d = Math.floor(audio.duration || 0);
        if (d > 0) setDisplayDuration(d);
      };
    } else {
      setDisplayDuration(podcast.duration || 0);
    }
  }, [podcast.duration, podcast.audioUrl]);

  // Duration formatting
  const formatDuration = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  return (
    <div
      onClick={() => navigate(`/podcasts/${podcast._id}`)}
      className={`
        relative ${cardTheme}
        p-7 shadow-sm hover:shadow-md
        transition-all duration-300 cursor-pointer
        overflow-hidden group
      `}
    >

      {/* Header */}
      <div className="flex justify-between items-center mb-6 pl-3">
        <div className="flex items-center gap-4">
          {/* Avatar (Podcast Icon) */}
          <div className="w-14 h-14 rounded-full bg-white/20 border border-white/10 flex items-center justify-center font-bold text-2xl shadow-sm">
            {authorInitial}
          </div>

          {/* Title & Author */}
          <div>
            <h3 className="font-bold text-lg opacity-90">{podcast.title}</h3>
            <p className="text-xs italic opacity-70">
              Hosted by {authorName} • {new Date(podcast.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Duration Badge */}
        <span className="text-xs px-4 py-1.5 rounded-full bg-white/20 border border-white/10 opacity-80 shadow-sm flex items-center gap-2">
          {formatDuration(displayDuration)}
        </span>
      </div>

      {/* Description */}
      <div
        className="
          bg-white/10
          border border-white/10
          rounded-xl
          px-6 py-4
          ml-2
          opacity-90
          text-sm
          leading-relaxed
        "
      >
        <p className="line-clamp-2">{podcast.description}</p>

        {/* Simple Audio Player Preview */}
        {podcast.audioUrl && (
          <div className="mt-3 flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <audio
              controls preload="metadata"
              crossOrigin="anonymous" className="w-full h-8 opacity-80 hover:opacity-100 transition"
              src={`http://localhost:5000${podcast.audioUrl}`}
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-6 pl-3 mt-5 opacity-80">
        <div className="flex items-center gap-2 text-sm hover:opacity-100 transition py-3">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M5 3v18l15-9-15-9z" />
          </svg>
          <span className="text-base">{podcast.playCount || 0} plays</span>
        </div>

        <button
          className="
            flex items-center gap-2
            text-base font-bold py-3
            hover:opacity-100 hover:drop-shadow-sm transition
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
