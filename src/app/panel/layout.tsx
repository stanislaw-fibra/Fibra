export default function PanelRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink-950 text-ink-100 antialiased selection:bg-brand-500 selection:text-white">
      {children}
    </div>
  );
}
