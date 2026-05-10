import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Email Verification",
  description: "Please verify your email to continue.",
};

export default function VerifyEmailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
