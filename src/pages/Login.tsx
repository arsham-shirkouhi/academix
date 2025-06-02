import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

// Bring in the illustration and logo
// import loginIllustration from "../assets/images/welcome_back.png";
import academixLogo from "../assets/images/academix_logo.svg";
import backgroundPattern from "../assets/images/background_pattern.png";


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
      <style>
        {`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes scaleIn {
            from {
              opacity: 0;
              transform: scale(0.9);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          @keyframes slideInFromRight {
            from {
              opacity: 0;
              transform: translateX(30px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          @keyframes overlayFadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          @keyframes logoScaleUp {
            0% {
              transform: scale(1);
              opacity: 1;
            }
            100% {
              transform: scale(2);
              opacity: 1;
            }
          }
          .form-element {
            opacity: 0;
            animation: slideInFromRight 0.5s ease forwards;
          }
          .form-element:nth-child(1) { animation-delay: 0.2s; }
          .form-element:nth-child(2) { animation-delay: 0.3s; }
          .form-element:nth-child(3) { animation-delay: 0.4s; }
          .form-element:nth-child(4) { animation-delay: 0.5s; }
          .form-element:nth-child(5) { animation-delay: 0.6s; }

          .loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: white;
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            animation: overlayFadeIn 0.3s ease forwards;
          }

          .loading-logo {
            width: 250px;
            height: auto;
            animation: logoScaleUp 1.5s ease forwards;
            filter: brightness(0) saturate(100%) invert(10%) sepia(100%) saturate(2000%) hue-rotate(230deg) brightness(90%) contrast(100%);
          }
        `}
      </style>

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
        {/* Left side: illustration */}
        {/* <div
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
</div> */}



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
            animation: "scaleIn 0.5s ease forwards"
          }}
        >
          <div
            style={{
              textAlign: "center",
              marginBottom: "1.5rem",
              animation: "fadeInUp 0.5s ease forwards 0.1s"
            }}
          >
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
            <div className="form-element">
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
            </div>

            <div className="form-element">
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
            </div>

            <div className="form-element">
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
                Login
              </button>
            </div>

            {error && (
              <p style={{ color: "red", marginTop: "1rem" }}>{error}</p>
            )}
          </form>

          <div className="form-element">
            <p
              style={{
                marginTop: "1.5rem",
                color: "#1F0741",
                fontWeight: "bold",
                textAlign: "center",
              }}
            >
              Don't have an account?
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
    </div>
  );
}

export default Login;
