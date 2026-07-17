import { 
  Scale, 
  Info, 
  UserCheck, 
  Ban, 
  ShieldAlert, 
  CreditCard, 
  RefreshCw 
} from "lucide-react";
import Footer from "../components/FooterMin"; // Adjust path as per your project
import ScrollToTopButton from "../components/ScrollToTopButton"; // Adjust path

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-paper flex flex-col font-body">
      <main className="grow max-w-4xl mx-auto w-full p-4 py-12">
        
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 brutal-block-sm bg-ledger-blue/10 text-ledger-blue mb-6">
            <Scale className="w-8 h-8" strokeWidth={3} />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-black text-ink uppercase tracking-tight mb-4">
            Terms of Service
          </h1>
          <p className="text-ink/50 font-mono font-bold uppercase tracking-wider text-sm">
            Last Updated: June 2026
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-paper brutal-block border-[var(--border-w)] border-ink overflow-hidden">
          
          {/* Welcome Message */}
          <div className="p-8 md:p-10 border-b-[var(--border-w)] border-ink bg-paper-blue">
            <p className="text-ink/90 font-body leading-relaxed text-lg">
              Welcome to <span className="font-display font-bold uppercase tracking-tight text-ink">Student Cube</span>. By accessing our website and utilizing our services, you agree to comply with and be bound by the following Terms of Service.
            </p>
          </div>

          <div className="p-8 md:p-10 space-y-12">
            
            {/* Section 1 */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 brutal-block-sm bg-ledger-blue text-paper">
                  <Info className="w-5 h-5" strokeWidth={3} />
                </div>
                <h2 className="text-2xl font-display font-black text-ink uppercase tracking-tight">1. The Nature of Our Platform</h2>
              </div>
              <p className="text-ink/50 text-sm font-mono font-bold uppercase tracking-wider mb-4">Intermediary Disclaimer</p>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="w-3 h-3 mt-1.5 mr-3 border-[var(--border-w-sm)] border-ink bg-ledger-blue shrink-0"></div>
                  <p className="text-ink/80 font-body leading-relaxed">
                    Student Cube is purely an online peer-to-peer (P2P) venue and intermediary directory. We do not buy, sell or own the academic gear listed on the platform.
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="w-3 h-3 mt-1.5 mr-3 border-[var(--border-w-sm)] border-ink bg-ledger-blue shrink-0"></div>
                  <p className="text-ink/80 font-body leading-relaxed">
                    Any transactional agreement, communication, exchange of funds, and physical hand-off of college equipment (drafters, calculators, lab coats, books) happens directly between the student buyer and the student seller.
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="w-3 h-3 mt-1.5 mr-3 border-[var(--border-w-sm)] border-ink bg-ledger-blue shrink-0"></div>
                  <p className="text-ink/80 font-body leading-relaxed">
                    Student Cube is not responsible for the structural condition, performance, accuracy, or safety of the items exchanged.
                  </p>
                </li>
              </ul>
            </section>

            {/* Section 2 */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 brutal-block-sm bg-ledger-blue text-paper">
                  <UserCheck className="w-5 h-5" strokeWidth={3} />
                </div>
                <h2 className="text-2xl font-display font-black text-ink uppercase tracking-tight">2. User Eligibility & Accountability</h2>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="w-3 h-3 mt-1.5 mr-3 border-[var(--border-w-sm)] border-ink bg-ledger-blue shrink-0"></div>
                  <p className="text-ink/80 font-body leading-relaxed">
                    This platform is strictly built for active college students (specifically engineering batches).
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="w-3 h-3 mt-1.5 mr-3 border-[var(--border-w-sm)] border-ink bg-ledger-blue shrink-0"></div>
                  <p className="text-ink/80 font-body leading-relaxed">
                    Users agree to provide accurate, truthful, and non-misleading information when creating listings or setting up profiles.
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="w-3 h-3 mt-1.5 mr-3 border-[var(--border-w-sm)] border-ink bg-ledger-blue shrink-0"></div>
                  <p className="text-ink/80 font-body leading-relaxed">
                    Sellers warrant that the pre-loved assets they list are their own property and match the images/descriptions provided.
                  </p>
                </li>
              </ul>
            </section>

            {/* Section 3 */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 brutal-block-sm bg-stamp-red text-paper">
                  <Ban className="w-5 h-5" strokeWidth={3} />
                </div>
                <h2 className="text-2xl font-display font-black text-ink uppercase tracking-tight">3. Prohibited Conduct</h2>
              </div>
              <p className="text-ink/80 mb-4 font-body">Users agree not to:</p>
              <div className="bg-stamp-red/10 p-6 brutal-block border-[var(--border-w)] border-ink">
                <ul className="space-y-3 text-ink/90 font-body">
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 border-[1px] border-ink bg-stamp-red"></div>
                    List counterfeit, broken, illegal, or non-college-related products.
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 border-[1px] border-ink bg-stamp-red"></div>
                    Harass, spam, or exploit the contact details of other students found through the directory.
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 border-[1px] border-ink bg-stamp-red"></div>
                    Manipulate the performance metrics or referral codes of our Founding Network Partner program.
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 4 */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 brutal-block-sm bg-highlighter text-ink">
                  <ShieldAlert className="w-5 h-5" strokeWidth={3} />
                </div>
                <h2 className="text-2xl font-display font-black text-ink uppercase tracking-tight">4. Limitation of Liability</h2>
              </div>
              <p className="text-ink/80 font-body leading-relaxed">
                Student Cube, its founders, and campus partners shall not be held liable for any direct, indirect, incidental, or consequential disputes, financial losses, or damages arising out of user interactions, faulty equipment hand-offs, or mismatched product expectations. All items are exchanged on an <strong className="font-bold text-ink font-display uppercase tracking-tight">"As-Is"</strong> basis between peers.
              </p>
            </section>

            {/* Section 5 */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 brutal-block-sm bg-campus-green text-ink">
                  <CreditCard className="w-5 h-5" strokeWidth={3} />
                </div>
                <h2 className="text-2xl font-display font-black text-ink uppercase tracking-tight">5. Fees and Non-Refundability</h2>
              </div>
              <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-paper-blue p-5 brutal-block">
                  <h3 className="font-display font-bold text-ink uppercase tracking-tight text-lg mb-2">Service Fees</h3>
                  <p className="text-ink/80 font-body text-sm leading-relaxed">
                    Student Cube may charge a nominal fee for hosting listings or providing direct contact access between buyers and sellers to maintain and operate the platform infrastructure.
                  </p>
                </div>
                <div className="bg-paper-blue p-5 brutal-block">
                  <h3 className="font-display font-bold text-ink uppercase tracking-tight text-lg mb-2">Strict Policy</h3>
                  <p className="text-ink/80 font-body text-sm leading-relaxed">
                    All listing fees, and contact facilitation fees paid on the platform are <strong className="font-bold text-ink font-display uppercase tracking-tight text-xs">strictly non-refundable</strong>.
                  </p>
                </div>
                <div className="bg-paper-blue p-5 brutal-block">
                  <h3 className="font-display font-bold text-ink uppercase tracking-tight text-lg mb-2">Transaction Status</h3>
                  <p className="text-ink/80 font-body text-sm leading-relaxed">
                    Because we operate purely as an intermediary, the success, failure, cancellation, or outcome of the final physical transaction does not entitle any party to a refund of platform fees.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 6 */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 brutal-block-sm bg-ink text-paper">
                  <RefreshCw className="w-5 h-5" strokeWidth={3} />
                </div>
                <h2 className="text-2xl font-display font-black text-ink uppercase tracking-tight">6. Variations & Changes</h2>
              </div>
              <p className="text-ink/90 font-body leading-relaxed bg-paper-blue p-6 brutal-block">
                We reserve the right to revise these terms at any time. Your continued use of the website following any updates constitutes an acceptance of the modified Terms of Service.
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

export default TermsOfService;