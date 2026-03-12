import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getUserProfile } from "../api/axios";
import axios from "axios";
import ProfileSidebar from "../components/layout/ProfileSidebar";
import PodcastCard from "../components/layout/PodcastCard";

export default function ProfilePodcasts() {
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [podcasts, setPodcasts] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                await getUserProfile(id); // trigger side effects if any but don't store profile as it's unused

                // Fetch User Podcasts
                const res = await axios.get(`http://localhost:5000/api/podcasts/user/${id}`);
                setPodcasts(res.data);
            } catch (err) {
                console.error("Failed to load profile podcasts", err);
                setError("Failed to load podcasts.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (loading) {
        return (
            <div className="flex-1 w-full pb-12 relative flex flex-col pt-6 md:pt-10">
                <div className="bg-mesh-gradient fixed inset-0 z-[-1]" />
                <div className="w-full px-6 md:px-12 lg:px-20 relative z-10 flex flex-col md:flex-row gap-8">
                    <div className="flex-[1] space-y-6">
                        <ProfileSidebar activeTab="podcasts" />
                    </div>
                    <div className="flex-[3] space-y-6">
                        <div className="bg-white border border-black/5 rounded-2xl shadow-sm p-6 lg:p-8 min-h-[50vh] flex items-center justify-center">
                            <div className="text-[#1A1A1A]/80 font-medium animate-pulse">Loading podcasts...</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 w-full pb-12 relative flex flex-col pt-6 md:pt-10">
            <div className="bg-mesh-gradient fixed inset-0 z-[-1]" />

            <div className="w-full px-6 md:px-12 lg:px-20 relative z-10 flex flex-col md:flex-row gap-8">
                {/* ================= LEFT SIDEBAR ================= */}
                <div className="flex-[1] space-y-6">
                    <ProfileSidebar activeTab="podcasts" />
                </div>

                {/* ================= RIGHT MAIN CONTENT ================= */}
                <div className="flex-[3] space-y-6">
                    <div className="bg-white border border-black/5 rounded-2xl shadow-sm p-6 lg:p-8 min-h-[50vh]">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-[#1A1A1A]">Podcasts</h2>
                            <span className="text-sm text-charcoal/80 font-medium">{podcasts.length} total</span>
                        </div>

                        {error ? (
                            <div className="text-red-500 font-medium text-center py-10">{error}</div>
                        ) : podcasts.length === 0 ? (
                            <div className="text-[#1A1A1A]/80 font-medium text-center py-10">
                                No podcasts found.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {podcasts.map((podcast) => (
                                    <PodcastCard key={podcast._id} podcast={podcast} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
