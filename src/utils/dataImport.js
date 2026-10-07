// Intelligent column name matching
const FIELD_ALIASES = {
  building: ["building", "building name", "site", "site name", "location name"],
  hall: ["hall", "hall name", "room", "data center"],
  location: ["location", "city", "site location"],
  racksPerRow: ["racks per row", "racks/row", "racks_per_row", "rack count", "racks"],
  aislePairs: ["aisle pairs", "aisle_pairs", "aisles", "aisle count"],
  coldAisleWidth: ["cold aisle width", "cold_aisle_width", "cold width", "ca width"],
  hotAisleWidth: ["hot aisle width", "hot_aisle_width", "hot width", "ha width"],
  pduCount: ["pdu count", "pdu_count", "pdus", "power distribution"],
  deskCols: ["desk columns", "desk_cols", "desks", "desk count"],
  faultCount: ["faults", "fault count", "faulted", "faulted racks", "faulted_racks"],
  utilization: ["utilization", "util", "capacity", "usage"],
};

function normalizeString(str) {
  return str?.toLowerCase().trim().replace(/[_\-\s]+/g, " ") || "";
}

function detectColumnMapping(headers) {
  const mapping = {};
  const normalized = headers.map(normalizeString);

  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    for (let i = 0; i < normalized.length; i++) {
      for (const alias of aliases) {
        if (normalized[i] === normalizeString(alias) || normalized[i].includes(normalizeString(alias))) {
          mapping[field] = headers[i];
          break;
        }
      }
      if (mapping[field]) break;
    }
  }

  return mapping;
}

function parseValue(value, field) {
  if (value === null || value === undefined || value === "") return null;

  const str = String(value).trim();

  // Numeric fields
  if (["racksPerRow", "aislePairs", "pduCount", "deskCols", "faultCount"].includes(field)) {
    const num = parseFloat(str);
    return isNaN(num) ? null : Math.max(0, Math.round(num));
  }

  // Float fields
  if (["coldAisleWidth", "hotAisleWidth", "utilization"].includes(field)) {
    const num = parseFloat(str);
    return isNaN(num) ? null : Math.max(0, num);
  }

  // String fields
  return str || null;
}

export function parseAndMapData(rawData, manualMapping) {
  if (!rawData || rawData.length === 0) {
    return { preview: [], errors: ["No data rows found"] };
  }

  const headers = Object.keys(rawData[0]);
  const autoMapping = detectColumnMapping(headers);
  const finalMapping = { ...autoMapping, ...manualMapping };

  const errors = [];
  const preview = [];

  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    const parsed = {};

    // Extract and validate required fields
    const building = parseValue(row[finalMapping.building], "building");
    const hall = parseValue(row[finalMapping.hall], "hall");

    if (!building || !hall) {
      errors.push(`Row ${i + 1}: Missing building or hall name`);
      continue;
    }

    parsed.building = building;
    parsed.hall = hall;
    parsed.location = parseValue(row[finalMapping.location], "location") || building;

    // Optional numeric fields with defaults
    parsed.racksPerRow = parseValue(row[finalMapping.racksPerRow], "racksPerRow") || 12;
    parsed.aislePairs = parseValue(row[finalMapping.aislePairs], "aislePairs") || 2;
    parsed.coldAisleWidth = parseValue(row[finalMapping.coldAisleWidth], "coldAisleWidth") || 1.4;
    parsed.hotAisleWidth = parseValue(row[finalMapping.hotAisleWidth], "hotAisleWidth") || 1.8;
    parsed.pduCount = parseValue(row[finalMapping.pduCount], "pduCount") || 8;
    parsed.deskCols = parseValue(row[finalMapping.deskCols], "deskCols") || 2;

    // Dynamic data (optional)
    parsed.faultCount = parseValue(row[finalMapping.faultCount], "faultCount");
    parsed.utilization = parseValue(row[finalMapping.utilization], "utilization");

    // Determine status
    if (parsed.faultCount && parsed.faultCount > 0) {
      parsed.status = parsed.faultCount > parsed.racksPerRow * 0.2 ? "critical" : "attention";
    } else {
      parsed.status = "normal";
    }

    preview.push(parsed);
  }

  if (preview.length === 0) {
    errors.push("No valid rows could be parsed");
  }

  return { preview, errors };
}

// Generate sample CSV content
export function generateSampleCSV() {
  const rows = [
    ["Building", "Hall", "Location", "RacksPerRow", "AislePairs", "PDUCount", "ColdAisleWidth", "HotAisleWidth", "DeskCols", "FaultCount", "Utilization"],
    ["Building 1", "Hall A", "Mumbai, India", "16", "2", "8", "1.4", "1.8", "3", "3", "0.65"],
    ["Building 1", "Hall B", "Mumbai, India", "10", "3", "8", "1.3", "1.6", "3", "2", "0.58"],
    ["Building 2", "Hall A", "Ashburn, VA", "12", "3", "10", "1.2", "1.5", "3", "1", "0.70"],
  ];
  return rows.map((row) => row.join(",")).join("\n");
}
