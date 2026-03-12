import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getUserProfile } from "../api/axios";
import ProfileSidebar from "../components/layout/ProfileSidebar";

export default function ProfileSettings() {
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                await getUserProfile(id);
            } catch (err) {
                console.error("Failed to load profile for settings", err);
                setError("Failed to load user profile.");
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
                        <ProfileSidebar activeTab="settings" />
                    </div>
                    <div className="flex-[3] space-y-6">
                        <div className="bg-white border border-black/5 rounded-2xl shadow-sm p-6 lg:p-8 min-h-[50vh] flex items-center justify-center">
                            <div className="text-[#1A1A1A]/80 font-medium animate-pulse">Loading settings...</div>
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
                    <ProfileSidebar activeTab="settings" />
                </div>

                {/* ================= RIGHT MAIN CONTENT ================= */}
                <div className="flex-[3] space-y-6">
                    <div className="bg-white border border-black/5 rounded-2xl shadow-sm p-6 lg:p-8 min-h-[50vh]">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-[#1A1A1A]">Settings</h2>
                        </div>
                        {error ? (
                            <div className="text-red-500 font-medium text-center py-10">{error}</div>
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-[#1A1A1A]/80 font-medium">Settings panel is under construction.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
