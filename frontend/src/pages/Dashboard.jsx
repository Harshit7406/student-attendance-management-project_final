import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import StatCard from '../components/StatCard';
import {
  Users,
  BookOpen,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Calendar,
  Clock,
  Download,
  CheckSquare,
} from 'lucide-react';

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [defaulters, setDefaulters] = useState([]);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [overviewRes, defaultersRes, historyRes] = await Promise.all([
        api.getOverview(),
        api.getDefaulters(75),
        api.getAttendanceHistory('?limit=8'),
      ]);

      if (overviewRes.success) setStats(overviewRes.data);
      if (defaultersRes.success) setDefaulters(defaultersRes.data);
      if (historyRes.success) setRecentAttendance(historyRes.data.slice(0, 8));
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-indigo-200 bg-indigo-900/40 px-3 py-1 rounded-full border border-indigo-400/30">
            Welcome Back
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2">
            {user?.name}
          </h1>
          <p className="text-indigo-100 text-sm mt-1 max-w-xl">
            {isAdmin
              ? 'Administrator Overview: Monitor student cohorts, manage faculties, inspect attendance metrics and MongoDB aggregation analytics.'
              : `Faculty Portal: Manage attendance for your courses, inspect student rosters, and flag attendance defaulters.`}
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link
            to="/take-attendance"
            className="inline-flex items-center space-x-2 bg-white text-indigo-700 hover:bg-indigo-50 font-semibold px-4 py-2.5 rounded-xl text-sm transition-all shadow-md"
          >
            <CheckSquare className="w-4 h-4" />
            <span>Mark Attendance</span>
          </Link>
          <button
            onClick={() => api.exportCSV()}
            className="inline-flex items-center space-x-2 bg-indigo-500/30 hover:bg-indigo-500/50 text-white font-medium px-4 py-2.5 rounded-xl text-sm border border-indigo-300/30 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Students"
          value={stats?.totalStudents || 0}
          subtitle="Enrolled across CSE / IT"
          icon={Users}
          color="indigo"
        />
        <StatCard
          title="Active Courses"
          value={stats?.totalCourses || 0}
          subtitle="Semester 5 courses"
          icon={BookOpen}
          color="purple"
        />
        <StatCard
          title="Overall Attendance"
          value={`${stats?.systemAttendanceRate || 0}%`}
          subtitle="Aggregated system average"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Defaulters (<75%)"
          value={defaulters.length}
          subtitle="Require attendance warning"
          icon={AlertTriangle}
          color={defaulters.length > 0 ? 'rose' : 'emerald'}
        />
      </div>

      {/* Defaulter Alert Card if any */}
      {defaulters.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2 text-rose-800 font-bold text-sm">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Low Attendance Alert — {defaulters.length} Students Below 75% Threshold</span>
            </div>
            <Link
              to="/analytics"
              className="text-xs font-semibold text-rose-700 hover:text-rose-900 flex items-center space-x-1"
            >
              <span>View MongoDB Pipeline Report</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {defaulters.slice(0, 3).map((d) => (
              <div
                key={d._id}
                className="bg-white p-3.5 rounded-xl border border-rose-100 flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-slate-800 text-xs">{d.name}</div>
                  <div className="text-[11px] text-slate-500">{d.studentCode} • Sec {d.section}</div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-rose-600">{d.percentage}%</span>
                  <div className="text-[10px] text-rose-500 font-medium">-{d.shortfall}% shortfall</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid: Recent Attendance & Quick Action Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Attendance Activity */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Attendance Records</h2>
              <p className="text-xs text-slate-500">Live feed from the attendance collection</p>
            </div>
            <Link
              to="/attendance-history"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-semibold border-y border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Student</th>
                  <th className="py-2.5 px-3">Course</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentAttendance.map((rec) => (
                  <tr key={rec._id} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-3 text-slate-600 font-medium whitespace-nowrap">
                      {new Date(rec.date).toISOString().split('T')[0]}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-800">{rec.student?.name}</div>
                      <div className="text-[10px] text-slate-500">{rec.student?.studentId}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-medium text-slate-700">{rec.course?.code}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          rec.status === 'Present'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : rec.status === 'Late'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 text-[11px] max-w-xs truncate">
                      {rec.remarks || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Review Details Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Lab Review 3 Info</h2>
            <p className="text-xs text-slate-500">BCSE302P Database Systems Lab</p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400">Database Engine</span>
              <div className="font-semibold text-slate-800 mt-0.5">MongoDB 9.0 (Compass Ready)</div>
              <p className="text-[11px] text-slate-500 mt-0.5">Port 27017 • student_attendance_db</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400">Collections (5 Total)</span>
              <div className="font-semibold text-slate-800 mt-0.5">users, students, courses, enrollments, attendance</div>
              <p className="text-[11px] text-slate-500 mt-0.5">Guaranteed compound unique constraints</p>
            </div>

            <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100">
              <span className="text-[10px] uppercase font-bold text-indigo-500">Aggregation Queries</span>
              <div className="font-semibold text-indigo-900 mt-0.5">5 MongoDB Aggregation Pipelines</div>
              <p className="text-[11px] text-indigo-700/80 mt-0.5">
                $group, $lookup, $unwind, $project, $match, and conditional math accumulators.
              </p>
              <Link
                to="/analytics"
                className="mt-2 inline-flex items-center space-x-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
              >
                <span>Open Aggregation Explorer</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
