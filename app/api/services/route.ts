import { NextResponse } from "next/server";
import { CommissionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() || "";

    const services = await prisma.service.findMany({
      where: search
        ? {
            OR: [
              {
                name: {
                  contains: search,
                },
              },
              {
                description: {
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
          },
        },
      },
    });

    return NextResponse.json(
      services.map((service) => ({
        ...service,
        price: Number(service.price),
        commissionValue: Number(service.commissionValue),
        salesCount: service._count.saleItems,
      }))
    );
  } catch (error) {
    console.error("SERVICES_GET_ERROR", error);

    return NextResponse.json(
      { message: "Unable to load services." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = String(body.name || "").trim();
    const description =
      String(body.description || "").trim() || null;

    const price = Number(body.price);
    const commissionValue = Number(
      body.commissionValue ?? 0
    );

    const commissionType =
      String(body.commissionType || "PERCENTAGE") as CommissionType;

    if (!name) {
      return NextResponse.json(
        { message: "Service name is required." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json(
        { message: "Please enter a valid service price." },
        { status: 400 }
      );
    }

    if (!Object.values(CommissionType).includes(commissionType)) {
      return NextResponse.json(
        { message: "Invalid commission type." },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(commissionValue) ||
      commissionValue < 0
    ) {
      return NextResponse.json(
        { message: "Please enter a valid commission value." },
        { status: 400 }
      );
    }

    if (
      commissionType === CommissionType.PERCENTAGE &&
      commissionValue > 100
    ) {
      return NextResponse.json(
        {
          message:
            "Percentage commission cannot exceed 100%.",
        },
        { status: 400 }
      );
    }

    const service = await prisma.service.create({
      data: {
        name,
        description,
        price,
        active: body.active !== false,
        commissionType,
        commissionValue,
      },
    });

    return NextResponse.json(service, {
      status: 201,
    });
  } catch (error) {
    console.error("SERVICES_POST_ERROR", error);

    return NextResponse.json(
      { message: "Unable to create service." },
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
        { message: "Service ID is required." },
        { status: 400 }
      );
    }

    const name = String(body.name || "").trim();
    const price = Number(body.price);
    const commissionValue = Number(
      body.commissionValue ?? 0
    );

    const commissionType =
      String(body.commissionType || "PERCENTAGE") as CommissionType;

    if (!name) {
      return NextResponse.json(
        { message: "Service name is required." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json(
        { message: "Please enter a valid service price." },
        { status: 400 }
      );
    }

    if (!Object.values(CommissionType).includes(commissionType)) {
      return NextResponse.json(
        { message: "Invalid commission type." },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(commissionValue) ||
      commissionValue < 0
    ) {
      return NextResponse.json(
        { message: "Please enter a valid commission value." },
        { status: 400 }
      );
    }

    if (
      commissionType === CommissionType.PERCENTAGE &&
      commissionValue > 100
    ) {
      return NextResponse.json(
        {
          message:
            "Percentage commission cannot exceed 100%.",
        },
        { status: 400 }
      );
    }

    const service = await prisma.service.update({
      where: {
        id,
      },
      data: {
        name,
        description:
          String(body.description || "").trim() || null,
        price,
        active: body.active !== false,
        commissionType,
        commissionValue,
      },
    });

    return NextResponse.json(service);
  } catch (error) {
    console.error("SERVICES_PUT_ERROR", error);

    return NextResponse.json(
      { message: "Unable to update service." },
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
        { message: "Service ID is required." },
        { status: 400 }
      );
    }

    const salesCount = await prisma.saleItem.count({
      where: {
        serviceId: id,
      },
    });

    if (salesCount > 0) {
      return NextResponse.json(
        {
          message:
            "This service has sales history. Deactivate it instead of deleting it.",
        },
        { status: 409 }
      );
    }

    await prisma.service.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      message: "Service deleted successfully.",
    });
  } catch (error) {
    console.error("SERVICES_DELETE_ERROR", error);

    return NextResponse.json(
      { message: "Unable to delete service." },
      { status: 500 }
    );
  }
}
