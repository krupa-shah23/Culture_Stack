import { useEffect, useState } from "react";
import Navbar from "../components/layout/Navbar";
import { getActivities } from "../api/axios";

export default function Activity() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const data = await getActivities();
        // Map backend data to UI format
        const formatted = (data || []).map(a => ({
          text: a.text,
          time: new Date(a.createdAt).toLocaleString(),
          color: getColorByType(a.type),
          initial: (a.user?.fullName?.[0] || '?').toUpperCase()
        }));
        setActivities(formatted);
      } catch (err) {
        console.error("Failed to load activities", err);
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, []);

  const getColorByType = (type) => {
    switch (type) {
      case 'post': return '#8C7851'; // Muted Gold
      case 'comment': return '#A49673'; // Lighter Gold
      case 'podcast': return '#1A1A1A'; // Charcoal
      case 'vote': return '#EBE8E0'; // Beige
      case 'ai_feedback': return '#4A4A4A'; // Gray
      default: return '#8C7851'; // Muted Gold
    }
  };

  return (
    <div className="flex-1 w-full px-4 md:px-6 pb-12 relative flex flex-col h-[calc(100vh-6rem)] relative bg-[#F5F5F0]">
      {/* MASTER CONTAINER */}
      <div className="w-full max-w-6xl mx-auto flex-1 flex flex-col rounded-3xl border border-black/5 bg-white/40 backdrop-blur-xl shadow-sm overflow-y-auto no-scrollbar p-6 md:p-10 relative z-10">
        <div className="max-w-5xl mx-auto w-full space-y-8">

          {/* Page Header */}
          <div>
            <h1 className="text-4xl font-bold mb-2 tracking-tight text-[#1A1A1A]">
              Activity Log
            </h1>
            <p className="text-[#1A1A1A]/80 font-medium">
              Track updates from your reflections, AI feedback, and team podcasts.
            </p>
          </div>

          {/* Activity Feed */}
          {loading ? (
            <div className="text-[#1A1A1A]/80 font-medium animate-pulse">Loading activity...</div>
          ) : activities.length === 0 ? (
            <div className="text-[#1A1A1A]/80 font-medium">No activity yet.</div>
          ) : (
            <div className="space-y-5">
              {activities.map((item, index) => (
                <div
                  key={index}
                  className="relative bg-white rounded-2xl p-6 
                  border border-black/5 shadow-sm overflow-hidden 
                  hover:scale-[1.01] hover:shadow-md transition-all duration-300"
                >
                  {/* Accent Strip */}
                  <div
                    className="absolute left-0 top-0 h-full w-[6px] shadow-[inset_-2px_0_5px_rgba(0,0,0,0.05)]"
                    style={{ backgroundColor: item.color }}
                  />

                  {/* Content */}
                  <div className="flex items-center gap-4 pl-3">
                    {/* Icon Bubble */}
                    <div
                      className="w-12 h-12 flex items-center justify-center 
                      rounded-full text-xl font-bold border border-black/5 shadow-sm mt-1"
                      style={{
                        backgroundColor: item.color,
                        color: item.color === '#EBE8E0' ? '#1A1A1A' : '#FFFFFF',
                      }}
                    >
                      {item.initial}
                    </div>

                    {/* Text */}
                    <div className="flex-1">
                      <p className="text-[#1A1A1A] font-medium text-sm md:text-base leading-relaxed">
                        {item.text}
                      </p>
                      <p className="text-[#1A1A1A]/80 text-xs mt-1.5 font-semibold tracking-wide">
                        {item.time}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty Future Note */}
          <p className="text-[#1A1A1A]/80 italic text-sm pt-4 font-medium">
            More activity events will appear here as your team engages.
          </p>
        </div>
      </div>
    </div>
  );
}
