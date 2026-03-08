import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import PersonaAvatar from "../components/layout/PersonaAvatar";
import { calculateHarshScore } from "../utils/harshWordDetector";
import { Shield } from "lucide-react";

export default function Write() {
  const navigate = useNavigate();

  const [contentType, setContentType] = useState("Reflection");
  const [safetyLevel, setSafetyLevel] = useState(1);
  const [content, setContent] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [error, setError] = useState("");

  // Live feedback state
  const [liveAiFeedback, setLiveAiFeedback] = useState({});
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");

  // Harsh word detection state
  const [harshScore, setHarshScore] = useState({ score: 0, intensity: "safe", count: 0, words: [] });

  const debounceTimer = useRef(null);

  const [selectedPersona, setSelectedPersona] = useState("innovator");

  const personas = [
    { key: "innovator", label: "Innovator" },
    { key: "riskEvaluator", label: "Risk Evaluator" },
    { key: "strategist", label: "Strategist" },
  ];

  // Beige Palette for Personas
  const accentColors = [
    "#8C7851", // Muted Gold - Innovator
    "#1A1A1A", // Charcoal - Risk Evaluator
    "#4A4A4A", // Soft Teal - Strategist
  ];

  // Local fallback feedback
  const localPersonaFallback = () => ({
    innovator:
      "Try experimenting with alternative approaches and validate assumptions.",
    riskEvaluator:
      "Consider risks like morale or delivery impact. Try small pilots first.",
    strategist:
      "Think about how this connects to long-term goals and future planning.",
  });

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  // Generate Live Feedback
  const generateLiveFeedback = async (currentContent) => {
    if (currentContent.trim().length <= 50) {
      setLiveAiFeedback({});
      setFeedbackError("");
      return;
    }

    setFeedbackLoading(true);
    setFeedbackError("");

    try {
      const response = await api.post("/refine", {
        rant: currentContent,
        getFeedback: true,
      });

      const remote = response.data?.aiFeedback || {};
      const hasRemote = Object.values(remote).some(
        (v) => v && String(v).trim().length > 0
      );

      if (hasRemote) {
        setLiveAiFeedback(remote);
      } else {
        setLiveAiFeedback(localPersonaFallback());
      }
    } catch {
      setLiveAiFeedback(localPersonaFallback());
      setFeedbackError("Server failed - using fallback feedback");
    } finally {
      setFeedbackLoading(false);
    }
  };

  // Debounced typing
  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);

    // Calculate harsh score immediately (no debounce)
    const harshAnalysis = calculateHarshScore(newContent);
    setHarshScore(harshAnalysis);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      generateLiveFeedback(newContent);
    }, 1000);
  };

  // AI Refine
  const handleAiRefine = async () => {
    if (!content.trim()) return;

    setIsRefining(true);

    try {
      const response = await api.post("/refine", { rant: content });
      setContent(response.data?.refinedText || content);
    } catch {
      setError("Refine failed.");
    } finally {
      setIsRefining(false);
    }
  };

  // Handle File Selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  // Publish Post
  const handlePublish = async () => {
    if (!content.trim()) return;

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("title", `${contentType} - ${new Date().toLocaleDateString()}`);
      formData.append("content", content);
      formData.append("anonymityLevel", safetyLevel);
      formData.append("tags", [contentType]);
      if (mediaFile) {
        formData.append("media", mediaFile);
      }

      const response = await api.post("/posts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      navigate(`/posts/${response.data._id}`);
    } catch (err) {
      console.error("X Publish Error:", err);
      console.error("X Response Data:", err.response?.data);
      setError(err.response?.data?.message || "Failed to publish post.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex-1 w-full px-4 md:px-6 pb-12 relative flex flex-col h-[calc(100vh-6rem)] relative bg-[#F5F5F0]">
        {/* Full-width Mesh Background */}
        <div className="bg-mesh-gradient" />

        {/* MASTER CONTAINER */}
        <div className="w-full max-w-6xl mx-auto flex-1 rounded-3xl border border-black/5 bg-white/40 backdrop-blur-xl shadow-sm overflow-y-auto no-scrollbar p-6 md:p-10 relative z-10 flex flex-col gap-12">
          <div className="max-w-3xl mx-auto w-full flex flex-col gap-16">

            {/* HEADER */}
            <div className="text-center space-y-3">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-charcoal">
                Write Reflection
              </h1>
              <p className="text-charcoal/80 text-lg">
                Share your thoughts, document learnings, or vent safely.
              </p>
            </div>

            {/* EDITOR CARD */}
            <div className="bg-white border border-black/5 rounded-2xl p-6 md:p-10 shadow-sm relative overflow-hidden">

              {/* Slider */}
              <div className="mb-8">
                <p className="text-sm mb-3 text-charcoal font-medium">
                  Psychological Safety Level
                </p>

                <input
                  type="range"
                  min="1"
                  max="3"
                  value={safetyLevel}
                  onChange={(e) => setSafetyLevel(parseInt(e.target.value))}
                  className="w-full accent-[#1A1A1A] hover:accent-black transition cursor-pointer"
                />

                <div className="flex justify-between text-xs text-charcoal/80 mt-3 px-1">
                  <div className="flex flex-col items-center">
                    <span className={`font-bold text-lg ${safetyLevel === 1 ? 'text-earth-green' : ''}`}>1</span>
                    <span>Public</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className={`font-bold text-lg ${safetyLevel === 2 ? 'text-earth-green' : ''}`}>2</span>
                    <span>Team</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className={`font-bold text-lg ${safetyLevel === 3 ? 'text-earth-green' : ''}`}>3</span>
                    <span>Anonymous</span>
                  </div>
                </div>
              </div>

              <textarea
                placeholder="What's on your mind?..."
                className="w-full min-h-[250px] bg-earth-surface border border-[#d6c6a8] rounded-2xl p-6 text-charcoal placeholder:text-charcoal/80 text-base resize-none focus:outline-none focus:border-earth-green focus:ring-2 focus:ring-earth-green/50 transition leading-relaxed shadow-sm"
                value={content}
                onChange={handleContentChange}
              />

              {/* Media Upload & Preview */}
              <div className="mt-6">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/*,video/*"
                />

                {mediaPreview ? (
                  <div className="relative w-fit mt-2">
                    {mediaFile?.type.startsWith("video") ? (
                      <video
                        src={mediaPreview}
                        controls
                        className="max-h-60 rounded-xl border border-black/5 shadow-sm"
                      />
                    ) : (
                      <img
                        src={mediaPreview}
                        alt="Preview"
                        className="max-h-60 rounded-xl border border-black/5 shadow-sm"
                      />
                    )}
                    <button
                      onClick={() => {
                        setMediaFile(null);
                        setMediaPreview(null);
                      }}
                      className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold shadow-[0_0_10px_rgba(239,68,68,0.5)] hover:scale-110 transition"
                    >
                      X
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current.click()}
                    className="flex items-center justify-center gap-2 px-6 py-4 rounded-full bg-earth-surface text-earth-green hover:bg-[#d6c6a8] hover:text-charcoal transition text-sm font-bold shadow-sm cursor-pointer w-fit"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Add Image / Video
                  </button>
                )}
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row justify-between gap-6 mt-12 w-full">
                <button
                  onClick={handleAiRefine}
                  disabled={isRefining}
                  className="flex-1 py-4 rounded-full font-bold text-white bg-charcoal hover:bg-black transition disabled:opacity-50 shadow-sm cursor-pointer"
                >
                  {isRefining ? "Refining..." : "Make Constructive (AI)"}
                </button>

                <button
                  onClick={handlePublish}
                  disabled={loading || (harshScore.intensity === "harsh" && harshScore.score > 0.7)}
                  className={`flex-1 py-4 rounded-full font-bold text-white transition disabled:opacity-50 cursor-pointer ${harshScore.intensity === "harsh" && harshScore.score > 0.7
                    ? "bg-[#4A4A4A] cursor-not-allowed"
                    : "bg-[#8C7851] hover:bg-[#A39066] shadow-sm"
                    }`}
                >
                  {loading ? "Publishing..." : "Publish Post"}
                </button>
              </div>

              {error && (
                <div className="mt-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-sm text-center">
                  {error}
                </div>
              )}
            </div>

            {/* HARSH CONTENT CHECK */}
            {harshScore.score > 0 && (
              <div className={`bg-white rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-sm`}
                style={{
                  border: "1px solid",
                  borderColor: harshScore.intensity === "harsh" ? "rgba(239,68,68,0.5)" : harshScore.intensity === "moderate" ? "rgba(245, 199, 106, 0.4)" : "rgba(0, 0, 0, 0.05)",
                  boxShadow: harshScore.intensity === "harsh" ? "0 4px 12px rgba(239,68,68,0.05)" : "var(--tw-shadow)"
                }}
              >
                <h2 className="text-xl font-semibold mb-5 flex items-center gap-2 text-[#1A1A1A]">
                  <Shield className="w-6 h-6 text-[#1A1A1A]" /> Content Safety Check
                </h2>

                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-charcoal/80 font-medium">Harshness Meter</span>
                    <span className="text-lg font-bold"
                      style={{ color: harshScore.intensity === "harsh" ? "#EF4444" : harshScore.intensity === "moderate" ? "#F5C76A" : "#8C7851" }}>
                      {(harshScore.score * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full h-3 bg-black/5 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${harshScore.score * 100}%`,
                        backgroundColor: harshScore.intensity === "harsh" ? "#EF4444" : harshScore.intensity === "moderate" ? "#F5C76A" : "#8C7851"
                      }}
                    />
                  </div>
                </div>

                {harshScore.words.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-charcoal/80 mb-3">Detected keywords:</p>
                    <div className="flex flex-wrap gap-2">
                      {harshScore.words.map((w, idx) => (
                        <span key={idx} className="px-3 py-1.5 text-xs font-semibold rounded-md bg-white border border-black/5 text-charcoal shadow-sm">
                          {w.word} <span className="opacity-50 ml-1">Ã—{w.count}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {harshScore.intensity === "harsh" && (
                  <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                    <p className="text-sm text-red-400 font-medium">
                      <span className="font-bold">Recommendation:</span> Consider using the "Make Constructive (AI)" button to tone this down. High harshness scores will prevent publishing.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* AI PERSONA AREA */}
            <div className="bg-white border border-black/5 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-8 shadow-sm">
              {/* Personas Sidebar */}
              <div className="w-full md:w-1/3">
                <h2 className="text-xl font-semibold mb-5 text-charcoal">AI Advisors</h2>
                <div className="flex flex-col gap-3">
                  {personas.map((p, index) => {
                    const accent = accentColors[index];
                    const isActive = selectedPersona === p.key;

                    return (
                      <button
                        key={p.key}
                        onClick={() => setSelectedPersona(p.key)}
                        className={`relative flex items-center p-4 rounded-xl border transition-all duration-300 ${isActive ? 'bg-[#1A1A1A] border-[#1A1A1A] shadow-md' : 'bg-white border-black/10 hover:bg-[#F5F5F0]'}`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg mr-4 shadow-sm ${isActive ? 'text-[#1A1A1A] bg-white' : 'text-[#1A1A1A] bg-[#F5F5F0]'}`}>
                          {p.label[0]}
                        </div>
                        <span className={`font-semibold text-left ${isActive ? 'text-white' : 'text-[#1A1A1A]'}`}>
                          {p.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Feedback Content */}
              <div className="w-full md:w-2/3 flex flex-col">
                <h2 className="text-xl font-semibold mb-5 text-zinc-400">
                  <span style={{ color: accentColors[personas.findIndex((p) => p.key === selectedPersona)] }}>
                    {personas.find((p) => p.key === selectedPersona)?.label}
                  </span> Feedback
                </h2>

                {/* HEYGEN AVATAR */}
                <div className="w-full h-48 sm:h-64 bg-charcoal rounded-2xl mb-5 overflow-hidden relative border border-earth-green shadow-inner p-4 flex items-center justify-center">
                  <PersonaAvatar
                    persona={selectedPersona}
                    textToSpeak={liveAiFeedback[selectedPersona]}
                  />
                </div>

                <div className="w-full bg-white border border-earth-green/30 rounded-2xl p-6 flex-1 text-charcoal min-h-[150px] shadow-sm text-base leading-relaxed">
                  {feedbackLoading ? (
                    <div className="flex flex-col items-center justify-center h-full text-charcoal gap-3 opacity-80">
                      <div className="w-6 h-6 border-b-2 border-l-2 border-charcoal rounded-full animate-spin" />
                      <span className="animate-pulse tracking-wide font-medium">Analyzing narrative...</span>
                    </div>
                  ) : liveAiFeedback[selectedPersona] ? (
                    <p className="whitespace-pre-wrap">{liveAiFeedback[selectedPersona]}</p>
                  ) : content.length > 50 ? (
                    <div className="flex flex-col items-center justify-center h-full text-charcoal/80">
                      <p className="italic mb-3">Awaiting processing.</p>
                      <button
                        onClick={() => generateLiveFeedback(content)}
                        className="text-white bg-charcoal hover:bg-black transition font-medium text-sm px-5 py-2.5 rounded-full shadow-sm"
                      >
                        Regenerate Insight
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                      <p className="text-center max-w-xs text-charcoal/80 italic text-sm">Write at least 50 characters in the editor to awaken the advisors and receive insights.</p>
                    </div>
                  )}
                </div>

                {feedbackError && (
                  <p className="text-red-400 text-sm mt-3 font-medium bg-red-500/10 px-4 py-2 rounded-lg text-center">
                    {feedbackError}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
