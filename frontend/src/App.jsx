import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/layout/Navbar";

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

export default function App() {

  return (
    <BrowserRouter>
      {/* Global screen glow overlay (mounted at root level) */}
      <div id="screen-glow-overlay" aria-hidden="true"></div>
      <Routes>
        {/* ✅ AUTH PAGES (No Navbar) */}
        <Route path="/" element={<Auth />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/signup" element={<Auth />} />
        {/* <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} /> */}

        {/* ✅ MAIN APP PAGES (With Navbar) */}
        <Route
          path="/feed"
          element={
            <>
              <Navbar />
              <Feed />
            </>
          }
        />

        <Route
          path="/write"
          element={
            <>
              <Navbar />
              <Write />
            </>
          }
        />

        <Route
          path="/posts/:postId"
          element={
            <>
              <Navbar />
              <PostDetail />
            </>
          }
        />

        <Route
          path="/podcasts"
          element={
            <>
              <Navbar />
              <Podcasts />
            </>
          }
        />

        <Route
          path="/podcasts/upload"
          element={
            <>
              <Navbar />
              <UploadPodcast />
            </>
          }
        />

        <Route
          path="/podcasts/:id"
          element={
            <>
              <Navbar />
              <PodcastDetail />
            </>
          }
        />

        <Route
          path="/knowledge"
          element={
            <>
              <Navbar />
              <KnowledgeHub />
            </>
          }
        />

        <Route
          path="/messages"
          element={
            <>
              <Navbar />
              <Messages />
            </>
          }
        />

        <Route
          path="/activity"
          element={
            <>
              <Navbar />
              <Activity />
            </>
          }
        />

        <Route
          path="/meet"
          element={
            <>
              <Navbar />
              <Meet />
            </>
          }
        />

        <Route
          path="/profile/:id"
          element={
            <>
              <Navbar />
              <Profile />
            </>
          }
        />

        {/* Direct Messaging (DM) - opened from a user's profile */}
        <Route
          path="/dm/:userId"
          element={
            <>
              <Navbar />
              <DirectMessage />
            </>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
