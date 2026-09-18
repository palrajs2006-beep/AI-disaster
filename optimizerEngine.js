/**
 * AI Disaster Response Resource Optimizer - Optimization & Matching Engine
 * Implements Section 10: "Resource Optimization Plan"
 * Handles nearest-neighbor matching, capacity limits, partial fulfillment, and dynamic reallocation.
 */

class ResourceOptimizer {
  constructor() {
    this.allocationCounter = 100;
  }

  /**
   * Calculate distance between two lat/lng coordinates in kilometers (Haversine formula)
   */
  calculateDistanceKm(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 5.0; // fallback
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return Number(d.toFixed(2));
  }

  /**
   * Estimate dispatch transit time in minutes based on disaster terrain (average 25 km/h)
   */
  calculateEtaMinutes(distanceKm) {
    const avgDisasterSpeedKmh = 25;
    const hours = distanceKm / avgDisasterSpeedKmh;
    return Math.max(5, Math.round(hours * 60));
  }

  /**
   * Run matching and allocation over all prioritized pending requests
   * @param {Array} requests - Prioritized list of requests
   * @param {Array} resources - Available resources array
   * @returns {Object} { updatedRequests, updatedResources, newAllocations, logs, unmetDemands }
   */
  runAllocation(requests, resources) {
    // Clone states to preserve purity during calculation
    const currentRequests = JSON.parse(JSON.stringify(requests));
    const currentResources = JSON.parse(JSON.stringify(resources));
    const newAllocations = [];
    const logs = [];
    const unmetDemands = [];

    // Filter requests that are eligible for allocation
    // Only 'Pending', 'Offline Pending' (if synced), or 'Partially Allocated' with remaining unmet quantity
    const eligibleRequests = currentRequests.filter(r => 
      r.status === "Pending" || 
      r.status === "Synced" || 
      (r.status === "Partially Allocated" && r.unmetQuantity > 0)
    );

    logs.push(`Starting allocation cycle for ${eligibleRequests.length} candidate requests...`);

    eligibleRequests.forEach(req => {
      const neededQty = req.status === "Partially Allocated" ? req.unmetQuantity : req.quantity;
      if (neededQty <= 0) return;

      // Find candidate resources matching type and availability
      const candidates = currentResources.filter(res => 
        res.resourceType === req.requiredResource &&
        res.status === "Available" &&
        res.availableQuantity > 0
      );

      if (candidates.length === 0) {
        logs.push(`[DEFICIT] No available depot for ${req.requiredResource} (Request ${req.id}). Placed on Waitlist.`);
        if (req.status !== "Partially Allocated") {
          req.status = "Waitlist - Out of Stock";
        }
        unmetDemands.push({
          requestId: req.id,
          emergencyType: req.emergencyType,
          resourceType: req.requiredResource,
          unmetQuantity: neededQty,
          reason: "No available inventory in any depot"
        });
        return;
      }

      // Calculate distance to each candidate and sort closest first
      candidates.forEach(cand => {
        cand._tempDist = this.calculateDistanceKm(req.lat, req.lng, cand.lat, cand.lng);
      });
      candidates.sort((a, b) => a._tempDist - b._tempDist);

      const bestDepot = candidates[0];
      const distance = bestDepot._tempDist;
      const eta = this.calculateEtaMinutes(distance);

      // Check stock availability (Full vs. Partial Allocation)
      if (bestDepot.availableQuantity >= neededQty) {
        // FULL ALLOCATION
        bestDepot.availableQuantity -= neededQty;
        bestDepot.allocatedQuantity = (bestDepot.allocatedQuantity || 0) + neededQty;

        const allocId = `ALC-${++this.allocationCounter}`;
        const allocation = {
          allocationId: allocId,
          requestId: req.id,
          resourceId: bestDepot.id,
          depotName: bestDepot.name,
          resourceType: req.requiredResource,
          allocatedQuantity: neededQty,
          unmetQuantity: 0,
          unit: req.unit,
          distanceKm: distance,
          etaMinutes: eta,
          assignedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: "Assigned",
          route: {
            from: [bestDepot.lat, bestDepot.lng],
            to: [req.lat, req.lng]
          }
        };

        newAllocations.push(allocation);
        req.allocatedQuantity = (req.allocatedQuantity || 0) + neededQty;
        req.unmetQuantity = 0;
        req.status = "Assigned";
        req.allocationId = allocId;
        req.assignedDepot = bestDepot.name;

        logs.push(`[MATCH] ${req.id} (Priority: ${req.priorityScore || 'High'}) matched with ${bestDepot.name}. Full ${neededQty} ${req.unit} allocated (${distance} km, ETA: ${eta}m).`);

      } else {
        // PARTIAL ALLOCATION (Section 10: "Track partial fulfillment when demand exceeds available quantity")
        const partialQty = bestDepot.availableQuantity;
        const remainingUnmet = neededQty - partialQty;

        bestDepot.availableQuantity = 0;
        bestDepot.allocatedQuantity = (bestDepot.allocatedQuantity || 0) + partialQty;

        const allocId = `ALC-${++this.allocationCounter}`;
        const allocation = {
          allocationId: allocId,
          requestId: req.id,
          resourceId: bestDepot.id,
          depotName: bestDepot.name,
          resourceType: req.requiredResource,
          allocatedQuantity: partialQty,
          unmetQuantity: remainingUnmet,
          unit: req.unit,
          distanceKm: distance,
          etaMinutes: eta,
          assignedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: "Assigned (Partial)",
          route: {
            from: [bestDepot.lat, bestDepot.lng],
            to: [req.lat, req.lng]
          }
        };

        newAllocations.push(allocation);
        req.allocatedQuantity = (req.allocatedQuantity || 0) + partialQty;
        req.unmetQuantity = remainingUnmet;
        req.status = "Partially Allocated";
        req.allocationId = allocId;
        req.assignedDepot = bestDepot.name;

        unmetDemands.push({
          requestId: req.id,
          emergencyType: req.emergencyType,
          resourceType: req.requiredResource,
          unmetQuantity: remainingUnmet,
          reason: `Depot ${bestDepot.name} reached capacity. ${partialQty} fulfilled, ${remainingUnmet} remaining.`
        });

        logs.push(`[PARTIAL ALLOCATION] ${req.id} requested ${neededQty} ${req.unit}. ${bestDepot.name} only had ${partialQty}. Allocated ${partialQty}, ${remainingUnmet} unmet demand tracked.`);
      }
    });

    return {
      updatedRequests: currentRequests,
      updatedResources: currentResources,
      newAllocations,
      logs,
      unmetDemands
    };
  }

  /**
   * Reallocation Routine (Section 10 & 15)
   * Triggered when:
   * 1. A sudden critical request arrives and scarce resources must be reassigned.
   * 2. An active resource depot becomes flooded/unavailable.
   */
  handleResourceDisruption(depotId, requests, resources, activeAllocations) {
    const logs = [];
    const updatedResources = resources.map(res => {
      if (res.id === depotId) {
        logs.push(`[ALERT] Depot ${res.name} marked UNAVAILABLE due to road inundation/damage.`);
        return { ...res, status: "Unavailable" };
      }
      return res;
    });

    // Find affected allocations
    const affectedAllocations = activeAllocations.filter(a => a.resourceId === depotId && a.status !== "Delivered");
    logs.push(`Found ${affectedAllocations.length} active dispatches impacted by ${depotId} disruption.`);

    // Reset affected requests to Pending so they can be immediately re-matched with backup depots
    const updatedRequests = requests.map(req => {
      const wasAssignedToDisrupted = affectedAllocations.some(a => a.requestId === req.id);
      if (wasAssignedToDisrupted) {
        logs.push(`[REALLOCATE] Request ${req.id} released from disrupted depot. Re-entering matching queue.`);
        return {
          ...req,
          status: "Pending",
          allocationId: null,
          assignedDepot: null,
          allocatedQuantity: 0,
          unmetQuantity: req.quantity
        };
      }
      return req;
    });

    const remainingAllocations = activeAllocations.filter(a => a.resourceId !== depotId);

    return {
      updatedRequests,
      updatedResources,
      remainingAllocations,
      disruptedCount: affectedAllocations.length,
      logs
    };
  }
}

// Global instance
window.resourceOptimizer = new ResourceOptimizer();
