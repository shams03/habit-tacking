import SignupForm from "@/components/Auth/SignupForm";

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-xl shadow-emerald-500/25 mb-4">
            <span className="text-xl">✨</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Get started</h1>
          <p className="mt-1 text-sm text-slate-400">
            Create your free account — takes 30 seconds
          </p>
        </div>
        <div className="card p-6">
          <SignupForm />
        </div>
      </div>
    </div>
  );
}
