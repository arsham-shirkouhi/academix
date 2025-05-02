import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

// Bring in the illustration and logo
import loginIllustration from "../assets/images/welcome_back.png";
import academixLogo from "../assets/images/academix_logo.svg";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
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
        backgroundColor: "#1F0741",
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
      {/* Wrapper for exact centering */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: "3em", // controls the space between the two panels
          maxWidth: "1200px",
          width: "100%",
          padding: "0 2rem", // equal spacing on both sides even on smaller screens
        }}
      >
{/* Left side: illustration */}
<div
  style={{
    flex: "0 1 480px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  }}
>
  <img
    src={loginIllustration}
    alt="Illustration"
    style={{
      height: "400px", // HARD CODED HEIGHT to match the form container
      width: "auto",
    }}
  />
</div>



        {/* Right side: login form */}
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

          <form onSubmit={handleLogin} style={{ width: "100%" }}>
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
              onChange={(e) => setEmail(e.target.value)}
              required
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
              onChange={(e) => setPassword(e.target.value)}
              required
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
                border: "2px solid #1F0741",
                borderRadius: "10px",
                fontWeight: "bold",
                fontSize: "1rem",
                cursor: "pointer",
              }}
            >
              Login
            </button>

            {error && (
              <p style={{ color: "red", marginTop: "1rem" }}>{error}</p>
            )}
          </form>

          <p
            style={{
              marginTop: "1.5rem",
              color: "#1F0741",
              fontWeight: "bold",
              textAlign: "center",
            }}
          >
            Don’t have an account?
            <button
              onClick={() => navigate("/signup")}
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
              Sign up here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
