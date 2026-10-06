// ==================== CONFIG & STORAGE ====================
const STORAGE_KEY = 'reports';

function loadReports() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

function saveReport(report) {
  const reports = loadReports();
  reports.unshift(report);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}

function updateReportStatus(id, status) {
  const reports = loadReports();
  const updated = reports.map(r => (r.id === id ? { ...r, status } : r));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}
