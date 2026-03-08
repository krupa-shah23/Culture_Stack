import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/layout/Navbar";
import { ErrorBoundary } from "./components/layout/ErrorBoundary";

import Feed from "./pages/Feed";
import Write from "./pages/Write";
import PostDetail from "./pages/PostDetail";
import Podcasts from "./pages/Podcasts";
import UploadPodcast from "./pages/UploadPodcast";
import PodcastDetail from "./pages/PodcastDetail";
import KnowledgeHub from "./pages/KnowledgeHub";
import Activity from "./pages/Activity";
import Meet from "./pages/Meet";
import Profile from "./pages/Profile";
import DirectMessage from "./pages/DirectMessage";
import Messages from "./pages/Messages";
import Auth from "./pages/Auth";
import { useEffect } from "react";
import api from "./api/axios";

// Reusable Main Layout with proper Top Padding for the Fixed Navbar
const MainLayout = ({ children }) => (
  <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#F5F5F0]">
    <Navbar />
    <div className="pt-[104px] flex-1 flex flex-col w-full h-full relative">
      {children}
    </div>
  </div>
);

export default function App() {

  return (
    <BrowserRouter>
      {/* Global screen glow overlay (mounted at root level) */}
      <div id="screen-glow-overlay" aria-hidden="true"></div>
      <ErrorBoundary>
        <Routes>
          {/* ✅ AUTH PAGES (No Navbar, No Padding) */}
          <Route path="/" element={<Auth />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/signup" element={<Auth />} />

          {/* ✅ MAIN APP PAGES (With Navbar & Top Padding) */}
          <Route path="/feed" element={<MainLayout><Feed /></MainLayout>} />
          <Route path="/write" element={<MainLayout><Write /></MainLayout>} />
          <Route path="/posts/:postId" element={<MainLayout><PostDetail /></MainLayout>} />
          <Route path="/podcasts" element={<MainLayout><Podcasts /></MainLayout>} />
          <Route path="/podcasts/upload" element={<MainLayout><UploadPodcast /></MainLayout>} />
          <Route path="/podcasts/:id" element={<MainLayout><PodcastDetail /></MainLayout>} />
          <Route path="/knowledge" element={<MainLayout><KnowledgeHub /></MainLayout>} />
          <Route path="/messages" element={<MainLayout><Messages /></MainLayout>} />
          <Route path="/activity" element={<MainLayout><Activity /></MainLayout>} />
          <Route path="/meet" element={<MainLayout><Meet /></MainLayout>} />
          <Route path="/profile/:id" element={<MainLayout><Profile /></MainLayout>} />
          {/* Direct Messaging (DM) - opened from a user's profile */}
          <Route path="/dm/:userId" element={<MainLayout><DirectMessage /></MainLayout>} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
