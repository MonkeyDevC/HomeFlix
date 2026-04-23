"use client";

import "sileo/styles.css";
import { Toaster } from "sileo";

export function SileoHost() {
  return (
    <Toaster
      offset={{ bottom: "max(1rem, env(safe-area-inset-bottom, 0px))" }}
      options={{ duration: 6000, roundness: 12 }}
      position="bottom-center"
      theme="dark"
    />
  );
}
