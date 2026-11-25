import { prisma } from '../utils/prisma';

async function main() {
  console.log('Running seed...');

  // Create default LLM API keys configuration structure
  // In production, these would be set by admin

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });