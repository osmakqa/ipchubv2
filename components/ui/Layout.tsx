
import React, { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 md:px-8 py-10">
        {title && (
          <div className="mb-10 animate-in fade-in slide-in-from-left-4 duration-500">
            <h2 className="text-4xl font-black text-[#0f172a] tracking-tighter uppercase">{title}</h2>
            <div className="h-1.5 w-20 bg-primary mt-3 rounded-full"></div>
          </div>
        )}
        <div className="animate-in fade-in duration-700">
          {children}
        </div>
      </main>
      <footer className="border-t border-slate-200 bg-white/50 py-8 text-center backdrop-blur-sm">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
          © {new Date().getFullYear()} Ospital ng Makati • IPC Committee
        </p>
      </footer>
    </div>
  );
};

export default Layout;
