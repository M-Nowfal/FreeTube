import { useContext, useEffect } from "react"
import { useNavigate, type NavigateFunction } from "react-router-dom";
import { AuthContext } from "../context/AuthProvider";

const Logout = () => {
  const { toggleAuth } = useContext(AuthContext);
  const navigate: NavigateFunction = useNavigate();

  useEffect(() => {
    if (confirm("Are you sure to logout")) {
      localStorage.removeItem("auth");
      localStorage.removeItem("history");
      toggleAuth(false, "");
    }

    navigate("/", { replace: true });
  }, []);

  return null;
}

export default Logout