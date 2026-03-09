import { Brain, CheckSquare, Target, HelpCircle } from "lucide-react";

export default function MeetingInsights({ insights }) {
    const { keyPoints = [], decisions = [], actionItems = [], questions = [] } = insights;

    const InsightSection = ({ title, icon: Icon, items, colorClass }) => {
        if (items.length === 0) return null;

        return (
            <div className="mb-6 animate-in slide-in-from-right fade-in duration-300">
                <h3 className={`text-sm font-semibold flex items-center gap-2 mb-3 ${colorClass}`}>
                    <Icon className="w-4 h-4" />
                    {title}
                </h3>
                <ul className="space-y-2">
                    {items.map((item, index) => (
                        <li
                            key={index}
                            className="text-sm bg-white/5 border border-white/10 rounded-lg p-3 text-white/90 leading-relaxed shadow-sm block animate-in fade-in zoom-in-95 duration-200"
                        >
                            {item}
                        </li>
                    ))}
                </ul>
            </div>
        );
    };

    return (
        <div className="w-[320px] h-full bg-[#111] border-l border-white/10 flex flex-col overflow-hidden text-white shrink-0">
            <div className="p-5 border-b border-white/10 bg-[#1A1A1A] shrink-0">
                <h2 className="text-lg font-bold flex items-center gap-2">
                    <Brain className="w-5 h-5 text-indigo-400" />
                    Meeting Insights
                </h2>
                <p className="text-xs text-white/50 mt-1">
                    Listening for decisions, tasks, and questions in English...
                </p>
            </div>

            <div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                {keyPoints.length === 0 &&
                    decisions.length === 0 &&
                    actionItems.length === 0 &&
                    questions.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-4">
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                            <Brain className="w-6 h-6" />
                        </div>
                        <p className="text-sm">Speak in English to generate live insights...</p>
                    </div>
                ) : (
                    <div className="pb-4">
                        <InsightSection
                            title="Decisions"
                            icon={Target}
                            items={decisions}
                            colorClass="text-green-400"
                        />
                        <InsightSection
                            title="Action Items"
                            icon={CheckSquare}
                            items={actionItems}
                            colorClass="text-amber-400"
                        />
                        <InsightSection
                            title="Key Points"
                            icon={Brain}
                            items={keyPoints}
                            colorClass="text-blue-400"
                        />
                        <InsightSection
                            title="Questions"
                            icon={HelpCircle}
                            items={questions}
                            colorClass="text-rose-400"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
