import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function PodcastCard({ podcast, onOpenModal }) {
  const navigate = useNavigate();

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
      onClick={() => {
        if (onOpenModal) {
          onOpenModal(podcast);
        } else {
          navigate(`/podcasts/${podcast._id}`);
        }
      }}
      className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 p-5 md:p-6 w-full relative overflow-hidden group cursor-pointer"
    >

      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar (Podcast Icon) */}
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-semibold text-gray-600 flex-shrink-0">
            {authorInitial}
          </div>

          {/* Title & Author */}
          <div>
            <h3 className="font-bold text-[#1A1A1A] group-hover:underline">{podcast.title}</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Hosted by {authorName} • {new Date(podcast.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Duration Badge */}
        <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">
          {formatDuration(displayDuration)}
        </span>
      </div>

      {/* Description */}
      <div className="text-gray-800 text-[15px] leading-relaxed mb-5">
        <p className="line-clamp-2">{podcast.description}</p>

        {/* Simple Audio Player Preview */}
        {podcast.audioUrl && (
          <div className="mt-4 mb-2 overflow-x-auto" onClick={(e) => e.stopPropagation()}>
            <audio
              controls preload="metadata"
              crossOrigin="anonymous" className="w-full min-w-[250px] h-10 border border-gray-100 rounded-full bg-gray-50"
              src={`http://localhost:5000${podcast.audioUrl}`}
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-6 mt-2 pt-4 border-t border-gray-50">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M5 3v18l15-9-15-9z" />
          </svg>
          <span>{podcast.playCount || 0} plays</span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onOpenModal) {
              onOpenModal(podcast);
            } else {
              navigate(`/podcasts/${podcast._id}`);
            }
          }}
          className="flex items-center gap-2 text-sm font-semibold bg-[#1A1A1A] text-white hover:bg-black px-4 py-2 rounded-full transition-colors duration-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 pointer-events-none">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 3.866-3.582 7-8 7a9.959 9.959 0 01-4.5-1.05L3 21l1.05-5.5A9.959 9.959 0 013 12c0-3.866 3.582-7 8-7s8 3.134 8 7z" />
          </svg>
          <span className="pointer-events-none">Discuss</span>
        </button>
      </div>
    </div>
  );
}
