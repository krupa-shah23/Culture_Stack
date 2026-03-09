import { useParams, useNavigate } from "react-router-dom";
import { JitsiMeeting } from "@jitsi/react-sdk";

export default function MeetingRoom() {
    const { roomId } = useParams();
    const navigate = useNavigate();

    // Get logged-in user info
    const userInfo = JSON.parse(localStorage.getItem("userInfo") || "null");
    const displayName = userInfo?.fullName || "Guest";

    const handleApiReady = (apiObj) => {
        apiObj.addListener('readyToClose', () => {
            // Navigate back to the lobby or feed when hanging up
            navigate('/meet');
        });
        apiObj.addListener('videoConferenceLeft', () => {
            navigate('/meet');
        });
    };

    return (
        <div className="w-screen h-screen bg-black">
            <JitsiMeeting
                domain="meet.jit.si"
                roomName={roomId}
                configOverwrite={{
                    startWithAudioMuted: false,
                    startWithVideoMuted: false,
                    prejoinPageEnabled: true,
                    disableAudioLevels: false,
                    enableWelcomePage: false,
                    resolution: 720
                }}
                interfaceConfigOverwrite={{
                    SHOW_JITSI_WATERMARK: false,
                    SHOW_WATERMARK_FOR_GUESTS: false,
                    DEFAULT_BACKGROUND: "#000000",
                    DEFAULT_REMOTE_DISPLAY_NAME: "Participant"
                }}
                userInfo={{
                    displayName: displayName,
                }}
                onApiReady={handleApiReady}
                getIFrameRef={(iframeRef) => {
                    iframeRef.style.height = '100%';
                    iframeRef.style.width = '100%';
                }}
            />
        </div>
    );
}
