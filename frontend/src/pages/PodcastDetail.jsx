import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";
import Navbar from "../components/layout/Navbar";

export default function PodcastDetail() {
  const { id } = useParams();
  const [podcast, setPodcast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    const fetchPodcast = async () => {
      try {
        const response = await api.get(`/podcasts/${id}`);
        setPodcast(response.data);

        const transcriptionText = response.data.transcription?.text || "";
        const isTranscriptionError =
          transcriptionText.startsWith("[Transcription unavailable") ||
          transcriptionText.startsWith("[Transcription error") ||
          transcriptionText.startsWith("Transcription unavailable");

        if (
          response.data &&
          ((!response.data.summary) || isTranscriptionError)
        ) {
          triggerTranscription(id);
        } else if (isTranscriptionError) {
          triggerTranscription(id);
        }
      } catch (err) {
        console.error("Failed to fetch podcast:", err);
        setError("Failed to load podcast details.");
      } finally {
        setLoading(false);
      }
    };

    fetchPodcast();
  }, [id]);

  const triggerTranscription = async (podcastId, force = false) => {
    try {
      setSummaryLoading(true);
      const url = force
        ? `/podcasts/${podcastId}/transcribe?force=true`
        : `/podcasts/${podcastId}/transcribe`;

      const response = await api.post(url);
      setPodcast(response.data.podcast);
    } catch (err) {
      console.error("Transcription failed:", err);
    } finally {
      setSummaryLoading(false);
    }
  };

  /* ---------------- LOADING ---------------- */
  if (loading) {
    return (
      <>
        <div className="flex justify-center items-center h-screen bg-[#1C1D25]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4BA9FF]" />
        </div>
      </>
    );
  }

  /* ---------------- ERROR ---------------- */
  if (error || !podcast) {
    return (
      <>
        <div className="max-w-6xl mx-auto mt-10 p-6 text-center text-white">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Error</h2>
          <p className="mb-6">{error || "Podcast not found"}</p>
          <Link to="/podcasts" className="text-[#4BA9FF] hover:underline">
            ← Back to Podcasts
          </Link>
        </div>
      </>
    );
  }

  return (
    <>

      <div className="min-h-screen bg-[#1C1D25] text-white px-6 py-10">
        <div className="max-w-6xl mx-auto space-y-8">

          {/* Back Link */}
          <Link
            to="/podcasts"
            className="text-gray-400 hover:text-white transition inline-block"
          >
            ← Back to Lounge
          </Link>

          {/* 🎙 Podcast Card */}
          <div className="relative bg-[#242631] rounded-2xl p-8 border border-white/10 shadow-lg overflow-hidden">

            {/* Accent Strip */}
            <div className="absolute left-0 top-0 h-full w-[6px] bg-[#4BA9FF]" />

            <h1 className="text-4xl font-bold mb-2 pl-4">
              {podcast.title}
            </h1>

            <p className="text-gray-400 text-sm pl-4">
              Posted by{" "}
              <span className="text-white font-medium">
                {podcast.author?.fullName || "Unknown"}
              </span>{" "}
              • {new Date(podcast.createdAt).toLocaleDateString()}
            </p>

            {/* Audio Player */}
            {podcast.audioUrl && (
              <audio
                controls
                preload="metadata"
                crossOrigin="anonymous"
                src={`http://localhost:5000${podcast.audioUrl}`}
                className="w-full mt-6 rounded-xl bg-[#1C1D25] border border-white/10"
                onLoadedMetadata={(e) => {
                  const dur = Math.floor(e.target.duration || 0);
                  if (dur > 0) {
                    setPodcast((prev) => {
                      // persist duration if backend doesn't have it yet
                      if (prev && !prev.duration) {
                        try {
                          api.put(`/podcasts/${id}`, { duration: dur });
                        } catch (err) {
                          /* ignore persistence failure */
                        }
                      }
                      return { ...prev, duration: dur };
                    });
                  }
                }}
              />
            )}

            {/* Description */}
            <div className="mt-6 pl-4">
              <h3 className="font-semibold mb-2 text-gray-200">
                Description
              </h3>
              <p className="text-gray-400 whitespace-pre-wrap leading-relaxed">
                {podcast.description}
              </p>
            </div>
          </div>

          {/* ✨ Echo Summary */}
          <div className="relative bg-[#242631] rounded-2xl p-8 border border-white/10 shadow-lg overflow-hidden">

            {/* Accent */}
            <div className="absolute left-0 top-0 h-full w-[6px] bg-[#B9A6FF]" />

            <div className="flex justify-between items-center mb-4 pl-4">
              <h2 className="text-2xl font-bold">
                Echo Summary
              </h2>

              {!summaryLoading && (
                <button
                  onClick={() => triggerTranscription(id, true)}
                  className="px-5 py-2 rounded-full bg-[#B9A6FF] text-black font-semibold hover:opacity-90 transition"
                >
                  ↻ Regenerate
                </button>
              )}
            </div>

            {summaryLoading ? (
              <p className="text-gray-400 italic pl-4">
                Listening and generating AI insights...
              </p>
            ) : podcast.summary ? (
              <p className="text-gray-300 whitespace-pre-line leading-relaxed pl-4">
                {podcast.summary}
              </p>
            ) : (
              <p className="text-gray-500 italic pl-4">
                No summary available.
                <button
                  onClick={() => triggerTranscription(id)}
                  className="ml-2 text-[#B9A6FF] hover:underline font-semibold"
                >
                  Generate Now
                </button>
              </p>
            )}
          </div>

          {/* 🔥 Sentiment Heatmap */}
          <div className="relative bg-[#242631] rounded-2xl p-8 border border-white/10 shadow-lg overflow-hidden">

            {/* Accent */}
            <div className="absolute left-0 top-0 h-full w-[6px] bg-[#F5C76A]" />

            <h2 className="text-2xl font-bold mb-2 pl-4">
              Sentiment Heatmap
            </h2>

            <p className="text-gray-400 text-sm mb-5 pl-4">
              Timeline showing the emotional arc of the conversation.
            </p>

            <div className="h-9 bg-[#1C1D25] rounded-full overflow-hidden flex w-full border border-white/10">
              {podcast.heatmap && podcast.heatmap.length > 0 ? (
                podcast.heatmap.map((block, index) => {
                  let color = "#555";

                  if (block.sentiment === "Happy") color = "#7FE6C5";
                  if (block.sentiment === "Excited") color = "#4BA9FF";
                  if (block.sentiment === "Tense") color = "#F28B82";
                  if (block.sentiment === "Sad") color = "#B9A6FF";

                  return (
                    <div
                      key={index}
                      style={{
                        width: `${100 / podcast.heatmap.length}%`,
                        backgroundColor: color,
                      }}
                      className="h-full hover:opacity-80 transition"
                    />
                  );
                })
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                  No sentiment data available
                </div>
              )}
            </div>

            <div className="flex justify-between text-xs text-gray-500 mt-3 px-2">
              <span>Start</span>
              <span>End</span>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
