import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import Navbar from "../components/layout/Navbar";

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

      <div className="min-h-screen bg-[#1C1D25] text-white px-6 py-10">
        <div className="max-w-5xl mx-auto space-y-8">

          {/* HEADER */}
          <div className="flex justify-between items-center">
            <h1 className="text-4xl font-bold">
              Podcasts Lounge
            </h1>

            <Link
              to="/podcasts/upload"
              className="px-6 py-2 rounded-full font-semibold
              bg-[#7FE6C5] text-black hover:opacity-90 transition"
            >
              Upload Audio +
            </Link>
          </div>

          {/* LOADING */}
          {loading && (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[#4BA9FF]" />
              <p className="text-gray-400 mt-4 italic">
                Loading podcasts...
              </p>
            </div>
          )}

          {/* ERROR */}
          {error && (
            <div className="bg-[#F28B82]/20 border border-[#F28B82] text-[#F28B82] px-5 py-4 rounded-xl">
              {error}
            </div>
          )}

          {/* EMPTY */}
          {!loading && podcasts.length === 0 && !error && (
            <div className="bg-[#242631] border border-white/10 rounded-2xl p-10 text-center">
              <p className="text-gray-400 mb-4 italic">
                No podcasts found. Be the first to upload one
              </p>

              <Link
                to="/podcasts/upload"
                className="text-[#4BA9FF] hover:underline font-semibold"
              >
                Upload a Podcast →
              </Link>
            </div>
          )}

          {/* PODCAST LIST */}
          {!loading && podcasts.length > 0 && (
            <div className="space-y-5">
              {podcasts.map((podcast, index) => {
                const pastel =
                  ["#4BA9FF", "#B9A6FF", "#F5C76A", "#7FE6C5", "#F28B82"][
                  index % 5
                  ];

                return (
                  <div
                    key={podcast._id}
                    className="relative bg-[#242631] border border-white/10 
                    rounded-2xl p-6 shadow-md hover:shadow-lg transition overflow-hidden"
                  >
                    {/* Left Accent Strip */}
                    <div
                      className="absolute left-0 top-0 h-full w-[6px]"
                      style={{ backgroundColor: pastel }}
                    />

                    <div className="flex justify-between items-start pl-3">
                      {/* Podcast Info */}
                      <div className="space-y-2">
                        <h2 className="font-bold text-2xl">
                          {podcast.title}
                        </h2>

                        <p className="text-sm text-gray-400">
                          By{" "}
                          <span className="text-white font-medium">
                            {podcast.author?.fullName || "Unknown"}
                          </span>{" "}
                          •{" "}
                          {new Date(podcast.createdAt).toLocaleDateString()}
                        </p>

                        <p className="text-gray-300 leading-relaxed line-clamp-2">
                          {podcast.description}
                        </p>
                      </div>

                      {/* Play Button */}
                      <Link
                        to={`/podcasts/${podcast._id}`}
                        className="px-5 py-2 rounded-full font-semibold text-sm
                        bg-[#1C1D25] border border-white/10 
                        hover:border-white/30 hover:bg-[#2E3140] transition"
                      >
                        ▶ Play
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
