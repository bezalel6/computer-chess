import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create predefined challenges
  const bestMoveChallenge = await prisma.challenge.upsert({
    where: { id: 'best-move-challenge' },
    update: {},
    create: {
      id: 'best-move-challenge',
      name: 'Best Move',
      description: 'Play the objectively best move according to the engine',
      challengeType: 'BEST_MOVE',
    },
  });

  const worstMoveChallenge = await prisma.challenge.upsert({
    where: { id: 'worst-move-challenge' },
    update: {},
    create: {
      id: 'worst-move-challenge',
      name: 'Worst Move',
      description: 'Play the worst legal move (optional challenge)',
      challengeType: 'WORST_MOVE',
    },
  });

  const bestKnightMoveChallenge = await prisma.challenge.upsert({
    where: { id: 'best-knight-move-challenge' },
    update: {},
    create: {
      id: 'best-knight-move-challenge',
      name: 'Best Knight Move',
      description: 'Play the best move using a knight',
      challengeType: 'BEST_KNIGHT_MOVE',
    },
  });

  console.log('Created challenges:', {
    bestMoveChallenge,
    worstMoveChallenge,
    bestKnightMoveChallenge,
  });

  // Create test users
  const testPassword = await bcrypt.hash('password123', 12);

  const alice = await prisma.user.upsert({
    where: { username: 'alice' },
    update: {},
    create: {
      username: 'alice',
      email: 'alice@example.com',
      passwordHash: testPassword,
      isGuest: false,
    },
  });

  const bob = await prisma.user.upsert({
    where: { username: 'bob' },
    update: {},
    create: {
      username: 'bob',
      email: 'bob@example.com',
      passwordHash: testPassword,
      isGuest: false,
    },
  });

  console.log('Created test users:', { alice, bob });
  console.log('Test credentials: username=alice/bob, password=password123');

  console.log('Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });