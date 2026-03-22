import { Bloom } from "@/components/mascot";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel - branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[var(--rose)] via-[var(--violet)] to-[var(--teal)] items-center justify-center p-12">
        <div className="text-center text-white">
          <Bloom mood="happy" size="xl" className="mx-auto mb-8" />
          <h1 className="text-4xl font-bold mb-4">Welcome to Haven</h1>
          <p className="text-xl opacity-90 max-w-md">
            A safe, private community for LGBTQIA+ individuals in India.
            Connect, grow, and thrive together.
          </p>
        </div>
      </div>

      {/* Right panel - auth form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Bloom mood="happy" size="lg" className="mx-auto mb-4" />
            <h1 className="text-2xl font-bold gradient-rainbow-text">Haven</h1>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
