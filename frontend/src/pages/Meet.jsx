import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Video, Info } from "lucide-react";

export default function Meet() {
  const [roomName, setRoomName] = useState("");
  const navigate = useNavigate();

  // Handle meeting start triggers
  const startMeeting = (e) => {
    e.preventDefault();

    if (!roomName.trim()) {
      alert("Please enter a meeting room name");
      return;
    }

    const cleanRoomName = roomName.toLowerCase().trim().replace(/\s+/g, "-");
    navigate(`/meet/${cleanRoomName}`);
  };

  return (
    <div className="flex-1 w-full pb-12 relative flex flex-col pt-6 md:pt-10">
      {/* Antigravity Mesh Background */}
      <div className="bg-mesh-gradient fixed inset-0 z-[-1]" />

      {/* MASTER CONTAINER */}
      <div className="w-full px-6 md:px-12 lg:px-20 relative z-10 flex flex-col gap-8">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">

            {/* CREATE A MEET */}
            <div
              className="
              bg-white border border-black/5 rounded-2xl shadow-sm
              p-8 transition-all duration-300
            "
            >
              <div className="text-5xl mb-4"></div>
              <h2 className="text-2xl font-bold mb-4 text-[#1A1A1A]">Create a New Meet</h2>
              <p className="text-[#1A1A1A]/80 text-sm mb-6">
                Start a new meeting with a unique room name. Share the name with others so they can join.
              </p>

              <form
                onSubmit={startMeeting}
                className="space-y-4"
              >
                <div>
                  <label
                    htmlFor="createRoom"
                    className="block text-sm font-medium text-charcoal/80 mb-2"
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
                    w-full px-4 py-3
                    bg-earth-bg border border-black/5 rounded-xl
                    text-charcoal placeholder-[#4A4A4A]/50
                    focus:outline-none focus:border-black/20 focus:ring-1 focus:ring-black/20
                    transition-colors shadow-sm
                  "
                  />
                  <p className="text-xs text-charcoal/80 mt-2">
                    Use a descriptive name like "client-call" or "brainstorm-2024"
                  </p>
                </div>

                <button
                  type="submit"
                  className="
                  w-full px-6 py-3
                  bg-[#1A1A1A] text-white font-bold rounded-full
                  hover:bg-black hover:shadow-md transition-all flex items-center justify-center gap-2
                "
                >
                  <Plus className="w-5 h-5" /> Create & Start Meet
                </button>
              </form>
            </div>

            {/* JOIN AN EXISTING MEET */}
            <div
              className="
              bg-white border border-black/5 rounded-2xl shadow-sm
              p-8 transition-all duration-300
            "
            >
              <div className="text-5xl mb-4"></div>
              <h2 className="text-2xl font-bold mb-4 text-[#1A1A1A]">Join Existing Meet</h2>
              <p className="text-[#1A1A1A]/80 text-sm mb-6">
                Already have a meeting room name? Enter it here to join the meeting.
              </p>

              <form
                onSubmit={startMeeting}
                className="space-y-4"
              >
                <div>
                  <label
                    htmlFor="joinRoom"
                    className="block text-sm font-medium text-charcoal/80 mb-2"
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
                    w-full px-4 py-3
                    bg-earth-bg border border-black/5 rounded-xl
                    text-charcoal placeholder-[#4A4A4A]/50
                    focus:outline-none focus:border-black/20 focus:ring-1 focus:ring-black/20
                    transition-colors shadow-sm
                  "
                  />
                  <p className="text-xs text-charcoal/80 mt-2">
                    Ask the organizer for the room name
                  </p>
                </div>

                <button
                  type="submit"
                  className="
                  w-full px-6 py-3
                  bg-[#1A1A1A] text-white font-bold rounded-full
                  hover:bg-black hover:shadow-md transition-all flex items-center justify-center gap-2
                "
                >
                  <Video className="w-5 h-5" /> Join Meet
                </button>
              </form>
            </div>

          </div>

          {/* Info Box */}
          <div className="bg-[#F5F5F0] border border-black/5 rounded-2xl shadow-sm p-6 text-center">
            <p className="text-sm text-[#1A1A1A] mb-2 flex items-center justify-center gap-2">
              <Info className="w-4 h-4 text-[#1A1A1A]/50" /> <strong>Tip:</strong> The same room name is used for both creating and joining.
            </p>
            <p className="text-xs text-[#1A1A1A]/80">
              So if you create a meet with room name "client-call", others can join by entering the same name.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
