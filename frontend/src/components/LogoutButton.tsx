import React from "react";
import { useNavigate } from "react-router";
import axios from "axios";
import { LogOut } from "lucide-react";

const LogoutButton = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    const token = localStorage.getItem("token");

    axios
      .post("http://127.0.0.1:8000/logout/", null, {
        headers: {
          Authorization: `${token}`,
        },
      })
      .then(() => {
        // Clear token from localStorage
        localStorage.removeItem("token");
        // Redirect to login page
        navigate("/login");
      })
      .catch((error) => {
        console.error("Error logging out:", error);
        // Even if the server request fails, clear the local token
        localStorage.removeItem("token");
        navigate("/login");
      });
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 focus:outline-none"
    >
      <LogOut className="h-4 w-4" />
      <span>Logout</span>
    </button>
  );
};

export default LogoutButton;
