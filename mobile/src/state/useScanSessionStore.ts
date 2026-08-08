import { create } from "zustand";

import { CategoryKey } from "@/types/models";
import { IdentifyResponse } from "@/services/aiIdentification";

export interface ScanCapture {
  side: "front" | "back";
  uri: string;
}

export type ScanIntent = "collection" | "wishlist";

interface ScanSessionState {
  categoryHint: CategoryKey | null;
  captures: ScanCapture[];
  identification: IdentifyResponse | null;
  scannedBarcode: string | null;
  intent: ScanIntent;
  setCategoryHint: (key: CategoryKey | null) => void;
  addCapture: (capture: ScanCapture) => void;
  retake: (side: "front" | "back") => void;
  setIdentification: (result: IdentifyResponse | null) => void;
  setScannedBarcode: (code: string | null) => void;
  setIntent: (intent: ScanIntent) => void;
  reset: () => void;
}

export const useScanSessionStore = create<ScanSessionState>((set) => ({
  categoryHint: null,
  captures: [],
  identification: null,
  scannedBarcode: null,
  intent: "collection",
  setCategoryHint: (key) => set({ categoryHint: key }),
  addCapture: (capture) =>
    set((state) => ({
      captures: [...state.captures.filter((c) => c.side !== capture.side), capture],
    })),
  retake: (side) => set((state) => ({ captures: state.captures.filter((c) => c.side !== side) })),
  setIdentification: (result) => set({ identification: result }),
  setScannedBarcode: (code) => set({ scannedBarcode: code }),
  setIntent: (intent) => set({ intent }),
  reset: () => set({ categoryHint: null, captures: [], identification: null, scannedBarcode: null, intent: "collection" }),
}));
