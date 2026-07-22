import { useState, useMemo } from "react";
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
import { X } from "lucide-react";
import axios from "axios";

interface GoogleJwtPayload {
  email: string;
  name: string;
  sub: string;
  picture?: string;
}

const GetStarted = () => {
  const [view, setView] = useState<"login" | "signup" | "google-college" | "otp">("login");
  
  // States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  
  // Google specific state
  const [googleToken, setGoogleToken] = useState("");
  
  // College Dropdown
  const [college, setCollege] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const filteredColleges = useMemo(() => COLLEGES.filter((c) =>
    c.toLowerCase().includes(searchQuery.toLowerCase()),
  ), [searchQuery]);

  // Forgot password states
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetStep, setResetStep] = useState<1 | 2>(1);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const { login: loginContext } = useAuth();
  const navigate = useNavigate();

  const handleError = (error: unknown, fallback: string) => {
    let text = fallback;
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      text = error.response.data.message;
    }
    setMessage({ type: "error", text });
  };

  const handleGoogleAuth = async (credentialResponse: CredentialResponse) => {
    setLoading(true);
    setMessage({ type: "", text: "" });
    const token = credentialResponse.credential;

    if (!token) {
      setMessage({ type: "error", text: "Google authentication failed. Token missing." });
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
        setView("google-college");
      } else {
        const { user, token: jwtToken } = response.data;
        loginContext(user, jwtToken);
        navigate("/buy");
      }
    } catch (error) {
      handleError(error, "Authentication failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteGoogleSignup = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!college) return setMessage({ type: "error", text: "Please select a college from the list" });

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
      loginContext(user, jwtToken);
      navigate("/buy");
    } catch (error) {
      handleError(error, "Authentication failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!college) return setMessage({ type: "error", text: "Please select a college" });

    setLoading(true);
    setMessage({ type: "", text: "" });
    try {
      const res = await api.post("/auth/signup", { email, password, name, collegeName: college });
      setMessage({ type: "success", text: res.data.message });
      setView("otp");
    } catch (error) {
      handleError(error, "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });
    try {
      const res = await api.post("/auth/verify-otp", { email, otp });
      const { user, token } = res.data;
      loginContext(user, token);
      navigate("/buy");
    } catch (error) {
      handleError(error, "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });
    try {
      const res = await api.post("/auth/login", { email, password });
      const { user, token } = res.data;
      loginContext(user, token);
      navigate("/buy");
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.needsVerification) {
        setView("otp");
        setMessage({ type: "error", text: "Please verify your email to continue." });
      } else {
        handleError(error, "Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });
    try {
      const res = await api.post("/auth/forgot-password", { email: resetEmail });
      setMessage({ type: "success", text: res.data.message });
      setResetStep(2);
    } catch (error) {
      handleError(error, "Failed to request password reset");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });
    try {
      const res = await api.post("/auth/reset-password", { email: resetEmail, otp: resetOtp, newPassword });
      setMessage({ type: "success", text: res.data.message });
      setShowForgotModal(false);
      setResetStep(1);
      setView("login");
    } catch (error) {
      handleError(error, "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const CollegeSelector = () => (
    <div className="mb-6 relative text-left">
      <label className="block font-mono text-xs font-bold text-ink mb-2 uppercase tracking-widest pl-1">
        Your College <span className="text-stamp-red">*</span>
      </label>
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
        onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
        required
        className="w-full px-4 py-3 bg-paper border-w-[var(--border-w)] border-ink font-body font-medium text-ink focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ledger-blue focus:ring-offset-paper transition-all placeholder:text-ink/40"
      />
      {isDropdownOpen && (
        <ul className="absolute z-10 w-full mt-2 bg-paper border-w-[var(--border-w)] border-ink shadow-[4px_4px_0px_0px_var(--color-ink)] max-h-60 overflow-y-auto custom-scrollbar">
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
  );

  return (
    <div className="min-h-[calc(100vh-80px)] bg-paper flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative z-10">
      <div className="absolute inset-0 opacity-[0.03] bg-[url('/noise.png')] mix-blend-overlay pointer-events-none"></div>
      
      <div className="w-full max-w-lg bg-paper-blue brutal-block p-8 sm:p-12 transition-all relative z-10">
        <div className="flex flex-col items-center justify-center mb-8 gap-5">
          <img src={logo1} alt="Student Cube Logo" className="w-24 h-24 sm:w-32 sm:h-32 object-cover border border-ink" />
        </div>

        {message.text && (
          <div className={`mb-6 text-center p-4 text-sm font-bold font-mono uppercase tracking-wide border-w-[var(--border-w-sm)] border-solid ${
            message.type === "error" ? "bg-paper text-stamp-red border-stamp-red shadow-[2px_2px_0px_0px_var(--color-stamp-red)]" : "bg-campus-green text-ink border-ink shadow-[2px_2px_0px_0px_var(--color-ink)]"
          }`}>
            {message.text}
          </div>
        )}

        {view === "google-college" && (
          <form onSubmit={handleCompleteGoogleSignup} className="flex flex-col">
            <div className="text-center mb-8">
              <h2 className="font-display text-3xl font-extrabold text-ink mb-2 uppercase">One last step!</h2>
              <p className="font-body text-base font-medium text-ink/70">Select your college to complete Google registration.</p>
            </div>
            <CollegeSelector />
            <BrutalButton type="submit" disabled={loading || !college} variant="primary" className="w-full py-4">
              {loading ? <div className="flex items-center justify-center gap-3"><BrutalLoader size="sm" /> Creating...</div> : "Finish & Enter"}
            </BrutalButton>
          </form>
        )}

        {view === "otp" && (
          <form onSubmit={handleVerifyOtp} className="flex flex-col">
            <div className="text-center mb-8">
              <h2 className="font-display text-3xl font-extrabold text-ink mb-2 uppercase">Verify Email</h2>
              <p className="font-body text-base font-medium text-ink/70">We sent a 6-digit OTP to {email}</p>
            </div>
            <div className="mb-6">
              <input type="text" placeholder="Enter OTP" required value={otp} onChange={e => setOtp(e.target.value)}
                className="w-full px-4 py-3 bg-paper border-w-[var(--border-w)] border-ink font-body font-bold text-center text-ink text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-ledger-blue transition-all" />
            </div>
            <BrutalButton type="submit" disabled={loading || !otp} variant="primary" className="w-full py-4 mb-4">
              {loading ? <BrutalLoader size="sm" /> : "Verify & Enter"}
            </BrutalButton>
            <button type="button" onClick={() => setView("login")} className="text-sm font-bold text-ink/70 hover:text-ink underline uppercase font-mono text-center w-full">
              Back to Login
            </button>
          </form>
        )}

        {(view === "login" || view === "signup") && (
          <>
            <div className="flex mb-8 border-w-[var(--border-w-sm)] border-ink bg-paper">
              <button 
                onClick={() => setView("login")} 
                className={`flex-1 py-3 font-mono text-sm font-bold uppercase tracking-widest transition-colors ${view === "login" ? "bg-ledger-blue text-paper" : "text-ink/60 hover:bg-paper-blue"}`}
              >
                Login
              </button>
              <div className="w-[--border-w-sm] bg-ink"></div>
              <button 
                onClick={() => setView("signup")} 
                className={`flex-1 py-3 font-mono text-sm font-bold uppercase tracking-widest transition-colors ${view === "signup" ? "bg-ledger-blue text-paper" : "text-ink/60 hover:bg-paper-blue"}`}
              >
                Sign Up
              </button>
            </div>

            {view === "login" ? (
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <input type="email" placeholder="Email Address" required value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-paper border-w-[var(--border-w)] border-ink font-body font-medium text-ink focus:outline-none focus:ring-2 focus:ring-ledger-blue transition-all" />
                <input type="password" placeholder="Password" required value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-paper border-w-[var(--border-w)] border-ink font-body font-medium text-ink focus:outline-none focus:ring-2 focus:ring-ledger-blue transition-all" />
                
                <div className="text-right">
                  <button type="button" onClick={() => setShowForgotModal(true)} className="text-xs font-bold text-ledger-blue hover:underline uppercase font-mono">
                    Forgot Password?
                  </button>
                </div>

                <BrutalButton type="submit" disabled={loading} variant="primary" className="w-full py-4 mt-2">
                  {loading ? <BrutalLoader size="sm" /> : "Login"}
                </BrutalButton>
              </form>
            ) : (
              <form onSubmit={handleSignup} className="flex flex-col gap-4">
                <input type="text" placeholder="Full Name" required value={name} onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-paper border-w-[var(--border-w)] border-ink font-body font-medium text-ink focus:outline-none focus:ring-2 focus:ring-ledger-blue transition-all" />
                <input type="email" placeholder="Email Address" required value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-paper border-w-[var(--border-w)] border-ink font-body font-medium text-ink focus:outline-none focus:ring-2 focus:ring-ledger-blue transition-all" />
                <CollegeSelector />
                <input type="password" placeholder="Password" required value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-paper border-w-[var(--border-w)] border-ink font-body font-medium text-ink focus:outline-none focus:ring-2 focus:ring-ledger-blue transition-all" />
                
                <BrutalButton type="submit" disabled={loading || !college} variant="primary" className="w-full py-4 mt-2">
                  {loading ? <BrutalLoader size="sm" /> : "Sign Up"}
                </BrutalButton>
              </form>
            )}

            <div className="my-6 relative text-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-ink/20"></div></div>
              <span className="relative bg-paper-blue px-4 text-xs font-mono font-bold text-ink/50 uppercase tracking-widest">Or continue with</span>
            </div>

            <div className="w-full flex justify-center hover:-translate-y-1 transition-transform duration-200">
              <GoogleLogin
                onSuccess={handleGoogleAuth}
                onError={() => setMessage({ type: "error", text: "Google Login Failed" })}
                size="large"
                theme="outline"
                shape="rectangular"
                width="300"
              />
            </div>
          </>
        )}
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-paper rounded-none brutal-block w-full max-w-sm overflow-hidden border-2 border-ink shadow-[8px_8px_0px_0px_var(--color-ink)] animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-ink bg-ledger-blue flex justify-between items-center">
              <h3 className="text-xl font-display font-extrabold text-paper uppercase tracking-widest">Reset Password</h3>
              <button onClick={() => setShowForgotModal(false)} className="text-paper hover:scale-110 transition-transform"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 bg-paper-blue">
              {resetStep === 1 ? (
                <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
                  <p className="font-body text-sm font-medium text-ink/70">Enter your email and we'll send you an OTP to reset your password.</p>
                  <input type="email" placeholder="Email Address" required value={resetEmail} onChange={e => setResetEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-paper border-w-[var(--border-w)] border-ink font-body font-medium text-ink focus:outline-none focus:ring-2 focus:ring-ledger-blue transition-all" />
                  <BrutalButton type="submit" disabled={loading} variant="primary" className="w-full py-3 mt-2">{loading ? "Sending..." : "Send OTP"}</BrutalButton>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
                  <input type="text" placeholder="6-digit OTP" required value={resetOtp} onChange={e => setResetOtp(e.target.value)}
                    className="w-full px-4 py-3 bg-paper border-w-[var(--border-w)] border-ink font-body font-bold text-center tracking-widest text-ink focus:outline-none focus:ring-2 focus:ring-ledger-blue transition-all" />
                  <input type="password" placeholder="New Password" required value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-paper border-w-[var(--border-w)] border-ink font-body font-medium text-ink focus:outline-none focus:ring-2 focus:ring-ledger-blue transition-all" />
                  <BrutalButton type="submit" disabled={loading} variant="primary" className="w-full py-3 mt-2">{loading ? "Resetting..." : "Update Password"}</BrutalButton>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GetStarted;
