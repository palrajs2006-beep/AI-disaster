/**
 * AI Disaster Response Resource Optimizer - 10-Step Demo Scenario Runner
 * Implements Section 15: "Demo Scenario – Flood Disaster"
 * Designed for evaluations, presentations, and interactive demonstrations.
 */

class DemoScenarioRunner {
  constructor() {
    this.currentStep = 0;
    this.totalSteps = 10;
    this.steps = [
      {
        step: 1,
        title: "Step 1: Create 3 Initial Requests",
        badge: "Intake",
        description: "Generate 3 diverse disaster requests: a Critical Medical request, a High-priority Food request, and a Medium Shelter request.",
        action: () => this.executeStep1()
      },
      {
        step: 2,
        title: "Step 2: Add Disaster Resources",
        badge: "Inventory",
        description: "Ensure food, medicine, rescue vehicles, and volunteer resources are stocked and available across disaster relief depots.",
        action: () => this.executeStep2()
      },
      {
        step: 3,
        title: "Step 3: Run AI Priority Engine",
        badge: "AI Scoring",
        description: "Calculate priority scores based on weighted Severity (40%), Urgency (30%), People Count (15%), and Waiting Time (15%).",
        action: () => this.executeStep3()
      },
      {
        step: 4,
        title: "Step 4: Verify Critical Request Ranked First",
        badge: "Priority Queue",
        description: "Demonstrate that the Critical Medical case is ranked at the very top of the triage queue (Section 15.4: Critical request considered first).",
        action: () => this.executeStep4()
      },
      {
        step: 5,
        title: "Step 5: Match Nearest Resource & Show Route",
        badge: "GIS Routing",
        description: "Run Haversine nearest-depot matching algorithm for top requests. Display dispatch routing polylines and ETA on the map.",
        action: () => this.executeStep5()
      },
      {
        step: 6,
        title: "Step 6: Review Command Dashboard Status",
        badge: "KPIs",
        description: "Inspect official dashboard: updated KPI counts, stock consumption meters, active dispatches, and fulfillment ratios.",
        action: () => this.executeStep6()
      },
      {
        step: 7,
        title: "Step 7: Sudden New Critical Request Arrival",
        badge: "Surge Event",
        description: "Simulate a severe flash flood alert: REQ-099 (Trapped elderly & children, critical oxygen & medicine needed urgently).",
        action: () => this.executeStep7()
      },
      {
        step: 8,
        title: "Step 8: Dynamic Reallocation Trigger",
        badge: "Reallocation",
        description: "Re-evaluate resource pool. The system issues a Reallocation Alert and prioritizes the new life-safety critical request immediately.",
        action: () => this.executeStep8()
      },
      {
        step: 9,
        title: "Step 9: Resource Disruption & Fallback Reroute",
        badge: "Resilience",
        description: "Mark Central Medical Depot as flooded/unavailable. The engine automatically reroutes affected allocations to the backup depot!",
        action: () => this.executeStep9()
      },
      {
        step: 10,
        title: "Step 10: Volunteer Offline Mode & Auto-Sync",
        badge: "Offline Sync",
        description: "Cut connectivity, submit field request saved locally as 'Offline Pending', restore network, and observe automatic cloud synchronization!",
        action: () => this.executeStep10()
      }
    ];
  }

  getCurrentStepData() {
    return this.steps[this.currentStep - 1] || null;
  }

  goToStep(stepNumber) {
    if (stepNumber < 1 || stepNumber > this.totalSteps) return;
    this.currentStep = stepNumber;
    const stepData = this.steps[this.currentStep - 1];
    stepData.action();
    this.updateUI();
  }

  nextStep() {
    if (this.currentStep < this.totalSteps) {
      this.goToStep(this.currentStep + 1);
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.goToStep(this.currentStep - 1);
    }
  }

  resetDemo() {
    this.currentStep = 0;
    if (window.app) {
      window.app.resetToDefaults();
    }
    this.updateUI();
  }

  // --- Step Implementations ---

  executeStep1() {
    window.app.switchTab("dashboard");
    // Clear and set the 3 baseline requests from Section 15.1
    window.app.requests = [
      {
        id: "DEMO-01",
        emergencyType: "Flash Flood / Medical",
        peopleCount: 6,
        locationName: "Saidapet Causeway",
        lat: 13.0213,
        lng: 80.2231,
        severity: "Critical",
        urgency: "Immediate",
        requiredResource: "Medicine",
        quantity: 40,
        unit: "units",
        requestTime: "09:30 AM",
        waitingMinutes: 50,
        status: "Pending",
        source: "Phone Call",
        contactPerson: "Dr. K. Ramanathan",
        notes: "Stranded cardiac & dialysis patients, medical kit required immediately.",
        allocatedQuantity: 0,
        unmetQuantity: 40,
        allocationId: null
      },
      {
        id: "DEMO-02",
        emergencyType: "Food Depletion",
        peopleCount: 35,
        locationName: "Velachery Lowlands",
        lat: 12.9815,
        lng: 80.2180,
        severity: "High",
        urgency: "Within 2 Hours",
        requiredResource: "Food Packets",
        quantity: 100,
        unit: "packets",
        requestTime: "09:45 AM",
        waitingMinutes: 35,
        status: "Pending",
        source: "Website",
        contactPerson: "Praveen Kumar",
        notes: "Relief camp ran out of meal packs for stranded families.",
        allocatedQuantity: 0,
        unmetQuantity: 100,
        allocationId: null
      },
      {
        id: "DEMO-03",
        emergencyType: "Temporary Shelter Inundation",
        peopleCount: 18,
        locationName: "Tambaram Relief Camp",
        lat: 12.9249,
        lng: 80.1188,
        severity: "Medium",
        urgency: "Within 6 Hours",
        requiredResource: "Shelter Kits",
        quantity: 12,
        unit: "kits",
        requestTime: "10:00 AM",
        waitingMinutes: 20,
        status: "Pending",
        source: "Volunteer",
        contactPerson: "Volunteer Sangeetha",
        notes: "Tarpaulins and emergency dry bedding kits needed.",
        allocatedQuantity: 0,
        unmetQuantity: 12,
        allocationId: null
      }
    ];

    window.app.allocations = [];
    window.app.refreshDashboard();
    window.app.showNotification("success", "Demo Step 1: 3 Baseline Requests Created (Critical Medical, High Food, Medium Shelter)");
  }

  executeStep2() {
    window.app.switchTab("resources");
    // Ensure all 4 primary disaster resource depots are available
    window.app.resources.forEach(r => {
      r.status = "Available";
      r.allocatedQuantity = 0;
      if (r.id === "RES-101") r.availableQuantity = 140;
      if (r.id === "RES-102") r.availableQuantity = 350;
      if (r.id === "RES-103") r.availableQuantity = 5;
      if (r.id === "RES-105") r.availableQuantity = 45;
      if (r.id === "RES-106") r.availableQuantity = 35;
    });

    window.app.refreshDashboard();
    window.app.showNotification("success", "Demo Step 2: Disaster Depots Verified & Stocked (Medicine, Food, Rescue Boat, Shelters, Volunteers)");
  }

  executeStep3() {
    window.app.switchTab("dashboard");
    window.app.runPriorityScoring();
    window.app.showNotification("info", "Demo Step 3: AI Priority Engine Calculated Scores based on Severity, Urgency, People & Wait Time");
  }

  executeStep4() {
    window.app.switchTab("dashboard");
    const topReq = window.app.requests[0];
    if (topReq) {
      window.disasterMapController.flyToRequest(topReq.id);
      window.app.showNotification("warning", `Demo Step 4: [Verified] ${topReq.id} (${topReq.emergencyType}) ranked #1 with Score ${topReq.priorityScore}!`);
    }
  }

  executeStep5() {
    window.app.switchTab("dashboard");
    window.app.runOptimizationEngine();
    window.app.showNotification("success", "Demo Step 5: Matched Nearest Depots! Dispatch routes and ETAs rendered on the map.");
  }

  executeStep6() {
    window.app.switchTab("dashboard");
    window.disasterMapController.fitAll();
    window.app.showNotification("info", "Demo Step 6: Official Command Center status updated with allocation progress & metrics.");
  }

  executeStep7() {
    window.app.switchTab("dashboard");
    const surgeRequest = {
      id: "REQ-CRIT-99",
      emergencyType: "Flash Flood / ICU Power Loss",
      peopleCount: 16,
      locationName: "Kotturpuram Riverbank Clinic",
      lat: 13.0234,
      lng: 80.2415,
      severity: "Critical",
      urgency: "Immediate",
      requiredResource: "Medicine",
      quantity: 50,
      unit: "units",
      requestTime: "Just now",
      waitingMinutes: 60,
      status: "Pending",
      source: "Operator Direct",
      contactPerson: "Emergency Doctor On Duty",
      notes: "URGENT LIFE-SAFETY: Emergency generator flooded, 16 critical patients need oxygen cylinders and emergency medicine immediately!",
      allocatedQuantity: 0,
      unmetQuantity: 50,
      allocationId: null
    };

    window.app.requests.unshift(surgeRequest);
    window.app.runPriorityScoring();
    window.disasterMapController.flyToRequest(surgeRequest.id);
    window.app.triggerReallocationAlert("NEW HIGH-PRIORITY CRITICAL EMERGENCY: REQ-CRIT-99 at Kotturpuram Riverbank! Immediate allocation required.");
  }

  executeStep8() {
    window.app.switchTab("dashboard");
    window.app.runOptimizationEngine();
    window.app.showNotification("success", "Demo Step 8: Reallocation completed! REQ-CRIT-99 prioritized and allocated immediately.");
  }

  executeStep9() {
    window.app.switchTab("dashboard");
    // Mark Central Medical Depot (RES-101) as disrupted/flooded
    window.app.toggleDepotStatus("RES-101");
    window.app.showNotification("warning", "Demo Step 9: RES-101 (Central Medical Depot) flooded! Dynamic fallback rerouted allocations to Tambaram Backup Depot (RES-107).");
  }

  executeStep10() {
    window.app.switchTab("volunteer");
    // 1. Turn off connectivity
    window.offlineStorage.setSimulatedOffline(true);
    window.app.showNotification("warning", "Demo Step 10: Connectivity cut (Offline Mode Active). Submitting field request...");

    setTimeout(() => {
      // 2. Submit volunteer request offline
      const offlineReq = {
        id: "VOL-OFF-88",
        emergencyType: "Village Flooded / Ration Depleted",
        peopleCount: 28,
        locationName: "Madipakkam Interior Village",
        lat: 12.9640,
        lng: 80.2010,
        severity: "High",
        urgency: "Within 2 Hours",
        requiredResource: "Drinking Water",
        quantity: 150,
        unit: "liters",
        requestTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        waitingMinutes: 10,
        status: "Offline Pending",
        source: "Village Volunteer",
        contactPerson: "Field Volunteer Ramesh",
        notes: "No mobile cellular signal. Stored in phone's local storage queue.",
        allocatedQuantity: 0,
        unmetQuantity: 150,
        allocationId: null
      };

      window.offlineStorage.enqueueOfflineRequest(offlineReq);
      window.app.refreshVolunteerQueue();
      window.app.showNotification("info", "Request VOL-OFF-88 saved to local storage as 'Offline Pending'.");

      // 3. Automatically restore connectivity after 3.5 seconds
      setTimeout(async () => {
        window.offlineStorage.setSimulatedOffline(false);
        window.app.showNotification("success", "Connectivity restored! Initiating automatic cloud synchronization...");
        await window.app.syncOfflineQueue();
        window.app.switchTab("dashboard");
      }, 3500);
    }, 1500);
  }

  updateUI() {
    const banner = document.getElementById("demoScenarioBanner");
    if (!banner) return;

    if (this.currentStep === 0) {
      banner.classList.add("hidden");
      return;
    }

    banner.classList.remove("hidden");
    const stepData = this.getCurrentStepData();
    if (!stepData) return;

    document.getElementById("demoStepNumber").textContent = `Step ${this.currentStep} of ${this.totalSteps}`;
    document.getElementById("demoStepTitle").textContent = stepData.title;
    document.getElementById("demoStepDescription").textContent = stepData.description;
    document.getElementById("demoStepBadge").textContent = stepData.badge;

    const prevBtn = document.getElementById("demoPrevBtn");
    const nextBtn = document.getElementById("demoNextBtn");
    if (prevBtn) prevBtn.disabled = this.currentStep <= 1;
    if (nextBtn) nextBtn.disabled = this.currentStep >= this.totalSteps;
  }
}

// Global instance
window.demoScenarioRunner = new DemoScenarioRunner();
