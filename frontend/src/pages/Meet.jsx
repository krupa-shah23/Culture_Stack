import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Plus, Video, Brain, FileText, Info } from "lucide-react";
import api from "../api/axios";

export default function Meet() {
  const [createRoomName, setCreateRoomName] = useState("");
  const [joinRoomName, setJoinRoomName] = useState("");
  const [latestInsight, setLatestInsight] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLatestInsight = async () => {
      try {
        const response = await api.get("/insights");
        if (response.data && response.data.length > 0) {
          setLatestInsight(response.data[0]);
        }
      } catch (error) {
        console.error("Failed to fetch latest insight:", error);
      }
    };
    fetchLatestInsight();
  }, []);

  // Handle meeting start triggers
  const startMeeting = (e, name) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Please enter a meeting room name");
      return;
    }

    const cleanRoomName = name.toLowerCase().trim().replace(/\s+/g, "-");
    navigate(`/meet/${cleanRoomName}`);
  };

  const handleViewCurrentInsights = () => {
    if (!latestInsight) {
      alert("No recent meeting insights found.");
      return;
    }

    const insightTime = new Date(latestInsight.createdAt).getTime();
    const currentTime = new Date().getTime();
    const oneHour = 60 * 60 * 1000;

    if (currentTime - insightTime <= oneHour) {
      navigate("/insights/live");
    } else {
      alert("Current meeting insights are only available for 1 hour after the meeting ends.");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const calculateTotalInsights = (insight) => {
    if (!insight) return 0;
    return (
      (insight.keyPoints?.length || 0) +
      (insight.decisions?.length || 0) +
      (insight.actionItems?.length || 0) +
      (insight.questions?.length || 0)
    );
  };

  return (
    <div className="flex-1 w-full pb-12 relative flex flex-col pt-6 md:pt-10">
      {/* Antigravity Mesh Background */}
      <div className="bg-mesh-gradient fixed inset-0 z-[-1]" />

      {/* MASTER CONTAINER (Full width matching Feed page) */}
      <div className="w-full px-6 md:px-12 lg:px-20 relative z-10 flex flex-col md:flex-row gap-8">

        {/* ================= LEFT COLUMN ================= */}
        <div className="flex-[3] space-y-6">

          {/* CREATE A MEET */}
          <div className="bg-white border border-black/5 rounded-2xl shadow-sm p-6 lg:p-8 shrink-0">
            <h2 className="text-xl font-bold mb-2 text-[#1A1A1A] flex items-center gap-2">
              <Plus className="w-5 h-5" /> Create a New Meet
            </h2>
            <p className="text-[#1A1A1A]/80 text-sm mb-4">
              Start a new meeting with a unique room name. Share the name with others so they can join.
            </p>
            <form onSubmit={(e) => startMeeting(e, createRoomName)} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  id="createRoom"
                  type="text"
                  value={createRoomName}
                  onChange={(e) => setCreateRoomName(e.target.value)}
                  placeholder="e.g., team-standup"
                  className="
                    flex-1 px-4 py-3
                    bg-earth-bg border border-black/5 rounded-xl
                    text-charcoal placeholder-[#4A4A4A]/50
                    focus:outline-none focus:border-black/20 focus:ring-1 focus:ring-black/20
                    transition-colors shadow-sm
                  "
                />
                <button
                  type="submit"
                  className="
                    px-6 py-3 shrink-0
                    bg-[#1A1A1A] text-white font-bold rounded-xl
                    hover:bg-black hover:shadow-md transition-all
                  "
                >
                  Start Meet
                </button>
              </div>
            </form>
          </div>

          {/* JOIN AN EXISTING MEET */}
          <div className="bg-white border border-black/5 rounded-2xl shadow-sm p-6 lg:p-8 shrink-0">
            <h2 className="text-xl font-bold mb-2 text-[#1A1A1A] flex items-center gap-2">
              <Video className="w-5 h-5" /> Join Existing Meet
            </h2>
            <p className="text-[#1A1A1A]/80 text-sm mb-4">
              Already have a meeting room name? Enter it here to join the meeting.
            </p>
            <form onSubmit={(e) => startMeeting(e, joinRoomName)} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  id="joinRoom"
                  type="text"
                  value={joinRoomName}
                  onChange={(e) => setJoinRoomName(e.target.value)}
                  placeholder="e.g., team-standup"
                  className="
                    flex-1 px-4 py-3
                    bg-earth-bg border border-black/5 rounded-xl
                    text-charcoal placeholder-[#4A4A4A]/50
                    focus:outline-none focus:border-black/20 focus:ring-1 focus:ring-black/20
                    transition-colors shadow-sm
                  "
                />
                <button
                  type="submit"
                  className="
                    px-6 py-3 shrink-0
                    bg-[#1A1A1A] text-white font-bold rounded-xl
                    hover:bg-black hover:shadow-md transition-all
                  "
                >
                  Join Meet
                </button>
              </div>
            </form>
          </div>

          {/* HOW INSIGHTS WORK */}
          <div className="bg-white border border-black/5 rounded-2xl shadow-sm p-6 lg:p-8">
            <h2 className="text-xl font-bold mb-3 text-[#1A1A1A] flex items-center gap-2">
              <Info className="w-5 h-5 text-amber-500" /> How Insights Work
            </h2>
            <p className="text-charcoal/70 leading-relaxed">
              AI Meeting Insights detect important discussion points, decisions, and action items during meetings using English speech recognition. Remember to speak clearly in English to ensure the highest accuracy of recorded action items.
            </p>
          </div>

        </div>

        {/* ================= RIGHT SIDEBAR ================= */}
        <div className="flex-[1] space-y-6 pl-0">

          {/* RECENT MEETING INSIGHTS */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 p-5 md:p-6 relative overflow-hidden group w-full border-l-4 border-l-[#8C7851]">
            <h2 className="text-lg font-bold mb-4 text-[#1A1A1A] flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#8C7851]" /> Recent Meeting Analysis
            </h2>

            {latestInsight ? (
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <p className="font-semibold text-charcoal truncate">Meeting: {latestInsight.roomName}</p>
                </div>
                <p className="text-sm text-charcoal/60">Date: {formatDate(latestInsight.createdAt)}</p>
                <div className="mt-4 pt-4 border-t border-black/5">
                  <p className="text-sm font-medium text-charcoal flex items-center gap-2">
                    <Brain className="w-4 h-4 text-[#8C7851]" />
                    Insights: {calculateTotalInsights(latestInsight)} key points detected
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-charcoal/50">
                <p className="text-sm">No recent insights found.</p>
              </div>
            )}
          </div>

          {/* MEETING INSIGHTS ACTIONS */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 p-5 md:p-6 relative overflow-hidden group w-full border-l-4 border-l-[#8C7851]">
            <h2 className="text-lg font-bold mb-4 text-[#1A1A1A] flex items-center gap-2">
              <Brain className="w-5 h-5 text-[#8C7851]" /> Meeting Analysis Actions
            </h2>

            <div className="flex flex-col gap-3 mb-4">
              <button
                onClick={handleViewCurrentInsights}
                className="
                  w-full px-4 py-3 text-center text-sm
                  bg-[#1A1A1A] text-white font-bold rounded-xl
                  hover:bg-black hover:shadow-md transition-all
                "
              >
                View Current Meeting Analysis
              </button>
              <Link
                to="/insights"
                className="
                  w-full px-4 py-3 text-center text-sm
                  bg-white border border-black/10 text-charcoal font-bold rounded-xl
                  hover:bg-black/5 transition-all
                "
              >
                View Previous Meeting Analysis
              </Link>
            </div>
            <p className="text-xs text-charcoal/60 mt-4 leading-relaxed">
              * Current meeting analysis validity expires 1 hour after conclusion.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
