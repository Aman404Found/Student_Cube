"use client";
import { cn } from "../../lib/utils";
import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  children: React.ReactNode;
}

export const StatefulButton = ({ className, children, ...props }: ButtonProps) => {
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    setStatus("loading");
    
    const start = Date.now();
    if (props.onClick) {
      await props.onClick(event);
    }
    const elapsed = Date.now() - start;
    if (elapsed < 1500) {
      await new Promise((resolve) => setTimeout(resolve, 1500 - elapsed));
    }

    setStatus("success");
    setTimeout(() => setStatus("idle"), 2500);
  };

  // eslint-disable-next-line
  const { onClick, onDrag, onDragStart, onDragEnd, onAnimationStart, onAnimationEnd, ...buttonProps } = props;

  return (
    <motion.button
      layout
      className={cn(
        "flex items-center justify-center transition-all duration-500 focus:outline-none focus:ring-0 outline-none overflow-hidden",
        status === "idle" 
          ? className 
          : "w-14 h-14 p-0 rounded-full bg-green-500 shadow-[0_8px_20px_-6px_rgba(34,197,94,0.5)]",
        status !== "idle" && "pointer-events-none"
      )}
      {...buttonProps}
      onClick={status === "idle" ? handleClick : undefined}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        
        {status === "idle" && (
          <motion.span
            key="idle"
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.2 }}
            className="whitespace-nowrap flex items-center justify-center"
          >
            {children}
          </motion.span>
        )}

        {status === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-center"
          >
            <Loader />
          </motion.div>
        )}

        {status === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-center"
          >
            <CheckIcon />
          </motion.div>
        )}

      </AnimatePresence>
    </motion.button>
  );
};

const Loader = () => {
  return (
    <motion.svg
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-white"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M12 3a9 9 0 1 0 9 9" />
    </motion.svg>
  );
};

const CheckIcon = () => {
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-white"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <motion.path 
        initial={{ pathLength: 0 }} 
        animate={{ pathLength: 1 }} 
        transition={{ duration: 0.4, ease: "easeOut" }} 
        d="M5 12l5 5l10 -10" 
      />
    </motion.svg>
  );
};