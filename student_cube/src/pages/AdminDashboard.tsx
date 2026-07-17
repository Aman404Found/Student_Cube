import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BadgeCheck, LayoutDashboard, ShieldCheck, Layers } from "lucide-react";

import AdminReviewPanel from "../components/AdminReviewPanel";
import AdminAmbassadorsPanel from "../components/AdminAmbassadorsPanel";

const App = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") === "ambassadors" ? "ambassadors" : "listings";
  const [activeTab, setActiveTab] = useState<"listings" | "ambassadors">(initialTab);

  const selectTab = (tab: "listings" | "ambassadors") => {
    setActiveTab(tab);
    setSearchParams(tab === "ambassadors" ? { tab } : {});
  };

  return (
    <div className="min-h-screen bg-paper text-ink font-body py-8 px-4 sm:px-6 lg:px-8">
      <nav className="max-w-6xl mx-auto flex items-center gap-2 mb-8 text-ink/70">
        <LayoutDashboard className="w-5 h-5 text-ledger-blue" />
        <span className="font-display font-bold tracking-tight uppercase text-lg">
          STUDENT CUBE <span className="text-signal-orange">ADMIN</span>
        </span>
      </nav>

      <div className="max-w-6xl mx-auto mb-6 border-b-[var(--border-w)] border-ink pb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-ledger-blue font-mono font-bold text-xs uppercase tracking-wider mb-2">
            <ShieldCheck className="w-4 h-4" /> Admin Workspace
          </div>
          <h1 className="text-4xl font-display uppercase font-black text-ink tracking-tight">
            Admin Moderation Desk
          </h1>
        </div>

        <div className="flex gap-2 bg-paper p-1 brutal-block-sm border-[var(--border-w)] border-ink shrink-0 w-fit">
          <button
            onClick={() => selectTab("listings")}
            className={`flex items-center gap-2 px-6 py-3 font-display font-bold text-sm uppercase tracking-tight transition-colors ${
              activeTab === "listings"
                ? "bg-highlighter text-ink brutal-block-sm"
                : "text-ink hover:bg-paper-blue"
            }`}
            style={activeTab === "listings" ? {} : { borderRadius: 'var(--radius)' }}
          >
            <Layers className="w-4 h-4" /> Pending Products
          </button>
          <button
            onClick={() => selectTab("ambassadors")}
            className={`flex items-center gap-2 px-6 py-3 font-display font-bold text-sm uppercase tracking-tight transition-colors ${
              activeTab === "ambassadors"
                ? "bg-highlighter text-ink brutal-block-sm"
                : "text-ink hover:bg-paper-blue"
            }`}
            style={activeTab === "ambassadors" ? {} : { borderRadius: 'var(--radius)' }}
          >
            <BadgeCheck className="w-4 h-4" /> Ambassadors
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        {activeTab === "listings" ? <AdminReviewPanel /> : <AdminAmbassadorsPanel />}
      </div>
    </div>
  );
};

export default App;
