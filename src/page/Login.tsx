import React, { useContext, useState } from "react";
import { ThemeContext } from "../context/ThemeProvider";
import axios, { AxiosError } from "axios";
import { AuthContext } from "../context/AuthProvider";
import { useNavigate, type NavigateFunction } from "react-router-dom";
import { LeftArrow } from "../components/Icons";

const Login = () => {
  const { theme } = useContext(ThemeContext);
  const { toggleAuth } = useContext(AuthContext);
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const navigate: NavigateFunction = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/login`, { username, password });
      if (res.status === 200) {
        localStorage.setItem("auth", JSON.stringify({ isAuth: true, username }));
        localStorage.removeItem("history");
        toggleAuth(true, username);
        navigate("/", { replace: true });
      }
    } catch (err: unknown) {
      console.error(err);
      alert(err instanceof AxiosError ? (err.response?.data.message || err.message) : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`min-h-screen flex items-center justify-center ${theme === "dark" ? "bg-black text-white" : "bg-white text-black"}`}
    >
      <button onClick={() => navigate("/", { replace: true })} className="absolute top-3 left-3">
        <LeftArrow />
      </button>
      <form onSubmit={handleSubmit} className={`w-full max-w-sm p-6 rounded-xl border ${theme === "dark" ? "border-gray-600" : "border-gray-300"}`}>
        <h1 className="text-2xl font-semibold text-center mb-6">Login</h1>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Username</label>
            <input
              type="text"
              className={`border px-3 py-2 rounded bg-transparent outline-none ${theme === "dark"
                ? "border-gray-600 placeholder-gray-400"
                : "border-gray-300 placeholder-gray-600"
                }`}
              placeholder="Enter your Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Password</label>
            <input
              type="password"
              className={`border px-3 py-2 rounded bg-transparent outline-none ${theme === "dark"
                ? "border-gray-600 placeholder-gray-400"
                : "border-gray-300 placeholder-gray-600"
                }`}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            className={`w-full py-2 mt-2 rounded font-medium transition ${theme === "dark"
              ? "bg-white text-black hover:bg-gray-200"
              : "bg-black text-white hover:bg-gray-800"
              } ${loading ? "opacity-50 cursor-not-allowed" : "opacity-100"}`}
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Login;
