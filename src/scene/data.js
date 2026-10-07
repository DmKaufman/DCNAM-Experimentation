// Data-hall layout generator, modeled on real cold-aisle-containment
// conventions rather than an arbitrary arrangement:
//  - Server rows are paired front-to-front so the gap between each pair
//    forms a cold aisle, which gets a containment roof + end doors.
//  - Adjacent pairs back onto each other across a wider, uncontained hot
//    aisle (return air path).
//  - PDUs are a uniform row of identical cabinets in their own electrical
//    strip, not scattered near the racks.
//  - CRAC units line the perimeter wall, one per row for even airflow.
//  - A security cage wraps just the racks; a small NOC/office area sits
//    beyond it.
//
// generateLayout(config) produces one full site from a handful of knobs
// (rack count, aisle-pair count, aisle widths, PDU/desk count) so different
// buildings can have genuinely different footprints, not just different
// labels on the same geometry.

const RACK_WIDTH_SLOT = 1.25;
const RACK_GAP = 0.12;
const RACK_WIDTH = RACK_WIDTH_SLOT - RACK_GAP;
const RACK_HEIGHT = 2.5;
const RACK_DEPTH = 1.2;
const ROW_LEFT_X = -11; // fixed anchor: the CRAC row always lines this edge
const DOOR_WIDTH = 1.8; // matches Entrance.jsx's default door width

const PORTS_PER_RACK = 48;
const RACK_BASE_KW = 1.2; // idle draw even with zero occupied ports
const RACK_PER_PORT_KW = 0.045; // incremental draw per connected/uplink port
const PDU_CAPACITY_KW = 40; // per electrical cabinet
const CRAC_CAPACITY_KW = 70; // per precision-cooling unit
const DEVICE_POOL = ["web", "app", "db", "cache", "lb", "esxi", "stor", "bkp", "mon", "vpn"];
const DESK_NAMES = [
  "A. Rivera",
  "J. Chen",
  "M. Okafor",
  "S. Patel",
  "D. Kowalski",
  "L. Nguyen",
  "R. Silva",
  "K. Andersen",
];
const ROW_LETTERS = "ABCDEFGH";

// Small seeded PRNG so dummy port data is stable across re-renders/HMR
// instead of reshuffling every time the module re-evaluates.
function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h;
}

// Real halls aren't uniformly reliable — a newer or better-run hall stays
// clean, an older or overloaded one accumulates link-down ports. Give each
// hall its own baseline per-port fault probability (seeded, so it's stable)
// instead of one fixed rate for every hall, so the fleet has genuinely
// healthy halls alongside problem ones rather than all of them clustering
// around the same rack-fault rate by sheer law-of-large-numbers averaging.
function hallFaultProbability(hallId) {
  const rng = mulberry32(hashCode(`${hallId}-fault-baseline`));
  return 0.0003 + rng() * 0.0042; // ~2%-16% of a hall's racks end up flagged
}

// Real halls also differ in how full they are — an older hall nearing
// end-of-life tends to be packed, a newly-stood-up one has lots of free
// rack space. Without this, every hall samples from the same fixed
// connected-port probability and converges to ~65% utilization regardless
// of size or age, which would make a capacity view meaningless (nothing to
// differentiate).
function hallUtilization(hallId) {
  const rng = mulberry32(hashCode(`${hallId}-utilization`));
  return 0.35 + rng() * 0.5; // 35%-85% of ports in use
}

function generatePorts(rackId, faultProbability, utilization, count = PORTS_PER_RACK) {
  const rng = mulberry32(hashCode(rackId));
  const ports = [];
  const UPLINK_WIDTH = 0.05;
  const connectedWidth = Math.max(0.02, utilization - UPLINK_WIDTH);
  for (let i = 1; i <= count; i++) {
    const r = rng();
    const device = () =>
      `${DEVICE_POOL[Math.floor(rng() * DEVICE_POOL.length)]}-${String(
        Math.ceil(rng() * 40)
      ).padStart(2, "0")}`;

    // The faulted and connected buckets' widths are this hall's own baseline
    // rate and utilization target; uplink stays fixed so only fault rate and
    // overall fullness vary hall-to-hall.
    let entry;
    if (r < UPLINK_WIDTH) {
      entry = { status: "uplink", device: `core-sw-0${1 + Math.floor(rng() * 2)}`, speed: "40G" };
    } else if (r < UPLINK_WIDTH + faultProbability) {
      entry = { status: "faulted", device: device(), speed: "1G", note: "Link down" };
    } else if (r < UPLINK_WIDTH + faultProbability + connectedWidth) {
      entry = { status: "connected", device: device(), speed: rng() < 0.3 ? "10G" : "1G" };
    } else {
      entry = { status: "free", device: null, speed: null };
    }
    ports.push({ number: i, ...entry });
  }
  return ports;
}

// Most racks sit close to the hall baseline; a small fraction run warm or
// run hot, the way a real thermal heatmap would show a few problem spots
// rather than uniform temperature.
function generateRackTemp(rackId, baseTempF) {
  const rng = mulberry32(hashCode(`${rackId}-temp`));
  const r = rng();
  if (r < 0.08) return Math.round((baseTempF + 10 + rng() * 8) * 10) / 10; // hotspot
  if (r < 0.2) return Math.round((baseTempF + 4 + rng() * 4) * 10) / 10; // warm
  return Math.round((baseTempF - 2 + rng() * 4) * 10) / 10; // normal
}

export const SITES = [
  {
    id: "mumbai",
    name: "Building 1",
    location: "Mumbai, India",
    halls: [
      {
        id: "mumbai-a",
        label: "Hall A",
        racksPerRow: 16,
        aislePairs: 2,
        coldAisleWidth: 1.4,
        hotAisleWidth: 1.8,
        pduCount: 8,
        deskCols: 3,
      },
      {
        id: "mumbai-b",
        label: "Hall B",
        racksPerRow: 10,
        aislePairs: 3,
        coldAisleWidth: 1.3,
        hotAisleWidth: 1.6,
        pduCount: 8,
        deskCols: 3,
      },
    ],
  },
  {
    id: "ashburn",
    name: "Building 2",
    location: "Ashburn, VA, USA",
    halls: [
      {
        id: "ashburn-a",
        label: "Hall A",
        racksPerRow: 12,
        aislePairs: 3,
        coldAisleWidth: 1.2,
        hotAisleWidth: 1.5,
        pduCount: 10,
        deskCols: 3,
      },
      {
        id: "ashburn-b",
        label: "Hall B",
        racksPerRow: 18,
        aislePairs: 1,
        coldAisleWidth: 1.6,
        hotAisleWidth: 2.0,
        pduCount: 6,
        deskCols: 2,
      },
    ],
  },
  {
    id: "dublin",
    name: "Building 3",
    location: "Dublin, Ireland",
    halls: [
      {
        id: "dublin-a",
        label: "Hall A",
        racksPerRow: 10,
        aislePairs: 1,
        coldAisleWidth: 1.8,
        hotAisleWidth: 2.4,
        pduCount: 4,
        deskCols: 2,
      },
      {
        id: "dublin-b",
        label: "Hall B",
        racksPerRow: 8,
        aislePairs: 2,
        coldAisleWidth: 1.3,
        hotAisleWidth: 1.7,
        pduCount: 6,
        deskCols: 2,
      },
    ],
  },
  {
    id: "singapore",
    name: "Building 4",
    location: "Singapore",
    halls: [
      {
        id: "singapore-a",
        label: "Hall A",
        racksPerRow: 20,
        aislePairs: 2,
        coldAisleWidth: 1.3,
        hotAisleWidth: 1.6,
        pduCount: 10,
        deskCols: 4,
      },
      {
        id: "singapore-b",
        label: "Hall B",
        racksPerRow: 14,
        aislePairs: 3,
        coldAisleWidth: 1.2,
        hotAisleWidth: 1.5,
        pduCount: 12,
        deskCols: 4,
      },
    ],
  },
];

// A rack/PDU/CRAC's id and label are pure functions of a hall's config
// (row count, racks-per-row, PDU count) — they don't depend on the seeded
// port/fault/utilization data at all. So a search index can be built for
// every hall in the fleet without paying for the expensive part of
// generateLayout (ports, positions, containment geometry) that a search
// box never needs. Kept in sync with generateLayout's own id/label scheme
// below; if that ever changes, this needs to change with it.
function buildHallIndexEntries(config) {
  const { racksPerRow, aislePairs, pduCount = 8 } = config;

  const rowDefs = Array.from({ length: aislePairs * 2 }, (_, i) => {
    const pairIndex = Math.floor(i / 2);
    const sub = (i % 2) + 1;
    const letter = ROW_LETTERS[pairIndex];
    return { id: `row-${letter}${sub}`.toLowerCase(), label: `Row ${letter}${sub}` };
  });

  const racks = rowDefs.flatMap((row) =>
    Array.from({ length: racksPerRow }, (_, i) => {
      const num = String(i + 1).padStart(2, "0");
      return { type: "rack", id: `${row.id}-${num}`, label: `${row.label}-${num}` };
    })
  );

  const pduRacks = Array.from({ length: pduCount }, (_, i) => {
    const num = String(i + 1).padStart(2, "0");
    return { type: "pdu", id: `pdu-${num}`, label: `PDU-${num}` };
  });

  const cracUnits = rowDefs.map((_, i) => {
    const num = String(i + 1).padStart(2, "0");
    return { type: "crac", id: `crac-${num}`, label: `CRAC-${num}` };
  });

  return [...racks, ...pduRacks, ...cracUnits];
}

// Flattened, searchable list of every rack/PDU/CRAC across every hall in
// every building — what a global search box filters against. Cheap enough
// to build once up front (see buildHallIndexEntries above).
export function buildSearchIndex() {
  const entries = [];
  for (const site of SITES) {
    for (const hall of site.halls) {
      for (const item of buildHallIndexEntries(hall)) {
        entries.push({
          ...item,
          siteId: site.id,
          siteName: site.name,
          siteLocation: site.location,
          hallId: hall.id,
          hallLabel: hall.label,
        });
      }
    }
  }
  return entries;
}

// Buildings and halls are places, not equipment — a search for "building",
// "mumbai", or "hall a" should surface them directly rather than only
// matching if the exact rack/PDU/CRAC id happens to contain that text
// (which it never does, since those ids don't carry site/hall info).
export function buildPlaceIndex() {
  const entries = [];
  for (const site of SITES) {
    entries.push({
      kind: "building",
      id: site.id,
      label: site.name,
      siteId: site.id,
      siteName: site.name,
      siteLocation: site.location,
      hallId: site.halls[0].id,
      hallLabel: site.halls[0].label,
    });
    for (const hall of site.halls) {
      entries.push({
        kind: "hall",
        id: `${site.id}-${hall.id}`,
        label: `${site.name} — ${hall.label}`,
        siteId: site.id,
        siteName: site.name,
        siteLocation: site.location,
        hallId: hall.id,
        hallLabel: hall.label,
      });
    }
  }
  return entries;
}

// Resources don't share one safe ceiling. Running rack space at 75%
// utilized is normal and expected — you keep deploying into a hall for
// years at that level. Running cooling at 75% is already tight, since a
// single CRAC failure can cascade with far less warning than running out of
// slots. So each dimension is measured against its own realistic ceiling,
// and a hall is only as healthy as its single worst dimension against that
// ceiling, not an average or a flat headroom percentage applied to all
// three. Shared by the Capacity page and the Home page so both agree on
// what "constrained" means for the same hall.
export const CAPACITY_CEILINGS = { rack: 75, power: 75, cooling: 70 };

export function capacityPressures(capacity) {
  return {
    rack: capacity.portUtilPct / CAPACITY_CEILINGS.rack,
    power: (100 - capacity.powerHeadroomPct) / CAPACITY_CEILINGS.power,
    cooling: (100 - capacity.coolingHeadroomPct) / CAPACITY_CEILINGS.cooling,
  };
}

export function pressureStatus(pressure) {
  if (pressure >= 1) return "constrained";
  if (pressure >= 0.8) return "watch";
  return "healthy";
}

const DIMENSION_LABEL = { rack: "Rack space", power: "Power", cooling: "Cooling" };

export function classifyHallCapacity(capacity) {
  const p = capacityPressures(capacity);
  const [worstDimension, worstPressure] = Object.entries(p).sort((a, b) => b[1] - a[1])[0];
  return {
    status: pressureStatus(worstPressure),
    worstPressure,
    worstDimension,
    worstDimensionLabel: DIMENSION_LABEL[worstDimension],
  };
}

// One pass per hall that the Home, Capacity, and Compare pages all build
// on — each used to call generateLayout() independently for the same hall,
// which meant visiting all three in one session recomputed this fleet-wide
// data three times over. Called once, memoized at the App root, and handed
// down as a prop instead. Returns raw facts only; each page's own classify
// logic decides what counts as "needs attention" for its own purpose.
export function buildHallOverviews() {
  const rows = [];
  for (const site of SITES) {
    for (const hall of site.halls) {
      const layout = generateLayout(hall);
      const rackCount = layout.racks.length;
      const faultCount = layout.racks.filter((r) => r.hasFault).length;
      rows.push({
        siteId: site.id,
        siteName: site.name,
        siteLocation: site.location,
        hallId: hall.id,
        hallLabel: hall.label,
        rackCount,
        pduCount: layout.pduRacks.length,
        cracCount: layout.cracUnits.length,
        faultCount,
        faultPct: rackCount ? (faultCount / rackCount) * 100 : 0,
        tempF: layout.environment.tempF,
        humidity: layout.environment.humidity,
        capacity: layout.capacity,
      });
    }
  }
  return rows;
}

export function generateLayout(config) {
  const {
    racksPerRow,
    aislePairs,
    coldAisleWidth = 1.4,
    hotAisleWidth = 1.8,
    pduCount = 8,
    deskCols = 3,
  } = config;

  const rowSpacingCold = RACK_DEPTH + coldAisleWidth;
  const rowSpacingHot = RACK_DEPTH + hotAisleWidth;
  const rowWidth = racksPerRow * RACK_WIDTH_SLOT;
  const rowCenterX = ROW_LEFT_X + rowWidth / 2;

  // Row z-positions: within a pair, rows sit one cold-aisle-width apart
  // (facing each other); between pairs, one hot-aisle-width apart.
  const rowZs = [];
  let z = -6;
  for (let p = 0; p < aislePairs; p++) {
    if (p > 0) z += rowSpacingHot;
    rowZs.push(z);
    z += rowSpacingCold;
    rowZs.push(z);
  }

  const rowDefs = rowZs.map((zPos, i) => {
    const pairIndex = Math.floor(i / 2);
    const sub = (i % 2) + 1;
    const letter = ROW_LETTERS[pairIndex];
    return { id: `row-${letter}${sub}`.toLowerCase(), z: zPos, label: `Row ${letter}${sub}` };
  });

  const coldAisles = Array.from({ length: aislePairs }, (_, p) => ({
    id: `cold-aisle-${ROW_LETTERS[p].toLowerCase()}`,
    label: `Cold Aisle ${ROW_LETTERS[p]}`,
    rowZs: [rowZs[p * 2], rowZs[p * 2 + 1]],
  }));

  // Dummy environmental reading, stable per hall (not per render) — real
  // white space is kept in a tight ASHRAE-style band regardless of climate.
  const envRng = mulberry32(hashCode(`${config.id}-env`));
  const environment = {
    tempF: Math.round((68 + envRng() * 7) * 10) / 10,
    humidity: Math.round(40 + envRng() * 15),
  };

  const faultProbability = hallFaultProbability(config.id);
  const utilization = hallUtilization(config.id);

  const racks = rowDefs.flatMap((row) =>
    Array.from({ length: racksPerRow }, (_, i) => {
      const x = ROW_LEFT_X + RACK_WIDTH_SLOT * (i + 0.5);
      const num = String(i + 1).padStart(2, "0");
      const id = `${row.id}-${num}`;
      const ports = generatePorts(id, faultProbability, utilization);
      return {
        id,
        label: `${row.label}-${num}`,
        position: [x, RACK_HEIGHT / 2, row.z],
        size: [RACK_WIDTH, RACK_HEIGHT, RACK_DEPTH],
        ports,
        tempF: generateRackTemp(id, environment.tempF),
        hasFault: ports.some((p) => p.status === "faulted"),
      };
    })
  );

  // Dedicated electrical strip: uniform PDU cabinets in a single straight
  // line, clear of the server rows and aisles.
  const lastRowZ = rowZs[rowZs.length - 1];
  const PDU_SIZE = [1, 2.4, 1];
  const PDU_SPACING = 1.6;
  const pduZ = lastRowZ + 3.6;
  const pduStartX = rowCenterX - ((pduCount - 1) * PDU_SPACING) / 2;

  const pduRacks = Array.from({ length: pduCount }, (_, i) => ({
    id: `pdu-${String(i + 1).padStart(2, "0")}`,
    label: `PDU-${String(i + 1).padStart(2, "0")}`,
    position: [pduStartX + i * PDU_SPACING, PDU_SIZE[1] / 2, pduZ],
    size: PDU_SIZE,
  }));

  // CRAC units line the perimeter wall, one aligned to each row for even
  // cold-air distribution into the raised-floor plenum.
  const cracX = ROW_LEFT_X - 2.4;
  const CRAC_SIZE = [1.4, 2, 1.4];

  const cracUnits = rowDefs.map((row, i) => ({
    id: `crac-${String(i + 1).padStart(2, "0")}`,
    label: `CRAC-${String(i + 1).padStart(2, "0")}`,
    position: [cracX, CRAC_SIZE[1] / 2, row.z],
    size: CRAC_SIZE,
  }));

  // Cold-aisle containment: a roof spanning each facing row pair, closed off
  // at both ends by doors — derived from the row geometry so it can't drift
  // out of alignment with the racks it encloses.
  const containmentWalls = coldAisles.flatMap((aisle) => {
    const [z1, z2] = aisle.rowZs;
    const centerZ = (z1 + z2) / 2;
    const depth = Math.abs(z2 - z1) + RACK_DEPTH;
    const roofY = RACK_HEIGHT + 0.1;
    const doorHeight = RACK_HEIGHT + 0.15;
    const halfRow = rowWidth / 2;

    return [
      {
        id: `${aisle.id}-roof`,
        label: `${aisle.label} — Containment Roof`,
        position: [rowCenterX, roofY, centerZ],
        size: [rowWidth + 0.3, 0.12, depth],
      },
      {
        id: `${aisle.id}-door-w`,
        label: `${aisle.label} — End Door (W)`,
        position: [rowCenterX - halfRow - 0.1, doorHeight / 2, centerZ],
        size: [0.12, doorHeight, depth],
      },
      {
        id: `${aisle.id}-door-e`,
        label: `${aisle.label} — End Door (E)`,
        position: [rowCenterX + halfRow + 0.1, doorHeight / 2, centerZ],
        size: [0.12, doorHeight, depth],
      },
    ];
  });

  // Customer security cage: wraps tightly around just the server rows and
  // their aisles. CRAC (facility cooling) and the PDU strip (facility power)
  // sit outside it, as they would in a real colo.
  const cageBounds = {
    xMin: ROW_LEFT_X - 0.6,
    xMax: ROW_LEFT_X + rowWidth + 0.6,
    zMin: rowZs[0] - RACK_DEPTH / 2 - 0.6,
    zMax: lastRowZ + RACK_DEPTH / 2 + 0.6,
  };
  const CAGE_HEIGHT = 3.2;

  // A small NOC / office area beyond the cage where facility staff would
  // sit, separated from the white space rather than mixed in with the racks.
  const officeCenterX = rowCenterX;
  const officeCenterZ = pduZ + 5;
  const colSpacing = 2.6;
  const colOffsets = Array.from({ length: deskCols }, (_, i) => (i - (deskCols - 1) / 2) * colSpacing);

  const desks = colOffsets.flatMap((dx, colIdx) =>
    [-0.9, 0.9].map((dz, rowIdx) => ({
      id: `desk-${colIdx}-${rowIdx}`,
      name: DESK_NAMES[(colIdx * 2 + rowIdx) % DESK_NAMES.length],
      position: [officeCenterX + dx, 0, officeCenterZ + dz],
    }))
  );

  const officeFloor = {
    center: [officeCenterX, officeCenterZ],
    size: [Math.max(deskCols * colSpacing + 2, 6), 6],
  };

  // Overall footprint, used to frame the camera and size the floor per site.
  const bounds = {
    xMin: cracX - 1,
    xMax: Math.max(cageBounds.xMax, pduStartX + (pduCount - 1) * PDU_SPACING + 1),
    zMin: cageBounds.zMin - 1,
    zMax: officeCenterZ + officeFloor.size[1] / 2 + 1,
  };

  // Entrances sit right at the building's outer perimeter (the true ends
  // of the model), not partway across open floor — a main entrance beyond
  // the office area (how staff/visitors walk in from the building
  // corridor), and a fire exit at the opposite end of the white space, for
  // a sensible egress path.
  const entrances = [
    {
      id: "entrance-main",
      label: "Main Entrance",
      type: "main",
      position: [officeCenterX, bounds.zMax - 0.05],
    },
    {
      id: "entrance-fire",
      label: "Fire Exit",
      type: "fire",
      position: [rowCenterX, bounds.zMin + 0.05],
    },
  ];

  // A slim perimeter border tracing the building's footprint, with gaps cut
  // for the two doors so they read as set into a wall rather than floating
  // on open floor. Kept low (a curb, not a real wall) so it never blocks
  // the view of the hall from any camera angle.
  const WALL_THICKNESS = 0.15;
  const WALL_HEIGHT = 0.45;
  const doorXOn = (side) => entrances.find((e) => e.type === side)?.position[0] ?? null;

  function wallSpans(spanStart, spanEnd, doorCenter) {
    if (doorCenter == null) return [[spanStart, spanEnd]];
    const gapStart = doorCenter - DOOR_WIDTH / 2;
    const gapEnd = doorCenter + DOOR_WIDTH / 2;
    const spans = [];
    if (gapStart > spanStart) spans.push([spanStart, gapStart]);
    if (gapEnd < spanEnd) spans.push([gapEnd, spanEnd]);
    return spans;
  }

  const hallWalls = [
    ...wallSpans(bounds.xMin, bounds.xMax, doorXOn("fire")).map(([s, e], i) => ({
      id: `hall-wall-n-${i}`,
      axis: "x",
      position: [(s + e) / 2, WALL_HEIGHT / 2, bounds.zMin],
      size: [e - s, WALL_HEIGHT, WALL_THICKNESS],
    })),
    ...wallSpans(bounds.xMin, bounds.xMax, doorXOn("main")).map(([s, e], i) => ({
      id: `hall-wall-s-${i}`,
      axis: "x",
      position: [(s + e) / 2, WALL_HEIGHT / 2, bounds.zMax],
      size: [e - s, WALL_HEIGHT, WALL_THICKNESS],
    })),
    {
      id: "hall-wall-w",
      axis: "z",
      position: [bounds.xMin, WALL_HEIGHT / 2, (bounds.zMin + bounds.zMax) / 2],
      size: [WALL_THICKNESS, WALL_HEIGHT, bounds.zMax - bounds.zMin],
    },
    {
      id: "hall-wall-e",
      axis: "z",
      position: [bounds.xMax, WALL_HEIGHT / 2, (bounds.zMin + bounds.zMax) / 2],
      size: [WALL_THICKNESS, WALL_HEIGHT, bounds.zMax - bounds.zMin],
    },
  ];

  // Capacity planning: three independent constraints a real hall runs
  // against — port/rack space, electrical, and thermal. Power draw is
  // derived from how many ports are actually in use (idle racks pull a
  // baseline, active ports add incrementally); cooling load is modeled as
  // roughly equal to power draw, since nearly all the electricity racks
  // consume is ultimately rejected as heat.
  const totalPorts = racks.reduce((sum, r) => sum + r.ports.length, 0);
  const usedPorts = racks.reduce(
    (sum, r) => sum + r.ports.filter((p) => p.status === "connected" || p.status === "uplink").length,
    0
  );
  const powerDrawKw = racks.reduce((sum, r) => {
    const used = r.ports.filter((p) => p.status === "connected" || p.status === "uplink").length;
    return sum + RACK_BASE_KW + used * RACK_PER_PORT_KW;
  }, 0);
  const powerCapacityKw = pduRacks.length * PDU_CAPACITY_KW;
  const coolingCapacityKw = cracUnits.length * CRAC_CAPACITY_KW;

  const capacity = {
    portUtilPct: Math.round((usedPorts / totalPorts) * 100),
    powerDrawKw: Math.round(powerDrawKw),
    powerCapacityKw,
    powerHeadroomPct: Math.round((1 - powerDrawKw / powerCapacityKw) * 100),
    coolingLoadKw: Math.round(powerDrawKw),
    coolingCapacityKw,
    coolingHeadroomPct: Math.round((1 - powerDrawKw / coolingCapacityKw) * 100),
  };

  return {
    racks,
    pduRacks,
    containmentWalls,
    cracUnits,
    cageBounds,
    CAGE_HEIGHT,
    desks,
    officeFloor,
    entrances,
    hallWalls,
    environment,
    capacity,
    bounds,
  };
}
