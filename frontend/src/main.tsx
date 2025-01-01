import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter, Routes, Route } from "react-router";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import StoriesList from "./components/StoriesList.tsx";
import StoriesDetails from "./components/StoriesDetails.tsx";
import "bootstrap/dist/css/bootstrap.css";
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import CreateStory from "./components/CreateStory.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="login" element={<LoginForm />} />
        <Route path="register" element={<RegisterForm />} />
        <Route path="stories" element={<StoriesList />} />
        <Route path="stories/:story_id" element={<StoriesDetails />} />
        <Route path="create-story" element={<CreateStory />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
