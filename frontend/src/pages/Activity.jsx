import { useEffect, useState } from "react";
import { getActivities } from "../api/axios";

export default function Activity() {
  const [activities, setActivities] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const data = await getActivities();

        const formatted = (data || []).map((a) => ({
          text: a.text,
          time: new Date(a.createdAt),
          timeDisplay: new Date(a.createdAt).toLocaleString(),
          initial: (a.user?.fullName?.[0] || "?").toUpperCase(),
          name: a.user?.fullName || "Unknown",
        }));

        setActivities(formatted);
        setFiltered(formatted);
      } catch (err) {
        console.error("Failed to load activities", err);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  // Filtering logic
  useEffect(() => {
    let result = [...activities];

    if (search) {
      result = result.filter(
        (a) =>
          a.text.toLowerCase().includes(search.toLowerCase()) ||
          a.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (dateFilter) {
      const selectedDate = new Date(dateFilter).toDateString();
      result = result.filter(
        (a) => new Date(a.time).toDateString() === selectedDate
      );
    }

    setFiltered(result);
  }, [search, dateFilter, activities]);

  return (
    <div className="flex-1 w-full px-4 md:px-6 pb-12 flex flex-col h-[calc(100vh-6rem)] bg-[#F5F5F0]">

      {/* MASTER CONTAINER */}
      <div className="w-full max-w-6xl mx-auto flex-1 flex flex-col rounded-3xl border border-black/5 bg-white/40 backdrop-blur-xl shadow-sm overflow-y-auto no-scrollbar p-6 md:p-10">

        <div className="max-w-5xl mx-auto w-full space-y-6">

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">

            {/* Search */}
            <input
              type="text"
              placeholder="Search by name or activity..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full md:w-1/2 px-4 py-2 rounded-xl border border-black/10 bg-white focus:outline-none focus:ring-2 focus:ring-[#8C7851]/30"
            />

            {/* Date Filter */}
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 rounded-xl border border-black/10 bg-white focus:outline-none focus:ring-2 focus:ring-[#8C7851]/30"
            />

          </div>

          {/* Activity Feed */}
          {loading ? (
            <div className="text-[#1A1A1A]/80 font-medium animate-pulse">
              Loading activity...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-[#1A1A1A]/80 font-medium">
              No activity found.
            </div>
          ) : (
            <div className="space-y-5">

              {filtered.map((item, index) => (
                <div
                  key={index}
                  className="relative bg-white rounded-2xl p-6 border border-gray-100 border-l-4 shadow-sm overflow-hidden hover:scale-[1.01] hover:shadow-md transition-all duration-300"
                  style={{ borderLeftColor: "#8C7851" }}
                >

                  <div className="flex items-center gap-4 pl-3">

                    {/* Avatar */}
                    <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[#E5E5E5] text-[#1A1A1A] text-lg font-bold border border-black/5 shadow-sm">
                      {item.initial}
                    </div>

                    {/* Text */}
                    <div className="flex-1">
                      <p className="text-[#1A1A1A] font-medium text-sm md:text-base leading-relaxed">
                        {item.text}
                      </p>

                      <p className="text-[#1A1A1A]/70 text-xs mt-1.5 font-medium">
                        {item.name} • {item.timeDisplay}
                      </p>
                    </div>

                  </div>

                </div>
              ))}

            </div>
          )}

        </div>
      </div>

    </div>
  );
}