import { LoginForm } from "@/features/auth/components/login-form";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-[70vh] items-center justify-center">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-60">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#0055A5]/12 blur-3xl" />
        <div className="absolute -right-24 top-12 h-72 w-72 rounded-full bg-[#00A86B]/12 blur-3xl" />
      </div>
      <LoginForm />
    </div>
  );
}
