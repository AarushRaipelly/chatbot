import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./Login";
import ChatBox from "./ChatBox";
import Register from "./Register";

const isAuthenticated = () => !!localStorage.getItem("access");

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={isAuthenticated() ? <ChatBox /> : <Navigate to="/login" />}
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
