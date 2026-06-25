import { PrismaClient } from "@prisma/client";

export async function seedSampleData(prisma: PrismaClient) {
  const mp = await prisma.profile.findUnique({ where: { email: "mp@smp.com" } });
  const pa = await prisma.profile.findUnique({ where: { email: "pa@smp.com" } });
  const staff = await prisma.profile.findUnique({ where: { email: "staff@smp.com" } });

  if (!mp || !pa || !staff) {
    console.log("   ⚠ Skipping sample data — profiles not found");
    return;
  }

  // Sample contacts
  const contacts = [
    { fullName: "Rajesh Kumar", phone: "+91 9845012345", designation: "District Collector", organization: "Government of Karnataka", category: "Government", birthday: new Date("1975-03-15"), createdBy: staff.id },
    { fullName: "Sunita Devi", phone: "+91 9845012346", designation: "Tahsildar", organization: "Revenue Department", category: "Government", birthday: new Date("1980-07-22"), createdBy: staff.id },
    { fullName: "Mohammed Ashraf", phone: "+91 9845012347", designation: "Editor", organization: "Deccan Herald", category: "Media", createdBy: staff.id },
    { fullName: "Lakshmi Narasimha", phone: "+91 9845012348", designation: "President", organization: "Farmers Association", category: "Social", anniversary: new Date("2000-01-10"), createdBy: staff.id },
    { fullName: "Priya Sharma", phone: "+91 9845012349", email: "priya@gmail.com", designation: "Principal", organization: "Government High School", category: "Education", createdBy: staff.id },
  ];

  for (const contact of contacts) {
    await prisma.contact.upsert({
      where: { id: contact.fullName },
      update: {},
      create: contact,
    }).catch(() => prisma.contact.create({ data: contact }));
  }

  // Sample development works
  const works = [
    { title: "NH-44 Flyover Construction", sector: "ROADS" as const, status: "IN_PROGRESS" as const, budget: 15000000, location: "Hebbal Junction, Bengaluru", latitude: 13.0358, longitude: 77.5970, createdBy: pa.id },
    { title: "Cauvery Water Supply Phase III", sector: "WATER" as const, status: "APPROVED" as const, budget: 50000000, location: "Mandya District", latitude: 12.5218, longitude: 76.8951, createdBy: pa.id },
    { title: "Rural Electrification - Tumkur", sector: "ELECTRICITY" as const, status: "COMPLETED" as const, budget: 8000000, location: "Tumakuru Rural", latitude: 13.3379, longitude: 77.1173, createdBy: pa.id },
    { title: "Primary Health Center Upgrade", sector: "HEALTH" as const, status: "IN_PROGRESS" as const, budget: 5000000, location: "Anekal, Bengaluru Rural", latitude: 12.7105, longitude: 77.6968, createdBy: pa.id },
    { title: "Government School Building", sector: "EDUCATION" as const, status: "PROPOSED" as const, budget: 12000000, location: "Devanahalli", latitude: 13.2473, longitude: 77.7139, createdBy: pa.id },
  ];

  for (const work of works) {
    await prisma.developmentWork.create({ data: work }).catch(() => {});
  }

  // Sample complaints
  const complaints = [
    { subject: "Road pothole near bus stand", description: "Large pothole on the main road near the central bus stand causing accidents", complainantName: "Ramesh B.", complainantPhone: "+91 9845099001", priority: "HIGH" as const, status: "RECEIVED" as const, location: "Central Bus Stand", createdBy: staff.id },
    { subject: "Water supply disruption", description: "No water supply for the past 3 days in Ward 15", complainantName: "Savitha K.", complainantPhone: "+91 9845099002", priority: "CRITICAL" as const, status: "VERIFIED" as const, location: "Ward 15, Jayanagar", createdBy: staff.id },
    { subject: "Street light not working", description: "Street lights on MG Road have been non-functional for a week", complainantName: "Ahmed Khan", priority: "MEDIUM" as const, status: "IN_REVIEW" as const, location: "MG Road", createdBy: staff.id },
    { subject: "Garbage collection irregular", description: "Garbage not being collected regularly in the neighborhood", complainantName: "Geetha R.", complainantPhone: "+91 9845099004", priority: "LOW" as const, status: "FORWARDED" as const, createdBy: staff.id },
    { subject: "School building repair needed", description: "Roof of the government school is leaking during rains", complainantName: "Manjunath H.", priority: "HIGH" as const, status: "RESOLVED" as const, resolution: "Repair work completed", createdBy: staff.id },
  ];

  for (const complaint of complaints) {
    await prisma.complaint.create({ data: complaint }).catch(() => {});
  }

  // Sample MPLADS fund data
  const fundYears = [2021, 2022, 2023, 2024, 2025];
  for (const year of fundYears) {
    const allocated = 50000000;
    const released = allocated * (0.5 + Math.random() * 0.4);
    const utilized = released * (0.4 + Math.random() * 0.5);
    await prisma.mpladsFund.upsert({
      where: { year },
      update: {},
      create: { year, allocated, released, utilized, balance: released - utilized, updatedBy: pa.id },
    });
  }

  // Sample events
  const today = new Date();
  const events = [
    { title: "Morning briefing with PA", eventDate: today, startTime: "09:00", endTime: "09:30", location: "Office", status: "CONFIRMED" as const, isFinalized: true, createdBy: pa.id },
    { title: "Visit to PHC Anekal", eventDate: today, startTime: "11:00", endTime: "13:00", location: "Anekal PHC", status: "CONFIRMED" as const, isFinalized: true, createdBy: pa.id },
    { title: "Meeting with District Collector", eventDate: today, startTime: "15:00", endTime: "16:00", location: "DC Office", status: "CONFIRMED" as const, isFinalized: true, createdBy: pa.id },
  ];

  for (const event of events) {
    await prisma.planTodayEvent.create({ data: event }).catch(() => {});
  }

  // Railway quota config
  await prisma.railwayQuotaConfig.upsert({
    where: { id: "default-eq-config" },
    update: {},
    create: { id: "default-eq-config", quotaType: "Emergency", maxPerDay: 4, maxPerMonth: 60 },
  });

  console.log("   ✓ Sample data seeded (contacts, works, complaints, funds, events)");
}
