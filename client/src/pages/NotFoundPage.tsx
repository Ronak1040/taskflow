import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';
import { Button } from '../components/common/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 mb-6">
        <HelpCircle className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">404</h1>
      <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mt-2">Page Not Found</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-2 mb-6">
        The route you requested could not be located in the TaskFlow application routing map.
      </p>
      <Link to="/">
        <Button leftIcon={<ArrowLeft className="w-4 h-4" />}>Return to Home</Button>
      </Link>
    </div>
  );
};
