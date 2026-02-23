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
      case 'post': return '#4BA9FF'; // Blue
      case 'comment': return '#B9A6FF'; // Purple
      case 'podcast': return '#7FE6C5'; // Green
      case 'vote': return '#FFD166'; // Orange/Yellow - distinct from others
      case 'ai_feedback': return '#F28B82'; // Red/Pink
      default: return '#F5C76A'; // Yellow
    }
  };

  return (
    <>

      <div className="min-h-screen bg-[#1C1D25] text-white px-6 py-10">
        <div className="max-w-5xl mx-auto space-y-8">

          {/* Page Header */}
          <div>
            <h1 className="text-4xl font-bold mb-2">
              Activity Log
            </h1>
            <p className="text-gray-400">
              Track updates from your reflections, AI feedback, and team podcasts.
            </p>
          </div>

          {/* Activity Feed */}
          {loading ? (
            <div className="text-gray-400">Loading activity...</div>
          ) : activities.length === 0 ? (
            <div className="text-gray-400">No activity yet.</div>
          ) : (
            <div className="space-y-5">
              {activities.map((item, index) => (
                <div
                  key={index}
                  className="relative bg-[#242631] rounded-2xl p-6 
                  border border-white/10 shadow-md overflow-hidden 
                  hover:scale-[1.01] transition"
                >
                  {/* Accent Strip */}
                  <div
                    className="absolute left-0 top-0 h-full w-[6px]"
                    style={{ backgroundColor: item.color }}
                  />

                  {/* Content */}
                  <div className="flex items-center gap-4 pl-3">
                    {/* Icon Bubble */}
                    <div
                      className="w-12 h-12 flex items-center justify-center 
                      rounded-full text-xl font-bold"
                      style={{
                        backgroundColor: item.color,
                        color: "black",
                      }}
                    >
                      {item.initial}
                    </div>

                    {/* Text */}
                    <div className="flex-1">
                      <p className="text-gray-200 font-medium text-sm md:text-base">
                        {item.text}
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        {item.time}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty Future Note */}
          <p className="text-gray-500 italic text-sm pt-4">
            More activity events will appear here as your team engages.
          </p>
        </div>
      </div>
    </>
  );
}
