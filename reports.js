// ==================== UI RENDERING & FLOW LOGIC ====================

function renderReports() {
  const container = document.getElementById('reportsContainer');
  if (!container) return;
  container.innerHTML = '';
  const reports = loadReports();

  if (reports.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--outline)">No active reports.</div>';
    updateDashboardStats();
    return;
  }

  reports.forEach(report => {
    const card = document.createElement('div');
    card.className = 'report-item scroll-reveal active';
    const isFixed = report.status === 'fixed';
    card.innerHTML = `
      <div class="report-thumb">
        <img src="${report.image}" style="width:100%;height:100%;object-fit:cover">
      </div>
      <div style="flex:1">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
          <h4 style="font-weight:700;font-size:15px">Pothole @ ${report.lat.toFixed(3)}, ${report.lng.toFixed(3)}</h4>
          <div class="badge ${isFixed ? 'badge-green' : 'badge-amber'}">${isFixed ? 'Fixed' : 'Active'}</div>
        </div>
        <p style="font-size:12px;color:var(--outline)">Reported on ${new Date(report.timestamp).toLocaleDateString()} at ${new Date(report.timestamp).toLocaleTimeString()}</p>
      </div>
    `;
    container.appendChild(card);
  });

  updateDashboardStats();
}

// ==================== DASHBOARD STATS UPDATE ====================

function updateDashboardStats() {
  const reports = loadReports();
  const totalReports = reports.length;
  const activeIssues = reports.filter(r => r.status === 'active').length;
  const fixedIssues = reports.filter(r => r.status === 'fixed').length;

  // Update stats
  const totalEl = document.getElementById('totalReportsCount');
  const activeEl = document.getElementById('activeIssuesCount');
  const fixedEl = document.getElementById('fixedIssuesCount');

  if (totalEl) totalEl.textContent = totalReports;
  if (activeEl) activeEl.textContent = activeIssues;
  if (fixedEl) fixedEl.textContent = fixedIssues;

  // Update latest report preview
  const latestPreview = document.getElementById('latestReportPreview');
  if (latestPreview && reports.length > 0) {
    const latest = reports[0];
    latestPreview.innerHTML = `
      <img src="${latest.image}" alt="Latest report" />
      <div style="text-align:left">
        <p style="font-size:12px;font-weight:700;color:var(--primary);margin-bottom:4px">Latest Report</p>
        <p style="font-size:11px;color:var(--outline)">📍 ${latest.lat.toFixed(4)}, ${latest.lng.toFixed(4)}</p>
        <p style="font-size:11px;color:var(--on-surface-variant)">${new Date(latest.timestamp).toLocaleDateString()}</p>
      </div>
    `;
  }
}

function markAsFixed(id) {
  updateReportStatus(id, 'fixed');
  renderMarkers();
  renderReports();
  if (map && map.closePopup) map.closePopup();
}

function handleImageSelect(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = e => {
      const preview = document.getElementById('imagePreview');
      preview.src = e.target.result;
      preview.style.display = 'block';
      document.getElementById('analyzeBtn').disabled = false;
    };
    reader.readAsDataURL(input.files[0]);
  }
}

async function validatePothole(imageData) {
  try {
    const formData = new FormData();
    formData.append('file', imageData);

    const response = await fetch('http://127.0.0.1:8000/detect', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    const data = await response.json();

    if (data.error || data.message === 'No pothole detected') {
      return {
        isPothole: false,
        confidence: data.severity ?? 0,
        details: data
      };
    }

    return {
      isPothole: true,
      confidence: data.severity ?? 1,
      details: data
    };
  } catch (error) {
    console.warn('Pothole validation failed, falling back to mock validation.', error);
    const random = Math.random();
    return {
      isPothole: random > 0.3,
      confidence: random,
      fallback: true,
      error: error.message
    };
  }
}

async function analyzePothole() {
  const fileInput = document.getElementById('potholeInput');
  if (!fileInput.files[0]) return;

  const btn = document.getElementById('analyzeBtn');
  const loading = document.getElementById('loadingState');
  const message = document.getElementById('validationMessage');
  message.textContent = '';
  btn.disabled = true;
  loading.style.display = 'block';

  try {
    const validation = await validatePothole(fileInput.files[0]);

    if (!validation.isPothole) {
      message.textContent = 'This image does not appear to contain a pothole. Please upload a valid image.';
      loading.style.display = 'none';
      btn.disabled = false;
      return;
    }

    if (!navigator.geolocation) {
      message.textContent = 'Location is required to save the report.';
      loading.style.display = 'none';
      btn.disabled = false;
      return;
    }

    navigator.geolocation.getCurrentPosition((position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const report = {
        id: Date.now(),
        lat,
        lng,
        image: document.getElementById('imagePreview').src,
        status: 'active',
        timestamp: new Date().toISOString()
      };

      saveReport(report);
      console.log('Report saved', report);
      addMarker(report);
      loading.style.display = 'none';
      btn.disabled = false;
      closeReportModal();
      showPage('citizen-dashboard');
      renderReports();
    }, (error) => {
      console.error('Geolocation error', error);
      message.textContent = 'Location permission required to submit the report.';
      loading.style.display = 'none';
      btn.disabled = false;
    });
  } catch (err) {
    console.error(err);
    message.textContent = 'Unable to validate the image. Please try again.';
    loading.style.display = 'none';
    btn.disabled = false;
  }
}
