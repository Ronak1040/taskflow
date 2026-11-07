import React from 'react';
import { Terminal, Shield, Cpu } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-200 bg-white py-6 dark:border-slate-800 dark:bg-slate-900 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-4">
        <div className="flex items-center space-x-2">
          <span>TaskFlow Architecture Foundation</span>
          <span>•</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">Production Ready</span>
        </div>

        <div className="flex items-center space-x-6">
          <span className="flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-slate-400" /> React 19 + Express
          </span>
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-slate-400" /> Strict TypeScript
          </span>
          <span className="flex items-center gap-1">
            <Terminal className="w-3.5 h-3.5 text-slate-400" /> REST API v1
          </span>
        </div>
      </div>
    </footer>
  );
};
