import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./App.css";

import { ToastContainer } from "react-toastify"; // Import ToastContainer
import "react-toastify/dist/ReactToastify.css";
import { LoginPage } from "./pages/Authentication/LoginPage";
import { RegisterPage } from "./pages/Authentication/RegisterPage";
import { Dashboard } from "./pages/Dashboard/Dashboard";
import { Course } from "./pages/Course/Course";
import { TaskDetails } from "./components/TaskDetails/TaskDetails";
import { PersistentLayout } from "./components/PersistentLayout/PersistentLayout";
import { TransitionProvider } from "./context/TransitionContext";

const router = createBrowserRouter([
  {
    path: "/",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/", // Routes with the persistent layout
    element: <PersistentLayout />,
    children: [
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "course/:courseCode",
        element: <Course />,
      },
      {
        path: "course/:courseCode/:task",
        element: <TaskDetails />,
      },
    ],
  },
]);

function App() {
  return (
    <TransitionProvider>
      <RouterProvider router={router} />
      <ToastContainer />
    </TransitionProvider>
  );
}

export default App;
