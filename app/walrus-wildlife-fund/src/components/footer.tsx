export function Footer() {
  return (
    <footer className="border-t border-white/5 py-8 px-6 lg:px-10">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div
          className="flex items-center gap-2 text-white/20"
          style={{ fontSize: "0.8rem" }}
        >
          &copy; 2026 TuskBazaar. Built on Sui.
        </div>
        <div
          className="flex items-center gap-6 text-white/20"
          style={{ fontSize: "0.8rem" }}
        >
          <a href="#" className="hover:text-white/40 transition-colors">
            Docs
          </a>
          <a href="#" className="hover:text-white/40 transition-colors">
            API
          </a>
          <a href="#" className="hover:text-white/40 transition-colors">
            GitHub
          </a>
          <a href="#" className="hover:text-white/40 transition-colors">
            Discord
          </a>
        </div>
      </div>
    </footer>
  );
}
