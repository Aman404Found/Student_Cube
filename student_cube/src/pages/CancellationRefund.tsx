import { 
  Wallet, 
  Coins, 
  Users, 
  XCircle 
} from "lucide-react";
import Footer from "../components/FooterMin"; 
import ScrollToTopButton from "../components/ScrollToTopButton"; 

const CancellationRefund = () => {
  return (
    <div className="min-h-screen bg-paper flex flex-col font-body">
      <main className="grow max-w-4xl mx-auto w-full p-4 py-12">
        
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 brutal-block-sm bg-signal-orange/10 text-signal-orange mb-6">
            <Wallet className="w-8 h-8" strokeWidth={3} />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-black text-ink uppercase tracking-tight mb-4">
            Cancellation & Refund Policy
          </h1>
          <p className="text-ink/50 font-mono font-bold uppercase tracking-wider text-sm">
            Last Updated: July 2026
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-paper brutal-block border-[var(--border-w)] border-ink overflow-hidden">
          <div className="p-8 md:p-10 border-b-[var(--border-w)] border-ink bg-paper-blue">
            <p className="text-ink/90 leading-relaxed text-lg font-body">
              Welcome to <span className="font-display font-bold uppercase tracking-tight text-ink">Student Cube</span>. We operate strictly as a hyperlocal information-matching directory for university students.
            </p>
          </div>

          <div className="p-8 md:p-10 space-y-12">
            
            {/* Section 1 */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 brutal-block-sm bg-signal-orange text-ink">
                  <Coins className="w-5 h-5" strokeWidth={3} />
                </div>
                <h2 className="text-2xl font-display font-black text-ink uppercase tracking-tight">1. Non-Refundable Token Fees</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-6 mt-6">
                <div className="bg-paper-blue p-6 brutal-block">
                  <h3 className="font-display font-bold text-ink uppercase tracking-tight text-lg mb-2">Seller Listing Fee</h3>
                  <p className="text-ink/80 text-sm leading-relaxed font-body">
                    The flat <strong className="font-bold text-ink font-mono text-xs">₹9 token fee</strong> paid by a user to post an academic listing is <strong className="font-bold text-ink font-display uppercase tracking-tight text-xs">strictly non-refundable</strong> once the listing is manually reviewed and approved by our admins dashboard. If a listing is rejected by the admin team before going live, no fee is charged.
                  </p>
                </div>
                <div className="bg-paper-blue p-6 brutal-block">
                  <h3 className="font-display font-bold text-ink uppercase tracking-tight text-lg mb-2">Buyer Connection Fee</h3>
                  <p className="text-ink/80 text-sm leading-relaxed font-body">
                    The flat <strong className="font-bold text-ink font-mono text-xs">₹9 fee</strong> paid by a buyer to unlock a seller's chat and contact information is <strong className="font-bold text-ink font-display uppercase tracking-tight text-xs">non-refundable</strong> once the details are revealed.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 2 */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 brutal-block-sm bg-ledger-blue text-paper">
                  <Users className="w-5 h-5" strokeWidth={3} />
                </div>
                <h2 className="text-2xl font-display font-black text-ink uppercase tracking-tight">2. Third-Party Transactions</h2>
              </div>
              <p className="text-ink/90 font-body leading-relaxed bg-ledger-blue/10 p-6 brutal-block border-[var(--border-w)] border-ink">
                Student Cube does not process, handle, or hold payments for the physical goods exchanged between students (such as mini-drafters, lab coats, or scientific calculators). All physical monetary transactions and negotiations happen directly between the independent buyer and seller during their physical meeting on campus. Consequently, Student Cube holds <strong className="font-bold text-ink font-display uppercase tracking-tight">zero liability and offers no refunds</strong> for the secondary sale price agreed upon by the users.
              </p>
            </section>

            {/* Section 3 */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 brutal-block-sm bg-highlighter text-ink">
                  <XCircle className="w-5 h-5" strokeWidth={3} />
                </div>
                <h2 className="text-2xl font-display font-black text-ink uppercase tracking-tight">3. Cancellation of Active Listings</h2>
              </div>
              <p className="text-ink/80 font-body leading-relaxed">
                Sellers can manually delete or take down their active asset listings from the campus feed at any point in time <strong className="font-bold text-ink font-display uppercase tracking-tight">free of cost</strong>. However, taking down a live listing does not entitle the seller to a refund of the initial ₹9 listing fee.
              </p>
            </section>

          </div>
        </div>
        
        <ScrollToTopButton />
      </main>
      <Footer />
    </div>
  );
};

export default CancellationRefund;