import { useMemo } from "react";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { isNative } from "@/lib/platform";
import { appSwitchFor, type AppSwitchState } from "@/lib/app-switches";

/**
 * Which areas of the native app an admin has switched off. Read from the
 * server (cached for a few minutes by `useFeatureFlag`), so a change reaches
 * installed apps without a release. While the answer is loading, and on the
 * web, every area counts as visible.
 */
export function useAppSwitches(): AppSwitchState {
  const marketplace = useFeatureFlag(appSwitchFor("marketplace").key);
  const services = useFeatureFlag(appSwitchFor("services").key);
  const native = isNative();
  const marketplaceOff = native && marketplace.enabled;
  const servicesOff = native && services.enabled;
  return useMemo(() => ({ marketplaceOff, servicesOff }), [marketplaceOff, servicesOff]);
}
