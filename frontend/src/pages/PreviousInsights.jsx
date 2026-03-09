import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Brain, ArrowLeft, Calendar, FileText, CheckSquare, Target, HelpCircle } from "lucide-react";
import api from "../api/axios";

export default function PreviousInsights() {
    const [insights, setInsights] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInsights = async () => {
            try {
                const response = await api.get("/insights");
                setInsights(response.data);
            } catch (error) {
                console.error("Failed to fetch previous insights:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchInsights();
    }, []);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
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
                        <Brain className="w-8 h-8 text-black" /> Previous Insights
                    </h1>
                    <p className="text-charcoal/60 mt-1">Review extracted knowledge from your past meetings.</p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
                </div>
            ) : insights.length === 0 ? (
                <div className="bg-white rounded-2xl border border-black/5 p-12 text-center text-charcoal/60">
                    <Brain className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p className="text-lg">No meeting insights recorded yet.</p>
                    <p className="text-sm mt-2">Insights are automatically saved when you use the Meeting Room in English.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {insights.map((insight) => (
                        <div
                            key={insight._id}
                            className="bg-white rounded-2xl border border-black/5 p-6 shadow-sm flex flex-col"
                        >
                            <div className="flex justify-between items-start mb-6 pb-4 border-b border-black/5">
                                <div>
                                    <h2 className="text-xl font-bold text-charcoal">Room: {insight.roomName}</h2>
                                    <p className="text-sm text-charcoal/50 flex items-center gap-2 mt-1">
                                        <Calendar className="w-4 h-4" /> {formatDate(insight.createdAt)}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {insight.keyPoints?.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-bold text-blue-600 flex items-center gap-2 mb-2">
                                            <FileText className="w-4 h-4" /> Key Points
                                        </h3>
                                        <ul className="list-disc pl-5 space-y-1 text-sm text-charcoal/80">
                                            {insight.keyPoints.map((point, i) => (
                                                <li key={i}>{point}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {insight.decisions?.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-bold text-green-600 flex items-center gap-2 mb-2">
                                            <Target className="w-4 h-4" /> Decisions
                                        </h3>
                                        <ul className="list-disc pl-5 space-y-1 text-sm text-charcoal/80">
                                            {insight.decisions.map((decision, i) => (
                                                <li key={i}>{decision}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {insight.actionItems?.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-bold text-amber-600 flex items-center gap-2 mb-2">
                                            <CheckSquare className="w-4 h-4" /> Action Items
                                        </h3>
                                        <ul className="list-disc pl-5 space-y-1 text-sm text-charcoal/80">
                                            {insight.actionItems.map((item, i) => (
                                                <li key={i}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {insight.questions?.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-bold text-rose-600 flex items-center gap-2 mb-2">
                                            <HelpCircle className="w-4 h-4" /> Questions
                                        </h3>
                                        <ul className="list-disc pl-5 space-y-1 text-sm text-charcoal/80">
                                            {insight.questions.map((question, i) => (
                                                <li key={i}>{question}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
