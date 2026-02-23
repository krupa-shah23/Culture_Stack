import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function PodcastCard({ podcast }) {
  const navigate = useNavigate();

  // ✅ Pastel Accent Palette (Same as PostCard for consistency)
  const pastelPalette = [
    "#7FE6C5", // Mint Green
    "#4BA9FF", // Sky Blue
    "#F5C76A", // Warm Yellow
    "#F28B82", // Coral Pink
    "#B9A6FF", // Lavender
  ];

  // ✅ Stable Accent Color
  const accentColor =
    pastelPalette[podcast._id.charCodeAt(0) % pastelPalette.length];

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
          {/* Avatar (Podcast Icon) */}
          <div className="w-14 h-14 rounded-full bg-[#303241] flex items-center justify-center font-bold text-2xl text-white">
            {authorInitial}
          </div>

          {/* Title & Author */}
          <div>
            <h3 className="text-white font-semibold text-lg">{podcast.title}</h3>
            <p className="text-xs text-gray-400 italic">
              Hosted by {authorName} • {new Date(podcast.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Duration Badge */}
        <span className="text-xs px-3 py-1 rounded-full bg-[#1C1D25] border border-white/10 text-gray-200 flex items-center gap-2">
          {formatDuration(displayDuration)}
        </span>
      </div>

      {/* Description */}
      <div
        className="
          bg-[#1C1D25]
          border border-white/10
          rounded-xl
          px-6 py-4
          ml-5
          text-gray-200
          text-sm
          leading-relaxed
        "
      >
        <p className="line-clamp-2">{podcast.description}</p>

        {/* Simple Audio Player Preview */}
        {podcast.audioUrl && (
          <div className="mt-3 flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <audio
              controls              preload="metadata"
              crossOrigin="anonymous"              className="w-full h-8 opacity-80 hover:opacity-100 transition"
              src={`http://localhost:5000${podcast.audioUrl}`}
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-6 pl-5 mt-5 text-gray-400">
        <div className="flex items-center gap-2 text-sm hover:text-white transition">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M5 3v18l15-9-15-9z" />
          </svg>
          {podcast.playCount || 0} plays
        </div>

        <button
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
