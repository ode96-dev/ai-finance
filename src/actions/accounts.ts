'use server'

import prisma from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"

const serializeTransaction = (obj: any) => {
    const serialized: any = { ...obj }

    if (obj?.balance && typeof obj.balance?.toNumber === "function") {
        serialized.balance = obj.balance.toNumber()
    }

    if (obj?.amount && typeof obj.amount?.toNumber === "function") {
        serialized.amount = obj.amount.toNumber()
    }

    return serialized
}

export async function updateDefaultAccount(accountId: string) {
    try {
        const { userId } = await auth()

        if (!userId) throw new Error("Unauthorized");

        const user = await prisma.user.findUnique({
            where: { clerkUserId: userId }
        })

        if (!user) {
            throw new Error("user not found")
        }

        await prisma.account.updateMany({
            where: { userId: user.id, isDefault: true },
            data: { isDefault: false }
        });

        const account = await prisma.account.update({
            where: {
                id: accountId,
                userId: user.id
            },
            data: { isDefault: true }
        });

        revalidatePath("/dashboard");

        return { success: true, data: serializeTransaction(account) }

    } catch (error: unknown) {
        console.error(error);
        return { success: false, error: (error as Error).message };
    }
}

export async function getAccuntWithTransactions(accountId: string) {
    try {
        const { userId } = await auth()

        if (!userId) throw new Error("Unauthorized");

        const user = await prisma.user.findUnique({
            where: { clerkUserId: userId }
        })

        if (!user) {
            throw new Error("user not found")
        }

        const account = await prisma.account.findUnique({
            where: { id: accountId, userId: user.id },
            include: {
                transactions: {
                    orderBy: { date: "desc" }
                },
                _count: {
                    select: { transactions: true }
                }
            }
        });

        if (!account) return null;

        return {
            ...serializeTransaction(account),
            transactions: account.transactions.map(serializeTransaction)
        }

    } catch (error: unknown) {
        console.error(error);
        return { success: false, error: (error as Error).message };
    }
}

export async function bulkDeleteTransactions(transactionIds: string[]) {
    try {
        const { userId } = await auth()

        if (!userId) throw new Error("Unauthorized");

        const user = await prisma.user.findUnique({
            where: { clerkUserId: userId }
        })

        if (!user) {
            throw new Error("user not found")
        }

        const transactions = await prisma.transaction.findMany({
            where: {
                id: { in: transactionIds },
                userId: user.id
            }
        })

        const accountBalanceChanges = transactions.reduce((acc: Record<string, number>, transaction) => {
            const amt = typeof (transaction.amount as any)?.toNumber === 'function'
                ? (transaction.amount as any).toNumber()
                : Number(transaction.amount);

            const change = transaction.type === "EXPENSE" ? amt : -amt;

            acc[transaction.accountId] = (acc[transaction.accountId] || 0) + change;

            return acc;
        }, {} as Record<string, number>)

        await prisma.$transaction(async (tx) => {
            await tx.transaction.deleteMany({
                where: {
                    id: { in: transactionIds },
                    userId: user.id
                }
            })

            for (const [accountId, balanceChange] of Object.entries(
                accountBalanceChanges
            )) {
                await tx.account.update({
                    where: {
                        id: accountId
                    },
                    data: {
                        balance: {
                            increment: balanceChange as number
                        }
                    }
                })
            }

        })

        revalidatePath("/dashboard")

        revalidatePath("/account/[id]")

        return { success: true }
    } catch (error: unknown) {
        return { success: false, error: (error as Error).message }
    }
}