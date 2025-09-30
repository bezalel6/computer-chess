/**
 * Home/Landing Page
 *
 * Redirects authenticated users to lobby, shows welcome message for others.
 */

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import Link from "next/link";

export default async function HomePage() {
  const session = await auth();

  if (session) {
    redirect("/lobby");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <header className="text-center mb-12">
        <h1 className="text-6xl font-bold mb-4">Computer Chess</h1>
        <h2 className="text-2xl text-gray-400">
          &quot;The next lichess&quot; - nobody ever
        </h2>
      </header>

      <div className="flex gap-4">
        <Link
          href="/login"
          className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-lg font-semibold transition-colors"
        >
          Get Started
        </Link>
        <Link
          href="/login?mode=guest"
          className="px-8 py-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-lg font-semibold transition-colors"
        >
          Play as Guest
        </Link>
      </div>

      <div className="mt-16 max-w-2xl text-center px-4">
        <p className="text-gray-300 text-lg">
          Play chess with dynamic challenges. Compete against real opponents and
          test your skills with move analysis powered by Stockfish.
        </p>
      </div>
    </div>
  );
}
