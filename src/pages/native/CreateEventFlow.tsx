/**
 * CreateEventFlow — native wrapper for CreateEvent.
 *
 * For now reuses the existing CreateEvent page wrapped in native chrome
 * (safe-area + header). A future iteration can redesign this as a
 * multi-step stepper with vaul pickers.
 */
import CreateEvent from "@/pages/CreateEvent";
import { NativeStackPage } from "@/components/native/NativeStackPage";

export default function CreateEventFlow() {
  return (
    <NativeStackPage title="Neues Event" showBack fullscreen={false}>
      <CreateEvent />
    </NativeStackPage>
  );
}
