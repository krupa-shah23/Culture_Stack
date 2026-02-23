import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import Navbar from "../components/layout/Navbar";
import PersonaAvatar from "../components/layout/PersonaAvatar";
import { calculateHarshScore } from "../utils/harshWordDetector";

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

  // Pastel Accent Palette
  const accentColors = [
    "#7FE6C5", // Mint - Innovator
    "#F28B82", // Coral Pink - Risk Evaluator
    "#4BA9FF", // Sky Blue - Strategist
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
      setFeedbackError("Server failed — using fallback feedback");
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
        headers: { "Content-Type": undefined },
      });

      navigate(`/posts/${response.data._id}`);
    } catch (err) {
      console.error("❌ Publish Error:", err);
      console.error("❌ Response Data:", err.response?.data);
      setError(err.response?.data?.message || "Failed to publish post.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>

      <div className="h-[calc(100vh-90px)] bg-[#1C1D25] text-white px-6 py-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT EDITOR */}
          <div className="lg:col-span-2 bg-[#2A2C38] rounded-2xl p-6 border border-white/5 shadow-md">

            <h1 className="text-2xl font-semibold mb-6">
              Write Reflection
            </h1>

            {/* Slider */}
            <div className="mb-6">
              <p className="text-sm mb-2 text-gray-300">
                Psychological Safety Level
              </p>

              <input
                type="range"
                min="1"
                max="3"
                value={safetyLevel}
                onChange={(e) => setSafetyLevel(parseInt(e.target.value))}
                className="w-full accent-[#7FE6C5]"
              />

              <div className="flex justify-between text-xs text-gray-400 mt-2 px-1">
                <div className="flex flex-col items-center">
                  <span className="font-bold">1</span>
                  <span>Public</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="font-bold">2</span>
                  <span>Team</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="font-bold">3</span>
                  <span>Anonymous</span>
                </div>
              </div>
            </div>

            <textarea
              placeholder="Write your thoughts..."
              className="w-full h-52 bg-[#1C1D25] 
  border border-white/10 rounded-xl 
  p-4 text-gray-200 text-sm resize-none 
  mt-4"
              value={content}
              onChange={handleContentChange}
            />

            {/* Media Upload & Preview */}
            <div className="mt-4">
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
                      className="max-h-40 rounded-lg border border-white/10"
                    />
                  ) : (
                    <img
                      src={mediaPreview}
                      alt="Preview"
                      className="max-h-40 rounded-lg border border-white/10"
                    />
                  )}
                  <button
                    onClick={() => {
                      setMediaFile(null);
                      setMediaPreview(null);
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1C1D25] border border-white/10 text-gray-300 hover:text-white hover:border-white/30 transition text-sm"
                >
                  ➕ Add Image / Video
                </button>
              )}
            </div>


            {/* Buttons */}
            <div className="flex justify-between gap-5 mt-8 w-full">

              {/* Make Constructive (Pastel Pink) */}
              <button
                onClick={handleAiRefine}
                disabled={isRefining}
                className="w-1/2 py-3 rounded-lg font-semibold text-sm 
    transition disabled:opacity-50"
                style={{
                  backgroundColor: "#F28B82",
                  color: "black",
                }}
              >
                {isRefining ? "Refining..." : "Make Constructive"}
              </button>

              {/* Publish (Pastel Yellow) */}
              <button
                onClick={handlePublish}
                disabled={loading || (harshScore.intensity === "harsh" && harshScore.score > 0.7)}
                className="w-1/2 py-3 rounded-lg font-semibold text-sm 
    transition disabled:opacity-50"
                style={{
                  backgroundColor: harshScore.intensity === "harsh" ? "#999" : "#F5C76A",
                  color: "black",
                }}
              >
                {loading ? "Publishing..." : " Publish"}
              </button>


            </div>


            {error && (
              <p className="text-red-400 text-sm mt-4">{error}</p>
            )}
          </div>

          {/* RIGHT SIDE */}
          <div className="space-y-6">

            {/* Harsh Word Detection Score */}
            <div
              className="bg-[#2A2C38] rounded-2xl p-6 border shadow-md"
              style={{
                borderColor:
                  harshScore.intensity === "harsh" ? "#F28B82" :
                    harshScore.intensity === "moderate" ? "#F5C76A" :
                      harshScore.intensity === "caution" ? "#FFD166" :
                        "#7FE6C5"
              }}
            >
              <h2 className="text-lg font-semibold mb-4">Content Safety Check</h2>

              {/* Score Bar */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400">Harshness Score</span>
                  <span
                    className="text-lg font-bold"
                    style={{
                      color:
                        harshScore.intensity === "harsh" ? "#F28B82" :
                          harshScore.intensity === "moderate" ? "#F5C76A" :
                            harshScore.intensity === "caution" ? "#FFD166" :
                              "#7FE6C5"
                    }}
                  >
                    {(harshScore.score * 100).toFixed(0)}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-[#1C1D25] rounded-full overflow-hidden border border-white/10">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${harshScore.score * 100}%`,
                      backgroundColor:
                        harshScore.intensity === "harsh" ? "#F28B82" :
                          harshScore.intensity === "moderate" ? "#F5C76A" :
                            harshScore.intensity === "caution" ? "#FFD166" :
                              "#7FE6C5"
                    }}
                  />
                </div>
              </div>

              {/* Intensity Badge */}
              <div className="mb-4">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold"
                  style={{
                    backgroundColor:
                      harshScore.intensity === "harsh" ? "rgba(242, 139, 130, 0.2)" :
                        harshScore.intensity === "moderate" ? "rgba(245, 199, 106, 0.2)" :
                          harshScore.intensity === "caution" ? "rgba(255, 209, 102, 0.2)" :
                            "rgba(127, 230, 197, 0.2)",
                    color:
                      harshScore.intensity === "harsh" ? "#F28B82" :
                        harshScore.intensity === "moderate" ? "#F5C76A" :
                          harshScore.intensity === "caution" ? "#FFD166" :
                            "#7FE6C5"
                  }}
                >
                  {harshScore.intensity === "safe" ? "✅ Safe" :
                    harshScore.intensity === "caution" ? "⚠️ Caution" :
                      harshScore.intensity === "moderate" ? "🔔 Moderate" :
                        "⛔ Harsh"}
                </span>
              </div>

              {/* Harsh Words Found */}
              {harshScore.words.length > 0 && (
                <div className="mb-4 p-3 bg-[#1C1D25] rounded-lg border border-white/10">
                  <p className="text-xs text-gray-400 mb-2">Harsh words detected:</p>
                  <div className="flex flex-wrap gap-2">
                    {harshScore.words.map((w, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 text-xs rounded bg-white/10 text-gray-200"
                      >
                        {w.word} <span className="text-gray-500">×{w.count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendation */}
              {harshScore.intensity === "harsh" && (
                <div className="p-3 bg-[#F28B82]/10 border border-[#F28B82]/30 rounded-lg">
                  <p className="text-xs text-[#F28B82] font-semibold">
                    💡 Recommendation: Consider using the "Make Constructive" button to tone this down before posting.
                  </p>
                </div>
              )}

              {harshScore.intensity === "moderate" && (
                <div className="p-3 bg-[#F5C76A]/10 border border-[#F5C76A]/30 rounded-lg">
                  <p className="text-xs text-[#F5C76A] font-semibold">
                    💡 Tip: This post contains moderately strong language. Consider refining it for a better tone.
                  </p>
                </div>
              )}
            </div>

            {/* Persona Selector */}
            <div className="bg-[#2A2C38] rounded-2xl p-6 border border-white/5 shadow-md">
              <h2 className="text-lg font-semibold mb-5">
                AI Personas
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {personas.map((p, index) => {
                  const accent = accentColors[index];
                  const isActive = selectedPersona === p.key;

                  return (
                    <button
                      key={p.key}
                      onClick={() => setSelectedPersona(p.key)}
                      className="relative flex flex-col items-center justify-center 
                      h-[85px] w-full border border-white/10 transition-all duration-200"
                      style={{
                        borderRadius: "12px",
                        backgroundColor: isActive ? accent : "#242631",
                        color: isActive ? "black" : "white",
                      }}
                    >
                      {/* Accent Strip */}
                      <div
                        className="absolute left-0 top-0 h-full w-[6px]"
                        style={{
                          backgroundColor: accent,
                          borderRadius: "12px 0 0 12px",
                        }}
                      />

                      <div className="text-xl mb-1">{p.label[0]}</div>
                      <span className="text-sm font-semibold">
                        {p.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Feedback Box */}
            <div className="bg-[#2A2C38] rounded-2xl p-6 border border-white/5 shadow-md w-full">
              <h2 className="text-lg font-semibold mb-4">
                {personas.find((p) => p.key === selectedPersona)?.label} Feedback
              </h2>

              {/* HEYGEN AVATAR */}
              <div className="w-full h-64 bg-black rounded-xl mb-4 overflow-hidden relative">
                <PersonaAvatar
                  persona={selectedPersona}
                  textToSpeak={liveAiFeedback[selectedPersona]}
                />
              </div>

              <div
                className="w-full bg-[#1C1D25] border border-white/10 rounded-xl 
                p-6 min-h-[170px] text-gray-300 overflow-y-auto"
              >
                {feedbackLoading ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2">
                    <span className="animate-pulse">✨ Analyzing your thoughts...</span>
                  </div>
                ) : liveAiFeedback[selectedPersona] ? (
                  <p className="leading-relaxed">
                    {liveAiFeedback[selectedPersona]}
                  </p>
                ) : content.length > 50 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 italic">
                    <p>No specific feedback generated for this persona yet.</p>
                    <button
                      onClick={() => generateLiveFeedback(content)}
                      className="text-[#7FE6C5] hover:underline mt-2 text-sm not-italic"
                    >
                      Try Regenerating
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-600 italic">
                    <p>Write at least 50 characters to see AI feedback...</p>
                  </div>
                )}
              </div>

              {feedbackError && (
                <p className="text-red-400 text-sm mt-3 italic">
                  {feedbackError}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
