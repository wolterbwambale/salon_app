
import { NextResponse } from "next/server";
import {
  CommissionStatus,
  CommissionType,
  PaymentMethod,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

interface SaleItemInput {
  serviceId: number;
  barberId?: number | null;
  quantity: number;
  discount?: number;
}

interface SaleRequest {
  customerId?: number | null;
  cashierId: number;
  discount?: number;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  items: SaleItemInput[];
}

function decimal(value: unknown) {
  return new Prisma.Decimal(String(value ?? 0));
}

function generateInvoiceNumber() {
  const now = new Date();

  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");

  const time = [
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0"),
  ].join("");

  const random = Math.floor(100 + Math.random() * 900);

  return `SAL-${date}-${time}-${random}`;
}

export async function GET() {
  try {
    const sales = await prisma.sale.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        cashier: {
          select: {
            id: true,
            name: true,
          },
        },
        items: {
          include: {
            service: true,
            barber: true,
            commission: true,
          },
        },
        payments: true,
      },
    });

    return NextResponse.json(sales);
  } catch (error) {
    console.error("POS_GET_ERROR", error);

    return NextResponse.json(
      { message: "Unable to load sales." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SaleRequest;

    const cashierId = Number(body.cashierId);
    const customerId = body.customerId
      ? Number(body.customerId)
      : null;

    const discount = decimal(body.discount ?? 0);

    if (!cashierId) {
      return NextResponse.json(
        { message: "Cashier is required." },
        { status: 400 }
      );
    }

    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { message: "At least one service is required." },
        { status: 400 }
      );
    }

    if (!body.paymentMethod) {
      return NextResponse.json(
        { message: "Payment method is required." },
        { status: 400 }
      );
    }

    const cashier = await prisma.user.findUnique({
      where: {
        id: cashierId,
      },
    });

    if (!cashier || !cashier.active) {
      return NextResponse.json(
        { message: "Invalid or inactive cashier." },
        { status: 400 }
      );
    }

    if (customerId) {
      const customer = await prisma.customer.findUnique({
        where: {
          id: customerId,
        },
      });

      if (!customer) {
        return NextResponse.json(
          { message: "Customer not found." },
          { status: 404 }
        );
      }
    }

    const serviceIds = body.items.map((item) =>
      Number(item.serviceId)
    );

    const services = await prisma.service.findMany({
      where: {
        id: {
          in: serviceIds,
        },
        active: true,
      },
    });

    if (services.length !== serviceIds.length) {
      return NextResponse.json(
        { message: "One or more selected services are unavailable." },
        { status: 400 }
      );
    }

    const serviceMap = new Map(
      services.map((service) => [service.id, service])
    );

    let subtotal = new Prisma.Decimal(0);

    const calculatedItems = body.items.map((item) => {
      const service = serviceMap.get(Number(item.serviceId));

      if (!service) {
        throw new Error("Service not found.");
      }

      const quantity = Math.max(1, Number(item.quantity || 1));
      const itemDiscount = decimal(item.discount ?? 0);

      const gross = service.price.mul(quantity);

      if (itemDiscount.greaterThan(gross)) {
        throw new Error(
          `Discount for ${service.name} cannot exceed the service amount.`
        );
      }

      const total = gross.sub(itemDiscount);

      subtotal = subtotal.add(total);

      return {
        service,
        serviceId: service.id,
        barberId: item.barberId
          ? Number(item.barberId)
          : null,
        quantity,
        discount: itemDiscount,
        unitPrice: service.price,
        total,
      };
    });

    if (discount.greaterThan(subtotal)) {
      return NextResponse.json(
        { message: "Sale discount cannot exceed the subtotal." },
        { status: 400 }
      );
    }

    const total = subtotal.sub(discount);

    const result = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: {
          invoiceNumber: generateInvoiceNumber(),
          customerId,
          cashierId,
          subtotal,
          discount,
          total,
          status: "COMPLETED",
        },
      });

      for (const item of calculatedItems) {
        let commissionData:
          | {
              barberId: number;
              type: CommissionType;
              value: Prisma.Decimal;
              amount: Prisma.Decimal;
              status: CommissionStatus;
            }
          | undefined;

        if (item.barberId) {
          const barber = await tx.barber.findUnique({
            where: {
              id: item.barberId,
            },
          });

          if (!barber || !barber.active) {
            throw new Error(
              `Selected barber for ${item.service.name} is unavailable.`
            );
          }

          const commissionValue = item.service.commissionValue;

          let commissionAmount: Prisma.Decimal;

          if (
            item.service.commissionType ===
            CommissionType.PERCENTAGE
          ) {
            commissionAmount = item.total
              .mul(commissionValue)
              .div(100);
          } else {
            commissionAmount = commissionValue.mul(item.quantity);
          }

          commissionData = {
            barberId: barber.id,
            type: item.service.commissionType,
            value: commissionValue,
            amount: commissionAmount,
            status: CommissionStatus.PENDING,
          };
        }

        const saleItem = await tx.saleItem.create({
          data: {
            saleId: sale.id,
            serviceId: item.serviceId,
            barberId: item.barberId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            total: item.total,
          },
        });

        if (commissionData) {
          await tx.commission.create({
            data: {
              saleItemId: saleItem.id,
              ...commissionData,
            },
          });
        }
      }

      await tx.payment.create({
        data: {
          saleId: sale.id,
          amount: total,
          method: body.paymentMethod,
          status: "PAID",
          reference: body.paymentReference || null,
        },
      });

      return tx.sale.findUnique({
        where: {
          id: sale.id,
        },
        include: {
          customer: true,
          cashier: true,
          items: {
            include: {
              service: true,
              barber: true,
              commission: true,
            },
          },
          payments: true,
        },
      });
    });

    return NextResponse.json(
      {
        message: "Sale completed successfully.",
        sale: result,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POS_POST_ERROR", error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to complete sale.",
      },
      { status: 500 }
    );
  }
}
