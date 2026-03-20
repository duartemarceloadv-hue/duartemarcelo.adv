"use client";

import { LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";

interface HeaderProps {
  userName?: string;
  userCargo?: string;
}

export default function Header({ userName, userCargo }: HeaderProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 md:pl-72">
      <div className="pl-10 md:pl-0">
        <h2 className="text-sm text-gray-500">Prontuário Digital</h2>
      </div>

      <div className="flex items-center gap-4">
        {userName && (
          <div className="flex items-center gap-2 text-sm">
            <User size={16} className="text-gray-400" />
            <span className="text-gray-700">{userName}</span>
            {userCargo && (
              <span className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">
                {userCargo}
              </span>
            )}
          </div>
        )}
        <button
          onClick={handleLogout}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          title="Sair"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
