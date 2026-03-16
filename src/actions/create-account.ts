"use server"

import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache";

const serializeTransaction = (obj) => {
    const serialized = { ...obj }

    if (obj.balance) {
        serialized.balance = obj.balance.toNumber()
    }

    if (obj.amount) {
        serialized.amount = obj.amount.toNumber()
    }

    return serialized
}

export async function createAccount(data) {
    try {
        const { userId } = await auth()

        if (!userId) throw new Error("Unauthorized");

        const user = await prisma.user.findUnique({
            where: { clerkUserId: userId }
        })

        if (!user) {
            throw new Error("user not found")
        }

        const balanceFloat = parseFloat(data.balance);

        if (isNaN(balanceFloat)) {
            throw new Error("invalid balace amount")
        }

        const existingAccounts = await prisma.account.findMany({
            where: { userId: user.id }
        })

        const shouldBeDefault = existingAccounts.length === 0 ? true : data.isDefault;

        if (shouldBeDefault) {
            await prisma.account.updateMany({
                where: { userId: user.id, isDefault: true },
                data: { isDefault: false }
            })
        }

        const account = await prisma.account.create({
            data: {
                ...data,
                balance: balanceFloat,
                userId: user.id,
                isDefault: shouldBeDefault
            }
        })

        const serializedAccount = serializeTransaction(account)

        revalidatePath("/dashboard")

        return { success: true, data: serializedAccount };

    } catch (error) {
        console.error(error)
        throw error
    }
}

export async function getUserAccounts() {
    const { userId } = await auth()

    if (!userId) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({
        where: { clerkUserId: userId }
    })

    if (!user) {
        throw new Error("user not found")
    }

    const accounts = await prisma.account.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        include: {
            _count: {
                select: {
                    transactions: true
                }
            }
        }
    });

    const serializedAccount = accounts.map(serializeTransaction)

    return serializedAccount;
}

