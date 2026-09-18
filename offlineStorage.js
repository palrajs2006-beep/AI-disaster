/**
 * AI Disaster Response Resource Optimizer - Offline Storage & Sync Engine
 * Implements Section 3: "Offline Mode" & Section 13: "Risk Management - No Network Signal"
 */

class OfflineStorageEngine {
  constructor() {
    this.STORAGE_KEY = "agy_disaster_offline_queue";
    this.isSimulatedOffline = false;
    this.listeners = [];
    this.init();
  }

  init() {
    // Listen to actual browser network events as well
    window.addEventListener("online", () => this.handleNetworkChange(true));
    window.addEventListener("offline", () => this.handleNetworkChange(false));
  }

  isOnline() {
    if (this.isSimulatedOffline) return false;
    return navigator.onLine !== undefined ? navigator.onLine : true;
  }

  toggleSimulatedOffline() {
    this.isSimulatedOffline = !this.isSimulatedOffline;
    this.notifyNetworkStateChange();
    return this.isOnline();
  }

  setSimulatedOffline(offlineState) {
    this.isSimulatedOffline = offlineState;
    this.notifyNetworkStateChange();
  }

  handleNetworkChange(isOnline) {
    this.notifyNetworkStateChange();
    if (isOnline && !this.isSimulatedOffline) {
      this.syncPendingRequests();
    }
  }

  onNetworkChange(callback) {
    this.listeners.push(callback);
  }

  notifyNetworkStateChange() {
    const online = this.isOnline();
    this.listeners.forEach(cb => {
      try {
        cb(online);
      } catch (e) {
        console.error("Error in network listener:", e);
      }
    });
  }

  getQueue() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Failed to read offline queue from localStorage", e);
      return [];
    }
  }

  saveQueue(queue) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.error("Failed to save offline queue to localStorage", e);
    }
  }

  /**
   * Save a volunteer request locally when offline
   */
  enqueueOfflineRequest(requestData) {
    const queue = this.getQueue();
    const offlineItem = {
      ...requestData,
      status: "Offline Pending",
      offlineTimestamp: new Date().toISOString(),
      offlineLocalId: `OFF-${Date.now()}`
    };
    queue.push(offlineItem);
    this.saveQueue(queue);
    return offlineItem;
  }

  getPendingCount() {
    return this.getQueue().length;
  }

  /**
   * Synchronize pending requests when connectivity returns
   * Returns a Promise resolving to synced items array
   */
  async syncPendingRequests(onProgress) {
    const queue = this.getQueue();
    if (queue.length === 0) {
      return { count: 0, syncedItems: [] };
    }

    if (!this.isOnline()) {
      throw new Error("Cannot sync while offline. Please restore connectivity first.");
    }

    const syncedItems = [];
    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      if (onProgress) onProgress(i + 1, queue.length, item);
      // Small simulated round-trip network delay
      await new Promise(r => setTimeout(r, 400));

      const syncedItem = {
        ...item,
        status: "Synced",
        syncedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      syncedItems.push(syncedItem);
    }

    // Clear queue after successful synchronization
    this.saveQueue([]);
    return { count: syncedItems.length, syncedItems };
  }

  clearQueue() {
    this.saveQueue([]);
  }
}

// Global instance
window.offlineStorage = new OfflineStorageEngine();
