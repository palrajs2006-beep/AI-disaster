/**
 * AI Disaster Response Resource Optimizer - AI Priority Engine
 * Implements Section 9: "AI Priority Plan"
 * Priority Score = weighted Severity + Urgency + People Count + Waiting Time
 */

class PriorityEngine {
  constructor(weights = DEFAULT_WEIGHTS) {
    this.weights = { ...weights };
  }

  setWeights(newWeights) {
    this.weights = { ...this.weights, ...newWeights };
    // Normalize weights to sum to 1.0 if needed
    const sum = this.weights.severity + this.weights.urgency + this.weights.peopleCount + this.weights.waitingTime;
    if (sum > 0 && Math.abs(sum - 1.0) > 0.01) {
      this.weights.severity /= sum;
      this.weights.urgency /= sum;
      this.weights.peopleCount /= sum;
      this.weights.waitingTime /= sum;
    }
  }

  getWeights() {
    return { ...this.weights };
  }

  /**
   * Calculate normalized score component for People Count (scale 0-100)
   * 1-5 people: 30-50, 6-20: 55-80, 21+: 85-100
   */
  computePeopleScore(peopleCount) {
    if (!peopleCount || peopleCount <= 0) return 10;
    const clamped = Math.min(peopleCount, 100);
    // Smooth logarithmic curve mapped to 0-100
    return Math.min(100, Math.round(25 + (Math.log10(clamped) / 2) * 75));
  }

  /**
   * Calculate normalized score component for Waiting Time in minutes (scale 0-100)
   * 0-15m: 20-40, 16-60m: 45-80, >60m: 85-100
   */
  computeWaitingScore(waitingMinutes) {
    if (!waitingMinutes || waitingMinutes <= 0) return 10;
    const score = Math.min(100, Math.round(15 + (waitingMinutes / 60) * 70));
    return score;
  }

  /**
   * Calculate Priority Score for a single request
   * Returns: { totalScore, breakdown: { severity, urgency, people, waiting } }
   */
  calculateScore(request) {
    // Check if there is an official manual override
    if (request.manualOverride && request.overrideScore !== undefined) {
      return {
        totalScore: Number(request.overrideScore.toFixed(1)),
        isOverridden: true,
        overrideReason: request.overrideReason || "Official Incident Commander Override",
        breakdown: {
          severity: 0,
          urgency: 0,
          people: 0,
          waiting: 0
        }
      };
    }

    const rawSeverity = SEVERITY_SCORES[request.severity] || 30;
    const rawUrgency = URGENCY_SCORES[request.urgency] || 25;
    const rawPeople = this.computePeopleScore(request.peopleCount);
    const rawWaiting = this.computeWaitingScore(request.waitingMinutes || 0);

    const weightedSev = rawSeverity * this.weights.severity;
    const weightedUrg = rawUrgency * this.weights.urgency;
    const weightedPpl = rawPeople * this.weights.peopleCount;
    const weightedWait = rawWaiting * this.weights.waitingTime;

    const totalScore = Number((weightedSev + weightedUrg + weightedPpl + weightedWait).toFixed(1));

    return {
      totalScore,
      isOverridden: false,
      breakdown: {
        raw: { severity: rawSeverity, urgency: rawUrgency, people: rawPeople, waiting: rawWaiting },
        weighted: {
          severity: Number(weightedSev.toFixed(1)),
          urgency: Number(weightedUrg.toFixed(1)),
          people: Number(weightedPpl.toFixed(1)),
          waiting: Number(weightedWait.toFixed(1))
        }
      },
      explanation: `Score ${totalScore}: Sev(${weightedSev.toFixed(1)}) + Urg(${weightedUrg.toFixed(1)}) + Ppl(${weightedPpl.toFixed(1)}) + Wait(${weightedWait.toFixed(1)})`
    };
  }

  /**
   * Score and sort all requests in descending priority order
   */
  rankRequests(requests) {
    return requests.map(req => {
      const scoreObj = this.calculateScore(req);
      return {
        ...req,
        priorityScore: scoreObj.totalScore,
        scoreDetails: scoreObj
      };
    }).sort((a, b) => {
      // 1. First by priorityScore desc
      if (b.priorityScore !== a.priorityScore) {
        return b.priorityScore - a.priorityScore;
      }
      // 2. Tie breaker: Waiting minutes desc
      return (b.waitingMinutes || 0) - (a.waitingMinutes || 0);
    });
  }
}

// Global instance
window.priorityEngine = new PriorityEngine();
