// import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// import Login from "./Login";
// import ChatBox from "./ChatBox";
// import Register from "./Register";

// const isAuthenticated = () => !!localStorage.getItem("access");

// const App = () => {
//   return (
//     <BrowserRouter>
//       <Routes>
//         <Route
//           path="/"
//           element={isAuthenticated() ? <ChatBox /> : <Navigate to="/login" />}
//         />
//         <Route path="/login" element={<Login />} />
//         <Route path="/register" element={<Register />} />
//       </Routes>
//     </BrowserRouter>
//   );
// };

// export default App;
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ChatBox from "./ChatBox";
import Login from "./Login";
import Register from "./Register";

const App = () => {
  const [isGuest, setIsGuest] = useState(!localStorage.getItem("access"));

  useEffect(() => {
    const token = localStorage.getItem("access");
    setIsGuest(!token);
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<ChatBox isGuest={isGuest} />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </Router>
  );
};

export default App;
