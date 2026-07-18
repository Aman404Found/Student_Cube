import { useRef } from "react";
import logo from "../assets/logo-1.jpeg";
import { Link } from "react-router-dom";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { EASE_SNAP, prefersReducedMotion } from "../lib/motion";

const Footer = () => {
  const footerRef = useRef<HTMLElement>(null);

  // Footer entrance animation
  useGSAP(() => {
    if (prefersReducedMotion()) return;

    gsap.fromTo(
      footerRef.current,
      { y: 20, opacity: 0 },
      { 
        y: 0, 
        opacity: 1, 
        duration: 0.4, 
        ease: EASE_SNAP, 
        delay: 0.2,
        scrollTrigger: {
          trigger: footerRef.current,
          start: "top 95%",
        }
      }
    );
  }, { scope: footerRef });
  return (
    <footer ref={footerRef} className="bg-paper font-body text-ink" style={{ borderTop: "var(--border-w) solid var(--color-ink)" }}>
      {/* Top separator line */}
      <div className="w-full border-t-[var(--border-w)] border-ink" />

      {/* Main Content - Strict 3-Column Grid with Borders */}
      <div className="max-w-350 mx-auto grid grid-cols-1 md:grid-cols-3">
        {/* Column 1: Brand, Description & Address */}
        <div
          className="p-8 lg:p-12 flex flex-col items-start gap-4 border-b-[var(--border-w)] border-ink md:border-b-0 md:border-r-[var(--border-w)]"
        >

          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 bg-paper flex items-center justify-center p-0.5 shrink-0 overflow-hidden"
              style={{
                border: "var(--border-w) solid var(--color-ink)",
                borderRadius: "var(--brutal-radius)",
              }}
            >
              <img
                src={logo}
                alt="Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <h3 className="font-display text-ink font-bold text-lg uppercase tracking-tight">
              Student Cube
            </h3>
          </div>
          <div className="flex flex-col gap-4 mt-1">
            <p className="text-sm leading-relaxed text-ink/70 font-body font-bold">
              Student Cube is the ultimate marketplace designed exclusively for
              college students. We bridge the gap between academic needs and
              convenience by creating a secure platform.
            </p>
          </div>
        </div>

        {/* Column 2: Get in touch */}
        <div
          className="p-8 lg:p-12 flex flex-col gap-3 border-b-[var(--border-w)] border-ink md:border-b-0 md:border-r-[var(--border-w)]"
        >

          <h3 className="font-display text-ink font-bold text-base uppercase tracking-tight">
            Get in touch
          </h3>
          <p className="text-sm text-ink/70 font-body font-bold leading-relaxed mb-1">
            Have questions? Reach out to our team, and we'll be happy to assist
            you.
          </p>
          <a
            href="mailto:support.studentcube@gmail.com"
            className="text-sm font-body font-bold text-ink hover:text-signal-orange transition-colors brutal-focus w-fit"
            style={{
              textDecoration: "underline",
              textUnderlineOffset: "4px",
              textDecorationColor: "var(--color-ink)",
            }}
          >
            support.studentcube@gmail.com
          </a>
          <a
            href="mailto:thestudentcube@gmail.com"
            className="text-sm font-body font-bold text-ink hover:text-signal-orange transition-colors brutal-focus w-fit"
            style={{
              textDecoration: "underline",
              textUnderlineOffset: "4px",
              textDecorationColor: "var(--color-ink)",
            }}
          >
            thestudentcube@gmail.com
          </a>
        </div>

        {/* Column 3: We're social */}
        <div className="p-8 lg:p-12 flex flex-col gap-5">
          <h3 className="font-display text-ink font-bold text-base uppercase tracking-tight">
            We're social
          </h3>
          <div className="grid grid-cols-2 gap-y-4 gap-x-2 mt-1">
            {/* WhatsApp */}
            <a
              href="https://chat.whatsapp.com/G7FGYX6gvU15rGMV9ygQVA"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 text-sm font-body font-bold text-ink/70 hover:text-ink transition-colors group brutal-focus"
            >
              <div
                className="w-7 h-7 bg-campus-green text-paper flex items-center justify-center transition-all duration-120 group-hover:translate-y-[-2px] group-hover:translate-x-[-2px]"
                style={{
                  border: "var(--border-w-sm) solid var(--color-ink)",
                  borderRadius: "var(--brutal-radius)",
                  boxShadow: "2px 2px 0 0 var(--color-shadow)",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                </svg>
              </div>
              WhatsApp
            </a>
            {/* LinkedIn */}
            <a
              href="https://www.linkedin.com/company/student-cube/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 text-sm font-body font-bold text-ink/70 hover:text-ink transition-colors group brutal-focus"
            >
              <div
                className="w-7 h-7 bg-ledger-blue text-paper flex items-center justify-center transition-all duration-120 group-hover:translate-y-[-2px] group-hover:translate-x-[-2px]"
                style={{
                  border: "var(--border-w-sm) solid var(--color-ink)",
                  borderRadius: "var(--brutal-radius)",
                  boxShadow: "2px 2px 0 0 var(--color-shadow)",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </div>
              LinkedIn
            </a>
            {/* X Logo */}
            <a
              href="https://x.com/Student_Cube"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 text-sm font-body font-bold text-ink/70 hover:text-ink transition-colors group brutal-focus"
            >
              <div
                className="w-7 h-7 bg-paper text-ink flex items-center justify-center transition-all duration-120 group-hover:translate-y-[-2px] group-hover:translate-x-[-2px]"
                style={{
                  border: "var(--border-w-sm) solid var(--color-ink)",
                  borderRadius: "var(--brutal-radius)",
                  boxShadow: "2px 2px 0 0 var(--color-shadow)",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </div>
              X (Twitter)
            </a>
            {/* Instagram */}
            <a
              href="https://www.instagram.com/student_cube/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 text-sm font-body font-bold text-ink/70 hover:text-ink transition-colors group brutal-focus"
            >
              <div
                className="w-7 h-7 bg-stamp-red text-paper flex items-center justify-center transition-all duration-120 group-hover:translate-y-[-2px] group-hover:translate-x-[-2px]"
                style={{
                  border: "var(--border-w-sm) solid var(--color-ink)",
                  borderRadius: "var(--brutal-radius)",
                  boxShadow: "2px 2px 0 0 var(--color-shadow)",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </div>
              Instagram
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Copyright Bar with Top Border */}
      <div className="w-full border-t-[var(--border-w)] border-ink bg-paper">
        <div className="max-w-350 mx-auto p-4 lg:px-12 flex flex-col sm:flex-row justify-between items-center gap-3 font-mono text-xs text-ink/60 font-bold uppercase tracking-wide">
          <p>© {new Date().getFullYear()} Student Cube. All rights reserved.</p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-[10px] sm:text-xs text-ink/60 font-bold font-mono uppercase tracking-wide">
            <Link
              to="/privacy-policy"
              className="hover:text-signal-orange transition-colors brutal-focus"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms-of-service"
              className="hover:text-signal-orange transition-colors brutal-focus"
            >
              Terms & Conditions
            </Link>
            <Link
              to="/cancellation-refund"
              className="hover:text-signal-orange transition-colors brutal-focus"
            >
              Cancellation & Refund
            </Link>
            <Link
              to="/shipping-exchange"
              className="hover:text-signal-orange transition-colors brutal-focus"
            >
              Shipping & Exchange
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
