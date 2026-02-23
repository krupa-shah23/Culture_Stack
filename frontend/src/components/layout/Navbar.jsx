import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";

import navLinks from "../../config/navigation";
import { getUnreadActivityCount, clearUnreadActivityCount } from "../../api/axios";

export default function Navbar() {
  const location = useLocation();

  // Unread activity count (fetched from backend API; localStorage is fallback)
  const [unreadActivityCount, setUnreadActivityCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    const fetchUnread = async () => {
      try {
        const count = await getUnreadActivityCount();
        if (mounted) setUnreadActivityCount(count || 0);
      } catch (err) {
        // fallback to localStorage for offline / backwards-compat
        try {
          const stored = localStorage.getItem("activityUnreadCount");
          if (mounted) setUnreadActivityCount(stored ? parseInt(stored, 10) || 0 : 0);
        } catch (e) {
          if (mounted) setUnreadActivityCount(0);
        }
      }
    };

    fetchUnread();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    // When user visits the Activity page, clear server-side unread count and local fallback
    if (location.pathname === "/activity" && unreadActivityCount > 0) {
      (async () => {
        try {
          await clearUnreadActivityCount();
        } catch (err) {
          console.error('Failed to clear unreadActivityCount on server:', err);
        }
        setUnreadActivityCount(0);
        try {
          localStorage.removeItem("activityUnreadCount");
        } catch (err) {
          // ignore
        }
      })();
    }
  }, [location.pathname, unreadActivityCount]);

  // ✅ Logged-in user info
  const userInfo =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("userInfo") || "null")
      : null;

  // ✅ Profile Initial
  const initial =
    userInfo?.fullName
      ? userInfo.fullName.trim()[0].toUpperCase()
      : "U";

  const profilePath = userInfo ? `/profile/${userInfo._id}` : "/";

  // ✅ Active Write Page
  const isWritePage = location.pathname === "/write";

  return (
    <div className="w-full flex justify-center pt-9 bg-[#1C1D25]">
      <div
        className="
          w-[90%]
          px-10 py-3
          flex items-center justify-between
          rounded-full
          bg-[#2B2D38]
          border border-white/10
          shadow-lg
        "
      >
        {/* Logo (now links to Knowledge Hub) */}
        <Link
          to="/knowledge"
          className="text-2xl font-bold text-white tracking-wide"
        >
          Culture<span className="text-[#4BA9FF]">Stack</span>
        </Link>

        {/* 🔗 Nav Links */}
        <div className="flex gap-12 text-lg font-medium">
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                isActive
                  ? "text-[#7FE6C5] font-semibold"
                  : "text-gray-400 hover:text-white transition"
              }
            >
              <span className="inline-flex items-center gap-2">
                {link.label}
                {link.path === "/activity" && unreadActivityCount > 0 && (
                  <span
                    aria-label={`${unreadActivityCount} unread activity`}
                    className="ml-2 inline-flex items-center justify-center min-w-[20px] px-2 py-0.5 text-xs font-semibold rounded-full bg-red-500 text-white"
                  >
                    {unreadActivityCount > 99 ? "99+" : unreadActivityCount}
                  </span>
                )}
              </span>
            </NavLink>
          ))}
        </div>

        {/* ⚡ Right Side */}
        <div className="flex items-center gap-4">

          {/* Write Button */}
          <Link
            to="/write"
            className={`
              px-6 py-2 rounded-full font-semibold
              text-black transition
              ${isWritePage
                ? "bg-[#F5C76A]" // Active Yellow
                : "bg-[#4BA9FF] hover:opacity-90" // Default Blue
              }
            `}
          >
            Write
          </Link>

          {/* Profile Circle */}
          <Link
            to={profilePath}
            className="
              w-10 h-10 flex items-center justify-center
              rounded-full
              bg-[#B9A6FF]
              text-black font-bold
              hover:opacity-90
              transition
            "
          >
            {initial}
          </Link>
        </div>
      </div>
    </div>
  );
}
