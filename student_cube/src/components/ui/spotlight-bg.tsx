"use client";
import React, { useRef, useState } from "react";

export const SpotlightDotBackground = ({ 
  children,
  className = "",
  style = {}
}: { 
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={`relative w-full overflow-hidden group ${className}`}
      style={style} 
    >
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'radial-gradient(circle at center, rgba(255, 255, 255, 0.2) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div 
        className="pointer-events-none absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          backgroundImage: 'radial-gradient(circle at center, rgba(255, 255, 255, 0.9) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          maskImage: `radial-gradient(300px circle at ${mousePosition.x}px ${mousePosition.y}px, black, transparent)`,
          WebkitMaskImage: `radial-gradient(300px circle at ${mousePosition.x}px ${mousePosition.y}px, black, transparent)`,
        }}
      />
      
      <div 
         className="pointer-events-none absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
         style={{
           background: `radial-gradient(400px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.08), transparent 40%)`
         }}
      />

      <div className="relative z-10 w-full h-full min-h-screen">
        {children}
      </div>
    </div>
  );
};