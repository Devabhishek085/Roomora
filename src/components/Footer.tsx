import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Heart, Sparkles, MapPin, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 transition-colors">
      {/* Top Banner: Indie Community Notice */}
      <div className="bg-gradient-to-r from-teal-900/40 via-slate-900 to-emerald-950/40 border-b border-teal-500/20 py-2.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-400" />
            <span className="font-semibold text-teal-300">
              An indie student & young professional housing collective
            </span>
            <span className="text-slate-400">| Zero Brokerage</span>
          </div>
          <div className="text-slate-400 text-[11px]">
            Direct flatmate chat • Verified listings • Neighborhood essentials
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-teal-500 flex items-center justify-center text-slate-950 font-black text-lg">
                🏡
              </div>
              <span className="font-heading font-extrabold text-xl text-white">
                Roommate<span className="text-teal-400">.com</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Find Your Place. Find Your People. Built by two former students who were tired of shady brokers and awkward roommate surprises.
            </p>
            <div className="flex items-center gap-2 text-xs text-teal-400">
              <MapPin className="w-3.5 h-3.5" />
              <span>Active in Delhi-NCR & Bengaluru</span>
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Explore Platform
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/explore" className="hover:text-teal-400 transition-colors">
                  Explore PGs & Flats (Map View)
                </Link>
              </li>
              <li>
                <Link to="/matches" className="hover:text-teal-400 transition-colors">
                  Compatible Roommates (3D Cards)
                </Link>
              </li>
              <li>
                <Link to="/onboarding" className="hover:text-teal-400 transition-colors">
                  Lifestyle Compatibility Quiz
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-teal-400 transition-colors">
                  Student Dashboard & Inquiries
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Safety & Trust */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Safety & Verification
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/safety" className="hover:text-teal-400 transition-colors flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                  <span>Student Safety Checklist</span>
                </Link>
              </li>
              <li>
                <Link to="/safety#red-flags" className="hover:text-teal-400 transition-colors">
                  Red-Flag Deposit Warning
                </Link>
              </li>
              <li>
                <Link to="/safety#report" className="hover:text-teal-400 transition-colors">
                  Report Suspicious Listing
                </Link>
              </li>
              <li>
                <span className="text-amber-400 text-[11px] block mt-1">
                  ⚠️ Never transfer security deposit before physical room inspection.
                </span>
              </li>
            </ul>
          </div>

          {/* Col 4: Community Mission */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Community Pledge
            </h4>
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-[11px] text-slate-300 space-y-1.5">
              <div className="flex items-center gap-1.5 text-teal-300 font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Zero Brokerage Forever</span>
              </div>
              <p className="text-slate-400 leading-normal">
                We believe shared living should be transparent and affordable. All listings are posted directly by verified tenants, students, or family property managers.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 Roommate.com. Built with care for better student & shared living.</p>
          <div className="flex items-center gap-4">
            <span>Community Driven</span>
            <span>•</span>
            <span>Zero Brokerage</span>
            <span>•</span>
            <span>OpenStreetMap</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
