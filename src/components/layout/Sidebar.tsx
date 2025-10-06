"use client";

import React from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  MenuIcon,
  LayoutDashboardIcon,
  BookOpenIcon,
  GraduationCapIcon,
  ClipboardListIcon,
  FileTextIcon,
  BarChart2Icon,
  SettingsIcon,
  UsersIcon,
  CalendarDaysIcon,
  ChevronDownIcon,
  Gamepad2Icon,
  TrophyIcon,
  ShieldIcon,
  TrendingUpIcon,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface NavItem {
  title: string;
  href?: string;
  icon: React.ElementType;
  isCollapsible?: boolean;
  subItems?: { title: string; href: string }[];
}

const navItems: NavItem[] = [
  { title: "Dashboard", href: "/", icon: LayoutDashboardIcon },

  { title: "Class Management", href: "/class-management", icon: GraduationCapIcon },
  {
    title: "Curriculum Management",
    icon: BookOpenIcon,
    isCollapsible: true,
    subItems: [
      { title: "Danh sách KCT", href: "/curriculum-management?tab=kct-list" },
      { title: "Tạo mới KCT", href: "/curriculum-management?tab=create-edit" },
      { title: "Structure Editor", href: "/curriculum-management?tab=structure-editor" },
      { title: "Phiên bản & Phê duyệt", href: "/curriculum-management?tab=versions-approval" },
      { title: "Mapping KCT", href: "/curriculum-management?tab=mapping" },
      { title: "Quản lý nội dung", href: "/curriculum-management?tab=content-management" },
      { title: "Xuất bản & Export", href: "/curriculum-management?tab=export-publishing" },
      { title: "Báo cáo & Ma trận", href: "/curriculum-management?tab=academic-reports" },
      { title: "Quy tắc & Bảo vệ", href: "/curriculum-management?tab=guardrails-validation" },
    ],
  },
  { title: "Course Management", href: "/course-management", icon: FileTextIcon },
  { title: "Assignments & Games", href: "/assignments-games", icon: Gamepad2Icon },
  { title: "Exam Management", href: "/exam-management", icon: ClipboardListIcon },
  { title: "Document Library", href: "/document-library", icon: FileTextIcon },
  { title: "Gamification & Grading", href: "/gamification-grading", icon: TrophyIcon },
  { title: "Users & Roles", href: "/users-roles-permissions", icon: ShieldIcon },
  { title: "Analytics & Reports", href: "/analytics-reports", icon: TrendingUpIcon },

  { title: "Settings", href: "/settings", icon: SettingsIcon },
];

const NavLinks = ({ onLinkClick }: { onLinkClick?: () => void }) => {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const getCurrentPathWithQuery = () => {
    const url = new URL(window.location.href);
    return url.pathname + url.search;
  };

  return (
    <nav className="grid items-start gap-2 px-2 text-sm font-medium lg:px-4">
      {navItems.map((item) =>
        item.isCollapsible ? (
          <Collapsible
            key={item.title}
            defaultOpen={item.subItems?.some(
              (sub) => getCurrentPathWithQuery() === sub.href,
            )}
          >
            <CollapsibleTrigger
              className={cn(
                "flex items-center justify-between w-full gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                item.subItems &&
                  item.subItems.some((sub) => getCurrentPathWithQuery() === sub.href)
                  ? "bg-muted text-primary"
                  : "text-muted-foreground",
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-4 w-4" />
                {item.title}
              </div>
              <ChevronDownIcon className="h-4 w-4 shrink-0 transition-transform duration-200 data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="ml-4 mt-1 grid gap-2">
              {item.subItems?.map((subItem) => (
                <Link
                  key={subItem.title}
                  to={subItem.href!}
                  onClick={onLinkClick}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                    getCurrentPathWithQuery() === subItem.href
                      ? "bg-muted text-primary"
                      : "text-muted-foreground",
                  )}
                >
                  {subItem.title}
                </Link>
              ))}
            </CollapsibleContent>
          </Collapsible>
        ) : (
          <Link
            key={item.href}
            to={item.href!}
            onClick={onLinkClick}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
              location.pathname === item.href
                ? "bg-muted text-primary"
                : "text-muted-foreground",
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.title}
          </Link>
        ),
      )}
    </nav>
  );
};

export const Sidebar = () => {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = React.useState(false);

  const handleLinkClick = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed top-4 left-4 z-50 md:hidden"
          >
            <MenuIcon className="h-6 w-6" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col w-64">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link to="/" className="flex items-center gap-2 font-semibold">
              <GraduationCapIcon className="h-6 w-6 text-primary" />
              <span className="text-lg">SysEdu AI</span>
            </Link>
          </div>
          <ScrollArea className="flex-1 py-4">
            <NavLinks onLinkClick={handleLinkClick} />
          </ScrollArea>
          <div className="mt-auto border-t p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback>SJ</AvatarFallback>
              </Avatar>
              <div className="grid gap-0.5">
                <p className="text-sm font-medium leading-none">
                  Sarah Johnson
                </p>
                <p className="text-xs text-muted-foreground">
                  Academic Director
                </p>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className="hidden border-r bg-sidebar md:block w-[280px] lg:w-[280px]">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <GraduationCapIcon className="h-6 w-6 text-primary" />
            <span className="text-lg">SysEdu AI</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-4">
          <NavLinks />
        </div>
        <div className="mt-auto border-t p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback>SJ</AvatarFallback>
            </Avatar>
            <div className="grid gap-0.5">
              <p className="text-sm font-medium leading-none">
                Sarah Johnson
              </p>
              <p className="text-xs text-muted-foreground">
                Academic Director
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
