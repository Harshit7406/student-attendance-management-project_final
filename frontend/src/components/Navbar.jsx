import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, UserCircle, Database, ShieldCheck, UserCheck } from 'lucide-react';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo / Project Name */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-900 tracking-tight text-lg">SmartAttendance</span>
                <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-full border border-indigo-200">
                  BCSE302P
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Database Systems Lab Review 3</p>
            </div>
          </div>

          {/* User info & Logout */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              {isAdmin ? (
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              ) : (
                <UserCheck className="w-4 h-4 text-indigo-600" />
              )}
              <div className="text-left">
                <div className="text-xs font-semibold text-slate-800 leading-tight">{user?.name}</div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                  {user?.role} • {user?.department?.split(' ')[0] || 'VIT'}
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              title="Logout"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-200"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
