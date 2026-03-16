"use client";

import { Account } from "@/app/generated/prisma/client";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  Landmark,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

const AccountCard = ({ account }: { account: Account }) => {
  const { name, type, balance, id, isDefault } = account;

  const isSavings = type === "SAVINGS";

  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-slate-200">
      <div
        className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full opacity-[0.03] transition-transform group-hover:scale-110 ${
          isSavings ? "bg-emerald-500" : "bg-slate-900"
        }`}
      />

      <Link href={`/account/${id}`} className="block">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <div
              className={`p-2 rounded-lg ${
                isSavings
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {isSavings ? <PiggyBank size={18} /> : <Landmark size={18} />}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 tracking-tight capitalize">
                {name}
              </p>
              {isDefault && (
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                  Primary
                </span>
              )}
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-900 group-hover:translate-x-1 transition-all" />
        </CardHeader>

        <CardContent className="pt-4">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">
              Total Balance
            </span>
            <div className="text-3xl font-bold tracking-tighter text-slate-900">
              $
              {parseFloat(balance.toString()).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between items-center pt-4 border-t border-slate-50 bg-slate-50/50">
          <div className="flex gap-4">
            <div className="flex items-center text-[11px] font-bold text-emerald-600 uppercase tracking-tighter">
              <ArrowUpRight className="mr-1 h-3 w-3" />
              Income
            </div>
            <div className="flex items-center text-[11px] font-bold text-rose-600 uppercase tracking-tighter">
              <ArrowDownRight className="mr-1 h-3 w-3" />
              Expense
            </div>
          </div>

          <Badge
            variant="secondary"
            className="text-[10px] font-bold bg-white border-slate-200 text-slate-500"
          >
            {isSavings ? "Savings" : "Checking"}
          </Badge>
        </CardFooter>
      </Link>
    </Card>
  );
};

export default AccountCard;
