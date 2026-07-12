import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { resetPasswordRequest } from "../../api/auth";
import { TextField } from "../../components/ui/FormField";
import { Button } from "../../components/ui/Button";

const schema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
});
type Form = z.infer<typeof schema>;

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: Form) => {
    try {
      await resetPasswordRequest(token, values.password);
      toast.success("Password reset - please sign in");
      navigate("/login", { replace: true });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Reset link is invalid or expired");
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
        <p className="text-sm text-red-600 dark:text-red-400">Missing reset token. Please request a new link.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="mb-6 text-xl font-semibold text-brand-700 dark:text-brand-400">Set a new password</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <TextField
            label="New password"
            type="password"
            error={errors.password?.message}
            {...register("password")}
          />
          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Reset password
          </Button>
        </form>
      </div>
    </div>
  );
}
