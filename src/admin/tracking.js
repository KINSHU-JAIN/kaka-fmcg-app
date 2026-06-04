// ============================================
// Admin Panel — Delivery Staff Location Tracking
// ============================================

import { Store } from '../data/store.js';

// Approx Coordinates for seed shops in Kherwara, Rajasthan
const SHOP_COORDS = {
  shop1: { lat: 23.9912, lng: 73.5962 }, // Sharma General Store
  shop2: { lat: 23.9935, lng: 73.5991 }, // Gupta Kirana
  shop3: { lat: 23.9951, lng: 73.5942 }, // Patel Supermart
  shop4: { lat: 23.9898, lng: 73.5975 }, // Singh Provision Store
  shop5: { lat: 23.9942, lng: 73.5954 }  // Agarwal Traders
};

let mapInstance = null;

function loadLeaflet(callback) {
  if (window.L) {
    callback();
    return;
  }

  // Load CSS
  if (!document.getElementById('leaflet-css')) {
    const link = document.createElement('link');
    link.id = 'leaflet-css';
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
  }

  // Load JS
  const script = document.createElement('script');
  script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
  script.onload = () => callback();
  document.head.appendChild(script);
}

export function render() {
  const locations = Store.getStaffLocations();
  const staffList = Store.getStaff();

  return `
    <div style="display:flex; flex-direction:column; gap:20px;">
      
      <!-- Split Layout -->
      <div style="display:flex; gap:24px; flex-wrap:wrap; align-items:flex-start;">
        
        <!-- Sidebar - Staff List (left) -->
        <div class="card" style="flex:1; min-width:280px; max-width:400px; padding:20px;">
          <h3 style="margin-top:0; margin-bottom:12px; display:flex; align-items:center; gap:8px;">
            <span class="material-icons-round" style="color:var(--accent-gold);">group</span>
            Delivery Personnel
          </h3>
          <p class="text-muted" style="font-size:0.8rem; margin-bottom:16px;">Click a staff member to focus the map on their location</p>
          
          <div style="display:flex; flex-direction:column; gap:10px;" id="tracking-staff-list">
            ${staffList.map(s => {
              const loc = locations.find(l => l.staffId === s.id);
              const isOnline = loc && (new Date() - new Date(loc.updatedAt) < 10 * 60 * 1000); // Online within 10 min
              const timeStr = loc ? new Date(loc.updatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';
              
              return `
                <div class="tracking-staff-row" data-staff-id="${s.id}" style="
                  padding:12px; border:1px solid var(--border); 
                  border-radius:var(--radius-md); background:var(--bg-secondary);
                  cursor:${loc ? 'pointer' : 'default'}; opacity:${loc ? 1 : 0.6};
                  display:flex; justify-content:space-between; align-items:center;
                ">
                  <div>
                    <div style="font-weight:600; color:var(--text-primary);">${s.name}</div>
                    <div style="font-size:0.75rem; color:var(--text-dim); margin-top:2px;">
                      ${loc ? `Last check-in: ${timeStr}` : 'No coordinates received'}
                    </div>
                  </div>
                  <span class="badge ${isOnline ? 'badge-success' : 'badge-neutral'}" style="font-size:0.65rem; padding:4px 8px;">
                    ${isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Live Map (right) -->
        <div class="card" style="flex:2.5; min-width:320px; padding:0; overflow:hidden; position:relative;">
          <div style="padding:16px; background:var(--bg-secondary); border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;">
            <h3 style="margin:0; font-size:1.05rem; display:flex; align-items:center; gap:8px;">
              <span class="material-icons-round" style="color:var(--accent-gold)">satellite_alt</span>
              Live Geolocation Map (Kherwara Rural Route)
            </h3>
            <button class="btn btn-secondary btn-sm" id="refresh-map-btn" style="padding:4px 10px;">
              <span class="material-icons-round" style="font-size:14px;">refresh</span> Sync Map
            </button>
          </div>
          <div id="leaflet-map" style="height: 520px; width:100%;"></div>
        </div>

      </div>
    </div>
  `;
}

export function init() {
  loadLeaflet(() => {
    initMap();
  });

  const refreshBtn = document.getElementById('refresh-map-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      loadLeaflet(() => {
        initMap();
        Toast.success('Tracking map synchronized');
      });
    });
  }
}

function initMap() {
  const mapDiv = document.getElementById('leaflet-map');
  if (!mapDiv || !window.L) return;

  // Clean existing map instance if any
  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
  }

  // Centered at Kherwara, Rajasthan
  const centerLat = 23.9922;
  const centerLng = 73.5976;

  // Initialize Map
  mapInstance = window.L.map('leaflet-map').setView([centerLat, centerLng], 14);

  // Map Tile layer (OpenStreetMap)
  window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
  }).addTo(mapInstance);

  // Add Stop Pins (Shops)
  const shops = Store.getShops();
  shops.forEach((shop, index) => {
    const coords = SHOP_COORDS[shop.id] || { lat: centerLat + (index * 0.002), lng: centerLng + (index * 0.002) };
    
    // Custom label for stop markers
    const numberIcon = window.L.divIcon({
      className: 'leaflet-number-icon',
      html: `<div style="background-color: var(--accent-blue); color: white; width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; border:2px solid white; font-size:0.75rem; box-shadow:0 2px 4px rgba(0,0,0,0.3);">${index + 1}</div>`,
      iconSize: [22, 22]
    });

    window.L.marker([coords.lat, coords.lng], { icon: numberIcon })
      .bindPopup(`<b>Stop ${index + 1}: ${shop.name}</b><br>Owner: ${shop.ownerName}<br>${shop.address}`)
      .addTo(mapInstance);
  });

  // Plot Staff Geolocation Pins
  const locations = Store.getStaffLocations();
  locations.forEach(loc => {
    const staff = Store.getStaffById(loc.staffId);
    if (!staff) return;

    const lastUpdated = new Date(loc.updatedAt);
    const dateStr = lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    
    const staffIcon = window.L.divIcon({
      className: 'leaflet-staff-icon',
      html: `
        <div style="background-color:#d97706; border:3px solid white; border-radius:50%; width:34px; height:34px; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 10px rgba(0,0,0,0.3); animation: pulse-gps 2s infinite;">
          <span class="material-icons-round" style="color:white; font-size:18px;">local_shipping</span>
        </div>
        <style>
          @keyframes pulse-gps {
            0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(217, 119, 6, 0.7); }
            70% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(217, 119, 6, 0); }
            100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(217, 119, 6, 0); }
          }
        </style>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });

    window.L.marker([loc.lat, loc.lng], { icon: staffIcon })
      .bindPopup(`<b>Rep: ${staff.name}</b><br>Status: Out for Delivery<br>Active Location Sync: ${dateStr}`)
      .addTo(mapInstance)
      .openPopup();
  });

  // Add click events to staff list rows to pan map
  document.querySelectorAll('.tracking-staff-row').forEach(row => {
    row.addEventListener('click', () => {
      const staffId = row.dataset.staffId;
      const loc = locations.find(l => l.staffId === staffId);
      if (loc && mapInstance) {
        mapInstance.setView([loc.lat, loc.lng], 16);
      }
    });
  });
}
