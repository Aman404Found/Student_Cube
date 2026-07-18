import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import type { CredentialResponse } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { COLLEGES } from "../utils/colleges";
import { jwtDecode } from "jwt-decode";
import logo1 from "../assets/logo.png";
import { BrutalButton } from "../components/ui/brutal-button";
import { BrutalLoader } from "../components/ui/brutal-loader";

interface GoogleJwtPayload {
  email: string;
  name: string;
  sub: string;
  picture?: string;
}

const GetStarted = () => {
  const [googleToken, setGoogleToken] = useState("");
  const [showCollegePrompt, setShowCollegePrompt] = useState(false);

  // Searchable Dropdown
  const [college, setCollege] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const { login } = useAuth();
  const navigate = useNavigate();

  // Filter logic for colleges based on search query
  const filteredColleges = COLLEGES.filter((c) =>
    c.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleGoogleAuth = async (credentialResponse: CredentialResponse) => {
    setLoading(true);
    setMessage({ type: "", text: "" });
    const token = credentialResponse.credential;

    if (!token) {
      setMessage({
        type: "error",
        text: "Google authentication failed. Token missing.",
      });
      setLoading(false);
      return;
    }

    try {
      const decoded = jwtDecode<GoogleJwtPayload>(token);

      const userData = {
        email: decoded.email,
        name: decoded.name,
        googleId: decoded.sub,
        profilePic: decoded.picture,
      };

      const response = await api.post("/auth/google", userData);

      if (response.data.isNewUser) {
        setGoogleToken(token);
        setShowCollegePrompt(true);
      } else {
        const { user, token: jwtToken } = response.data;
        login(user, jwtToken);
        navigate("/buy");
      }
    } catch (error) {
      console.error("Google Auth Error:", error);
      setMessage({ type: "error", text: "Authentication failed. Try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!college)
      return setMessage({
        type: "error",
        text: "Please select a college from the list",
      });

    setLoading(true);
    try {
      const decoded = jwtDecode<GoogleJwtPayload>(googleToken);

      const userData = {
        email: decoded.email,
        name: decoded.name,
        googleId: decoded.sub,
        profilePic: decoded.picture,
        collegeName: college,
      };

      const response = await api.post("/auth/complete-google-signup", userData);

      const { user, token: jwtToken } = response.data;
      login(user, jwtToken);
      navigate("/buy");
    } catch (error) {
      console.error("Auth Error:", error);
      setMessage({ type: "error", text: "Authentication failed. Try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-paper flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative z-10">
      {/* Background texture */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('/noise.png')] mix-blend-overlay pointer-events-none"></div>
      <div className="w-full max-w-lg bg-paper-blue brutal-block p-8 sm:p-12 transition-all relative z-10">
        {/* Logo Section */}
        <div className="flex flex-col items-center justify-center mb-10 gap-5">
          <img
            src={logo1}
            alt="Student Cube Logo"
            className="w-32 h-32 sm:w-40 sm:h-40 object-cover border border-ink"
          />
        </div>

        {message.text && (
          <div
            className={`mb-6 text-center p-4 text-sm font-bold font-mono uppercase tracking-wide border-[var(--border-w-sm)] border-solid ${
              message.type === "error"
                ? "bg-paper text-stamp-red border-stamp-red shadow-[2px_2px_0px_0px_var(--color-stamp-red)]"
                : "bg-campus-green text-ink border-ink shadow-[2px_2px_0px_0px_var(--color-ink)]"
            }`}
          >
            {message.text}
          </div>
        )}

        {!showCollegePrompt ? (
          <div className="flex flex-col items-center text-center">
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-ink mb-3 tracking-tight uppercase">
              Welcome Back
            </h2>

            <p className="font-body text-base font-medium text-ink/70 mb-10 px-4">
              Sign in or create an account with a single click to start buying &
              selling.
            </p>

            <div className="w-full flex justify-center hover:-translate-y-1 transition-transform duration-200">
              <GoogleLogin
                onSuccess={handleGoogleAuth}
                onError={() =>
                  setMessage({ type: "error", text: "Google Login Failed" })
                }
                size="large"
                theme="outline"
                shape="rectangular"
                width="300"
              />
            </div>
          </div>
        ) : (
          <form onSubmit={handleCompleteSignup} className="flex flex-col">
            <div className="text-center mb-8">
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-ink mb-3 tracking-tight uppercase">
                One last step!
              </h2>
              <p className="font-body text-base font-medium text-ink/70">
                Select your college to complete registration and enter the cube.
              </p>
            </div>

            <div className="mb-8 relative">
              <label className="block font-mono text-xs font-bold text-ink mb-2 uppercase tracking-widest pl-1">
                Your College <span className="text-stamp-red">*</span>
              </label>

              {/* Type to search input */}
              <input
                type="text"
                placeholder="Type to search your college..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsDropdownOpen(true);
                  if (college) setCollege("");
                }}
                onFocus={() => setIsDropdownOpen(true)}
                onBlur={() => {
                  setTimeout(() => setIsDropdownOpen(false), 200);
                }}
                required
                className="w-full px-4 py-3 bg-paper border-[var(--border-w)] border-ink font-body font-medium text-ink focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ledger-blue focus:ring-offset-paper transition-all placeholder:text-ink/40"
              />

              {/* Filtered Dropdown List */}
              {isDropdownOpen && (
                <ul className="absolute z-10 w-full mt-2 bg-paper border-[var(--border-w)] border-ink shadow-[4px_4px_0px_0px_var(--color-ink)] max-h-60 overflow-y-auto custom-scrollbar">
                  {filteredColleges.length > 0 ? (
                    filteredColleges.map((name) => (
                      <li
                        key={name}
                        onMouseDown={(e) => {
                          e.preventDefault(); 
                          setCollege(name);
                          setSearchQuery(name);
                          setIsDropdownOpen(false);
                        }}
                        className={`px-4 py-3 font-body cursor-pointer transition-colors border-b border-ink/10 last:border-0 ${
                          college === name
                            ? "bg-ledger-blue text-paper font-bold"
                            : "hover:bg-paper-blue text-ink font-medium"
                        }`}
                      >
                        {name}
                      </li>
                    ))
                  ) : (
                    <li className="px-4 py-3 font-body font-medium text-ink/50 italic">
                      No colleges found.
                    </li>
                  )}
                </ul>
              )}
            </div>

            <BrutalButton
              type="submit"
              disabled={loading || !college}
              variant="primary"
              className="w-full py-4"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <BrutalLoader size="sm" />
                  Creating...
                </div>
              ) : (
                "Finish & Enter"
              )}
            </BrutalButton>
          </form>
        )}
      </div>
    </div>
  );
};

export default GetStarted;
