
import React from 'react';
import { Scan } from 'lucide-react';
import { APP_VERSION } from '../../lib/version';

interface LayoutProps {
    children: React.ReactNode;
}

export const AppLayout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen bg-argo-neutral text-argo-navy font-sans relative overflow-x-hidden selection:bg-argo-indigo selection:text-white">

            {/* Background ambient effects - Subtle Neutral Style */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-argo-indigo/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-argo-navy/5 rounded-full blur-[120px]" />
            </div>

            {/* Content */}
            <div className="relative z-10 w-full max-w-5xl mx-auto min-h-screen flex flex-col border-x border-argo-border bg-white shadow-[0_0_50px_rgba(26,28,46,0.05)] transition-[max-width] duration-500">

                {/* Header: Design System v2.0 */}
                <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-argo-border px-8 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-argo-sm bg-argo-navy flex items-center justify-center text-white shadow-sm">
                            <Scan size={20} strokeWidth={2.5} />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="font-display font-bold text-lg tracking-tight leading-none text-argo-navy uppercase">ARGO <span className="text-argo-indigo">METHOD</span></h1>
                            <span className="text-[9px] font-bold text-argo-grey tracking-[0.2em] uppercase mt-0.5">Architecture of Tune</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex gap-1.5 items-center">
                            <span className="text-[10px] font-bold text-argo-grey uppercase tracking-widest">System Status</span>
                            <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-8 flex flex-col gap-10 pb-24">
                    {children}
                </main>

                {/* Footer: Professional Authority */}
                <footer className="border-t border-argo-border py-6 px-8 flex justify-between items-center bg-gray-50/50">
                    <span className="text-[10px] text-argo-grey font-bold uppercase tracking-widest">Protocol v{APP_VERSION} • Allied Observer</span>
                    <span className="text-[10px] text-argo-grey font-medium uppercase tracking-widest">© 2026 ARGO PROJECT</span>
                </footer>
            </div>
        </div>
    );
};
