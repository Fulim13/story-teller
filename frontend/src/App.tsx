import { useNavigate } from "react-router";
import { useEffect } from "react";

function App() {
  const navigate = useNavigate();
  let token = "";

  useEffect(() => {
    token = localStorage.getItem("token") || "";
    if (!token) {
      navigate("/login");
    } else {
      navigate("/stories");
    }
  }, [navigate]);

  return <></>;
}

export default App;
