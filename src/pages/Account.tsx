import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchUpcomingEvents, fetchCalendarEvents, fetchUserProfile } from "../utils/canvasApi";
import { signOut, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { auth } from "../firebase";
import { getUserSettings, saveUserSettings, updateColorPreferences } from "../utils/firestoreUser";

function Account({ setEvents, setCalendarEvents }: any) {
  const [token, setToken] = useState("");
  const [domain, setDomain] = useState("https://sjsu.instructure.com");
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [colorPreferences, setColorPreferences] = useState<Record<string, string>>({});

  // Password change states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const navigate = useNavigate();
  const user = auth.currentUser;

  useEffect(() => {
    if (user) {
      setEmail(user.email || "");
      setName(user.displayName || "");

      getUserSettings(user.uid).then((data) => {
        if (data) {
          setToken(data.token || "");
          setDomain(data.domain || "https://sjsu.instructure.com");
          setColorPreferences(data.colorPreferences || {});

          if (data.token && data.domain) {
            fetchUserProfile(data.token, data.domain)
              .then((profile) => {
                setAvatarUrl(profile.avatar_url || null);
              })
              .catch(() => {
                setAvatarUrl(null);
              });
          }
        }
      });
    }
  }, [user]);

  const handleColorChange = (course: string, color: string) => {
    const updated = { ...colorPreferences, [course]: color };
    setColorPreferences(updated);
    if (user) updateColorPreferences(user.uid, updated);
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      await saveUserSettings(user.uid, { token, domain });
      setEditing(false);

      if (setEvents && setCalendarEvents) {
        const data = await fetchUpcomingEvents(token, domain);
        setEvents(data);

        const calendar = await fetchCalendarEvents(token, domain);
        setCalendarEvents(calendar);
      }

      const profile = await fetchUserProfile(token, domain);
      setAvatarUrl(profile.avatar_url || null);

      console.log("✅ Token saved and profile refreshed.");
    } catch (err) {
      console.error("❌ Error saving token:", err);
    }
  };

  const handleClear = () => {
    setToken("");
    setDomain("https://sjsu.instructure.com");
    setEditing(true);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const handlePasswordChange = async () => {
    if (!user) return;
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword !== confirmNewPassword) {
      setPasswordError("New passwords don't match");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long");
      return;
    }

    try {
      // Reauthenticate user
      const credential = EmailAuthProvider.credential(user.email!, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);

      setPasswordSuccess("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setIsChangingPassword(false);
    } catch (error: any) {
      if (error.code === 'auth/wrong-password') {
        setPasswordError("Current password is incorrect");
      } else {
        setPasswordError("Error updating password. Please try again.");
      }
    }
  };

  return (
    <div style={{
      padding: "15px",
      position: "relative",
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      maxHeight: "100vh",
      boxSizing: "border-box"
    }}>
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "15px",
        marginBottom: "15px"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{
            fontSize: "42px",
            fontWeight: "900",
            color: "#1f0741",
            margin: 0
          }}>
            Account
          </h2>
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
        gap: "20px",
        padding: "10px",
        overflowY: "auto"
      }}>
        {/* Profile Section */}
        <div style={{
          backgroundColor: "#FFFBF1",
          border: "3px solid #1F0741",
          borderRadius: "16px",
          overflow: "hidden"
        }}>
          <div style={{
            backgroundColor: "#1F0741",
            color: "#FFFBF1",
            padding: "0.75rem 1rem",
            fontSize: "24px",
            fontWeight: "bold"
          }}>
            Profile
          </div>
          <div style={{
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1rem"
          }}>
            <div style={{
              width: "120px",
              height: "120px",
              borderRadius: "50%",
              border: "3px solid #1F0741",
              overflow: "hidden",
              backgroundColor: "#f0f0f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "48px",
              color: "#1F0741"
            }}>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover"
                  }}
                />
              ) : (
                name.charAt(0).toUpperCase()
              )}
            </div>
            <div style={{
              textAlign: "center"
            }}>
              <h3 style={{
                margin: "0 0 0.5rem 0",
                color: "#1F0741",
                fontSize: "24px",
                fontWeight: "bold"
              }}>
                {name || "User"}
              </h3>
              <p style={{
                margin: 0,
                color: "#666",
                fontSize: "16px"
              }}>
                {email}
              </p>
            </div>
          </div>
        </div>

        {/* Canvas Integration Section */}
        <div style={{
          backgroundColor: "#FFFBF1",
          border: "3px solid #1F0741",
          borderRadius: "16px",
          overflow: "hidden"
        }}>
          <div style={{
            backgroundColor: "#1F0741",
            color: "#FFFBF1",
            padding: "0.75rem 1rem",
            fontSize: "24px",
            fontWeight: "bold"
          }}>
            Canvas Integration
          </div>
          <div style={{
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem"
          }}>
            {!editing ? (
              <>
                <div>
                  <label style={{
                    display: "block",
                    color: "#666",
                    fontSize: "14px",
                    marginBottom: "4px"
                  }}>
                    Canvas Token
                  </label>
                  <div style={{
                    padding: "0.75rem",
                    backgroundColor: "#f0f0f0",
                    borderRadius: "8px",
                    border: "2px solid #1F0741",
                    fontFamily: "monospace"
                  }}>
                    ••••••••••••••••
                  </div>
                </div>
                <div>
                  <label style={{
                    display: "block",
                    color: "#666",
                    fontSize: "14px",
                    marginBottom: "4px"
                  }}>
                    Canvas Domain
                  </label>
                  <div style={{
                    padding: "0.75rem",
                    backgroundColor: "#f0f0f0",
                    borderRadius: "8px",
                    border: "2px solid #1F0741"
                  }}>
                    {domain}
                  </div>
                </div>
                <div style={{
                  display: "flex",
                  gap: "0.5rem",
                  marginTop: "0.5rem"
                }}>
                  <button
                    onClick={() => setEditing(true)}
                    style={{
                      padding: "0.5rem 1rem",
                      backgroundColor: "#FFFBF1",
                      border: "2px solid #1F0741",
                      borderRadius: "8px",
                      fontWeight: "bold",
                      cursor: "pointer",
                      color: "#1F0741",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem"
                    }}
                  >
                    <span>✏️</span>
                    Edit Connection
                  </button>
                  <button
                    onClick={handleClear}
                    style={{
                      padding: "0.5rem 1rem",
                      backgroundColor: "#FFFBF1",
                      border: "2px solid #1F0741",
                      borderRadius: "8px",
                      fontWeight: "bold",
                      cursor: "pointer",
                      color: "#1F0741",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem"
                    }}
                  >
                    <span>❌</span>
                    Clear
                  </button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label style={{
                    display: "block",
                    color: "#666",
                    fontSize: "14px",
                    marginBottom: "4px"
                  }}>
                    Canvas Token
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your Canvas API Token"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "2px solid #1F0741",
                      borderRadius: "8px",
                      fontSize: "16px",
                      backgroundColor: "#FFFBF1",
                      boxSizing: "border-box"
                    }}
                  />
                  <p style={{
                    margin: "0.25rem 0 0 0",
                    fontSize: "12px",
                    color: "#666"
                  }}>
                    You can find your token in Canvas under Account → Settings → New Access Token
                  </p>
                </div>
                <div>
                  <label style={{
                    display: "block",
                    color: "#666",
                    fontSize: "14px",
                    marginBottom: "4px"
                  }}>
                    Canvas Domain
                  </label>
                  <input
                    type="text"
                    placeholder="Canvas Domain"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "2px solid #1F0741",
                      borderRadius: "8px",
                      fontSize: "16px",
                      backgroundColor: "#FFFBF1",
                      boxSizing: "border-box"
                    }}
                  />
                </div>
                <button
                  onClick={handleSave}
                  style={{
                    padding: "0.75rem",
                    backgroundColor: "#ffb703",
                    border: "3px solid #1F0741",
                    borderRadius: "10px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    boxShadow: "0 3px #1F0741",
                    transition: "all 0.2s ease",
                    transform: "translateY(0)",
                    marginTop: "0.5rem"
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
                  Save Connection
                </button>
              </>
            )}
          </div>
        </div>

        {/* Password Management Section */}
        <div style={{
          backgroundColor: "#FFFBF1",
          border: "3px solid #1F0741",
          borderRadius: "16px",
          overflow: "hidden"
        }}>
          <div style={{
            backgroundColor: "#1F0741",
            color: "#FFFBF1",
            padding: "0.75rem 1rem",
            fontSize: "24px",
            fontWeight: "bold"
          }}>
            Password Management
          </div>
          <div style={{
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem"
          }}>
            <div>
              <label style={{
                display: "block",
                color: "#666",
                fontSize: "14px",
                marginBottom: "4px"
              }}>
                Current Password
              </label>
              <div style={{ position: "relative" }}>
                <div style={{
                  width: "100%",
                  padding: "0.75rem",
                  paddingRight: "2.5rem",
                  border: "2px solid #1F0741",
                  borderRadius: "8px",
                  fontSize: "16px",
                  backgroundColor: "#FFFBF1",
                  boxSizing: "border-box",
                  fontFamily: "monospace"
                }}>
                  ••••••••••••
                </div>
                <button
                  onClick={() => setIsChangingPassword(!isChangingPassword)}
                  style={{
                    position: "absolute",
                    right: "0.75rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "14px",
                    padding: "4px",
                    color: "#1F0741",
                    fontWeight: "bold",
                    textDecoration: "underline"
                  }}
                >
                  Change
                </button>
              </div>
            </div>

            {isChangingPassword && (
              <>
                <div>
                  <label style={{
                    display: "block",
                    color: "#666",
                    fontSize: "14px",
                    marginBottom: "4px"
                  }}>
                    Enter Current Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        paddingRight: "2.5rem",
                        border: "2px solid #1F0741",
                        borderRadius: "8px",
                        fontSize: "16px",
                        backgroundColor: "#FFFBF1",
                        boxSizing: "border-box"
                      }}
                    />
                    <button
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      style={{
                        position: "absolute",
                        right: "0.75rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "16px",
                        padding: "4px"
                      }}
                    >
                      {showCurrentPassword ? "👁" : "👁‍🗨"}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{
                    display: "block",
                    color: "#666",
                    fontSize: "14px",
                    marginBottom: "4px"
                  }}>
                    New Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        paddingRight: "2.5rem",
                        border: "2px solid #1F0741",
                        borderRadius: "8px",
                        fontSize: "16px",
                        backgroundColor: "#FFFBF1",
                        boxSizing: "border-box"
                      }}
                    />
                    <button
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      style={{
                        position: "absolute",
                        right: "0.75rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "16px",
                        padding: "4px"
                      }}
                    >
                      {showNewPassword ? "👁" : "👁‍🗨"}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{
                    display: "block",
                    color: "#666",
                    fontSize: "14px",
                    marginBottom: "4px"
                  }}>
                    Confirm New Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        paddingRight: "2.5rem",
                        border: "2px solid #1F0741",
                        borderRadius: "8px",
                        fontSize: "16px",
                        backgroundColor: "#FFFBF1",
                        boxSizing: "border-box"
                      }}
                    />
                    <button
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: "absolute",
                        right: "0.75rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "16px",
                        padding: "4px"
                      }}
                    >
                      {showConfirmPassword ? "👁" : "👁‍🗨"}
                    </button>
                  </div>
                </div>

                {passwordError && (
                  <p style={{ color: "#FF5C5C", margin: "0", fontSize: "14px" }}>
                    {passwordError}
                  </p>
                )}
                {passwordSuccess && (
                  <p style={{ color: "#4CAF50", margin: "0", fontSize: "14px" }}>
                    {passwordSuccess}
                  </p>
                )}

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={handlePasswordChange}
                    style={{
                      flex: 1,
                      padding: "0.75rem",
                      backgroundColor: "#ffb703",
                      border: "3px solid #1F0741",
                      borderRadius: "10px",
                      fontWeight: "bold",
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
                    Save New Password
                  </button>
                  <button
                    onClick={() => {
                      setIsChangingPassword(false);
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmNewPassword("");
                      setPasswordError("");
                      setPasswordSuccess("");
                    }}
                    style={{
                      padding: "0.75rem",
                      backgroundColor: "#FFFBF1",
                      border: "3px solid #1F0741",
                      borderRadius: "10px",
                      fontWeight: "bold",
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
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Subject Colors Section */}
        <div style={{
          backgroundColor: "#FFFBF1",
          border: "3px solid #1F0741",
          borderRadius: "16px",
          overflow: "hidden"
        }}>
          <div style={{
            backgroundColor: "#1F0741",
            color: "#FFFBF1",
            padding: "0.75rem 1rem",
            fontSize: "24px",
            fontWeight: "bold"
          }}>
            Course Colors
          </div>
          <div style={{
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem"
          }}>
            {Object.entries(colorPreferences).map(([course, color], index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "0.75rem",
                  backgroundColor: "#fff",
                  borderRadius: "10px",
                  border: "2px solid #1F0741",
                  position: "relative",
                  paddingLeft: "calc(8px + 0.75rem)"
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: "0",
                    top: "0",
                    bottom: "0",
                    width: "8px",
                    backgroundColor: color,
                    borderTopLeftRadius: "8px",
                    borderBottomLeftRadius: "8px"
                  }}
                />
                <span style={{ flex: 1, fontWeight: "500" }}>{course}</span>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => handleColorChange(course, e.target.value)}
                  style={{
                    width: "32px",
                    height: "32px",
                    padding: "0",
                    border: "2px solid #1F0741",
                    borderRadius: "6px",
                    cursor: "pointer"
                  }}
                />
              </div>
            ))}
            {Object.keys(colorPreferences).length === 0 && (
              <p style={{ textAlign: "center", color: "#666", margin: 0 }}>
                No courses found. Colors will appear here when you have assignments from courses.
              </p>
            )}
          </div>
        </div>

        {/* Account Actions Section */}
        <div style={{
          backgroundColor: "#FFFBF1",
          border: "3px solid #1F0741",
          borderRadius: "16px",
          overflow: "hidden"
        }}>
          <div style={{
            backgroundColor: "#1F0741",
            color: "#FFFBF1",
            padding: "0.75rem 1rem",
            fontSize: "24px",
            fontWeight: "bold"
          }}>
            Account Actions
          </div>
          <div style={{
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem"
          }}>
            <button
              onClick={handleLogout}
              style={{
                padding: "0.75rem",
                backgroundColor: "#FF5C5C",
                color: "#fff",
                border: "3px solid #1F0741",
                borderRadius: "10px",
                fontWeight: "bold",
                cursor: "pointer",
                boxShadow: "0 3px #1F0741",
                transition: "all 0.2s ease",
                transform: "translateY(0)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem"
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
              <span>🚪</span>
              Log Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Account;
