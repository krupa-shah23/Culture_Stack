import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function Signup() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    department: "",
    organizationName: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/register", formData);
      localStorage.setItem("userInfo", JSON.stringify(response.data));
      navigate("/knowledge");
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-white">
      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-center mb-2">
          Create Account
        </h1>

        <form className="space-y-4 mt-6" onSubmit={handleSignup}>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <input
            type="text"
            placeholder="Full Name"
            className="w-full p-3 border rounded-xl"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            required
          />

          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 border rounded-xl"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 border rounded-xl"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />

          <input
            type="text"
            placeholder="Department (e.g. Engineering, Sales)"
            className="w-full p-3 border rounded-xl"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            required
          />

          <div className="mb-2">
            <input
              type="text"
              placeholder="Organization Name (Optional)"
              className="w-full p-3 border rounded-xl"
              value={formData.organizationName}
              onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
            />
            <p className="text-xs text-gray-500 mt-1 ml-1">If empty, we'll use your email domain.</p>
          </div>

          <button
            type="submit"
            className="w-full bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-sm mt-5 text-gray-600">
          Already have an account?{" "}
          <Link to="/" className="font-semibold underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
