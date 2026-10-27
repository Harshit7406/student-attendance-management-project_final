import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Alert from '../components/Alert';
import {
  CheckSquare,
  Calendar,
  BookOpen,
  CheckCircle2,
  Clock,
  XCircle,
  Save,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export default function TakeAttendance() {
  const { user, isFaculty } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [sheetData, setSheetData] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse && selectedDate) {
      loadAttendanceSheet();
    }
  }, [selectedCourse, selectedDate]);

  const fetchCourses = async () => {
    try {
      // If faculty, show assigned courses first
      const query = isFaculty ? '?assignedOnly=true' : '';
      let res = await api.getCourses(query);
      if (res.success && res.data.length > 0) {
        setCourses(res.data);
        setSelectedCourse(res.data[0]._id);
      } else if (isFaculty) {
        // Fallback to all if none assigned directly
        res = await api.getCourses();
        if (res.success && res.data.length > 0) {
          setCourses(res.data);
          setSelectedCourse(res.data[0]._id);
        }
      }
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to load courses' });
    }
  };

  const loadAttendanceSheet = async () => {
    try {
      setLoading(true);
      setAlert({ type: '', message: '' });
      const res = await api.getAttendanceSheet(selectedCourse, selectedDate);
      if (res.success) {
        setSheetData(res.data);
        setRecords(res.data.records);
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to fetch attendance sheet' });
      setSheetData(null);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (index, status) => {
    const updated = [...records];
    updated[index].status = status;
    setRecords(updated);
  };

  const handleRemarksChange = (index, remarks) => {
    const updated = [...records];
    updated[index].remarks = remarks;
    setRecords(updated);
  };

  const markAll = (status) => {
    const updated = records.map((r) => ({ ...r, status }));
    setRecords(updated);
  };

  const handleSaveAttendance = async () => {
    if (records.length === 0) {
      setAlert({ type: 'warning', message: 'No student records to save' });
      return;
    }

    try {
      setSaving(true);
      const payload = {
        courseId: selectedCourse,
        date: selectedDate,
        records: records.map((r) => ({
          studentId: r.studentId,
          status: r.status,
          remarks: r.remarks || '',
        })),
      };

      const res = await api.recordBatchAttendance(payload);
      if (res.success) {
        setAlert({
          type: 'success',
          message: res.message || 'Attendance saved successfully to MongoDB!',
        });
        loadAttendanceSheet();
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to save attendance' });
    } finally {
      setSaving(false);
    }
  };

  // Counts
  const presentCount = records.filter((r) => r.status === 'Present').length;
  const lateCount = records.filter((r) => r.status === 'Late').length;
  const absentCount = records.filter((r) => r.status === 'Absent').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mark Student Attendance</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Select course and lecture date to record or update attendance roster
          </p>
        </div>

        {records.length > 0 && (
          <button
            onClick={handleSaveAttendance}
            disabled={saving}
            className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all shadow-md shadow-indigo-100 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving to Database...' : 'Save Attendance Session'}</span>
          </button>
        )}
      </div>

      <Alert type={alert.type} message={alert.message} onClose={() => setAlert({ type: '', message: '' })} />

      {/* Course & Date Selector Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 w-full md:w-auto">
          {/* Course select */}
          <div className="w-full sm:w-auto">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Select Course
            </label>
            <div className="relative">
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full sm:w-64 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date Picker */}
          <div className="w-full sm:w-auto">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Lecture Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full sm:w-auto px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Status Pills */}
        {sheetData && (
          <div className="flex items-center space-x-2 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 text-xs">
            <span className="font-semibold text-slate-600 mr-2">Live Session:</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
              Present: {presentCount}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-200">
              Late: {lateCount}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200">
              Absent: {absentCount}
            </span>
          </div>
        )}
      </div>

      {/* Quick Mark Toolbar */}
      {records.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-indigo-50/60 p-3 rounded-2xl border border-indigo-100">
          <div className="flex items-center space-x-2 text-xs font-medium text-indigo-900">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>
              {sheetData?.alreadyRecorded ? (
                <strong className="text-amber-800">
                  Editing recorded attendance for {new Date(selectedDate).toDateString()}
                </strong>
              ) : (
                <span>Recording fresh attendance session for {new Date(selectedDate).toDateString()}</span>
              )}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => markAll('Present')}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-all"
            >
              Mark All Present
            </button>
            <button
              onClick={() => markAll('Absent')}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-sm transition-all"
            >
              Mark All Absent
            </button>
          </div>
        </div>
      )}

      {/* Roster Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">#</th>
                <th className="py-3.5 px-4">Student ID</th>
                <th className="py-3.5 px-4">Student Name</th>
                <th className="py-3.5 px-4">Attendance Status</th>
                <th className="py-3.5 px-4">Remarks (Optional)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-16 text-center text-slate-400">
                    Loading student roster...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-16 text-center text-slate-400">
                    No students currently enrolled in this course. Please enroll students first!
                  </td>
                </tr>
              ) : (
                records.map((rec, index) => (
                  <tr key={rec.studentId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{index + 1}</td>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">{rec.registrationNo}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      <div>{rec.name}</div>
                      <div className="text-[10px] text-slate-400">Sec {rec.section} • {rec.email}</div>
                    </td>

                    {/* Status Toggles */}
                    <td className="py-3 px-4">
                      <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200/70 space-x-1">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(index, 'Present')}
                          className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center space-x-1 ${
                            rec.status === 'Present'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Present</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(index, 'Late')}
                          className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center space-x-1 ${
                            rec.status === 'Late'
                              ? 'bg-amber-500 text-white shadow-sm'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Late</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(index, 'Absent')}
                          className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center space-x-1 ${
                            rec.status === 'Absent'
                              ? 'bg-rose-600 text-white shadow-sm'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Absent</span>
                        </button>
                      </div>
                    </td>

                    {/* Remarks Input */}
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        placeholder="e.g. OD, medical leave, late by 10 mins..."
                        value={rec.remarks || ''}
                        onChange={(e) => handleRemarksChange(index, e.target.value)}
                        className="w-full max-w-xs px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
