import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Home, Mic, PenTool, BookOpen, Menu, X, Bell, MessageSquare, Video, LogOut } from "lucide-react";

import navLinks from "../../config/navigation";
import { getUnreadActivityCount, clearUnreadActivityCount } from "../../api/axios";

export default function Navbar() {
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false); // Mobile menu toggle
  // Unread activity count (fetched from backend API; localStorage is fallback)
  const [unreadActivityCount, setUnreadActivityCount] = useState(0);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("userInfo");
    localStorage.removeItem("activityUnreadCount");
    navigate("/login");
  };

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

  // Logged-in user info
  const userInfo =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("userInfo") || "null")
      : null;

  // Profile Initial
  const initial =
    userInfo?.fullName
      ? userInfo.fullName.trim()[0].toUpperCase()
      : "U";

  const profilePath = userInfo ? `/profile/${userInfo._id}` : "/";

  // Active Write Page
  const isWritePage = location.pathname === "/write";

  const getIconForLabel = (label, isActive) => {
    const defaultClasses = `w-5 h-5 transition-all duration-300 ${isActive ? 'text-charcoal drop-shadow-sm' : 'text-earth-green group-hover:text-charcoal'}`;
    switch (label.toLowerCase()) {
      case "feed":
        return <Home className={defaultClasses} />;
      case "knowledge hub":
        return <BookOpen className={defaultClasses} />;
      case "podcasts":
        return <Mic className={defaultClasses} />;
      case "activity":
        return <Bell className={defaultClasses} />;
      case "messages":
        return <MessageSquare className={defaultClasses} />;
      case "meet":
        return <Video className={defaultClasses} />;
      default:
        return null;
    }
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-40 bg-white/90 backdrop-blur-xl border-b border-black/5 shadow-sm">
      <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link
            to="/feed"
            className="text-xl font-bold tracking-tighter text-[#1A1A1A] hover:opacity-80 transition"
          >
            CULTURE <span className="text-[#8C7851]">STACK</span>
          </Link>

          {/* Mobile Menu Button - Show on small screens */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-zinc-500 hover:text-charcoal focus:outline-none transition"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex space-x-1 items-center font-medium">
            {navLinks.map((link) => {
              // Extract logic to apply active classes consistently
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) =>
                    `group relative px-4 py-2 rounded-xl flex items-center justify-center font-semibold transition-all duration-300 hover:bg-black/5 ${isActive ? "bg-black/5 text-[#1A1A1A]" : "text-[#1A1A1A]/70"
                    }`
                  }
                  title={link.label}
                >
                  {({ isActive }) => (
                    <div className="flex items-center gap-2">
                      {getIconForLabel(link.label, isActive)}
                      <span className="hidden lg:block">{link.label}</span>

                      {/* Unread activity badge */}
                      {link.path === "/activity" && unreadActivityCount > 0 && (
                        <span
                          aria-label={`${unreadActivityCount} unread`}
                          className="absolute top-1 right-2 inline-flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-bold rounded-full bg-charcoal text-white shadow-sm border border-transparent"
                        >
                          {unreadActivityCount > 99 ? "99+" : unreadActivityCount}
                        </span>
                      )}
                    </div>
                  )}
                </NavLink>
              );
            })}

            <div className="w-[1px] h-6 bg-black/10 mx-2"></div>

            <Link to="/write" className="btn-primary ml-2 z-50">
              <PenTool className="w-4 h-4" />
              Write
            </Link>

            {/* Profile Circle */}
            <Link to={profilePath} className="ml-4 w-10 h-10 flex items-center justify-center rounded-full bg-[#F5F5F0] text-[#1A1A1A] border border-black/10 font-bold hover:opacity-90 hover:scale-105 transition">
              {initial}
            </Link>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="ml-2 w-10 h-10 flex items-center justify-center rounded-full text-red-500 hover:bg-red-50 transition"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-earth-bg/95 backdrop-blur-xl border-b border-black/5 shadow-lg">
          <div className="px-4 pt-4 pb-6 space-y-2 flex flex-col">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-4 px-4 py-3 rounded-xl text-base font-semibold transition ${isActive
                    ? "bg-black/5 text-charcoal"
                    : "text-charcoal/70 hover:bg-black/5"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {getIconForLabel(link.label, isActive)}
                    <span>{link.label}</span>
                    {link.path === "/activity" && unreadActivityCount > 0 && (
                      <span className="ml-auto px-2 py-0.5 text-xs font-bold rounded-full bg-charcoal text-white shadow-sm">
                        {unreadActivityCount > 99 ? "99+" : unreadActivityCount}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}

            <div className="h-[1px] bg-black/5 my-2"></div>

            <Link
              to="/write"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center gap-2 px-4 py-3 w-full rounded-full font-semibold bg-charcoal text-white shadow-sm active:scale-95 transition"
            >
              <PenTool className="w-5 h-5 text-white" />
              Write
            </Link>

            <Link
              to={profilePath}
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center gap-3 mt-2 px-4 py-3 w-full rounded-xl bg-white shadow-sm text-charcoal border border-black/5 active:scale-95 transition hover:bg-black/5"
            >
              <div className="w-8 h-8 rounded-full bg-charcoal text-white font-bold flex items-center justify-center">
                {initial}
              </div>
              Profile
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-3 mt-2 px-4 py-3 w-full rounded-xl text-red-500 font-semibold active:scale-95 transition hover:bg-red-50"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
