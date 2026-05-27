"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { ArrowRight, KeyRound, LockKeyhole, Mail, Sparkles, WandSparkles } from "lucide-react";
import { z } from "zod";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { demoCredentials, useAuthStore } from "@/store/authStore";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters")
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginClient() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  useEffect(() => {
    if (isAuthenticated) router.replace("/");
  }, [isAuthenticated, router]);

  function fillDemoCredentials() {
    setValue("email", demoCredentials.email, { shouldValidate: true });
    setValue("password", demoCredentials.password, { shouldValidate: true });
    toast.success("Demo credentials filled");
  }

  async function onSubmit(values: LoginValues) {
    setIsSubmitting(true);
    try {
      await login(values.email, values.password);
      toast.success("Welcome to VedaAI");
      router.replace("/");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-paper px-4 py-6 text-ink dark:bg-[#181818] dark:text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl overflow-hidden rounded-[2rem] bg-white shadow-sidebar dark:bg-[#232323] lg:grid-cols-[1fr_480px]">
        <section className="relative hidden bg-ink p-10 text-white dark:bg-white dark:text-ink lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 paper-grid opacity-20" />
          <div className="relative">
            <Logo labelClassName="text-white dark:text-ink" />
            <div className="mt-24 max-w-xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold dark:bg-ink/10">
                <Sparkles className="h-4 w-4 text-saffron" />
                AI Assessment Creator
              </span>
              <h1 className="mt-6 text-5xl font-black leading-tight tracking-normal">
                Build exam-ready question papers in minutes.
              </h1>
              <p className="mt-5 max-w-lg text-base leading-7 text-white/65 dark:text-ink/65">
                Create assignments, generate structured papers, track progress, and export clean PDFs from one teacher workspace.
              </p>
            </div>
          </div>

          <div className="relative grid grid-cols-3 gap-3">
            {[
              ["4", "Paper views"],
              ["100%", "Validated output"],
              ["PDF", "Export ready"]
            ].map(([value, label]) => (
              <div key={label} className="rounded-2xl bg-white/10 p-4 dark:bg-ink/10">
                <p className="text-2xl font-black">{value}</p>
                <p className="mt-1 text-xs font-semibold opacity-60">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center p-5 sm:p-8">
          <div className="w-full max-w-md">
            <div className="mb-10 lg:hidden">
              <Logo />
            </div>

            <div className="mb-8">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-50 text-ember dark:bg-orange-500/15">
                <KeyRound className="h-5 w-5" />
              </span>
              <h2 className="mt-5 text-3xl font-black tracking-normal">Welcome back</h2>
              <p className="mt-2 text-sm leading-6 text-neutral-500 dark:text-neutral-300">
                Sign in to manage assignments and generated question papers.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <FormField label="Email" error={errors.email?.message}>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <Input className="pl-11" placeholder="teacher@vedai.demo" {...register("email")} />
                </div>
              </FormField>

              <FormField label="Password" error={errors.password?.message}>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <Input className="pl-11" type="password" placeholder="Enter password" {...register("password")} />
                </div>
              </FormField>

              <button
                type="button"
                onClick={fillDemoCredentials}
                className="flex w-full items-center justify-between rounded-2xl border border-dashed border-ember/40 bg-orange-50 px-4 py-3 text-left text-sm font-bold text-ember transition hover:bg-orange-100 dark:bg-orange-500/10 dark:hover:bg-orange-500/15"
              >
                <span className="flex items-center gap-2">
                  <WandSparkles className="h-4 w-4" />
                  Autofill demo credentials
                </span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <Button className="w-full" size="lg" loading={isSubmitting}>
                Sign in
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <div className="mt-6 rounded-2xl bg-neutral-50 p-4 text-xs leading-6 text-neutral-500 dark:bg-white/6 dark:text-neutral-300">
              <p className="font-bold text-ink dark:text-white">Demo access</p>
              <p>Email: {demoCredentials.email}</p>
              <p>Password: {demoCredentials.password}</p>
            </div>

            <div className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-300">
              Don't have an account?{" "}
              <Link href="/register" className="font-bold text-ember hover:underline">
                Sign up
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
