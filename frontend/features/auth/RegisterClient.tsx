"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ArrowRight, LockKeyhole, Mail, Sparkles, User, School, KeyRound } from "lucide-react";
import { z } from "zod";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { useAuthStore } from "@/store/authStore";
import { toast as hotToast } from "react-hot-toast";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  schoolName: z.string().min(2, "School name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters")
});

type RegisterValues = z.infer<typeof registerSchema>;

export function RegisterClient() {
  const router = useRouter();
  const registerUser = useAuthStore((state) => state.register);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      schoolName: "",
      email: "",
      password: ""
    }
  });

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, router]);

  async function onSubmit(values: RegisterValues) {
    setIsSubmitting(true);
    try {
      await registerUser(values.email, values.password, values.name, values.schoolName);
      hotToast.success("Account created successfully! Welcome to VedaAI");
      router.replace("/");
    } catch (error) {
      hotToast.error(error instanceof Error ? error.message : "Registration failed");
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
                Empowering Educators
              </span>
              <h1 className="mt-6 text-5xl font-black leading-tight tracking-normal">
                Join VedaAI and revolutionize assessment design.
              </h1>
              <p className="mt-5 max-w-lg text-base leading-7 text-white/65 dark:text-ink/65">
                Join a secure workspace built specifically for teachers. Generate structured assignments, save custom templates, and export print-ready PDFs in seconds.
              </p>
            </div>
          </div>

          <div className="relative grid grid-cols-3 gap-3">
            {[
              ["10x", "Time saved"],
              ["100%", "Customizable"],
              ["SaaS", "Multi-tenant"]
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
              <h2 className="mt-5 text-3xl font-black tracking-normal">Create your account</h2>
              <p className="mt-2 text-sm leading-6 text-neutral-500 dark:text-neutral-300">
                Register as a teacher to start managing assignments.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <FormField label="Full Name" error={errors.name?.message}>
                <div className="relative">
                  <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <Input className="pl-11" placeholder="Dr. John Doe" {...register("name")} />
                </div>
              </FormField>

              <FormField label="School Name" error={errors.schoolName?.message}>
                <div className="relative">
                  <School className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <Input className="pl-11" placeholder="Delhi Public School" {...register("schoolName")} />
                </div>
              </FormField>

              <FormField label="Email" error={errors.email?.message}>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <Input className="pl-11" placeholder="teacher@school.edu" {...register("email")} />
                </div>
              </FormField>

              <FormField label="Password" error={errors.password?.message}>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <Input className="pl-11" type="password" placeholder="Create a secure password" {...register("password")} />
                </div>
              </FormField>

              <Button className="w-full mt-2" size="lg" loading={isSubmitting}>
                Sign up
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-300">
              Already have an account?{" "}
              <Link href="/login" className="font-bold text-ember hover:underline">
                Sign in
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
