"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Grid, OrbitControls, TransformControls } from "@react-three/drei";
import type { Object3D } from "three";
import {
  createMapObject,
  type MapDocument,
  type MapObject,
  type MapObjectKind,
} from "./map-types";
import { ZOMBIE_HOUSE_DEFAULT } from "./zombie-house-default";
import "./map-editor.css";

const DRAFT_KEY = "boom.map-editor.draft.v1";

const KINDS: { kind: MapObjectKind; label: string }[] = [
  { kind: "floor", label: "Floor" },
  { kind: "wall", label: "Wall" },
  { kind: "door", label: "Door" },
  { kind: "table", label: "Table" },
  { kind: "chair", label: "Chair" },
  { kind: "bed", label: "Bed" },
  { kind: "stairs", label: "Stairs" },
  { kind: "spawn", label: "Player spawn" },
  { kind: "zombie-spawn", label: "Zombie spawn" },
];

function Scene({
  document,
  selectedId,
  mode,
  onSelect,
  onTransform,
}: {
  document: MapDocument;
  selectedId: string | null;
  mode: "translate" | "rotate" | "scale";
  onSelect: (id: string) => void;
  onTransform: (id: string, position: [number, number, number], rotation: [number, number, number], scale: [number, number, number]) => void;
}) {
  const objectRefs = useRef<Record<string, Object3D | null>>({});

  return (
    <>
      <color attach="background" args={["#20252b"]} />
      <ambientLight intensity={1.3} />
      <directionalLight position={[12, 18, 8]} intensity={2} castShadow />
      <Grid
        infiniteGrid
        cellSize={document.gridSize}
        sectionSize={5}
        cellThickness={0.45}
        sectionThickness={1}
        fadeDistance={70}
        position={[0, -0.28, 0]}
      />
      <axesHelper args={[3]} />
      {document.objects.filter((o) => o.visible).map((item) => (
        <group key={item.id}>
          <mesh
            ref={(node) => {
              objectRefs.current[item.id] = node;
            }}
            position={item.transform.position}
            rotation={item.transform.rotation}
            scale={item.transform.scale}
            castShadow
            receiveShadow
            onClick={(event) => {
              event.stopPropagation();
              onSelect(item.id);
            }}
          >
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial
              color={item.color}
              emissive={selectedId === item.id ? item.color : "#000000"}
              emissiveIntensity={selectedId === item.id ? 0.15 : 0}
              transparent={item.kind === "spawn" || item.kind === "zombie-spawn"}
              opacity={item.kind === "spawn" || item.kind === "zombie-spawn" ? 0.8 : 1}
            />
          </mesh>
          {selectedId === item.id && objectRefs.current[item.id] && (
            <TransformControls
              key={`${item.id}-${mode}`}
              object={objectRefs.current[item.id]!}
              mode={mode}
              onObjectChange={() => {
                const obj = objectRefs.current[item.id];
                if (!obj) return;
                onTransform(
                  item.id,
                  [obj.position.x, obj.position.y, obj.position.z],
                  [obj.rotation.x, obj.rotation.y, obj.rotation.z],
                  [obj.scale.x, obj.scale.y, obj.scale.z]
                );
              }}
            />
          )}
        </group>
      ))}
      <OrbitControls makeDefault />
    </>
  );
}

export default function MapEditor() {
  const [mapDocument, setMapDocument] = useState<MapDocument>(ZOMBIE_HOUSE_DEFAULT);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<"translate" | "rotate" | "scale">("translate");
  const [message, setMessage] = useState("Ready");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedObject = mapDocument.objects.find((o) => o.id === selectedId) ?? null;

  const updateObject = useCallback((id: string, update: Partial<MapObject>) => {
    setMapDocument((doc) => ({
      ...doc,
      objects: doc.objects.map((o) => (o.id === id ? { ...o, ...update } : o)),
    }));
  }, []);

  const updateTransform = useCallback((
    id: string,
    position: [number, number, number],
    rotation: [number, number, number],
    scale: [number, number, number]
  ) => {
    setMapDocument((doc) => ({
      ...doc,
      objects: doc.objects.map((o) =>
        o.id === id ? { ...o, transform: { position, rotation, scale } } : o
      ),
    }));
  }, []);

  const addObject = (kind: MapObjectKind) => {
    const item = createMapObject(kind, mapDocument.objects.length);
    setMapDocument((doc) => ({ ...doc, objects: [...doc.objects, item] }));
    setSelectedId(item.id);
    setMessage(`${item.name} added`);
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    setMapDocument((doc) => ({
      ...doc,
      objects: doc.objects.filter((o) => o.id !== selectedId),
    }));
    setSelectedId(null);
    setMessage("Object deleted");
  };

  const duplicateSelected = () => {
    if (!selectedObject) return;
    const copy: MapObject = {
      ...selectedObject,
      id: `${selectedObject.kind}-${Date.now()}`,
      name: `${selectedObject.name} Copy`,
      transform: {
        ...selectedObject.transform,
        position: [
          selectedObject.transform.position[0] + 1.5,
          selectedObject.transform.position[1],
          selectedObject.transform.position[2] + 1.5,
        ],
      },
    };
    setMapDocument((doc) => ({ ...doc, objects: [...doc.objects, copy] }));
    setSelectedId(copy.id);
    setMessage("Object duplicated");
  };

  const saveDraft = () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(mapDocument));
    setMessage("Draft saved in this browser");
  };

  const loadDraft = () => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) {
      setMessage("No saved draft found in this browser");
      return;
    }
    try {
      const parsed = JSON.parse(raw) as MapDocument;
      setMapDocument(parsed);
      setSelectedId(parsed.objects[0]?.id ?? null);
      setMessage("Draft loaded");
    } catch {
      setMessage("Could not parse saved draft");
    }
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(mapDocument, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${mapDocument.id || "boom-map"}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("Map JSON exported");
  };

  const importJson = async (file?: File) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as MapDocument;
      if (parsed.schemaVersion !== 1 || !Array.isArray(parsed.objects)) {
        throw new Error("Unsupported map document");
      }
      setMapDocument(parsed);
      setSelectedId(parsed.objects[0]?.id ?? null);
      setMessage("Map JSON imported");
    } catch {
      setMessage("Invalid map JSON");
    }
  };

  return (
    <main className="boom-map-editor">
      <header className="bme-header">
        <div>
          <div className="bme-eyebrow">BOOM / LEVEL DESIGN</div>
          <input
            className="bme-map-name"
            value={mapDocument.name}
            onChange={(e) => setMapDocument((doc) => ({ ...doc, name: e.target.value }))}
            aria-label="Map name"
          />
          <div className="bme-status">{message} · {mapDocument.objects.length} objects</div>
        </div>
        <div className="bme-actions">
          <button onClick={saveDraft}>Save Draft</button>
          <button onClick={loadDraft}>Load Draft</button>
          <button onClick={exportJson}>Export JSON</button>
          <button onClick={() => fileInputRef.current?.click()}>Import JSON</button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => importJson(e.target.files?.[0])}
          />
        </div>
      </header>

      <div className="bme-layout">
        <aside className="bme-panel bme-assets">
          <h2>Add object</h2>
          <div className="bme-asset-list">
            {KINDS.map(({ kind, label }) => (
              <button key={kind} className="bme-asset-button" onClick={() => addObject(kind)}>
                <span className={`bme-swatch bme-${kind}`} />
                {label}
                <span className="bme-plus">+</span>
              </button>
            ))}
          </div>
          <p className="bme-help">These are blockout shapes for layout testing. Replace them with Blender GLB assets in the next step.</p>
        </aside>

        <section className="bme-viewport">
          <div className="bme-toolbar">
            <button className={mode === "translate" ? "active" : ""} onClick={() => setMode("translate")}>Move</button>
            <button className={mode === "rotate" ? "active" : ""} onClick={() => setMode("rotate")}>Rotate</button>
            <button className={mode === "scale" ? "active" : ""} onClick={() => setMode("scale")}>Scale</button>
            <span className="bme-toolbar-spacer" />
            <button disabled={!selectedObject} onClick={duplicateSelected}>Duplicate</button>
            <button disabled={!selectedObject} className="danger" onClick={deleteSelected}>Delete</button>
          </div>
          <Canvas shadows camera={{ position: [23, 20, 24], fov: 45 }}>
            <Scene
              document={mapDocument}
              selectedId={selectedId}
              mode={mode}
              onSelect={setSelectedId}
              onTransform={updateTransform}
            />
          </Canvas>
          <div className="bme-viewport-hint">Click an object to select · Drag gizmo to edit · Right-drag to orbit · Scroll to zoom</div>
        </section>

        <aside className="bme-panel bme-inspector">
          <h2>Hierarchy</h2>
          <div className="bme-hierarchy">
            {mapDocument.objects.map((item) => (
              <button
                key={item.id}
                className={`bme-hierarchy-row ${selectedId === item.id ? "selected" : ""}`}
                onClick={() => setSelectedId(item.id)}
              >
                <span className={`bme-swatch bme-${item.kind}`} />
                <span className="bme-row-name">{item.name}</span>
                <span className="bme-kind">{item.kind}</span>
              </button>
            ))}
          </div>

          <h2>Properties</h2>
          {selectedObject ? (
            <div className="bme-properties">
              <label>
                Name
                <input
                  value={selectedObject.name}
                  onChange={(e) => updateObject(selectedObject.id, { name: e.target.value })}
                />
              </label>
              <label>
                Color
                <input
                  type="color"
                  value={selectedObject.color}
                  onChange={(e) => updateObject(selectedObject.id, { color: e.target.value })}
                />
              </label>
              <label className="bme-checkbox">
                <input
                  type="checkbox"
                  checked={selectedObject.collision}
                  onChange={(e) => updateObject(selectedObject.id, { collision: e.target.checked })}
                />
                Collision enabled
              </label>
              <label className="bme-checkbox">
                <input
                  type="checkbox"
                  checked={selectedObject.visible}
                  onChange={(e) => updateObject(selectedObject.id, { visible: e.target.checked })}
                />
                Visible
              </label>
              <div className="bme-vector-title">Position</div>
              <div className="bme-vector">
                {(["x", "y", "z"] as const).map((axis, i) => (
                  <label key={axis}>{axis.toUpperCase()}
                    <input
                      type="number"
                      step="0.1"
                      value={selectedObject.transform.position[i]}
                      onChange={(e) => {
                        const position = [...selectedObject.transform.position] as [number, number, number];
                        position[i] = Number(e.target.value);
                        updateObject(selectedObject.id, {
                          transform: { ...selectedObject.transform, position },
                        });
                      }}
                    />
                  </label>
                ))}
              </div>
              <div className="bme-vector-title">Rotation (radians)</div>
              <div className="bme-vector">
                {(["x", "y", "z"] as const).map((axis, i) => (
                  <label key={axis}>{axis.toUpperCase()}
                    <input
                      type="number"
                      step="0.1"
                      value={selectedObject.transform.rotation[i]}
                      onChange={(e) => {
                        const rotation = [...selectedObject.transform.rotation] as [number, number, number];
                        rotation[i] = Number(e.target.value);
                        updateObject(selectedObject.id, {
                          transform: { ...selectedObject.transform, rotation },
                        });
                      }}
                    />
                  </label>
                ))}
              </div>
              <div className="bme-vector-title">Scale</div>
              <div className="bme-vector">
                {(["x", "y", "z"] as const).map((axis, i) => (
                  <label key={axis}>{axis.toUpperCase()}
                    <input
                      type="number"
                      min="0.05"
                      step="0.1"
                      value={selectedObject.transform.scale[i]}
                      onChange={(e) => {
                        const scale = [...selectedObject.transform.scale] as [number, number, number];
                        scale[i] = Math.max(0.05, Number(e.target.value));
                        updateObject(selectedObject.id, {
                          transform: { ...selectedObject.transform, scale },
                        });
                      }}
                    />
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <p className="bme-help">Select an object in the viewport or hierarchy.</p>
          )}
        </aside>
      </div>
    </main>
  );
}
