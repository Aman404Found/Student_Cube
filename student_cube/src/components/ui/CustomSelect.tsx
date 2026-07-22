import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  direction?: "down" | "up";
}

const CustomSelect = ({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  direction = "down",
}: CustomSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Find the selected option's label
  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Select Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 border border-solid border-ink font-body font-medium text-ink flex items-center justify-between transition-colors text-left"
      >
        <span className={!selectedOption ? "text-ink/40" : "text-ink"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-ink transition-transform duration-200 ${
            isOpen ? (direction === "up" ? "" : "rotate-180") : (direction === "up" ? "rotate-180" : "")
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className={`absolute z-99 left-0 w-full bg-paper border border-solid border-ink overflow-y-auto no-scrollbar ${
            direction === "up" ? "bottom-[calc(100%+4px)]" : "top-[calc(100%+4px)]"
          }`}
          style={{
            maxHeight: "240px",
            borderRadius: "var(--brutal-radius)",
          }}
        >
          <ul className="flex flex-col">
            {options.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 font-body font-medium transition-colors border-b border-ink/10 last:border-b-0 ${
                    value === option.value
                      ? "bg-ledger-blue text-paper font-bold"
                      : "text-ink hover:bg-paper-blue"
                  }`}
                >
                  {option.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
