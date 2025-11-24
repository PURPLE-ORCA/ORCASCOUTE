"use client";

import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { UserMenu } from "@/components/user-menu";
import {
  IconBriefcase,
  IconUser,
  IconFileText,
  IconMail,
} from "@tabler/icons-react";

const links = [
  {
    label: "Jobs",
    href: "/jobs",
    icon: (
      <IconBriefcase className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
    ),
  },
  {
    label: "Profile",
    href: "/profile",
    icon: (
      <IconUser className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
    ),
  },
  {
    label: "CVs",
    href: "/cvs",
    icon: (
      <IconFileText className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
    ),
  },
  {
    label: "Templates",
    href: "/templates",
    icon: (
      <IconMail className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
    ),
  },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
            <div className="mb-8 flex items-center gap-2 px-2">
              <span className="text-2xl">🐋</span>
              <span className="font-bold text-xl">OrcaScout</span>
            </div>
            <div className="flex flex-col gap-2">
              {links.map((link) => (
                <SidebarLink key={link.href} link={link} />
              ))}
            </div>
          </div>
          <div className="px-2">
            <UserMenu />
          </div>
        </SidebarBody>
      </Sidebar>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
