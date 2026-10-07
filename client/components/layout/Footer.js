export default function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-ink-faint sm:px-6">
        <p>© {new Date().getFullYear()} Wingly. A demo flight booking project — no real tickets are issued or charged.</p>
        <p className="mt-1">Flight data provided by Duffel.</p>
      </div>
    </footer>
  );
}
