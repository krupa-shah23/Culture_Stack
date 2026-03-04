import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { getMyOrganization, createOrganization } from "../api/axios";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOrgSetup, setShowOrgSetup] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [orgDescription, setOrgDescription] = useState("");
  const [creatingOrg, setCreatingOrg] = useState(false);
  const [loginOrgName, setLoginOrgName] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", { email, password, organizationName: loginOrgName });
      localStorage.setItem("userInfo", JSON.stringify(response.data));

      // Check if user has an organization
      const orgResponse = await getMyOrganization();
      if (!orgResponse) {
        setShowOrgSetup(true);
      } else {
        navigate("/knowledge");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    setError("");
    setCreatingOrg(true);

    try {
      const orgResponse = await createOrganization({ name: orgName, description: orgDescription });

      // Update localStorage with organization info
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      userInfo.organization = orgResponse._id;
      localStorage.setItem('userInfo', JSON.stringify(userInfo));

      navigate("/knowledge");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create organization.");
    } finally {
      setCreatingOrg(false);
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F0]">
      <div className="w-full max-w-md bg-white border border-black/5 shadow-sm rounded-2xl p-8 relative overflow-hidden">
        {!showOrgSetup ? (
          <>
            <h1 className="text-3xl font-bold text-center mb-2 text-charcoal">
              CultureStack
            </h1>
            <p className="text-[#4A4A4A] text-center mb-6">
              Private reflections + AI feedback for teams
            </p>

            <form className="space-y-4" onSubmit={handleLogin}>
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
              <input
                type="email"
                placeholder="Email"
                className="w-full p-3 border rounded-xl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <input
                type="password"
                placeholder="Password"
                className="w-full p-3 border rounded-xl"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <input
                type="text"
                placeholder="Organization Name (Optional)"
                className="w-full p-3 border rounded-xl"
                value={loginOrgName}
                onChange={(e) => setLoginOrgName(e.target.value)}
              />

              <button
                type="submit"
                className="w-full bg-[#8C7851] text-white py-3 rounded-xl font-bold transition-colors hover:bg-[#A39066] shadow-sm"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>


            <p className="text-center text-sm mt-5 text-[#4A4A4A]">
              Don't have an account?{" "}
              <Link to="/signup" className="font-semibold text-charcoal underline">
                Sign up
              </Link>
            </p>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-center mb-6">
              Set Up Your Organization
            </h1>

            <form className="space-y-4" onSubmit={handleCreateOrg}>
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
              <input
                type="text"
                placeholder="Organization Name"
                className="w-full p-3 border rounded-xl"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                required
              />

              <textarea
                placeholder="Organization Description"
                className="w-full p-3 border rounded-xl"
                rows="4"
                value={orgDescription}
                onChange={(e) => setOrgDescription(e.target.value)}
                required
              ></textarea>

              <button
                type="submit"
                className="w-full bg-[#1A1A1A] text-white py-3 rounded-xl font-bold transition-colors hover:bg-black shadow-sm"
                disabled={creatingOrg}
              >
                {creatingOrg ? 'Creating Organization...' : 'Create Organization'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
