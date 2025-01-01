import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Thermometer } from "lucide-react";
import axios from "axios";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [selectedModel, setSelectedModel] = useState("gpt-4");
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // State for backend steps
  const [step, setStep] = useState(1);
  const [topic, setTopic] = useState("");
  const [genre, setGenre] = useState("Adventure");
  const [interviewQuestions, setInterviewQuestions] = useState<string[]>([]);
  const [outlineResult, setOutlineResult] = useState("");
  const [characterResult, setCharacterResult] = useState("");
  const [stories, setStories] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string>("");

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "inherit";
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [inputMessage]);

  const handleSubmit = async () => {
    if (!inputMessage.trim()) return;

    const newMessage: Message = {
      role: "user",
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const storyId = window.location.pathname.split("/").pop();
      //   if (step === 3) {
      //     setAnswers(inputMessage);
      //   }

      const response = await axios.post(
        "http://127.0.0.1:8000/chat/",
        {
          step,
          message: inputMessage,
          topic,
          genre,
          interview_questions: interviewQuestions,
          outline_result: outlineResult,
          character_result: characterResult,
          answers: inputMessage, // In step 2, this would be the user's answers
          storyId,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: localStorage.getItem("token") || "",
          },
        }
      );

      const data = response.data;

      // Handle the backend response and update state
      if (data.step === 2) {
        setInterviewQuestions(data.interview_questions || []);
        setTopic(data.topic);
        setMessages((prev) => [
          ...prev,
          ...data.interview_questions.map((question) => ({
            role: "assistant",
            content: question, // Each question will be sent as a separate message
            timestamp: new Date(),
          })),
        ]);
      } else if (data.step === 3) {
        console.log(data.outline_result);
        setOutlineResult(data.outline_result || "");
        const formattedOutline = data.outline_result[0][1]
          .map((chapter) => {
            return `Chapter ${chapter[0][1]}: ${chapter[1][1]}`;
          })
          .join("\n");

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: formattedOutline,
            timestamp: new Date(),
          },
        ]);
        setInterviewQuestions(data.interview_questions || []);
      } else if (data.step === 4) {
        console.log(data.character_result);
        setCharacterResult(data.character_result || "");
        setCharacterResult(data.character_result || "");
        const characterResultString = data.character_result[0][1] // Access the characters array
          .map((character) => {
            const name = character[0][1] ? character[0][1] : "Unknown Name";
            const appearance = character[1][1]
              ? character[1][1]
              : "Unknown Appearance";
            const biography = character[2][1]
              ? character[2][1]
              : "No biography available.";

            return `Name: ${name}\nAppearance: ${appearance}\nBiography: ${biography}`;
          })
          .join("\n\n");

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: characterResultString, // Use the formatted character result here
            timestamp: new Date(),
          },
        ]);
      } else if (data.step === 5) {
        setStories(data.stories || []);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.stories.join("\n"),
            timestamp: new Date(),
          },
        ]);
      }

      // Update the step
      setStep(data.step);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with controls */}
      <div className="flex-shrink-0 flex items-center gap-4 p-4 bg-white shadow-sm">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Model:</label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="px-3 py-1.5 rounded border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="gpt-4">GPT-4</option>
            <option value="gpt-3.5">GPT-3.5</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Thermometer size={16} className="text-gray-600" />
          <label className="text-sm font-medium text-gray-700">
            Temperature: {temperature}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={temperature}
            onChange={(e) => setTemperature(Number(e.target.value))}
            className="w-32"
          />
        </div>
      </div>

      {/* Chat messages */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 bg-gray-50"
      >
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {message.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Bot size={20} className="text-blue-600" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-800 shadow-sm"
              }`}
            >
              {/* Split message by \n and render each part with <br /> */}
              {message.content &&
                typeof message.content === "string" &&
                message.content.split("\n").map((line, idx) => (
                  <React.Fragment key={idx}>
                    {line}
                    {idx !== message.content.split("\n").length - 1 && <br />}
                  </React.Fragment>
                ))}
              <div
                className={`text-xs mt-1 ${
                  message.role === "user" ? "text-blue-100" : "text-gray-400"
                }`}
              >
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
            {message.role === "user" && (
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                <User size={20} className="text-white" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-gray-500">
            <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" />
            <div
              className="w-2 h-2 rounded-full bg-gray-500 animate-bounce"
              style={{ animationDelay: "0.2s" }}
            />
            <div
              className="w-2 h-2 rounded-full bg-gray-500 animate-bounce"
              style={{ animationDelay: "0.4s" }}
            />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 p-4 bg-white shadow-sm">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 max-h-48 min-h-[2.5rem] resize-none"
            rows={1}
          />
          <button
            onClick={handleSubmit}
            disabled={!inputMessage.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
