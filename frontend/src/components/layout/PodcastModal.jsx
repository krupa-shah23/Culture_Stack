import { useEffect } from "react";
import PodcastDetail from "../../pages/PodcastDetail";

export default function PodcastModal({ podcast, onClose }) {
    // Close on Escape key
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    // Lock body scroll
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "auto";
        };
    }, []);

    if (!podcast) return null;

    return (
        <div
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 md:p-6"
            onClick={onClose}
        >
            {/* Modal Container */}
            <div
                className="bg-[#F5F5F0] rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-y-auto no-scrollbar shadow-2xl relative flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button Header */}
                <div className="sticky top-0 right-0 z-[1010] flex justify-end p-4 pointer-events-none">
                    <button
                        onClick={onClose}
                        className="w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-charcoal hover:bg-white border border-black/5 shadow-sm transition-all pointer-events-auto"
                        aria-label="Close modal"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Dynamic Content */}
                <div className="w-full h-full -mt-14 shrink-0">
                    <PodcastDetail modalPodcast={podcast} />
                </div>
            </div>
        </div>
    );
}
