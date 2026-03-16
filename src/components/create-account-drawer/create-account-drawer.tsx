"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  Landmark,
  PiggyBank,
  ShieldCheck,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "../ui/drawer";
import { Input } from "../ui/input";
import { Switch } from "../ui/switch";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import useFetch from "../../../hooks/use-fetch";
import { createAccount } from "@/actions/create-account";
import { accountSchema } from "@/lib/schema";

const CreateAccountDrawer = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
    reset,
  } = useForm({
    resolver: zodResolver(accountSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      type: "CURRENT",
      balance: "0.00",
      isDefault: false,
    },
  });

  const {
    fn: createAccountFn,
    loading: createAccountLoading,
    data: newAccount,
  } = useFetch(createAccount);

  const watchedName = watch("name");
  const watchedType = watch("type");
  const watchedBalance = watch("balance");
  const watchedIsDefault = watch("isDefault");

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  useEffect(() => {
    if (newAccount && !createAccountLoading) {
      toast.success("Account created successfully");
      setOpen(false);
    }
  }, [createAccountLoading, newAccount]);

  const onSubmit = async (data: any) => {
    await createAccountFn(data);
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent className="bg-slate-50 border-t h-[92vh]">
        <div className="mx-auto w-full max-w-lg flex flex-col h-full relative">
          {/* Accessibility Requirement */}
          <DrawerHeader className="sr-only">
            <VisuallyHidden.Root>
              <DrawerTitle>Create New Account</DrawerTitle>
            </VisuallyHidden.Root>
          </DrawerHeader>

          {/* Fixed Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-2 shrink-0">
            <h2 className="text-xl font-bold text-slate-900">New Account</h2>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </DrawerClose>
          </div>

          {/* Scrollable Area */}
          <div className="flex-1 overflow-y-auto px-6 pb-32 scrollbar-hide">
            {/* 1. Card Preview */}
            <div className="pt-2 pb-8">
              <div
                className={`relative h-44 w-full rounded-3xl p-6 transition-all duration-500 shadow-xl flex flex-col justify-between overflow-hidden ${
                  watchedType === "SAVINGS"
                    ? "bg-gradient-to-br from-teal-500 to-emerald-600"
                    : "bg-gradient-to-br from-slate-800 to-slate-900"
                }`}
              >
                <div className="flex justify-between items-start z-10">
                  <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
                    {watchedType === "SAVINGS" ? (
                      <PiggyBank className="text-white h-6 w-6" />
                    ) : (
                      <Landmark className="text-white h-6 w-6" />
                    )}
                  </div>
                  {watchedIsDefault && (
                    <div className="flex items-center gap-1.5 bg-white/20 text-white px-3 py-1 rounded-full backdrop-blur-md border border-white/10">
                      <ShieldCheck className="h-3 w-3" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        Primary
                      </span>
                    </div>
                  )}
                </div>

                <div className="z-10">
                  <p className="text-white/50 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">
                    {watchedType === "SAVINGS"
                      ? "Savings Balance"
                      : "Checking Balance"}
                  </p>
                  <h3 className="text-white text-2xl font-semibold truncate tracking-tight mb-1">
                    {watchedName || "New Account"}
                  </h3>
                  <p className="text-white text-xl font-mono">
                    $
                    {parseFloat(watchedBalance || "0").toLocaleString(
                      undefined,
                      { minimumFractionDigits: 2 },
                    )}
                  </p>
                </div>

                <Wallet className="absolute -right-6 -bottom-6 h-36 w-36 text-white/5 rotate-12" />
              </div>
            </div>

            {/* Form Fields */}
            <form
              id="drawer-account-form"
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-6"
            >
              <div className="space-y-3">
                <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 ml-1">
                  Account Category
                </Label>
                <Tabs
                  value={watchedType}
                  onValueChange={(v) => setValue("type", v)}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2 h-14 bg-slate-200/50 p-1.5 rounded-2xl">
                    <TabsTrigger
                      value="CURRENT"
                      className="rounded-xl font-semibold"
                    >
                      Checking
                    </TabsTrigger>
                    <TabsTrigger
                      value="SAVINGS"
                      className="rounded-xl font-semibold"
                    >
                      Savings
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="grid gap-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="name"
                    className="text-sm font-semibold text-slate-700"
                  >
                    Display Name
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g. Chase Main"
                    className="h-12 bg-white border-slate-200 rounded-xl"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-xs font-medium text-destructive">
                      {errors.name.message as string}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="balance"
                    className="text-sm font-semibold text-slate-700"
                  >
                    Current Balance
                  </Label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold border-r pr-3 border-slate-100">
                      $
                    </div>
                    <Input
                      id="balance"
                      type="number"
                      step="0.01"
                      className="h-14 pl-14 text-xl font-bold bg-white border-slate-200 rounded-xl"
                      placeholder="0.00"
                      {...register("balance")}
                    />
                  </div>
                </div>
              </div>

              <div
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
                  watchedIsDefault
                    ? "bg-white border-primary shadow-sm"
                    : "bg-slate-100/50 border-transparent"
                }`}
              >
                <div className="flex gap-4 items-center">
                  <div
                    className={`p-2 rounded-lg transition-colors ${watchedIsDefault ? "bg-primary text-white" : "bg-slate-200 text-slate-400"}`}
                  >
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <Label
                      htmlFor="isDefault"
                      className="text-sm font-bold block cursor-pointer"
                    >
                      Set as Primary
                    </Label>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      Always use for new records
                    </p>
                  </div>
                </div>
                <Switch
                  id="isDefault"
                  checked={watchedIsDefault}
                  onCheckedChange={(v) => setValue("isDefault", v)}
                />
              </div>
            </form>
          </div>

          {/* Sticky Footer */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-slate-50/90 backdrop-blur-md border-t shrink-0">
            <div className="flex flex-col gap-3">
              <Button
                form="drawer-account-form"
                type="submit"
                className="w-full h-14 text-lg font-bold rounded-2xl shadow-xl shadow-primary/20 active:scale-[0.98] transition-all"
                disabled={createAccountLoading || !isValid}
              >
                {createAccountLoading ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  "Complete Setup"
                )}
              </Button>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default CreateAccountDrawer;
