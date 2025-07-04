// import { useState } from "react";
// import { useNavigate } from "react-router-dom";

// const Register = () => {
//   const [formData, setFormData] = useState({
//     first_name: "",
//     last_name: "",
//     username: "",
//     email: "",
//     password: "",
//   });
//   const navigate = useNavigate();
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");

//   const handleChange = (e) => {
//     setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError("");
//     setSuccess("");

//     try {
//       const res = await fetch("http://localhost:8000/api/register/", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(formData),
//       });

//       const data = await res.json();

//       if (!res.ok) {
//         throw new Error(data.error || "Registration failed");
//       }

//       setSuccess("🎉 Registered successfully! Redirecting to login...");
//       setFormData({ first_name: "", username: "", email: "", password: "" });

//       setTimeout(() => {
//         navigate("/login");
//       }, 2000);
//     } catch (err) {
//       setError(err.message);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-[#202123] text-white">
//       <form
//         onSubmit={handleSubmit}
//         className="bg-[#343541] p-8 rounded shadow-md w-96 space-y-4"
//       >
//         <h2 className="text-xl font-semibold mb-2">📝 Register</h2>

//         <input
//           name="first_name"
//           placeholder="First Name"
//           value={formData.first_name}
//           onChange={handleChange}
//           className="w-full px-3 py-2 bg-[#40414f] rounded border border-gray-600 text-white"
//           required
//         />
//         <input
//           name="last_name"
//           placeholder="last_name"
//           value={formData.last_name}
//           onChange={handleChange}
//           className="w-full px-3 py-2 bg-[#40414f] rounded border border-gray-600 text-white"
//           required
//         />
//         <input
//           name="username"
//           placeholder="username"
//           value={formData.username}
//           onChange={handleChange}
//           className="w-full px-3 py-2 bg-[#40414f] rounded border border-gray-600 text-white"
//           required
//         />
//         <input
//           name="email"
//           placeholder="Email"
//           type="email"
//           value={formData.email}
//           onChange={handleChange}
//           className="w-full px-3 py-2 bg-[#40414f] rounded border border-gray-600 text-white"
//           required
//         />
//         <input
//           name="password"
//           placeholder="Password"
//           type="password"
//           value={formData.password}
//           onChange={handleChange}
//           className="w-full px-3 py-2 bg-[#40414f] rounded border border-gray-600 text-white"
//           required
//         />

//         <button
//           type="submit"
//           className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded"
//         >
//           Register
//         </button>

//         {error && <div className="text-red-400 text-sm">{error}</div>}
//         {success && <div className="text-green-400 text-sm">{success}</div>}
//       </form>
//     </div>
//   );
// };

// export default Register;

import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "", // ✅ Added to match backend & avoid warning
    username: "",
    email: "",
    password: "",
  });

  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const res = await fetch("http://localhost:8000/api/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      setSuccess("🎉 Registered successfully! Redirecting to login...");
      setFormData({
        first_name: "",
        last_name: "",
        username: "",
        email: "",
        password: "",
      });

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#202123] text-white">
      <form
        onSubmit={handleSubmit}
        className="bg-[#343541] p-8 rounded shadow-md w-96 space-y-4"
      >
        <h2 className="text-xl font-semibold mb-2">📝 Register</h2>

        <input
          name="first_name"
          placeholder="First Name"
          value={formData.first_name}
          onChange={handleChange}
          className="w-full px-3 py-2 bg-[#40414f] rounded border border-gray-600 text-white"
          required
        />

        <input
          name="last_name"
          placeholder="Last Name"
          value={formData.last_name}
          onChange={handleChange}
          className="w-full px-3 py-2 bg-[#40414f] rounded border border-gray-600 text-white"
          required
        />

        <input
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
          className="w-full px-3 py-2 bg-[#40414f] rounded border border-gray-600 text-white"
          required
        />

        <input
          name="email"
          placeholder="Email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full px-3 py-2 bg-[#40414f] rounded border border-gray-600 text-white"
          required
        />

        <input
          name="password"
          placeholder="Password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          className="w-full px-3 py-2 bg-[#40414f] rounded border border-gray-600 text-white"
          required
        />

        <button
          type="submit"
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded"
        >
          Register
        </button>

        {error && <div className="text-red-400 text-sm">{error}</div>}
        {success && <div className="text-green-400 text-sm">{success}</div>}
      </form>
    </div>
  );
};

export default Register;
