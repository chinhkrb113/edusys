"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { SearchIcon, BellIcon, HelpCircleIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge"; // For notification badge
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button"; // For dropdown trigger

const Header = () => {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 lg:h-[60px]">
      <div className="relative ml-auto flex-1 md:grow-0">
        <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search students, classes, courses..."
          className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
        />
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative">
          <HelpCircleIcon className="h-5 w-5" />
          <span className="sr-only">Help</span>
        </Button>
        <Button variant="ghost" size="icon" className="relative">
          <BellIcon className="h-5 w-5" />
          <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-xs">
            2
          </Badge>
          <span className="sr-only">Notifications</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="relative h-9 w-auto px-2 flex items-center gap-2"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder.svg" alt="Avatar" />
                <AvatarFallback>SJ</AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium">Sarah Johnson</span>
                <span className="text-xs text-muted-foreground">Academic Director</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem>Support</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;