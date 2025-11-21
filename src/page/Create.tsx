import React, { useContext, useState, type JSX } from "react";
import { ThemeContext } from "../context/ThemeProvider";
import axios, { AxiosError } from "axios";
import { AuthContext } from "../context/AuthProvider";
import { useNavigate, type NavigateFunction } from "react-router-dom";
import { LeftArrow } from "../components/Icons";

const Create = (): JSX.Element => {
  const { theme } = useContext(ThemeContext);
  const { toggleAuth } = useContext(AuthContext);
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [syncHistory, setSyncHistory] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const navigate: NavigateFunction = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const history = syncHistory ? JSON.parse(localStorage.getItem("history") || "[]") : [];
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/create`, { username, password, confirmPassword, history });
      if (res.status === 201) {
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
  };

  return (
    <div
      className={`min-h-screen flex justify-center items-center px-4 ${theme === "dark"
        ? "bg-black text-white"
        : "bg-white text-black"
        }`}
    >
      <button onClick={() => navigate("/", { replace: true })} className="absolute top-3 left-3">
        <LeftArrow />
      </button>
      <form
        onSubmit={handleSubmit}
        className={`w-full max-w-sm border p-6 rounded-xl shadow-lg flex flex-col gap-4 ${theme === "dark"
          ? "border-white/20"
          : "border-black/20"
          }`}
      >
        <h2 className="text-2xl font-semibold text-center">
          Create Account
        </h2>

        <input
          type="text"
          placeholder="create a Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className={`w-full p-3 rounded-lg outline-none ${theme === "dark"
            ? "bg-black border border-white/20 text-white"
            : "bg-white border border-black/20 text-black"
            }`}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className={`w-full p-3 rounded-lg outline-none ${theme === "dark"
            ? "bg-black border border-white/20 text-white"
            : "bg-white border border-black/20 text-black"
            }`}
        />

        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className={`w-full p-3 rounded-lg outline-none ${theme === "dark"
            ? "bg-black border border-white/20 text-white"
            : "bg-white border border-black/20 text-black"
            }`}
        />

        <div className="ms-2 flex items-center gap-2">
          <input
            type="checkbox"
            name="synchistory"
            id="synchistory"
            className={`size-4 ${theme === "dark" ? "accent-blue-500" : "accent-black"}`}
            checked={syncHistory}
            onChange={() => setSyncHistory(prev => !prev)}
          />
          <label htmlFor="synchistory" className="text-sm font-medium">Sync History</label>
        </div>

        <button
          type="submit"
          className={`w-full p-3 rounded-lg font-semibold mt-2 ${theme === "dark"
            ? "bg-white text-black"
            : "bg-black text-white"
            } ${loading ? "opacity-50 cursor-not-allowed" : "opacity-100"}`}
          disabled={loading}
        >
          {loading ? "Creating Account..." : "Create Account"}
        </button>
      </form>
    </div>
  );
};

export default Create;
