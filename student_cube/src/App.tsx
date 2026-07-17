import type { ReactNode } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ScrollToTop from "./components/ScrollToTop";
import Navbar from "./components/Navbar";
import RealtimeBridge from "./components/RealtimeBridge";
import Index from "./pages/Index";
import BrowseProducts from "./pages/BrowseProducts";
import Sell from "./pages/Sell";
import Profile from "./pages/Profile";
import Chat from "./pages/Chat";
import GetStarted from "./pages/GetStarted";
import ProductDetail from "./pages/ProductDetail";
import AdminRoute from "./components/AdminRoute";
import AmbassadorRoute from "./components/AmbassadorRoute";
import AdminDashboard from "./pages/AdminDashboard";
import AmbassadorDashboard from "./pages/AmbassadorDashboard";
import "./App.css";
import { Toaster } from "react-hot-toast";
import { GoogleOAuthProvider } from "@react-oauth/google";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CancellationRefund from "./pages/CancellationRefund";
import ShippingExchange from "./pages/ShippingExchange";

// 🔥 1. YAHAN HOOK IMPORT KIYA HAI (Apna path verify kar lena)
import useDevToolsBlocker from "./hooks/useDevToolsBlocker"; 

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { token } = useAuth();

  if (!token) {
    return <Navigate to="/getstarted" replace />;
  }
  return children;
};

function App() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

  // 🔥 2. YAHAN HOOK ACTIVATE KIYA HAI
  useDevToolsBlocker(); 

  return (
    <GoogleOAuthProvider clientId={clientId}>
      {/* Toaster pehle se hai, ye ekdum perfect hai */}
      <Toaster position="bottom-right" reverseOrder={false} /> 
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <RealtimeBridge />

          <div className="min-h-screen flex flex-col">
            <Navbar />

            <div className="grow">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Index />} />
                <Route path="/buy" element={<BrowseProducts />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/getstarted" element={<GetStarted />} />

                {/* Added Privacy Policy and Terms of Service Routes */}
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
                <Route
                  path="/cancellation-refund"
                  element={<CancellationRefund />}
                />
                <Route
                  path="/shipping-exchange"
                  element={<ShippingExchange />}
                />

                {/* Admin Route */}
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/ambassador"
                  element={
                    <AmbassadorRoute>
                      <AmbassadorDashboard />
                    </AmbassadorRoute>
                  }
                />

                {/* Protected Routes */}
                <Route
                  path="/sell"
                  element={
                    <ProtectedRoute>
                      <Sell />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/chat"
                  element={
                    <ProtectedRoute>
                      <Chat />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/chat/:offerId"
                  element={
                    <ProtectedRoute>
                      <Chat />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </div>
          </div>
        </Router>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;