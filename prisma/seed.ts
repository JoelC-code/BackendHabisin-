// prisma/seed.ts
import { PrismaClient } from '../generated/prisma/client'; // Sesuaikan path ini dengan output generatormu
import bcrypt from 'bcrypt'; // Asumsi kamu menggunakan bcrypt untuk hashing password di controller auth
import { catalogRecipes } from './catalog-data';

const prisma = new PrismaClient();

async function main() {
  console.log('Memulai proses seeding...');

  // 1. (Opsional) Bersihkan data lama agar tidak bentrok / error unique constraint
  // Hati-hati, ini akan menghapus isi tabelmu saat ini!
  await prisma.generationLog.deleteMany();
  await prisma.resep.deleteMany();
  await prisma.food.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.user.deleteMany();
  await prisma.catalogRecipe.deleteMany();

  // 1b. Seed katalog resep Indonesia (autentik)
  await prisma.catalogRecipe.createMany({ data: catalogRecipes });
  console.log(`Katalog resep di-seed: ${catalogRecipes.length} resep.`);

  // 2. Hash password (agar bisa dipakai login beneran di Postman)
  const hashedPassword = await bcrypt.hash("password123", 10);

  // 3. Setup Tanggal Dinamis
  const today = new Date();
  const nextYear = new Date();
  nextYear.setFullYear(today.getFullYear() + 1); // Garansi expired 1 tahun dari sekarang (2027)

  const nextMonth = new Date();
  nextMonth.setMonth(today.getMonth() + 1); // Makanan expired 1 bulan dari sekarang

  // 4. Create User, Subscription, dan Food sekaligus (Nested Writes Prisma)
  const user = await prisma.user.create({
    data: {
      username: "master_chef",
      email: "chef@gmail.com",
      password: hashedPassword,
      
      // ✅ Insert data ke tabel Subscription otomatis terhubung ke user ini
    subscription: {
        create: [
          {
            orderId: "ORDER-SEED-001",
            amount: 15000,
            status: "active",
            startDate: today,
            endDate: nextYear,
          }
        ]
      },
      
      // ✅ Insert data ke tabel Food otomatis terhubung ke user ini
      food: {
        create: [
          {
            foodName: "Telur Ayam",
            descriptionFood: "Telur segar mentah",
            quantity: 10,
            bestBefore: nextMonth,
            category: "OTHER",
          },
          {
            foodName: "Bawang Merah",
            descriptionFood: "Bumbu dasar",
            quantity: 15,
            bestBefore: nextMonth,
            category: "PRODUCE",
          },
          {
            foodName: "Daging Ayam",
            descriptionFood: "Daging bagian dada",
            quantity: 2,
            bestBefore: nextMonth,
            category: "MEAT",
          },
          {
            foodName: "Susu UHT",
            descriptionFood: "Susu full cream 1 liter",
            quantity: 1,
            bestBefore: nextMonth,
            category: "DAIRY",
          }
        ]
      }
    },
    // Include ini hanya agar console.log di bawah bisa menampilkan datanya
    include: {
      subscription: true,
      food: true,
    }
  });

  // 5. Akun test eksplisit buat FE — FREE (tanpa langganan) & PRO (langganan aktif).
  //    Berguna untuk tes layar Subscription & gate katalog premium saat
  //    PAYMENTS_ENABLED=true. (Saat false, semua user otomatis PRO.)
  await prisma.user.create({
    data: {
      username: "Free Tester",
      email: "free@habisin.test",
      password: hashedPassword,
      food: {
        create: [
          { foodName: "Telur Ayam", descriptionFood: "Telur segar", quantity: 6, bestBefore: nextMonth, category: "OTHER" },
          { foodName: "Wortel", descriptionFood: "Sayur segar", quantity: 5, bestBefore: nextMonth, category: "PRODUCE" },
        ],
      },
    },
  });

  await prisma.user.create({
    data: {
      username: "Pro Tester",
      email: "pro@habisin.test",
      password: hashedPassword,
      subscription: {
        create: [
          {
            orderId: "ORDER-SEED-PRO",
            amount: 15000,
            plan: "monthly",
            status: "active",
            startDate: today,
            endDate: nextYear,
          },
        ],
      },
    },
  });

  console.log('Seeding Selesai! 🎉');
  console.log('Akun Testing:');
  console.log(`  PRO  (seed lama): ${user.email} / password123`);
  console.log(`  FREE (test FE)  : free@habisin.test / password123  (tanpa langganan)`);
  console.log(`  PRO  (test FE)  : pro@habisin.test / password123   (langganan aktif)`);
  console.log(`Catatan: status FREE/PRO baru terasa saat PAYMENTS_ENABLED=true.`);
  console.log(`Jumlah Makanan akun utama: ${user.food.length} item siap diolah AI`);
}

main()
  .catch((e) => {
    console.error('Error saat seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });