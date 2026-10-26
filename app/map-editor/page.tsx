"use client";

import dynamic from "next/dynamic";

const MapEditor = dynamic(
  () => import("@/components/game/maps/editor/MapEditor"),
  { ssr: false, loading: () => <main style={{ padding: 24 }}>Loading Map Editor...</main> }
);

export default function MapEditorPage() {
  return <MapEditor />;
}
