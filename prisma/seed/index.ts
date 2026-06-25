import { PrismaClient } from "@prisma/client";
import { seedLocations } from "./locations";
import { seedTrains } from "./trains";
import { seedUsers } from "./users";
import { seedSampleData } from "./sample-data";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...\n");

  console.log("👤 Seeding user profiles...");
  await seedUsers(prisma);

  console.log("🌍 Seeding Karnataka location data...");
  await seedLocations(prisma);

  console.log("🚂 Seeding train master data...");
  await seedTrains(prisma);

  console.log("📦 Seeding sample data...");
  await seedSampleData(prisma);

  console.log("\n✅ Seed completed successfully!");
  console.log("\n📌 Login Credentials:");
  console.log("   MP:    mp@smp.com    / Mp@123");
  console.log("   PA:    pa@smp.com    / Pa@123");
  console.log("   Staff: staff@smp.com / Staff@123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
