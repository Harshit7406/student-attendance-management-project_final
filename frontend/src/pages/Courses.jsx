import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import Alert from '../components/Alert';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Users,
  UserCheck,
  Award,
  Layers,
  AlertTriangle,
} from 'lucide-react';

export default function Courses() {
  const { user, isAdmin, isFaculty } = useAuth();
  const [courses, setCourses] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [assignedOnly, setAssignedOnly] = useState(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);

  // Selected course & data
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseRoster, setCourseRoster] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    department: 'Computer Science & Engineering',
    semester: 5,
    credits: 3,
    faculty: '',
    description: '',
  });

  useEffect(() => {
    fetchCourses();
    fetchFacultyUsers();
  }, [assignedOnly]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const query = assignedOnly ? '?assignedOnly=true' : '';
      const res = await api.getCourses(query);
      if (res.success) {
        setCourses(res.data);
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to fetch courses' });
    } finally {
      setLoading(false);
    }
  };

  const fetchFacultyUsers = async () => {
    try {
      const res = await api.getUsers('?role=faculty');
      if (res.success) {
        setFacultyList(res.data);
        if (res.data.length > 0 && !formData.faculty) {
          setFormData((prev) => ({ ...prev, faculty: res.data[0]._id }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createCourse(formData);
      if (res.success) {
        setAlert({ type: 'success', message: 'Course created successfully' });
        setIsAddModalOpen(false);
        resetForm();
        fetchCourses();
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to create course' });
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.updateCourse(selectedCourse._id, formData);
      if (res.success) {
        setAlert({ type: 'success', message: 'Course updated successfully' });
        setIsEditModalOpen(false);
        fetchCourses();
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to update course' });
    }
  };

  const handleDeleteSubmit = async () => {
    try {
      const res = await api.deleteCourse(selectedCourse._id);
      if (res.success) {
        setAlert({ type: 'success', message: 'Course removed successfully' });
        setIsDeleteModalOpen(false);
        fetchCourses();
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to delete course' });
    }
  };

  const handleViewRoster = async (course) => {
    try {
      setSelectedCourse(course);
      setIsRosterModalOpen(true);
      const res = await api.getCourseById(course._id);
      if (res.success) {
        setCourseRoster(res.data);
      }
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to load course roster' });
    }
  };

  const openEditModal = (course) => {
    setSelectedCourse(course);
    setFormData({
      code: course.code,
      name: course.name,
      department: course.department,
      semester: course.semester,
      credits: course.credits,
      faculty: course.faculty?._id || course.faculty,
      description: course.description || '',
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (course) => {
    setSelectedCourse(course);
    setIsDeleteModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      department: 'Computer Science & Engineering',
      semester: 5,
      credits: 3,
      faculty: facultyList.length > 0 ? facultyList[0]._id : '',
      description: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Courses & Faculty</h1>
          <p className="text-xs text-slate-500 mt-0.5">Academic offerings, assigned faculty professors, and class rosters</p>
        </div>
        <div className="flex items-center space-x-3">
          {isFaculty && (
            <button
              onClick={() => setAssignedOnly(!assignedOnly)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                assignedOnly
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {assignedOnly ? '✓ Showing My Courses' : 'Show My Courses Only'}
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => {
                resetForm();
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-all shadow-md shadow-indigo-100"
            >
              <Plus className="w-4 h-4" />
              <span>Add Course</span>
            </button>
          )}
        </div>
      </div>

      <Alert type={alert.type} message={alert.message} onClose={() => setAlert({ type: '', message: '' })} />

      {/* Courses Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-16 text-center text-slate-400">Loading courses...</div>
        ) : courses.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400">No courses found.</div>
        ) : (
          courses.map((course) => (
            <div
              key={course._id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg text-xs border border-indigo-200/60">
                    {course.code}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500">
                    Sem {course.semester} • {course.credits} Credits
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-base mt-3 leading-snug">
                  {course.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {course.description || 'No description provided.'}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <UserCheck className="w-4 h-4 text-slate-400" />
                    <div>
                      <div className="font-semibold text-slate-800">{course.faculty?.name || 'Unassigned'}</div>
                      <div className="text-[10px] text-slate-400">{course.faculty?.email}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-800 text-sm">{course.enrolledCount || 0}</span>
                    <div className="text-[10px] text-slate-400">Enrolled</div>
                  </div>
                </div>
              </div>

              {/* Card Actions */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => handleViewRoster(course)}
                  className="inline-flex items-center space-x-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>View Student Roster</span>
                </button>

                {isAdmin && (
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => openEditModal(course)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                      title="Edit Course"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openDeleteModal(course)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      title="Delete Course"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Course Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create New Academic Course"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Course Code *</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g. BCSE305L"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Credits</label>
              <input
                type="number"
                min="1"
                max="6"
                value={formData.credits}
                onChange={(e) => setFormData({ ...formData, credits: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">Course Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Software Engineering Principles"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Assigned Faculty *</label>
              <select
                required
                value={formData.faculty}
                onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500"
              >
                {facultyList.map((f) => (
                  <option key={f._id} value={f._id}>
                    {f.name} ({f.email})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Semester</label>
              <input
                type="number"
                min="1"
                max="8"
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">Description</label>
            <textarea
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Course description and syllabus overview..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500"
            ></textarea>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-md shadow-indigo-100"
            >
              Create Course
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Course Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Course — ${selectedCourse?.code}`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Course Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Assigned Faculty</label>
              <select
                value={formData.faculty}
                onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              >
                {facultyList.map((f) => (
                  <option key={f._id} value={f._id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Credits</label>
              <input
                type="number"
                min="1"
                max="6"
                value={formData.credits}
                onChange={(e) => setFormData({ ...formData, credits: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>
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
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
            >
              Update Course
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Course Confirmation */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Course Deletion"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-3 text-rose-800">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Delete course {selectedCourse?.code}?</div>
              <p className="mt-1 text-[11px] text-rose-700">
                Removing this course will delete all associated student enrollments and recorded attendance sessions.
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
              Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* Course Roster Modal */}
      <Modal
        isOpen={isRosterModalOpen}
        onClose={() => {
          setIsRosterModalOpen(false);
          setCourseRoster(null);
        }}
        title={`Roster — ${selectedCourse?.code} (${selectedCourse?.name})`}
        maxWidth="max-w-2xl"
      >
        {courseRoster ? (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Faculty Professor</span>
                <div className="font-semibold text-slate-800">{courseRoster.faculty?.name}</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Enrolled Students</span>
                <div className="font-bold text-indigo-700 text-sm">{courseRoster.enrollmentCount}</div>
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
              {courseRoster.enrolledStudents?.length === 0 ? (
                <div className="p-6 text-center text-slate-400">No students enrolled yet.</div>
              ) : (
                courseRoster.enrolledStudents?.map((s) => (
                  <div key={s._id} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                    <div className="flex items-center space-x-3">
                      <span className="font-mono font-bold text-indigo-700 w-24">{s.studentId}</span>
                      <div>
                        <div className="font-semibold text-slate-800">{s.name}</div>
                        <div className="text-[10px] text-slate-400">{s.email}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500">Sec {s.section}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400">Loading roster...</div>
        )}
      </Modal>
    </div>
  );
}
