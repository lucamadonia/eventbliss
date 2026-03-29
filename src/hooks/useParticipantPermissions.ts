import { useMemo } from "react";
import { useAuthContext } from "@/components/auth/AuthProvider";
import type { EventData, Participant, DashboardPermissions } from "@/hooks/useEvent";

const DEFAULT_PERMISSIONS: DashboardPermissions = {
  can_view_responses: false,
  can_add_expenses: true,
  can_view_all_expenses: false,
  can_edit_settings: false,
};

const ALL_TABS = [
  "overview", "planner", "expenses", "responses", "formbuilder", "schedule",
  "destination", "ideas", "agencies", "ai", "messages", "settings",
];

const BASE_TABS = ["overview", "planner", "schedule", "messages"];

export interface ParticipantPermissionsResult {
  isOrganizer: boolean;
  currentParticipant: Participant | null;
  permissions: DashboardPermissions;
  allowedTabs: string[];
}

export function useParticipantPermissions(
  event: EventData | null,
  participants: Participant[],
): ParticipantPermissionsResult {
  const { user } = useAuthContext();

  return useMemo(() => {
    if (!event || !user) {
      // Anonymous user: use admin-configured public tabs, fallback to BASE_TABS
      const publicTabs = (event?.settings as any)?.public_visible_tabs;
      return {
        isOrganizer: false,
        currentParticipant: null,
        permissions: DEFAULT_PERMISSIONS,
        allowedTabs: Array.isArray(publicTabs) && publicTabs.length > 0 ? publicTabs : BASE_TABS,
      };
    }

    const currentParticipant = participants.find(p => p.user_id === user.id) ?? null;
    const isOrganizer =
      event.created_by === user.id ||
      currentParticipant?.role === "organizer";

    if (isOrganizer) {
      return {
        isOrganizer: true,
        currentParticipant,
        permissions: {
          can_view_responses: true,
          can_add_expenses: true,
          can_view_all_expenses: true,
          can_edit_settings: true,
        },
        allowedTabs: ALL_TABS,
      };
    }

    const permissions: DashboardPermissions = {
      ...DEFAULT_PERMISSIONS,
      ...currentParticipant?.dashboard_permissions,
    };

    const allowedTabs = [...BASE_TABS];
    if (permissions.can_add_expenses || permissions.can_view_all_expenses) allowedTabs.push("expenses");
    if (permissions.can_view_responses) allowedTabs.push("responses");
    if (permissions.can_edit_settings) {
      allowedTabs.push("settings", "formbuilder", "destination");
    }

    return { isOrganizer, currentParticipant, permissions, allowedTabs };
  }, [event, participants, user]);
}
