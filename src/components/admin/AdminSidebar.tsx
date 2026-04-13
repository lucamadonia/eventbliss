import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Shield } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { ADMIN_NAV_GROUPS } from "./admin-nav-config";

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function AdminSidebar({ activeTab, onTabChange }: AdminSidebarProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setOpenMobile, isMobile } = useSidebar();

  const handleItemClick = (key: string, href?: string) => {
    if (href) {
      navigate(href);
    } else {
      onTabChange(key);
    }
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar side="left" collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Shield className="h-4 w-4" />
          </div>
          <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
            <span className="font-semibold text-sm">Admin Portal</span>
            <span className="text-xs text-muted-foreground">EventBliss</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {ADMIN_NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.groupLabelKey}>
            <SidebarGroupLabel>
              {t(group.groupLabelKey, group.defaultGroupLabel)}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      isActive={activeTab === item.key}
                      tooltip={t(item.labelKey, item.defaultLabel)}
                      onClick={() => handleItemClick(item.key, item.href)}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{t(item.labelKey, item.defaultLabel)}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
