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

  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);

  // Fetch user info and sessions on mount
  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) return;

    // Fetch user info
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

    // Fetch sessions
    fetchSessions();
  }, []);

  // Fetch messages when active session changes
  useEffect(() => {
    if (activeSessionId) {
      fetchMessages(activeSessionId);
    }
  }, [activeSessionId]);

  const fetchSessions = async () => {
    const token = localStorage.getItem("access");
    if (!token) return;

    try {
      const response = await fetch("http://localhost:8000/api/sessions/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setSessions(data);
      
      // Set first session as active if no active session
      if (data.length > 0 && !activeSessionId) {
        setActiveSessionId(data[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    }
  };

  const fetchMessages = async (sessionId) => {
    const token = localStorage.getItem("access");
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:8000/api/sessions/${sessionId}/messages/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setMessages(data);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || sending || !activeSessionId) return;

    const token = localStorage.getItem("access");
    if (!token) return;

    const currentInput = input;
    setInput("");
    setSending(true);

    try {
      const response = await fetch("http://localhost:8000/api/chat/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          message: currentInput,
          session_id: activeSessionId 
        }),
      });

      if (!response.ok) throw new Error("Network error");

      const data = await response.json();
      
      // Refresh messages after sending
      await fetchMessages(activeSessionId);
      
      // Refresh sessions to get updated titles
      await fetchSessions();
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setSending(false);
    }
  };

  const handleClear = async () => {
    if (!activeSessionId) return;
    
    const token = localStorage.getItem("access");
    if (!token) return;

    try {
      // Delete all messages by deleting and recreating the session
      await fetch(`http://localhost:8000/api/sessions/${activeSessionId}/delete/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Create a new session
      const response = await fetch("http://localhost:8000/api/sessions/create/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: "New Chat" }),
      });
      
      const newSession = await response.json();
      setActiveSessionId(newSession.id);
      setMessages([]);
      
      // Refresh sessions
      await fetchSessions();
    } catch (err) {
      console.error("Error clearing chat:", err);
    }
  };

  const handleNewSession = async () => {
    const token = localStorage.getItem("access");
    if (!token) return;

    try {
      const response = await fetch("http://localhost:8000/api/sessions/create/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: "New Chat" }),
      });
      
      const newSession = await response.json();
      setActiveSessionId(newSession.id);
      setMessages([]);
      
      // Refresh sessions
      await fetchSessions();
    } catch (err) {
      console.error("Error creating new session:", err);
    }
  };

  const handleEditSession = async (id) => {
    const newTitle = prompt("Edit session name:");
    if (!newTitle) return;
    
    const token = localStorage.getItem("access");
    if (!token) return;

    try {
      await fetch(`http://localhost:8000/api/sessions/${id}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: newTitle }),
      });
      
      // Refresh sessions
      await fetchSessions();
    } catch (err) {
      console.error("Error editing session:", err);
    }
  };

  const handleDeleteSession = async (id) => {
    const token = localStorage.getItem("access");
    if (!token) return;

    try {
      await fetch(`http://localhost:8000/api/sessions/${id}/delete/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // If deleted session was active, switch to first available session
      if (activeSessionId === id) {
        const remainingSessions = sessions.filter(s => s.id !== id);
        if (remainingSessions.length > 0) {
          setActiveSessionId(remainingSessions[0].id);
        } else {
          // Create a new session if no sessions left
          await handleNewSession();
          return;
        }
      }
      
      // Refresh sessions
      await fetchSessions();
    } catch (err) {
      console.error("Error deleting session:", err);
    }
  };
  const handleSora = async () => {
    if (!activeSessionId) return;
    
    const description = prompt("🎞️ Enter a scene description for Sora:");
    if (!description || !description.trim()) {
      alert("Scene description cannot be empty.");
      return;
    }

    const token = localStorage.getItem("access");
    if (!token) return;

    try {
      // Send the Sora request as a regular chat message
      const response = await fetch("http://localhost:8000/api/chat/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          message: `Sora: ${description}`,
          session_id: activeSessionId 
        }),
      });

      if (response.ok) {
        await fetchMessages(activeSessionId);
        await fetchSessions();
      }
    } catch (err) {
      console.error("Error with Sora request:", err);
    }
  };

  const handleSearch = () => {
    const query = prompt("🔍 Enter your search term:");
    if (!query) return;

    const currentSessionMessages = messages || [];
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

  const handleLibrary = async () => {
    if (!activeSessionId) return;
    
    const token = localStorage.getItem("access");
    if (!token) return;

    try {
      const response = await fetch("http://localhost:8000/api/chat/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          message: "📚 Library functionality",
          session_id: activeSessionId 
        }),
      });

      if (response.ok) {
        await fetchMessages(activeSessionId);
      }
    } catch (err) {
      console.error("Error with Library request:", err);
    }
  };

  const handleGpts = async () => {
    if (!activeSessionId) return;
    
    const task = prompt("🤖 What do you want a GPT to help you with?");
    if (!task || !task.trim()) {
      alert("Task cannot be empty.");
      return;
    }

    const token = localStorage.getItem("access");
    if (!token) return;

    try {
      const response = await fetch("http://localhost:8000/api/chat/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          message: `GPTs: ${task}`,
          session_id: activeSessionId 
        }),
      });

      if (response.ok) {
        await fetchMessages(activeSessionId);
        await fetchSessions();
      }
    } catch (err) {
      console.error("Error with GPTs request:", err);
    }
  };
  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setIsAuthenticated(false);
    // window.location.href = "/login";
  };

  const currentMessages = messages || [];

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
