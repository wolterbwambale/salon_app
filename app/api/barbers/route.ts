import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";

    const barbers = await prisma.barber.findMany({
      where: search
        ? {
            OR: [
              {
                name: {
                  contains: search,
                },
              },
              {
                phone: {
                  contains: search,
                },
              },
              {
                email: {
                  contains: search,
                },
              },
            ],
          }
        : undefined,
      orderBy: {
        name: "asc",
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

    const result = barbers.map((barber) => ({
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
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("BARBERS_GET_ERROR", error);

    return NextResponse.json(
      { message: "Unable to load barbers." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = String(body.name || "").trim();

    if (!name) {
      return NextResponse.json(
        { message: "Barber name is required." },
        { status: 400 }
      );
    }

    const barber = await prisma.barber.create({
      data: {
        name,
        phone: String(body.phone || "").trim() || null,
        email: String(body.email || "").trim() || null,
        active: body.active !== false,
      },
    });

    return NextResponse.json(barber, {
      status: 201,
    });
  } catch (error) {
    console.error("BARBERS_POST_ERROR", error);

    return NextResponse.json(
      { message: "Unable to create barber." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    const id = Number(body.id);

    if (!id) {
      return NextResponse.json(
        { message: "Barber ID is required." },
        { status: 400 }
      );
    }

    const name = String(body.name || "").trim();

    if (!name) {
      return NextResponse.json(
        { message: "Barber name is required." },
        { status: 400 }
      );
    }

    const barber = await prisma.barber.update({
      where: {
        id,
      },
      data: {
        name,
        phone: String(body.phone || "").trim() || null,
        email: String(body.email || "").trim() || null,
        active: body.active !== false,
      },
    });

    return NextResponse.json(barber);
  } catch (error) {
    console.error("BARBERS_PUT_ERROR", error);

    return NextResponse.json(
      { message: "Unable to update barber." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const id = Number(searchParams.get("id"));

    if (!id) {
      return NextResponse.json(
        { message: "Barber ID is required." },
        { status: 400 }
      );
    }

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
    console.error("BARBERS_DELETE_ERROR", error);

    return NextResponse.json(
      { message: "Unable to delete barber." },
      { status: 500 }
    );
  }
}
