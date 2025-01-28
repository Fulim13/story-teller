import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import ChatInterface from "./ChatInterface";
import Tabs from "./Tabs";
import axios from "axios";
import LogoutButton from "./LogoutButton";

const StoriesDetails = () => {
  const navigate = useNavigate();
  interface Story {
    title: string;
    genre: string;
  }

  interface Character {
    id: number;
    name: string;
    image: string;
    biography: string;
    appearance: string;
  }

  interface Chapter {
    id: number;
    title: string;
    content: string;
    position: number;
    // characters: Character[];
  }

  const [story, setStory] = useState<Story>({ title: "", genre: "" });
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"Chapter" | "Character">(
    "Chapter"
  );

  const handleBackClick = () => {
    navigate(-1); // Navigate to the previous page
  };

  useEffect(() => {
    const token = localStorage.getItem("token") || "";

    if (!token) {
      navigate("/login");
      return;
    }

    const fetchStoryData = async () => {
      setActiveTab("Chapter"); // Set the active tab to "Chapter" by default
      try {
        const storyId = new URL(window.location.href).pathname.split("/").pop(); // Extract the story ID from the URL

        // Make all three requests in parallel using Promise.all
        const [storyResponse, chapterResponse, charactersResponse] =
          await Promise.all([
            axios.get(`http://127.0.0.1:8000/stories/${storyId}/`, {
              headers: {
                Authorization: `${token}`,
              },
            }),
            axios.get(`http://127.0.0.1:8000/stories/${storyId}/chapters`, {
              headers: {
                Authorization: `${token}`,
              },
            }),
            axios.get(`http://127.0.0.1:8000/stories/${storyId}/characters`, {
              headers: {
                Authorization: `${token}`,
              },
            }),
          ]);

        console.log("Chapter Data:", chapterResponse);
        console.log("Characters Data:", charactersResponse);
        console.log("Story Data:", storyResponse);

        // Set the chapters, title, and characters
        setChapters(chapterResponse.data || []);
        setStory(storyResponse.data || ""); // Assuming the title is in the `title` field of the response
        setCharacters(charactersResponse.data || []);
      } catch (err) {
        console.error("Error fetching story data:", err);
        setError("Failed to load story data. Please try again later.");
      }
    };

    fetchStoryData();
  }, [navigate]);

  const fetchStoryData = async () => {
    const token = localStorage.getItem("token") || "";
    setActiveTab("Chapter"); // Set the active tab to "Chapter" by default
    try {
      const storyId = new URL(window.location.href).pathname.split("/").pop(); // Extract the story ID from the URL

      // Make all three requests in parallel using Promise.all
      const [storyResponse, chapterResponse, charactersResponse] =
        await Promise.all([
          axios.get(`http://127.0.0.1:8000/stories/${storyId}/`, {
            headers: {
              Authorization: `${token}`,
            },
          }),
          axios.get(`http://127.0.0.1:8000/stories/${storyId}/chapters`, {
            headers: {
              Authorization: `${token}`,
            },
          }),
          axios.get(`http://127.0.0.1:8000/stories/${storyId}/characters`, {
            headers: {
              Authorization: `${token}`,
            },
          }),
        ]);

      console.log("Chapter Data:", chapterResponse);
      console.log("Characters Data:", charactersResponse);
      console.log("Story Data:", storyResponse);

      // Set the chapters, title, and characters
      setChapters(chapterResponse.data || []);
      setStory(storyResponse.data || ""); // Assuming the title is in the `title` field of the response
      setCharacters(charactersResponse.data || []);
    } catch (err) {
      console.error("Error fetching story data:", err);
      setError("Failed to load story data. Please try again later.");
    }
  };

  const fetchCharacter = async () => {
    try {
      const token = localStorage.getItem("token") || "";
      const storyId = window.location.pathname.split("/").pop();
      const response = await axios.get(
        `http://127.0.0.1:8000/stories/${storyId}/characters`,
        {
          headers: {
            Authorization: `${token}`,
          },
        }
      );
      setCharacters(response.data || []);
    } catch (err) {
      console.error("Error fetching characters:", err);
      setError("Failed to load characters. Please try again later.");
    }
  };

  const handleCharacterTab = async () => {
    try {
      await fetchCharacter(); // Fetch character data first
      setActiveTab("Character"); // Then switch to Character tab
    } catch (error) {
      console.error("Failed to load character data:", error);
      // Optional: Add error notification here
    }
  };

  const updateCharacterImage = (updatedCharacter: Character) => {
    setCharacters((prevCharacters) =>
      prevCharacters.map((character: Character) =>
        character.id === updatedCharacter.id
          ? { ...character, image: updatedCharacter.image }
          : character
      )
    );
  };

  const updateChapterContent = (updatedChapter: Chapter) => {
    setChapters((prevChapters) =>
      prevChapters.map((chapter: Chapter) =>
        chapter.id === updatedChapter.id
          ? { ...chapter, content: updatedChapter.content }
          : chapter
      )
    );
  };

  const removeChapter = (chapterId: number) => {
    setChapters((prevChapters) =>
      prevChapters.filter((chapter) => chapter.id !== chapterId)
    );
  };

  const updateCharacterDetails = (updatedCharacter: Character) => {
    setCharacters((prevCharacters) =>
      prevCharacters.map((character: Character) =>
        character.id === updatedCharacter.id ? updatedCharacter : character
      )
    );
  };

  const removeCharacter = (characterId: number) => {
    setCharacters((prevCharacters) =>
      prevCharacters.filter((character) => character.id !== characterId)
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Back Button */}
      <div className="flex-shrink-0 p-2 bg-gray-100 border-b border-gray-300 flex items-center justify-between">
        {/* Back Button - Aligned Left */}
        <button
          onClick={handleBackClick}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-gray-800"
        >
          ← Back
        </button>

        <div className="flex items-center justify-center gap-3 flex-1">
          <h2 className="text-xl font-bold text-gray-800 line-clamp-2 text-center m-0">
            {story.title}
          </h2>
          <span className="px-3 py-1 bg-blue-50 text-blue-600 text-sm font-medium rounded-full self-center">
            {story.genre}
          </span>
        </div>

        {/* Logout Button - Aligned Right */}
        <LogoutButton />
      </div>

      {/* Main Content */}
      <div className="flex flex-1">
        {/* Tabs Section */}
        <div className="w-1/2 border-r border-gray-300">
          {error ? (
            <div className="p-4 text-red-500">{error}</div>
          ) : (
            <Tabs
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              chapters={chapters}
              characters={characters}
              updateCharacterImage={updateCharacterImage}
              updateChapterContent={updateChapterContent}
              removeChapter={removeChapter}
              updateCharacterDetails={updateCharacterDetails}
              removeCharacter={removeCharacter}
            />
          )}
        </div>
        {/* Chat Interface Section */}
        <div className="w-1/2 h-screen">
          <ChatInterface
            setActiveTab={setActiveTab}
            setCharacter={() => {
              handleCharacterTab();
            }}
            setStory={() => fetchStoryData()}
          />
        </div>
      </div>
    </div>
  );
};

export default StoriesDetails;
