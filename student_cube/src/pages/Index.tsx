import { useState, useEffect } from "react";
import api from "../utils/api";

// === ASSETS ===
import Footer from "../components/Footer";

// === ICONS ===
import {
  BookOpen,
  Calculator,
  Ruler,
  FileText,
  Shirt,
  Laptop,
  Briefcase,
  Package,
  UserPlus,
  Zap,
  Shield,
  BadgeCheck,
} from "lucide-react";

// === COMPONENTS ===
import ScrollToTopButton from "../components/ScrollToTopButton";
import HomeFeaturedSection from "../components/HomeFeaturedSection";
import RecentViewedSection from "../components/RecentViewedSection";
import BrowseCategories from "../components/BrowseCategories";
import SafetyBanner from "../components/SafetyBanner";
import HeroSection from "../components/HeroSection";
import Workflow from "../components/Workflow";
import JoinCommunity from "../components/JoinCommunity";

interface CategoryCount {
  category: string;
  count: number;
}

const Index = () => {
  const isLoggedIn = !!localStorage.getItem("token");

  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>(
    {},
  );

  useEffect(() => {
    const fetchCategoryCounts = async () => {
      try {
        const response = await api.get("/products/category-counts");
        const counts = Array.isArray(response.data.data)
          ? response.data.data.reduce(
              (acc: Record<string, number>, item: CategoryCount) => {
                const key = String(item.category || "").trim().toLowerCase();
                if (key) acc[key] = Number(item.count) || 0;
                return acc;
              },
              {},
            )
          : {};

        setCategoryCounts(counts);
      } catch (error) {
        console.error("Error fetching category counts:", error);
      }
    };

    fetchCategoryCounts();
  }, []);

  const stats = [
    { value: "0%", label: "Hidden Charges" },
    { value: "< 1 Min", label: "To List an Item" },
    { value: "~50%", label: "Average Savings" },
    { value: "100%", label: "Verified Students" },
  ];

  const initialCategories = [
    {
      name: "Books & Notes",
      backendMatch: ["books", "book", "notes", "books & notes"], // Backend ke possible names
      count: 0,
      icon: BookOpen,
      bgColor: "bg-blue-600",
      link: "/buy?category=Books+%26+Notes",
    },
    {
      name: "Calculators",
      backendMatch: ["calculators", "calculator"],
      count: 0,
      icon: Calculator,
      bgColor: "bg-orange-500",
      link: "/buy?category=Calculators",
    },
    {
      name: "Drafters & Instruments",
      backendMatch: ["drafters", "drafter", "instruments", "instrument", "drafters & instruments"],
      count: 0,
      icon: Ruler,
      bgColor: "bg-green-600",
      link: "/buy?category=Drafters+%26+Instruments",
    },
    {
      name: "Akash/Assignment Materials",
      backendMatch: ["aakash", "assignment", "assignments", "aakash/assignment materials", "study material"],
      count: 0,
      icon: FileText,
      bgColor: "bg-purple-500",
      link: "/buy?category=Aakash%2FAssignment+Materials",
    },
    {
      name: "Lab Coats & Uniforms",
      backendMatch: ["lab coats", "lab coat", "uniforms", "uniform", "lab coats & uniforms"],
      count: 0,
      icon: Shirt,
      bgColor: "bg-pink-500",
      link: "/buy?category=Lab+Coats+%26+Uniforms",
    },
    {
      name: "Electronics & Gadgets",
      backendMatch: ["electronics", "electronic", "gadgets", "gadget", "electronics & gadgets"],
      count: 0,
      icon: Laptop,
      bgColor: "bg-cyan-500",
      link: "/buy?category=Electronics+%26+Gadgets",
    },
    {
      name: "IOT and Robotics",
      backendMatch: ["iot and robotics", "iot", "robotics", "accessories", "accessory"],
      count: 0,
      icon: Briefcase,
      bgColor: "bg-amber-500",
      link: "/buy?category=IOT+and+Robotics",
    },
    {
      name: "Others",
      backendMatch: ["others", "other"],
      count: 0,
      icon: Package,
      bgColor: "bg-slate-600",
      link: "/buy?category=Others",
    },
  ];

  const steps = [
    {
      num: 1,
      title: "Create Account",
      desc: "Sign up with your phone number and email. Verify your identity to join the trusted community.",
      icon: UserPlus,
    },
    {
      num: 2,
      title: "List or Browse",
      desc: "Sellers list items with photos and videos. Buyers browse by category, college, or search.",
      icon: Zap,
    },
    {
      num: 3,
      title: "Connect Safely",
      desc: "Pay ₹9 to access seller contact. Chat with predefined keywords for safety before full payment.",
      icon: Shield,
    },
    {
      num: 4,
      title: "Complete Deal",
      desc: "Meet, verify the item, complete the transaction. Rate each other and get your deal",
      icon: BadgeCheck,
    },
  ];

  const dynamicCategories = initialCategories.map((category) => {
    const realCount = category.backendMatch.reduce(
      (total, backendCategory) => total + (categoryCounts[backendCategory] || 0),
      0,
    );

    return { ...category, count: realCount };
  });

  return (
    <main className="relative w-full overflow-hidden">
      <style>
        {`
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-15px); }
            100% { transform: translateY(0px); }
          }
          @keyframes bounce-slow {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(8px); }
          }
          @keyframes scroll-dot {
            0% { transform: translateY(0); opacity: 1; }
            100% { transform: translateY(12px); opacity: 0; }
          }
          .bg-grid-pattern {
            background-size: 40px 40px;
            background-image: linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                              linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
          }

          /* 🔥 NEW: FLUID WAVE TEXT ANIMATION 🔥 */
    @keyframes wave-flow {
      0% { background-position: 0px 0px; }
      100% { background-position: 40px 0px; } /* Smooth horizontal flow */
    }
    
    .text-wave-orange {
      /* This is a literal SVG sine-wave converted to a background image */
      background-image: url("data:image/svg+xml,%3Csvg width='40' height='14' viewBox='0 0 40 14' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 7 Q 10 1, 20 7 T 40 7' fill='none' stroke='%23f97316' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E");
      background-size: 40px 14px;
      background-repeat: repeat;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: wave-flow 1.2s linear infinite; /* 1.2s is the perfect speed for a fluid feel */
      filter: drop-shadow(0px 2px 4px rgba(249,115,22,0.3)); /* Soft orange glow */
    }
        `}
      </style>

      <HeroSection stats={stats} />

      <BrowseCategories categories={dynamicCategories} />

      <HomeFeaturedSection />

      <Workflow isLoggedIn={isLoggedIn} steps={steps} />

      <SafetyBanner isLoggedIn={isLoggedIn} />

      <RecentViewedSection />

      <JoinCommunity isLoggedIn={isLoggedIn} />

      <ScrollToTopButton />

      <Footer />
    </main>
  );
};

export default Index;
