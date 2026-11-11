"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Monitor, Plus, Smartphone } from "lucide-react";
import type { SiteContent, Hotspot, WindowMask } from "@/lib/types";
import {
  Field,
  ImageField,
  ItemActions,
  Panel,
  Range,
  Select,
  Toggle,
  ColorField,
  uid,
} from "./Controls";

type Update = (mutate: (draft: SiteContent) => void) => void;
type Rect = Hotspot | WindowMask;
const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

export default function SceneEditor({
  content,
  update,
}: {
  content: SiteContent;
  update: Update;
}) {
  const [sceneKey, setSceneKey] = useState<"exterior" | "interior">("exterior");
  const [mobile, setMobile] = useState(false);
  const [selected, setSelected] = useState<{
    kind: "hotspot" | "window";
    id: string;
  } | null>(null);
  const [natural, setNatural] = useState({ w: 4, h: 3 });
  const [size, setSize] = useState({ w: 600, h: 450 });
  const stage = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    kind: "hotspot" | "window";
    id: string;
    mode: "move" | "resize";
    x: number;
    y: number;
    base: Rect;
    renderW: number;
    renderH: number;
  } | null>(null);
  const scene = content.scenes[sceneKey];
  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      const box = entries[0].contentRect;
      setSize({ w: box.width, h: box.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const scale = mobile
    ? Math.max(size.w / natural.w, size.h / natural.h)
    : size.w / natural.w;
  const renderW = natural.w * scale,
    renderH = natural.h * scale;
  const offsetX =
    ((size.w - renderW) * (mobile ? scene.mobileFocalX : scene.focalX)) / 100;
  const offsetY =
    ((size.h - renderH) * (mobile ? scene.mobileFocalY : scene.focalY)) / 100;
  const selectedRect =
    selected?.kind === "window"
      ? content.scenes.windows.find((w) => w.id === selected.id)
      : scene.hotspots.find((h) => h.id === selected?.id);
  const setRect = (
    kind: "hotspot" | "window",
    id: string,
    patch: Partial<Hotspot>,
  ) =>
    update((d) => {
      const list: Rect[] =
        kind === "window" ? d.scenes.windows : d.scenes[sceneKey].hotspots;
      const rect = list.find((r) => r.id === id);
      if (rect) {
        Object.assign(rect, patch);
        if (
          kind === "hotspot" &&
          sceneKey === "exterior" &&
          typeof patch.label === "string" &&
          (rect.id === "front-door" || (rect as Hotspot).href === "/inside")
        )
          d.labels.enter = patch.label;
      }
    });
  function pointerDown(
    event: ReactPointerEvent<HTMLElement>,
    rect: Rect,
    kind: "hotspot" | "window",
    mode: "move" | "resize",
  ) {
    event.preventDefault();
    event.stopPropagation();
    setSelected({ kind, id: rect.id });
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      kind,
      id: rect.id,
      mode,
      x: event.clientX,
      y: event.clientY,
      base: { ...rect },
      renderW,
      renderH,
    };
  }
  function pointerMove(event: ReactPointerEvent) {
    const current = drag.current;
    if (!current) return;
    const dx = ((event.clientX - current.x) / current.renderW) * 100,
      dy = ((event.clientY - current.y) / current.renderH) * 100;
    const base = current.base;
    if (current.mode === "move")
      setRect(current.kind, current.id, {
        x: clamp(base.x + dx, 0, 100 - base.width),
        y: clamp(base.y + dy, 0, 100 - base.height),
      });
    else
      setRect(current.kind, current.id, {
        width: clamp(base.width + dx, 2, 100 - base.x),
        height: clamp(base.height + dy, 2, 100 - base.y),
      });
  }
  const drawRect = (rect: Rect, kind: "hotspot" | "window", index: number) => {
    const active = selected?.kind === kind && selected.id === rect.id;
    return (
      <div
        key={`${kind}-${rect.id}`}
        role="button"
        tabIndex={0}
        aria-label={`${kind === "window" ? "Window light" : (rect as Hotspot).label}, drag to move, arrow keys to adjust`}
        className={`ad-scene-rect ${kind} ${active ? "selected" : ""}`}
        style={{
          left: offsetX + (rect.x / 100) * renderW,
          top: offsetY + (rect.y / 100) * renderH,
          width: (rect.width / 100) * renderW,
          height: (rect.height / 100) * renderH,
        }}
        onPointerDown={(e) => pointerDown(e, rect, kind, "move")}
        onClick={() => setSelected({ kind, id: rect.id })}
        onKeyDown={(e) => {
          const keys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
          if (!keys.includes(e.key)) return;
          e.preventDefault();
          setSelected({ kind, id: rect.id });
          const step = e.shiftKey ? 5 : 1;
          setRect(kind, rect.id, {
            x: clamp(
              rect.x +
                (e.key === "ArrowLeft"
                  ? -step
                  : e.key === "ArrowRight"
                    ? step
                    : 0),
              0,
              100 - rect.width,
            ),
            y: clamp(
              rect.y +
                (e.key === "ArrowUp"
                  ? -step
                  : e.key === "ArrowDown"
                    ? step
                    : 0),
              0,
              100 - rect.height,
            ),
          });
        }}
      >
        <span>
          {kind === "window"
            ? `Window ${index + 1}`
            : (rect as Hotspot).label || "New hotspot"}
        </span>
        {active && (
          <span
            className="ad-resize-handle"
            aria-label="Resize area"
            onPointerDown={(e) => pointerDown(e, rect, kind, "resize")}
          />
        )}
      </div>
    );
  };
  return (
    <>
      <Panel
        title="Photographs & interactive scene"
        description="Keep the real room. Position links over visible destinations, and use a directional link for areas outside the photograph."
      >
        <div className="ad-segmented">
          <button
            type="button"
            className={sceneKey === "exterior" ? "active" : ""}
            onClick={() => {
              setSceneKey("exterior");
              setSelected(null);
            }}
          >
            Storefront
          </button>
          <button
            type="button"
            className={sceneKey === "interior" ? "active" : ""}
            onClick={() => {
              setSceneKey("interior");
              setSelected(null);
            }}
          >
            Inside the venue
          </button>
        </div>
        <div className="ad-two-col">
          <ImageField
            label={`${sceneKey === "exterior" ? "Storefront" : "Interior"} photograph`}
            value={scene.image}
            onChange={(v) =>
              update((d) => {
                d.scenes[sceneKey].image = v;
                const page = d.pages.find(
                  (p) => p.id === (sceneKey === "exterior" ? "home" : "inside"),
                );
                if (page) page.image = v;
              })
            }
          />
          <div>
            <Field
              label="Describe this photograph"
              value={scene.alt}
              onChange={(v) =>
                update((d) => {
                  d.scenes[sceneKey].alt = v;
                  const page = d.pages.find(
                    (p) =>
                      p.id === (sceneKey === "exterior" ? "home" : "inside"),
                  );
                  if (page) page.imageAlt = v;
                })
              }
              help="Used by visitors who cannot see the image."
            />
            <p className="ad-help">
              Drag a highlighted area to move it. Select it, then drag the
              corner to resize. Arrow keys move the selected area; Shift moves
              it faster.
            </p>
            <div className="ad-scene-switch">
              <button
                type="button"
                className={`ad-button ${!mobile ? "ad-button-dark" : ""}`}
                onClick={() => setMobile(false)}
              >
                <Monitor size={16} />
                Desktop
              </button>
              <button
                type="button"
                className={`ad-button ${mobile ? "ad-button-dark" : ""}`}
                onClick={() => setMobile(true)}
              >
                <Smartphone size={16} />
                Phone crop
              </button>
            </div>
          </div>
        </div>
        <div className="ad-scene-workspace">
          <div
            ref={stage}
            className={`ad-scene-stage ${mobile ? "is-mobile" : ""}`}
            style={{
              aspectRatio: mobile ? "3 / 4" : `${natural.w} / ${natural.h}`,
            }}
            onPointerMove={pointerMove}
            onPointerUp={() => {
              drag.current = null;
            }}
            onPointerCancel={() => {
              drag.current = null;
            }}
          >
            {scene.image && (
              <img
                src={scene.image}
                alt={scene.alt || "Scene preview"}
                draggable={false}
                onLoad={(e) =>
                  setNatural({
                    w: e.currentTarget.naturalWidth,
                    h: e.currentTarget.naturalHeight,
                  })
                }
                style={{
                  objectFit: mobile ? "cover" : "contain",
                  objectPosition: `${mobile ? scene.mobileFocalX : scene.focalX}% ${mobile ? scene.mobileFocalY : scene.focalY}%`,
                }}
              />
            )}
            {sceneKey === "exterior" &&
              content.scenes.windows.map((w, i) => drawRect(w, "window", i))}
            {scene.hotspots.map((h, i) => drawRect(h, "hotspot", i))}
          </div>
        </div>
        <p className="ad-help">
          Coordinates are saved against the full photograph. A phone preview
          shows how a tighter crop affects those areas. Keep the sign, door, and
          windows visible on the live storefront.
        </p>
        <div className="ad-two-col">
          <div>
            <h3>Desktop focal point</h3>
            <Range
              label="Horizontal"
              value={scene.focalX}
              onChange={(v) =>
                update((d) => {
                  d.scenes[sceneKey].focalX = v;
                })
              }
            />
            <Range
              label="Vertical"
              value={scene.focalY}
              onChange={(v) =>
                update((d) => {
                  d.scenes[sceneKey].focalY = v;
                })
              }
            />
          </div>
          <div>
            <h3>Phone focal point</h3>
            <Range
              label="Horizontal on phones"
              value={scene.mobileFocalX}
              onChange={(v) =>
                update((d) => {
                  d.scenes[sceneKey].mobileFocalX = v;
                })
              }
            />
            <Range
              label="Vertical on phones"
              value={scene.mobileFocalY}
              onChange={(v) =>
                update((d) => {
                  d.scenes[sceneKey].mobileFocalY = v;
                })
              }
            />
          </div>
        </div>
      </Panel>
      <div className="ad-two-col ad-align-start">
        <Panel
          title="Clickable areas"
          actions={
            <button
              type="button"
              className="ad-button"
              onClick={() => {
                const id = uid("hotspot");
                update((d) =>
                  d.scenes[sceneKey].hotspots.push({
                    id,
                    label: "New link",
                    href: "/events",
                    x: 35,
                    y: 45,
                    width: 22,
                    height: 12,
                  }),
                );
                setSelected({ kind: "hotspot", id });
              }}
            >
              <Plus size={16} />
              Add link
            </button>
          }
        >
          <div className="ad-selection-list">
            {scene.hotspots.map((h) => (
              <button
                key={h.id}
                type="button"
                className={selected?.id === h.id ? "selected" : ""}
                onClick={() => setSelected({ kind: "hotspot", id: h.id })}
              >
                <span>{h.label || "Untitled link"}</span>
                <small>{h.href}</small>
              </button>
            ))}
          </div>
          {sceneKey === "exterior" && (
            <>
              <div className="ad-subheading">
                <h3>Window lighting masks</h3>
                <button
                  type="button"
                  className="ad-button"
                  onClick={() => {
                    const id = uid("window");
                    update((d) =>
                      d.scenes.windows.push({
                        id,
                        x: 10,
                        y: 40,
                        width: 20,
                        height: 20,
                      }),
                    );
                    setSelected({ kind: "window", id });
                  }}
                >
                  <Plus size={16} />
                  Add mask
                </button>
              </div>
              <div className="ad-selection-list">
                {content.scenes.windows.map((w, i) => (
                  <button
                    key={w.id}
                    type="button"
                    className={selected?.id === w.id ? "selected" : ""}
                    onClick={() => setSelected({ kind: "window", id: w.id })}
                  >
                    Window {i + 1}
                  </button>
                ))}
              </div>
            </>
          )}
        </Panel>
        <Panel
          title={
            selectedRect
              ? selected?.kind === "window"
                ? "Window area"
                : "Link settings"
              : "Select an area"
          }
        >
          {selectedRect && selected ? (
            <>
              <div className="ad-subheading">
                <span className="ad-pill">
                  {selected.kind === "window"
                    ? "Window light"
                    : "Clickable link"}
                </span>
                <ItemActions
                  name="selected area"
                  onDelete={() => {
                    if (
                      confirm(
                        "Remove this area? You can undo unsaved changes from the top bar.",
                      )
                    ) {
                      update((d) => {
                        if (selected.kind === "window")
                          d.scenes.windows = d.scenes.windows.filter(
                            (r) => r.id !== selected.id,
                          );
                        else
                          d.scenes[sceneKey].hotspots = d.scenes[
                            sceneKey
                          ].hotspots.filter((r) => r.id !== selected.id);
                      });
                      setSelected(null);
                    }
                  }}
                />
              </div>
              {selected.kind === "hotspot" && (
                <>
                  <Field
                    label="Button label"
                    value={(selectedRect as Hotspot).label}
                    onChange={(v) =>
                      setRect("hotspot", selected.id, { label: v })
                    }
                  />
                  <Field
                    label="Destination"
                    value={(selectedRect as Hotspot).href}
                    onChange={(v) =>
                      setRect("hotspot", selected.id, { href: v })
                    }
                    help="For example: /bar or /booth"
                  />
                  <Select
                    label="Directional arrow"
                    value={(selectedRect as Hotspot).direction || ""}
                    onChange={(v) =>
                      setRect("hotspot", selected.id, {
                        direction: (v || undefined) as Hotspot["direction"],
                      })
                    }
                    options={[
                      { value: "", label: "No arrow" },
                      { value: "left", label: "Left" },
                      { value: "forward", label: "Ahead" },
                      { value: "right", label: "Right" },
                    ]}
                  />
                </>
              )}
              <Range
                label="Left position"
                value={selectedRect.x}
                max={100 - selectedRect.width}
                onChange={(v) => setRect(selected.kind, selected.id, { x: v })}
              />
              <Range
                label="Top position"
                value={selectedRect.y}
                max={100 - selectedRect.height}
                onChange={(v) => setRect(selected.kind, selected.id, { y: v })}
              />
              <Range
                label="Width"
                value={selectedRect.width}
                min={2}
                max={100 - selectedRect.x}
                onChange={(v) =>
                  setRect(selected.kind, selected.id, { width: v })
                }
              />
              <Range
                label="Height"
                value={selectedRect.height}
                min={2}
                max={100 - selectedRect.y}
                onChange={(v) =>
                  setRect(selected.kind, selected.id, { height: v })
                }
              />
            </>
          ) : (
            <p className="ad-help">
              Select a link or window in the photograph, or choose it from the
              list.
            </p>
          )}
        </Panel>
      </div>
      <Panel
        title="Day, night & window lights"
        description="The scene follows New York time. These are decorative effects; event information always comes from your calendar."
      >
        <Toggle
          label="Animate the window lights"
          checked={content.scenes.lights.enabled}
          onChange={(v) =>
            update((d) => {
              d.scenes.lights.enabled = v;
            })
          }
        />
        <Range
          label="Light intensity"
          value={content.scenes.lights.intensity}
          min={0}
          max={1}
          step={0.05}
          suffix=""
          onChange={(v) =>
            update((d) => {
              d.scenes.lights.intensity = v;
            })
          }
        />
        <div className="ad-three-col">
          {(["dayStart", "duskStart", "nightStart"] as const).map((key, i) => (
            <Select
              key={key}
              label={["Day starts", "Dusk starts", "Night starts"][i]}
              value={content.scenes.lights[key]}
              onChange={(v) =>
                update((d) => {
                  d.scenes.lights[key] = Number(v);
                })
              }
              options={Array.from({ length: 24 }, (_, hour) => ({
                value: hour,
                label: `${String(hour).padStart(2, "0")}:00`,
              }))}
            />
          ))}
        </div>
        <div className="ad-three-col">
          {content.scenes.lights.colors.map((color, i) => (
            <div key={i}>
              <ColorField
                label={`Light color ${i + 1}`}
                value={color}
                onChange={(v) =>
                  update((d) => {
                    d.scenes.lights.colors[i] = v;
                  })
                }
              />
              {content.scenes.lights.colors.length > 1 && (
                <button
                  type="button"
                  className="ad-text-button"
                  onClick={() =>
                    update((d) => {
                      d.scenes.lights.colors.splice(i, 1);
                    })
                  }
                >
                  Remove color
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          className="ad-button"
          disabled={content.scenes.lights.colors.length >= 8}
          onClick={() =>
            update((d) => {
              d.scenes.lights.colors.push("#d32f2f");
            })
          }
        >
          <Plus size={16} />
          Add light color
        </button>
      </Panel>
    </>
  );
}
