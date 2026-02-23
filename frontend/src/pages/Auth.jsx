import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { getMyOrganization, createOrganization } from "../api/axios";
import "./Auth.css";

export default function Auth() {
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(false);

  // LOGIN STATES
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginOrgName, setLoginOrgName] = useState("");

  // SIGNUP STATES
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupOrgName, setSignupOrgName] = useState("");

  // ORG SETUP
  const [showOrgSetup, setShowOrgSetup] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [orgDescription, setOrgDescription] = useState("");

  // UI STATES
  const [error, setError] = useState("");

  // ✅ LOGIN FUNCTION
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await api.post("/auth/login", {
        email,
        password,
        organizationName: loginOrgName,
      });

      localStorage.setItem("userInfo", JSON.stringify(response.data));

      // Check org exists
      const orgResponse = await getMyOrganization();

      if (!orgResponse) {
        setShowOrgSetup(true);
      } else {
        navigate("/knowledge");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed.");
    }
  };

  // ✅ SIGNUP FUNCTION
  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await api.post("/auth/register", {
        fullName,
        email: signupEmail,
        password: signupPassword,
        department,
        organizationName: signupOrgName,
      });

      localStorage.setItem("userInfo", JSON.stringify(response.data));

      navigate("/knowledge");
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed.");
    }
  };

  // ✅ CREATE ORG FUNCTION
  const handleCreateOrg = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const orgResponse = await createOrganization({
        name: orgName,
        description: orgDescription,
      });

      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      userInfo.organization = orgResponse._id;
      localStorage.setItem("userInfo", JSON.stringify(userInfo));

      navigate("/knowledge");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create organization.");
    }
  };

  return (
    <div className="auth-page">
      <div className={`auth-container ${isSignUp ? "right-panel-active" : ""}`}>

        {/* ================= SIGN UP FORM ================= */}
        <div className="form-container sign-up">
          <div className="side-strip purple"></div>

          <form onSubmit={handleSignup}>
            <h1>Create Account</h1>

            {error && <p className="error">{error}</p>}

            <div className="field-box accent-purple">
              <input
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="field-box accent-mint">
              <input
                placeholder="Email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                required
              />
            </div>

            <div className="field-box accent-blue">
              <input
                type="password"
                placeholder="Password"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                required
              />
            </div>

            <div className="field-box accent-yellow">
              <input
                placeholder="Department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
              />
            </div>

            <div className="field-box accent-mint">
              <input
                placeholder="Organization Name (Optional)"
                value={signupOrgName}
                onChange={(e) => setSignupOrgName(e.target.value)}
              />
            </div>

            <button type="submit">Sign Up</button>
          </form>
        </div>

        {/* ================= LOGIN FORM ================= */}
        <div className="form-container sign-in">
          <div className="side-strip blue"></div>

          {!showOrgSetup ? (
            <form onSubmit={handleLogin}>
              <h1>Sign In</h1>

              {error && <p className="error">{error}</p>}

              <div className="field-box accent-mint">
                <input
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="field-box accent-blue">
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="field-box accent-yellow">
                <input
                  placeholder="Organization Name (Optional)"
                  value={loginOrgName}
                  onChange={(e) => setLoginOrgName(e.target.value)}
                />
              </div>

              <button type="submit">Sign In</button>
            </form>
          ) : (
            <form onSubmit={handleCreateOrg}>
              <h1>Set Up Organization</h1>

              <div className="field-box accent-yellow">
                <input
                  placeholder="Organization Name"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  required
                />
              </div>

              <textarea
                placeholder="Organization Description"
                value={orgDescription}
                onChange={(e) => setOrgDescription(e.target.value)}
                required
              />

              <button type="submit">Continue</button>
            </form>
          )}
        </div>

        {/* ================= OVERLAY ================= */}
        <div className="overlay-container">
          <div className="overlay">
            <div className="overlay-panel overlay-left">
              <h1>Welcome Back!</h1>
              <p>Login to CultureStack</p>

              <button className="ghost" onClick={() => setIsSignUp(false)}>
                Sign In
              </button>
            </div>

            <div className="overlay-panel overlay-right">
              <h1>Hello!</h1>
              <p>Join your team reflections journey</p>

              <button className="ghost" onClick={() => setIsSignUp(true)}>
                Sign Up
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
