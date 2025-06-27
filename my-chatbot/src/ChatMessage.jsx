const ChatMessage = ({ role, content }) => {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-2`}>
      <div
        className={`max-w-xs px-4 py-2 rounded-lg shadow ${
          isUser ? "bg-white text-black" : "bg-white text-black"
        }`}
      >
        {content}
      </div>
    </div>
  );
};

export default ChatMessage;
