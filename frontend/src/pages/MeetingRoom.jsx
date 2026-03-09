import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { JitsiMeeting } from "@jitsi/react-sdk";
import axios from "../api/axios"; // Assuming api/axios is exported correctly
import MeetingInsights from "../components/meet/MeetingInsights";

export default function MeetingRoom() {
    const { roomId } = useParams();
    const navigate = useNavigate();

    const [insights, setInsights] = useState({
        keyPoints: [],
        decisions: [],
        actionItems: [],
        questions: [],
    });

    // Reference mutable state inside async event listeners
    const insightsRef = useRef(insights);
    useEffect(() => {
        insightsRef.current = insights;
    }, [insights]);

    // Speech Recognition setup
    const recognitionRef = useRef(null);

    // Get logged-in user info
    const userInfo = JSON.parse(localStorage.getItem("userInfo") || "null");
    const displayName = userInfo?.fullName || "Guest";

    useEffect(() => {
        // Setup Speech Recognition using Web Speech API
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.lang = "en-US";
            recognition.continuous = true;
            recognition.interimResults = false;

            recognition.onresult = (event) => {
                const current = event.resultIndex;
                const transcript = event.results[current][0].transcript.trim();
                extractInsights(transcript);
            };

            // Auto-restart if it drops (limitation of browser speech API is ~20s without sound)
            recognition.onend = () => {
                if (recognitionRef.current) {
                    try {
                        recognitionRef.current.start();
                    } catch (e) {
                        // Ignore already started errors
                    }
                }
            };

            recognitionRef.current = recognition;
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.onend = null;
                recognitionRef.current.stop();
                recognitionRef.current = null;
            }
        };
    }, []);

    const extractInsights = (text) => {
        if (!text) return;
        const lower = text.toLowerCase();

        if (lower.includes("we should") || lower.includes("let's") || lower.includes("decide")) {
            setInsights((prev) => ({ ...prev, decisions: [...prev.decisions, text] }));
        } else if (lower.includes("action") || lower.includes("task") || lower.includes("assign") || lower.includes("follow up")) {
            setInsights((prev) => ({ ...prev, actionItems: [...prev.actionItems, text] }));
        } else if (lower.includes("important") || lower.includes("key") || lower.includes("main point")) {
            setInsights((prev) => ({ ...prev, keyPoints: [...prev.keyPoints, text] }));
        } else if (text.includes("?")) {
            setInsights((prev) => ({ ...prev, questions: [...prev.questions, text] }));
        }
    };

    const saveInsightsAndLeave = async () => {
        const currentInsights = insightsRef.current;

        // Check if we actually have anything to save
        const hasData =
            currentInsights.keyPoints.length > 0 ||
            currentInsights.decisions.length > 0 ||
            currentInsights.actionItems.length > 0 ||
            currentInsights.questions.length > 0;

        if (hasData) {
            try {
                await axios.post("/insights", {
                    roomName: roomId,
                    keyPoints: currentInsights.keyPoints,
                    decisions: currentInsights.decisions,
                    actionItems: currentInsights.actionItems,
                    questions: currentInsights.questions,
                });
                console.log("Successfully saved meeting insights.");
            } catch (err) {
                console.error("Failed to save insights", err);
            }
        }

        // Stop recognition
        if (recognitionRef.current) {
            recognitionRef.current.onend = null;
            recognitionRef.current.stop();
        }

        // Leave the room
        navigate("/meet");
    };

    const handleApiReady = (apiObj) => {
        apiObj.addListener("videoConferenceJoined", () => {
            // Start listening when user actually joins
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.start();
                } catch (e) {
                    console.error("Speech recognition start error", e);
                }
            }
        });

        apiObj.addListener("readyToClose", async () => {
            await saveInsightsAndLeave();
        });

        apiObj.addListener("videoConferenceLeft", async () => {
            await saveInsightsAndLeave();
        });
    };

    return (
        <div className="flex w-screen h-screen bg-black overflow-hidden relative">
            <div className="flex-1 right-0 top-0 h-full z-0 overflow-hidden relative">
                <JitsiMeeting
                    domain="meet.jit.si"
                    roomName={roomId}
                    configOverwrite={{
                        startWithAudioMuted: false,
                        startWithVideoMuted: false,
                        prejoinPageEnabled: true,
                        disableAudioLevels: false,
                        enableWelcomePage: false,
                        resolution: 720,
                    }}
                    interfaceConfigOverwrite={{
                        SHOW_JITSI_WATERMARK: false,
                        SHOW_WATERMARK_FOR_GUESTS: false,
                        DEFAULT_BACKGROUND: "#000000",
                        DEFAULT_REMOTE_DISPLAY_NAME: "Participant",
                    }}
                    userInfo={{
                        displayName: displayName,
                    }}
                    onApiReady={handleApiReady}
                    getIFrameRef={(iframeRef) => {
                        iframeRef.style.height = "100%";
                        iframeRef.style.width = "100%";
                    }}
                />
            </div>

            {/* 320px Meeting Insights Panel */}
            <MeetingInsights insights={insights} />
        </div>
    );
}
