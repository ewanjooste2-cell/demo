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
    update: {},
    create: { name: "Petro Venter", email: "principal@demo.co.za", passwordHash: password, role: "ADMIN" },
  });
  const agent1 = await prisma.user.upsert({
    where: { email: "sipho@demo.co.za" },
    update: {},
    create: { name: "Sipho Dlamini", email: "sipho@demo.co.za", passwordHash: password, role: "AGENT" },
  });
  const agent2 = await prisma.user.upsert({
    where: { email: "anke@demo.co.za" },
    update: {},
    create: { name: "Anke du Toit", email: "anke@demo.co.za", passwordHash: password, role: "AGENT" },
  });
  const agent3 = await prisma.user.upsert({
    where: { email: "marius@demo.co.za" },
    update: {},
    create: { name: "Marius Steyn", email: "marius@demo.co.za", passwordHash: password, role: "AGENT" },
  });

  // Centurion, Gauteng listings. soldAgo (days) marks a completed sale.
  const listingsData = [
    { webRef: "T4236101", title: "3 Bedroom House in Eldoraigne", address: "12 Willem Botha St", suburb: "Eldoraigne", price: 2850000, propertyType: "House", bedrooms: 3, agentId: agent1.id, base: 90, lat: -25.8552, lng: 28.154 },
    { webRef: "T4236102", title: "2 Bedroom Apartment in Die Hoewes", address: "8 Lenchen Ave", suburb: "Die Hoewes", price: 1450000, propertyType: "Apartment", bedrooms: 2, agentId: agent1.id, base: 140, lat: -25.8524, lng: 28.1965 },
    { webRef: "T4236103", title: "4 Bedroom Family Home in Irene", address: "45 Stopforth Lane", suburb: "Irene", price: 5200000, propertyType: "House", bedrooms: 4, agentId: agent2.id, base: 60, lat: -25.8898, lng: 28.2121 },
    { webRef: "T4236104", title: "Vacant Land in Monavoni", address: "Plot 221, Monavoni AH", suburb: "Monavoni", price: 980000, propertyType: "Vacant Land", bedrooms: null, agentId: agent2.id, base: 25, lat: -25.9042, lng: 28.1057 },
    { webRef: "T4236105", title: "3 Bedroom Townhouse in Wierda Park", address: "Unit 14, Silwerboom Estate", suburb: "Wierda Park", price: 2150000, propertyType: "Townhouse", bedrooms: 3, agentId: agent1.id, base: 110, lat: -25.8663, lng: 28.1462 },
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

  // Leads across the last ~8 weeks.
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

  // Historical won/lost buyers across the last 12 months — gives CAC a monthly trend.
  const agentsList = [agent1, agent2, agent3];
  for (let m = 11; m >= 0; m--) {
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

  // Listing presentations (mandate pitches) — last 12 months, per agent.
  await prisma.presentation.deleteMany({});
  for (let m = 11; m >= 0; m--) {
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
  for (let m = 11; m >= 0; m--) {
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
  for (let m = 11; m >= 0; m--) {
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

  console.log("Seeded:", {
    users: await prisma.user.count(),
    listings: await prisma.listing.count(),
    sold: await prisma.listing.count({ where: { status: "SOLD" } }),
    snapshots: await prisma.viewSnapshot.count(),
    leads: await prisma.lead.count(),
    presentations: await prisma.presentation.count(),
    agentCosts: await prisma.agentCost.count(),
    marketingSpend: await prisma.marketingSpend.count(),
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
