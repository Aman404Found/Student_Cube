import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);

    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-5 right-5 md:bottom-8 md:right-8 z-[9999] p-3 bg-signal-orange text-paper brutal-block-sm brutal-focus hover:bg-paper hover:text-signal-orange hover:-translate-y-1 transition-all duration-300 group"
      aria-label="Scroll to top"
    >
      <ArrowUp className="w-6 h-6" strokeWidth={3} />
    </button>
  );
};

export default ScrollToTopButton;
