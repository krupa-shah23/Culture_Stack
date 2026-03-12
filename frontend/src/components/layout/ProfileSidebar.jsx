import { Link, useParams } from "react-router-dom";
import { User, FileText, Mic, MessageSquare, ThumbsUp, Settings } from "lucide-react";

export default function ProfileSidebar({ activeTab }) {
    const { id } = useParams();

    const links = [
        {
            id: "overview",
            label: "Overview",
            path: `/profile/${id}`,
            icon: <User className="w-5 h-5" />,
        },
        {
            id: "posts",
            label: "Posts",
            path: `/profile/${id}/posts`,
            icon: <FileText className="w-5 h-5" />,
        },
        {
            id: "podcasts",
            label: "Podcasts",
            path: `/profile/${id}/podcasts`,
            icon: <Mic className="w-5 h-5" />,
        },
        {
            id: "comments",
            label: "Comments",
            path: `/profile/${id}/comments`,
            icon: <MessageSquare className="w-5 h-5" />,
        },
        {
            id: "reactions",
            label: "Reactions",
            path: `/profile/${id}/reactions`,
            icon: <ThumbsUp className="w-5 h-5" />,
        },
        {
            id: "settings",
            label: "Settings",
            path: `/profile/${id}/settings`,
            icon: <Settings className="w-5 h-5" />,
        },
    ];

    return (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 p-5 md:p-6 sticky top-24 border-l-4 border-l-[#8C7851]">
            <h3 className="text-lg font-bold mb-6 text-[#1A1A1A]">Profile Menu</h3>
            <nav className="flex flex-col gap-2">
                {links.map((link) => {
                    const isActive = activeTab === link.id;
                    return (
                        <Link
                            key={link.id}
                            to={link.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${isActive
                                    ? "bg-[#1A1A1A] text-white"
                                    : "text-[#1A1A1A] hover:bg-black/5"
                                }`}
                        >
                            <div className={isActive ? "text-white" : "text-charcoal/70"}>
                                {link.icon}
                            </div>
                            {link.label}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
