/**
 * IdeasScreen — native "Ideas" tab.
 *
 * Wraps the real IdeasHub (themes + games library from static TS data)
 * with native safe-area + bottom padding so it displays inside the
 * tab shell without double-headers or cut-off content.
 */
import { Suspense, lazy } from "react";
import PageLoader from "@/components/ui/PageLoader";

const IdeasHub = lazy(() => import("@/pages/IdeasHub"));

export default function IdeasScreen() {
  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex-1 overflow-y-auto native-scroll safe-top pb-tabbar">
        <Suspense fallback={<PageLoader />}>
          <IdeasHub />
        </Suspense>
      </div>
    </div>
  );
}
