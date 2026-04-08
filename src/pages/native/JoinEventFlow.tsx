/**
 * JoinEventFlow — native wrapper for JoinEvent.
 */
import JoinEvent from "@/pages/JoinEvent";
import { NativeStackPage } from "@/components/native/NativeStackPage";

export default function JoinEventFlow() {
  return (
    <NativeStackPage title="Event beitreten" showBack fullscreen={false}>
      <JoinEvent />
    </NativeStackPage>
  );
}
