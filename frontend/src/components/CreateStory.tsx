import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router";
import { Book, ArrowLeft } from "lucide-react";

interface CreateStoryFormData {
  title: string;
  genre: string;
}

const CreateStory = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CreateStoryFormData>({
    title: "",
    genre: "",
  });
  const [error, setError] = useState<string>("");

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleBackClick = () => {
    navigate("/stories");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    if (!token) {
      setError("No authentication token found");
      navigate("/login");
      return;
    }

    try {
      await axios.post("http://127.0.0.1:8000/stories/", formData, {
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
      });

      setFormData({ title: "", genre: "" });
      navigate("/stories");
    } catch (error) {
      setError("Failed to create story. Please try again.");
      console.error("Error creating story:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="px-8 pt-8 pb-6 bg-gradient-to-r from-blue-600 to-indigo-600">
            <button
              onClick={handleBackClick}
              className="inline-flex items-center px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors duration-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Stories
            </button>
            <div className="mt-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <Book className="w-6 h-6 mr-2" />
                Create New Story
              </h2>
            </div>
          </div>

          <div className="px-8 py-6">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
                <p className="font-medium">Oops! Something went wrong</p>
                <p className="text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Story Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your story title"
                  className="block w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors duration-200"
                />
              </div>

              <div>
                <label
                  htmlFor="genre"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Genre
                </label>
                <select
                  id="genre"
                  name="genre"
                  value={formData.genre}
                  onChange={handleInputChange}
                  required
                  className="block w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors duration-200"
                >
                  <option value="">Select a genre</option>
                  <option value="Fantasy">Fantasy</option>
                  <option value="Action">Action</option>
                  <option value="Horror">Horror</option>
                  <option value="Humor">Humor</option>
                  <option value="SciFi">SciFi</option>
                  <option value="Romantic">Romantic</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
              >
                Create Story
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateStory;
