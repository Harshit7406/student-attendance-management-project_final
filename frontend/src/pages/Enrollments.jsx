import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import Alert from '../components/Alert';
import {
  UserPlus,
  Users,
  BookOpen,
  Trash2,
  CheckCircle2,
  Search,
  Filter,
  Layers,
  AlertTriangle,
} from 'lucide-react';

export default function Enrollments() {
  const { isAdmin } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Filters
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('');

  // Modals
  const [isSingleModalOpen, setIsSingleModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);

  // Form states
  const [singleForm, setSingleForm] = useState({ studentId: '', courseId: '' });
  const [bulkCourseId, setBulkCourseId] = useState('');
  const [selectedBulkStudents, setSelectedBulkStudents] = useState([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchEnrollments();
  }, [selectedCourseFilter]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [coursesRes, studentsRes] = await Promise.all([
        api.getCourses(),
        api.getStudents(),
      ]);
      if (coursesRes.success) {
        setCourses(coursesRes.data);
        if (coursesRes.data.length > 0) {
          setSingleForm((prev) => ({ ...prev, courseId: coursesRes.data[0]._id }));
          setBulkCourseId(coursesRes.data[0]._id);
        }
      }
      if (studentsRes.success) {
        setStudents(studentsRes.data);
        if (studentsRes.data.length > 0) {
          setSingleForm((prev) => ({ ...prev, studentId: studentsRes.data[0]._id }));
        }
      }
      await fetchEnrollments();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollments = async () => {
    try {
      const query = selectedCourseFilter ? `?courseId=${selectedCourseFilter}` : '';
      const res = await api.getEnrollments(query);
      if (res.success) {
        setEnrollments(res.data);
      }
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to load enrollments' });
    }
  };

  const handleSingleEnroll = async (e) => {
    e.preventDefault();
    try {
      const res = await api.enrollStudent(singleForm);
      if (res.success) {
        setAlert({ type: 'success', message: res.message || 'Student enrolled successfully' });
        setIsSingleModalOpen(false);
        fetchEnrollments();
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to enroll student' });
    }
  };

  const handleBulkEnroll = async (e) => {
    e.preventDefault();
    if (selectedBulkStudents.length === 0) {
      setAlert({ type: 'warning', message: 'Please select at least one student' });
      return;
    }

    try {
      const res = await api.bulkEnroll({
        courseId: bulkCourseId,
        studentIds: selectedBulkStudents,
      });
      if (res.success) {
        setAlert({ type: 'success', message: res.message });
        setIsBulkModalOpen(false);
        setSelectedBulkStudents([]);
        fetchEnrollments();
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Bulk enrollment failed' });
    }
  };

  const handleDropSubmit = async () => {
    try {
      const res = await api.dropEnrollment(selectedEnrollment._id);
      if (res.success) {
        setAlert({ type: 'success', message: 'Enrollment dropped successfully' });
        setIsDeleteModalOpen(false);
        fetchEnrollments();
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to remove enrollment' });
    }
  };

  const toggleBulkStudent = (studentId) => {
    if (selectedBulkStudents.includes(studentId)) {
      setSelectedBulkStudents(selectedBulkStudents.filter((id) => id !== studentId));
    } else {
      setSelectedBulkStudents([...selectedBulkStudents, studentId]);
    }
  };

  const selectAllStudents = () => {
    if (selectedBulkStudents.length === students.length) {
      setSelectedBulkStudents([]);
    } else {
      setSelectedBulkStudents(students.map((s) => s._id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Course Enrollments</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Student-Course associations enforced by MongoDB compound unique index `(student, course)`
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsBulkModalOpen(true)}
              className="inline-flex items-center space-x-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold px-3.5 py-2.5 rounded-xl text-xs transition-all border border-indigo-200"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Bulk Enroll</span>
            </button>
            <button
              onClick={() => setIsSingleModalOpen(true)}
              className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition-all shadow-md shadow-indigo-100"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Enroll Student</span>
            </button>
          </div>
        )}
      </div>

      <Alert type={alert.type} message={alert.message} onClose={() => setAlert({ type: '', message: '' })} />

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-600">Filter by Course:</span>
          <select
            value={selectedCourseFilter}
            onChange={(e) => setSelectedCourseFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Courses ({courses.length})</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="text-xs font-medium text-slate-500">
          Showing <strong className="text-slate-800">{enrollments.length}</strong> active enrollments
        </div>
      </div>

      {/* Enrollments Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Course</th>
                <th className="py-3.5 px-4">Faculty In-Charge</th>
                <th className="py-3.5 px-4">Enrolled Date</th>
                <th className="py-3.5 px-4">Status</th>
                {isAdmin && <th className="py-3.5 px-4 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    Loading enrollments...
                  </td>
                </tr>
              ) : enrollments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    No enrollments found for this filter.
                  </td>
                </tr>
              ) : (
                enrollments.map((enr) => (
                  <tr key={enr._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{enr.student?.name}</div>
                      <div className="text-[10px] text-indigo-600 font-mono font-semibold">
                        {enr.student?.studentId}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[10px] mr-2">
                        {enr.course?.code}
                      </span>
                      <span className="font-semibold text-slate-800">{enr.course?.name}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {enr.course?.faculty?.name || 'Unassigned'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {new Date(enr.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {enr.status}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedEnrollment(enr);
                            setIsDeleteModalOpen(true);
                          }}
                          title="Drop Enrollment"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Single Enroll Modal */}
      <Modal
        isOpen={isSingleModalOpen}
        onClose={() => setIsSingleModalOpen(false)}
        title="Enroll Student in Course"
      >
        <form onSubmit={handleSingleEnroll} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Select Course *</label>
            <select
              required
              value={singleForm.courseId}
              onChange={(e) => setSingleForm({ ...singleForm, courseId: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500"
            >
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">Select Student *</label>
            <select
              required
              value={singleForm.studentId}
              onChange={(e) => setSingleForm({ ...singleForm, studentId: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500"
            >
              {students.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.studentId} — {s.name} ({s.department})
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 bg-amber-50 text-amber-800 rounded-xl text-[11px] border border-amber-200 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>MongoDB uniqueness rule: Duplicate enrollment for the same student and course is rejected.</span>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsSingleModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
            >
              Enroll Student
            </button>
          </div>
        </form>
      </Modal>

      {/* Bulk Enroll Modal */}
      <Modal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="Batch Enroll Multiple Students"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleBulkEnroll} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Select Target Course *</label>
            <select
              required
              value={bulkCourseId}
              onChange={(e) => setBulkCourseId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500"
            >
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="font-semibold text-slate-700">
              Select Students ({selectedBulkStudents.length} of {students.length} chosen)
            </span>
            <button
              type="button"
              onClick={selectAllStudents}
              className="text-xs font-bold text-indigo-600 hover:underline"
            >
              {selectedBulkStudents.length === students.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 p-2 space-y-1">
            {students.map((s) => (
              <label
                key={s._id}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedBulkStudents.includes(s._id)}
                  onChange={() => toggleBulkStudent(s._id)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <span className="font-mono font-bold text-indigo-700 w-24">{s.studentId}</span>
                <span className="font-semibold text-slate-800 flex-1">{s.name}</span>
                <span className="text-[10px] text-slate-400">Sec {s.section}</span>
              </label>
            ))}
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsBulkModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
            >
              Enroll {selectedBulkStudents.length} Students
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete/Drop Enrollment Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Drop Enrollment"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-3 text-rose-800">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Drop enrollment?</div>
              <p className="mt-1 text-[11px] text-rose-700">
                Are you sure you want to drop <strong>{selectedEnrollment?.student?.name}</strong> from{' '}
                <strong>{selectedEnrollment?.course?.code}</strong>?
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
              onClick={handleDropSubmit}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium"
            >
              Confirm Drop
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
