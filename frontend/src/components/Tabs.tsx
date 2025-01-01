import React, { useState } from "react";
import axios from "axios";
import { ImageOff, Image, Loader, Edit3 } from "lucide-react";

interface Chapter {
  id: number;
  title: string;
  content: string;
  position: number;
  characters: Character[];
}

interface Character {
  id: number;
  name: string;
  image: string;
  biography: string;
  appearance: string;
}

interface TabsProps {
  chapters: Chapter[];
  characters: Character[];
  updateCharacterImage: (updatedCharacter: Character) => void;
  updateChapterContent: (updatedChapter: Chapter) => void;
  removeChapter: (chapterId: number) => void;
  updateCharacterDetails: (updatedCharacter: Character) => void;
  removeCharacter: (characterId: number) => void;
}

const Tabs: React.FC<TabsProps> = ({
  chapters,
  characters,
  updateCharacterImage,
  updateChapterContent,
  removeChapter,
  updateCharacterDetails,
  removeCharacter,
}) => {
  const [activeTab, setActiveTab] = useState<"Chapter" | "Character">(
    "Chapter"
  );
  const [generatingImageId, setGeneratingImageId] = useState<number | null>(
    null
  );

  const [editingChapterId, setEditingChapterId] = useState<number | null>(null);
  const [editedContent, setEditedContent] = useState<string>("");
  const [editingCharacterId, setEditingCharacterId] = useState<number | null>(
    null
  );
  const [editedBiography, setEditedBiography] = useState<string>("");
  const [editedAppearance, setEditedAppearance] = useState<string>("");

  const handleEditClick = (chapter: Chapter) => {
    setEditingChapterId(chapter.id);
    setEditedContent(chapter.content);
  };

  const handleSave = (chapter: Chapter) => {
    // Send the updated content to the backend or update state
    // Example: Use an API call here
    const stories = new URL(window.location.href).pathname.split("/").pop();
    axios
      .put(
        `http://127.0.0.1:8000/stories/${stories}/chapters/${chapter.id}/`,
        {
          content: editedContent,
        },
        {
          headers: {
            Authorization: localStorage.getItem("token"),
          },
        }
      )
      .then((response) => {
        // call the update function to update the character
        updateChapterContent({
          ...chapter,
          content: response.data.content,
        });
      });

    chapter.content = editedContent; // Update the local state if required
    setEditingChapterId(null);
  };

  const handleDeleteChapter = (chapterId: number) => {
    const stories = new URL(window.location.href).pathname.split("/").pop();
    axios
      .delete(
        `http://127.0.0.1:8000/stories/${stories}/chapters/${chapterId}/`,
        {
          headers: {
            Authorization: localStorage.getItem("token"),
          },
        }
      )
      .then((response) => {
        // call the update function to update the character
        console.log(response);
        removeChapter(chapterId);
      })
      .catch((error) => {
        console.error("Error deleting chapter:", error);
      });
  };

  const handleCharacterEditClick = (character: Character) => {
    setEditingCharacterId(character.id);
    setEditedBiography(character.biography);
    setEditedAppearance(character.appearance);
  };

  const handleCharacterSave = (character: Character) => {
    // Send updated character details to backend
    // axios.put(`/api/characters/${character.id}`, {
    //   biography: editedBiography,
    //   appearance: editedAppearance
    // });
    const stories = new URL(window.location.href).pathname.split("/").pop();

    axios
      .put(
        `http://127.0.0.1:8000/stories/${stories}/characters/${character.id}/`,
        {
          biography: editedBiography,
          appearance: editedAppearance,
        },
        {
          headers: {
            Authorization: localStorage.getItem("token"),
          },
        }
      )
      .then((response) => {
        // call the update function to update the character
        updateCharacterDetails({
          ...character,
          biography: response.data.biography,
          appearance: response.data.appearance,
        });
      });

    // Update local state if needed
    character.biography = editedBiography;
    character.appearance = editedAppearance;
    setEditingCharacterId(null);
  };

  const handleDeleteCharacter = (characterId: number) => {
    // Add delete logic, such as making an API call to delete the character
    // axios.delete(`/api/characters/${characterId}`);

    const stories = new URL(window.location.href).pathname.split("/").pop();
    axios
      .delete(
        `http://127.0.0.1:8000/stories/${stories}/characters/${characterId}/`,
        {
          headers: {
            Authorization: localStorage.getItem("token"),
          },
        }
      )
      .then((response) => {
        // call the update function to update the character
        console.log(response);
        removeCharacter(characterId);
      })
      .catch((error) => {
        console.error("Error deleting chapter:", error);
      });
    console.log(`Character with ID ${characterId} deleted.`);
  };

  const generateCharacterImage = async (character: Character) => {
    setGeneratingImageId(character.id);
    const token = localStorage.getItem("token");

    try {
      const response = await axios.post(
        `http://127.0.0.1:8000/characters/${character.id}/generate-image/`,
        {
          prompt: `${character.name} - ${character.biography}`,
        },
        {
          headers: {
            Authorization: token!,
          },
        }
      );

      // Overwrite the props character image with the new image URL
      updateCharacterImage({
        ...character,
        image: response.data.image,
      });

      // Update the character with the new image
      // Assuming you want to update the image directly in the state (if characters are stored in a parent component)
      // Update logic based on how the character data is managed in the parent state
    } catch (error) {
      console.error("Error generating character image:", error);
    } finally {
      setGeneratingImageId(null);
    }
  };

  return (
    <div className="h-full flex flex-col px-10">
      {/* Tab Headers */}
      <div className="flex border-b border-gray-300">
        <button
          onClick={() => setActiveTab("Chapter")}
          className={`flex-1 p-3 text-center ${
            activeTab === "Chapter"
              ? "border-b-2 border-blue-600 font-semibold"
              : ""
          }`}
        >
          Chapter
        </button>
        <button
          onClick={() => setActiveTab("Character")}
          className={`flex-1 p-3 text-center ${
            activeTab === "Character"
              ? "border-b-2 border-blue-600 font-semibold"
              : ""
          }`}
        >
          Character
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 p-2 pt-4">
        {activeTab === "Chapter" && (
          <div>
            {chapters.map((chapter, index) => (
              <div
                key={chapter.id}
                className="mb-8 p-4 bg-white rounded-lg shadow-lg hover:shadow-lg transition-shadow duration-300"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Chapter {chapter.position} - {chapter.title}
                  </h2>
                  <button
                    onClick={() => handleEditClick(chapter)}
                    className="text-gray-600 hover:text-blue-500 transition-colors duration-200"
                  >
                    <Edit3 size={20} />
                  </button>
                </div>

                {editingChapterId === chapter.id ? (
                  <div>
                    <textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg h-64 resize-y"
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={() => setEditingChapterId(null)}
                        className="mr-2 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSave(chapter)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-700 mb-4">
                    {chapter.content}
                  </p>
                )}

                {/* Characters Involved */}
                <div>
                  <p className="font-semibold text-gray-800">
                    Characters Involved:
                  </p>
                  <ul className="list-disc list-inside pl-5 space-y-2 text-gray-600">
                    {chapter.characters.map((character) => (
                      <li
                        key={character.id}
                        className="hover:text-blue-500 transition-colors duration-200"
                      >
                        {character.name}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Delete Button for the Last Chapter */}
                {index === chapters.length - 1 && (
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => handleDeleteChapter(chapter.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Delete Chapter
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Character Tab Content */}
        {activeTab === "Character" && (
          <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 gap-6">
            {characters.map((character) => (
              <div key={character.id} className="flex flex-col items-center">
                <div className="relative w-48 h-48 mb-4 bg-gray-100 rounded-lg overflow-hidden group">
                  {character.image ? (
                    <>
                      <img
                        src={`http://127.0.0.1:8000${character.image}`}
                        alt={character.name}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => generateCharacterImage(character)}
                        disabled={generatingImageId === character.id}
                        className="absolute inset-0 bg-black bg-opacity-50 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2"
                      >
                        {generatingImageId === character.id ? (
                          <>
                            <Loader className="animate-spin" size={20} />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Image size={20} />
                            Regenerate Image
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => generateCharacterImage(character)}
                      disabled={generatingImageId === character.id}
                      className="w-full h-full flex flex-col items-center justify-center gap-2 hover:bg-gray-200 transition-colors duration-200"
                    >
                      {generatingImageId === character.id ? (
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

                {editingCharacterId === character.id ? (
                  <div className="w-full space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Biography:
                      </label>
                      <textarea
                        value={editedBiography}
                        onChange={(e) => setEditedBiography(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg resize-y"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Appearance:
                      </label>
                      <textarea
                        value={editedAppearance}
                        onChange={(e) => setEditedAppearance(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg resize-y"
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingCharacterId(null)}
                        className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleCharacterSave(character)}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600 font-medium">
                        Biography:
                      </p>
                      <button
                        onClick={() => handleCharacterEditClick(character)}
                        className="text-gray-400 hover:text-blue-500 transition-colors"
                      >
                        <Edit3 size={16} />
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 text-left overflow-hidden text-ellipsis max-h-20">
                      {character.biography}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-sm text-gray-600 font-medium">
                        Appearance:
                      </p>
                      <button
                        onClick={() => handleCharacterEditClick(character)}
                        className="text-gray-400 hover:text-blue-500 transition-colors"
                      >
                        <Edit3 size={16} />
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 text-left overflow-hidden text-ellipsis max-h-20">
                      {character.appearance}
                    </p>
                  </div>
                )}

                {/* Delete Button */}
                <button
                  onClick={() => handleDeleteCharacter(character.id)}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete Character
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Tabs;
