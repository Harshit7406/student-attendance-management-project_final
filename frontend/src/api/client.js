const BASE_URL = '/api';

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle CSV stream
  if (response.headers.get('Content-Type')?.includes('text/csv')) {
    if (!response.ok) {
      throw new Error('Failed to download CSV');
    }
    const blob = await response.blob();
    return blob;
  }

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth-logout'));
    }
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
}

export const api = {
  // Auth
  login: (credentials) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  getMe: () => apiRequest('/auth/me'),
  getUsers: (params = '') => apiRequest(`/auth/users${params}`),
  createUser: (data) => apiRequest('/auth/users', { method: 'POST', body: JSON.stringify(data) }),
  deleteUser: (id) => apiRequest(`/auth/users/${id}`, { method: 'DELETE' }),

  // Students
  getStudents: (query = '') => apiRequest(`/students${query}`),
  getStudentById: (id) => apiRequest(`/students/${id}`),
  createStudent: (data) => apiRequest('/students', { method: 'POST', body: JSON.stringify(data) }),
  updateStudent: (id, data) => apiRequest(`/students/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteStudent: (id) => apiRequest(`/students/${id}`, { method: 'DELETE' }),

  // Courses
  getCourses: (query = '') => apiRequest(`/courses${query}`),
  getCourseById: (id) => apiRequest(`/courses/${id}`),
  createCourse: (data) => apiRequest('/courses', { method: 'POST', body: JSON.stringify(data) }),
  updateCourse: (id, data) => apiRequest(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCourse: (id) => apiRequest(`/courses/${id}`, { method: 'DELETE' }),

  // Enrollments
  getEnrollments: (query = '') => apiRequest(`/enrollments${query}`),
  enrollStudent: (data) => apiRequest('/enrollments', { method: 'POST', body: JSON.stringify(data) }),
  bulkEnroll: (data) => apiRequest('/enrollments/bulk', { method: 'POST', body: JSON.stringify(data) }),
  dropEnrollment: (id) => apiRequest(`/enrollments/${id}`, { method: 'DELETE' }),

  // Attendance
  getAttendanceSheet: (courseId, date) => apiRequest(`/attendance/sheet?courseId=${courseId}&date=${date}`),
  recordBatchAttendance: (data) => apiRequest('/attendance/batch', { method: 'POST', body: JSON.stringify(data) }),
  getAttendanceHistory: (query = '') => apiRequest(`/attendance${query}`),
  updateAttendance: (id, data) => apiRequest(`/attendance/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAttendance: (id) => apiRequest(`/attendance/${id}`, { method: 'DELETE' }),
  exportCSV: async (query = '') => {
    const blob = await apiRequest(`/attendance/export/csv${query}`);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  // Analytics (MongoDB Aggregation Pipelines)
  getOverview: () => apiRequest('/analytics/overview'),
  getStudentAnalytics: (query = '') => apiRequest(`/analytics/students${query}`),
  getCourseAnalytics: () => apiRequest('/analytics/courses'),
  getDailyAnalytics: (query = '') => apiRequest(`/analytics/daily${query}`),
  getDefaulters: (threshold = 75, query = '') => apiRequest(`/analytics/defaulters?threshold=${threshold}${query ? `&${query}` : ''}`),
  getMonthlyTrends: () => apiRequest('/analytics/monthly'),
};
