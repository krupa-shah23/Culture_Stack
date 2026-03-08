import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import PodcastCard from "../components/layout/PodcastCard";
import PodcastModal from "../components/layout/PodcastModal";

export default function Podcasts() {
  const [podcasts, setPodcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPodcast, setSelectedPodcast] = useState(null);

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
      <div className="flex-1 w-full pb-12 relative flex flex-col pt-6 md:pt-10">
        {/* Full-width Mesh Background */}
        <div className="bg-mesh-gradient fixed inset-0 z-[-1]" />

        {/* MASTER CONTAINER */}
        <div className="w-full px-6 md:px-12 lg:px-20 relative z-10 flex flex-col md:flex-row gap-8">

          {/* ================= PODCAST FEED ================= */}
          <div className="flex-[3] space-y-6">

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
              <div className="text-center py-20 flex flex-col items-center">
                <p className="text-charcoal/80 mb-6 text-lg">
                  No podcasts yet. Be the first to upload one.
                </p>

                <Link
                  to="/podcasts/upload"
                  className="px-6 py-3 rounded-full font-semibold bg-[#1A1A1A] text-white transition hover:shadow-md hover:bg-black"
                >
                  Upload Podcast
                </Link>
              </div>
            )}

            {/* PODCAST LIST */}
            {!loading && podcasts.length > 0 && (
              <div className="flex flex-col gap-6">
                {podcasts.map((podcast) => (
                  <PodcastCard key={podcast._id} podcast={podcast} onOpenModal={(p) => setSelectedPodcast(p)} />
                ))}
              </div>
            )}
          </div>

          {/* ================= UPLOAD SIDEBAR ================= */}
          <div className="flex-[1] space-y-10 pl-0">
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 p-5 md:p-6 relative overflow-hidden group w-full border-l-4 border-l-[#8C7851]">
              <h2 className="font-bold text-[#1A1A1A] mb-3">Share Your Voice</h2>
              <p className="text-sm text-charcoal/80 mb-6">
                Have an idea, reflection, or story worth sharing? Upload a podcast and let your team listen and learn.
              </p>
              <Link to="/podcasts/upload" className="flex items-center justify-center w-full bg-[#1A1A1A] text-white font-bold py-3 rounded-full shadow-sm hover:bg-black transition">
                Upload Podcast
              </Link>
            </div>
          </div>
        </div>
      </div>

      {selectedPodcast && (
        <PodcastModal podcast={selectedPodcast} onClose={() => setSelectedPodcast(null)} />
      )}
    </>
  );
}
