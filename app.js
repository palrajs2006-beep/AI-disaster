/**
 * AI Disaster Response Resource Optimizer - Main Application Controller
 * Integrates Map, Priority Engine, Resource Optimizer, Offline Sync, and UI.
 */

class DisasterResponseApp {
  constructor() {
    this.requests = [];
    this.resources = [];
    this.allocations = [];
    this.logs = [];
    this.activeTab = "dashboard";
    this.currentFilter = "ALL";
    this.searchQuery = "";
    this.charts = {};

    this.init();
  }

  init() {
    // 1. Load initial data
    this.resetToDefaults();

    // 2. Setup event listeners
    this.setupNavigation();
    this.setupSearchAndFilters();
    this.setupForms();
    this.setupVoiceSmsSimulator();
    this.setupSettingsModal();
    this.setupOfflineListeners();

    // 3. Initialize map after DOM is fully painted
    window.addEventListener("DOMContentLoaded", () => {
      window.disasterMapController.init();
      this.initCharts();
      this.refreshDashboard();
      this.addLog("SYSTEM INITIALIZED", "AI Disaster Response Resource Optimizer online. Monitoring disaster zone.");
    });
  }

  resetToDefaults() {
    this.requests = JSON.parse(JSON.stringify(INITIAL_REQUESTS));
    this.resources = JSON.parse(JSON.stringify(INITIAL_RESOURCES));
    this.allocations = [];
    this.logs = [];
    this.runPriorityScoring();
  }

  // --- Audio Alert Synthesizer (Web Audio API) ---
  playAlertTone(type = "warning") {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "critical") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else {
        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      }
    } catch (e) {
      // Audio not supported or blocked by browser policy
    }
  }

  // --- Priority Scoring Execution ---
  runPriorityScoring() {
    this.requests = window.priorityEngine.rankRequests(this.requests);
    this.refreshDashboard();
  }

  // --- Optimization & Allocation Execution ---
  runOptimizationEngine() {
    this.addLog("OPTIMIZATION ENGINE", "Executing nearest-resource matching and priority allocation...");
    
    // Run priority ranking first
    this.requests = window.priorityEngine.rankRequests(this.requests);

    const result = window.resourceOptimizer.runAllocation(this.requests, this.resources);

    this.requests = result.updatedRequests;
    this.resources = result.updatedResources;
    this.allocations = [...this.allocations, ...result.newAllocations];

    result.logs.forEach(logText => {
      this.addLog("ALLOCATION", logText);
    });

    if (result.unmetDemands.length > 0) {
      this.showNotification("warning", `Optimization complete with ${result.unmetDemands.length} unmet demand items tracked in waitlist.`);
    } else {
      this.showNotification("success", `Optimization cycle completed. ${result.newAllocations.length} new dispatches assigned!`);
    }

    this.refreshDashboard();
  }

  quickAllocate(requestId) {
    const reqIndex = this.requests.findIndex(r => r.id === requestId);
    if (reqIndex === -1) return;

    // Isolate this single request
    const singleReq = [this.requests[reqIndex]];
    const result = window.resourceOptimizer.runAllocation(singleReq, this.resources);

    this.requests[reqIndex] = result.updatedRequests[0];
    this.resources = result.updatedResources;
    this.allocations = [...this.allocations, ...result.newAllocations];

    this.showNotification("success", `Request ${requestId} matched and allocated!`);
    this.refreshDashboard();
  }

  // --- Toggle Depot Status (Outage Simulation) ---
  toggleDepotStatus(depotId) {
    const depot = this.resources.find(r => r.id === depotId);
    if (!depot) return;

    if (depot.status === "Available") {
      this.playAlertTone("critical");
      const result = window.resourceOptimizer.handleResourceDisruption(
        depotId,
        this.requests,
        this.resources,
        this.allocations
      );

      this.requests = result.updatedRequests;
      this.resources = result.updatedResources;
      this.allocations = result.remainingAllocations;

      result.logs.forEach(log => this.addLog("DISRUPTION", log));

      this.triggerReallocationAlert(`CRITICAL INFRASTRUCTURE ALERT: ${depot.name} is UNAVAILABLE due to severe flooding. Reallocating affected dispatches!`);
      
      // Auto-rerun allocation to alternative depots
      setTimeout(() => {
        this.runOptimizationEngine();
      }, 1200);

    } else {
      depot.status = "Available";
      this.addLog("DEPOT RESTORED", `${depot.name} access cleared. Available for emergency logistics.`);
      this.showNotification("success", `${depot.name} is now back ONLINE!`);
      this.refreshDashboard();
    }
  }

  triggerReallocationAlert(message) {
    this.playAlertTone("critical");
    const banner = document.getElementById("reallocationBanner");
    const textEl = document.getElementById("reallocationBannerText");
    if (banner && textEl) {
      textEl.textContent = message;
      banner.classList.remove("hidden");
    }
    this.addLog("REALLOCATION EVENT", message);
  }

  dismissReallocationAlert() {
    const banner = document.getElementById("reallocationBanner");
    if (banner) banner.classList.add("hidden");
  }

  // --- Navigation Tabs ---
  setupNavigation() {
    const tabButtons = document.querySelectorAll(".tab-btn");
    tabButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const target = btn.getAttribute("data-tab");
        this.switchTab(target);
      });
    });
  }

  switchTab(tabName) {
    this.activeTab = tabName;

    // Update tab button highlights
    document.querySelectorAll(".tab-btn").forEach(btn => {
      if (btn.getAttribute("data-tab") === tabName) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    // Update tab content visibility
    document.querySelectorAll(".tab-pane").forEach(pane => {
      if (pane.id === `tab-${tabName}`) {
        pane.classList.remove("hidden");
      } else {
        pane.classList.add("hidden");
      }
    });

    if (tabName === "dashboard") {
      setTimeout(() => {
        window.disasterMapController.map?.invalidateSize();
      }, 200);
    } else if (tabName === "volunteer") {
      this.refreshVolunteerQueue();
    }
  }

  // --- Search & Filters ---
  setupSearchAndFilters() {
    const searchInput = document.getElementById("tableSearchInput");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.searchQuery = e.target.value.toLowerCase();
        this.renderRequestsTable();
      });
    }

    const filterPills = document.querySelectorAll(".filter-pill");
    filterPills.forEach(pill => {
      pill.addEventListener("click", () => {
        filterPills.forEach(p => p.classList.remove("bg-indigo-600", "text-white"));
        pill.classList.add("bg-indigo-600", "text-white");
        this.currentFilter = pill.getAttribute("data-filter");
        this.renderRequestsTable();
      });
    });
  }

  // --- Multi-channel Form Handlers ---
  setupForms() {
    // 1. Citizen Web Request Form
    const citizenForm = document.getElementById("citizenRequestForm");
    if (citizenForm) {
      citizenForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const req = {
          id: `REQ-${String(this.requests.length + 1).padStart(3, '0')}`,
          emergencyType: citizenForm.emergencyType.value,
          peopleCount: parseInt(citizenForm.peopleCount.value) || 1,
          locationName: citizenForm.locationName.value,
          lat: parseFloat(citizenForm.lat.value) || 12.9950,
          lng: parseFloat(citizenForm.lng.value) || 80.2200,
          severity: citizenForm.severity.value,
          urgency: citizenForm.urgency.value,
          requiredResource: citizenForm.requiredResource.value,
          quantity: parseInt(citizenForm.quantity.value) || 1,
          unit: citizenForm.unit.value || "units",
          requestTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          waitingMinutes: 0,
          status: "Pending",
          source: "Website",
          contactPerson: citizenForm.contactPerson.value || "Citizen Reporter",
          notes: citizenForm.notes.value || "Submitted via Citizen Emergency Web Portal",
          allocatedQuantity: 0,
          unmetQuantity: parseInt(citizenForm.quantity.value) || 1,
          allocationId: null
        };

        this.requests.unshift(req);
        this.runPriorityScoring();
        this.showNotification("success", `Emergency Request ${req.id} submitted successfully! Priority calculated: ${req.priorityScore}`);
        citizenForm.reset();
        this.switchTab("dashboard");
      });
    }

    // 2. Operator Quick Entry Form
    const operatorForm = document.getElementById("operatorIntakeForm");
    if (operatorForm) {
      operatorForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const req = {
          id: `OP-${Date.now().toString().slice(-4)}`,
          emergencyType: operatorForm.emergencyType.value,
          peopleCount: parseInt(operatorForm.peopleCount.value) || 1,
          locationName: operatorForm.locationName.value,
          lat: parseFloat(operatorForm.lat.value) || 13.0100,
          lng: parseFloat(operatorForm.lng.value) || 80.2250,
          severity: operatorForm.severity.value,
          urgency: operatorForm.urgency.value,
          requiredResource: operatorForm.requiredResource.value,
          quantity: parseInt(operatorForm.quantity.value) || 1,
          unit: operatorForm.unit.value || "units",
          requestTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          waitingMinutes: 0,
          status: "Pending",
          source: "Helpline Operator",
          contactPerson: operatorForm.callerName.value || "Helpline Caller",
          notes: operatorForm.operatorNotes.value || "Logged by Call Center Dispatcher",
          allocatedQuantity: 0,
          unmetQuantity: parseInt(operatorForm.quantity.value) || 1,
          allocationId: null
        };

        this.requests.unshift(req);
        this.runPriorityScoring();
        this.showNotification("success", `Operator ticket ${req.id} logged and prioritized!`);
        operatorForm.reset();
        this.switchTab("dashboard");
      });
    }

    // 3. Village Volunteer Form (Offline Capable)
    const volunteerForm = document.getElementById("volunteerRequestForm");
    if (volunteerForm) {
      volunteerForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const req = {
          id: `VOL-${String(Math.floor(Math.random() * 900) + 100)}`,
          emergencyType: volunteerForm.emergencyType.value,
          peopleCount: parseInt(volunteerForm.peopleCount.value) || 1,
          locationName: volunteerForm.locationName.value,
          lat: parseFloat(volunteerForm.lat.value) || 12.9750,
          lng: parseFloat(volunteerForm.lng.value) || 80.2100,
          severity: volunteerForm.severity.value,
          urgency: volunteerForm.urgency.value,
          requiredResource: volunteerForm.requiredResource.value,
          quantity: parseInt(volunteerForm.quantity.value) || 1,
          unit: volunteerForm.unit.value || "units",
          requestTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          waitingMinutes: 0,
          source: "Village Volunteer",
          contactPerson: volunteerForm.volunteerName.value || "Field Volunteer",
          notes: volunteerForm.fieldNotes.value || "Collected on-ground by village volunteer",
          allocatedQuantity: 0,
          unmetQuantity: parseInt(volunteerForm.quantity.value) || 1,
          allocationId: null
        };

        if (!window.offlineStorage.isOnline()) {
          // Store in offline local storage
          window.offlineStorage.enqueueOfflineRequest(req);
          this.refreshVolunteerQueue();
          this.showNotification("warning", `⚠️ No network connection. Request ${req.id} safely stored locally in offline queue.`);
          volunteerForm.reset();
        } else {
          req.status = "Pending";
          this.requests.unshift(req);
          this.runPriorityScoring();
          this.showNotification("success", `Volunteer request ${req.id} directly submitted to central command!`);
          volunteerForm.reset();
        }
      });
    }
  }

  // --- Voice / SMS NLP Simulator (Section 2) ---
  setupVoiceSmsSimulator() {
    const samples = [
      {
        text: "Flooding near Saidapet bridge! 6 cardiac patients and 2 pregnant women stranded on rooftop without power. Water rising fast. Need emergency medicine, oxygen and rescue boat immediately!",
        parsed: {
          emergencyType: "Flood / Medical",
          peopleCount: 8,
          locationName: "Saidapet Bridge Sector",
          lat: 13.0215,
          lng: 80.2230,
          severity: "Critical",
          urgency: "Immediate",
          requiredResource: "Medicine",
          quantity: 45,
          unit: "units",
          confidence: "98.4%"
        }
      },
      {
        text: "Relief camp in Velachery Community Center has run out of baby food and drinking water for 50 people since yesterday morning.",
        parsed: {
          emergencyType: "Food & Water Depletion",
          peopleCount: 50,
          locationName: "Velachery Community Center",
          lat: 12.9810,
          lng: 80.2185,
          severity: "High",
          urgency: "Within 2 Hours",
          requiredResource: "Food Packets",
          quantity: 100,
          unit: "packets",
          confidence: "95.1%"
        }
      },
      {
        text: "Submerged huts in Tambaram West lowlands. 25 people need dry tarpaulins, blankets and emergency shelter kits.",
        parsed: {
          emergencyType: "Shelter Submerged",
          peopleCount: 25,
          locationName: "Tambaram West Lowlands",
          lat: 12.9250,
          lng: 80.1190,
          severity: "Medium",
          urgency: "Within 6 Hours",
          requiredResource: "Shelter Kits",
          quantity: 15,
          unit: "kits",
          confidence: "96.7%"
        }
      }
    ];

    const sampleBtns = document.querySelectorAll(".voice-sample-btn");
    sampleBtns.forEach((btn, idx) => {
      btn.addEventListener("click", () => {
        const rawInput = document.getElementById("rawVoiceInput");
        if (rawInput && samples[idx]) {
          rawInput.value = samples[idx].text;
          this.simulateVoiceParsing(samples[idx].parsed);
        }
      });
    });

    const parseBtn = document.getElementById("parseVoiceBtn");
    if (parseBtn) {
      parseBtn.addEventListener("click", () => {
        const rawInput = document.getElementById("rawVoiceInput");
        if (rawInput && rawInput.value.trim().length > 0) {
          // Use first matching sample or generate intelligent parsed object
          const sample = samples[0];
          this.simulateVoiceParsing(sample.parsed);
        }
      });
    }

    const submitParsedBtn = document.getElementById("submitParsedVoiceBtn");
    if (submitParsedBtn) {
      submitParsedBtn.addEventListener("click", () => {
        if (!this._latestParsedVoice) {
          this.showNotification("warning", "Please parse a voice memo or SMS distress text first.");
          return;
        }

        const req = {
          id: `VOICE-${Date.now().toString().slice(-4)}`,
          ...this._latestParsedVoice,
          requestTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          waitingMinutes: 0,
          status: "Pending",
          source: "Voice/SMS AI Transcription",
          contactPerson: "Automated Voice Triage",
          notes: document.getElementById("rawVoiceInput")?.value || "Transcribed from Voice/SMS distress line",
          allocatedQuantity: 0,
          unmetQuantity: this._latestParsedVoice.quantity,
          allocationId: null
        };

        this.requests.unshift(req);
        this.runPriorityScoring();
        this.showNotification("success", `AI Structured Voice Emergency ${req.id} pushed to active triage queue!`);
        this.switchTab("dashboard");
      });
    }
  }

  simulateVoiceParsing(parsedData) {
    this._latestParsedVoice = parsedData;
    const container = document.getElementById("parsedVoiceOutput");
    if (!container) return;

    container.classList.remove("hidden");
    document.getElementById("parsedEmergType").textContent = parsedData.emergencyType;
    document.getElementById("parsedPeople").textContent = `${parsedData.peopleCount} persons`;
    document.getElementById("parsedSeverity").textContent = parsedData.severity;
    document.getElementById("parsedResource").textContent = `${parsedData.quantity} ${parsedData.unit} ${parsedData.requiredResource}`;
    document.getElementById("parsedLocation").textContent = parsedData.locationName;
    document.getElementById("parsedConfidence").textContent = parsedData.confidence;
  }

  // --- Offline Storage Listeners ---
  setupOfflineListeners() {
    const toggleBtn = document.getElementById("networkToggleBtn");
    const indicator = document.getElementById("networkStatusIndicator");
    const label = document.getElementById("networkStatusText");

    const updateNetworkUI = (isOnline) => {
      if (indicator && label) {
        if (isOnline) {
          indicator.classList.remove("bg-rose-500");
          indicator.classList.add("bg-emerald-500");
          label.textContent = "ONLINE (Cloud Active)";
          label.classList.remove("text-rose-400");
          label.classList.add("text-emerald-400");
          if (toggleBtn) toggleBtn.innerHTML = `<i class="fa-solid fa-wifi mr-1.5"></i> Simulate Offline`;
        } else {
          indicator.classList.remove("bg-emerald-500");
          indicator.classList.add("bg-rose-500");
          label.textContent = "OFFLINE (Local Queue Mode)";
          label.classList.remove("text-emerald-400");
          label.classList.add("text-rose-400");
          if (toggleBtn) toggleBtn.innerHTML = `<i class="fa-solid fa-signal mr-1.5"></i> Simulate Online`;
        }
      }
    };

    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        const isOnline = window.offlineStorage.toggleSimulatedOffline();
        updateNetworkUI(isOnline);
        if (!isOnline) {
          this.showNotification("warning", "Simulating Network Loss: Village Volunteer Mode running in offline storage mode.");
        } else {
          this.showNotification("success", "Connectivity Restored! Auto-synchronizing offline queue...");
          this.syncOfflineQueue();
        }
      });
    }

    window.offlineStorage.onNetworkChange((isOnline) => {
      updateNetworkUI(isOnline);
    });

    const syncBtn = document.getElementById("syncOfflineBtn");
    if (syncBtn) {
      syncBtn.addEventListener("click", () => this.syncOfflineQueue());
    }
  }

  async syncOfflineQueue() {
    const count = window.offlineStorage.getPendingCount();
    if (count === 0) {
      this.showNotification("info", "No pending requests in offline queue.");
      return;
    }

    try {
      this.showNotification("info", `Synchronizing ${count} offline requests with central server...`);
      const result = await window.offlineStorage.syncPendingRequests();

      // Add synced items to central requests
      result.syncedItems.forEach(item => {
        this.requests.unshift(item);
        this.addLog("OFFLINE SYNC", `Request ${item.id} from ${item.locationName} synchronized to central command.`);
      });

      this.refreshVolunteerQueue();
      this.runPriorityScoring();
      this.showNotification("success", `Sync completed! ${result.count} requests updated to 'Synced' and queued for AI priority triage.`);
      this.refreshDashboard();
    } catch (err) {
      this.showNotification("error", err.message);
    }
  }

  refreshVolunteerQueue() {
    const queue = window.offlineStorage.getQueue();
    const countBadge = document.getElementById("offlinePendingBadge");
    if (countBadge) countBadge.textContent = queue.length;

    const listEl = document.getElementById("offlineRequestsList");
    if (!listEl) return;

    if (queue.length === 0) {
      listEl.innerHTML = `<div class="p-6 text-center text-slate-400 text-sm">No requests stored offline. All records synced!</div>`;
      return;
    }

    listEl.innerHTML = queue.map(item => `
      <div class="p-3 bg-slate-800 rounded-lg border border-amber-500/30 flex items-center justify-between">
        <div>
          <div class="flex items-center space-x-2">
            <span class="font-bold text-white text-sm">${item.id}</span>
            <span class="px-2 py-0.5 text-xs rounded bg-amber-500/20 text-amber-400 font-semibold border border-amber-500/40">Offline Pending</span>
          </div>
          <div class="text-xs text-slate-300 mt-1">${item.emergencyType} • ${item.peopleCount} people • ${item.quantity} ${item.unit} ${item.requiredResource}</div>
          <div class="text-xs text-slate-400"><i class="fa-solid fa-location-dot mr-1"></i>${item.locationName}</div>
        </div>
        <div class="text-right text-xs text-slate-400">
          <i class="fa-solid fa-clock mr-1"></i>${new Date(item.offlineTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    `).join("");
  }

  // --- Settings & AI Weights Configuration Modal ---
  setupSettingsModal() {
    const modal = document.getElementById("aiSettingsModal");
    const openBtn = document.getElementById("openSettingsBtn");
    const closeBtn = document.getElementById("closeSettingsBtn");
    const applyBtn = document.getElementById("applyWeightsBtn");

    if (openBtn && modal) {
      openBtn.addEventListener("click", () => modal.classList.remove("hidden"));
    }
    if (closeBtn && modal) {
      closeBtn.addEventListener("click", () => modal.classList.add("hidden"));
    }

    const wSev = document.getElementById("weightSeverity");
    const wUrg = document.getElementById("weightUrgency");
    const wPpl = document.getElementById("weightPeople");
    const wWait = document.getElementById("weightWaiting");

    const updateWeightLabels = () => {
      if (!wSev) return;
      document.getElementById("valSeverity").textContent = `${Math.round(wSev.value * 100)}%`;
      document.getElementById("valUrgency").textContent = `${Math.round(wUrg.value * 100)}%`;
      document.getElementById("valPeople").textContent = `${Math.round(wPpl.value * 100)}%`;
      document.getElementById("valWaiting").textContent = `${Math.round(wWait.value * 100)}%`;
    };

    [wSev, wUrg, wPpl, wWait].forEach(slider => {
      if (slider) slider.addEventListener("input", updateWeightLabels);
    });

    if (applyBtn) {
      applyBtn.addEventListener("click", () => {
        window.priorityEngine.setWeights({
          severity: parseFloat(wSev.value),
          urgency: parseFloat(wUrg.value),
          peopleCount: parseFloat(wPpl.value),
          waitingTime: parseFloat(wWait.value)
        });

        this.runPriorityScoring();
        this.showNotification("success", "AI Priority scoring weights updated! All queues recalculated.");
        if (modal) modal.classList.add("hidden");
      });
    }
  }

  // --- Notification Toaster ---
  showNotification(type, message) {
    const container = document.getElementById("notificationContainer");
    if (!container) return;

    const toast = document.createElement("div");
    let bg = "bg-slate-800 border-indigo-500 text-white";
    let icon = "fa-circle-info text-indigo-400";

    if (type === "success") {
      bg = "bg-slate-900 border-emerald-500 text-emerald-100";
      icon = "fa-circle-check text-emerald-400";
    } else if (type === "warning") {
      bg = "bg-slate-900 border-amber-500 text-amber-100";
      icon = "fa-triangle-exclamation text-amber-400";
    } else if (type === "error") {
      bg = "bg-slate-900 border-rose-500 text-rose-100";
      icon = "fa-circle-xmark text-rose-400";
    }

    toast.className = `p-3 rounded-lg shadow-xl border flex items-start space-x-3 toast-enter max-w-md ${bg}`;
    toast.innerHTML = `
      <i class="fa-solid ${icon} mt-0.5 text-base flex-shrink-0"></i>
      <div class="text-xs font-medium leading-relaxed">${message}</div>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add("opacity-0", "transition-opacity", "duration-500");
      setTimeout(() => toast.remove(), 500);
    }, 4500);
  }

  addLog(category, details) {
    const timestamp = new Date().toLocaleTimeString();
    this.logs.unshift({ timestamp, category, details });
    if (this.logs.length > 50) this.logs.pop();
    this.renderAuditLogs();
  }

  renderAuditLogs() {
    const container = document.getElementById("systemAuditLogs");
    if (!container) return;

    container.innerHTML = this.logs.slice(0, 15).map(log => `
      <div class="py-1.5 border-b border-slate-800/80 text-xs flex items-start space-x-2">
        <span class="text-slate-500 font-mono text-[10px] flex-shrink-0">${log.timestamp}</span>
        <span class="px-1.5 py-0.2 rounded font-semibold text-[10px] bg-slate-800 text-indigo-300 border border-slate-700 flex-shrink-0">${log.category}</span>
        <span class="text-slate-300 truncate">${log.details}</span>
      </div>
    `).join("");
  }

  // --- Render Dashboard UI ---
  refreshDashboard() {
    this.renderKPIs();
    this.renderRequestsTable();
    this.renderResourceCards();
    this.renderAllocationsTable();
    this.updateCharts();

    if (window.disasterMapController.isMapReady) {
      window.disasterMapController.updateMarkers(this.requests, this.resources, this.allocations);
    }
  }

  renderKPIs() {
    const criticalCount = this.requests.filter(r => r.severity === "Critical").length;
    const highCount = this.requests.filter(r => r.severity === "High").length;
    const medLowCount = this.requests.filter(r => r.severity === "Medium" || r.severity === "Low").length;
    const totalPeople = this.requests.reduce((acc, r) => acc + (r.peopleCount || 0), 0);
    const allocatedCount = this.requests.filter(r => r.status === "Assigned" || r.status === "Delivered" || r.status === "Completed").length;
    const totalReqs = this.requests.length;
    const fulfillmentPercent = totalReqs > 0 ? Math.round((allocatedCount / totalReqs) * 100) : 0;

    const elCrit = document.getElementById("kpiCriticalCount");
    const elHigh = document.getElementById("kpiHighCount");
    const elMedLow = document.getElementById("kpiMedLowCount");
    const elPeople = document.getElementById("kpiPeopleCount");
    const elFulfill = document.getElementById("kpiFulfillmentRate");
    const elActiveAlloc = document.getElementById("kpiActiveAllocations");

    if (elCrit) elCrit.textContent = criticalCount;
    if (elHigh) elHigh.textContent = highCount;
    if (elMedLow) elMedLow.textContent = medLowCount;
    if (elPeople) elPeople.textContent = `${totalPeople} Persons`;
    if (elFulfill) elFulfill.textContent = `${fulfillmentPercent}%`;
    if (elActiveAlloc) elActiveAlloc.textContent = this.allocations.length;
  }

  renderRequestsTable() {
    const tbody = document.getElementById("requestsTableBody");
    if (!tbody) return;

    let filtered = [...this.requests];

    if (this.currentFilter !== "ALL") {
      filtered = filtered.filter(r => {
        if (this.currentFilter === "CRITICAL") return r.severity === "Critical";
        if (this.currentFilter === "PENDING") return r.status === "Pending" || r.status === "Synced";
        if (this.currentFilter === "ALLOCATED") return r.status === "Assigned" || r.status === "Partially Allocated";
        return true;
      });
    }

    if (this.searchQuery) {
      filtered = filtered.filter(r => 
        r.id.toLowerCase().includes(this.searchQuery) ||
        r.locationName.toLowerCase().includes(this.searchQuery) ||
        r.emergencyType.toLowerCase().includes(this.searchQuery) ||
        r.requiredResource.toLowerCase().includes(this.searchQuery)
      );
    }

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center py-6 text-slate-500 text-xs">No emergency requests match current filters.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(req => {
      let sevBadge = `badge-low`;
      if (req.severity === "Critical") sevBadge = "badge-critical font-bold";
      else if (req.severity === "High") sevBadge = "badge-high font-bold";
      else if (req.severity === "Medium") sevBadge = "badge-medium";

      let statusBadge = "bg-slate-800 text-slate-300";
      if (req.status === "Pending") statusBadge = "bg-amber-950/60 text-amber-300 border border-amber-500/40";
      else if (req.status === "Assigned") statusBadge = "bg-indigo-950/60 text-indigo-300 border border-indigo-500/40";
      else if (req.status === "Partially Allocated") statusBadge = "bg-purple-950/60 text-purple-300 border border-purple-500/40";
      else if (req.status === "Delivered" || req.status === "Completed") statusBadge = "bg-emerald-950/60 text-emerald-300 border border-emerald-500/40";
      else if (req.status === "Offline Pending") statusBadge = "bg-rose-950/60 text-rose-300 border border-rose-500/40";

      return `
        <tr class="border-b border-slate-800 hover:bg-slate-800/40 transition-colors text-xs">
          <td class="py-2.5 px-3 font-mono font-bold text-white flex items-center space-x-1.5">
            <button onclick="window.disasterMapController.flyToRequest('${req.id}')" title="Zoom on Map" class="text-indigo-400 hover:text-indigo-200">
              <i class="fa-solid fa-location-crosshairs mr-1"></i>
            </button>
            <span>${req.id}</span>
          </td>
          <td class="py-2.5 px-3">
            <div class="font-semibold text-slate-200">${req.emergencyType}</div>
            <div class="text-[11px] text-slate-400">${req.locationName}</div>
          </td>
          <td class="py-2.5 px-3">
            <span class="px-2 py-0.5 rounded-full text-[11px] ${sevBadge}">${req.severity}</span>
          </td>
          <td class="py-2.5 px-3 font-semibold text-slate-300">${req.peopleCount}</td>
          <td class="py-2.5 px-3">
            <span class="font-medium text-slate-200">${req.quantity} ${req.unit}</span>
            <div class="text-[10px] text-slate-400">${req.requiredResource}</div>
          </td>
          <td class="py-2.5 px-3">
            <span class="px-2 py-0.5 rounded font-mono font-bold bg-indigo-900/50 text-indigo-300 border border-indigo-700/50" title="${req.scoreDetails ? req.scoreDetails.explanation : ''}">
              ${req.priorityScore || '—'}
            </span>
          </td>
          <td class="py-2.5 px-3">
            <span class="px-2 py-0.5 rounded text-[11px] font-medium ${statusBadge}">${req.status}</span>
            ${req.unmetQuantity > 0 && req.status === "Partially Allocated" ? `<div class="text-[10px] text-rose-400 mt-0.5">Unmet: ${req.unmetQuantity}</div>` : ''}
          </td>
          <td class="py-2.5 px-3 text-right">
            ${req.status === 'Pending' || req.status === 'Synced' ? `
              <button onclick="window.app.quickAllocate('${req.id}')" class="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium shadow-sm transition">
                Match
              </button>
            ` : `
              <span class="text-slate-500 text-[11px]">${req.assignedDepot || 'Dispatched'}</span>
            `}
          </td>
        </tr>
      `;
    }).join("");
  }

  renderResourceCards() {
    const container = document.getElementById("resourceCardsContainer");
    if (!container) return;

    container.innerHTML = this.resources.map(res => {
      const isAvailable = res.status === "Available";
      const percentLeft = Math.round((res.availableQuantity / res.totalCapacity) * 100);
      let barColor = "bg-emerald-500";
      if (percentLeft < 20) barColor = "bg-rose-500";
      else if (percentLeft < 50) barColor = "bg-amber-500";

      return `
        <div class="glass-card p-3 rounded-xl border border-slate-700/60 relative overflow-hidden">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center space-x-2">
              <div class="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                <i class="fa-solid ${RESOURCE_ICONS[res.resourceType] || 'fa-boxes-stacked'} text-sm"></i>
              </div>
              <div>
                <h4 class="font-bold text-xs text-white truncate max-w-[170px]">${res.name}</h4>
                <p class="text-[11px] text-slate-400">${res.resourceType}</p>
              </div>
            </div>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold ${isAvailable ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}">
              ${res.status}
            </span>
          </div>

          <div class="space-y-1.5 my-2 text-xs">
            <div class="flex justify-between text-slate-400 text-[11px]">
              <span>Available Stock:</span>
              <span class="font-bold text-white">${res.availableQuantity} / ${res.totalCapacity} ${res.unit}</span>
            </div>
            <div class="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div class="${barColor} h-1.5 rounded-full transition-all duration-500" style="width: ${percentLeft}%"></div>
            </div>
            <div class="flex justify-between text-[10px] text-slate-500">
              <span>Location: ${res.locationName}</span>
              <span>${percentLeft}% stock left</span>
            </div>
          </div>

          <div class="pt-2 border-t border-slate-800 flex items-center justify-between">
            <button onclick="window.disasterMapController.flyToDepot('${res.id}')" class="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
              <i class="fa-solid fa-map-pin mr-1"></i> Locate
            </button>
            <button onclick="window.app.toggleDepotStatus('${res.id}')" class="text-xs px-2 py-0.5 rounded font-semibold ${isAvailable ? 'bg-rose-950/80 text-rose-400 hover:bg-rose-900 border border-rose-700/50' : 'bg-emerald-950/80 text-emerald-400 hover:bg-emerald-900 border border-emerald-700/50'}">
              ${isAvailable ? 'Simulate Outage' : 'Restore'}
            </button>
          </div>
        </div>
      `;
    }).join("");
  }

  renderAllocationsTable() {
    const tbody = document.getElementById("allocationsTableBody");
    if (!tbody) return;

    if (this.allocations.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center py-6 text-slate-500 text-xs">No active resource dispatches. Click 'Optimize Allocation' to generate matches.</td></tr>`;
      return;
    }

    tbody.innerHTML = this.allocations.map(alloc => `
      <tr class="border-b border-slate-800 hover:bg-slate-800/40 text-xs">
        <td class="py-2.5 px-3 font-mono font-bold text-indigo-400">${alloc.allocationId}</td>
        <td class="py-2.5 px-3 font-mono text-white">${alloc.requestId}</td>
        <td class="py-2.5 px-3 font-medium text-slate-200">${alloc.depotName}</td>
        <td class="py-2.5 px-3 font-semibold text-emerald-400">${alloc.allocatedQuantity} ${alloc.unit} ${alloc.resourceType}</td>
        <td class="py-2.5 px-3 text-slate-300">${alloc.distanceKm} km (ETA: ${alloc.etaMinutes}m)</td>
        <td class="py-2.5 px-3">
          <span class="px-2 py-0.5 rounded text-[11px] bg-blue-900/40 text-blue-300 border border-blue-600/40">${alloc.status}</span>
        </td>
        <td class="py-2.5 px-3 text-right">
          ${alloc.status !== 'Delivered' ? `
            <button onclick="window.app.markDelivered('${alloc.allocationId}')" class="px-2 py-1 text-[11px] rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium">
              Confirm Delivered
            </button>
          ` : `
            <span class="text-emerald-400 text-xs"><i class="fa-solid fa-check mr-1"></i> Fulfilled</span>
          `}
        </td>
      </tr>
    `).join("");
  }

  markDelivered(allocId) {
    const alloc = this.allocations.find(a => a.allocationId === allocId);
    if (!alloc) return;

    alloc.status = "Delivered";
    const req = this.requests.find(r => r.id === alloc.requestId);
    if (req) {
      req.status = "Delivered";
    }

    this.showNotification("success", `Allocation ${allocId} marked as DELIVERED to ${alloc.requestId}!`);
    this.refreshDashboard();
  }

  // --- Charts (Chart.js) ---
  initCharts() {
    const ctxSev = document.getElementById("severityChart")?.getContext("2d");
    if (ctxSev) {
      this.charts.severity = new Chart(ctxSev, {
        type: 'doughnut',
        data: {
          labels: ['Critical', 'High', 'Medium', 'Low'],
          datasets: [{
            data: [0, 0, 0, 0],
            backgroundColor: ['#ef4444', '#f97316', '#eab308', '#3b82f6'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 10 } } }
          },
          cutout: '70%'
        }
      });
    }

    const ctxRes = document.getElementById("resourcesChart")?.getContext("2d");
    if (ctxRes) {
      this.charts.resources = new Chart(ctxRes, {
        type: 'bar',
        data: {
          labels: ['Medicine', 'Food', 'Water', 'Boats', 'Shelters', 'Volunteers'],
          datasets: [
            {
              label: 'Available Stock',
              data: [0, 0, 0, 0, 0, 0],
              backgroundColor: '#10b981',
              borderRadius: 4
            },
            {
              label: 'Allocated Stock',
              data: [0, 0, 0, 0, 0, 0],
              backgroundColor: '#6366f1',
              borderRadius: 4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { stacked: true, ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { display: false } },
            y: { stacked: true, ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { color: '#1e293b' } }
          },
          plugins: {
            legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 10 } } }
          }
        }
      });
    }
  }

  updateCharts() {
    if (this.charts.severity) {
      const crit = this.requests.filter(r => r.severity === "Critical").length;
      const high = this.requests.filter(r => r.severity === "High").length;
      const med = this.requests.filter(r => r.severity === "Medium").length;
      const low = this.requests.filter(r => r.severity === "Low").length;
      this.charts.severity.data.datasets[0].data = [crit, high, med, low];
      this.charts.severity.update();
    }

    if (this.charts.resources) {
      const types = ['Medicine', 'Food Packets', 'Drinking Water', 'Rescue Boat', 'Shelter Kits', 'Volunteer Team'];
      const avail = types.map(t => {
        return this.resources.filter(r => r.resourceType === t && r.status === "Available")
          .reduce((sum, r) => sum + r.availableQuantity, 0);
      });
      const committed = types.map(t => {
        return this.resources.filter(r => r.resourceType === t)
          .reduce((sum, r) => sum + (r.allocatedQuantity || 0), 0);
      });

      this.charts.resources.data.datasets[0].data = avail;
      this.charts.resources.data.datasets[1].data = committed;
      this.charts.resources.update();
    }
  }
}

// Global instance
window.app = new DisasterResponseApp();
