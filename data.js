/**
 * AI Disaster Response Resource Optimizer - Synthetic Dataset & Config
 * Based on Section 4, 10, and 11 of the project specification.
 * Region: Flood Disaster Zone (Velachery - Saidapet - Tambaram Flood Basin, Tamil Nadu)
 */

const INITIAL_REQUESTS = [
  {
    id: "REQ-001",
    emergencyType: "Flood / Medical",
    peopleCount: 5,
    locationName: "Saidapet Bridge Colony",
    lat: 13.0213,
    lng: 80.2231,
    severity: "Critical",
    urgency: "Immediate",
    requiredResource: "Medicine",
    quantity: 50,
    unit: "units",
    requestTime: "10:30 AM",
    waitingMinutes: 45,
    status: "Pending",
    source: "Phone Call",
    contactPerson: "Dr. K. Ramanathan",
    notes: "3 diabetic elderly patients stranded on second floor, insulin and first-aid kits required urgently.",
    allocatedQuantity: 0,
    unmetQuantity: 50,
    allocationId: null
  },
  {
    id: "REQ-002",
    emergencyType: "Flash Flood / Stranded",
    peopleCount: 14,
    locationName: "Velachery Lakeview Sector",
    lat: 12.9815,
    lng: 80.2180,
    severity: "Critical",
    urgency: "Immediate",
    requiredResource: "Rescue Boat",
    quantity: 2,
    unit: "boats",
    requestTime: "10:35 AM",
    waitingMinutes: 40,
    status: "Pending",
    source: "Website",
    contactPerson: "Praveen Kumar",
    notes: "Ground floor completely submerged, water level rising. 4 children and 2 pregnant women trapped.",
    allocatedQuantity: 0,
    unmetQuantity: 2,
    allocationId: null
  },
  {
    id: "REQ-003",
    emergencyType: "Food Depletion",
    peopleCount: 45,
    locationName: "Madipakkam Relief Pocket",
    lat: 12.9623,
    lng: 80.1986,
    severity: "High",
    urgency: "Within 2 Hours",
    requiredResource: "Food Packets",
    quantity: 120,
    unit: "packets",
    requestTime: "10:40 AM",
    waitingMinutes: 35,
    status: "Pending",
    source: "Volunteer",
    contactPerson: "Volunteer Sangeetha",
    notes: "Community hall serving 45 evacuated residents has run out of food provisions since morning.",
    allocatedQuantity: 0,
    unmetQuantity: 120,
    allocationId: null
  },
  {
    id: "REQ-004",
    emergencyType: "Shelter Submerged",
    peopleCount: 22,
    locationName: "Tambaram West Lowlands",
    lat: 12.9249,
    lng: 80.1188,
    severity: "High",
    urgency: "Within 2 Hours",
    requiredResource: "Shelter Kits",
    quantity: 15,
    unit: "kits",
    requestTime: "10:45 AM",
    waitingMinutes: 30,
    status: "Pending",
    source: "SMS",
    contactPerson: "Anand Murugan",
    notes: "Makeshift temporary tents flooded. Need emergency tarps, blankets, and dry bedding.",
    allocatedQuantity: 0,
    unmetQuantity: 15,
    allocationId: null
  },
  {
    id: "REQ-005",
    emergencyType: "Drinking Water Contamination",
    peopleCount: 65,
    locationName: "Perungudi OMR Junction",
    lat: 12.9654,
    lng: 80.2461,
    severity: "Medium",
    urgency: "Within 6 Hours",
    requiredResource: "Drinking Water",
    quantity: 250,
    unit: "liters",
    requestTime: "10:50 AM",
    waitingMinutes: 25,
    status: "Pending",
    source: "Website",
    contactPerson: "Meena Swaminathan",
    notes: "Local borewell flooded with dirty runoff water. No potable water available.",
    allocatedQuantity: 0,
    unmetQuantity: 250,
    allocationId: null
  },
  {
    id: "REQ-006",
    emergencyType: "Elderly & Vulnerable Care",
    peopleCount: 8,
    locationName: "Kotturpuram Riverbank",
    lat: 13.0234,
    lng: 80.2415,
    severity: "High",
    urgency: "Immediate",
    requiredResource: "Volunteer Team",
    quantity: 4,
    unit: "volunteers",
    requestTime: "10:55 AM",
    waitingMinutes: 20,
    status: "Pending",
    source: "Phone Call",
    contactPerson: "Rev. Father Joseph",
    notes: "Special physical assistance needed to carry 3 non-ambulatory elderly individuals to higher ground.",
    allocatedQuantity: 0,
    unmetQuantity: 4,
    allocationId: null
  },
  {
    id: "REQ-007",
    emergencyType: "Sanitation & Hygiene",
    peopleCount: 30,
    locationName: "Adyar Gandhi Nagar",
    lat: 13.0067,
    lng: 80.2575,
    severity: "Low",
    urgency: "Routine",
    requiredResource: "Medicine",
    quantity: 30,
    unit: "units",
    requestTime: "11:00 AM",
    waitingMinutes: 15,
    status: "Pending",
    source: "Website",
    contactPerson: "Deepak V.",
    notes: "Basic chlorine tablets and mosquito repellent coils for camp maintenance.",
    allocatedQuantity: 0,
    unmetQuantity: 30,
    allocationId: null
  }
];

const INITIAL_RESOURCES = [
  {
    id: "RES-101",
    name: "Central Disaster Medical Depot",
    resourceType: "Medicine",
    totalCapacity: 200,
    availableQuantity: 140,
    allocatedQuantity: 0,
    unit: "units",
    lat: 13.0418,
    lng: 80.2341,
    locationName: "T. Nagar Relief Hub",
    status: "Available",
    contact: "+91 98401 22334",
    lastUpdated: "Just now"
  },
  {
    id: "RES-102",
    name: "South Central Community Kitchen",
    resourceType: "Food Packets",
    totalCapacity: 500,
    availableQuantity: 350,
    allocatedQuantity: 0,
    unit: "packets",
    lat: 12.9930,
    lng: 80.2085,
    locationName: "Guindy Industrial Estate Base",
    status: "Available",
    contact: "+91 98402 33445",
    lastUpdated: "Just now"
  },
  {
    id: "RES-103",
    name: "NDRF Flood Rescue Boat Station",
    resourceType: "Rescue Boat",
    totalCapacity: 8,
    availableQuantity: 5,
    allocatedQuantity: 0,
    unit: "boats",
    lat: 12.9850,
    lng: 80.2520,
    locationName: "Thiruvanmiyur Coastal Base",
    status: "Available",
    contact: "+91 98403 44556",
    lastUpdated: "Just now"
  },
  {
    id: "RES-104",
    name: "Metro Clean Water Dispatch Hub",
    resourceType: "Drinking Water",
    totalCapacity: 1000,
    availableQuantity: 750,
    allocatedQuantity: 0,
    unit: "liters",
    lat: 13.0105,
    lng: 80.2150,
    locationName: "Saidapet Metro Yard",
    status: "Available",
    contact: "+91 98404 55667",
    lastUpdated: "Just now"
  },
  {
    id: "RES-105",
    name: "State Emergency Shelter Warehouse",
    resourceType: "Shelter Kits",
    totalCapacity: 80,
    availableQuantity: 45,
    allocatedQuantity: 0,
    unit: "kits",
    lat: 12.9360,
    lng: 80.1420,
    locationName: "Chromepet Central Depot",
    status: "Available",
    contact: "+91 98405 66778",
    lastUpdated: "Just now"
  },
  {
    id: "RES-106",
    name: "Youth Volunteer Brigade Camp",
    resourceType: "Volunteer Team",
    totalCapacity: 60,
    availableQuantity: 35,
    allocatedQuantity: 0,
    unit: "volunteers",
    lat: 13.0070,
    lng: 80.2360,
    locationName: "Anna University Relief Center",
    status: "Available",
    contact: "+91 98406 77889",
    lastUpdated: "Just now"
  },
  {
    id: "RES-107",
    name: "Tambaram Secondary Medical Depot",
    resourceType: "Medicine",
    totalCapacity: 100,
    availableQuantity: 60,
    allocatedQuantity: 0,
    unit: "units",
    lat: 12.9220,
    lng: 80.1250,
    locationName: "Tambaram Sanatorium Base",
    status: "Available",
    contact: "+91 98407 88990",
    lastUpdated: "Just now"
  }
];

const DEFAULT_WEIGHTS = {
  severity: 0.40,
  urgency: 0.30,
  peopleCount: 0.15,
  waitingTime: 0.15
};

const SEVERITY_SCORES = {
  "Critical": 100,
  "High": 70,
  "Medium": 40,
  "Low": 20
};

const URGENCY_SCORES = {
  "Immediate": 100,
  "Within 2 Hours": 75,
  "Within 6 Hours": 50,
  "Routine": 25
};

const RESOURCE_TYPES = [
  "Medicine",
  "Food Packets",
  "Drinking Water",
  "Rescue Boat",
  "Shelter Kits",
  "Volunteer Team"
];

const RESOURCE_ICONS = {
  "Medicine": "fa-kit-medical",
  "Food Packets": "fa-bowl-rice",
  "Drinking Water": "fa-bottle-water",
  "Rescue Boat": "fa-life-ring",
  "Shelter Kits": "fa-tents",
  "Volunteer Team": "fa-people-carry-box"
};
