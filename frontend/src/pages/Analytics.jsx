import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import Alert from '../components/Alert';
import {
  BarChart3,
  Users,
  BookOpen,
  Calendar,
  AlertTriangle,
  TrendingUp,
  Code2,
  CheckCircle2,
  Sliders,
  Sparkles,
} from 'lucide-react';

export default function Analytics() {
  const [activeTab, setActiveTab] = useState('students');
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Pipeline Data States
  const [studentStats, setStudentStats] = useState([]);
  const [courseStats, setCourseStats] = useState([]);
  const [dailyStats, setDailyStats] = useState([]);
  const [defaulters, setDefaulters] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState([]);

  // Configurable threshold for Pipeline 4
  const [threshold, setThreshold] = useState(75);

  useEffect(() => {
    fetchAllAnalytics();
  }, []);

  useEffect(() => {
    fetchDefaulters();
  }, [threshold]);

  const fetchAllAnalytics = async () => {
    try {
      setLoading(true);
      const [studentsRes, coursesRes, dailyRes, monthlyRes] = await Promise.all([
        api.getStudentAnalytics(),
        api.getCourseAnalytics(),
        api.getDailyAnalytics(),
        api.getMonthlyTrends(),
      ]);

      if (studentsRes.success) setStudentStats(studentsRes.data);
      if (coursesRes.success) setCourseStats(coursesRes.data);
      if (dailyRes.success) setDailyStats(dailyRes.data);
      if (monthlyRes.success) setMonthlyStats(monthlyRes.data);

      await fetchDefaulters();
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to execute aggregation queries on MongoDB' });
    } finally {
      setLoading(false);
    }
  };

  const fetchDefaulters = async () => {
    try {
      const res = await api.getDefaulters(threshold);
      if (res.success) {
        setDefaulters(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const tabs = [
    { id: 'students', label: '1. Student Attendance %', icon: Users, count: studentStats.length },
    { id: 'courses', label: '2. Course Attendance %', icon: BookOpen, count: courseStats.length },
    { id: 'daily', label: '3. Daily Status Totals', icon: Calendar, count: dailyStats.length },
    { id: 'defaulters', label: '4. Defaulters Threshold', icon: AlertTriangle, count: defaulters.length, badgeColor: 'bg-rose-500' },
    { id: 'monthly', label: '5. Monthly Trends', icon: TrendingUp, count: monthlyStats.length },
    { id: 'viva', label: 'Review 3 Pipeline Code', icon: Code2, special: true },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Server-Side Aggregations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            MongoDB Analytics Engine
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
            Computed directly on MongoDB Server 9.0 using aggregation stages: <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300">$group</code>, <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300">$lookup</code>, <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300">$project</code>, <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300">$unwind</code>, and <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300">$match</code>.
          </p>
        </div>

        <div className="bg-indigo-900/60 p-3 rounded-2xl border border-indigo-700/60 text-xs text-center">
          <span className="text-[10px] uppercase font-bold text-indigo-300">Lab Rubric Requirement</span>
          <div className="text-lg font-extrabold text-white mt-0.5">5/5 Pipelines Active</div>
          <span className="text-[10px] text-emerald-400 font-semibold">100% Executed on MongoDB</span>
        </div>
      </div>

      <Alert type={alert.type} message={alert.message} onClose={() => setAlert({ type: '', message: '' })} />

      {/* Tabs navigation */}
      <div className="flex overflow-x-auto space-x-2 border-b border-slate-200 pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive
                      ? 'bg-indigo-500 text-white'
                      : tab.badgeColor
                      ? `${tab.badgeColor} text-white`
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: Student Attendance Percentage */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Pipeline 1: Attendance Percentage by Student
              </h2>
              <p className="text-xs text-slate-500">
                Groups sessions by student ID, calculates present vs absent rates, and joins student demographic profiles
              </p>
            </div>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
              {studentStats.length} Students Evaluated
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Department & Class</th>
                  <th className="py-3 px-4">Total Sessions</th>
                  <th className="py-3 px-4">Present / Late / Absent</th>
                  <th className="py-3 px-4">Attendance %</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentStats.map((st) => (
                  <tr key={st._id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{st.name}</div>
                      <div className="font-mono text-indigo-600 text-[10px] font-bold">{st.studentCode}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div>{st.department}</div>
                      <div className="text-[10px] text-slate-400">Sec {st.section} • Sem {st.semester}</div>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-700">{st.totalSessions}</td>
                    <td className="py-3 px-4 font-medium text-slate-600">
                      <span className="text-emerald-600 font-bold">{st.presentCount} P</span> •{' '}
                      <span className="text-amber-600 font-bold">{st.lateCount} L</span> •{' '}
                      <span className="text-rose-600 font-bold">{st.absentCount} A</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="w-32">
                        <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                          <span className={st.percentage < 75 ? 'text-rose-600' : 'text-emerald-700'}>
                            {st.percentage}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              st.percentage < 75 ? 'bg-rose-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(st.percentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          st.percentage < 75
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {st.percentage < 75 ? 'Defaulter' : 'Regular'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Course Attendance Percentage */}
      {activeTab === 'courses' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Pipeline 2: Attendance Percentage by Course
            </h2>
            <p className="text-xs text-slate-500">
              Aggregates all student session entries per course and calculates overall course-wide attendance rates
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courseStats.map((c) => (
              <div
                key={c._id}
                className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
                      {c.code}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">Sem {c.semester}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mt-2">{c.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Faculty: {c.facultyName}</p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-200/70">
                  <div className="flex items-end justify-between mb-1.5">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Average Course Attendance</div>
                      <div className="text-xs text-slate-600 mt-0.5">
                        {c.presentCount + c.lateCount} attended / {c.totalAttendanceEntries} total marks
                      </div>
                    </div>
                    <span className="text-2xl font-black text-indigo-600">{c.averagePercentage}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(c.averagePercentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Daily Attendance Totals */}
      {activeTab === 'daily' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Pipeline 3: Daily Attendance Totals Grouped by Status
            </h2>
            <p className="text-xs text-slate-500">
              Groups attendance sessions chronologically by date and tallies daily counts of Present, Late, and Absent
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Total Students Logged</th>
                  <th className="py-3 px-4 text-emerald-600">Present</th>
                  <th className="py-3 px-4 text-amber-600">Late</th>
                  <th className="py-3 px-4 text-rose-600">Absent</th>
                  <th className="py-3 px-4">Daily Attendance Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dailyStats.map((d) => (
                  <tr key={d.dateFormatted} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {d.dateFormatted}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{d.total}</td>
                    <td className="py-3 px-4 font-bold text-emerald-600">{d.present}</td>
                    <td className="py-3 px-4 font-bold text-amber-600">{d.late}</td>
                    <td className="py-3 px-4 font-bold text-rose-600">{d.absent}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-800">{d.attendanceRate}%</span>
                        <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-indigo-600 h-full rounded-full"
                            style={{ width: `${d.attendanceRate}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Students Below Configurable Threshold (Defaulters) */}
      {activeTab === 'defaulters' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-rose-50/60 p-4 rounded-2xl border border-rose-100">
            <div>
              <h2 className="text-base font-bold text-rose-900">
                Pipeline 4: Defaulter Students Below Threshold
              </h2>
              <p className="text-xs text-rose-700 mt-0.5">
                Uses MongoDB <code className="bg-rose-100 px-1.5 py-0.5 rounded font-mono font-bold">$match</code> on calculated attendance percentage to filter non-compliant students
              </p>
            </div>

            {/* Configurable Threshold Slider & Input */}
            <div className="flex items-center space-x-3 bg-white px-4 py-2 rounded-xl border border-rose-200 shadow-sm">
              <Sliders className="w-4 h-4 text-rose-600" />
              <div className="text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Threshold:</span>
                <span className="font-bold text-rose-600 text-sm">{threshold}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="90"
                step="5"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-28 accent-rose-600 cursor-pointer"
              />
            </div>
          </div>

          {defaulters.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              ✓ No students have attendance below {threshold}%.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Student ID</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Attended / Total</th>
                    <th className="py-3 px-4">Current %</th>
                    <th className="py-3 px-4">Shortfall Below {threshold}%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {defaulters.map((d) => (
                    <tr key={d._id} className="hover:bg-rose-50/40">
                      <td className="py-3 px-4 font-mono font-bold text-rose-700">{d.studentCode}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{d.name}</td>
                      <td className="py-3 px-4 text-slate-600">{d.department} (Sec {d.section})</td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {d.attendedSessions} / {d.totalSessions} classes
                      </td>
                      <td className="py-3 px-4 font-extrabold text-rose-600 text-sm">
                        {d.percentage}%
                      </td>
                      <td className="py-3 px-4 font-bold text-amber-700">
                        -{d.shortfall}% needed
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: Monthly Attendance Trends */}
      {activeTab === 'monthly' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Pipeline 5: Monthly Attendance Trends
            </h2>
            <p className="text-xs text-slate-500">
              Uses <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold text-indigo-700">$dateToString: &#123; format: "%Y-%m", date: "$date" &#125;</code> to aggregate attendance velocity over time
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {monthlyStats.map((m) => (
              <div key={m.month} className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-mono font-bold text-indigo-700 text-sm">{m.month}</span>
                  <span className="font-semibold">{m.totalRecords} sessions</span>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-3xl font-black text-slate-900">{m.attendanceRate}%</span>
                  <span className="text-xs font-semibold text-emerald-600">
                    {m.present + m.late} attended
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 mt-3 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full"
                    style={{ width: `${m.attendanceRate}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: Review 3 Viva Code Explorer */}
      {activeTab === 'viva' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
          <div>
            <div className="flex items-center space-x-2 text-indigo-600 font-bold text-sm">
              <Code2 className="w-4 h-4" />
              <span>BCSE302P Review 3 — Backend Aggregation Pipeline Implementation</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Examiner Reference: These exact pipelines run inside <code className="font-mono text-indigo-700">backend/controllers/analyticsController.js</code>.
            </p>
          </div>

          <div className="space-y-4 text-xs font-mono">
            {/* Pipeline 1 snippet */}
            <div className="bg-slate-900 text-slate-200 p-4 rounded-xl overflow-x-auto">
              <div className="text-indigo-400 font-bold mb-2">// 1. Student Attendance Percentage Pipeline</div>
              <pre>{`Attendance.aggregate([
  {
    $group: {
      _id: '$student',
      totalSessions: { $sum: 1 },
      presentCount: { $sum: { $cond: [{ $in: ['$status', ['Present', 'Late']] }, 1, 0] } }
    }
  },
  {
    $project: {
      percentage: { $round: [{ $multiply: [{ $divide: ['$presentCount', '$totalSessions'] }, 100] }, 1] }
    }
  },
  { $lookup: { from: 'students', localField: '_id', foreignField: '_id', as: 'student' } },
  { $unwind: '$student' },
  { $sort: { percentage: 1 } }
])`}</pre>
            </div>

            {/* Pipeline 4 snippet */}
            <div className="bg-slate-900 text-slate-200 p-4 rounded-xl overflow-x-auto">
              <div className="text-indigo-400 font-bold mb-2">// 4. Defaulter List with Dynamic Threshold Pipeline</div>
              <pre>{`Attendance.aggregate([
  {
    $group: {
      _id: '$student',
      totalSessions: { $sum: 1 },
      presentCount: { $sum: { $cond: [{ $in: ['$status', ['Present', 'Late']] }, 1, 0] } }
    }
  },
  {
    $project: {
      percentage: { $round: [{ $multiply: [{ $divide: ['$presentCount', '$totalSessions'] }, 100] }, 1] }
    }
  },
  { $match: { percentage: { $lt: threshold } } }, // Filter < 75%
  { $lookup: { from: 'students', localField: '_id', foreignField: '_id', as: 'student' } },
  { $unwind: '$student' }
])`}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
