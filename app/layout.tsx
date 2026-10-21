import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "DecideWise — Think together, decide clearly",
  description: "Collect perspectives from a group and use AI to identify shared themes, differences, and unanswered questions."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
