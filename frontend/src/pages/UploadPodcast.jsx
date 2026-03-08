import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import Navbar from "../components/layout/Navbar";

export default function UploadPodcast() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [duration, setDuration] = useState(0);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const audioFile = e.target.files[0];
      setFile(audioFile);

      // Extract duration
      const audio = new Audio(URL.createObjectURL(audioFile));
      audio.onloadedmetadata = () => {
        setDuration(Math.round(audio.duration));
      };
    }
  };

  const handleUpload = async () => {
    if (!title.trim()) {
      setError("Please enter a podcast title.");
      return;
    }
    if (!file) {
      setError("Please select an audio file.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", notes);
      formData.append("audio", file);
      formData.append("tags", JSON.stringify(["podcast"]));
      formData.append("duration", duration);

      await api.post("/podcasts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      navigate("/podcasts");
    } catch (err) {
      console.error("Upload error:", err);
      setError(
        err.response?.data?.message ||
        "Failed to upload podcast. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 w-full px-4 md:px-6 py-6 flex flex-col h-[calc(100vh-6rem)] overflow-y-auto no-scrollbar">

      {/* MASTER CONTAINER */}
      <div className="w-full px-6 md:px-12 lg:px-20 relative z-10 flex flex-col md:flex-row gap-8">

        <div className="flex flex-col md:flex-row gap-8 w-full">

          {/* LEFT SIDE (UPLOAD FORM) */}
          <div className="flex-[3] space-y-6">

            {/* Heading */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 bg-white border border-black/10 rounded-full hover:bg-black/5 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-charcoal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>

              <h1 className="text-3xl font-semibold tracking-tight text-charcoal">
                Upload Podcast
              </h1>
            </div>

            <p className="text-charcoal/80 font-medium">
              Upload an audio clip and CultureStack will generate Echo Summary +
              Sentiment Insights automatically.
            </p>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            {/* Upload Card */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-8 border-l-4 border-l-[#8C7851]">

              {/* Title */}
              <div className="mb-6 pl-4">
                <label className="block text-sm font-semibold text-charcoal mb-2">
                  Episode Title
                </label>

                <input
                  type="text"
                  placeholder="e.g., Weekly Team Sync - March 15"
                  className="w-full bg-white border border-black/5 rounded-xl px-4 py-3 text-charcoal placeholder-zinc-400 focus:outline-none focus:border-black/20 focus:ring-1 focus:ring-black/20 transition shadow-sm"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* File Upload */}
              <div className="mb-6 pl-4">
                <label className="block text-sm font-semibold text-charcoal mb-2">
                  Audio File (MP3 / WAV)
                </label>

                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileChange}
                  className="w-full text-sm text-charcoal/80
                file:mr-4 file:py-2 file:px-5
                file:rounded-full file:border-0
                file:bg-black/5 file:text-charcoal file:font-semibold
                hover:file:bg-black/10 transition cursor-pointer"
                />
              </div>

              {/* Notes */}
              <div className="mb-8 pl-4">
                <label className="block text-sm font-semibold text-charcoal mb-2">
                  Show Notes / Description
                </label>

                <textarea
                  placeholder="Key takeaways, participants, and topics discussed..."
                  className="w-full h-28 bg-white border border-black/5 rounded-xl px-4 py-3 text-charcoal placeholder-zinc-400 focus:outline-none focus:border-black/20 focus:ring-1 focus:ring-black/20 transition resize-none shadow-sm"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Upload Button */}
              <div className="pl-4">
                <button
                  onClick={handleUpload}
                  disabled={loading}
                  className="w-full py-4 rounded-full font-bold text-lg bg-[#1A1A1A] text-white hover:bg-black hover:shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                      Uploading...
                    </>
                  ) : (
                    "Upload + Generate AI Echo"
                  )}
                </button>
              </div>

            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="flex-[1] space-y-10 pl-0">

            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 p-5 md:p-6 relative overflow-hidden group w-full border-l-4 border-l-[#8C7851]">

              <h2 className="font-bold text-[#1A1A1A] mb-3">
                Want to see all podcasts?
              </h2>

              <p className="text-sm text-charcoal/80 mb-6">
                Listen to team conversations, insights, and reflections shared across your organization. Catch up on what your team is talking about.
              </p>

              <button
                onClick={() => navigate("/podcasts")}
                className="flex items-center justify-center w-full bg-[#1A1A1A] text-white font-bold py-3 rounded-full shadow-sm hover:bg-black transition"
              >
                View All Podcasts
              </button>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
