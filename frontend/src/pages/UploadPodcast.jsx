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

      <div className="min-h-screen bg-[#1C1D25] text-white px-6 py-10">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Page Heading */}
          <h1 className="text-4xl font-bold">
            🎧 Upload Podcast Episode
          </h1>

          <p className="text-gray-400">
            Upload an audio clip and CultureStack will generate Echo Summary +
            Sentiment Insights automatically.
          </p>

          {/* Error Box */}
          {error && (
            <div className="bg-[#F28B82]/20 border border-[#F28B82] text-red-200 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {/* Upload Card */}
          <div className="relative bg-[#242631] rounded-2xl p-8 border border-white/10 shadow-lg overflow-hidden">

            {/* Accent Strip */}
            <div className="absolute left-0 top-0 h-full w-[6px] bg-[#7FE6C5]" />

            {/* Title Input */}
            <div className="mb-6 pl-4">
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Episode Title
              </label>
              <input
                type="text"
                placeholder="e.g., Weekly Team Sync - March 15"
                className="w-full bg-[#1C1D25] border border-white/10 
                rounded-xl px-4 py-3 text-gray-200 placeholder-gray-500
                focus:outline-none focus:ring-2 focus:ring-[#4BA9FF]"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* File Upload */}
            <div className="mb-6 pl-4">
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Audio File (MP3 / WAV)
              </label>

              <input
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                className="w-full text-sm text-gray-400
                file:mr-4 file:py-2 file:px-5
                file:rounded-full file:border-0
                file:bg-[#4BA9FF] file:text-black file:font-semibold
                hover:file:opacity-90 transition"
              />
            </div>

            {/* Notes */}
            <div className="mb-8 pl-4">
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Show Notes / Description
              </label>

              <textarea
                placeholder="Key takeaways, participants, and topics discussed..."
                className="w-full h-32 bg-[#1C1D25] border border-white/10 
                rounded-xl px-4 py-3 text-gray-200 placeholder-gray-500
                focus:outline-none focus:ring-2 focus:ring-[#B9A6FF] resize-none"
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
                bg-[#7FE6C5] text-black
                hover:opacity-90 transition
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black" />
                    Uploading...
                  </>
                ) : (
                  "Upload + Generate AI Echo →"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
