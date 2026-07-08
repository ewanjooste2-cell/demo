import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DAY = 24 * 60 * 60 * 1000;

function daysAgo(n: number) {
  const d = new Date(Date.now() - n * DAY);
  d.setHours(8, 0, 0, 0);
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

  const listingsData = [
    { webRef: "T4236101", title: "3 Bedroom House in Somerset West", address: "12 Bizweni Ave", suburb: "Somerset West", price: 2850000, propertyType: "House", bedrooms: 3, agentId: agent1.id, base: 90 },
    { webRef: "T4236102", title: "2 Bedroom Apartment in Strand", address: "8 Beach Rd", suburb: "Strand", price: 1450000, propertyType: "Apartment", bedrooms: 2, agentId: agent1.id, base: 140 },
    { webRef: "T4236103", title: "4 Bedroom Family Home in Stellenbosch", address: "45 Dorp St", suburb: "Stellenbosch", price: 5200000, propertyType: "House", bedrooms: 4, agentId: agent2.id, base: 60 },
    { webRef: "T4236104", title: "Vacant Land in Gordon's Bay", address: "Plot 221, Mountainside", suburb: "Gordon's Bay", price: 980000, propertyType: "Vacant Land", bedrooms: null, agentId: agent2.id, base: 25 },
    { webRef: "T4236105", title: "3 Bedroom Townhouse in Somerset West", address: "Unit 14, Silwerboom Estate", suburb: "Somerset West", price: 2150000, propertyType: "Townhouse", bedrooms: 3, agentId: agent1.id, base: 110 },
    { webRef: "T4236106", title: "Penthouse with Sea View in Strand", address: "1201 Hibernian Towers", suburb: "Strand", price: 4750000, propertyType: "Apartment", bedrooms: 3, agentId: agent2.id, base: 170 },
    { webRef: "T4236107", title: "5 Bedroom Wine Estate Home", address: "3 Vredenburg Rd", suburb: "Stellenbosch", price: 8900000, propertyType: "House", bedrooms: 5, agentId: agent2.id, base: 45 },
    { webRef: "T4236108", title: "2 Bedroom Garden Cottage", address: "67 Irene Ave", suburb: "Somerset West", price: 1690000, propertyType: "House", bedrooms: 2, agentId: agent1.id, base: 75 },
  ];

  const listings = [];
  for (const [i, l] of listingsData.entries()) {
    const { base, ...data } = l;
    const listing = await prisma.listing.upsert({
      where: { webRef: l.webRef },
      update: {},
      create: {
        ...data,
        status: i === 6 ? "UNDER_OFFER" : "ACTIVE",
        listedDate: daysAgo(70 - i * 4),
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

  console.log("Seeded:", {
    users: await prisma.user.count(),
    listings: await prisma.listing.count(),
    snapshots: await prisma.viewSnapshot.count(),
    leads: await prisma.lead.count(),
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
