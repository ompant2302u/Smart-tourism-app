import { useState, useEffect } from "react";
import { LangProvider } from "./context/LangContext";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import PageLoader from "./components/PageLoader";
import { api, clearToken } from "./api";

import HomePage from "./pages/HomePage";
import DestinationsPage from "./pages/DestinationsPage";
import DestinationDetailPage from "./pages/DestinationDetailPage";
import HotelsPage from "./pages/HotelsPage";
import HotelDetailPage from "./pages/HotelDetailPage";
import GuidesPage from "./pages/GuidesPage";
import GuideDetailPage from "./pages/GuideDetailPage";
import SearchPage from "./pages/SearchPage";
import SafetyPage from "./pages/SafetyPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import AdminDashboard from "./pages/AdminDashboard";
import ActivityTracker from "./pages/ActivityTracker";
import TransportPage from "./pages/TransportPage";
import TripCostEstimator from "./pages/TripCostEstimator";

const NO_FOOTER = ["login", "register"];
const NO_NAV_PAD = ["home", "login", "register"];

function AppInner() {
  const [theme, setTheme] = useState(() => localStorage.getItem("nw-theme") || "light");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState("home");
  const [params, setParams] = useState({});
  const [user, setUser] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("nw-theme", theme);
  }, [theme]);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const boot = async () => {
      const token = localStorage.getItem("nw-token");
      if (!token) return;

      try {
        const profile = await api.profile();
        setUser({
          id: profile.id,
          username: profile.username,
          firstName: profile.first_name || profile.username,
          lastName: profile.last_name || "",
          email: profile.email || "",
          is_staff: profile.is_staff,
          is_superuser: profile.is_superuser,
          isAdmin: profile.is_staff || profile.is_superuser,
        });
      } catch {
        clearToken();
        setUser(null);
      }
    };

    boot();
  }, []);

  const navigate = (pg, p = {}) => {
    setPage(pg);
    setParams(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const props = { navigate, user, setUser, pageParams: params };

  const renderPage = () => {
    switch (page) {
      case "home":
        return <HomePage {...props} />;
      case "destinations":
        return <DestinationsPage {...props} />;
      case "destination-detail":
        return <DestinationDetailPage {...props} />;
      case "hotels":
        return <HotelsPage {...props} />;
      case "hotel-detail":
        return <HotelDetailPage {...props} />;
      case "guides":
        return <GuidesPage {...props} />;
      case "guide-detail":
        return <GuideDetailPage {...props} />;
      case "transport":
        return <TransportPage {...props} />;
      case "search":
        return <SearchPage {...props} />;
      case "safety":
        return <SafetyPage {...props} />;
      case "about":
        return <AboutPage {...props} />;
      case "contact":
        return <ContactPage {...props} />;
      case "login":
        return <LoginPage {...props} />;
      case "register":
        return <RegisterPage {...props} />;
      case "profile":
        return <ProfilePage {...props} />;
      case "admin":
        return <AdminDashboard {...props} />;
      case "activity":
        return <ActivityTracker {...props} />;
      case "estimator":
        return <TripCostEstimator {...props} />;
      default:
        return <HomePage {...props} />;
    }
  };

  return (
    <>
      {loading && <PageLoader />}
      <Navbar
        navigate={navigate}
        page={page}
        user={user}
        setUser={setUser}
        theme={theme}
        setTheme={setTheme}
      />
      <main style={{ marginTop: NO_NAV_PAD.includes(page) ? 0 : 64 }}>
        {renderPage()}
      </main>
      {!NO_FOOTER.includes(page) && <Footer navigate={navigate} />}
    </>
  );
}

export default function App() {
  return (
    <LangProvider>
      <AppInner />
    </LangProvider>
  );
}