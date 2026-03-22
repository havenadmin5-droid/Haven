/**
 * Main layout - minimal shell for the SPA.
 * HavenApp handles all routing, layout, and navigation.
 * This layout just passes through to the catch-all route.
 */
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
