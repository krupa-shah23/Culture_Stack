import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Brain, ArrowLeft, Calendar, FileText, CheckSquare, Target, HelpCircle } from "lucide-react";
import api from "../api/axios";

export default function LiveInsights() {
    const [insight, setInsight] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch the single most recent meeting insight for the logged-in user
        const fetchLatestInsight = async () => {
            try {
                const response = await api.get("/insights");
                // Sorts descending by date naturally from the backend
                if (response.data && response.data.length > 0) {
                    setInsight(response.data[0]);
                }
            } catch (error) {
                console.error("Failed to fetch latest insight:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLatestInsight();
    }, []);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit"
        });
    };

    return (
        <div className="flex-1 w-full max-w-7xl mx-auto px-6 md:px-12 py-10">
            <div className="flex items-center gap-4 mb-8">
                <Link
                    to="/meet"
                    className="p-2 hover:bg-black/5 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-charcoal" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-charcoal flex items-center gap-3">
                        <Brain className="w-8 h-8 text-black" /> Live Insights
                    </h1>
                    <p className="text-charcoal/60 mt-1">Review the extracted knowledge from your most recent meeting.</p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
                </div>
            ) : !insight ? (
                <div className="bg-white rounded-2xl border border-black/5 p-12 text-center text-charcoal/60">
                    <Brain className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p className="text-lg">No active meeting insights available.</p>
                    <p className="text-sm mt-2">Join a meeting and speak in English to generate live insights.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-black/5 p-8 shadow-sm">
                    <div className="flex justify-between items-start mb-8 pb-6 border-b border-black/5">
                        <div>
                            <h2 className="text-2xl font-bold text-charcoal">Room: {insight.roomName}</h2>
                            <p className="text-charcoal/50 flex items-center gap-2 mt-2">
                                <Calendar className="w-4 h-4" /> {formatDate(insight.createdAt)}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {insight.keyPoints?.length > 0 && (
                            <div>
                                <h3 className="text-lg font-bold text-blue-600 flex items-center gap-2 mb-4">
                                    <FileText className="w-5 h-5" /> Key Points
                                </h3>
                                <ul className="list-disc pl-5 space-y-2 text-charcoal/80">
                                    {insight.keyPoints.map((point, i) => (
                                        <li key={i}>{point}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {insight.decisions?.length > 0 && (
                            <div>
                                <h3 className="text-lg font-bold text-green-600 flex items-center gap-2 mb-4">
                                    <Target className="w-5 h-5" /> Decisions
                                </h3>
                                <ul className="list-disc pl-5 space-y-2 text-charcoal/80">
                                    {insight.decisions.map((decision, i) => (
                                        <li key={i}>{decision}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {insight.actionItems?.length > 0 && (
                            <div>
                                <h3 className="text-lg font-bold text-amber-600 flex items-center gap-2 mb-4">
                                    <CheckSquare className="w-5 h-5" /> Action Items
                                </h3>
                                <ul className="list-disc pl-5 space-y-2 text-charcoal/80">
                                    {insight.actionItems.map((item, i) => (
                                        <li key={i}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {insight.questions?.length > 0 && (
                            <div>
                                <h3 className="text-lg font-bold text-rose-600 flex items-center gap-2 mb-4">
                                    <HelpCircle className="w-5 h-5" /> Questions
                                </h3>
                                <ul className="list-disc pl-5 space-y-2 text-charcoal/80">
                                    {insight.questions.map((question, i) => (
                                        <li key={i}>{question}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
