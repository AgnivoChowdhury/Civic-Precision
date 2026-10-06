// ==================== MAP LOGIC ====================
let map;

function initMap() {
  if (map) return;
  map = L.map('map').setView([20.5937, 78.9629], 13);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);
  console.log("Map initialized");
}

function renderMarkers() {
  const reports = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  reports.forEach(report => {
    if (report.status === "active") {
      addMarker(report);
    }
  });
}

function addMarker(report) {
  if (!map) {
    console.error("Map not initialized");
    return;
  }
  if (!report.lat || !report.lng) {
    console.error("Invalid coordinates", report);
    return;
  }
  const marker = L.marker([report.lat, report.lng])
    .addTo(map)
    .bindPopup(`
        <img src="${report.image}" width="120"/><br>
        <b>Status:</b> ${report.status}
    `);
  console.log("Marker added at", report.lat, report.lng);
}
