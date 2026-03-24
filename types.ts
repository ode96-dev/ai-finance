export type Budget =
    | {
        amount: number;
        id: string;
        userId: string;
        createdAt: Date;
        updatedAt: Date;
        lastAlertSent: Date | null;
    }
    | null
    | undefined;