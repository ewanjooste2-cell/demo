import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DAY = 24 * 60 * 60 * 1000;

function daysAgo(n: number) {
  const d = new Date(Date.now() - n * DAY);
  d.setHours(8, 0, 0, 0);
  return d;
}

/** First day of the month, n months ago. */
function monthStart(n: number) {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  d.setMonth(d.getMonth() - n);
  return d;
}

async function main() {
  const password = await bcrypt.hash("Password123!", 10);

  const admin = await prisma.user.upsert({
    where: { email: "principal@demo.co.za" },
    update: { phone: "+27821110001", calendarToken: "cal-petro-7f3a" },
    create: { name: "Petro Venter", email: "principal@demo.co.za", passwordHash: password, role: "ADMIN", phone: "+27821110001", calendarToken: "cal-petro-7f3a" },
  });
  const agent1 = await prisma.user.upsert({
    where: { email: "sipho@demo.co.za" },
    update: { phone: "+27821110002", calendarToken: "cal-sipho-2b9c" },
    create: { name: "Sipho Dlamini", email: "sipho@demo.co.za", passwordHash: password, role: "AGENT", phone: "+27821110002", calendarToken: "cal-sipho-2b9c" },
  });
  const agent2 = await prisma.user.upsert({
    where: { email: "anke@demo.co.za" },
    update: { phone: "+27821110003", calendarToken: "cal-anke-5d1e" },
    create: { name: "Anke du Toit", email: "anke@demo.co.za", passwordHash: password, role: "AGENT", phone: "+27821110003", calendarToken: "cal-anke-5d1e" },
  });
  const agent3 = await prisma.user.upsert({
    where: { email: "marius@demo.co.za" },
    update: { phone: "+27821110004", calendarToken: "cal-marius-8a4f" },
    create: { name: "Marius Steyn", email: "marius@demo.co.za", passwordHash: password, role: "AGENT", phone: "+27821110004", calendarToken: "cal-marius-8a4f" },
  });
  const agent4 = await prisma.user.upsert({
    where: { email: "rvanzyl67@gmail.com" },
    update: { phone: "+27824661952", calendarToken: "cal-ruan-9k2p" },
    create: { name: "Ruan van Zyl", email: "rvanzyl67@gmail.com", passwordHash: password, role: "AGENT", phone: "+27824661952", calendarToken: "cal-ruan-9k2p" },
  });

  // Centurion, Gauteng listings. soldAgo (days) marks a completed sale.
  const listingsData = [
    { webRef: "T4236101", title: "3 Bedroom House in Eldoraigne", address: "12 Willem Botha St", suburb: "Eldoraigne", price: 2850000, propertyType: "House", bedrooms: 3, agentId: agent1.id, base: 90, lat: -25.8552, lng: 28.154 },
    { webRef: "T4236102", title: "2 Bedroom Apartment in Die Hoewes", address: "8 Lenchen Ave", suburb: "Die Hoewes", price: 1450000, propertyType: "Apartment", bedrooms: 2, agentId: agent1.id, base: 140, lat: -25.8524, lng: 28.1965 },
    { webRef: "T4236103", title: "4 Bedroom Family Home in Irene", address: "45 Stopforth Lane", suburb: "Irene", price: 5200000, propertyType: "House", bedrooms: 4, agentId: agent2.id, base: 60, lat: -25.8898, lng: 28.2121 },
    { webRef: "T4236104", title: "Vacant Land in Monavoni", address: "Plot 221, Monavoni AH", suburb: "Monavoni", price: 980000, propertyType: "Vacant Land", bedrooms: null, agentId: agent2.id, base: 25, lat: -25.9042, lng: 28.1057 },
    { webRef: "T4236105", title: "3 Bedroom Townhouse in Wierda Park", address: "Unit 14, Silwerboom Estate", suburb: "Wierda Park", price: 2150000, propertyType: "Townhouse", bedrooms: 3, agentId: agent4.id, base: 110, lat: -25.8663, lng: 28.1462 },
    { webRef: "T4236106", title: "Penthouse in Centurion Central", address: "1201 Southdowns Towers", suburb: "Centurion Central", price: 4750000, propertyType: "Apartment", bedrooms: 3, agentId: agent2.id, base: 170, status: "UNDER_OFFER", lat: -25.858, lng: 28.1894 },
    { webRef: "T4236107", title: "5 Bedroom Estate Home in Midstream", address: "3 Bondev Dr", suburb: "Midstream", price: 8900000, propertyType: "House", bedrooms: 5, agentId: agent2.id, base: 45, lat: -25.9169, lng: 28.1855 },
    { webRef: "T4236108", title: "2 Bedroom Garden Cottage in Doringkloof", address: "67 Kraalnaboom Ave", suburb: "Doringkloof", price: 1690000, propertyType: "House", bedrooms: 2, agentId: agent1.id, base: 75, lat: -25.8536, lng: 28.2064 },
    { webRef: "T4236109", title: "3 Bedroom Duplex in Rooihuiskraal", address: "18 Suikerbossie St", suburb: "Rooihuiskraal", price: 1850000, propertyType: "Townhouse", bedrooms: 3, agentId: agent3.id, base: 85, lat: -25.8846, lng: 28.147 },
    { webRef: "T4236110", title: "Modern Loft Apartment in Highveld", address: "22 Oak Ave", suburb: "Highveld", price: 2450000, propertyType: "Apartment", bedrooms: 1, agentId: agent3.id, base: 95, lat: -25.8779, lng: 28.1834 },
    // Sold stock — drives the sales dashboard.
    { webRef: "T4235901", title: "4 Bedroom House in Clubview", address: "5 Von Willich Ave", suburb: "Clubview", price: 3200000, propertyType: "House", bedrooms: 4, agentId: agent1.id, base: 120, soldAgo: 21, lat: -25.8459, lng: 28.1611 },
    { webRef: "T4235902", title: "Family Home with Flatlet in The Reeds", address: "31 Kwikkie Cres", suburb: "The Reeds", price: 2650000, propertyType: "House", bedrooms: 4, agentId: agent1.id, base: 100, soldAgo: 74, lat: -25.8942, lng: 28.1394 },
    { webRef: "T4235903", title: "2 Bedroom Apartment in Zwartkop", address: "Unit 9, Audas Estate", suburb: "Zwartkop", price: 1590000, propertyType: "Apartment", bedrooms: 2, agentId: agent1.id, base: 90, soldAgo: 152, lat: -25.843, lng: 28.1826 },
    { webRef: "T4235904", title: "3 Bedroom House in Valhalla", address: "77 Bataleur Rd", suburb: "Valhalla", price: 2100000, propertyType: "House", bedrooms: 3, agentId: agent1.id, base: 80, soldAgo: 258, lat: -25.8129, lng: 28.1553 },
    { webRef: "T4235905", title: "Luxury Villa in Cornwall Hill", address: "8 Nellmapius Dr", suburb: "Cornwall Hill", price: 7400000, propertyType: "House", bedrooms: 5, agentId: agent2.id, base: 55, soldAgo: 12, lat: -25.9036, lng: 28.2255 },
    { webRef: "T4235906", title: "Golf Estate Home in Blue Valley", address: "14 Torrens Way", suburb: "Blue Valley Golf Estate", price: 5850000, propertyType: "House", bedrooms: 4, agentId: agent2.id, base: 70, soldAgo: 98, lat: -25.9295, lng: 28.147 },
    { webRef: "T4235907", title: "Top Floor Apartment in Pierre van Ryneveld", address: "402 Fever Tree", suburb: "Pierre van Ryneveld", price: 3350000, propertyType: "Apartment", bedrooms: 3, agentId: agent2.id, base: 130, soldAgo: 205, lat: -25.8228, lng: 28.228 },
    { webRef: "T4235908", title: "Starter Home in Heuweloord", address: "3 Bosluisberg St", suburb: "Heuweloord", price: 1250000, propertyType: "House", bedrooms: 2, agentId: agent3.id, base: 65, soldAgo: 47, lat: -25.8885, lng: 28.1204 },
    { webRef: "T4235909", title: "Townhouse in Amberfield", address: "Unit 3, Amberfield Manor", suburb: "Amberfield", price: 2380000, propertyType: "Townhouse", bedrooms: 3, agentId: agent3.id, base: 88, soldAgo: 190, lat: -25.9083, lng: 28.135 },
    // Prior-year sales — the baseline the dashboard compares the last 12 months against.
    { webRef: "T4235801", title: "3 Bedroom House in Lyttelton Manor", address: "22 Rabie St", suburb: "Lyttelton Manor", price: 2450000, propertyType: "House", bedrooms: 3, agentId: agent1.id, base: 95, soldAgo: 395, lat: -25.8391, lng: 28.2062 },
    { webRef: "T4235802", title: "Townhouse in Celtisdal", address: "Unit 7, Celtis Ridge", suburb: "Celtisdal", price: 1780000, propertyType: "Townhouse", bedrooms: 3, agentId: agent1.id, base: 82, soldAgo: 468, lat: -25.9014, lng: 28.1263 },
    { webRef: "T4235803", title: "Family Home in Eldo Park", address: "9 Marabou Ave", suburb: "Eldo Park", price: 2950000, propertyType: "House", bedrooms: 4, agentId: agent2.id, base: 74, soldAgo: 430, lat: -25.8749, lng: 28.1352 },
    { webRef: "T4235804", title: "Apartment in Southdowns", address: "204 The Regency", suburb: "Southdowns", price: 2100000, propertyType: "Apartment", bedrooms: 2, agentId: agent2.id, base: 105, soldAgo: 552, lat: -25.9126, lng: 28.2019 },
    { webRef: "T4235805", title: "4 Bedroom House in Raslouw", address: "15 Cormorant Cl", suburb: "Raslouw", price: 3600000, propertyType: "House", bedrooms: 4, agentId: agent3.id, base: 91, soldAgo: 505, lat: -25.8797, lng: 28.1039 },
    { webRef: "T4235806", title: "Simplex in The Reeds", address: "Unit 12, Reedsdal", suburb: "The Reeds", price: 1520000, propertyType: "Townhouse", bedrooms: 2, agentId: agent3.id, base: 77, soldAgo: 640, lat: -25.8971, lng: 28.1441 },
  ];

  const listings = [];
  for (const [i, l] of listingsData.entries()) {
    const { base, soldAgo, lat, lng, status, ...data } = l as (typeof listingsData)[number] & {
      status?: string;
      soldAgo?: number;
    };
    const resolvedStatus = soldAgo != null ? "SOLD" : (status ?? "ACTIVE");
    const soldDate = soldAgo != null ? daysAgo(soldAgo) : null;
    const commissionPct = 4.5 + ((i * 7) % 6) * 0.5; // 4.5–7%
    const listing = await prisma.listing.upsert({
      where: { webRef: l.webRef },
      update: { ...data, latitude: lat, longitude: lng, status: resolvedStatus, soldDate, commissionPct },
      create: {
        ...data,
        status: resolvedStatus,
        soldDate,
        commissionPct,
        latitude: lat,
        longitude: lng,
        listedDate: daysAgo(soldAgo != null ? soldAgo + 60 + i * 3 : 70 - i * 4),
        url: `https://www.privateproperty.co.za/for-sale/some-listing/${l.webRef}`,
      },
    });
    listings.push({ ...listing, base });
  }

  // Weekly snapshots for 10 weeks — cumulative views grow at a per-listing rate.
  await prisma.viewSnapshot.deleteMany({});
  for (const listing of listings) {
    let views = 0;
    let leads = 0;
    let alerts = 0;
    for (let week = 9; week >= 0; week--) {
      const wobble = 0.6 + ((listing.base * (week + 3)) % 17) / 17;
      views += Math.round(listing.base * wobble);
      alerts += Math.round((listing.base / 4) * wobble);
      if (week % 2 === 0) leads += Math.max(1, Math.round(listing.base / 40));
      await prisma.viewSnapshot.create({
        data: {
          listingId: listing.id,
          capturedAt: daysAgo(week * 7),
          views,
          alertsSent: alerts,
          leadsCount: leads,
        },
      });
    }
  }

  // Leads across the last ~8 weeks. Deals/showings/tasks reference leads, so
  // they clear first to keep re-seeding idempotent.
  await prisma.task.deleteMany({});
  await prisma.dealDocument.deleteMany({});
  await prisma.deal.deleteMany({});
  await prisma.showing.deleteMany({});
  await prisma.leadNote.deleteMany({});
  await prisma.lead.deleteMany({});
  const firstNames = ["Johan", "Thandi", "Pieter", "Naledi", "Chris", "Zanele", "Riaan", "Lerato", "Megan", "Kabelo", "Elna", "David", "Busi", "Werner", "Aisha", "Frik", "Nomsa", "Grant", "Carla", "Tebogo", "Sarah", "Neil", "Precious", "Jaco"];
  const surnames = ["Botha", "Nkosi", "van Wyk", "Mokoena", "Smith", "Khumalo", "Pretorius", "Molefe", "Daniels", "Sithole", "Fourie", "Adams"];
  const statuses = ["NEW", "NEW", "NEW", "CONTACTED", "CONTACTED", "CONTACTED", "VIEWING", "VIEWING", "OFFER", "WON", "LOST", "LOST"];
  const sources = ["EMAIL", "EMAIL", "EMAIL", "WEBHOOK", "IMPORT", "MANUAL"];

  for (let i = 0; i < 34; i++) {
    const listing = listings[i % listings.length];
    const name = `${firstNames[i % firstNames.length]} ${surnames[(i * 7) % surnames.length]}`;
    const status = statuses[(i * 5) % statuses.length];
    const lead = await prisma.lead.create({
      data: {
        name,
        email: `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@example.com`,
        phone: `08${(i % 4) + 1} ${String(2000000 + i * 34567).slice(0, 3)} ${String(4000 + i * 137).slice(0, 4)}`,
        message: `Hi, I would like more information about ${listing.title} (${listing.webRef}). When can I view the property?`,
        source: sources[i % sources.length],
        status,
        receivedAt: daysAgo((i * 53) % 56),
        listingId: listing.id,
        agentId: listing.agentId,
      },
    });
    if (status !== "NEW") {
      await prisma.leadNote.create({
        data: {
          leadId: lead.id,
          userId: listing.agentId,
          body: status === "WON" ? "Offer accepted — sale in progress." : "Called and left a message, following up.",
        },
      });
    }
  }

  // Historical won/lost buyers across the last 24 months — gives CAC a monthly
  // trend plus a prior-year baseline for the dashboard deltas.
  const agentsList = [agent1, agent2, agent3];
  for (let m = 23; m >= 0; m--) {
    const won = 2 + ((m * 5) % 3); // 2–4 clients acquired per month
    for (let k = 0; k < won + 1; k++) {
      const i = m * 7 + k;
      const listing = listings[(i * 3) % listings.length];
      const name = `${firstNames[(i * 5) % firstNames.length]} ${surnames[(i * 11) % surnames.length]}`;
      const receivedAt = new Date(monthStart(m));
      receivedAt.setDate(2 + ((i * 9) % 24));
      receivedAt.setHours(10, 0, 0, 0);
      await prisma.lead.create({
        data: {
          name,
          email: `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@example.com`,
          source: sources[i % sources.length],
          status: k < won ? "WON" : "LOST",
          receivedAt,
          listingId: listing.id,
          agentId: listing.agentId,
        },
      });
    }
  }

  // Listing presentations (mandate pitches) — last 24 months, per agent.
  await prisma.presentation.deleteMany({});
  for (let m = 23; m >= 0; m--) {
    for (const [ai, agent] of agentsList.entries()) {
      const count = 2 + ((m * 3 + ai * 5) % 3); // 2–4 presentations per agent per month
      for (let k = 0; k < count; k++) {
        const heldAt = new Date(monthStart(m));
        heldAt.setDate(3 + k * 8 + ai * 2);
        heldAt.setHours(11, 0, 0, 0);
        const roll = (m * 7 + ai * 11 + k * 13) % 10;
        // Recent pitches may still be undecided; otherwise ~55% sign an exclusive mandate.
        const outcome = m === 0 && k === count - 1 ? "PENDING" : roll < 5.5 ? "SIGNED" : "DECLINED";
        await prisma.presentation.create({ data: { agentId: agent.id, heldAt, outcome } });
      }
    }
  }

  // Monthly cost of supporting each agent: desk fee, admin, training, tools.
  await prisma.agentCost.deleteMany({});
  for (let m = 23; m >= 0; m--) {
    for (const [ai, agent] of agentsList.entries()) {
      await prisma.agentCost.create({
        data: {
          agentId: agent.id,
          month: monthStart(m),
          amount: 16000 + ai * 2500 + ((m * 3 + ai) % 5) * 1400,
        },
      });
    }
  }

  // Monthly marketing spend by channel.
  await prisma.marketingSpend.deleteMany({});
  const channels: [string, number][] = [
    ["Property portals", 14000],
    ["Social media", 8000],
    ["Print & boards", 6000],
    ["Google Ads", 9000],
  ];
  for (let m = 23; m >= 0; m--) {
    for (const [ci, [channel, base]] of channels.entries()) {
      await prisma.marketingSpend.create({
        data: {
          month: monthStart(m),
          channel,
          amount: base + ((m * 5 + ci * 7) % 6) * 900,
        },
      });
    }
  }

  // --- Deal rooms: transactions from offer to registration ---------------------
  const DOC_SET: [string, string][] = [
    ["Exclusive mandate", "MANDATE"],
    ["Offer to purchase", "OTP"],
    ["FICA — buyer", "FICA"],
    ["FICA — seller", "FICA"],
    ["Property condition disclosure", "DISCLOSURE"],
    ["Compliance certificates (electrical, gas)", "COMPLIANCE"],
    ["Bond grant letter", "BOND"],
  ];
  // stageIdx: how far the deal has progressed; docs up to that point are signed.
  const STAGES = ["OFFER", "OTP_SIGNED", "BOND", "INSPECTIONS", "TRANSFER", "REGISTERED"];
  const dealPlans = [
    { webRef: "T4236106", stage: 1, daysOpen: 18 }, // penthouse under offer
    { webRef: "T4235901", stage: 4, daysOpen: 45 }, // sold, in transfer
    { webRef: "T4235905", stage: 5, daysOpen: 60 }, // registered
    { webRef: "T4235908", stage: 2, daysOpen: 30 }, // sold, bond stage
    { webRef: "T4236103", stage: 0, daysOpen: 4 }, // fresh offer on active listing
  ];
  const allLeads = await prisma.lead.findMany({ where: { status: { in: ["OFFER", "WON"] } }, take: 10 });
  const deals = [];
  for (const [di, plan] of dealPlans.entries()) {
    const listing = listings.find((l) => l.webRef === plan.webRef)!;
    const deal = await prisma.deal.create({
      data: {
        listingId: listing.id,
        leadId: allLeads[di % allLeads.length]?.id,
        agentId: listing.agentId,
        stage: STAGES[plan.stage],
        salePrice: Math.round((listing.price * (97 - di)) / 100 / 1000) * 1000, // slightly under asking
        commissionPct: listing.commissionPct ?? 5,
        agentSplitPct: 55 + (di % 3) * 5,
        payoutStatus: plan.stage === 5 ? (di % 2 === 0 ? "PAID" : "PENDING") : "PENDING",
        openedAt: daysAgo(plan.daysOpen),
        closedAt: plan.stage === 5 ? daysAgo(plan.daysOpen - 40) : null,
      },
    });
    deals.push(deal);
    for (const [i, [name, kind]] of DOC_SET.entries()) {
      // Docs earlier in the pack sign first as the deal advances.
      const threshold = (i / DOC_SET.length) * 5;
      const status =
        plan.stage > threshold + 1 ? "SIGNED" : plan.stage > threshold ? "SENT" : i < 2 ? "UPLOADED" : "REQUIRED";
      await prisma.dealDocument.create({ data: { dealId: deal.id, name, kind, status } });
    }
  }

  // --- Showings: private viewings + open houses around this week ----------------
  const online = listings.filter((l) => l.status === "ACTIVE" || l.status === "UNDER_OFFER");
  const contactableLeads = await prisma.lead.findMany({
    where: { status: { in: ["CONTACTED", "VIEWING", "NEW"] } },
    take: 20,
  });
  const showingStatuses = ["CONFIRMED", "REQUESTED", "CONFIRMED", "COMPLETED", "CONFIRMED", "CANCELLED"];
  for (let i = 0; i < 14; i++) {
    const listing = online[i % online.length];
    const dayOffset = (i % 10) - 4; // from 4 days ago to 5 days ahead
    const start = new Date(Date.now() + dayOffset * DAY);
    start.setHours(9 + (i * 2) % 8, i % 2 === 0 ? 0 : 30, 0, 0);
    const end = new Date(start.getTime() + 45 * 60 * 1000);
    const past = start.getTime() < Date.now();
    const openHouse = i % 5 === 4;
    await prisma.showing.create({
      data: {
        listingId: listing.id,
        leadId: openHouse ? null : contactableLeads[i % contactableLeads.length]?.id,
        agentId: listing.agentId!,
        startsAt: start,
        endsAt: openHouse ? new Date(start.getTime() + 2 * 60 * 60 * 1000) : end,
        kind: openHouse ? "OPEN_HOUSE" : "PRIVATE",
        status: past ? (i % 6 === 5 ? "CANCELLED" : "COMPLETED") : showingStatuses[i % showingStatuses.length],
        feedback: past && i % 6 !== 5 ? "Buyer liked the layout; concerned about street noise." : null,
      },
    });
  }

  // --- Email outbox: a couple of showing-request notifications ------------------
  await prisma.notification.deleteMany({});
  const notifSamples: [typeof agent1, string][] = [
    [agent1, "Showing request: 3 Bedroom House in Eldoraigne — Hi Sipho, you have a new showing request for tomorrow 10:00 (buyer: Thandi Nkosi). Open the portal to confirm."],
    [agent2, "Showing request: 4 Bedroom Family Home in Irene — Hi Anke, you have a new open house request for Saturday 14:00. Open the portal to confirm."],
  ];
  for (const [u, body] of notifSamples) {
    await prisma.notification.create({
      data: { userId: u.id, channel: "EMAIL", to: u.email, body, status: "SIMULATED", createdAt: daysAgo(1) },
    });
  }

  // --- Team tasks ----------------------------------------------------------------
  const taskPlans: [string, number, string, number | null][] = [
    // title, deal index, status, due in days (null = none)
    ["Chase bond originator for grant letter", 3, "DOING", 1],
    ["Book electrical compliance inspection", 1, "TODO", 2],
    ["Collect FICA docs from buyer", 0, "TODO", 1],
    ["Confirm transfer attorney appointment", 1, "DOING", 3],
    ["Order for-sale board removal", 2, "DONE", null],
    ["Send OTP to seller for counter-signature", 4, "DOING", 0],
    ["Schedule professional photos — Midstream listing", -1, "TODO", 4],
    ["Follow up open-house attendees", -1, "TODO", 2],
    ["Submit commission invoice to attorneys", 2, "DONE", null],
  ];
  for (const [ti, [title, dealIdx, status, dueIn]] of taskPlans.entries()) {
    const deal = dealIdx >= 0 ? deals[dealIdx] : null;
    await prisma.task.create({
      data: {
        title,
        dealId: deal?.id,
        assigneeId: deal?.agentId ?? agentsList[ti % agentsList.length].id,
        status,
        dueAt: dueIn != null ? daysAgo(-dueIn) : null,
        createdAt: daysAgo(3 + (ti % 5)),
      },
    });
  }

  console.log("Seeded:", {
    users: await prisma.user.count(),
    listings: await prisma.listing.count(),
    sold: await prisma.listing.count({ where: { status: "SOLD" } }),
    snapshots: await prisma.viewSnapshot.count(),
    leads: await prisma.lead.count(),
    presentations: await prisma.presentation.count(),
    agentCosts: await prisma.agentCost.count(),
    marketingSpend: await prisma.marketingSpend.count(),
    deals: await prisma.deal.count(),
    dealDocuments: await prisma.dealDocument.count(),
    showings: await prisma.showing.count(),
    tasks: await prisma.task.count(),
  });
  console.log("Admin login: principal@demo.co.za / Password123!");
  console.log("Agent login: sipho@demo.co.za / Password123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
