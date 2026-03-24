"use client";

import { useState } from "react";
import Link from "next/link";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSent(true);
      toast.success("Reset link sent! Check your email 📧");
    } catch (err: unknown) {
      const message = (err as Error).message;
      if (message.includes("user-not-found")) {
        toast.error("No account found with this email");
      } else {
        toast.error("Failed to send reset link. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-dark to-brand-primary/80 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <Link
          href="/"
          className="block text-center font-heading text-2xl font-bold text-brand-primary mb-6"
        >
          🌿 WildSaura
        </Link>

        {sent ? (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="font-heading text-xl font-bold text-brand-dark mb-2">
              Check Your Email
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              We&apos;ve sent a password reset link to{" "}
              <span className="font-semibold text-brand-dark">{email}</span>
            </p>
            <p className="text-xs text-gray-400 mb-6">
              Didn&apos;t receive it? Check your spam folder or try again.
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={() => setSent(false)} variant="outline" className="w-full">
                Try Another Email
              </Button>
              <Link
                href="/login"
                className="text-sm text-brand-primary hover:underline font-medium text-center"
              >
                Back to Login
              </Link>
            </div>
          </div>
        ) : (
          <>
            <h2 className="font-heading text-xl font-bold text-brand-dark text-center mb-2">
              Forgot Password?
            </h2>
            <p className="text-gray-500 text-sm text-center mb-8">
              Enter your email and we&apos;ll send you a reset link
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hari@example.com"
                leftIcon={<Mail size={16} />}
                required
              />
              <Button type="submit" className="w-full" isLoading={loading} size="lg">
                Send Reset Link
              </Button>
            </form>

            <Link
              href="/login"
              className="flex items-center justify-center gap-2 mt-6 text-sm text-gray-500 hover:text-brand-primary transition-colors"
            >
              <ArrowLeft size={14} />
              Back to Login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
