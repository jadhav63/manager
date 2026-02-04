
import React from 'react';
import { ViewType } from '../types';

interface NavbarProps {
  view: ViewType;
  setView: (v: ViewType) => void;
  onRefresh: () => void;
  loading: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ view, setView, onRefresh, loading }) => {
  return (
    <nav className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between shadow-lg">
      <div className="flex items-center space-x-4">
        <div className="bg-amber-500 text-slate-900 p-2 rounded-lg font-black text-xl italic tracking-tighter">
          TG
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight uppercase tracking-widest">Tombstone Grand</h1>
          <p className="text-[10px] uppercase text-slate-400 font-bold">Housekeeping Master v4.2</p>
        </div>
      </div>

      <div className="flex bg-slate-800 rounded-full p-1 border border-slate-700">
        <button
          onClick={() => setView('FRONT_DESK')}
          className={`px-6 py-1.5 rounded-full transition-all duration-200 text-sm font-bold uppercase tracking-wider ${
            view === 'FRONT_DESK' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          Front Desk
        </button>
        <button
          onClick={() => setView('HOUSEKEEPING')}
          className={`px-6 py-1.5 rounded-full transition-all duration-200 text-sm font-bold uppercase tracking-wider ${
            view === 'HOUSEKEEPING' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          Housekeeping
        </button>
      </div>

      <div className="flex items-center space-x-3">
        <button 
          onClick={onRefresh}
          disabled={loading}
          className="p-2.5 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 disabled:opacity-50 transition-colors"
          title="Refresh Data"
        >
          <i className={`fa-solid fa-rotate ${loading ? 'animate-spin' : ''}`}></i>
        </button>
        <div className="h-8 w-px bg-slate-700"></div>
        <div className="flex flex-col items-end">
          <span className="text-xs font-bold text-slate-300">ADMIN</span>
          <span className="text-[10px] text-green-400 font-mono">● LIVE</span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
