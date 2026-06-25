import { PrismaClient } from "@prisma/client";

const TRAINS = [
  { trainNo: "12627", trainName: "Karnataka Express", fromStation: "New Delhi", toStation: "Bengaluru", trainType: "SF Express", runDays: "Daily" },
  { trainNo: "12628", trainName: "Karnataka Express", fromStation: "Bengaluru", toStation: "New Delhi", trainType: "SF Express", runDays: "Daily" },
  { trainNo: "12657", trainName: "Chennai Mail", fromStation: "Bengaluru", toStation: "Chennai", trainType: "Mail", runDays: "Daily" },
  { trainNo: "12658", trainName: "Chennai Mail", fromStation: "Chennai", toStation: "Bengaluru", trainType: "Mail", runDays: "Daily" },
  { trainNo: "12007", trainName: "Shatabdi Express", fromStation: "Bengaluru", toStation: "Mysuru", trainType: "Shatabdi", runDays: "Daily" },
  { trainNo: "12008", trainName: "Shatabdi Express", fromStation: "Mysuru", toStation: "Bengaluru", trainType: "Shatabdi", runDays: "Daily" },
  { trainNo: "16523", trainName: "KSR Bengaluru - Karwar Express", fromStation: "Bengaluru", toStation: "Karwar", trainType: "Express", runDays: "Daily" },
  { trainNo: "16524", trainName: "Karwar - KSR Bengaluru Express", fromStation: "Karwar", toStation: "Bengaluru", trainType: "Express", runDays: "Daily" },
  { trainNo: "16215", trainName: "Chamundi Express", fromStation: "Mysuru", toStation: "Chennai", trainType: "Express", runDays: "Daily" },
  { trainNo: "16216", trainName: "Chamundi Express", fromStation: "Chennai", toStation: "Mysuru", trainType: "Express", runDays: "Daily" },
  { trainNo: "12725", trainName: "Rajdhani Express", fromStation: "Bengaluru", toStation: "New Delhi", trainType: "Rajdhani", runDays: "Mon,Wed,Fri" },
  { trainNo: "12726", trainName: "Rajdhani Express", fromStation: "New Delhi", toStation: "Bengaluru", trainType: "Rajdhani", runDays: "Tue,Thu,Sat" },
  { trainNo: "22691", trainName: "Bengaluru Rajdhani", fromStation: "Bengaluru", toStation: "Hazrat Nizamuddin", trainType: "Rajdhani", runDays: "Sun,Tue,Fri" },
  { trainNo: "22692", trainName: "Bengaluru Rajdhani", fromStation: "Hazrat Nizamuddin", toStation: "Bengaluru", trainType: "Rajdhani", runDays: "Mon,Wed,Sat" },
  { trainNo: "12509", trainName: "Bengaluru - Guwahati Express", fromStation: "Bengaluru", toStation: "Guwahati", trainType: "SF Express", runDays: "Tue" },
  { trainNo: "16573", trainName: "Yesvantpur - Mangaluru Junction", fromStation: "Yesvantpur", toStation: "Mangaluru", trainType: "Express", runDays: "Daily" },
  { trainNo: "16574", trainName: "Mangaluru Junction - Yesvantpur", fromStation: "Mangaluru", toStation: "Yesvantpur", trainType: "Express", runDays: "Daily" },
  { trainNo: "17603", trainName: "Kacheguda Express", fromStation: "Bengaluru", toStation: "Kacheguda", trainType: "Express", runDays: "Daily" },
  { trainNo: "17604", trainName: "Kacheguda Express", fromStation: "Kacheguda", toStation: "Bengaluru", trainType: "Express", runDays: "Daily" },
  { trainNo: "12649", trainName: "Karnataka Sampark Kranti", fromStation: "Bengaluru", toStation: "Hazrat Nizamuddin", trainType: "SF Express", runDays: "Wed,Sat" },
  { trainNo: "12650", trainName: "Karnataka Sampark Kranti", fromStation: "Hazrat Nizamuddin", toStation: "Bengaluru", trainType: "SF Express", runDays: "Mon,Fri" },
  { trainNo: "11301", trainName: "Udyan Express", fromStation: "Mumbai CST", toStation: "Bengaluru", trainType: "Express", runDays: "Daily" },
  { trainNo: "11302", trainName: "Udyan Express", fromStation: "Bengaluru", toStation: "Mumbai CST", trainType: "Express", runDays: "Daily" },
  { trainNo: "16589", trainName: "Rani Chennamma Express", fromStation: "Bengaluru", toStation: "Belagavi", trainType: "Express", runDays: "Daily" },
  { trainNo: "16590", trainName: "Rani Chennamma Express", fromStation: "Belagavi", toStation: "Bengaluru", trainType: "Express", runDays: "Daily" },
  { trainNo: "16535", trainName: "Gol Gumbaz Express", fromStation: "Bengaluru", toStation: "Solapur", trainType: "Express", runDays: "Daily" },
  { trainNo: "16536", trainName: "Gol Gumbaz Express", fromStation: "Solapur", toStation: "Bengaluru", trainType: "Express", runDays: "Daily" },
  { trainNo: "16227", trainName: "Hubballi - Bengaluru Express", fromStation: "Hubballi", toStation: "Bengaluru", trainType: "Express", runDays: "Daily" },
  { trainNo: "16228", trainName: "Bengaluru - Hubballi Express", fromStation: "Bengaluru", toStation: "Hubballi", trainType: "Express", runDays: "Daily" },
  { trainNo: "12079", trainName: "Jan Shatabdi Express", fromStation: "Bengaluru", toStation: "Hubballi", trainType: "Jan Shatabdi", runDays: "Daily" },
];

export async function seedTrains(prisma: PrismaClient) {
  for (const train of TRAINS) {
    await prisma.trainMaster.upsert({
      where: { trainNo: train.trainNo },
      update: train,
      create: train,
    });
  }

  console.log(`   ✓ ${TRAINS.length} trains seeded`);
}
