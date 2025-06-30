import { useEffect, useState } from "react";
import ChatMessage from "./ChatMessage";

const ChatBox = () => {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [user, setUser] = useState(null);

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem("access");
  });

  // Initialize sessions with proper structure
  const [sessions, setSessions] = useState(() => {
    const stored = localStorage.getItem("sessions");
    if (stored) {
      return JSON.parse(stored);
    }
    // Default session structure
    const defaultSession = {
      id: 1,
      title: "New chat",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: 0,
    };
    return [defaultSession];
  });

  const [activeSessionId, setActiveSessionId] = useState(() => {
    const stored = localStorage.getItem("activeSessionId");
    return stored ? JSON.parse(stored) : 1;
  });

  // Store messages separately for each session
  const [sessionMessages, setSessionMessages] = useState(() => {
    const stored = localStorage.getItem("sessionMessages");
    return stored ? JSON.parse(stored) : { 1: [] };
  });

  // Sync sessions to localStorage
  useEffect(() => {
    localStorage.setItem("sessions", JSON.stringify(sessions));
  }, [sessions]);

  // Sync messages to localStorage
  useEffect(() => {
    localStorage.setItem("sessionMessages", JSON.stringify(sessionMessages));
  }, [sessionMessages]);

  // Sync active session to localStorage
  useEffect(() => {
    localStorage.setItem("activeSessionId", JSON.stringify(activeSessionId));
  }, [activeSessionId]);

  // Fetch user info
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

  const sendMessage = async () => {
    if (!input.trim() || sending) return;

    const messageId = Date.now();
    const userMessage = {
      id: messageId,
      role: "user",
      content: input,
      timestamp: new Date().toISOString(),
    };

    // Get current conversation history
    const currentMessages = sessionMessages[activeSessionId] || [];

    // Add user message to current session
    setSessionMessages((prev) => ({
      ...prev,
      [activeSessionId]: [...(prev[activeSessionId] || []), userMessage],
    }));

    const messageText = input;
    setInput("");
    setSending(true);

    try {
      // Create context from recent messages for simple backend compatibility
      const recentMessages = [...currentMessages].slice(-4); // Last 4 messages for context
      const contextString =
        recentMessages.length > 0
          ? `Previous conversation:\n${recentMessages
              .map((msg) => `${msg.role}: ${msg.content}`)
              .join("\n")}\n\nCurrent question: ${messageText}`
          : messageText;

      console.log("Sending context:", contextString);

      const response = await fetch("http://localhost:8000/api/chat/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(localStorage.getItem("access") && {
            Authorization: `Bearer ${localStorage.getItem("access")}`,
          }),
        },
        body: JSON.stringify({
          message: `Please respond in a short, friendly way (1-3 sentences max). ${contextString}`,
          sessionId: activeSessionId,
        }),
      });

      if (!response.ok) throw new Error("Network error");

      const data = await response.json();
      const botMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: data.response,
        timestamp: new Date().toISOString(),
      };

      // Add bot response to current session
      setSessionMessages((prev) => ({
        ...prev,
        [activeSessionId]: [...(prev[activeSessionId] || []), botMessage],
      }));

      // Update session metadata
      updateSessionMetadata(activeSessionId, messageText);
    } catch (err) {
      console.error("Error:", err);
      // Add error message to session
      const errorMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date().toISOString(),
        isError: true,
      };

      setSessionMessages((prev) => ({
        ...prev,
        [activeSessionId]: [...(prev[activeSessionId] || []), errorMessage],
      }));
    } finally {
      setSending(false);
    }
  };

  const updateSessionMetadata = (sessionId, firstMessage = null) => {
    setSessions((prev) => {
      return prev.map((session) => {
        if (session.id === sessionId) {
          const currentMessages = sessionMessages[sessionId] || [];
          const messageCount = currentMessages.length + 2; // +2 for the new user and bot messages

          let newTitle = session.title;
          // Auto-update title if it's still default and we have a first message
          if (
            (session.title === "New chat" ||
              session.title.startsWith("Chat ")) &&
            firstMessage
          ) {
            newTitle =
              firstMessage.slice(0, 30) +
              (firstMessage.length > 30 ? "..." : "");
          }

          return {
            ...session,
            title: newTitle,
            updatedAt: new Date().toISOString(),
            messageCount: messageCount,
          };
        }
        return session;
      });
    });
  };

  const handleClear = () => {
    if (window.confirm("Are you sure you want to clear this conversation?")) {
      setSessionMessages((prev) => ({
        ...prev,
        [activeSessionId]: [],
      }));

      // Update session metadata
      setSessions((prev) =>
        prev.map((session) =>
          session.id === activeSessionId
            ? {
                ...session,
                messageCount: 0,
                updatedAt: new Date().toISOString(),
              }
            : session
        )
      );
    }
  };

  const handleNewSession = () => {
    const newId = Math.max(...sessions.map((s) => s.id), 0) + 1;
    const newSession = {
      id: newId,
      title: "New chat",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: 0,
    };

    setSessions((prev) => [newSession, ...prev]); // Add new session at the top
    setActiveSessionId(newId);
    setSessionMessages((prev) => ({ ...prev, [newId]: [] }));
  };

  const handleEditSession = (id) => {
    const currentSession = sessions.find((s) => s.id === id);
    const newTitle = prompt("Edit session name:", currentSession?.title || "");

    if (newTitle && newTitle.trim()) {
      setSessions((prev) =>
        prev.map((session) =>
          session.id === id
            ? {
                ...session,
                title: newTitle.trim(),
                updatedAt: new Date().toISOString(),
              }
            : session
        )
      );
    }
  };

  const handleDeleteSession = (id) => {
    if (sessions.length <= 1) {
      alert("Cannot delete the last session. Create a new one first.");
      return;
    }

    if (
      window.confirm(
        "Are you sure you want to delete this session? This action cannot be undone."
      )
    ) {
      // Remove session from sessions array
      const updatedSessions = sessions.filter((s) => s.id !== id);
      setSessions(updatedSessions);

      // Remove messages for this session
      setSessionMessages((prev) => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });

      // If we deleted the active session, switch to the first available session
      if (activeSessionId === id && updatedSessions.length > 0) {
        setActiveSessionId(updatedSessions[0].id);
      }
    }
  };

  const handleSora = () => {
    const description = prompt("🎞️ Enter a scene description for Sora:");

    if (!description || !description.trim()) {
      alert("Scene description cannot be empty.");
      return;
    }

    const userMessage = {
      id: Date.now(),
      role: "user",
      content: `Sora: ${description}`,
      timestamp: new Date().toISOString(),
    };

    const botMessage = {
      id: Date.now() + 1,
      role: "assistant",
      content: `🧠 Sora would generate a video for: "${description}". (Functionality coming soon!)`,
      timestamp: new Date().toISOString(),
    };

    setSessionMessages((prev) => ({
      ...prev,
      [activeSessionId]: [
        ...(prev[activeSessionId] || []),
        userMessage,
        botMessage,
      ],
    }));

    updateSessionMetadata(activeSessionId, `Sora: ${description}`);
  };

  const handleSearch = () => {
    const query = prompt("🔍 Enter your search term:");
    if (!query) return;

    const currentMessages = sessionMessages[activeSessionId] || [];
    const matchedMessages = currentMessages.filter((msg) =>
      msg.content.toLowerCase().includes(query.toLowerCase())
    );

    if (matchedMessages.length === 0) {
      alert("No matches found in this session.");
    } else {
      const summary = matchedMessages
        .map(
          (msg, i) =>
            `${i + 1}. [${msg.role}] ${msg.content.slice(0, 100)}${
              msg.content.length > 100 ? "..." : ""
            }`
        )
        .join("\n\n");
      alert(
        `Found ${matchedMessages.length} match(es) in this session:\n\n${summary}`
      );
    }
  };

  const handleLibrary = () => {
    const msg = {
      id: Date.now(),
      role: "assistant",
      content: "📚 Library is being built!",
      timestamp: new Date().toISOString(),
    };

    setSessionMessages((prev) => ({
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

    const userMessage = {
      id: Date.now(),
      role: "user",
      content: `GPTs: ${task}`,
      timestamp: new Date().toISOString(),
    };

    const botMessage = {
      id: Date.now() + 1,
      role: "assistant",
      content: `🤖 A GPT specialized in "${task}" could assist you with this. (Coming soon: tool suggestions!)`,
      timestamp: new Date().toISOString(),
    };

    setSessionMessages((prev) => ({
      ...prev,
      [activeSessionId]: [
        ...(prev[activeSessionId] || []),
        userMessage,
        botMessage,
      ],
    }));

    updateSessionMetadata(activeSessionId, `GPTs: ${task}`);
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      setIsAuthenticated(false);
      // Optionally clear session data on logout
      // localStorage.removeItem("sessions");
      // localStorage.removeItem("sessionMessages");
      // localStorage.removeItem("activeSessionId");
    }
  };

  const switchSession = (sessionId) => {
    setActiveSessionId(sessionId);
  };

  const currentMessages = sessionMessages[activeSessionId] || [];
  const currentSession = sessions.find((s) => s.id === activeSessionId);

  // Sort sessions by most recently updated
  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
  );

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
            🔍 Search Current Session
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

          <div className="text-xs text-gray-400 px-2 mb-2">
            Recent Sessions ({sessions.length})
          </div>

          {sortedSessions.map((session) => (
            <div
              key={session.id}
              className={`group flex items-center justify-between p-2 rounded cursor-pointer ${
                session.id === activeSessionId
                  ? "bg-gray-600"
                  : "hover:bg-gray-700"
              }`}
            >
              <div
                className="flex-1 min-w-0"
                onClick={() => switchSession(session.id)}
              >
                <div className="truncate text-sm" title={session.title}>
                  {session.title}
                </div>
                <div className="text-xs text-gray-400">
                  {session.messageCount} messages
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditSession(session.id);
                  }}
                  className="text-gray-400 hover:text-white text-xs p-1"
                  title="Edit"
                >
                  ✏️
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSession(session.id);
                  }}
                  className="text-red-400 hover:text-red-600 text-xs p-1"
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
        {/* Session Header */}
        <div className="mb-4 pb-2 border-b border-gray-700">
          <div>
            <h2 className="text-lg font-semibold">
              {currentSession?.title || "Chat Session"}
            </h2>
            <div className="text-sm text-gray-400">
              {currentMessages.length} messages
              {currentSession?.updatedAt && (
                <span className="ml-2">
                  • Last updated:{" "}
                  {new Date(currentSession.updatedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2">
          {currentMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <div className="text-4xl mb-4">💬</div>
                <div>Start a new conversation</div>
                <div className="text-sm mt-2">
                  Type a message below to begin
                </div>
              </div>
            </div>
          ) : (
            currentMessages.map((msg) => (
              <ChatMessage
                key={msg.id || `${msg.role}-${msg.timestamp}`}
                role={msg.role}
                content={msg.content}
                timestamp={msg.timestamp}
                isError={msg.isError}
              />
            ))
          )}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <input
            className="flex-1 bg-[#40414f] text-white placeholder-gray-300 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            type="text"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            disabled={sending}
          />
          <button
            onClick={handleClear}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm shadow-sm transition-colors"
            title="Clear this session"
          >
            Clear
          </button>
          <button
            onClick={sendMessage}
            disabled={sending || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm shadow-sm transition-colors"
          >
            {sending ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
