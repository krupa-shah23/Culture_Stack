import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { Play, Plus } from "lucide-react";

export default function Podcasts() {
  const [podcasts, setPodcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPodcasts = async () => {
      try {
        const response = await api.get("/podcasts");
        setPodcasts(response.data);
      } catch (err) {
        console.error("Failed to fetch podcasts:", err);
        setError("Failed to load podcasts. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchPodcasts();
  }, []);

  return (
    <>
      <div className="flex-1 w-full px-4 md:px-6 pb-12 relative flex flex-col h-[calc(100vh-6rem)] relative bg-[#F5F5F0]">
        {/* Full-width Mesh Background */}
        <div className="bg-mesh-gradient" />

        {/* MASTER CONTAINER */}
        <div className="w-full max-w-6xl mx-auto flex-1 rounded-3xl border border-black/5 bg-white/40 backdrop-blur-xl shadow-sm overflow-y-auto no-scrollbar p-6 md:p-10 relative z-10 flex flex-col gap-12">
          <div className="w-full flex flex-col gap-12">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6">
              <div>
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-charcoal">
                  Podcasts Lounge
                </h1>
                <p className="text-charcoal/80 mt-2 text-lg">Immerse yourself in sonic knowledge.</p>
              </div>

              <Link
                to="/podcasts/upload"
                className="px-6 py-3 rounded-full font-semibold bg-[#1A1A1A] text-white flex items-center justify-center gap-2 transition-all hover:shadow-md hover:bg-black"
              >
                Upload Audio
                <Plus className="w-5 h-5 text-white" />
              </Link>
            </div>

            {/* LOADING */}
            {loading && (
              <div className="text-center py-20 flex flex-col items-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-charcoal shadow-sm" />
                <p className="text-charcoal/80 mt-6 animate-pulse font-medium">
                  Tuning frequencies...
                </p>
              </div>
            )}

            {/* ERROR */}
            {error && (
              <div className="bg-[#AF52BF]/20 border border-[#AF52BF] text-[#AF52BF] px-5 py-4 rounded-xl backdrop-blur-md">
                {error}
              </div>
            )}

            {/* EMPTY */}
            {!loading && podcasts.length === 0 && !error && (
              <div className="bg-white border border-black/5 rounded-2xl p-12 text-center flex flex-col items-center shadow-sm">
                <p className="text-charcoal/80 mb-6 text-lg font-medium">
                  No podcasts found in this dimension. Be the first to broadcast.
                </p>

                <Link
                  to="/podcasts/upload"
                  className="px-6 py-3 rounded-full font-semibold bg-[#1A1A1A] text-white transition hover:shadow-md hover:bg-black"
                >
                  Upload a Podcast
                </Link>
              </div>
            )}

            {/* PODCAST GRID - Polaroid Layout */}
            {!loading && podcasts.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {podcasts.map((podcast, index) => {
                  const beigePalette = ["#8C7851", "#1A1A1A", "#4A4A4A", "#F5F5F0"];
                  const accent = beigePalette[index % beigePalette.length];

                  return (
                    <div
                      key={podcast._id}
                      className="group relative bg-white border border-black/5 rounded-2xl p-4 pb-8 flex flex-col hover:-translate-y-1 transition-transform duration-500 ease-out hover:shadow-md"
                    >
                      {/* Polaroid Image Area */}
                      <div className="w-full aspect-square rounded-xl bg-earth-bg border border-black/5 flex items-center justify-center relative overflow-hidden shadow-sm">
                        {/* Decorative internal mesh */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white to-transparent opacity-50" />

                        {/* Abstract Visual based on ID */}
                        <div
                          className="w-3/4 h-3/4 blur-3xl rounded-full absolute mix-blend-screen opacity-40 transition-transform duration-700 group-hover:scale-125 group-hover:opacity-60"
                          style={{ backgroundColor: accent }}
                        />

                        <div className="z-10 text-black/40 drop-shadow-sm relative">
                          {/* Audio Wave Decor */}
                          <div className="flex items-center gap-1 h-12">
                            <div className="w-2 bg-black/20 h-full animate-[pulse_1s_ease-in-out_infinite]" style={{ animationDelay: '0.1s' }} />
                            <div className="w-2 bg-black/20 h-2/3 animate-[pulse_1s_ease-in-out_infinite]" style={{ animationDelay: '0.2s' }} />
                            <div className="w-2 bg-black/20 h-4/5 animate-[pulse_1s_ease-in-out_infinite]" style={{ animationDelay: '0.3s' }} />
                            <div className="w-2 bg-black/20 h-1/2 animate-[pulse_1s_ease-in-out_infinite]" style={{ animationDelay: '0.4s' }} />
                          </div>
                        </div>

                        {/* Floating Play Button */}
                        <Link
                          to={`/podcasts/${podcast._id}`}
                          className="absolute bottom-4 right-4 w-14 h-14 rounded-full flex items-center justify-center bg-charcoal text-white opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300 hover:shadow-md hover:bg-black z-20"
                        >
                          <Play className="w-6 h-6 ml-1 fill-white" />
                        </Link>
                      </div>

                      {/* Polaroid Text Area */}
                      <div className="mt-5 px-1 flex flex-col flex-1">
                        <h2 className="font-bold text-xl text-charcoal line-clamp-1 mb-1 group-hover:text-earth-green transition-colors">
                          {podcast.title}
                        </h2>

                        <p className="text-sm text-charcoal/80">
                          By{" "}
                          <span className="text-charcoal font-medium tracking-wide">
                            {podcast.author?.fullName || "Unknown"}
                          </span>
                        </p>

                        <div className="mt-auto pt-4 flex justify-between items-center text-xs text-charcoal/80 font-medium">
                          <span>{new Date(podcast.createdAt).toLocaleDateString()}</span>
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accent, boxShadow: `0 0 8px ${accent}` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
