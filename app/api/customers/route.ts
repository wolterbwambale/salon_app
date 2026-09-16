import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() || "";

    const customers = await prisma.customer.findMany({
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
        createdAt: "desc",
      },
      include: {
        _count: {
          select: {
            sales: true,
          },
        },
        sales: {
          where: {
            status: "COMPLETED",
          },
          select: {
            total: true,
          },
        },
      },
    });

    const result = customers.map((customer) => ({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      createdAt: customer.createdAt,
      salesCount: customer._count.sales,
      totalSpent: customer.sales.reduce(
        (sum, sale) => sum + Number(sale.total),
        0
      ),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("CUSTOMERS_GET_ERROR", error);

    return NextResponse.json(
      { message: "Unable to load customers." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = String(body.name || "").trim();
    const phone = String(body.phone || "").trim();
    const email = String(body.email || "").trim();
    const address = String(body.address || "").trim();

    if (!name) {
      return NextResponse.json(
        { message: "Customer name is required." },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        phone: phone || null,
        email: email || null,
        address: address || null,
      },
    });

    return NextResponse.json(customer, {
      status: 201,
    });
  } catch (error) {
    console.error("CUSTOMERS_POST_ERROR", error);

    return NextResponse.json(
      { message: "Unable to create customer." },
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
        { message: "Customer ID is required." },
        { status: 400 }
      );
    }

    const name = String(body.name || "").trim();

    if (!name) {
      return NextResponse.json(
        { message: "Customer name is required." },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.update({
      where: {
        id,
      },
      data: {
        name,
        phone: String(body.phone || "").trim() || null,
        email: String(body.email || "").trim() || null,
        address: String(body.address || "").trim() || null,
      },
    });

    return NextResponse.json(customer);
  } catch (error) {
    console.error("CUSTOMERS_PUT_ERROR", error);

    return NextResponse.json(
      { message: "Unable to update customer." },
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
        { message: "Customer ID is required." },
        { status: 400 }
      );
    }

    const salesCount = await prisma.sale.count({
      where: {
        customerId: id,
      },
    });

    if (salesCount > 0) {
      return NextResponse.json(
        {
          message:
            "This customer has sales history and cannot be deleted.",
        },
        { status: 409 }
      );
    }

    await prisma.customer.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      message: "Customer deleted successfully.",
    });
  } catch (error) {
    console.error("CUSTOMERS_DELETE_ERROR", error);

    return NextResponse.json(
      { message: "Unable to delete customer." },
      { status: 500 }
    );
  }
}
