import { Moon, Sun, Sparkles, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const themes = [
  { value: "system", icon: Monitor, labelKey: "theme.system", descKey: "theme.systemDesc" },
  { value: "dark", icon: Moon, labelKey: "theme.dark", descKey: "theme.darkDesc" },
  { value: "light", icon: Sun, labelKey: "theme.light", descKey: "theme.lightDesc" },
  { value: "rose", icon: Sparkles, labelKey: "theme.rose", descKey: "theme.roseDesc" },
] as const;

export function ThemeSwitcher() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();

  const currentTheme = themes.find((th) => th.value === theme) || themes[0];
  const CurrentIcon = currentTheme.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <CurrentIcon className="h-4 w-4" />
          <span className="sr-only">{t("theme.title", "Theme")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {themes.map((th) => {
          const Icon = th.icon;
          return (
            <DropdownMenuItem
              key={th.value}
              onClick={() => setTheme(th.value)}
              className={`flex items-center gap-3 cursor-pointer ${theme === th.value ? "bg-accent" : ""}`}
            >
              <Icon className="h-4 w-4" />
              <div className="flex flex-col">
                <span className="font-medium">{t(th.labelKey, th.value)}</span>
                <span className="text-xs text-muted-foreground">{t(th.descKey, "")}</span>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
