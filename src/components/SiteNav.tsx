import { Link, useLocation, useNavigate } from "react-router-dom";
import { Github, LogOut, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/bhawna-logo.png";

const links = [
  { to: "/", label: "Home" },
  { to: "/analyse", label: "Analyse" },
  { to: "/image-analyse", label: "Image Lab" },
  { to: "/compare", label: "Compare" },
  { to: "/#pricing", label: "Pricing" },
];

export default function SiteNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  const handleSignOut = () => {
    logout();
    navigate("/");
  };

  const initials = (user?.name || user?.email || "?")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="absolute inset-0 bg-background/70 backdrop-blur-xl border-b border-border" />
      <nav className="relative max-w-[1200px] mx-auto flex items-center justify-between px-6 h-16">
        <Link to="/" className="flex items-center gap-2.5 group">
          <span className="relative flex items-center justify-center w-9 h-9 rounded-xl overflow-hidden bg-background ring-1 ring-border shadow-glow">
            <img
              src={logo}
              alt="Bhawna logo"
              className="w-full h-full object-contain p-0.5 group-hover:scale-110 transition-transform duration-500"
              width={36}
              height={36}
            />
          </span>
          <span className="font-serif text-2xl tracking-tight text-foreground">
            Bhawna
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1 surface-2 rounded-full p-1 hairline">
          {links.map((l) => {
            const active =
              pathname === l.to || (l.to.includes("#") && pathname === "/");
            const isHash = l.to.includes("#");
            if (isHash) {
              return (
                <a
                  key={l.to}
                  href={l.to}
                  className={cn(
                    "px-4 py-1.5 text-sm rounded-full transition-all",
                    "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {l.label}
                </a>
              );
            }
            return (
              <Link
                key={l.to}
                to={l.to}
                className={cn(
                  "px-4 py-1.5 text-sm rounded-full transition-all",
                  pathname === l.to
                    ? "bg-foreground text-background font-medium"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Github className="w-4 h-4" />
            GitHub
          </a>

          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full surface-2 hairline hover:bg-secondary transition-colors"
                  aria-label="Account menu"
                >
                  <Avatar className="w-7 h-7 ring-1 ring-border">
                    <AvatarImage src={user.picture} alt={user.name} />
                    <AvatarFallback className="text-[10px] bg-primary/15 text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm text-foreground max-w-[120px] truncate">
                    {user.name?.split(" ")[0] || "Account"}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-60 rounded-2xl p-1.5"
              >
                <DropdownMenuLabel className="px-3 py-2">
                  <div className="text-sm text-foreground font-medium truncate">
                    {user.name}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => navigate("/analyse")}
                  className="rounded-lg cursor-pointer"
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Open analyser
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate("/compare")}
                  className="rounded-lg cursor-pointer"
                >
                  Compare models
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate("/image-analyse")}
                  className="rounded-lg cursor-pointer"
                >
                  Analyze image
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="rounded-lg cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              asChild
              size="sm"
              className="rounded-full bg-foreground text-background hover:bg-foreground/90"
            >
              <Link to="/login">Sign in</Link>
            </Button>
          )}
        </div>
      </nav>
    </header>
  );
}
