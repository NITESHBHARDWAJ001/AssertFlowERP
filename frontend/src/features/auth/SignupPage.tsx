import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useState } from "react";
import { useAuth } from "./useAuth";
import { TextField } from "../../components/ui/FormField";
import { Button } from "../../components/ui/Button";

const signupSchema = z.object({
  organizationSlug: z.string().min(1, "Organization is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type SignupForm = z.infer<typeof signupSchema>;

export function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupForm>({ resolver: zodResolver(signupSchema) });

  const onSubmit = async (values: SignupForm) => {
    setServerError(null);
    try {
      await signup(values);
      toast.success("Account created");
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      const message = err?.response?.data?.message ?? "Signup failed. Please try again.";
      setServerError(message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold text-brand-700 dark:text-brand-400">AssetFlow</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Create your employee account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <TextField
            label="Organization slug"
            placeholder="e.g. acme-corp"
            error={errors.organizationSlug?.message}
            {...register("organizationSlug")}
          />
          <div className="grid grid-cols-2 gap-3">
            <TextField label="First name" error={errors.firstName?.message} {...register("firstName")} />
            <TextField label="Last name" error={errors.lastName?.message} {...register("lastName")} />
          </div>
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
            autoComplete="new-password"
            error={errors.password?.message}
            {...register("password")}
          />

          {serverError && <p className="text-sm text-red-600 dark:text-red-400">{serverError}</p>}

          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Create account
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
          Already have an account?{" "}
          <Link to="/login" className="text-brand-600 hover:underline dark:text-brand-400">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
