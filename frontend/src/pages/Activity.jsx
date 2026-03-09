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
    <div className="flex-1 w-full pb-12 relative flex flex-col pt-6 md:pt-10">
      {/* Antigravity Mesh Background */}
      <div className="bg-mesh-gradient fixed inset-0 z-[-1]" />

      {/* MASTER CONTAINER (Full width matching Feed page) */}
      <div className="w-full px-6 md:px-12 lg:px-20 relative z-10 flex flex-col md:flex-row gap-8">

        {/* ================= LEFT COLUMN - ACTIVITY FEED ================= */}
        <div className="flex-[3] space-y-6">
          <div className="bg-white border border-black/5 rounded-2xl shadow-sm p-6 lg:p-8 min-h-[50vh]">
            <h2 className="text-xl font-bold mb-6 text-[#1A1A1A]">Recent Activity</h2>

            {loading ? (
              <div className="text-[#1A1A1A]/80 font-medium animate-pulse text-center py-10">
                Loading activity...
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-[#1A1A1A]/80 font-medium text-center py-10">
                No activity found.
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map((item, index) => (
                  <div
                    key={index}
                    className="relative bg-white rounded-2xl p-5 border border-gray-100 shadow-sm overflow-hidden hover:scale-[1.01] hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[#E5E5E5] text-[#1A1A1A] text-lg font-bold border border-black/5 shadow-sm shrink-0">
                        {item.initial}
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[#1A1A1A] font-medium text-sm md:text-base leading-relaxed truncate whitespace-normal">
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

        {/* ================= RIGHT SIDEBAR - FILTERS ================= */}
        <div className="flex-[1] space-y-6 pl-0">

          {/* SEARCH FILTER */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 p-5 md:p-6 relative overflow-hidden group w-full border-l-4 border-l-[#8C7851]">
            <h3 className="text-lg font-bold mb-4 text-[#1A1A1A]">Search Activity</h3>
            <input
              type="text"
              placeholder="Search by name or action..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-black/10 bg-[#F5F5F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#8C7851]/30 text-charcoal"
            />
          </div>

          {/* DATE FILTER */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 p-5 md:p-6 relative overflow-hidden group w-full border-l-4 border-l-[#8C7851]">
            <h3 className="text-lg font-bold mb-4 text-[#1A1A1A]">Filter by Date</h3>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-black/10 bg-[#F5F5F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#8C7851]/30 text-charcoal"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter("")}
                className="mt-3 w-full text-xs text-center text-charcoal/60 hover:text-charcoal underline"
              >
                Clear Date Filter
              </button>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}