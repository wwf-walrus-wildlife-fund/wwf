export function Footer() {
  return (
    <footer className="border-t-2 border-[#4d6cb3] py-8 px-6 lg:px-10 bg-[#111b33]">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div
          className="flex items-center gap-2 text-[#85a3c7]"
          style={{ fontSize: "0.95rem" }}
        >
          [RETRO NODE] &copy; 2026 TuskBazaar on Sui
        </div>
        <div
          className="flex items-center gap-4 text-[#8ef8f7]"
          style={{ fontSize: "0.9rem" }}
        >
          <a href="#" className="retro-chip hover:text-[#ffe066] transition-colors">
            Docs
          </a>
          <a href="#" className="retro-chip hover:text-[#ffe066] transition-colors">
            API
          </a>
          <a href="#" className="retro-chip hover:text-[#ffe066] transition-colors">
            GitHub
          </a>
          <a href="#" className="retro-chip hover:text-[#ffe066] transition-colors">
            Discord
          </a>
        </div>
      </div>
    </footer>
  );
}
