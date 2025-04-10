
import { Link } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/top-bar";
import DashboardPage from "./dashboard-page";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <main className="flex-grow">
        <DashboardPage />
      </main>
    </div>
  );
}
