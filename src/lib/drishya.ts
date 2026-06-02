import { DRISHYA_APP_URL } from "@/types";

export function openDrishya() {
  window.open(DRISHYA_APP_URL, "_blank", "noopener,noreferrer");
}
