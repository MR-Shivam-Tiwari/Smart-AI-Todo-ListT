"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Brain,
  CheckSquare,
  MessageSquare,
  Moon,
  Sun,
  Menu,
  X,
  Home,
  Plus,
  Calendar,
} from "lucide-react";
import { useState, useEffect } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [lightMode, setLightMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedMode = localStorage.getItem("lightMode");
    const isLight = savedMode ? JSON.parse(savedMode) : false;

    setLightMode(isLight);
    document.documentElement.classList.toggle("light", isLight);
  }, []);

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/tasks/create", label: "Create Task", icon: Plus },
    { href: "/context", label: "Daily Context", icon: Calendar },
  ];

  const toggleLightMode = () => {
    const newMode = !lightMode;
    setLightMode(newMode);
    localStorage.setItem("lightMode", JSON.stringify(newMode));
    document.documentElement.classList.toggle("light", newMode);
  };

  if (!mounted) return null;

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="border-b sticky top-0 z-50 task-card rounded-0 backdrop-blur-sm bg-white/80 dark:bg-gray-900/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link
                href="/dashboard"
                className="flex items-center space-x-3 group"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
                  <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-2.5 rounded-xl shadow-lg">
                    <Brain className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-400 dark:to-gray-800 bg-clip-text text-transparent">
                    Smart Todo
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 -mt-1">
                    AI Powered
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-2">
              {navItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={`relative flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                    pathname === href
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                  {pathname === href && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur opacity-30 -z-10"></div>
                  )}
                </Link>
              ))}

              {/* Theme Toggle Button */}
              <button
                onClick={toggleLightMode}
                className="relative p-3 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 group overflow-hidden"
                title={
                  lightMode ? "Switch to Dark Mode" : "Switch to Light Mode"
                }
              >
                <div className="relative z-10">
                  {lightMode ? (
                    <Moon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  ) : (
                    <Sun className="h-5 w-5 text-yellow-500" />
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 opacity-0 group-hover:opacity-10 transition-opacity duration-200"></div>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-2">
              <button
                onClick={toggleLightMode}
                className="p-2.5 rounded-xl bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm border border-gray-300 dark:border-gray-600"
                title={
                  lightMode ? "Switch to Dark Mode" : "Switch to Light Mode"
                }
              >
                {lightMode ? (
                  <Moon className="h-5 w-5 text-slate-700" />
                ) : (
                  <Sun className="h-5 w-5 text-yellow-500" />
                )}
              </button>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                ) : (
                  <Menu className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-2 border-t border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
              {navItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 ${
                    pathname === href
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon className="h-5 w-5" />
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Bottom Navigation (Fixed) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 px-4 py-2">
        <div className="flex justify-around items-center">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[70px] ${
                pathname === href
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{label.split(" ")[0]}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Add padding to body for fixed bottom navigation */}
      <div className="md:hidden h-20"></div>
    </>
  );
}
