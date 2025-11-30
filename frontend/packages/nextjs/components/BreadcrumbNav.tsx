import { usePathname, useRouter } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

export function BreadcrumbNav() {
  const pathname = usePathname();
  const router = useRouter();

  // Get current page from pathname
  const getCurrentPage = () => {
    if (pathname === "/") return "Home";
    if (pathname === "/swap" || pathname === "/game") return "Swap";
    if (pathname === "/history") return "History";
    if (pathname === "/docs") return "Docs";
    return "";
  };

  const currentPage = getCurrentPage();

  // Don't show breadcrumb on Home page
  if (currentPage === "Home") return null;

  const pageNames: Record<string, string> = {
    Swap: "Token Swap",
    History: "Swap History",
    Docs: "Documentation",
  };

  const handleNavigateHome = () => {
    router.push("/");
  };

  return (
    <nav className="flex items-center gap-2 text-sm mb-6">
      <button
        onClick={handleNavigateHome}
        className="flex items-center gap-1 text-[#a3a3a3] hover:text-[#fde047] transition-colors duration-200"
      >
        <Home className="h-4 w-4" />
        <span>Home</span>
      </button>
      <ChevronRight className="h-4 w-4 text-[#404040]" />
      <span className="text-[#fde047] font-medium">{pageNames[currentPage] || currentPage}</span>
    </nav>
  );
}
