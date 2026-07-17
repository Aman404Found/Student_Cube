import { 
  Shield, 
  FileText, 
  Lock, 
  Share2, 
  UserCheck 
} from "lucide-react";
import Footer from "../components/FooterMin"; // Adjust path as per your project
import ScrollToTopButton from "../components/ScrollToTopButton"; // Adjust path

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-paper flex flex-col font-body">
      <main className="grow max-w-4xl mx-auto w-full p-4 py-12">
        
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 brutal-block-sm bg-ledger-blue/10 text-ledger-blue mb-6">
            <Shield className="w-8 h-8" strokeWidth={3} />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-black text-ink uppercase tracking-tight mb-4">
            Privacy Policy
          </h1>
          <p className="text-ink/50 font-mono font-bold uppercase tracking-wider text-sm">
            Last Updated: June 2026
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-paper brutal-block border-[var(--border-w)] border-ink overflow-hidden">
          
          {/* Welcome Message */}
          <div className="p-8 md:p-10 border-b-[var(--border-w)] border-ink bg-paper-blue">
            <p className="text-ink/90 leading-relaxed text-lg font-body">
              Welcome to <span className="font-display font-bold uppercase tracking-tight text-ink">Student Cube</span>. We respect your privacy and are committed to protecting the personal data you share with us. This Privacy Policy explains how we collect, use, and protect your information when you visit our website or use our platform.
            </p>
          </div>

          <div className="p-8 md:p-10 space-y-12">
            
            {/* Section 1 */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 brutal-block-sm bg-ledger-blue text-paper">
                  <FileText className="w-5 h-5" strokeWidth={3} />
                </div>
                <h2 className="text-2xl font-display font-black text-ink uppercase tracking-tight">1. Information We Collect</h2>
              </div>
              <p className="text-ink/80 mb-4 font-body">
                To provide a seamless campus hand-off, we collect the following information:
              </p>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="w-3 h-3 mt-1.5 mr-3 border-[var(--border-w-sm)] border-ink bg-signal-orange shrink-0"></div>
                  <p className="text-ink/80 font-body leading-relaxed">
                    <strong className="text-ink font-bold">Account Information:</strong> Name, email address, WhatsApp/contact number, college name, branch, and year of study when you register or sign up for early access.
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="w-3 h-3 mt-1.5 mr-3 border-[var(--border-w-sm)] border-ink bg-highlighter shrink-0"></div>
                  <p className="text-ink/80 font-body leading-relaxed">
                    <strong className="text-ink font-bold">Listing Data:</strong> Images, descriptions, and structural specifications of the engineering gear, calculators, books, or accessories you list for sale.
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="w-3 h-3 mt-1.5 mr-3 border-[var(--border-w-sm)] border-ink bg-campus-green shrink-0"></div>
                  <p className="text-ink/80 font-body leading-relaxed">
                    <strong className="text-ink font-bold">Verification Data:</strong> Professional URLs (LinkedIn, GitHub) or minimal college verification details submitted if you apply for our Founding Network Partner cohort.
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
                <h2 className="text-2xl font-display font-black text-ink uppercase tracking-tight">2. How We Use Your Information</h2>
              </div>
              <p className="text-ink/80 mb-4 font-body">
                We use your data solely to operate and improve the platform, specifically to:
              </p>
              <ul className="space-y-3 text-ink/80 font-body">
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-ink border-[1px] border-ink"></div>
                  Facilitate connections between student buyers and student sellers.
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-ink border-[1px] border-ink"></div>
                  Send you essential platform updates, launch notifications, or referral program metrics.
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-ink border-[1px] border-ink"></div>
                  Ensure safety and prevent anonymous spam listings on campus networks.
                </li>
              </ul>
            </section>

            {/* Section 3 */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 brutal-block-sm bg-ledger-blue text-paper">
                  <Share2 className="w-5 h-5" strokeWidth={3} />
                </div>
                <h2 className="text-2xl font-display font-black text-ink uppercase tracking-tight">3. Data Sharing & Third Parties</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-6 mt-6">
                <div className="bg-paper-blue p-6 brutal-block">
                  <h3 className="font-display font-bold text-ink uppercase tracking-tight text-lg mb-2">Peer-to-Peer Visibility</h3>
                  <p className="text-ink/80 font-body text-sm leading-relaxed">
                    To facilitate a successful transaction, your designated contact preference (e.g., WhatsApp number or campus profile) will be visible to potential buyers/sellers to coordinate the hand-off.
                  </p>
                </div>
                <div className="bg-paper-blue p-6 brutal-block">
                  <h3 className="font-display font-bold text-ink uppercase tracking-tight text-lg mb-2">No Commercial Selling</h3>
                  <p className="text-ink/80 font-body text-sm leading-relaxed">
                    We never sell, trade, or rent your personal identification information to third-party marketing agencies.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 brutal-block-sm bg-ledger-blue text-paper">
                  <Lock className="w-5 h-5" strokeWidth={3} />
                </div>
                <h2 className="text-2xl font-display font-black text-ink uppercase tracking-tight">4. Data Security & Retention</h2>
              </div>
              <p className="text-ink/90 font-body leading-relaxed bg-ledger-blue/10 p-6 brutal-block border-[var(--border-w)] border-ink">
                We implement appropriate data collection, storage, and security measures to protect against unauthorized access or alteration of your personal data. We retain your information only as long as necessary to provide marketplace services or as required by law.
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

export default PrivacyPolicy;