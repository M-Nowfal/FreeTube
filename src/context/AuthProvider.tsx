import { createContext, useEffect, useState } from "react"
type Auth = { isAuth: boolean, username: string };
type IAuthContext = {
  auth: Auth;
  toggleAuth: (isAuth: boolean, username: string) => void;
}

export const AuthContext = createContext<IAuthContext>({ auth: { isAuth: false, username: "" }, toggleAuth: () => { } });

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [auth, setAuth] = useState<Auth>({ isAuth: false, username: "" });

  useEffect(() => {
    const storedAuth = localStorage.getItem("auth");
    if (storedAuth)
      setAuth({ isAuth: true, username: JSON.parse(storedAuth).username });
  }, []);

  const toggleAuth = (isAuth: boolean, username: string) => setAuth({ isAuth, username });
  return (
    <AuthContext.Provider value={{ auth, toggleAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider