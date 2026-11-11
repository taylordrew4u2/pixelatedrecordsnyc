"use client";

import { useEffect, useState } from "react";
import { fromZonedTime, formatInTimeZone } from "date-fns-tz";
import {
  Plus,
  ExternalLink,
  CalendarDays,
  Search,
  ArrowRight,
  Check,
  Archive,
} from "lucide-react";
import type {
  SiteContent,
  Page,
  Section,
  Event,
  MenuCategory,
  Hours,
} from "@/lib/types";
import {
  ColorField,
  Empty,
  Field,
  ImageField,
  ItemActions,
  move,
  NumberField,
  Panel,
  Select,
  slugify,
  TextArea,
  Toggle,
  uid,
} from "./Controls";

export type Update = (mutate: (draft: SiteContent) => void) => void;
type EditorProps = { content: SiteContent; update: Update };
const corePages = [
  "home",
  "inside",
  "booth",
  "events",
  "calendar",
  "bar",
  "record-shop",
  "about",
  "records",
  "location",
];
const blankSection = (): Section => ({
  id: uid("section"),
  type: "text",
  title: "New section",
  body: "",
  image: "",
  images: [],
  linkLabel: "",
  href: "",
  visible: true,
});
const pageUrl = (id: string) => (id === "home" ? "/" : `/${id}`);

function removePageLinks(draft: SiteContent, id: string) {
  const href = pageUrl(id);
  draft.navigation = draft.navigation.filter((n) => n.href !== href);
  draft.footer.links = draft.footer.links.filter((l) => l.url !== href);
  for (const scene of Object.values({
    exterior: draft.scenes.exterior,
    interior: draft.scenes.interior,
  }))
    scene.hotspots = scene.hotspots.filter((h) => h.href !== href);
  draft.pages.forEach((page) =>
    page.sections.forEach((section) => {
      if (section.href === href) {
        section.href = "";
        section.linkLabel = "";
      }
    }),
  );
}
function renamePage(draft: SiteContent, oldId: string, newId: string) {
  const oldHref = pageUrl(oldId),
    newHref = pageUrl(newId);
  const page = draft.pages.find((p) => p.id === oldId);
  if (page) page.id = newId;
  draft.navigation.forEach((n) => {
    if (n.href === oldHref) n.href = newHref;
  });
  draft.footer.links.forEach((l) => {
    if (l.url === oldHref) l.url = newHref;
  });
  [draft.scenes.exterior, draft.scenes.interior].forEach((scene) =>
    scene.hotspots.forEach((h) => {
      if (h.href === oldHref) h.href = newHref;
    }),
  );
  draft.pages.forEach((p) =>
    p.sections.forEach((s) => {
      if (s.href === oldHref) s.href = newHref;
    }),
  );
}

export function PagesEditor({
  content,
  update,
  onlyPage,
}: {
  content: SiteContent;
  update: Update;
  onlyPage?: string;
}) {
  const [selected, setSelected] = useState(onlyPage || "home");
  const page =
    content.pages.find((p) => p.id === (onlyPage || selected)) ||
    content.pages[0];
  const sceneKey =
    page?.id === "home"
      ? "exterior"
      : page?.id === "inside"
        ? "interior"
        : null;
  const patch = (values: Partial<Page>) =>
    update((d) => {
      const target = d.pages.find((p) => p.id === page.id);
      if (target) Object.assign(target, values);
    });
  const patchSection = (id: string, values: Partial<Section>) =>
    update((d) => {
      const target = d.pages
        .find((p) => p.id === page.id)
        ?.sections.find((s) => s.id === id);
      if (target) Object.assign(target, values);
    });
  if (!page)
    return (
      <Empty
        title="Add your first page"
        description="Pages hold the words and images visitors see."
        action={
          <button
            type="button"
            className="ad-button"
            onClick={() => {
              const id = uid("page");
              update((d) =>
                d.pages.push({
                  id,
                  title: "New page",
                  eyebrow: "",
                  description: "",
                  image: "",
                  imageAlt: "",
                  visible: true,
                  seoTitle: "",
                  seoDescription: "",
                  shareImage: "",
                  sections: [],
                }),
              );
              setSelected(id);
            }}
          >
            Add page
          </button>
        }
      />
    );
  return (
    <>
      {!onlyPage && (
        <Panel
          title="Your pages"
          description="Choose a page to edit. Hidden pages can be restored at any time."
          actions={
            <button
              type="button"
              className="ad-button"
              onClick={() => {
                const id = uid("page");
                update((d) =>
                  d.pages.push({
                    id,
                    title: "New page",
                    eyebrow: "",
                    description: "",
                    image: "",
                    imageAlt: "",
                    visible: true,
                    seoTitle: "",
                    seoDescription: "",
                    shareImage: "",
                    sections: [],
                  }),
                );
                setSelected(id);
              }}
            >
              <Plus size={16} />
              Add page
            </button>
          }
        >
          <div className="ad-page-grid">
            {content.pages.map((p) => (
              <button
                type="button"
                key={p.id}
                className={`ad-page-choice ${p.id === page.id ? "selected" : ""}`}
                onClick={() => setSelected(p.id)}
              >
                <strong>{p.title || p.id}</strong>
                <span>
                  {pageUrl(p.id)}
                  {!p.visible ? " · Hidden" : ""}
                </span>
                <ArrowRight size={16} />
              </button>
            ))}
          </div>
        </Panel>
      )}
      <Panel
        title={`${page.title || page.id} page`}
        description="These changes are saved as a draft until you publish."
        actions={
          <ItemActions
            name={page.title || "page"}
            onDuplicate={() => {
              const id = uid("page");
              const copy = {
                ...structuredClone(page),
                id,
                title: `${page.title} copy`,
                visible: false,
                sections: page.sections.map((s) => ({
                  ...structuredClone(s),
                  id: uid("section"),
                })),
              };
              update((d) => d.pages.push(copy));
              setSelected(id);
            }}
            onDelete={
              corePages.includes(page.id)
                ? undefined
                : () => {
                    if (
                      confirm(
                        `Permanently remove “${page.title}” and its navigation links? Published history can restore it later.`,
                      )
                    ) {
                      update((d) => {
                        removePageLinks(d, page.id);
                        d.pages = d.pages.filter((p) => p.id !== page.id);
                      });
                      setSelected("home");
                    }
                  }
            }
          />
        }
      >
        <Toggle
          label="Show this page"
          disabled={page.id === "home"}
          checked={page.id === "home" ? true : page.visible}
          onChange={(v) =>
            update((d) => {
              const p = d.pages.find((p) => p.id === page.id);
              if (p) p.visible = v;
              d.navigation.forEach((n) => {
                if (n.href === pageUrl(page.id)) n.visible = v;
              });
            })
          }
          help={
            page.id === "home"
              ? "The homepage stays visible so the website always has an entrance."
              : "Turning this off archives the page and hides its menu link."
          }
        />
        <div className="ad-two-col">
          <Field
            label="Page heading"
            value={page.title}
            onChange={(v) => patch({ title: v })}
          />
          <Field
            label="Small heading above the title"
            value={page.eyebrow}
            onChange={(v) => patch({ eyebrow: v })}
          />
        </div>
        <TextArea
          label="Introduction"
          value={page.description}
          onChange={(v) => patch({ description: v })}
        />
        {!corePages.includes(page.id) && (
          <Field
            label="Page address"
            value={page.id}
            onChange={(v) => {
              const next = slugify(v);
              if (
                next &&
                !content.pages.some((p) => p.id === next && p.id !== page.id) &&
                ![
                  "admin",
                  "api",
                  "_next",
                  "_not-found",
                  "assets",
                  "favicon",
                  "favicon.ico",
                  "robots",
                  "robots.txt",
                  "sitemap",
                  "sitemap.xml",
                ].includes(next.toLowerCase())
              ) {
                update((d) => renamePage(d, page.id, next));
                setSelected(next);
              }
            }}
            help="Use a short name such as private-events. Existing links are updated with the address."
          />
        )}
        <div className="ad-two-col">
          <ImageField
            label="Page photograph"
            value={sceneKey ? content.scenes[sceneKey].image : page.image}
            onChange={(v) =>
              update((d) => {
                const p = d.pages.find((p) => p.id === page.id);
                if (p) p.image = v;
                if (sceneKey) d.scenes[sceneKey].image = v;
              })
            }
            help={
              sceneKey
                ? "This is the same photo used in Photos & Scene. Adjust its clickable areas there."
                : undefined
            }
          />
          <div>
            <Field
              label="Photograph description"
              value={sceneKey ? content.scenes[sceneKey].alt : page.imageAlt}
              onChange={(v) =>
                update((d) => {
                  const p = d.pages.find((p) => p.id === page.id);
                  if (p) p.imageAlt = v;
                  if (sceneKey) d.scenes[sceneKey].alt = v;
                })
              }
            />
            <p className="ad-help">
              Describe what is visible. This helps people using a screen reader.
            </p>
          </div>
        </div>
        <details className="ad-disclosure">
          <summary>Search results & social sharing</summary>
          <Field
            label="Page title in search results"
            value={page.seoTitle}
            onChange={(v) => patch({ seoTitle: v })}
          />
          <TextArea
            label="Page description in search results"
            value={page.seoDescription}
            onChange={(v) => patch({ seoDescription: v })}
            rows={3}
          />
          <ImageField
            label="Sharing image"
            value={page.shareImage}
            onChange={(v) => patch({ shareImage: v })}
          />
        </details>
      </Panel>
      <Panel
        title="Page sections"
        description="Add text, photographs, galleries, or a button callout. Use the arrows to change their order."
        actions={
          <button
            type="button"
            className="ad-button"
            onClick={() =>
              patch({ sections: [...page.sections, blankSection()] })
            }
          >
            <Plus size={16} />
            Add section
          </button>
        }
      >
        {!page.sections.length && (
          <Empty
            title="Room for your story"
            description="Add a section to give this page more detail."
          />
        )}
        <div className="ad-stacked">
          {page.sections.map((section, index) => (
            <details
              key={section.id}
              className={`ad-editor-card ${!section.visible ? "ad-muted-card" : ""}`}
              open={undefined}
            >
              <summary>
                <span>
                  <span className="ad-order">{index + 1}</span>
                  {section.title || "Untitled section"}{" "}
                  {!section.visible && <span className="ad-pill">Hidden</span>}
                </span>
                <span className="ad-kind">{section.type}</span>
              </summary>
              <div className="ad-card-body">
                <div className="ad-subheading">
                  <h3>Section settings</h3>
                  <ItemActions
                    name={section.title || "section"}
                    onUp={
                      index > 0
                        ? () =>
                            patch({
                              sections: move(page.sections, index, index - 1),
                            })
                        : undefined
                    }
                    onDown={
                      index < page.sections.length - 1
                        ? () =>
                            patch({
                              sections: move(page.sections, index, index + 1),
                            })
                        : undefined
                    }
                    onDuplicate={() => {
                      const next = [...page.sections];
                      next.splice(index + 1, 0, {
                        ...structuredClone(section),
                        id: uid("section"),
                        title: `${section.title} copy`,
                      });
                      patch({ sections: next });
                    }}
                    onToggle={() =>
                      patchSection(section.id, { visible: !section.visible })
                    }
                    visible={section.visible}
                    onDelete={() => {
                      if (
                        confirm(
                          "Permanently remove this section from the draft?",
                        )
                      )
                        patch({
                          sections: page.sections.filter(
                            (s) => s.id !== section.id,
                          ),
                        });
                    }}
                  />
                </div>
                <div className="ad-two-col">
                  <Select
                    label="Section style"
                    value={section.type}
                    onChange={(v) =>
                      patchSection(section.id, { type: v as Section["type"] })
                    }
                    options={[
                      { value: "text", label: "Text / story" },
                      { value: "image", label: "Photograph & text" },
                      { value: "gallery", label: "Photo gallery" },
                      { value: "callout", label: "Callout & button" },
                    ]}
                  />
                  <Field
                    label="Heading"
                    value={section.title}
                    onChange={(v) => patchSection(section.id, { title: v })}
                  />
                </div>
                <TextArea
                  label="Section text"
                  value={section.body}
                  onChange={(v) => patchSection(section.id, { body: v })}
                />
                {section.type !== "gallery" && (
                  <ImageField
                    label="Section image"
                    value={section.image}
                    onChange={(v) => patchSection(section.id, { image: v })}
                  />
                )}
                {section.type === "gallery" && (
                  <>
                    <div className="ad-three-col">
                      {section.images.map((image, i) => (
                        <div key={`${section.id}-${i}`}>
                          <ImageField
                            label={`Gallery image ${i + 1}`}
                            value={image}
                            onChange={(v) => {
                              const next = [...section.images];
                              next[i] = v;
                              patchSection(section.id, { images: next });
                            }}
                          />
                          <ItemActions
                            name={`gallery image ${i + 1}`}
                            onUp={
                              i > 0
                                ? () =>
                                    patchSection(section.id, {
                                      images: move(section.images, i, i - 1),
                                    })
                                : undefined
                            }
                            onDown={
                              i < section.images.length - 1
                                ? () =>
                                    patchSection(section.id, {
                                      images: move(section.images, i, i + 1),
                                    })
                                : undefined
                            }
                            onDelete={() =>
                              patchSection(section.id, {
                                images: section.images.filter(
                                  (_, n) => n !== i,
                                ),
                              })
                            }
                          />
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="ad-button"
                      onClick={() =>
                        patchSection(section.id, {
                          images: [...section.images, ""],
                        })
                      }
                    >
                      <Plus size={16} />
                      Add gallery image
                    </button>
                  </>
                )}
                <div className="ad-two-col">
                  <Field
                    label="Button label (optional)"
                    value={section.linkLabel}
                    onChange={(v) => patchSection(section.id, { linkLabel: v })}
                  />
                  <Field
                    label="Button destination"
                    value={section.href}
                    onChange={(v) => patchSection(section.id, { href: v })}
                    placeholder="/events or https://…"
                  />
                </div>
              </div>
            </details>
          ))}
        </div>
      </Panel>
      {!onlyPage && (
        <Panel
          title="Main menu"
          description="The hamburger menu appears throughout the website."
          actions={
            <button
              type="button"
              className="ad-button"
              onClick={() =>
                update((d) =>
                  d.navigation.push({
                    id: uid("nav"),
                    label: "New link",
                    href: "/events",
                    visible: true,
                  }),
                )
              }
            >
              <Plus size={16} />
              Add menu link
            </button>
          }
        >
          <div className="ad-stacked">
            {content.navigation.map((item, index) => (
              <div key={item.id} className="ad-inline-editor">
                <div className="ad-two-col">
                  <Field
                    label="Menu label"
                    value={item.label}
                    onChange={(v) =>
                      update((d) => {
                        d.navigation[index].label = v;
                      })
                    }
                  />
                  <Field
                    label="Page or URL"
                    value={item.href}
                    onChange={(v) =>
                      update((d) => {
                        d.navigation[index].href = v;
                      })
                    }
                  />
                </div>
                <div className="ad-subheading">
                  <Toggle
                    label="Visible"
                    checked={item.visible}
                    onChange={(v) =>
                      update((d) => {
                        d.navigation[index].visible = v;
                      })
                    }
                  />
                  <ItemActions
                    name={item.label}
                    onUp={
                      index > 0
                        ? () =>
                            update((d) => {
                              d.navigation = move(
                                d.navigation,
                                index,
                                index - 1,
                              );
                            })
                        : undefined
                    }
                    onDown={
                      index < content.navigation.length - 1
                        ? () =>
                            update((d) => {
                              d.navigation = move(
                                d.navigation,
                                index,
                                index + 1,
                              );
                            })
                        : undefined
                    }
                    onDelete={() => {
                      if (
                        confirm(
                          "Remove this menu link? The page will remain available.",
                        )
                      )
                        update((d) => {
                          d.navigation.splice(index, 1);
                        });
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </>
  );
}

function dateLocal(value: string, tz: string) {
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return value;
  try {
    return value ? formatInTimeZone(value, tz, "yyyy-MM-dd'T'HH:mm") : "";
  } catch {
    return "";
  }
}
function DateTimeField({
  label,
  value,
  onChange,
  tz,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  tz: string;
}) {
  const [input, setInput] = useState(dateLocal(value, tz));
  const [error, setError] = useState("");
  useEffect(() => {
    setInput(dateLocal(value, tz));
  }, [value, tz]);
  return (
    <>
      <Field
        label={label}
        type="datetime-local"
        value={input}
        onChange={(v) => {
          setInput(v);
          if (!v) {
            setError("");
            onChange("");
            return;
          }
          try {
            const date = fromZonedTime(v, tz);
            if (
              !Number.isFinite(date.getTime()) ||
              formatInTimeZone(date, tz, "yyyy-MM-dd'T'HH:mm") !== v
            ) {
              setError(
                "Choose a valid local time. This time may be skipped when the clocks change.",
              );
              onChange(v);
              return;
            }
            setError("");
            onChange(date.toISOString());
          } catch {
            setError("Choose a valid date and time.");
            onChange(v);
          }
        }}
      />
      {error && <p className="ad-field-error">{error}</p>}
    </>
  );
}
export function EventsEditor({ content, update }: EditorProps) {
  const [selected, setSelected] = useState<string | null>(null),
    [search, setSearch] = useState(""),
    [filter, setFilter] = useState("all");
  const event = content.events.find((e) => e.id === selected);
  const tz = content.eventSettings.timeZone || "America/New_York";
  const patch = (values: Partial<Event>) =>
    update((d) => {
      const target = d.events.find((e) => e.id === selected);
      if (target) Object.assign(target, values);
    });
  function addEvent() {
    const id = uid("event");
    const item: Event = {
      id,
      title: "",
      slug: id,
      description: "",
      image: "",
      imageAlt: "",
      start: "",
      end: "",
      doors: "",
      url: "",
      price: "",
      status: "scheduled",
      published: false,
      featured: false,
    };
    update((d) => d.events.push(item));
    setSelected(id);
  }
  const items = content.events
    .filter(
      (e) =>
        (filter === "all" ||
          (filter === "live" ? e.published : !e.published)) &&
        e.title.toLowerCase().includes(search.toLowerCase()),
    )
    .sort(
      (a, b) =>
        Date.parse(a.start || "2100-01-01") -
        Date.parse(b.start || "2100-01-01"),
    );
  return (
    <>
      <Panel
        title="Events"
        description="One event editor powers tonight, upcoming cards, and the Calendar."
        actions={
          <button
            type="button"
            className="ad-button ad-button-red"
            onClick={addEvent}
          >
            <Plus size={16} />
            Add event
          </button>
        }
      >
        <div className="ad-two-col">
          <Field
            label="Find an event"
            value={search}
            onChange={setSearch}
            placeholder="Search by event name"
          />
          <Select
            label="Show"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: "All events" },
              { value: "live", label: "Marked for publication" },
              { value: "draft", label: "Drafts / archived" },
            ]}
          />
        </div>
        {!items.length ? (
          <Empty
            title={
              content.events.length
                ? "No matching events"
                : "Your next good night starts here"
            }
            description={
              content.events.length
                ? "Try a different search or filter."
                : "Add the first confirmed event. It stays a draft until you are ready."
            }
            action={
              !content.events.length ? (
                <button type="button" className="ad-button" onClick={addEvent}>
                  Add your first event
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="ad-event-list">
            {items.map((item) => (
              <button
                type="button"
                key={item.id}
                className={`ad-event-list-item ${selected === item.id ? "selected" : ""}`}
                onClick={() => setSelected(item.id)}
              >
                {item.image ? (
                  <img src={item.image} alt="" />
                ) : (
                  <span className="ad-event-thumb">
                    <CalendarDays size={22} />
                  </span>
                )}
                <span>
                  <strong>{item.title || "Untitled event"}</strong>
                  <small>
                    {item.start
                      ? (() => {
                          try {
                            return formatInTimeZone(
                              item.start,
                              tz,
                              "EEE, MMM d · h:mm a",
                            );
                          } catch {
                            return "Set a date";
                          }
                        })()
                      : "Set a date and time"}
                  </small>
                </span>
                <span
                  className={`ad-pill ${item.published ? "ad-pill-live" : ""}`}
                >
                  {!item.published
                    ? "Draft"
                    : item.status === "cancelled"
                      ? "Cancelled"
                      : item.status === "sold-out"
                        ? "Sold out"
                        : "Ready to publish"}
                </span>
                <ArrowRight size={16} />
              </button>
            ))}
          </div>
        )}
      </Panel>
      {event && (
        <Panel
          title={event.title || "New event"}
          description={`Dates and times are entered in ${tz}.`}
          actions={
            <ItemActions
              name={event.title || "event"}
              onDuplicate={() => {
                const copy = {
                  ...structuredClone(event),
                  id: uid("event"),
                  slug: uid("event"),
                  title: `${event.title || "Event"} copy`,
                  published: false,
                };
                update((d) => d.events.push(copy));
                setSelected(copy.id);
              }}
              onDelete={() => {
                if (
                  confirm(
                    "Permanently remove this event? To keep it for later, turn off “Include when publishing” instead.",
                  )
                ) {
                  update((d) => {
                    d.events = d.events.filter((e) => e.id !== event.id);
                  });
                  setSelected(null);
                }
              }}
            />
          }
        >
          <Toggle
            label="Include when publishing"
            checked={event.published}
            onChange={(v) => patch({ published: v })}
            help="Off keeps this event in your private drafts or archive. The top Publish button makes your saved changes public."
          />
          <Field
            label="Event title"
            value={event.title}
            onChange={(v) => {
              const values: Partial<Event> = { title: v };
              if (
                !event.title ||
                event.slug === slugify(event.title) ||
                event.slug.startsWith("event-")
              )
                values.slug = slugify(v) || event.id;
              patch(values);
            }}
            required
          />
          <div className="ad-two-col">
            <Select
              label="Event status"
              value={event.status}
              onChange={(v) => patch({ status: v as Event["status"] })}
              options={[
                { value: "scheduled", label: "Scheduled" },
                { value: "sold-out", label: "Sold out" },
                { value: "cancelled", label: "Cancelled" },
              ]}
            />
            <Field
              label="Price or admission text"
              value={event.price}
              onChange={(v) => patch({ price: v })}
              placeholder="Free, $10, or ticket information"
            />
          </div>
          <div className="ad-three-col">
            <DateTimeField
              label="Starts"
              value={event.start}
              tz={tz}
              onChange={(v) => patch({ start: v })}
            />
            <DateTimeField
              label="Ends"
              value={event.end}
              tz={tz}
              onChange={(v) => patch({ end: v })}
            />
            <DateTimeField
              label="Doors open (optional)"
              value={event.doors}
              tz={tz}
              onChange={(v) => patch({ doors: v })}
            />
          </div>
          {event.start &&
            event.end &&
            Date.parse(event.end) <= Date.parse(event.start) && (
              <p className="ad-field-error">
                The end must be after the start. For a late night, choose the
                next date.
              </p>
            )}
          {event.doors &&
            event.start &&
            Date.parse(event.doors) > Date.parse(event.start) && (
              <p className="ad-field-error">
                Doors should open at or before the event starts.
              </p>
            )}
          <TextArea
            label="Event description"
            value={event.description}
            onChange={(v) => patch({ description: v })}
          />
          <div className="ad-two-col">
            <ImageField
              label="Event flyer / photograph"
              value={event.image}
              onChange={(v) => patch({ image: v })}
            />
            <div>
              <Field
                label="Describe the flyer or photograph"
                value={event.imageAlt}
                onChange={(v) => patch({ imageAlt: v })}
              />
              <Field
                label="Tickets or more information URL"
                value={event.url}
                onChange={(v) => patch({ url: v })}
                placeholder="https://…"
              />
              <Toggle
                label="Feature this event"
                checked={event.featured}
                onChange={(v) => patch({ featured: v })}
              />
            </div>
          </div>
          <details className="ad-disclosure">
            <summary>Event page address</summary>
            <Field
              label="Event URL name"
              value={event.slug}
              onChange={(v) => patch({ slug: slugify(v) })}
              help="Use a unique, short name. Changing it changes this event’s shareable address."
            />
          </details>
          <div className="ad-inline-preview">
            <span className="ad-eyebrow">CARD PREVIEW</span>
            <div>
              {event.image && (
                <img src={event.image} alt={event.imageAlt || event.title} />
              )}
              <span>
                <h3>{event.title || "Your event title"}</h3>
                <p>
                  {event.start
                    ? (() => {
                        try {
                          return formatInTimeZone(
                            event.start,
                            tz,
                            "EEEE, MMMM d · h:mm a",
                          );
                        } catch {
                          return "Choose a date";
                        }
                      })()
                    : "Your date and time"}
                </p>
                <p>{event.price}</p>
                {event.status !== "scheduled" && (
                  <span className="ad-pill">
                    {event.status === "sold-out" ? "Sold out" : "Cancelled"}
                  </span>
                )}
              </span>
            </div>
          </div>
        </Panel>
      )}
      <Panel
        title="Tonight & calendar settings"
        description="Late-night events stay visible until they finish, even after midnight."
      >
        <div className="ad-two-col">
          <Field
            label="Venue time zone"
            value={content.eventSettings.timeZone}
            onChange={(v) =>
              update((d) => {
                d.eventSettings.timeZone = v;
              })
            }
            help="Pixelated Records uses America/New_York."
          />
          <Select
            label="The next venue day begins at"
            value={content.eventSettings.nightCutoff}
            onChange={(v) =>
              update((d) => {
                d.eventSettings.nightCutoff = Number(v);
              })
            }
            options={Array.from({ length: 13 }, (_, hour) => ({
              value: hour,
              label: `${String(hour).padStart(2, "0")}:00`,
            }))}
            help="Before this time, after-midnight events belong to the previous evening."
          />
        </div>
        <TextArea
          label="Message when nothing is on tonight"
          value={content.eventSettings.tonightEmpty}
          onChange={(v) =>
            update((d) => {
              d.eventSettings.tonightEmpty = v;
            })
          }
          rows={2}
        />
        <TextArea
          label="Message when nothing is coming up"
          value={content.eventSettings.upcomingEmpty}
          onChange={(v) =>
            update((d) => {
              d.eventSettings.upcomingEmpty = v;
            })
          }
          rows={2}
        />
      </Panel>
    </>
  );
}

export function BarEditor({ content, update }: EditorProps) {
  const [active, setActive] = useState("");
  const category =
    content.bar.categories.find((c) => c.id === active) ||
    content.bar.categories[0];
  const patch = (values: Partial<MenuCategory>) =>
    update((d) => {
      const target = d.bar.categories.find((c) => c.id === category?.id);
      if (target) Object.assign(target, values);
    });
  return (
    <>
      <Panel
        title="Bar menu"
        description="Update your real menu here. Changes appear when you publish."
      >
        <TextArea
          label="Menu introduction"
          value={content.bar.intro}
          onChange={(v) =>
            update((d) => {
              d.bar.intro = v;
            })
          }
          rows={3}
        />
        <Field
          label="Menu note"
          value={content.bar.menuNotice}
          onChange={(v) =>
            update((d) => {
              d.bar.menuNotice = v;
            })
          }
          help="Optional: a short note about availability or prices."
        />
      </Panel>
      <Panel
        title="Menu categories"
        actions={
          <button
            type="button"
            className="ad-button"
            onClick={() => {
              const id = uid("category");
              update((d) =>
                d.bar.categories.push({
                  id,
                  title: "New category",
                  description: "",
                  visible: true,
                  items: [],
                }),
              );
              setActive(id);
            }}
          >
            <Plus size={16} />
            Add category
          </button>
        }
      >
        <div className="ad-selection-list ad-horizontal-list">
          {content.bar.categories.map((c, i) => (
            <div
              className={`ad-category-choice ${category?.id === c.id ? "selected" : ""}`}
              key={c.id}
            >
              <button type="button" onClick={() => setActive(c.id)}>
                {c.title}
                {!c.visible ? " · Hidden" : ""}
              </button>
              <ItemActions
                name={c.title}
                onUp={
                  i > 0
                    ? () =>
                        update((d) => {
                          d.bar.categories = move(d.bar.categories, i, i - 1);
                        })
                    : undefined
                }
                onDown={
                  i < content.bar.categories.length - 1
                    ? () =>
                        update((d) => {
                          d.bar.categories = move(d.bar.categories, i, i + 1);
                        })
                    : undefined
                }
              />
            </div>
          ))}
        </div>
        {!category && (
          <Empty
            title="Build your drinks menu"
            description="Start with a category, then add its items and prices."
          />
        )}
      </Panel>
      {category && (
        <Panel
          title={category.title}
          actions={
            <ItemActions
              name={category.title}
              visible={category.visible}
              onToggle={() => patch({ visible: !category.visible })}
              onDelete={() => {
                if (
                  confirm(`Delete “${category.title}” and all of its items?`)
                ) {
                  update((d) => {
                    d.bar.categories = d.bar.categories.filter(
                      (c) => c.id !== category.id,
                    );
                  });
                  setActive("");
                }
              }}
            />
          }
        >
          <div className="ad-two-col">
            <Field
              label="Category name"
              value={category.title}
              onChange={(v) => patch({ title: v })}
            />
            <Field
              label="Category description"
              value={category.description}
              onChange={(v) => patch({ description: v })}
            />
          </div>
          <Toggle
            label="Show this category"
            checked={category.visible}
            onChange={(v) => patch({ visible: v })}
          />
          <div className="ad-stacked">
            {category.items.map((item, i) => (
              <details key={item.id} className="ad-editor-card">
                <summary>
                  <span>
                    {item.name || "New item"}{" "}
                    {!item.available && (
                      <span className="ad-pill">Unavailable</span>
                    )}
                  </span>
                  <strong>{item.price}</strong>
                </summary>
                <div className="ad-card-body">
                  <div className="ad-subheading">
                    <h3>Menu item</h3>
                    <ItemActions
                      name={item.name || "item"}
                      onUp={
                        i > 0
                          ? () =>
                              patch({ items: move(category.items, i, i - 1) })
                          : undefined
                      }
                      onDown={
                        i < category.items.length - 1
                          ? () =>
                              patch({ items: move(category.items, i, i + 1) })
                          : undefined
                      }
                      onDuplicate={() => {
                        const items = [...category.items];
                        items.splice(i + 1, 0, {
                          ...structuredClone(item),
                          id: uid("item"),
                          name: `${item.name} copy`,
                        });
                        patch({ items });
                      }}
                      onDelete={() => {
                        if (confirm("Remove this menu item?"))
                          patch({
                            items: category.items.filter(
                              (m) => m.id !== item.id,
                            ),
                          });
                      }}
                    />
                  </div>
                  <div className="ad-two-col">
                    <Field
                      label="Item name"
                      value={item.name}
                      onChange={(v) =>
                        patch({
                          items: category.items.map((m, n) =>
                            n === i ? { ...m, name: v } : m,
                          ),
                        })
                      }
                    />
                    <Field
                      label="Price"
                      value={item.price}
                      onChange={(v) =>
                        patch({
                          items: category.items.map((m, n) =>
                            n === i ? { ...m, price: v } : m,
                          ),
                        })
                      }
                      placeholder="$12"
                    />
                  </div>
                  <TextArea
                    label="Description"
                    value={item.description}
                    onChange={(v) =>
                      patch({
                        items: category.items.map((m, n) =>
                          n === i ? { ...m, description: v } : m,
                        ),
                      })
                    }
                    rows={2}
                  />
                  <Toggle
                    label="Available"
                    checked={item.available}
                    onChange={(v) =>
                      patch({
                        items: category.items.map((m, n) =>
                          n === i ? { ...m, available: v } : m,
                        ),
                      })
                    }
                  />
                  <ImageField
                    label="Item photograph (optional)"
                    value={item.image}
                    onChange={(v) =>
                      patch({
                        items: category.items.map((m, n) =>
                          n === i ? { ...m, image: v } : m,
                        ),
                      })
                    }
                  />
                </div>
              </details>
            ))}
          </div>
          <button
            type="button"
            className="ad-button ad-add-button"
            onClick={() =>
              patch({
                items: [
                  ...category.items,
                  {
                    id: uid("item"),
                    name: "New item",
                    description: "",
                    price: "",
                    available: true,
                    image: "",
                  },
                ],
              })
            }
          >
            <Plus size={16} />
            Add menu item
          </button>
        </Panel>
      )}
    </>
  );
}

function LinkEditor({
  title,
  items,
  onChange,
}: {
  title: string;
  items: { id: string; label: string; url: string }[];
  onChange: (items: { id: string; label: string; url: string }[]) => void;
}) {
  return (
    <Panel
      title={title}
      actions={
        <button
          type="button"
          className="ad-button"
          onClick={() =>
            onChange([
              ...items,
              { id: uid("link"), label: "New link", url: "" },
            ])
          }
        >
          <Plus size={16} />
          Add link
        </button>
      }
    >
      <div className="ad-stacked">
        {items.map((item, i) => (
          <div key={item.id} className="ad-inline-editor">
            <div className="ad-two-col">
              <Field
                label="Label"
                value={item.label}
                onChange={(v) =>
                  onChange(
                    items.map((l, n) => (n === i ? { ...l, label: v } : l)),
                  )
                }
              />
              <Field
                label="Destination"
                value={item.url}
                onChange={(v) =>
                  onChange(
                    items.map((l, n) => (n === i ? { ...l, url: v } : l)),
                  )
                }
                placeholder="https://…"
              />
            </div>
            <ItemActions
              name={item.label}
              onUp={i > 0 ? () => onChange(move(items, i, i - 1)) : undefined}
              onDown={
                i < items.length - 1
                  ? () => onChange(move(items, i, i + 1))
                  : undefined
              }
              onDelete={() => {
                if (confirm("Remove this link from the draft?"))
                  onChange(items.filter((l) => l.id !== item.id));
              }}
            />
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function LocationEditor({ content, update }: EditorProps) {
  const location = content.location;
  const patch = (values: Partial<SiteContent["location"]>) =>
    update((d) => Object.assign(d.location, values));
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const setDay = (day: number, values: Partial<Hours>) =>
    update((d) => {
      const row = d.location.hours.find((h) => h.day === day);
      if (row) Object.assign(row, values);
      else
        d.location.hours.push({
          day,
          closed: true,
          open: "",
          close: "",
          note: "",
          ...values,
        });
    });
  return (
    <>
      <Panel
        title="Location & directions"
        description="Confirm the address and pin before publishing. Every directions button uses these settings."
      >
        <Field
          label="Venue address"
          value={location.address}
          onChange={(v) => patch({ address: v })}
        />
        <Field
          label="Neighborhood / location line"
          value={location.neighborhood}
          onChange={(v) => patch({ neighborhood: v })}
        />
        <Field
          label="Map search destination"
          value={location.mapQuery}
          onChange={(v) => patch({ mapQuery: v })}
          help="Optional map-search override. Leave blank to use the confirmed address (or the verified coordinates if set)."
        />
        <Field
          label="Get directions link"
          value={location.directionsUrl}
          onChange={(v) => patch({ directionsUrl: v })}
          help="Optional override: a custom directions URL takes priority over the pin coordinates and address. Leave blank to build directions from the verified location."
        />
        {location.directionsUrl &&
          /^https:\/\//.test(location.directionsUrl) && (
            <a
              className="ad-button"
              href={location.directionsUrl}
              target="_blank"
              rel="noreferrer"
            >
              Check directions <ExternalLink size={15} />
            </a>
          )}
        <details className="ad-disclosure">
          <summary>Map embed & exact pin</summary>
          <Field
            label="Free map embed URL"
            value={location.mapEmbedUrl}
            onChange={(v) => patch({ mapEmbedUrl: v })}
            help="Optional override: this URL takes priority over the coordinates and address for the displayed map. Paste a free embed URL, not an iframe or HTML."
          />
          <div className="ad-two-col">
            <NumberField
              label="Latitude"
              value={location.latitude}
              min={-90}
              max={90}
              onChange={(v) => patch({ latitude: v })}
            />
            <NumberField
              label="Longitude"
              value={location.longitude}
              min={-180}
              max={180}
              onChange={(v) => patch({ longitude: v })}
            />
          </div>
          <p className="ad-help">
            Only change coordinates using a verified map location. The displayed
            address and map pin should identify the same entrance.
          </p>
        </details>
      </Panel>
      <Panel
        title="Weekly opening hours"
        description="An end time earlier than the opening time means the venue closes after midnight."
      >
        <Toggle
          label="These opening hours are confirmed"
          checked={location.hoursConfirmed}
          onChange={(v) => patch({ hoursConfirmed: v })}
          help="Keep this off until the venue has confirmed the schedule."
        />
        <div className="ad-hours">
          {days.map((label, day) => {
            const h = location.hours.find((h) => h.day === day) || {
              day,
              closed: true,
              open: "",
              close: "",
              note: "",
            };
            return (
              <div className="ad-hour-row" key={day}>
                <strong>{label}</strong>
                <Toggle
                  label="Open"
                  checked={!h.closed}
                  onChange={(v) => setDay(day, { closed: !v })}
                />
                <Field
                  label={`${label} opens`}
                  type="time"
                  disabled={h.closed}
                  value={h.open}
                  onChange={(v) => setDay(day, { open: v })}
                />
                <Field
                  label={`${label} closes`}
                  type="time"
                  disabled={h.closed}
                  value={h.close}
                  onChange={(v) => setDay(day, { close: v })}
                />
                <Field
                  label={`${label} note`}
                  value={h.note}
                  onChange={(v) => setDay(day, { note: v })}
                />
              </div>
            );
          })}
        </div>
        <TextArea
          label="Opening-hours note"
          value={location.hoursNote}
          onChange={(v) => patch({ hoursNote: v })}
          rows={2}
        />
      </Panel>
      <Panel
        title="Special dates & closures"
        description="Special dates override the usual weekly hours."
        actions={
          <button
            type="button"
            className="ad-button"
            onClick={() =>
              patch({
                specialHours: [
                  ...location.specialHours,
                  {
                    id: uid("hours"),
                    date: "",
                    closed: true,
                    open: "",
                    close: "",
                    note: "",
                  },
                ],
              })
            }
          >
            <Plus size={16} />
            Add date
          </button>
        }
      >
        <div className="ad-stacked">
          {location.specialHours.map((h, i) => (
            <div key={h.id} className="ad-inline-editor">
              <div className="ad-subheading">
                <h3>{h.date || "New special date"}</h3>
                <ItemActions
                  name="special hours"
                  onDelete={() =>
                    patch({
                      specialHours: location.specialHours.filter(
                        (s) => s.id !== h.id,
                      ),
                    })
                  }
                />
              </div>
              <div className="ad-three-col">
                <Field
                  label="Date"
                  type="date"
                  value={h.date}
                  onChange={(v) =>
                    patch({
                      specialHours: location.specialHours.map((s, n) =>
                        n === i ? { ...s, date: v } : s,
                      ),
                    })
                  }
                />
                <Field
                  label="Opens"
                  type="time"
                  disabled={h.closed}
                  value={h.open}
                  onChange={(v) =>
                    patch({
                      specialHours: location.specialHours.map((s, n) =>
                        n === i ? { ...s, open: v } : s,
                      ),
                    })
                  }
                />
                <Field
                  label="Closes"
                  type="time"
                  disabled={h.closed}
                  value={h.close}
                  onChange={(v) =>
                    patch({
                      specialHours: location.specialHours.map((s, n) =>
                        n === i ? { ...s, close: v } : s,
                      ),
                    })
                  }
                />
              </div>
              <Toggle
                label="Closed on this date"
                checked={h.closed}
                onChange={(v) =>
                  patch({
                    specialHours: location.specialHours.map((s, n) =>
                      n === i ? { ...s, closed: v } : s,
                    ),
                  })
                }
              />
              <Field
                label="Note"
                value={h.note}
                onChange={(v) =>
                  patch({
                    specialHours: location.specialHours.map((s, n) =>
                      n === i ? { ...s, note: v } : s,
                    ),
                  })
                }
              />
            </div>
          ))}
        </div>
        {!location.specialHours.length && (
          <p className="ad-help">
            No special dates added. Your usual hours will apply.
          </p>
        )}
      </Panel>
      <Panel title="Contact information">
        <div className="ad-two-col">
          <Field
            label="Public email address"
            type="email"
            value={location.email}
            onChange={(v) => patch({ email: v })}
          />
          <Field
            label="Phone"
            type="tel"
            value={location.phone}
            onChange={(v) => patch({ phone: v })}
          />
        </div>
        <Field
          label="Instagram URL"
          value={location.instagram}
          onChange={(v) => patch({ instagram: v })}
        />
      </Panel>
      <LinkEditor
        title="Other social links"
        items={location.socials}
        onChange={(v) => patch({ socials: v })}
      />
    </>
  );
}

export function AppearanceEditor({ content, update }: EditorProps) {
  const brand = content.brand;
  const patch = (values: Partial<SiteContent["brand"]>) =>
    update((d) => Object.assign(d.brand, values));
  return (
    <>
      <Panel
        title="Brand & identity"
        description="Keep the Pixelated Records artwork intact. Use the supplied contrasting logo on each surface."
      >
        <Field
          label="Venue name"
          value={brand.name}
          onChange={(v) => patch({ name: v })}
        />
        <div className="ad-two-col">
          <Field
            label="Tagline"
            value={brand.tagline}
            onChange={(v) => patch({ tagline: v })}
          />
          <Field
            label="Business description"
            value={brand.descriptor}
            onChange={(v) => patch({ descriptor: v })}
          />
        </div>
        <div className="ad-two-col">
          <ImageField
            label="White logo for dark backgrounds"
            value={brand.logoLight}
            onChange={(v) => patch({ logoLight: v })}
          />
          <ImageField
            label="Black logo for light backgrounds"
            value={brand.logoDark}
            onChange={(v) => patch({ logoDark: v })}
          />
          <ImageField
            label="Compact brand mark"
            value={brand.mark}
            onChange={(v) => patch({ mark: v })}
          />
          <ImageField
            label="Browser icon source"
            value={brand.favicon}
            onChange={(v) => patch({ favicon: v })}
          />
        </div>
      </Panel>
      <Panel
        title="Colors & type"
        description="Changes are previewed on the site before you publish."
      >
        <div className="ad-three-col">
          <ColorField
            label="Accent color"
            value={brand.accent}
            onChange={(v) => patch({ accent: v })}
          />
          <ColorField
            label="Background color"
            value={brand.background}
            onChange={(v) => patch({ background: v })}
          />
          <ColorField
            label="Text color"
            value={brand.foreground}
            onChange={(v) => patch({ foreground: v })}
          />
        </div>
        <div className="ad-two-col">
          <Select
            label="Body typeface"
            value={brand.font}
            onChange={(v) => patch({ font: v as "sans" | "serif" })}
            options={[
              { value: "sans", label: "Clean sans serif — system font" },
              { value: "serif", label: "Editorial serif — system font" },
            ]}
          />
          <Select
            label="Button shape"
            value={brand.buttonStyle}
            onChange={(v) =>
              patch({ buttonStyle: v as SiteContent["brand"]["buttonStyle"] })
            }
            options={[
              { value: "square", label: "Square" },
              { value: "rounded", label: "Soft corners" },
              { value: "pill", label: "Pill" },
            ]}
          />
        </div>
        <div
          className="ad-theme-preview"
          style={{
            background: brand.background,
            color: brand.foreground,
            fontFamily:
              brand.font === "serif" ? "Georgia, serif" : "Arial, sans-serif",
          }}
        >
          <span className="ad-eyebrow">APPEARANCE PREVIEW</span>
          <h3>Good records. Better nights.</h3>
          <p>Keep the words easy to read, day or night.</p>
          <span
            style={{
              background: brand.accent,
              borderRadius:
                brand.buttonStyle === "pill"
                  ? 99
                  : brand.buttonStyle === "rounded"
                    ? 8
                    : 0,
            }}
          >
            Your button style
          </span>
        </div>
      </Panel>
    </>
  );
}

const labelNames: Record<keyof SiteContent["labels"], string> = {
  menu: "Main menu",
  enter: "Front door button",
  book: "Booking button",
  backToRoom: "Back to the room",
  viewCalendar: "View Calendar",
  upcoming: "Upcoming section heading",
  tonight: "Tonight section heading",
  directions: "Directions button",
  recordComingSoon: "Records coming-soon label",
  pauseMotion: "Pause animation",
  resumeMotion: "Resume animation",
};
export function SettingsEditor({ content, update }: EditorProps) {
  return (
    <>
      <Panel
        title="Venue booking"
        description="All booking buttons use this one destination."
      >
        <Field
          label="Booking button label"
          value={content.labels.book}
          onChange={(v) =>
            update((d) => {
              d.labels.book = v;
            })
          }
        />
        <Field
          label="Shared booking-form URL"
          value={content.booking.url}
          onChange={(v) =>
            update((d) => {
              d.booking.url = v;
            })
          }
        />
        <TextArea
          label="Booking introduction"
          value={content.booking.description}
          onChange={(v) =>
            update((d) => {
              d.booking.description = v;
            })
          }
          rows={3}
        />
        {/^https:\/\//.test(content.booking.url) && (
          <a
            href={content.booking.url}
            target="_blank"
            rel="noreferrer"
            className="ad-button"
          >
            Open booking form <ExternalLink size={15} />
          </a>
        )}
      </Panel>
      <Panel
        title="Buttons & interface wording"
        description="These shared labels update wherever the same action appears."
      >
        <div className="ad-two-col">
          {(Object.keys(labelNames) as (keyof SiteContent["labels"])[]).map(
            (key) => (
              <Field
                key={key}
                label={labelNames[key]}
                value={content.labels[key]}
                onChange={(v) =>
                  update((d) => {
                    d.labels[key] = v;
                    if (key === "enter") {
                      const door =
                        d.scenes.exterior.hotspots.find(
                          (h) => h.id === "front-door",
                        ) ||
                        d.scenes.exterior.hotspots.find(
                          (h) => h.href === "/inside",
                        );
                      if (door) door.label = v;
                    }
                  })
                }
              />
            ),
          )}
        </div>
      </Panel>
      <Panel title="Footer">
        <Field
          label="Footer tagline"
          value={content.footer.tagline}
          onChange={(v) =>
            update((d) => {
              d.footer.tagline = v;
            })
          }
        />
        <TextArea
          label="Footer note"
          value={content.footer.note}
          onChange={(v) =>
            update((d) => {
              d.footer.note = v;
            })
          }
          rows={2}
        />
      </Panel>
      <LinkEditor
        title="Footer links"
        items={content.footer.links}
        onChange={(v) =>
          update((d) => {
            d.footer.links = v;
          })
        }
      />
      <Panel
        title="Admin access"
        description="Your password is verified privately by the server."
      >
        <p className="ad-help">
          To change the admin password, update the private admin password
          configuration on the hosting account and restart or redeploy the site.
          Keep it out of public source code. Sign out on shared devices.
        </p>
        <p className="ad-help">
          Content history is available from the top bar. Restoring a version
          returns it to a draft so you can review it before publishing.
        </p>
      </Panel>
    </>
  );
}
