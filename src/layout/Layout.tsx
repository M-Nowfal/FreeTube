import { Link, Outlet } from "react-router-dom"
import { useContext, useState } from "react"
import { ThemeContext } from "../context/ThemeProvider"
import ThemeToggler from "../components/ThemeToggler";
import { User } from "../components/Icons";
import { AuthContext } from "../context/AuthProvider";

const Layout = () => {
  const { theme } = useContext(ThemeContext);
  const { auth } = useContext(AuthContext);
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);

  return (
    <div className={`${theme === "dark" ? "bg-black text-white" : "bg-white text-black"}`}>
      <div className="absolute top-3 right-5 flex items-center gap-3">
        <button onClick={() => setShowUserMenu(true)}>
          <User />
        </button>
        <ThemeToggler />
      </div>
      <Outlet />
      {showUserMenu && (
        <div className="fixed inset-0 z-50">
          {/* Background overlay */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur"
            onClick={() => setShowUserMenu(false)}
          />

          {/* Menu card */}
          <div className="absolute top-16 right-5 animate-fadeScale">
            <div className={`
              ${theme === "dark" ? (
                "bg-neutral-900 text-white border border-white/10"
              ) : (
                "bg-white text-black border border-black/10"
              )}
              p-4 min-w-48 max-w-xs rounded-xl shadow-lg flex flex-col gap-2`}
            >
              {!auth.isAuth ? (
                <Link
                  to="/create"
                  className="w-full py-2 rounded-lg font-semibold
                  border border-current text-center
                  hover:opacity-60 px-3
                  transition-all duration-200"
                  onClick={() => setShowUserMenu(false)}
                  viewTransition
                  replace
                >
                  Create Account
                </Link>
              ) : (
                <div className="my-3 flex flex-col gap-2">
                  <div className={`flex items-center gap-2 ${theme === "dark" ? "text-gray-400" : "text-gray-700"} text-sm border-b pb-2`}>
                    <User />
                    <span>Username</span>
                  </div>
                  <span className="truncate">{auth.username}</span>
                </div>
              )}

              <Link
                to={auth.isAuth ? "/logout" : "/login"}
                className="w-full py-2 rounded-lg font-semibold
                border border-current text-center
                hover:opacity-60 px-3
                transition-all duration-200"
                onClick={() => setShowUserMenu(false)}
                viewTransition
                replace
              >
                {auth.isAuth ? "Logout" : "Login"}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Layout