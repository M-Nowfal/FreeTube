import React, { useContext, useState, type JSX } from "react";
import { ThemeContext } from "../context/ThemeProvider";
import axios, { AxiosError } from "axios";
import { AuthContext } from "../context/AuthProvider";
import { useNavigate, type NavigateFunction } from "react-router-dom";
import { LeftArrow } from "../components/Icons";

const Delete = (): JSX.Element => {
  const { theme } = useContext(ThemeContext);
  const { toggleAuth, auth } = useContext(AuthContext);
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmation, setConfirmation] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const navigate: NavigateFunction = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.delete(`${import.meta.env.VITE_API_URL}/delete`, { data: { username, password, confirmation } });
      if (res.status === 200) {
        localStorage.removeItem("auth");
        localStorage.removeItem("history");
        toggleAuth(false, "");
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
          Delete Account
        </h2>

        <input
          type="text"
          placeholder="Enter Username"
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
          placeholder="Enter Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className={`w-full p-3 rounded-lg outline-none ${theme === "dark"
            ? "bg-black border border-white/20 text-white"
            : "bg-white border border-black/20 text-black"
            }`}
        />

        <input
          type="type"
          placeholder={`Type "Delete${auth.username}" for confirmation`}
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          required
          className={`w-full p-3 rounded-lg outline-none ${theme === "dark"
            ? "bg-black border border-white/20 text-white"
            : "bg-white border border-black/20 text-black"
            }`}
        />

        <button
          type="submit"
          className={`w-full p-3 rounded-lg font-semibold mt-2 ${theme === "dark"
            ? "bg-white text-black"
            : "bg-black text-white"
            }`}
          disabled={loading}
        >
          {loading ? "Deleting Account..." : "Delete Account"}
        </button>
      </form>
    </div>
  );
};

export default Delete;
