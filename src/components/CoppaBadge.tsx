import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

/**
 * COPPA Compliance badge. Clickable pill that links to the privacy
 * policy where the parental consent flow and data handling are
 * documented. Used in the landing footer and all legal pages.
 *
 * Note: This is a self-declared compliance badge, not a third-party
 * Safe Harbor certification (kidSAFE, PRIVO, iKeepSafe). If Argo
 * Method obtains an official certification later, swap this component
 * for the certified program's official mark.
 */
export const CoppaBadge: React.FC<{ className?: string }> = ({ className = '' }) => (
    <Link
        to="/privacy"
        title="This platform complies with the Children's Online Privacy Protection Act"
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 transition-colors ${className}`}
    >
        <ShieldCheck className="w-3.5 h-3.5" />
        <span className="text-[11px] font-semibold tracking-wide">COPPA Compliant</span>
    </Link>
);
