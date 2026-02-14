"use client";

import dynamic from "next/dynamic";

const LiveDemo = dynamic(() => import("@/components/LiveDemo"), { ssr: false });

export default function LiveDemoWrapper() {
  return <LiveDemo />;
}
