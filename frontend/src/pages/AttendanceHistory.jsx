import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import Alert from '../components/Alert';
import {
  History,
  Download,
  Filter,
  Edit2,
  Trash2,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
} from 'lucide-react';

export default function AttendanceHistory() {
  const { isAdmin, isFaculty } = useAuth();
  const [records, setRecords] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Filter states
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Edit / Delete Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [editForm, setEditForm] = useState({ status: 'Present', remarks: '' });

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [selectedCourse, selectedStatus, startDate, endDate]);

  const fetchCourses = async () => {
    try {
      const res = await api.getCourses();
      if (res.success) setCourses(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCourse) params.append('courseId', selectedCourse);
      if (selectedStatus) params.append('status', selectedStatus);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await api.getAttendanceHistory(`?${params.toString()}`);
      if (res.success) {
        setRecords(res.data);
      }
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to fetch attendance history' });
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCourse) params.append('courseId', selectedCourse);
      if (selectedStatus) params.append('status', selectedStatus);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      await api.exportCSV(`?${params.toString()}`);
      setAlert({ type: 'success', message: 'Attendance report exported successfully as CSV' });
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to export CSV report' });
    }
  };

  const openEditModal = (rec) => {
    setSelectedRecord(rec);
    setEditForm({
      status: rec.status,
      remarks: rec.remarks || '',
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.updateAttendance(selectedRecord._id, editForm);
      if (res.success) {
        setAlert({ type: 'success', message: 'Attendance record corrected successfully' });
        setIsEditModalOpen(false);
        fetchHistory();
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to update record' });
    }
  };

  const handleDeleteSubmit = async () => {
    try {
      const res = await api.deleteAttendance(selectedRecord._id);
      if (res.success) {
        setAlert({ type: 'success', message: 'Attendance entry removed' });
        setIsDeleteModalOpen(false);
        fetchHistory();
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to delete record' });
    }
  };

  const clearFilters = () => {
    setSelectedCourse('');
    setSelectedStatus('');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Attendance Records & History</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit trail of attendance entries, corrections, and CSV reporting
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition-all shadow-md shadow-emerald-100"
        >
          <Download className="w-4 h-4" />
          <span>Export Filtered CSV</span>
        </button>
      </div>

      <Alert type={alert.type} message={alert.message} onClose={() => setAlert({ type: '', message: '' })} />

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
            <Filter className="w-3.5 h-3.5 text-indigo-600" />
            <span>Filter Search Criteria</span>
          </div>
          {(selectedCourse || selectedStatus || startDate || endDate) && (
            <button
              onClick={clearFilters}
              className="text-xs font-semibold text-rose-600 hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Course</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white"
            >
              <option value="">All Courses</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="Present">Present</option>
              <option value="Late">Late</option>
              <option value="Absent">Absent</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700"
            />
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Student ID</th>
                <th className="py-3.5 px-4">Student Name</th>
                <th className="py-3.5 px-4">Course</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Faculty Recorded</th>
                <th className="py-3.5 px-4">Remarks</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-14 text-center text-slate-400">
                    Loading attendance history...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-14 text-center text-slate-400">
                    No attendance records match the selected filters.
                  </td>
                </tr>
              ) : (
                records.map((rec) => (
                  <tr key={rec._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-700 whitespace-nowrap">
                      {new Date(rec.date).toISOString().split('T')[0]}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                      {rec.student?.studentId}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {rec.student?.name}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800">{rec.course?.code}</span>
                      <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                        {rec.course?.name}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
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
                    <td className="py-3 px-4 text-slate-600 text-[11px]">
                      {rec.faculty?.name || 'Faculty'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px] max-w-xs truncate">
                      {rec.remarks || '—'}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => openEditModal(rec)}
                        title="Edit / Correct Attendance"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRecord(rec);
                          setIsDeleteModalOpen(true);
                        }}
                        title="Delete Record"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Record Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Correct Attendance Record"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px]">Student: </span>
              <strong className="text-slate-800">{selectedRecord?.student?.name} ({selectedRecord?.student?.studentId})</strong>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px]">Course: </span>
              <span className="text-slate-700">{selectedRecord?.course?.code} — {selectedRecord?.course?.name}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px]">Date: </span>
              <span className="text-slate-700">{selectedRecord?.date ? new Date(selectedRecord.date).toDateString() : ''}</span>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">Attendance Status *</label>
            <div className="grid grid-cols-3 gap-2">
              {['Present', 'Late', 'Absent'].map((stat) => (
                <button
                  key={stat}
                  type="button"
                  onClick={() => setEditForm({ ...editForm, status: stat })}
                  className={`py-2 rounded-xl font-bold text-xs border transition-all ${
                    editForm.status === stat
                      ? stat === 'Present'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : stat === 'Late'
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-rose-600 text-white border-rose-600'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {stat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">Remarks / Justification</label>
            <input
              type="text"
              value={editForm.remarks}
              onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
              placeholder="e.g. Corrected based on OD certificate approval"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-md shadow-indigo-100"
            >
              Save Correction
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Record Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Record Deletion"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-3 text-rose-800">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Delete this attendance entry?</div>
              <p className="mt-1 text-[11px] text-rose-700">
                Are you sure you want to remove the attendance entry for{' '}
                <strong>{selectedRecord?.student?.name}</strong> on{' '}
                <strong>{selectedRecord?.date ? new Date(selectedRecord.date).toISOString().split('T')[0] : ''}</strong>?
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteSubmit}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
