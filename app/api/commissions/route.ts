import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CommissionStatus } from "@prisma/client";

function getDateRange(
  from?: string | null,
  to?: string | null
) {
  const start = from
    ? new Date(`${from}T00:00:00`)
    : new Date(0);

  const end = to
    ? new Date(`${to}T23:59:59.999`)
    : new Date();

  return { start, end };
}

/**
 * GET /api/commissions
 *
 * Supported query parameters:
 * ?from=2026-09-01
 * ?to=2026-09-30
 * ?barberId=1
 * ?status=PENDING
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const barberIdParam = searchParams.get("barberId");
    const statusParam = searchParams.get("status");

    const { start, end } = getDateRange(from, to);

    const barberId = barberIdParam
      ? Number(barberIdParam)
      : undefined;

    const validStatus =
      statusParam &&
      Object.values(CommissionStatus).includes(
        statusParam as CommissionStatus
      )
        ? (statusParam as CommissionStatus)
        : undefined;

    const commissions = await prisma.commission.findMany({
      where: {
        ...(barberId
          ? {
              barberId,
            }
          : {}),

        ...(validStatus
          ? {
              status: validStatus,
            }
          : {}),

        saleItem: {
          sale: {
            createdAt: {
              gte: start,
              lte: end,
            },
          },
        },
      },

      orderBy: {
        saleItem: {
          sale: {
            createdAt: "desc",
          },
        },
      },

      include: {
        barber: {
          select: {
            id: true,
            name: true,
            phone: true,
            active: true,
          },
        },

        saleItem: {
          select: {
            id: true,
            quantity: true,
            unitPrice: true,
            discount: true,
            total: true,

            service: {
              select: {
                id: true,
                name: true,
                commissionType: true,
                commissionValue: true,
              },
            },

            sale: {
              select: {
                id: true,
                invoiceNumber: true,
                createdAt: true,
                total: true,
                status: true,

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
              },
            },
          },
        },
      },
    });

    const data = commissions.map((commission) => ({
      id: commission.id,
      type: commission.type,
      value: Number(commission.value),
      amount: Number(commission.amount),
      status: commission.status,
      paidAt: commission.paidAt,

      barber: commission.barber,

      saleItem: {
        id: commission.saleItem.id,
        quantity: commission.saleItem.quantity,
        unitPrice: Number(commission.saleItem.unitPrice),
        discount: Number(commission.saleItem.discount),
        total: Number(commission.saleItem.total),

        service: {
          ...commission.saleItem.service,
          commissionValue: Number(
            commission.saleItem.service.commissionValue
          ),
        },

        sale: {
          id: commission.saleItem.sale.id,
          invoiceNumber:
            commission.saleItem.sale.invoiceNumber,
          createdAt: commission.saleItem.sale.createdAt,
          total: Number(commission.saleItem.sale.total),
          status: commission.saleItem.sale.status,

          customer:
            commission.saleItem.sale.customer,

          cashier:
            commission.saleItem.sale.cashier,
        },
      },
    }));

    const total = data.reduce(
      (sum, commission) => sum + commission.amount,
      0
    );

    const pending = data
      .filter(
        (commission) =>
          commission.status === CommissionStatus.PENDING
      )
      .reduce(
        (sum, commission) => sum + commission.amount,
        0
      );

    const paid = data
      .filter(
        (commission) =>
          commission.status === CommissionStatus.PAID
      )
      .reduce(
        (sum, commission) => sum + commission.amount,
        0
      );

    const cancelled = data
      .filter(
        (commission) =>
          commission.status === CommissionStatus.CANCELLED
      )
      .reduce(
        (sum, commission) => sum + commission.amount,
        0
      );

    return NextResponse.json({
      commissions: data,
      summary: {
        total,
        pending,
        paid,
        cancelled,
        count: data.length,
      },
    });
  } catch (error) {
    console.error("COMMISSIONS_GET_ERROR", error);

    return NextResponse.json(
      {
        message: "Unable to load commissions.",
      },
      {
        status: 500,
      }
    );
  }
}

/**
 * PUT /api/commissions
 *
 * Body:
 * {
 *   id: number,
 *   status: "PAID" | "PENDING" | "CANCELLED"
 * }
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();

    const id = Number(body.id);
    const status = String(body.status || "")
      .trim()
      .toUpperCase();

    if (!id || !status) {
      return NextResponse.json(
        {
          message:
            "Commission ID and status are required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Object.values(CommissionStatus).includes(
        status as CommissionStatus
      )
    ) {
      return NextResponse.json(
        {
          message: "Invalid commission status.",
        },
        {
          status: 400,
        }
      );
    }

    const existing = await prisma.commission.findUnique({
      where: {
        id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          message: "Commission not found.",
        },
        {
          status: 404,
        }
      );
    }

    const newStatus = status as CommissionStatus;

    const commission = await prisma.commission.update({
      where: {
        id,
      },

      data: {
        status: newStatus,

        paidAt:
          newStatus === CommissionStatus.PAID
            ? new Date()
            : null,
      },

      include: {
        barber: {
          select: {
            id: true,
            name: true,
          },
        },

        saleItem: {
          select: {
            service: {
              select: {
                name: true,
              },
            },

            sale: {
              select: {
                invoiceNumber: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      message: `Commission marked as ${newStatus.toLowerCase()}.`,

      commission: {
        id: commission.id,
        amount: Number(commission.amount),
        status: commission.status,
        paidAt: commission.paidAt,
        barber: commission.barber,
        service: commission.saleItem.service,
        invoiceNumber:
          commission.saleItem.sale.invoiceNumber,
      },
    });
  } catch (error) {
    console.error("COMMISSION_UPDATE_ERROR", error);

    return NextResponse.json(
      {
        message: "Unable to update commission.",
      },
      {
        status: 500,
      }
    );
  }
}