/**
 * AI Disaster Response Resource Optimizer - GIS Map Controller
 * Implements Section 5 & 12: Interactive Leaflet Disaster Map & Route Visualization
 */

class DisasterMapController {
  constructor(mapElementId = "disasterMap") {
    this.mapElementId = mapElementId;
    this.map = null;
    this.requestMarkers = {};
    this.resourceMarkers = {};
    this.routePolylines = [];
    this.floodZones = [];
    this.isMapReady = false;
  }

  init() {
    const el = document.getElementById(this.mapElementId);
    if (!el) {
      console.warn(`Map element #${this.mapElementId} not found.`);
      return;
    }

    // Default center: Flood Relief Basin (Chennai / Adyar - Velachery Zone)
    this.map = L.map(this.mapElementId, {
      center: [12.9950, 80.2100],
      zoom: 12,
      zoomControl: true
    });

    // Dark high-contrast disaster command tile layer (CartoDB Dark Matter / OSM)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> & OpenStreetMap contributors',
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(this.map);

    this.renderFloodHazardZones();
    this.isMapReady = true;

    // Invalidate size on container resize
    setTimeout(() => {
      this.map.invalidateSize();
    }, 300);
  }

  renderFloodHazardZones() {
    // Simulated water-logging / inundated river basin zones
    const zone1 = L.circle([12.9815, 80.2180], {
      color: '#ef4444',
      fillColor: '#ef4444',
      fillOpacity: 0.18,
      radius: 1800,
      weight: 1.5,
      dashArray: '5, 5'
    }).bindPopup("<b>⚠️ High Inundation Hazard Zone</b><br>Velachery Lake Overflow Basin. Water level: 4.2 ft.");

    const zone2 = L.circle([13.0213, 80.2231], {
      color: '#f97316',
      fillColor: '#f97316',
      fillOpacity: 0.15,
      radius: 1400,
      weight: 1.5,
      dashArray: '5, 5'
    }).bindPopup("<b>⚠️ Moderate Flood Zone</b><br>Adyar River Saidapet Causeway breach area.");

    zone1.addTo(this.map);
    zone2.addTo(this.map);
    this.floodZones.push(zone1, zone2);
  }

  createRequestIcon(severity, status) {
    let colorClass = "bg-red-500 text-white border-red-300";
    let pulseHtml = `<div class="absolute -inset-1 rounded-full bg-red-500 animate-ping opacity-75"></div>`;

    if (severity === "Critical") {
      colorClass = "bg-rose-600 text-white border-rose-300 ring-4 ring-rose-400/40";
      pulseHtml = `<div class="absolute -inset-2 rounded-full bg-rose-600 animate-ping opacity-60"></div>`;
    } else if (severity === "High") {
      colorClass = "bg-amber-500 text-white border-amber-300";
      pulseHtml = `<div class="absolute -inset-1 rounded-full bg-amber-500 animate-pulse opacity-50"></div>`;
    } else if (severity === "Medium") {
      colorClass = "bg-blue-500 text-white border-blue-200";
      pulseHtml = "";
    } else {
      colorClass = "bg-slate-600 text-white border-slate-400";
      pulseHtml = "";
    }

    if (status === "Delivered" || status === "Completed") {
      colorClass = "bg-emerald-600 text-white border-emerald-300";
      pulseHtml = "";
    }

    const html = `
      <div class="relative flex items-center justify-center w-8 h-8 rounded-full ${colorClass} shadow-xl border-2 font-bold text-xs cursor-pointer transform hover:scale-110 transition-transform">
        ${pulseHtml}
        <i class="fa-solid fa-triangle-exclamation text-xs"></i>
      </div>
    `;

    return L.divIcon({
      className: 'custom-disaster-marker',
      html: html,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -18]
    });
  }

  createDepotIcon(resource) {
    const isAvailable = resource.status === "Available" && resource.availableQuantity > 0;
    const bgClass = isAvailable ? "bg-emerald-600 text-white border-emerald-300" : "bg-zinc-700 text-zinc-300 border-zinc-500";
    const statusDot = isAvailable ? "bg-emerald-400" : "bg-rose-500";

    const html = `
      <div class="relative flex items-center justify-center w-9 h-9 rounded-xl ${bgClass} shadow-xl border-2 cursor-pointer transform hover:scale-110 transition-transform">
        <i class="fa-solid fa-warehouse text-sm"></i>
        <span class="absolute -top-1 -right-1 w-3 h-3 rounded-full ${statusDot} ring-2 ring-white"></span>
      </div>
    `;

    return L.divIcon({
      className: 'custom-depot-marker',
      html: html,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -20]
    });
  }

  updateMarkers(requests, resources, allocations = []) {
    if (!this.map) return;

    // 1. Clear previous request markers
    Object.values(this.requestMarkers).forEach(marker => this.map.removeLayer(marker));
    this.requestMarkers = {};

    // 2. Clear previous resource markers
    Object.values(this.resourceMarkers).forEach(marker => this.map.removeLayer(marker));
    this.resourceMarkers = {};

    // 3. Clear previous route polylines
    this.routePolylines.forEach(line => this.map.removeLayer(line));
    this.routePolylines = [];

    // 4. Render Resources (Depots)
    resources.forEach(res => {
      if (!res.lat || !res.lng) return;
      const marker = L.marker([res.lat, res.lng], {
        icon: this.createDepotIcon(res)
      });

      const popupContent = `
        <div class="p-2 min-w-[220px]">
          <div class="flex items-center justify-between border-b pb-1 mb-2">
            <span class="font-bold text-slate-800">${res.name}</span>
            <span class="px-1.5 py-0.5 text-xs font-semibold rounded ${res.status === 'Available' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">${res.status}</span>
          </div>
          <div class="text-xs space-y-1 text-slate-600">
            <div><strong>Item:</strong> ${res.resourceType}</div>
            <div><strong>Available:</strong> <span class="font-semibold text-slate-900">${res.availableQuantity} / ${res.totalCapacity} ${res.unit}</span></div>
            <div><strong>Location:</strong> ${res.locationName}</div>
            <div><strong>Helpline:</strong> ${res.contact}</div>
          </div>
          <div class="mt-2.5 pt-2 border-t flex justify-end">
            <button onclick="window.app.toggleDepotStatus('${res.id}')" class="text-xs px-2.5 py-1 rounded font-medium ${res.status === 'Available' ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-300' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300'}">
              ${res.status === 'Available' ? 'Simulate Outage' : 'Restore Depot'}
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.addTo(this.map);
      this.resourceMarkers[res.id] = marker;
    });

    // 5. Render Emergency Requests
    requests.forEach(req => {
      if (!req.lat || !req.lng) return;
      const marker = L.marker([req.lat, req.lng], {
        icon: this.createRequestIcon(req.severity, req.status)
      });

      const priorityBadge = req.priorityScore 
        ? `<span class="px-2 py-0.5 text-xs font-bold rounded bg-indigo-100 text-indigo-800">Score: ${req.priorityScore}</span>`
        : "";

      const popupContent = `
        <div class="p-2 min-w-[240px]">
          <div class="flex items-center justify-between border-b pb-1 mb-2">
            <span class="font-bold text-slate-900">${req.id} - ${req.emergencyType}</span>
            <span class="px-2 py-0.5 text-xs font-bold rounded ${req.severity === 'Critical' ? 'bg-rose-100 text-rose-700' : req.severity === 'High' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}">${req.severity}</span>
          </div>
          <div class="text-xs space-y-1 text-slate-600 mb-2">
            <div class="flex justify-between"><span><strong>People Affected:</strong></span> <span class="font-semibold text-slate-900">${req.peopleCount} persons</span></div>
            <div class="flex justify-between"><span><strong>Demanded Item:</strong></span> <span class="font-semibold text-indigo-700">${req.quantity} ${req.unit} ${req.requiredResource}</span></div>
            <div class="flex justify-between"><span><strong>Status:</strong></span> <span class="font-semibold text-slate-800">${req.status}</span></div>
            <div><strong>Location:</strong> ${req.locationName}</div>
            ${req.assignedDepot ? `<div class="p-1 rounded bg-emerald-50 text-emerald-800 mt-1"><strong>Supplied By:</strong> ${req.assignedDepot}</div>` : ''}
          </div>
          <div class="flex items-center justify-between pt-2 border-t">
            ${priorityBadge}
            ${req.status === 'Pending' || req.status === 'Synced' ? `
              <button onclick="window.app.quickAllocate('${req.id}')" class="text-xs px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow">
                Allocate Now
              </button>
            ` : `
              <span class="text-xs text-slate-500 font-medium">${req.status}</span>
            `}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.addTo(this.map);
      this.requestMarkers[req.id] = marker;
    });

    // 6. Draw Allocation Route Polylines
    allocations.forEach(alloc => {
      if (alloc.route && alloc.route.from && alloc.route.to) {
        const polyline = L.polyline([alloc.route.from, alloc.route.to], {
          color: '#3b82f6',
          weight: 3.5,
          opacity: 0.85,
          dashArray: '8, 8',
          lineCap: 'round'
        });

        polyline.bindTooltip(
          `🚚 <b>Dispatch ${alloc.allocationId}</b><br>Distance: ${alloc.distanceKm} km | ETA: ${alloc.etaMinutes} min<br>From: ${alloc.depotName} → To: ${alloc.requestId}`,
          { sticky: true, className: 'route-tooltip' }
        );

        polyline.addTo(this.map);
        this.routePolylines.push(polyline);
      }
    });
  }

  focusOnLocation(lat, lng, zoom = 14) {
    if (!this.map || !lat || !lng) return;
    this.map.setView([lat, lng], zoom, { animate: true, duration: 1 });
  }

  flyToRequest(requestId) {
    const marker = this.requestMarkers[requestId];
    if (marker) {
      this.map.setView(marker.getLatLng(), 14, { animate: true });
      marker.openPopup();
    }
  }

  flyToDepot(depotId) {
    const marker = this.resourceMarkers[depotId];
    if (marker) {
      this.map.setView(marker.getLatLng(), 14, { animate: true });
      marker.openPopup();
    }
  }

  fitAll() {
    if (!this.map) return;
    const group = L.featureGroup([
      ...Object.values(this.requestMarkers),
      ...Object.values(this.resourceMarkers)
    ]);
    if (group.getLayers().length > 0) {
      this.map.fitBounds(group.getBounds().pad(0.15));
    }
  }
}

// Global instance
window.disasterMapController = new DisasterMapController();
