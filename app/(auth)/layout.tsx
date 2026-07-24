import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Account | Mardi Treks",
    template: "%s | Mardi Treks",
  },
  description: "Manage your Mardi Treks account — sign in, sign up, and manage your bookings.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
