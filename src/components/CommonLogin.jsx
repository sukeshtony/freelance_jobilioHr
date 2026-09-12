import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import { Eye, EyeSlash } from "react-bootstrap-icons";

function CommonLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await API.post("/api/auth/Commonlogin", { email, password });
            const { token, role, id, name } = res.data;
            localStorage.setItem("token", token);
            localStorage.setItem("role", role);
            localStorage.setItem("id", id);
            localStorage.setItem("name", name);

            if (role === "instructor") navigate("/instructor");
            else if (role === "interviewer") navigate("/interviewer");
            else if (role === "feedbacker") navigate("/Feedbacker");
            else if (role === "admin") navigate("/admin");
        } catch (err) {
            alert("Login failed: " + (err.response?.data?.message || "Server error"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
            {/* Sleek Navigation Bar */}
            <nav style={{
                backgroundColor: "#ffffff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                padding: "0.6rem 2rem",
                display: "flex",
                alignItems: "center",
                height: "60px",
                borderBottom: "1px solid rgba(0,0,0,0.05)"
            }}>
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                    height: "100%"
                }} onClick={() => navigate("/")}>
                    <img
                        src="logo.jpeg"
                        alt="Company Logo"
                        style={{
                            height: "32px",
                            width: "auto",
                            marginRight: "12px",
                            objectFit: "contain"
                        }}
                    />
                </div>
                <div style={{
                    marginLeft: "auto",
                    display: "flex",
                    alignItems: "center"
                }}>
                    <span style={{
                        fontSize: "1.25rem",
                        fontWeight: "600",
                        color: "#2c3e50",
                        letterSpacing: "-0.5px"
                    }}>Admin Portal</span>
                </div>
            </nav>

            {/* Login Form */}
            <div style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "calc(100vh - 60px)",
                padding: "2rem"
            }}>
                <div style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "10px",
                    boxShadow: "0 5px 15px rgba(0,0,0,0.05)",
                    padding: "2.5rem",
                    width: "100%",
                    maxWidth: "420px",
                    border: "1px solid rgba(0,0,0,0.03)"
                }}>
                    <div style={{
                        textAlign: "center",
                        marginBottom: "2rem"
                    }}>
                        <h2 style={{
                            color: "#2c3e50",
                            marginBottom: "0.5rem",
                            fontSize: "1.5rem",
                            fontWeight: "600"
                        }}>Welcome Back</h2>
                        <p style={{
                            color: "#6c757d",
                            fontSize: "0.9rem"
                        }}>Sign in to access your dashboard</p>
                    </div>

                    <form onSubmit={handleLogin}>
                        <div style={{ marginBottom: "1.5rem" }}>
                            <label style={{
                                display: "block",
                                marginBottom: "0.5rem",
                                color: "#495057",
                                fontWeight: "500",
                                fontSize: "0.9rem"
                            }}>Email Address</label>
                            <input
                                type="email"
                                placeholder="your.email@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                style={{
                                    width: "100%",
                                    padding: "0.75rem",
                                    border: "1px solid #e0e0e0",
                                    borderRadius: "6px",
                                    fontSize: "0.95rem",
                                    transition: "all 0.2s ease",
                                    outline: "none"
                                }}
                                onFocus={(e) => e.target.style.borderColor = "#3498db"}
                                onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
                            />
                        </div>

                        <div style={{ marginBottom: "2rem", position: "relative" }}>
                            <div style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "0.5rem"
                            }}>
                                <label style={{
                                    color: "#495057",
                                    fontWeight: "500",
                                    fontSize: "0.9rem"
                                }}>Password</label>
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={{
                                    width: "100%",
                                    padding: "0.75rem",
                                    border: "1px solid #e0e0e0",
                                    borderRadius: "6px",
                                    fontSize: "0.95rem",
                                    paddingRight: "2.5rem",
                                    transition: "all 0.2s ease",
                                    outline: "none"
                                }}
                                onFocus={(e) => e.target.style.borderColor = "#3498db"}
                                onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: "absolute",
                                    right: "12px",
                                    top: "38px",
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: "#adb5bd",
                                    padding: "0.25rem",
                                    borderRadius: "4px",
                                    transition: "all 0.2s ease"
                                }}
                                onMouseEnter={(e) => e.target.style.color = "#6c757d"}
                                onMouseLeave={(e) => e.target.style.color = "#adb5bd"}
                            >
                                {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: "100%",
                                padding: "0.85rem",
                                backgroundColor: loading ? "#95a5a6" : "#3498db",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                fontSize: "1rem",
                                fontWeight: "500",
                                cursor: loading ? "not-allowed" : "pointer",
                                transition: "all 0.2s ease",
                                marginBottom: "1.5rem",
                                boxShadow: loading ? "none" : "0 2px 5px rgba(52,152,219,0.3)"
                            }}
                            onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = "#2980b9")}
                            onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = "#3498db")}
                        >
                            {loading ? (
                                <span>Logging in...</span>
                            ) : (
                                <span>Login</span>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default CommonLogin;