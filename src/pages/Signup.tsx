// src/pages/Signup.tsx

import { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import academixLogo from "../assets/images/academix_logo.svg";
import backgroundPattern from "../assets/images/background_pattern.png";

function Signup() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Update the user's display name
      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: username
        });
      }

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
        backgroundImage: `url(${backgroundPattern})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "fixed",
        top: 0,
        left: 0,
        height: "100vh",
        width: "100vw",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        color: "#fff",
        fontFamily: "Arial, sans-serif",
        margin: 0,
        padding: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: "3em",
          maxWidth: "1200px",
          width: "100%",
          padding: "0 2rem",
        }}
      >
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "20px",
            padding: "2rem",
            width: "100%",
            maxWidth: "400px",
            border: "3px solid #1F0741",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <img
              src={academixLogo}
              alt="Academix Logo"
              style={{
                width: "250px",
                height: "auto",
                filter:
                  "brightness(0) saturate(100%) invert(10%) sepia(100%) saturate(2000%) hue-rotate(230deg) brightness(90%) contrast(100%)",
              }}
            />
          </div>

          <form onSubmit={handleSignup} style={{ width: "100%" }}>
            <label
              style={{
                fontWeight: "bold",
                color: "#1F0741",
                marginBottom: "0.25rem",
                display: "block",
              }}
            >
              Username
            </label>
            <input
              type="text"
              value={username}
              required
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                border: "2px solid #1F0741",
                borderRadius: "10px",
                marginBottom: "1rem",
                fontSize: "1rem",
                backgroundColor: "#f3e8ff",
              }}
            />

            <label
              style={{
                fontWeight: "bold",
                color: "#1F0741",
                marginBottom: "0.25rem",
                display: "block",
              }}
            >
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
                backgroundColor: "#f3e8ff",
              }}
            />

            <label
              style={{
                fontWeight: "bold",
                color: "#1F0741",
                marginBottom: "0.25rem",
                display: "block",
              }}
            >
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
                marginBottom: "1rem",
                fontSize: "1rem",
                backgroundColor: "#f3e8ff",
              }}
            />

            <label
              style={{
                fontWeight: "bold",
                color: "#1F0741",
                marginBottom: "0.25rem",
                display: "block",
              }}
            >
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              required
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                border: "2px solid #1F0741",
                borderRadius: "10px",
                marginBottom: "1.5rem",
                fontSize: "1rem",
                backgroundColor: "#f3e8ff",
              }}
            />

            <button
              type="submit"
              style={{
                width: "100%",
                padding: "0.75rem",
                backgroundColor: "#FFC02E",
                border: "3px solid #1F0741",
                borderRadius: "10px",
                fontWeight: "bold",
                fontSize: "1rem",
                cursor: "pointer",
                boxShadow: "0 3px #1F0741",
                transition: "all 0.2s ease",
                transform: "translateY(0)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(2px)";
                e.currentTarget.style.boxShadow = "0 0 #1F0741";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 3px #1F0741";
              }}
            >
              Sign Up
            </button>

            {error && (
              <p style={{
                color: "#D41B1B",
                marginTop: "1rem",
                backgroundColor: "rgba(212, 27, 27, 0.1)",
                padding: "0.75rem",
                borderRadius: "8px",
                textAlign: "center"
              }}>
                {error}
              </p>
            )}
          </form>

          <p style={{ marginTop: "1.5rem", color: "#1F0741", fontWeight: "bold" }}>
            Already have an account?{" "}
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
    </div>
  );
}

export default Signup;
