import React from "react";

const FloatingShapes: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-50">
      {/* Yellow Square - Top Left */}
      <div
        className=" absolute top-[10%] left-[15%] w-12 h-12 bg-highlighter border-[var(--border-w)] border-solid border-ink shadow-[var(--shadow-off)_var(--shadow-off)_0_0_var(--color-ink)] rotate-12 animate-[float_6s_ease-in-out_infinite]"
      ></div>

      {/* Blue Rectangle - Top Right */}
      <div
        className="absolute top-[15%] right-[10%] w-16 h-12 bg-ledger-blue border-[var(--border-w)] border-solid border-ink shadow-[var(--shadow-off)_var(--shadow-off)_0_0_var(--color-ink)] -rotate-12 animate-[float-reverse_8s_ease-in-out_infinite]"
      ></div>

      {/* Green Square - Bottom Center-Left */}
      <div
        className="absolute bottom-[20%] left-[30%] w-14 h-14 bg-campus-green border-[var(--border-w)] border-solid border-ink shadow-[var(--shadow-off)_var(--shadow-off)_0_0_var(--color-ink)] rotate-45 animate-[float-reverse_7s_ease-in-out_infinite]"
      ></div>

      {/* Orange Rectangle - Bottom Right */}
      <div
        className="absolute bottom-[25%] right-[20%] w-20 h-10 bg-signal-orange border-[var(--border-w)] border-solid border-ink shadow-[var(--shadow-off)_var(--shadow-off)_0_0_var(--color-ink)] -rotate-6 animate-[float_9s_ease-in-out_infinite]"
      ></div>

      {/* Red Square - Center Left (Hidden on small screens) */}
      <div
        className="hidden md:block absolute top-[40%] left-[5%] w-10 h-10 bg-stamp-red border-[var(--border-w)] border-solid border-ink shadow-[var(--shadow-off)_var(--shadow-off)_0_0_var(--color-ink)] rotate-6 animate-[float_10s_ease-in-out_infinite]"
      ></div>

      {/* Yellow Square - Center Right (Hidden on small screens) */}
      <div
        className="hidden md:block absolute top-[50%] right-[5%] w-12 h-12 bg-highlighter border-[var(--border-w)] border-solid border-ink shadow-[var(--shadow-off)_var(--shadow-off)_0_0_var(--color-ink)] -rotate-[25deg] animate-[float-reverse_11s_ease-in-out_infinite]"
      ></div>
    </div>
  );
};

export default FloatingShapes;
