import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  UserPlus,
  CheckSquare,
  History,
  BarChart3,
  Sparkles,
} from 'lucide-react';

export default function Sidebar() {
  const { isAdmin } = useAuth();

  const navItems = [
    { name: 'Dashboard', to: '/', icon: LayoutDashboard },
    { name: 'Students', to: '/students', icon: Users },
    { name: 'Courses & Faculty', to: '/courses', icon: BookOpen },
    { name: 'Enrollments', to: '/enrollments', icon: UserPlus },
    { name: 'Mark Attendance', to: '/take-attendance', icon: CheckSquare },
    { name: 'Attendance Records', to: '/attendance-history', icon: History },
    { name: 'MongoDB Analytics', to: '/analytics', icon: BarChart3, badge: '5 Aggregations' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Main Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <div className="flex items-center space-x-3">
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-400 text-amber-950 uppercase">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Review Information Card */}
      <div className="mt-6 p-3.5 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 text-xs">
        <div className="flex items-center space-x-1.5 text-indigo-700 font-bold mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>MongoDB Lab Project</span>
        </div>
        <p className="text-slate-600 leading-relaxed text-[11px]">
          Configured with 5 collections, compound unique indexes, and 5 backend aggregation pipelines.
        </p>
        <div className="mt-2.5 pt-2 border-t border-indigo-100/60 flex items-center justify-between text-[10px] text-slate-500 font-medium">
          <span>Compass Ready</span>
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        </div>
      </div>
    </aside>
  );
}
