import { NextResponse } from "next/server";
import {
  PaymentMethod,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() || "";
    const categoryId = searchParams.get("categoryId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const expenses = await prisma.expense.findMany({
      where: {
        ...(categoryId
          ? {
              categoryId: Number(categoryId),
            }
          : {}),
        ...(from || to
          ? {
              expenseDate: {
                ...(from
                  ? {
                      gte: new Date(`${from}T00:00:00`),
                    }
                  : {}),
                ...(to
                  ? {
                      lte: new Date(`${to}T23:59:59.999`),
                    }
                  : {}),
              },
            }
          : {}),
        ...(search
          ? {
              OR: [
                {
                  description: {
                    contains: search,
                  },
                },
                {
                  category: {
                    name: {
                      contains: search,
                    },
                  },
                },
              ],
            }
          : {}),
      },
      orderBy: {
        expenseDate: "desc",
      },
      include: {
        category: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const categories = await prisma.expenseCategory.findMany({
      where: {
        active: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    const total = expenses.reduce(
      (sum, expense) => sum + Number(expense.amount),
      0
    );

    return NextResponse.json({
      expenses: expenses.map((expense) => ({
        ...expense,
        amount: Number(expense.amount),
      })),
      categories,
      total,
    });
  } catch (error) {
    console.error("EXPENSES_GET_ERROR", error);

    return NextResponse.json(
      { message: "Unable to load expenses." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const categoryId = Number(body.categoryId);
    const userId = Number(body.userId);
    const amount = Number(body.amount);

    const description = String(
      body.description || ""
    ).trim();

    const paymentMethod =
      String(body.paymentMethod || "") as PaymentMethod;

    if (!categoryId || !userId) {
      return NextResponse.json(
        {
          message:
            "Expense category and user are required.",
        },
        { status: 400 }
      );
    }

    if (!description) {
      return NextResponse.json(
        { message: "Expense description is required." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { message: "Expense amount must be greater than zero." },
        { status: 400 }
      );
    }

    if (!Object.values(PaymentMethod).includes(paymentMethod)) {
      return NextResponse.json(
        { message: "Invalid payment method." },
        { status: 400 }
      );
    }

    const category = await prisma.expenseCategory.findUnique({
      where: {
        id: categoryId,
      },
    });

    if (!category || !category.active) {
      return NextResponse.json(
        { message: "Invalid or inactive expense category." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user || !user.active) {
      return NextResponse.json(
        { message: "Invalid or inactive user." },
        { status: 400 }
      );
    }

    const expenseDate = body.expenseDate
      ? new Date(`${body.expenseDate}T12:00:00`)
      : new Date();

    if (Number.isNaN(expenseDate.getTime())) {
      return NextResponse.json(
        { message: "Invalid expense date." },
        { status: 400 }
      );
    }

    const expense = await prisma.expense.create({
      data: {
        categoryId,
        userId,
        description,
        amount: new Prisma.Decimal(amount),
        paymentMethod,
        expenseDate,
      },
      include: {
        category: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        ...expense,
        amount: Number(expense.amount),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("EXPENSES_POST_ERROR", error);

    return NextResponse.json(
      { message: "Unable to create expense." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    const id = Number(body.id);
    const categoryId = Number(body.categoryId);
    const amount = Number(body.amount);

    if (!id) {
      return NextResponse.json(
        { message: "Expense ID is required." },
        { status: 400 }
      );
    }

    if (!categoryId) {
      return NextResponse.json(
        { message: "Expense category is required." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { message: "Expense amount must be greater than zero." },
        { status: 400 }
      );
    }

    const paymentMethod =
      String(body.paymentMethod || "") as PaymentMethod;

    if (!Object.values(PaymentMethod).includes(paymentMethod)) {
      return NextResponse.json(
        { message: "Invalid payment method." },
        { status: 400 }
      );
    }

    const expenseDate = body.expenseDate
      ? new Date(`${body.expenseDate}T12:00:00`)
      : new Date();

    const expense = await prisma.expense.update({
      where: {
        id,
      },
      data: {
        categoryId,
        description: String(
          body.description || ""
        ).trim(),
        amount: new Prisma.Decimal(amount),
        paymentMethod,
        expenseDate,
      },
      include: {
        category: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      ...expense,
      amount: Number(expense.amount),
    });
  } catch (error) {
    console.error("EXPENSES_PUT_ERROR", error);

    return NextResponse.json(
      { message: "Unable to update expense." },
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
        { message: "Expense ID is required." },
        { status: 400 }
      );
    }

    await prisma.expense.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      message: "Expense deleted successfully.",
    });
  } catch (error) {
    console.error("EXPENSES_DELETE_ERROR", error);

    return NextResponse.json(
      { message: "Unable to delete expense." },
      { status: 500 }
    );
  }
}
