import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const stateCount = await prisma.state.count()
  const districtCount = await prisma.district.count()
  console.log({ stateCount, districtCount })
}

main().catch(console.error).finally(() => prisma.$disconnect())
