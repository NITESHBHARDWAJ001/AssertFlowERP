import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useState } from "react";
import { useAuth } from "./useAuth";
import { TextField } from "../../components/ui/FormField";
import { Button } from "../../components/ui/Button";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginForm) => {
    setServerError(null);
    try {
      await login(values.email, values.password);
      toast.success("Welcome back");
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      const message = err?.response?.data?.message ?? "Login failed. Please try again.";
      setServerError(message);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-paper px-4 dark:bg-night">
      <div
        className="bg-blueprint pointer-events-none absolute inset-0 text-brand-900/[0.05] dark:text-brand-300/[0.06]"
        aria-hidden="true"
      />
      <div className="relative w-full max-w-sm rounded-lg border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold text-brand-700 dark:text-brand-400">AssetFlow</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />
          <TextField
            label="Password"
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register("password")}
          />

          {serverError && <p className="text-sm text-red-600 dark:text-red-400">{serverError}</p>}

          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Sign in
          </Button>
        </form>

        <div className="mt-4 space-y-2 text-center">
          <a href="/forgot-password" className="block text-sm text-brand-600 hover:underline dark:text-brand-400">
            Forgot your password?
          </a>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            New here?{" "}
            <Link to="/signup" className="text-brand-600 hover:underline dark:text-brand-400">
              Create an employee account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
