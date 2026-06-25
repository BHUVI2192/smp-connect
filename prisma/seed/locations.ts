import { PrismaClient } from "@prisma/client";

const KARNATAKA_DATA = {
  districts: [
    {
      name: "Bengaluru Urban",
      taluks: [
        { name: "Bengaluru North", panchayats: [
          { name: "Yelahanka GP", villages: ["Yelahanka", "Jakkur", "Thanisandra", "Hebbal", "Kodigehalli"] },
          { name: "Dasarahalli GP", villages: ["Dasarahalli", "Laggere", "Peenya", "Jalahalli"] },
        ]},
        { name: "Bengaluru South", panchayats: [
          { name: "Begur GP", villages: ["Begur", "Bommanahalli", "Hongasandra", "Arekere"] },
          { name: "Uttarahalli GP", villages: ["Uttarahalli", "Kengeri", "Rajarajeshwari Nagar"] },
        ]},
        { name: "Bengaluru East", panchayats: [
          { name: "KR Puram GP", villages: ["KR Puram", "Mahadevapura", "Whitefield", "Varthur"] },
          { name: "Anekal GP", villages: ["Anekal", "Chandapura", "Electronic City", "Sarjapur"] },
        ]},
      ],
    },
    {
      name: "Bengaluru Rural",
      taluks: [
        { name: "Devanahalli", panchayats: [
          { name: "Devanahalli GP", villages: ["Devanahalli", "Vijayapura", "Sadahalli", "Nandagudi"] },
          { name: "Avathi GP", villages: ["Avathi", "Budigere", "Chikkajala"] },
        ]},
        { name: "Doddaballapur", panchayats: [
          { name: "Doddaballapur GP", villages: ["Doddaballapur", "Ghati Subramanya", "Tubgere"] },
        ]},
        { name: "Hosakote", panchayats: [
          { name: "Hosakote GP", villages: ["Hosakote", "Sulibele", "Jadigenahalli", "Anugondanahalli"] },
        ]},
        { name: "Nelamangala", panchayats: [
          { name: "Nelamangala GP", villages: ["Nelamangala", "Soladevanahalli", "Thippagondanahalli"] },
        ]},
      ],
    },
    {
      name: "Mysuru",
      taluks: [
        { name: "Mysuru", panchayats: [
          { name: "Mysuru GP", villages: ["Mysuru City", "Srirangapatna", "Mandya Road", "Bogadi"] },
          { name: "Jayapura GP", villages: ["Jayapura", "Bilikere", "Kadakola"] },
        ]},
        { name: "Nanjangud", panchayats: [
          { name: "Nanjangud GP", villages: ["Nanjangud", "Hullahalli", "Tagadur"] },
        ]},
        { name: "T. Narasipura", panchayats: [
          { name: "T. Narasipura GP", villages: ["T. Narasipura", "Bannur", "Sosale"] },
        ]},
        { name: "Hunsur", panchayats: [
          { name: "Hunsur GP", villages: ["Hunsur", "Gavadagere", "Hanagodu"] },
        ]},
      ],
    },
    {
      name: "Mangaluru",
      taluks: [
        { name: "Mangaluru", panchayats: [
          { name: "Mangaluru GP", villages: ["Mangaluru City", "Surathkal", "Ullal", "Mulki"] },
        ]},
        { name: "Bantwal", panchayats: [
          { name: "Bantwal GP", villages: ["Bantwal", "Vitla", "Uppinangady"] },
        ]},
        { name: "Puttur", panchayats: [
          { name: "Puttur GP", villages: ["Puttur", "Sullia", "Kadaba"] },
        ]},
      ],
    },
    {
      name: "Hubli-Dharwad",
      taluks: [
        { name: "Hubli", panchayats: [
          { name: "Hubli GP", villages: ["Hubli City", "Keshwapur", "Gokul Road", "Vidyanagar"] },
        ]},
        { name: "Dharwad", panchayats: [
          { name: "Dharwad GP", villages: ["Dharwad City", "Saptapur", "Lakmanahalli"] },
        ]},
        { name: "Navalgund", panchayats: [
          { name: "Navalgund GP", villages: ["Navalgund", "Annigeri", "Nargund"] },
        ]},
      ],
    },
    {
      name: "Belagavi",
      taluks: [
        { name: "Belagavi", panchayats: [
          { name: "Belagavi GP", villages: ["Belagavi City", "Hindalga", "Kanbargi"] },
        ]},
        { name: "Gokak", panchayats: [
          { name: "Gokak GP", villages: ["Gokak", "Gokak Falls", "Dhupdal"] },
        ]},
        { name: "Athani", panchayats: [
          { name: "Athani GP", villages: ["Athani", "Kagwad", "Ainapur"] },
        ]},
      ],
    },
    {
      name: "Kalaburagi",
      taluks: [
        { name: "Kalaburagi", panchayats: [
          { name: "Kalaburagi GP", villages: ["Kalaburagi City", "Sedam Road", "Humnabad Road"] },
        ]},
        { name: "Aland", panchayats: [
          { name: "Aland GP", villages: ["Aland", "Khandal", "Kadaganchi"] },
        ]},
      ],
    },
    {
      name: "Tumakuru",
      taluks: [
        { name: "Tumakuru", panchayats: [
          { name: "Tumakuru GP", villages: ["Tumakuru City", "Gubbi", "Kyatsandra"] },
        ]},
        { name: "Tiptur", panchayats: [
          { name: "Tiptur GP", villages: ["Tiptur", "Honnavalli", "Nonavinakere"] },
        ]},
      ],
    },
    {
      name: "Shivamogga",
      taluks: [
        { name: "Shivamogga", panchayats: [
          { name: "Shivamogga GP", villages: ["Shivamogga City", "Bhadravathi", "Holehonnur"] },
        ]},
        { name: "Sagar", panchayats: [
          { name: "Sagar GP", villages: ["Sagar", "Jog Falls", "Talaguppa"] },
        ]},
      ],
    },
    {
      name: "Raichur",
      taluks: [
        { name: "Raichur", panchayats: [
          { name: "Raichur GP", villages: ["Raichur City", "Manvi", "Sindhanur"] },
        ]},
      ],
    },
  ],
};

export async function seedLocations(prisma: PrismaClient) {
  // Create Karnataka state
  const state = await prisma.state.upsert({
    where: { code: "KA" },
    update: {},
    create: { name: "Karnataka", code: "KA" },
  });

  let districtCount = 0;
  let talukCount = 0;
  let panchayatCount = 0;
  let villageCount = 0;

  for (const districtData of KARNATAKA_DATA.districts) {
    const district = await prisma.district.upsert({
      where: { name_stateId: { name: districtData.name, stateId: state.id } },
      update: {},
      create: { name: districtData.name, stateId: state.id },
    });
    districtCount++;

    for (const talukData of districtData.taluks) {
      const taluk = await prisma.taluk.upsert({
        where: { name_districtId: { name: talukData.name, districtId: district.id } },
        update: {},
        create: { name: talukData.name, districtId: district.id },
      });
      talukCount++;

      for (const panchayatData of talukData.panchayats) {
        const panchayat = await prisma.panchayat.upsert({
          where: { name_talukId: { name: panchayatData.name, talukId: taluk.id } },
          update: {},
          create: { name: panchayatData.name, talukId: taluk.id },
        });
        panchayatCount++;

        for (const villageName of panchayatData.villages) {
          await prisma.village.upsert({
            where: { name_panchayatId: { name: villageName, panchayatId: panchayat.id } },
            update: {},
            create: { name: villageName, panchayatId: panchayat.id },
          });
          villageCount++;
        }
      }
    }
  }

  console.log(`   ✓ 1 state, ${districtCount} districts, ${talukCount} taluks, ${panchayatCount} panchayats, ${villageCount} villages`);
}
