import { useEffect, useState } from "react";
import ChatMessage from "./ChatMessage";

const ChatBox = () => {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [user, setUser] = useState(null);

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // setIsAuthenticated(false);
    return !!localStorage.getItem("access");
  });

  const [sessions, setSessions] = useState(() => {
    return (
      JSON.parse(localStorage.getItem("sessions")) || [
        { id: 1, title: "New chat" },
      ]
    );
  });

  const [activeSessionId, setActiveSessionId] = useState(() => {
    return JSON.parse(localStorage.getItem("activeSessionId")) || 1;
  });

  const [messages, setMessages] = useState(() => {
    return JSON.parse(localStorage.getItem("messages")) || { 1: [] };
  });

  // Sync all to localStorage
  useEffect(() => {
    localStorage.setItem("sessions", JSON.stringify(sessions));
  }, [sessions]);
  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) return;

    fetch("http://localhost:8000/api/user/", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setUser(data);
      })
      .catch((err) => {
        console.error("Failed to fetch user info:", err);
      });
  }, []);

  useEffect(() => {
    localStorage.setItem("messages", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem("activeSessionId", JSON.stringify(activeSessionId));
  }, [activeSessionId]);

  const sendMessage = async () => {
    if (!input.trim() || sending) return;

    const userMessage = { role: "user", content: input };
    const updatedUserMessages = [
      ...(messages[activeSessionId] || []),
      userMessage,
    ];

    setMessages((prev) => ({
      ...prev,
      [activeSessionId]: updatedUserMessages,
    }));

    setInput("");
    setSending(true);

    try {
      const response = await fetch("http://localhost:8000/api/chat/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: input }),
      });

      if (!response.ok) throw new Error("Network error");

      const data = await response.json();
      const botMessage = { role: "assistant", content: data.response };

      setMessages((prev) => ({
        ...prev,
        [activeSessionId]: [...(prev[activeSessionId] || []), botMessage],
      }));

      // Update title if needed
      setSessions((prev) => {
        return prev.map((s) =>
          s.id === activeSessionId &&
          (s.title === "New chat" || s.title.startsWith("Chat "))
            ? { ...s, title: userMessage.content.slice(0, 20) }
            : s
        );
      });
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setSending(false);
    }
  };

  const handleClear = () => {
    setMessages({ ...messages, [activeSessionId]: [] });
  };

  const handleNewSession = () => {
    const newId = Math.max(...sessions.map((s) => s.id)) + 1;
    const updatedSessions = [
      ...sessions,
      { id: newId, title: `Chat ${newId}` },
    ];
    setSessions(updatedSessions);
    setActiveSessionId(newId);
    setMessages({ ...messages, [newId]: [] });
  };

  const handleEditSession = (id) => {
    const newTitle = prompt("Edit session name:");
    if (newTitle) {
      const updated = sessions.map((s) =>
        s.id === id ? { ...s, title: newTitle } : s
      );
      setSessions(updated);
    }
  };

  const handleDeleteSession = (id) => {
    const updatedSessions = sessions.filter((s) => s.id !== id);
    const updatedMessages = { ...messages };
    delete updatedMessages[id];

    setSessions(updatedSessions);
    setMessages(updatedMessages);

    if (activeSessionId === id && updatedSessions.length > 0) {
      setActiveSessionId(updatedSessions[0].id);
    }
  };
  const handleSora = () => {
    const description = prompt("🎞️ Enter a scene description for Sora:");

    if (!description || !description.trim()) {
      alert("Scene description cannot be empty.");
      return;
    }

    // Simulate a bot response
    const userMessage = { role: "user", content: `Sora: ${description}` };
    const botMessage = {
      role: "assistant",
      content: `🧠 Sora would generate a video for: "${description}". (Functionality coming soon!)`,
    };

    const updated = [
      ...(messages[activeSessionId] || []),
      userMessage,
      botMessage,
    ];
    setMessages((prev) => ({
      ...prev,
      [activeSessionId]: updated,
    }));

    // Auto rename session title
    const sessionIndex = sessions.findIndex((s) => s.id === activeSessionId);
    if (
      sessions[sessionIndex].title === `Chat ${activeSessionId}` ||
      sessions[sessionIndex].title === "New chat"
    ) {
      const newSessions = [...sessions];
      newSessions[sessionIndex].title = `Sora: ${description.slice(0, 20)}`;
      setSessions(newSessions);
    }
  };

  const handleSearch = () => {
    const query = prompt("🔍 Enter your search term:");
    if (!query) return;

    const currentSessionMessages = messages[activeSessionId] || [];
    const matchedMessages = currentSessionMessages.filter((msg) =>
      msg.content.toLowerCase().includes(query.toLowerCase())
    );

    if (matchedMessages.length === 0) {
      alert("No matches found.");
    } else {
      const summary = matchedMessages
        .map((msg, i) => `${i + 1}. [${msg.role}] ${msg.content}`)
        .join("\n\n");
      alert(`Found ${matchedMessages.length} match(es):\n\n${summary}`);
    }
  };

  const handleLibrary = () => {
    const msg = { role: "assistant", content: "📚 Library is being built!" };
    setMessages((prev) => ({
      ...prev,
      [activeSessionId]: [...(prev[activeSessionId] || []), msg],
    }));
  };

  const handleGpts = () => {
    const task = prompt("🤖 What do you want a GPT to help you with?");

    if (!task || !task.trim()) {
      alert("Task cannot be empty.");
      return;
    }

    const userMessage = { role: "user", content: `GPTs: ${task}` };
    const botMessage = {
      role: "assistant",
      content: `🤖 A GPT specialized in "${task}" could assist you with this. (Coming soon: tool suggestions!)`,
    };

    const updated = [
      ...(messages[activeSessionId] || []),
      userMessage,
      botMessage,
    ];
    setMessages((prev) => ({
      ...prev,
      [activeSessionId]: updated,
    }));

    // Rename session if default
    const sessionIndex = sessions.findIndex((s) => s.id === activeSessionId);
    if (
      sessions[sessionIndex].title === `Chat ${activeSessionId}` ||
      sessions[sessionIndex].title === "New chat"
    ) {
      const newSessions = [...sessions];
      newSessions[sessionIndex].title = `GPTs: ${task.slice(0, 20)}`;
      setSessions(newSessions);
    }
  };
  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setIsAuthenticated(false);
    // window.location.href = "/login";
  };

  const currentMessages = messages[activeSessionId] || [];

  const handleNotImplemented = (name) => {
    alert(`${name} is not implemented yet.`);
  };

  return (
    <div className="flex h-screen text-white bg-[#343541]">
      {/* Sidebar */}
      <div className="w-64 bg-[#202123] flex flex-col border-r border-gray-700">
        <div className="p-4 border-b border-gray-700">
          <button
            onClick={handleNewSession}
            className="w-full bg-gray-600 hover:bg-gray-500 text-sm text-white py-2 px-3 rounded transition-all"
          >
            + New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
          <button
            onClick={handleSearch}
            className="w-full text-left text-sm text-white py-2 px-3 rounded hover:bg-gray-700"
          >
            🔍 Search
          </button>
          <button
            onClick={handleLibrary}
            className="w-full text-left text-sm text-white py-2 px-3 rounded hover:bg-gray-700"
          >
            📚 Library
          </button>
          <button
            onClick={handleSora}
            className="w-full text-left text-sm text-white py-2 px-3 rounded hover:bg-gray-700"
          >
            🎞️ Sora
          </button>
          <button
            onClick={handleGpts}
            className="w-full text-left text-sm text-white py-2 px-3 rounded hover:bg-gray-700"
          >
            🤖 GPTs
          </button>

          <hr className="my-2 border-gray-600" />

          {sessions.map((session) => (
            <div
              key={session.id}
              className={`group flex items-center justify-between p-2 rounded cursor-pointer ${
                session.id === activeSessionId
                  ? "bg-gray-600"
                  : "hover:bg-gray-700"
              }`}
            >
              <span
                className="flex-1 truncate"
                onClick={() => setActiveSessionId(session.id)}
                title={session.title}
              >
                {session.title}
              </span>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEditSession(session.id)}
                  className="text-gray-400 hover:text-white text-xs"
                  title="Edit"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDeleteSession(session.id)}
                  className="text-red-400 hover:text-red-600 text-xs"
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-700 text-xs text-gray-400">
          <div className="mb-1">© 2025 ChatClone</div>
          <div className="text-[10px]">Made by Aarush</div>
          {isAuthenticated ? (
            <div className="mt-4 space-y-2">
              {user && (
                <div className="text-white text-sm">
                  👋 Welcome,{" "}
                  <span className="font-semibold">{user.first_name}</span>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="text-red-400 hover:text-red-600 text-sm block"
              >
                🚪 Logout
              </button>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              <button
                onClick={() => (window.location.href = "/login")}
                className="text-green-400 hover:text-green-600 text-sm block"
              >
                🔐 Login
              </button>
              <button
                onClick={() => (window.location.href = "/register")}
                className="text-blue-400 hover:text-blue-600 text-sm block"
              >
                📝 Register
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex flex-col justify-between flex-1 p-4 bg-[#343541]">
        <div className="flex-1 overflow-y-auto pr-2">
          {currentMessages.map((msg, i) => (
            <ChatMessage key={i} role={msg.role} content={msg.content} />
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <input
            className="flex-1 bg-[#40414f] text-white placeholder-gray-300 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            type="text"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button
            onClick={sendMessage}
            disabled={sending}
            className="bg-gray-200 hover:bg-gray-300 text-black px-4 py-2 rounded-lg text-sm shadow-sm"
          >
            Send
          </button>
          <button
            onClick={handleClear}
            className="bg-gray-200 hover:bg-gray-300 text-black px-4 py-2 rounded-lg text-sm shadow-sm"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
