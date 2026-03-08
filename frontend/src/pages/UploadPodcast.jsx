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
    <>

      <div className="flex-1 w-full px-4 md:px-6 pb-12 relative flex flex-col h-[calc(100vh-6rem)] relative bg-[#F5F5F0]">
        {/* MASTER CONTAINER */}
        <div className="w-full max-w-6xl mx-auto flex-1 rounded-3xl border border-black/5 bg-white/40 backdrop-blur-xl shadow-sm overflow-y-auto no-scrollbar p-6 md:p-10 relative z-10">
          <div className="max-w-3xl mx-auto space-y-6">

            {/* Page Heading & Back */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 bg-white border border-black/10 rounded-full hover:bg-black/5 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-charcoal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h1 className="text-4xl font-bold tracking-tight text-charcoal">
                Upload Podcast Episode
              </h1>
            </div>

            <p className="text-charcoal/80 font-medium">
              Upload an audio clip and CultureStack will generate Echo Summary +
              Sentiment Insights automatically.
            </p>

            {/* Error Box */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            {/* Upload Card */}
            <div className="relative bg-white rounded-2xl p-8 border border-black/5 shadow-sm overflow-hidden">
              {/* Accent Strip */}
              <div className="absolute left-0 top-0 h-full w-[5px] bg-[#8C7851]" />

              {/* Title Input */}
              <div className="mb-6 pl-4">
                <label className="block text-sm font-semibold text-charcoal mb-2">
                  Episode Title
                </label>
                <input
                  type="text"
                  placeholder="e.g., Weekly Team Sync - March 15"
                  className="w-full bg-white border border-black/5 
                rounded-xl px-4 py-3 text-charcoal placeholder-zinc-400
                focus:outline-none focus:border-black/20 focus:ring-1 focus:ring-black/20 transition-colors shadow-sm"
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
                  className="w-full h-32 bg-white border border-black/5 
                rounded-xl px-4 py-3 text-charcoal placeholder-zinc-400
                focus:outline-none focus:border-black/20 focus:ring-1 focus:ring-black/20 transition-colors resize-none shadow-sm"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Upload Button */}
              <div className="pl-4">
                <button
                  onClick={handleUpload}
                  disabled={loading}
                  className="w-full py-4 rounded-full font-bold text-lg
                bg-[#1A1A1A] text-white hover:bg-black hover:shadow-md transition-all
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-3 border-none"
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
        </div>
      </div>
    </>
  );
}
