import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Meet() {
  const jitsiContainerRef = useRef(null);
  const [roomName, setRoomName] = useState("");
  const [meetingStarted, setMeetingStarted] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const jitsiAPIRef = useRef(null);
  const navigate = useNavigate();

  // Get logged-in user info
  const userInfo = JSON.parse(localStorage.getItem("userInfo") || "null");
  const displayName = userInfo?.fullName || "User";

  // Load Jitsi Meet external API script
  useEffect(() => {
    // Check if script already exists
    if (!window.JitsiMeetExternalAPI) {
      const script = document.createElement("script");
      script.src = "https://meet.jitsi/external_api.js";
      script.async = true;
      script.onload = () => {
        console.log("✅ Jitsi Meet API loaded successfully");
      };
      script.onerror = () => {
        console.error("❌ Failed to load Jitsi Meet API");
      };
      document.body.appendChild(script);
      console.log("📌 Loading Jitsi Meet API script...");
    } else {
      console.log("✅ Jitsi Meet API already available");
    }
  }, []);

  // Handle meeting start triggers
  const startMeeting = (e) => {
    e.preventDefault();

    if (!roomName.trim()) {
      alert("Please enter a meeting room name");
      return;
    }

    setIsJoining(true);
    setMeetingStarted(true);
  };

  // Initialize Jitsi when meetingStarted becomes true and container is ready
  useEffect(() => {
    if (!meetingStarted || !jitsiContainerRef.current || !window.JitsiMeetExternalAPI) {
      if (meetingStarted && !window.JitsiMeetExternalAPI) {
        // API not ready yet, wait/retry handled by script load, 
        // but we can start a small poller if needed or just rely on the user trying again?
        // Actually, let's just wait a bit if script is loading
        const checkInterval = setInterval(() => {
          if (window.JitsiMeetExternalAPI && jitsiContainerRef.current) {
            clearInterval(checkInterval);
            initJitsi();
          }
        }, 500);
        return () => clearInterval(checkInterval);
      }
      return;
    }

    initJitsi();

    // specific cleanup for this effect
    return () => {
      if (jitsiAPIRef.current) {
        console.log("Cleaning up Jitsi instance on effect unmount");
        jitsiAPIRef.current.dispose();
        jitsiAPIRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingStarted, roomName]); // Re-run if meeting "starts"

  const initJitsi = () => {
    if (jitsiAPIRef.current) return; // already active

    const domain = "meet.jitsi";
    const cleanRoomName = roomName.toLowerCase().trim().replace(/\s+/g, "-");

    console.log("🎥 Initializing Jitsi for room:", cleanRoomName);

    const options = {
      roomName: cleanRoomName,
      parentNode: jitsiContainerRef.current,
      width: "100%",
      height: "100%",
      configOverwrite: {
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        enableWelcomePage: false,
        disableAudioLevels: true,
      },
      interfaceConfigOverwrite: {
        DEFAULT_LANGUAGE: "en",
        SHOW_JITSI_WATERMARK: false,
        TOOLBAR_BUTTONS: [
          "microphone",
          "camera",
          "closedcaptions",
          "desktop",
          "fullscreen",
          "fodeviceselection",
          "hangup",
          "profile",
          "chat",
          "recording",
          "livestream",
          "etherpad",
          "sharedvideo",
          "settings",
          "raisehand",
          "videoquality",
          "filmstrip",
          "invite",
          "feedback",
          "stats",
          "shortcuts",
          "tileview",
        ],
        VERTICAL_FILMSTRIP: false,
        DISPLAY_WELCOME_PAGE_CONTENT: false,
        HIDE_INVITE_MORE_HEADER: true,
      },
      userInfo: {
        displayName: displayName || "User",
      },
    };

    try {
      jitsiAPIRef.current = new window.JitsiMeetExternalAPI(domain, options);
      console.log("✅ Jitsi instance created");
      setIsJoining(false);

      jitsiAPIRef.current.addEventListener("videoConferenceJoined", () => {
        console.log("✅ User joined the meeting");
        setIsJoining(false);
      });

      jitsiAPIRef.current.addEventListener("videoConferenceLeft", () => {
        console.log("👋 User left the meeting");
        setMeetingStarted(false);
        setRoomName("");
        jitsiAPIRef.current.dispose();
        jitsiAPIRef.current = null;
      });

      jitsiAPIRef.current.addEventListener("readyToClose", () => {
        console.log("🔌 Meeting is ready to close");
        setMeetingStarted(false);
        setRoomName("");
        jitsiAPIRef.current.dispose();
        jitsiAPIRef.current = null;
      });

    } catch (error) {
      console.error("❌ Error starting Jitsi meeting:", error);
      alert("Failed to load meeting. Please try again.");
      setIsJoining(false);
      setMeetingStarted(false);
    }
  };

  const leaveMeeting = () => {
    if (jitsiAPIRef.current) {
      jitsiAPIRef.current.executeCommand("hangup");
      jitsiAPIRef.current = null;
    }
    setMeetingStarted(false);
    setRoomName("");
  };

  return (
    <div className="min-h-screen bg-[#1C1D25] text-white px-6 py-10">
      <div className="max-w-5xl mx-auto">
        {!meetingStarted ? (
          <>
            {/* Page Header */}
            <div className="mb-12 text-center">
              <h1 className="text-4xl font-bold mb-3">🎥 CultureStack Meetings</h1>
              <p className="text-gray-400 text-lg">
                Create or join a video meeting powered by Jitsi Meet
              </p>
            </div>

            {/* Two Column Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">

              {/* CREATE A MEET */}
              <div
                className="
                  bg-[#2B2D38]
                  border border-white/10
                  rounded-2xl
                  p-8
                  shadow-lg
                  hover:border-[#7FE6C5]/30
                  transition
                "
              >
                <div className="text-5xl mb-4">✨</div>
                <h2 className="text-2xl font-bold mb-4">Create a New Meet</h2>
                <p className="text-gray-400 text-sm mb-6">
                  Start a new meeting with a unique room name. Share the name with others so they can join.
                </p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!roomName.trim()) {
                      alert("Please enter a meeting room name");
                      return;
                    }
                    startMeeting(e);
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label
                      htmlFor="createRoom"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      Room Name
                    </label>
                    <input
                      id="createRoom"
                      type="text"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      placeholder="e.g., team-standup"
                      className="
                        w-full
                        px-4 py-3
                        bg-[#1C1D25]
                        border border-white/20
                        rounded-lg
                        text-white
                        placeholder-gray-500
                        focus:outline-none
                        focus:border-[#7FE6C5]
                        focus:ring-1
                        focus:ring-[#7FE6C5]
                        transition
                      "
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      ✏️ Use a descriptive name like "client-call" or "brainstorm-2024"
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isJoining}
                    className="
                      w-full
                      px-6 py-3
                      bg-[#7FE6C5]
                      hover:bg-[#5FD6B5]
                      disabled:opacity-50
                      disabled:cursor-not-allowed
                      text-black
                      font-semibold
                      rounded-lg
                      transition
                    "
                  >
                    {isJoining ? "Starting..." : "🚀 Create & Start Meet"}
                  </button>
                </form>
              </div>

              {/* JOIN AN EXISTING MEET */}
              <div
                className="
                  bg-[#2B2D38]
                  border border-white/10
                  rounded-2xl
                  p-8
                  shadow-lg
                  hover:border-[#4BA9FF]/30
                  transition
                "
              >
                <div className="text-5xl mb-4">🚪</div>
                <h2 className="text-2xl font-bold mb-4">Join Existing Meet</h2>
                <p className="text-gray-400 text-sm mb-6">
                  Already have a meeting room name? Enter it here to join the meeting.
                </p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!roomName.trim()) {
                      alert("Please enter a meeting room name");
                      return;
                    }
                    startMeeting(e);
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label
                      htmlFor="joinRoom"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      Room Name to Join
                    </label>
                    <input
                      id="joinRoom"
                      type="text"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      placeholder="e.g., team-standup"
                      className="
                        w-full
                        px-4 py-3
                        bg-[#1C1D25]
                        border border-white/20
                        rounded-lg
                        text-white
                        placeholder-gray-500
                        focus:outline-none
                        focus:border-[#4BA9FF]
                        focus:ring-1
                        focus:ring-[#4BA9FF]
                        transition
                      "
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      📋 Ask the organizer for the room name
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isJoining}
                    className="
                      w-full
                      px-6 py-3
                      bg-[#4BA9FF]
                      hover:bg-[#3A99EF]
                      disabled:opacity-50
                      disabled:cursor-not-allowed
                      text-black
                      font-semibold
                      rounded-lg
                      transition
                    "
                  >
                    {isJoining ? "Joining..." : "✅ Join Meet"}
                  </button>
                </form>
              </div>

            </div>

            {/* Info Box */}
            <div className="bg-[#2A2C38] border border-[#7FE6C5]/20 rounded-xl p-6 text-center">
              <p className="text-sm text-gray-300 mb-2">
                💡 <strong>Tip:</strong> The same room name is used for both creating and joining.
              </p>
              <p className="text-xs text-gray-500">
                So if you create a meet with room name "client-call", others can join by entering the same name.
              </p>
            </div>
          </>
        ) : (
          <>
            {/* Meeting Active - Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold">{roomName}</h1>
                <p className="text-gray-400 text-sm mt-1">
                  Meeting in progress • Connected as {displayName}
                </p>
              </div>
              <button
                onClick={leaveMeeting}
                className="
                  px-6 py-3
                  bg-red-600
                  hover:bg-red-700
                  text-white
                  font-semibold
                  rounded-lg
                  transition
                "
              >
                Leave Meeting
              </button>
            </div>

            {/* Jitsi Meet Container */}
            <div
              ref={jitsiContainerRef}
              className="
                w-full
                bg-black
                rounded-lg
                overflow-hidden
                shadow-lg
                border border-white/10
              "
              style={{ height: "600px" }}
            />
          </>
        )}
      </div>
    </div>
  );
}
