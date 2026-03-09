import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Mic,
  PenTool,
  BookOpen,
  Menu,
  X,
  Bell,
  MessageSquare,
  Video,
  LogOut,
} from "lucide-react";

import navLinks from "../../config/navigation";
import {
  getUnreadActivityCount,
  clearUnreadActivityCount,
} from "../../api/axios";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [unreadActivityCount, setUnreadActivityCount] = useState(0);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

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
      } catch {
        const stored = localStorage.getItem("activityUnreadCount");
        if (mounted)
          setUnreadActivityCount(stored ? parseInt(stored, 10) : 0);
      }
    };

    fetchUnread();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (location.pathname === "/activity" && unreadActivityCount > 0) {
      (async () => {
        try {
          await clearUnreadActivityCount();
        } catch { }

        setUnreadActivityCount(0);
        localStorage.removeItem("activityUnreadCount");
      })();
    }
  }, [location.pathname, unreadActivityCount]);

  const userInfo =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("userInfo") || "null")
      : null;

  const initial = userInfo?.fullName
    ? userInfo.fullName.trim()[0].toUpperCase()
    : "U";

  const profilePath = userInfo ? `/profile/${userInfo._id}` : "/";

  const getIconForLabel = (label, isActive) => {
    const classes = `w-5 h-5 transition ${isActive
        ? "text-charcoal drop-shadow-sm"
        : "text-earth-green group-hover:text-charcoal"
      }`;

    switch (label.toLowerCase()) {
      case "feed":
        return <Home className={classes} />;
      case "knowledge hub":
        return <BookOpen className={classes} />;
      case "podcasts":
        return <Mic className={classes} />;
      case "activity":
        return <Bell className={classes} />;
      case "messages":
        return <MessageSquare className={classes} />;
      case "meet":
        return <Video className={classes} />;
      default:
        return null;
    }
  };

  return (
    <>
      <nav className="fixed top-0 left-0 w-full z-40 bg-white/90 backdrop-blur-xl border-b border-black/5 shadow-sm">
        <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <Link
              to="/feed"
              className="text-xl font-bold tracking-tighter text-[#1A1A1A]"
            >
              CULTURE <span className="text-[#8C7851]">STACK</span>
            </Link>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? <X /> : <Menu />}
              </button>
            </div>

            {/* Desktop Links */}
            <div className="hidden md:flex space-x-1 items-center font-medium">
              {navLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) =>
                    `group relative px-4 py-2 rounded-xl flex items-center gap-2 ${isActive
                      ? "bg-black/5 text-[#1A1A1A]"
                      : "text-[#1A1A1A]/70 hover:bg-black/5"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {getIconForLabel(link.label, isActive)}
                      <span className="hidden lg:block">{link.label}</span>

                      {link.path === "/activity" &&
                        unreadActivityCount > 0 && (
                          <span className="absolute top-1 right-2 text-[10px] bg-charcoal text-white px-1 rounded-full">
                            {unreadActivityCount > 99
                              ? "99+"
                              : unreadActivityCount}
                          </span>
                        )}
                    </>
                  )}
                </NavLink>
              ))}

              <div className="w-[1px] h-6 bg-black/10 mx-2"></div>

              <Link to="/write" className="btn-primary ml-2 flex items-center gap-2">
                <PenTool className="w-4 h-4" />
                Write
              </Link>

              {/* Profile */}
              <Link
                to={profilePath}
                className="ml-4 w-10 h-10 flex items-center justify-center rounded-full bg-[#F5F5F0] border border-black/10 font-bold"
              >
                {initial}
              </Link>

              {/* Logout */}
              <button
                onClick={() => setShowLogoutModal(true)}
                className="ml-2 w-10 h-10 flex items-center justify-center rounded-full text-red-500 hover:bg-red-50 transition"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden bg-earth-bg/95 backdrop-blur-xl border-b border-black/5 shadow-lg">
            <div className="px-4 pt-4 pb-6 space-y-2 flex flex-col">
              {navLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-4 px-4 py-3 rounded-xl ${isActive
                      ? "bg-black/5 text-charcoal"
                      : "text-charcoal/70 hover:bg-black/5"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {getIconForLabel(link.label, isActive)}
                      <span>{link.label}</span>
                    </>
                  )}
                </NavLink>
              ))}

              <Link
                to="/write"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-charcoal text-white"
              >
                <PenTool className="w-5 h-5" />
                Write
              </Link>

              <Link
                to={profilePath}
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white border"
              >
                <div className="w-8 h-8 rounded-full bg-charcoal text-white flex items-center justify-center">
                  {initial}
                </div>
                Profile
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setShowLogoutModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-[380px] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-[#1A1A1A] mb-2">
              Logout
            </h2>

            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to logout from your account?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg bg-[#1A1A1A] text-white hover:bg-black"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}