"use client";

import React from "react";
import { Sidebar } from "./Sidebar";
import { MadeWithDyad } from "@/components/made-with-dyad";
import Header from "./Header"; // Import the new Header component

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[280px_1fr]"> {/* Adjusted grid for fixed sidebar */}
      <Sidebar />
      <div className="flex flex-col">
        <Header /> {/* Place the new Header component here */}
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
        <MadeWithDyad />
      </div>
    </div>
  );
};

export default MainLayout;