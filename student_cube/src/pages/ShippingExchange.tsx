import { 
  Package, 
  Ban, 
  MapPin, 
  Eye 
} from "lucide-react";
import Footer from "../components/FooterMin"; 
import ScrollToTopButton from "../components/ScrollToTopButton"; 

const ShippingExchange = () => {
  return (
    <div className="min-h-screen bg-paper flex flex-col font-body">
      <main className="grow max-w-4xl mx-auto w-full p-4 py-12">
        
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 brutal-block-sm bg-campus-green/10 text-campus-green mb-6">
            <Package className="w-8 h-8" strokeWidth={3} />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-black text-ink uppercase tracking-tight mb-4">
            Shipping & Exchange Policy
          </h1>
          <p className="text-ink/50 font-mono font-bold uppercase tracking-wider text-sm">
            Last Updated: July 2026
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-paper brutal-block border-[var(--border-w)] border-ink overflow-hidden">
          <div className="p-8 md:p-10 border-b-[var(--border-w)] border-ink bg-paper-blue">
            <p className="text-ink/90 font-body leading-relaxed text-lg">
              <span className="font-display font-bold uppercase tracking-tight text-ink">Student Cube</span> is a peer-to-peer (P2P) matching platform designed exclusively for local university campus networks.
            </p>
          </div>

          <div className="p-8 md:p-10 space-y-12">
            
            {/* Section 1 */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 brutal-block-sm bg-stamp-red text-paper">
                  <Ban className="w-5 h-5" strokeWidth={3} />
                </div>
                <h2 className="text-2xl font-display font-black text-ink uppercase tracking-tight">1. No Shipping Operations</h2>
              </div>
              <p className="text-ink/90 font-body leading-relaxed bg-stamp-red/10 p-6 brutal-block border-[var(--border-w)] border-ink">
                Student Cube does <strong className="text-ink font-bold font-display uppercase tracking-tight">not</strong> provide any shipping, packaging, courier, or logistical delivery services. We hold zero physical inventory and do not transport items between users.
              </p>
            </section>

            {/* Section 2 */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 brutal-block-sm bg-ledger-blue text-paper">
                  <MapPin className="w-5 h-5" strokeWidth={3} />
                </div>
                <h2 className="text-2xl font-display font-black text-ink uppercase tracking-tight">2. Hyperlocal Campus Hand-Off</h2>
              </div>
              <p className="text-ink/80 font-body leading-relaxed">
                All items listed on the platform are strictly meant for direct, face-to-face physical exchange. Upon unlocking a seller's contact details, the buyer and seller are expected to mutually arrange a safe physical meeting point directly on their college campus or hostel premises to inspect and hand over the item.
              </p>
            </section>

            {/* Section 3 */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 brutal-block-sm bg-highlighter text-ink">
                  <Eye className="w-5 h-5" strokeWidth={3} />
                </div>
                <h2 className="text-2xl font-display font-black text-ink uppercase tracking-tight">3. As-Is Inspections and Exchanges</h2>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="w-3 h-3 mt-1.5 mr-3 border-[var(--border-w-sm)] border-ink bg-highlighter shrink-0"></div>
                  <p className="text-ink/80 font-body leading-relaxed">
                    All academic assets are exchanged strictly on an <strong className="text-ink font-bold font-display uppercase tracking-tight">"As-Is"</strong> condition basis.
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="w-3 h-3 mt-1.5 mr-3 border-[var(--border-w-sm)] border-ink bg-highlighter shrink-0"></div>
                  <p className="text-ink/80 font-body leading-relaxed">
                    Buyers are highly encouraged to thoroughly examine the functional and physical condition of the item (e.g., verifying the scale calibration of a mini-drafter or testing a scientific calculator) <strong className="text-ink font-bold font-display uppercase tracking-tight">before</strong> handing over any mutual final payment to the seller.
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="w-3 h-3 mt-1.5 mr-3 border-[var(--border-w-sm)] border-ink bg-highlighter shrink-0"></div>
                  <p className="text-ink/80 font-body leading-relaxed">
                    Once the physical hand-off is completed between both parties on campus, Student Cube does not govern, facilitate, or take responsibility for any subsequent exchanges, returns, or disputes.
                  </p>
                </li>
              </ul>
            </section>

          </div>
        </div>
        
        <ScrollToTopButton />
      </main>
      <Footer />
    </div>
  );
};

export default ShippingExchange;