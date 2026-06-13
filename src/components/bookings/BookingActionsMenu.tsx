/**
 * BookingActionsMenu — ⋮ context menu for a booking card in MyBookings.
 *
 * Native: vaul bottom-sheet (dark app styling, haptics on tap) with
 *   view / calendar / share / WhatsApp actions.
 * Web: shadcn DropdownMenu with the same actions + "Print / PDF"
 *   (navigates to the detail page where the print button lives).
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  MoreVertical,
  Ticket,
  CalendarPlus,
  Share2,
  MessageCircle,
  Printer,
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { isNative } from "@/lib/platform";
import { useHaptics } from "@/hooks/useHaptics";
import { cn } from "@/lib/utils";
import {
  exportBookingToCalendar,
  shareBooking,
  shareBookingViaWhatsApp,
  type IcsBooking,
} from "@/lib/booking-actions";
import type { MarketplaceBooking } from "@/hooks/useMarketplaceBookings";

interface BookingActionsMenuProps {
  booking: MarketplaceBooking;
}

interface MenuAction {
  id: "view" | "calendar" | "share" | "whatsapp" | "print";
  label: string;
  icon: typeof Ticket;
  accentClass?: string;
  run: () => void;
}

export default function BookingActionsMenu({ booking }: BookingActionsMenuProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const haptics = useHaptics();
  const [open, setOpen] = useState(false);
  const native = isNative();

  const icsBooking: IcsBooking = {
    id: booking.id,
    booking_number: booking.booking_number,
    public_token: booking.public_token,
    service_title: booking.service_title,
    agency_name: booking.agency_name,
    agency_city: booking.agency_city ?? null,
    booking_date: booking.booking_date,
    booking_time: booking.booking_time,
  };

  // Detail-page path incl. the secret token so the owner's own deep link
  // also carries it (harmless for the owner, required once shared).
  const tokenQuery = booking.public_token ? `?t=${booking.public_token}` : "";
  const detailPath = `/booking/${booking.booking_number}${tokenQuery}`;

  const shareText = t(
    "myBookings.actions.shareText",
    "Meine Buchung: {{service}} bei {{agency}} 🎉",
    {
      service: booking.service_title || "Service",
      agency: booking.agency_name || "EventBliss",
    },
  );

  const baseActions: MenuAction[] = [
    {
      id: "view",
      label: t("myBookings.actions.view", "Buchung ansehen"),
      icon: Ticket,
      run: () => navigate(detailPath),
    },
    {
      id: "calendar",
      label: t("myBookings.actions.calendar", "Zum Kalender hinzufügen"),
      icon: CalendarPlus,
      run: () => void exportBookingToCalendar(icsBooking),
    },
    {
      id: "share",
      label: t("myBookings.actions.share", "Teilen…"),
      icon: Share2,
      run: () => void shareBooking(icsBooking, shareText),
    },
    {
      id: "whatsapp",
      label: t("myBookings.actions.whatsapp", "Per WhatsApp senden"),
      icon: MessageCircle,
      accentClass: "text-emerald-400",
      run: () => shareBookingViaWhatsApp(icsBooking, shareText),
    },
  ];

  // No printing on native — window.print is dead in the WKWebView. On web
  // the menu item navigates to the detail page with its prominent print button.
  const actions: MenuAction[] = native
    ? baseActions
    : [
        ...baseActions,
        {
          id: "print",
          label: t("myBookings.actions.print", "Drucken / PDF"),
          icon: Printer,
          run: () => navigate(detailPath),
        },
      ];

  const triggerButton = (
    <button
      type="button"
      aria-label="Aktionen"
      onClick={(e) => {
        e.stopPropagation();
        if (native) {
          haptics.light();
          setOpen(true);
        }
      }}
      className="h-8 w-8 -mr-1 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/[0.06] transition-colors cursor-pointer shrink-0"
    >
      <MoreVertical className="w-4 h-4" />
    </button>
  );

  // ---- Native: bottom sheet -------------------------------------------
  if (native) {
    return (
      <>
        {triggerButton}
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent
            className="bg-[#15151e] border-white/10 pb-[max(env(safe-area-inset-bottom),1rem)]"
            onClick={(e) => e.stopPropagation()}
          >
            <DrawerHeader className="text-left pb-2">
              <DrawerTitle className="text-slate-50 text-base">
                {booking.service_title || "Service"}
              </DrawerTitle>
              <DrawerDescription className="text-slate-500 text-xs font-mono">
                {booking.booking_number}
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-2 space-y-1.5">
              {actions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => {
                      haptics.select();
                      setOpen(false);
                      action.run();
                    }}
                    className="w-full flex items-center gap-3 min-h-[52px] px-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-left text-sm font-medium text-slate-200 active:scale-[0.97] active:bg-white/[0.07] transition-all cursor-pointer"
                  >
                    <Icon className={cn("w-[18px] h-[18px] shrink-0", action.accentClass ?? "text-violet-400")} />
                    {action.label}
                  </button>
                );
              })}
            </div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  // ---- Web: dropdown ---------------------------------------------------
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{triggerButton}</DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="bg-[#1f1f29] border-white/10 text-slate-200 min-w-[220px]"
        onClick={(e) => e.stopPropagation()}
      >
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <DropdownMenuItem
              key={action.id}
              onClick={(e) => {
                e.stopPropagation();
                action.run();
              }}
              className="gap-2.5 cursor-pointer focus:bg-white/[0.06] focus:text-slate-50"
            >
              <Icon className={cn("w-4 h-4", action.accentClass ?? "text-slate-400")} />
              {action.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
