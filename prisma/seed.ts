import { PrismaClient, CommissionType, UserRole, PaymentMethod } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Admin@123", 12);

  await prisma.user.upsert({
    where: { email: "admin@salon.local" },
    update: {
      name: "System Administrator",
      passwordHash,
      role: UserRole.ADMIN,
      active: true,
    },
    create: {
      name: "System Administrator",
      email: "admin@salon.local",
      passwordHash,
      role: UserRole.ADMIN,
      active: true,
    },
  });

  const barbers = [
    { name: "John Barber", phone: "0700000001" },
    { name: "Peter Styles", phone: "0700000002" },
    { name: "David Grooming", phone: "0700000003" },
  ];

  for (const barber of barbers) {
    const existing = await prisma.barber.findFirst({
      where: { name: barber.name },
    });

    if (!existing) {
      await prisma.barber.create({
        data: barber,
      });
    }
  }

  const services = [
    {
      name: "Haircut",
      price: 15000,
      commissionType: CommissionType.PERCENTAGE,
      commissionValue: 40,
    },
    {
      name: "Beard Trim",
      price: 8000,
      commissionType: CommissionType.PERCENTAGE,
      commissionValue: 40,
    },
    {
      name: "Hair Wash",
      price: 10000,
      commissionType: CommissionType.PERCENTAGE,
      commissionValue: 35,
    },
    {
      name: "Hair Coloring",
      price: 50000,
      commissionType: CommissionType.PERCENTAGE,
      commissionValue: 30,
    },
    {
      name: "Shaving",
      price: 10000,
      commissionType: CommissionType.FIXED,
      commissionValue: 4000,
    },
  ];

  for (const service of services) {
    const existing = await prisma.service.findFirst({
      where: { name: service.name },
    });

    if (!existing) {
      await prisma.service.create({
        data: {
          ...service,
          price: service.price,
          commissionValue: service.commissionValue,
        },
      });
    }
  }

  const categories = [
    "Rent",
    "Utilities",
    "Hair Products",
    "Cleaning",
    "Transport",
    "Equipment",
    "Repairs",
    "Staff Welfare",
    "Other",
  ];

  for (const name of categories) {
    await prisma.expenseCategory.upsert({
      where: { name },
      update: { active: true },
      create: { name },
    });
  }

  const customer = await prisma.customer.findFirst({
    where: { phone: "0700000100" },
  });

  if (!customer) {
    await prisma.customer.create({
      data: {
        name: "Walk-in Demo Customer",
        phone: "0700000100",
      },
    });
  }

  console.log("Seed completed.");
  console.log("Login: admin@salon.local");
  console.log("Password: Admin@123");
  console.log("Default payment methods:", Object.values(PaymentMethod).join(", "));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
