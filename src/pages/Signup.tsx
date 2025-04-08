// src/pages/Signup.tsx

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      console.log("Signup successful!");
      navigate("/");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#FFFBF1",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          border: "3px solid #1F0741",
          padding: "2.5rem 3rem",
          borderRadius: "20px",
          backgroundColor: "#fff",
          width: "400px",
        }}
      >
        <h2 style={{ fontSize: "32px", marginBottom: "1.5rem", color: "#1F0741" }}>Sign up for Academix</h2>
        <form onSubmit={handleSignup}>
          <label style={{ fontWeight: "bold", color: "#1F0741", marginBottom: "0.25rem", display: "block" }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              padding: "0.75rem 1rem",
              border: "2px solid #1F0741",
              borderRadius: "10px",
              marginBottom: "1rem",
              fontSize: "1rem",
            }}
          />

          <label style={{ fontWeight: "bold", color: "#1F0741", marginBottom: "0.25rem", display: "block" }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            required
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              padding: "0.75rem 1rem",
              border: "2px solid #1F0741",
              borderRadius: "10px",
              marginBottom: "1.5rem",
              fontSize: "1rem",
            }}
          />

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "0.75rem",
              backgroundColor: "#FFC02E",
              border: "2px solid #1F0741",
              borderRadius: "10px",
              fontWeight: "bold",
              fontSize: "1rem",
              cursor: "pointer",
            }}
          >
            Sign Up
          </button>

          {error && <p style={{ color: "red", marginTop: "1rem" }}>{error}</p>}
        </form>

        <p style={{ marginTop: "1.5rem", color: "#1F0741", fontWeight: "bold" }}>
          Already have an account?
          <button
            onClick={() => navigate("/login")}
            style={{
              marginLeft: "0.5rem",
              background: "none",
              border: "none",
              color: "#2200ff",
              textDecoration: "underline",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Log in here
          </button>
        </p>
      </div>
    </div>
  );
}

export default Signup;
