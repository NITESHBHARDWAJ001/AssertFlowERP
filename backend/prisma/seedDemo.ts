// Populates a full demo organization ("Meridian Facilities") with realistic
// data across every module, so dashboards, analytics, and reports render
// meaningfully populated on a fresh database. Safe to run alongside seed.ts
// (which only creates the Super Admin) - this is additive and idempotent
// per-organization (skips if the demo org already exists).
import "dotenv/config";
import {
  PrismaClient,
  Role,
  AssetStatus,
  AssetRequestStatus,
  ResourceType,
  BookingStatus,
  MaintenancePriority,
  MaintenanceStatus,
  AuditCycleStatus,
  AuditItemStatus,
  NotificationType,
  Prisma,
} from "@prisma/client";
import bcrypt from "bcrypt";
import QRCode from "qrcode";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "Demo1234!";
const ORG_SLUG = "meridian-facilities";

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}
function daysAgo(n: number, hour = 10) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, randInt(0, 59), 0, 0);
  return d;
}
function daysFromNow(n: number, hour = 10) {
  return daysAgo(-n, hour);
}

interface LogEntry {
  organizationId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

interface NotificationEntry {
  organizationId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  isRead: boolean;
  createdAt: Date;
}

const DEPARTMENT_DEFS = [
  { name: "Engineering", head: { firstName: "Liam", lastName: "Okafor" } },
  { name: "Operations", head: { firstName: "Sofia", lastName: "Rossi" } },
  { name: "Sales", head: { firstName: "Noah", lastName: "Kim" } },
  { name: "Facilities", head: { firstName: "Aisha", lastName: "Khan" } },
];

const EMPLOYEE_DEFS: [string, string][] = [
  ["Carlos", "Silva"], ["Mei", "Chen"],
  ["Ivan", "Petrov"], ["Grace", "Walsh"],
  ["Oliver", "Novak"], ["Fatima", "Haddad"],
  ["Lucas", "Moreau"], ["Nadia", "Ivanova"],
];

const ASSET_MANAGER_DEFS: [string, string][] = [
  ["Rahul", "Sharma"],
  ["Emma", "Bennett"],
];

const CATEGORY_DEFS = [
  {
    name: "IT Equipment",
    description: "Laptops, desktops, monitors, and networking gear",
    customFieldsSchema: [
      { key: "cpu", label: "CPU", type: "text" },
      { key: "ram", label: "RAM (GB)", type: "number" },
    ],
    models: [
      "Dell Latitude 5440", 'MacBook Pro 14"', "Lenovo ThinkPad X1",
      "Dell UltraSharp 27 Monitor", "HP LaserJet Pro M404", "Logitech Rally Bar",
      "Cisco Catalyst 9200 Switch", "Apple Mac Mini M2", "Dell Precision 5570", "Jabra Speak 750",
    ],
  },
  {
    name: "Furniture",
    description: "Desks, chairs, and storage for office spaces",
    customFieldsSchema: [{ key: "material", label: "Material", type: "text" }],
    models: [
      "Herman Miller Aeron Chair", "IKEA Bekant Desk", "Steelcase Filing Cabinet",
      "12-Seat Conference Table", "Reception Sofa", "Standing Desk Converter",
      "Bookshelf Unit", "Ergonomic Footrest", "Lounge Armchair", "Storage Locker",
    ],
  },
  {
    name: "Vehicles",
    description: "Pool vehicles and site transport",
    customFieldsSchema: [
      { key: "plate", label: "Plate Number", type: "text" },
      { key: "fuel", label: "Fuel Type", type: "text" },
    ],
    models: [
      "Toyota Hiace Van", "Ford Transit Custom", "Honda Civic (Pool Car)",
      "Yamaha Electric Forklift", "Toyota Corolla (Pool Car)", "Mahindra Bolero Pickup",
      "Tata Ace Cargo Van", "Royal Enfield Courier Bike", "Suzuki Swift (Pool Car)", "Ashok Leyland Mini Truck",
    ],
  },
  {
    name: "Office Equipment",
    description: "Shared equipment for day-to-day office operations",
    customFieldsSchema: [{ key: "warrantyProvider", label: "Warranty Provider", type: "text" }],
    models: [
      "Xerox WorkCentre 6515", "Fellowes 99Ci Shredder", "Epson EB-X06 Projector",
      "Whiteboard 6x4 ft", "Water Cooler Dispenser", "Paper Trimmer A3",
      "Laminator A4 Pro", "Binding Machine", "Postage Scale", "Label Printer Zebra",
    ],
  },
  {
    name: "Electronics",
    description: "AV, security, and presentation electronics",
    customFieldsSchema: [{ key: "screenSize", label: "Screen Size", type: "text" }],
    models: [
      'iPad Pro 12.9"', "Samsung 55in Display", "Bose Conference Speaker",
      "Ring Security Camera", "Amazon Echo Show", "GoPro Hero 12",
      "Sony 4K Camcorder", "Polycom Conference Phone", "Portable Projector Screen", "Wireless Presenter Clicker",
    ],
  },
];

const VENDORS = ["Dell Direct", "CDW", "Amazon Business", "Global Office Supply", "Reliance Digital", "Staples Business", "Tech Depot", "Fleet Solutions Inc", "Prime Furnishings", "ElectroMart"];
const LOCATIONS = ["HQ - 2nd Floor", "HQ - 3rd Floor", "Warehouse A", "Remote / WFH", "Branch Office - Downtown"];
const CONDITIONS = ["Excellent", "Good", "Fair"];

const STATUS_CYCLE: AssetStatus[] = [
  AssetStatus.AVAILABLE, AssetStatus.ALLOCATED, AssetStatus.ALLOCATED, AssetStatus.AVAILABLE,
  AssetStatus.MAINTENANCE, AssetStatus.ALLOCATED, AssetStatus.AVAILABLE, AssetStatus.RESERVED,
  AssetStatus.RETIRED, AssetStatus.ALLOCATED,
];

async function main() {
  const existingOrg = await prisma.organization.findUnique({ where: { slug: ORG_SLUG } });
  if (existingOrg) {
    console.log(`Demo organization already exists (${existingOrg.name}) - skipping demo seed.`);
    return;
  }

  console.log("Seeding demo organization...");
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const org = await prisma.organization.create({
    data: {
      name: "Meridian Facilities",
      slug: ORG_SLUG,
      plan: "pro",
      assetTagPrefix: "MF",
      bookingRequiresApproval: true,
      maintenanceRequiresApproval: true,
    },
  });

  const activityLog: LogEntry[] = [];
  const notifications: NotificationEntry[] = [];

  // ---- Departments (created without a head; backfilled below) ----
  const departments = [];
  for (const def of DEPARTMENT_DEFS) {
    const dept = await prisma.department.create({ data: { organizationId: org.id, name: def.name } });
    departments.push(dept);
  }

  // ---- Org Admin ----
  const orgAdmin = await prisma.user.create({
    data: {
      organizationId: org.id, email: "priya.nair@meridian.demo", passwordHash,
      firstName: "Priya", lastName: "Nair", role: Role.ORG_ADMIN,
    },
  });
  activityLog.push({ organizationId: org.id, userId: orgAdmin.id, action: "CREATE_USER", entityType: "User", entityId: orgAdmin.id, metadata: { email: orgAdmin.email, role: orgAdmin.role }, createdAt: daysAgo(90) });

  // ---- Asset Managers ----
  const assetManagers = [];
  for (const [firstName, lastName] of ASSET_MANAGER_DEFS) {
    const u = await prisma.user.create({
      data: {
        organizationId: org.id,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@meridian.demo`,
        passwordHash, firstName, lastName, role: Role.ASSET_MANAGER,
      },
    });
    assetManagers.push(u);
    activityLog.push({ organizationId: org.id, userId: orgAdmin.id, action: "CREATE_USER", entityType: "User", entityId: u.id, metadata: { email: u.email, role: u.role }, createdAt: daysAgo(88) });
  }

  // ---- Department Heads (backfills Department.headUserId) ----
  const deptHeads = [];
  const staffByDept: Record<string, { id: string; departmentId: string | null }[]> = {};
  for (let i = 0; i < departments.length; i++) {
    const dept = departments[i];
    const headDef = DEPARTMENT_DEFS[i].head;
    const head = await prisma.user.create({
      data: {
        organizationId: org.id,
        email: `${headDef.firstName.toLowerCase()}.${headDef.lastName.toLowerCase()}@meridian.demo`,
        passwordHash, firstName: headDef.firstName, lastName: headDef.lastName,
        role: Role.DEPARTMENT_HEAD, departmentId: dept.id,
      },
    });
    await prisma.department.update({ where: { id: dept.id }, data: { headUserId: head.id } });
    deptHeads.push(head);
    staffByDept[dept.id] = [{ id: head.id, departmentId: dept.id }];
    activityLog.push({ organizationId: org.id, userId: orgAdmin.id, action: "CREATE_USER", entityType: "User", entityId: head.id, metadata: { email: head.email, role: head.role }, createdAt: daysAgo(85 - i) });
  }

  // ---- Employees (2 per department, same order as DEPARTMENT_DEFS) ----
  const employees = [];
  for (let i = 0; i < EMPLOYEE_DEFS.length; i++) {
    const [firstName, lastName] = EMPLOYEE_DEFS[i];
    const dept = departments[Math.floor(i / 2)];
    const emp = await prisma.user.create({
      data: {
        organizationId: org.id,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@meridian.demo`,
        passwordHash, firstName, lastName, role: Role.EMPLOYEE, departmentId: dept.id,
      },
    });
    employees.push(emp);
    staffByDept[dept.id].push({ id: emp.id, departmentId: dept.id });
    activityLog.push({ organizationId: org.id, userId: orgAdmin.id, action: "CREATE_USER", entityType: "User", entityId: emp.id, metadata: { email: emp.email, role: emp.role }, createdAt: daysAgo(80 - i) });
  }

  const allStaff = [...deptHeads, ...employees];
  console.log(`Created ${1 + assetManagers.length + deptHeads.length + employees.length} demo users (password: ${DEMO_PASSWORD})`);

  // ---- Asset Categories ----
  const categories = [];
  for (const def of CATEGORY_DEFS) {
    const cat = await prisma.assetCategory.create({
      data: { organizationId: org.id, name: def.name, description: def.description, customFieldsSchema: def.customFieldsSchema },
    });
    categories.push({ ...cat, models: def.models });
  }

  // ---- Assets ----
  const assetHistory: Prisma.AssetHistoryCreateManyInput[] = [];
  const allocatedAssets: { id: string; assetTag: string; categoryId: string; holderId: string; departmentId: string }[] = [];
  const assetsByCategory: Record<string, { id: string; assetTag: string; status: AssetStatus; categoryId: string; departmentId: string | null }[]> = {};

  let assetCounter = 0;
  for (const cat of categories) {
    assetsByCategory[cat.id] = [];
    for (let i = 0; i < cat.models.length; i++) {
      const status = cat.name === "Electronics" && i === 8 ? AssetStatus.DISPOSED : STATUS_CYCLE[i];
      const dept = departments[assetCounter % departments.length];
      const staff = staffByDept[dept.id];
      const holder = status === AssetStatus.ALLOCATED ? pick(staff) : null;

      const updatedOrg = await prisma.organization.update({
        where: { id: org.id },
        data: { assetTagSequence: { increment: 1 } },
        select: { assetTagSequence: true },
      });
      const assetTag = `MF-${String(updatedOrg.assetTagSequence).padStart(5, "0")}`;

      const purchaseDate = daysAgo(randInt(60, 720));
      const warrantyExpiry = new Date(purchaseDate);
      warrantyExpiry.setFullYear(warrantyExpiry.getFullYear() + randInt(1, 3));

      const qrCodeUrl = await QRCode.toDataURL(JSON.stringify({ organizationId: org.id, assetTag }), { margin: 1, width: 256 });

      const asset = await prisma.asset.create({
        data: {
          organizationId: org.id,
          assetTag,
          name: cat.models[i],
          categoryId: cat.id,
          serialNumber: `SN-${cat.name.slice(0, 2).toUpperCase()}-${randInt(100000, 999999)}`,
          status,
          currentHolderId: holder?.id,
          currentDepartmentId: dept.id,
          vendor: pick(VENDORS),
          purchaseDate,
          purchaseCost: randInt(150, 45000),
          warrantyExpiry,
          location: pick(LOCATIONS),
          condition: pick(CONDITIONS),
          qrCodeUrl,
        },
      });

      assetsByCategory[cat.id].push({ id: asset.id, assetTag: asset.assetTag, status, categoryId: cat.id, departmentId: dept.id });
      if (status === AssetStatus.ALLOCATED && holder) {
        allocatedAssets.push({ id: asset.id, assetTag: asset.assetTag, categoryId: cat.id, holderId: holder.id, departmentId: dept.id });
      }

      assetHistory.push({
        assetId: asset.id, action: "REGISTERED", toStatus: AssetStatus.REGISTERED,
        performedById: orgAdmin.id, note: "Registered into inventory", createdAt: purchaseDate,
      });
      assetHistory.push({
        assetId: asset.id, action: "STATUS_CHANGE", fromStatus: AssetStatus.REGISTERED, toStatus: status,
        toHolderId: holder?.id, performedById: pick(assetManagers).id,
        note: `Marked ${status.toLowerCase()}`, createdAt: daysAgo(randInt(5, 55)),
      });

      activityLog.push({
        organizationId: org.id, userId: orgAdmin.id, action: "CREATE_ASSET", entityType: "Asset",
        entityId: asset.id, metadata: { assetTag: asset.assetTag, name: asset.name }, createdAt: purchaseDate,
      });

      assetCounter++;
    }
  }
  await prisma.assetHistory.createMany({ data: assetHistory });
  console.log(`Created ${assetCounter} assets across ${categories.length} categories`);

  // ---- Asset Requests ----
  const requestReasons = ["Needed for new project", "Replacing damaged equipment", "Onboarding new team setup", "Client site work", "Remote work setup", "Team expansion"];
  const assetRequestDefs: { status: AssetRequestStatus; useAllocated?: boolean }[] = [
    ...Array(3).fill({ status: AssetRequestStatus.PENDING_DEPT_HEAD }),
    ...Array(3).fill({ status: AssetRequestStatus.PENDING_ASSET_MANAGER }),
    ...Array(5).fill({ status: AssetRequestStatus.ALLOCATED, useAllocated: true }),
    ...Array(2).fill({ status: AssetRequestStatus.REJECTED }),
    ...Array(2).fill({ status: AssetRequestStatus.CANCELLED }),
  ];

  let allocatedRequestIdx = 0;
  for (const def of assetRequestDefs) {
    const createdAt = daysAgo(randInt(2, 45));

    if (def.useAllocated && allocatedRequestIdx < allocatedAssets.length) {
      const a = allocatedAssets[allocatedRequestIdx++];
      const deptIdx = departments.findIndex((d) => d.id === a.departmentId);
      const deptHead = deptHeads[deptIdx];
      const req = await prisma.assetRequest.create({
        data: {
          organizationId: org.id, requestedById: a.holderId, categoryId: a.categoryId, assetId: a.id,
          reason: pick(requestReasons), status: AssetRequestStatus.ALLOCATED,
          deptHeadApprovedById: deptHead.id, deptHeadDecisionAt: createdAt,
          assetManagerApprovedById: pick(assetManagers).id, assetManagerDecisionAt: daysAgo(randInt(1, 30)),
          expectedReturnDate: daysFromNow(randInt(30, 180)), createdAt,
        },
      });
      activityLog.push({ organizationId: org.id, userId: a.holderId, action: "ASSET_MANAGER_APPROVE_REQUEST", entityType: "AssetRequest", entityId: req.id, metadata: { assetTag: a.assetTag }, createdAt });
      continue;
    }

    const requester = pick(allStaff);
    const dept = departments.find((d) => d.id === requester.departmentId) ?? departments[0];
    const deptHead = deptHeads[departments.indexOf(dept)];
    const cat = pick(categories);
    const base = {
      organizationId: org.id, requestedById: requester.id, categoryId: cat.id,
      reason: pick(requestReasons), expectedReturnDate: daysFromNow(randInt(30, 180)), createdAt,
    };

    if (def.status === AssetRequestStatus.PENDING_DEPT_HEAD) {
      const req = await prisma.assetRequest.create({ data: { ...base, status: def.status } });
      activityLog.push({ organizationId: org.id, userId: requester.id, action: "CREATE_ASSET_REQUEST", entityType: "AssetRequest", entityId: req.id, metadata: { category: cat.name }, createdAt });
    } else if (def.status === AssetRequestStatus.PENDING_ASSET_MANAGER) {
      const req = await prisma.assetRequest.create({
        data: { ...base, status: def.status, deptHeadApprovedById: deptHead.id, deptHeadDecisionAt: daysAgo(randInt(1, 40)) },
      });
      activityLog.push({ organizationId: org.id, userId: deptHead.id, action: "DEPT_HEAD_APPROVE_REQUEST", entityType: "AssetRequest", entityId: req.id, createdAt });
    } else if (def.status === AssetRequestStatus.REJECTED) {
      const rejectedByDeptHead = Math.random() < 0.5;
      const req = await prisma.assetRequest.create({
        data: {
          ...base, status: def.status,
          deptHeadApprovedById: rejectedByDeptHead ? undefined : deptHead.id,
          deptHeadNote: rejectedByDeptHead ? "Not justified for current project load" : undefined,
          deptHeadDecisionAt: daysAgo(randInt(1, 40)),
          assetManagerNote: rejectedByDeptHead ? undefined : "No budget for this category this quarter",
        },
      });
      activityLog.push({
        organizationId: org.id, userId: rejectedByDeptHead ? deptHead.id : pick(assetManagers).id,
        action: rejectedByDeptHead ? "DEPT_HEAD_REJECT_REQUEST" : "ASSET_MANAGER_REJECT_REQUEST",
        entityType: "AssetRequest", entityId: req.id, createdAt,
      });
    } else {
      const req = await prisma.assetRequest.create({ data: { ...base, status: def.status } });
      activityLog.push({ organizationId: org.id, userId: requester.id, action: "CANCEL_ASSET_REQUEST", entityType: "AssetRequest", entityId: req.id, createdAt });
    }
  }
  console.log(`Created ${assetRequestDefs.length} asset requests`);

  // ---- Bookable Resources ----
  const resourceDefs: { name: string; type: ResourceType; location: string; capacity: number | null }[] = [
    { name: "Boardroom Alpha", type: ResourceType.MEETING_ROOM, location: "HQ - 4th Floor", capacity: 12 },
    { name: "Huddle Room B2", type: ResourceType.MEETING_ROOM, location: "HQ - 2nd Floor", capacity: 4 },
    { name: "Innovation Lab", type: ResourceType.MEETING_ROOM, location: "HQ - 3rd Floor", capacity: 8 },
    { name: "Toyota Hiace - Pool Van", type: ResourceType.VEHICLE, location: "Warehouse A", capacity: 12 },
    { name: "Honda Civic - Pool Car", type: ResourceType.VEHICLE, location: "HQ Basement Parking", capacity: 4 },
    { name: "Epson Projector Kit", type: ResourceType.PROJECTOR, location: "AV Storage", capacity: null },
    { name: "Portable PA System", type: ResourceType.EQUIPMENT, location: "AV Storage", capacity: null },
    { name: "Field Survey Kit", type: ResourceType.EQUIPMENT, location: "Warehouse A", capacity: null },
  ];
  const resources = [];
  for (const def of resourceDefs) {
    resources.push(await prisma.bookableResource.create({ data: { organizationId: org.id, ...def } }));
  }

  // ---- Bookings ----
  const purposes = ["Client presentation", "Team standup", "Vendor demo", "Quarterly review", "Site visit", "Training session", "Interview panel", "Town hall prep", "Equipment checkout", "Off-site meeting"];
  const bookingStatusCycle: BookingStatus[] = [
    BookingStatus.APPROVED, BookingStatus.APPROVED, BookingStatus.PENDING, BookingStatus.APPROVED,
    BookingStatus.REJECTED, BookingStatus.APPROVED, BookingStatus.CANCELLED, BookingStatus.APPROVED,
    BookingStatus.PENDING, BookingStatus.APPROVED,
  ];
  for (let i = 0; i < 25; i++) {
    const status = bookingStatusCycle[i % bookingStatusCycle.length];
    const booker = pick(allStaff);
    const resource = pick(resources);
    const start = daysFromNow(randInt(-20, 14), randInt(8, 16));
    const end = new Date(start.getTime() + randInt(1, 3) * 60 * 60 * 1000);
    const createdAt = daysAgo(randInt(1, 25));

    const booking = await prisma.booking.create({
      data: {
        organizationId: org.id, resourceId: resource.id, bookedById: booker.id,
        purpose: pick(purposes), startTime: start, endTime: end, status,
        approvedById: status === BookingStatus.APPROVED ? pick(assetManagers).id : null,
        approvedAt: status === BookingStatus.APPROVED ? createdAt : null,
        rejectionReason: status === BookingStatus.REJECTED ? "Resource already committed for that slot" : null,
        createdAt,
      },
    });
    activityLog.push({ organizationId: org.id, userId: booker.id, action: "CREATE_BOOKING", entityType: "Booking", entityId: booking.id, metadata: { resource: resource.name }, createdAt });
    if (status === BookingStatus.APPROVED || status === BookingStatus.REJECTED) {
      activityLog.push({
        organizationId: org.id, userId: booking.approvedById ?? pick(assetManagers).id,
        action: status === BookingStatus.APPROVED ? "APPROVE_BOOKING" : "REJECT_BOOKING",
        entityType: "Booking", entityId: booking.id, createdAt,
      });
    }
  }
  console.log("Created 25 bookings across 8 resources");

  // ---- Maintenance Requests ----
  const maintenanceTitles: Record<string, string[]> = {
    "IT Equipment": ["Laptop not powering on", "Monitor flickering", "Network switch dropping packets", "Printer paper jam", "Slow performance, needs diagnostics"],
    Furniture: ["Chair armrest broken", "Desk height adjuster stuck", "Cabinet lock jammed"],
    Vehicles: ["AC not cooling", "Unusual engine noise", "Tire pressure warning", "Battery not holding charge"],
    "Office Equipment": ["Paper jam recurring", "Bulb needs replacement", "Shredder motor overheating"],
    Electronics: ["Speaker distortion", "Camera feed offline", "Display dead pixels"],
  };
  const maintenanceStatusCycle: MaintenanceStatus[] = [
    MaintenanceStatus.RESOLVED, MaintenanceStatus.RESOLVED, MaintenanceStatus.PENDING, MaintenanceStatus.APPROVED,
    MaintenanceStatus.IN_PROGRESS, MaintenanceStatus.RESOLVED, MaintenanceStatus.TECHNICIAN_ASSIGNED, MaintenanceStatus.RESOLVED,
    MaintenanceStatus.REJECTED, MaintenanceStatus.IN_PROGRESS, MaintenanceStatus.PENDING, MaintenanceStatus.RESOLVED,
    MaintenanceStatus.APPROVED, MaintenanceStatus.RESOLVED, MaintenanceStatus.TECHNICIAN_ASSIGNED, MaintenanceStatus.PENDING,
    MaintenanceStatus.RESOLVED, MaintenanceStatus.REJECTED, MaintenanceStatus.IN_PROGRESS, MaintenanceStatus.RESOLVED,
  ];
  const priorities: MaintenancePriority[] = [MaintenancePriority.LOW, MaintenancePriority.MEDIUM, MaintenancePriority.HIGH, MaintenancePriority.CRITICAL];
  const allAssetsFlat = Object.values(assetsByCategory).flat();

  for (let i = 0; i < maintenanceStatusCycle.length; i++) {
    const status = maintenanceStatusCycle[i];
    const asset = pick(allAssetsFlat);
    const category = categories.find((c) => c.id === asset.categoryId)!;
    const title = pick(maintenanceTitles[category.name]);
    const raiser = pick(allStaff);
    const technician = pick(assetManagers);
    const createdAt = daysAgo(randInt(3, 175));

    const data: Prisma.MaintenanceRequestUncheckedCreateInput = {
      organizationId: org.id, assetId: asset.id, raisedById: raiser.id,
      title, description: `${title}. Reported by ${raiser.firstName} ${raiser.lastName}.`,
      priority: pick(priorities), status, createdAt,
    };
    if (status !== MaintenanceStatus.PENDING) {
      data.approvedById = pick(assetManagers).id;
      data.approvedAt = daysAgo(randInt(1, 3), 12);
      if (status === MaintenanceStatus.REJECTED) data.rejectionReason = "Not covered under current maintenance budget";
    }
    if ([MaintenanceStatus.TECHNICIAN_ASSIGNED, MaintenanceStatus.IN_PROGRESS, MaintenanceStatus.RESOLVED].includes(status)) {
      data.technicianId = technician.id;
      data.assignedAt = daysAgo(randInt(1, 2), 14);
    }
    if (status === MaintenanceStatus.RESOLVED) {
      data.resolution = "Issue resolved and asset returned to service.";
      data.resolvedAt = daysAgo(randInt(0, 1), 16);
    }

    const mr = await prisma.maintenanceRequest.create({ data });
    activityLog.push({ organizationId: org.id, userId: raiser.id, action: "CREATE_MAINTENANCE_REQUEST", entityType: "MaintenanceRequest", entityId: mr.id, metadata: { asset: asset.assetTag }, createdAt });
    if (status === MaintenanceStatus.RESOLVED) {
      activityLog.push({ organizationId: org.id, userId: technician.id, action: "RESOLVE_MAINTENANCE", entityType: "MaintenanceRequest", entityId: mr.id, createdAt: data.resolvedAt as Date });
    }
  }
  console.log(`Created ${maintenanceStatusCycle.length} maintenance requests`);

  // ---- Audit Cycles ----
  const closedCycleAssets = allAssetsFlat.filter((a) => a.status !== AssetStatus.DISPOSED).slice(0, 25);
  const closedCycle = await prisma.auditCycle.create({
    data: {
      organizationId: org.id, name: "FY25 Year-End Inventory Audit",
      description: "Full inventory verification across all departments.",
      startDate: daysAgo(70), endDate: daysAgo(40), closedAt: daysAgo(39),
      auditorId: assetManagers[0].id, createdById: orgAdmin.id, status: AuditCycleStatus.CLOSED,
    },
  });
  activityLog.push({ organizationId: org.id, userId: orgAdmin.id, action: "CREATE_AUDIT_CYCLE", entityType: "AuditCycle", entityId: closedCycle.id, metadata: { name: closedCycle.name }, createdAt: daysAgo(70) });

  for (let i = 0; i < closedCycleAssets.length; i++) {
    const asset = closedCycleAssets[i];
    const isMissing = i === 3 || i === 11;
    const isDamaged = i === 7 || i === 18;
    const itemStatus = isMissing ? AuditItemStatus.MISSING : isDamaged ? AuditItemStatus.DAMAGED : AuditItemStatus.VERIFIED;
    await prisma.auditItem.create({
      data: {
        cycleId: closedCycle.id, assetId: asset.id, status: itemStatus,
        notes: isMissing ? "Not found during physical count" : isDamaged ? "Visible damage noted, needs repair" : undefined,
        verifiedAt: daysAgo(randInt(41, 65)), verifiedById: assetManagers[0].id,
      },
    });
  }
  activityLog.push({ organizationId: org.id, userId: assetManagers[0].id, action: "CLOSE_AUDIT_CYCLE", entityType: "AuditCycle", entityId: closedCycle.id, metadata: { assetsMarkedLost: 2 }, createdAt: daysAgo(39) });
  notifications.push({
    organizationId: org.id, userId: orgAdmin.id, type: NotificationType.AUDIT_DISCREPANCY,
    title: "Audit discrepancies found", message: `"${closedCycle.name}" closed with 2 missing and 2 damaged assets.`,
    entityType: "AuditCycle", entityId: closedCycle.id, isRead: true, createdAt: daysAgo(39),
  });

  const itAndElectronics = [...assetsByCategory[categories[0].id], ...assetsByCategory[categories[4].id]].slice(0, 12);
  const openCycle = await prisma.auditCycle.create({
    data: {
      organizationId: org.id, name: "Mid-Year Spot Check - Electronics & IT",
      description: "Focused verification of high-value electronics and IT assets.",
      startDate: daysAgo(10), auditorId: assetManagers[1].id, createdById: orgAdmin.id, status: AuditCycleStatus.IN_PROGRESS,
    },
  });
  activityLog.push({ organizationId: org.id, userId: orgAdmin.id, action: "CREATE_AUDIT_CYCLE", entityType: "AuditCycle", entityId: openCycle.id, metadata: { name: openCycle.name }, createdAt: daysAgo(10) });

  for (let i = 0; i < itAndElectronics.length; i++) {
    const asset = itAndElectronics[i];
    const verified = i < 7;
    await prisma.auditItem.create({
      data: {
        cycleId: openCycle.id, assetId: asset.id,
        status: verified ? AuditItemStatus.VERIFIED : AuditItemStatus.PENDING,
        verifiedAt: verified ? daysAgo(randInt(1, 8)) : null,
        verifiedById: verified ? assetManagers[1].id : null,
      },
    });
  }
  notifications.push({
    organizationId: org.id, userId: assetManagers[1].id, type: NotificationType.AUDIT_ASSIGNED,
    title: "New audit cycle assigned", message: `You've been assigned as auditor for "${openCycle.name}".`,
    entityType: "AuditCycle", entityId: openCycle.id, isRead: false, createdAt: daysAgo(10),
  });
  console.log("Created 2 audit cycles (1 closed with discrepancies, 1 in progress)");

  // ---- Notifications ----
  for (const a of allocatedAssets.slice(0, 6)) {
    notifications.push({
      organizationId: org.id, userId: a.holderId, type: NotificationType.ASSET_ASSIGNED,
      title: "Asset assigned to you", message: `${a.assetTag} has been allocated to you.`,
      entityType: "Asset", entityId: a.id, isRead: Math.random() < 0.5, createdAt: daysAgo(randInt(2, 30)),
    });
  }
  notifications.push({
    organizationId: org.id, userId: deptHeads[0].id, type: NotificationType.MAINTENANCE_RESOLVED,
    title: "Maintenance resolved", message: "A maintenance ticket on your department's asset has been resolved.",
    entityType: "MaintenanceRequest", isRead: false, createdAt: daysAgo(2),
  });
  notifications.push({
    organizationId: org.id, userId: employees[0].id, type: NotificationType.BOOKING_APPROVED,
    title: "Booking approved", message: "Your booking for Boardroom Alpha has been approved.",
    entityType: "Booking", isRead: true, createdAt: daysAgo(5),
  });
  notifications.push({
    organizationId: org.id, userId: employees[1].id, type: NotificationType.BOOKING_REJECTED,
    title: "Booking rejected", message: "Your booking request could not be approved - resource already committed.",
    entityType: "Booking", isRead: false, createdAt: daysAgo(4),
  });

  await prisma.notification.createMany({ data: notifications });
  await prisma.activityLog.createMany({
    data: activityLog.map((e) => ({ ...e, metadata: e.metadata as Prisma.InputJsonValue | undefined })),
  });

  console.log("\nDemo seed complete.");
  console.log(`Organization: Meridian Facilities (${org.slug})`);
  console.log(`All demo accounts share the password: ${DEMO_PASSWORD}`);
  console.log(`  Org Admin:        ${orgAdmin.email}`);
  console.log(`  Asset Manager:    ${assetManagers[0].email}`);
  console.log(`  Department Head:  ${deptHeads[0].email}`);
  console.log(`  Employee:         ${employees[0].email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
