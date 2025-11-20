import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Home from "./page/Home";
import Login from "./page/Login";
import Create from "./page/Create";
import Layout from "./layout/Layout";
import { ThemeProvider } from "./context/ThemeProvider";
import AuthProvider from "./context/AuthProvider";
import Logout from "./page/Logout";
import Delete from "./page/Delete";

const App = () => {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Layout />,
      children: [
        { index: true, element: <Home /> },
        { path: "/login", element: <Login /> },
        { path: "/logout", element: <Logout /> },
        { path: "/create", element: <Create /> },
        { path: "/delete", element: <Delete /> },
      ]
    },
  ]);

  return (
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App