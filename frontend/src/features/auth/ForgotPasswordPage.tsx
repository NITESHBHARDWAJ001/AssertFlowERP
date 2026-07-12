import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPasswordRequest } from "../../api/auth";
import { TextField } from "../../components/ui/FormField";
import { Button } from "../../components/ui/Button";

const schema = z.object({ email: z.string().email("Enter a valid email address") });
type Form = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: Form) => {
    await forgotPasswordRequest(values.email);
    setSent(true);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-paper px-4 dark:bg-night">
      <div
        className="bg-blueprint pointer-events-none absolute inset-0 text-brand-900/[0.05] dark:text-brand-300/[0.06]"
        aria-hidden="true"
      />
      <div className="relative w-full max-w-sm rounded-lg border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="mb-1 text-xl font-semibold text-brand-700 dark:text-brand-400">Reset your password</h1>
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
          Enter your email and we'll send you a reset link.
        </p>

        {sent ? (
          <p className="text-sm text-green-700 dark:text-green-400">
            If an account exists for that email, a reset link has been sent.
          </p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <TextField label="Email" type="email" error={errors.email?.message} {...register("email")} />
            <Button type="submit" className="w-full" isLoading={isSubmitting}>
              Send reset link
            </Button>
          </form>
        )}

        <div className="mt-4 text-center">
          <Link to="/login" className="text-sm text-brand-600 hover:underline dark:text-brand-400">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
