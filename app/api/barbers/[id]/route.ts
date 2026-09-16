import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function barberIdFromContext(
  ctx: RouteContext<"/api/barbers/[id]">
) {
  const { id } = await ctx.params;
  const barberId = Number(id);

  if (!barberId) {
    throw new Error("Barber ID is required.");
  }

  return barberId;
}

function barberPayload(body: Record<string, unknown>) {
  const name = String(body.name || "").trim();

  if (!name) {
    throw new Error("Barber name is required.");
  }

  return {
    name,
    phone: String(body.phone || "").trim() || null,
    email: String(body.email || "").trim() || null,
    active: body.active !== false,
  };
}

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/barbers/[id]">
) {
  try {
    const id = await barberIdFromContext(ctx);

    const barber = await prisma.barber.findUnique({
      where: {
        id,
      },
      include: {
        _count: {
          select: {
            saleItems: true,
            commissions: true,
          },
        },
        commissions: {
          select: {
            amount: true,
            status: true,
          },
        },
      },
    });

    if (!barber) {
      return NextResponse.json(
        { message: "Barber not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: barber.id,
      name: barber.name,
      phone: barber.phone,
      email: barber.email,
      active: barber.active,
      createdAt: barber.createdAt,
      salesCount: barber._count.saleItems,
      commissionCount: barber._count.commissions,
      pendingCommission: barber.commissions
        .filter((item) => item.status === "PENDING")
        .reduce((sum, item) => sum + Number(item.amount), 0),
      paidCommission: barber.commissions
        .filter((item) => item.status === "PAID")
        .reduce((sum, item) => sum + Number(item.amount), 0),
    });
  } catch (error) {
    console.error("BARBER_GET_ERROR", error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to load barber.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  ctx: RouteContext<"/api/barbers/[id]">
) {
  try {
    const id = await barberIdFromContext(ctx);
    const body = (await request.json()) as Record<string, unknown>;

    const barber = await prisma.barber.update({
      where: {
        id,
      },
      data: barberPayload(body),
    });

    return NextResponse.json(barber);
  } catch (error) {
    console.error("BARBER_PUT_ERROR", error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to update barber.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/barbers/[id]">
) {
  try {
    const id = await barberIdFromContext(ctx);

    const saleItems = await prisma.saleItem.count({
      where: {
        barberId: id,
      },
    });

    if (saleItems > 0) {
      return NextResponse.json(
        {
          message:
            "This barber has sales history. Deactivate the barber instead of deleting them.",
        },
        { status: 409 }
      );
    }

    await prisma.barber.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      message: "Barber deleted successfully.",
    });
  } catch (error) {
    console.error("BARBER_DELETE_ERROR", error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to delete barber.",
      },
      { status: 500 }
    );
  }
}
