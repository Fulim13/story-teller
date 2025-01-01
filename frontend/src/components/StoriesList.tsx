import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import LogoutButton from "./LogoutButton";
import {
  Book,
  ArrowRight,
  Trash2,
  ImageOff,
  Image,
  Loader,
  Pencil,
  Check,
  X,
} from "lucide-react";

interface Story {
  id: number;
  title: string;
  genre: string;
  summary: string;
  image: string;
}

const StoriesList = () => {
  const navigate = useNavigate();
  const [stories, setStories] = useState<Story[]>([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [generatingImageId, setGeneratingImageId] = useState<number | null>(
    null
  );
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingField, setEditingField] = useState<"title" | "genre" | null>(
    null
  );
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = () => {
    const token = localStorage.getItem("token");
    if (token) {
      axios
        .get("http://127.0.0.1:8000/stories/", {
          headers: {
            Authorization: `${token}`,
          },
        })
        .then((response) => {
          console.log("Stories:", response.data);
          setStories(response.data);
        })
        .catch((error) => {
          console.error("There was an error!", error);
          if (error.response.status === 403) {
            navigate("/login");
          }
        });
    } else {
      console.error("No token found");
    }
  };

  const viewStoryDetails = (story_id: number) => {
    axios
      .get(`http://127.0.0.1:8000/stories/${story_id}`, {
        headers: {
          Authorization: localStorage.getItem("token"),
        },
      })
      .then((res) => {
        console.log("Story details:", res.data);
        navigate(`/stories/${story_id}`);
      });
  };

  const deleteStory = (story_id: number) => {
    if (deleteConfirmId === story_id) {
      setDeleteConfirmId(null);
    } else {
      setDeleteConfirmId(story_id);
      return;
    }

    axios
      .delete(`http://127.0.0.1:8000/stories/${story_id}/`, {
        headers: {
          Authorization: localStorage.getItem("token"),
        },
      })
      .then(() => {
        setStories((prev) => prev.filter((story) => story.id !== story_id));
      })
      .catch((error) => {
        console.error("Error deleting story:", error);
      });
  };

  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    const target = e.target as HTMLImageElement;
    target.style.display = "none";
    target.nextElementSibling?.classList.remove("hidden");
  };

  const generateImage = async (story: Story) => {
    // If there's already an image, set generating state to true
    setGeneratingImageId(story.id);

    const token = localStorage.getItem("token");

    try {
      // If an image exists, regenerate it; otherwise, create a new image
      const response = await axios.post(
        `http://127.0.0.1:8000/stories/${story.id}/generate-image/`,
        {
          prompt: `${story.title} - ${story.summary}`,
        },
        {
          headers: {
            Authorization: token,
          },
        }
      );

      // Update the story with the new image (whether it was a new or regenerated image)
      setStories((prev) =>
        prev.map((s) =>
          s.id === story.id ? { ...s, image: response.data.image } : s
        )
      );
    } catch (error) {
      console.error("Error generating image:", error);
    } finally {
      // Reset generating state once the image generation is complete
      setGeneratingImageId(null);
    }
  };

  const startEditing = (story: Story, field: "title" | "genre") => {
    setEditingId(story.id);
    setEditingField(field);
    setEditValue(story[field]);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingField(null);
    setEditValue("");
  };

  const saveEdit = async (storyId: number) => {
    if (!editingField) return;

    try {
      const response = await axios.patch(
        `http://127.0.0.1:8000/stories/${storyId}/`,
        { [editingField]: editValue },
        {
          headers: {
            Authorization: localStorage.getItem("token"),
          },
        }
      );

      console.log("Updated story:", response.data);

      setStories(
        stories.map((story) =>
          story.id === storyId ? { ...story, [editingField]: editValue } : story
        )
      );

      cancelEditing();
    } catch (error) {
      console.error("Error updating story:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Your Stories</h1>
          <div className="flex gap-4">
            <button
              onClick={() => navigate("/create-story")}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2 shadow-sm"
            >
              <Book size={20} />
              Create New Story
            </button>
            <LogoutButton />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.map((story) => (
            <div
              key={story.id}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border border-gray-100"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 flex items-start gap-2">
                    {editingId === story.id && editingField === "title" ? (
                      <div className="flex items-center gap-2 w-full">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="flex-1 text-xl font-bold text-gray-800 border rounded px-2 py-1"
                          autoFocus
                        />
                        <button
                          onClick={() => saveEdit(story.id)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <Check size={18} />
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <h2 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">
                          {story.title}
                        </h2>
                        <button
                          onClick={() => startEditing(story, "title")}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Pencil size={16} />
                        </button>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {editingId === story.id && editingField === "genre" ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-18 text-sm border rounded px-2 py-1"
                          autoFocus
                        >
                          <option value="Fantasy">Fantasy</option>
                          <option value="Action">Action</option>
                          <option value="Horror">Horror</option>
                          <option value="Humor">Humor</option>
                          <option value="SciFi">SciFi</option>
                          <option value="Romantic">Romantic</option>
                        </select>
                        <button
                          onClick={() => saveEdit(story.id)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="px-3 py-1 bg-blue-50 text-blue-600 text-sm font-medium rounded-full">
                          {story.genre}
                        </span>
                        <button
                          onClick={() => startEditing(story, "genre")}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Pencil size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="relative w-full h-64 mb-4 bg-gray-100 rounded-lg overflow-hidden group">
                  {story.image ? (
                    <>
                      <img
                        src={`http://127.0.0.1:8000${story.image}`}
                        alt={story.title}
                        className="w-full h-full object-cover"
                        onError={handleImageError}
                      />
                      <div className="hidden w-full h-full flex items-center justify-center">
                        <ImageOff className="text-gray-400" size={32} />
                      </div>
                      <button
                        onClick={() => {
                          // Trigger the image generation
                          generateImage(story);
                          // Set the generating image ID to the current story ID
                          setGeneratingImageId(story.id);
                        }}
                        disabled={generatingImageId === story.id}
                        className="absolute inset-0 bg-black bg-opacity-50 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2"
                      >
                        {generatingImageId === story.id ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                            <Loader
                              className="animate-spin text-white"
                              size={24}
                            />
                            <span className="text-white ml-2">
                              Generating...
                            </span>
                          </div>
                        ) : (
                          <Image size={20} />
                        )}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => generateImage(story)}
                      disabled={generatingImageId === story.id}
                      className="w-full h-full flex flex-col items-center justify-center gap-2 hover:bg-gray-200 transition-colors duration-200"
                    >
                      {generatingImageId === story.id ? (
                        <>
                          <Loader
                            className="animate-spin text-gray-400"
                            size={32}
                          />
                          <span className="text-gray-500">
                            Generating Image...
                          </span>
                        </>
                      ) : (
                        <>
                          <Image className="text-gray-400" size={32} />
                          <span className="text-gray-500">Generate Image</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <p className="text-gray-600 mt-3 mb-4 line-clamp-3 text-sm leading-relaxed">
                  {story.summary}
                </p>

                <div className="flex gap-2 mt-4">
                  <button
                    className="flex-1 px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors duration-200 flex items-center justify-center gap-2 font-medium"
                    onClick={() => viewStoryDetails(story.id)}
                  >
                    Read More
                    <ArrowRight size={18} />
                  </button>

                  {deleteConfirmId === story.id ? (
                    <button
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 flex items-center justify-center gap-2"
                      onClick={() => deleteStory(story.id)}
                    >
                      Confirm
                    </button>
                  ) : (
                    <button
                      className="px-4 py-2 bg-gray-50 text-red-500 rounded-lg hover:bg-red-50 transition-colors duration-200 flex items-center justify-center"
                      onClick={() => deleteStory(story.id)}
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {stories.length === 0 && (
          <div className="text-center py-12">
            <Book size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-600 mb-2">
              No Stories Yet
            </h3>
            <p className="text-gray-500">
              Create your first story to get started!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoriesList;
