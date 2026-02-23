import React, { useEffect, useRef, useState } from 'react';
import StreamingAvatar, { AvatarQuality, TaskType } from '@heygen/streaming-avatar';
import api from '../../api/axios';

// Test/demo avatars - update with available IDs from your account
const AVATAR_CONFIGS = {
  innovator: {
    avatarId: '2819a0bb151d49ca91052de3a3dc9826',
  },
  riskEvaluator: {
    avatarId: 'af8902e0d9aa4e6681b7b27534cb73ed',
  },
  strategist: {
    avatarId: '6e847eafc6c641309728f17b91f1aa48',
  },
};

const PersonaAvatar = ({ persona, textToSpeak, onSpeakingStart, onSpeakingEnd }) => {
  // const [stream, setStream] = useState(null);
  // const [avatar, setAvatar] = useState(null);
  // const [isLoading, setIsLoading] = useState(false);
  // const [error, setError] = useState('');
  // const mediaStream = useRef(null);

  // Placeholder for "black pic" request
  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden bg-black border border-white/10 flex items-center justify-center">
      {/* 
      <video
        ref={mediaStream}
        autoPlay
        playsInline
        muted={false}
        className="w-full h-full object-cover"
        style={{ pointerEvents: 'none' }}
      /> 
      */}

      {/* Avatar Placeholder */}
      <div className="w-full h-full bg-black flex items-center justify-center">
        <div className="text-gray-600 text-6xl opacity-20">
          {/* You could put an icon here if needed, or just pure black as requested */}
        </div>
      </div>

      {/* Overlay to show current persona */}
      <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-xs text-white/80">
        {persona}
      </div>
    </div>
  );

  /* 
  // HeyGen Logic Disabled
  useEffect(() => { ... } 
  */
};

export default PersonaAvatar;
