"use client";

import { useEffect, useRef } from "react";
import { ArrowLeft, ArrowRight, Check, PartyPopper, X } from "lucide-react";

/** Studio tabs the tour can open. */
export type GuideTab =
  | "dashboard"
  | "pages"
  | "photos"
  | "events"
  | "bar"
  | "about"
  | "records"
  | "location"
  | "appearance"
  | "settings";

type Step = {
  tab: GuideTab;
  place: string;
  title: string;
  intro: string;
  how: string[];
  joke: string;
};

/** The whole Studio, one stop at a time. Each stop opens its own tab. */
export const GUIDE_STEPS: Step[] = [
  {
    tab: "dashboard",
    place: "Dashboard",
    title: "Welcome to your Studio",
    intro:
      "This is home base. It shows what's on tonight, what's coming up, and shortcuts to the things you'll change most.",
    how: [
      "Use the menu on the left to jump to any part of the website.",
      "On a phone, tap the menu button at the top to open that same list.",
      "Nothing you do here goes public until you press Publish. Poke around freely.",
    ],
    joke: "Think of it as the DJ booth for your website. Fewer cables, same amount of power.",
  },
  {
    tab: "dashboard",
    place: "Top bar",
    title: "Save draft, Preview, Publish",
    intro:
      "Three buttons at the top run the whole show. Learn these and you know 90% of the Studio.",
    how: [
      "Save draft keeps your changes private. Visitors see nothing yet.",
      "Preview opens the website with your draft so you can check it first.",
      "Publish makes it live for everyone. It asks you to confirm.",
      "The arrow button undoes your last change. The clock button opens Version history, where you can bring back any earlier version.",
    ],
    joke: "Draft is the soundcheck. Publish is the show. Nobody has to hear the soundcheck.",
  },
  {
    tab: "photos",
    place: "Top photo",
    title: "The storefront photo",
    intro:
      "This is the big photo people see first: the front of the shop. Change it here.",
    how: [
      "Press Change image to upload a new photo or pick one from your image library.",
      "Write a short description of the photo. Screen readers and Google use it.",
      "Wide photos work best on computers. Tall ones work best on phones.",
    ],
    joke: "First impressions matter. This photo is your website's handshake, so no blurry thumbs.",
  },
  {
    tab: "pages",
    place: "Page sections",
    title: "Every section of the page",
    intro:
      "Your website is one long page: Records, Bar, Events, Calendar, Book an Event, About and Contact. Each one is listed here.",
    how: [
      "Open a section to change its title, its sentence of text and its photo.",
      "Turn off Show this section to hide one. It also disappears from the menu.",
      "Keep the text short. One or two sentences reads best over a photo.",
    ],
    joke: "Short and punchy wins. If it wouldn't fit on a flyer, it's a novel.",
  },
  {
    tab: "events",
    place: "Events",
    title: "Add and edit events",
    intro:
      "Every event you add here shows up in the Calendar on the website, soonest first, with its flyer.",
    how: [
      "Press Add event, then fill in the title and when it starts and ends.",
      "Upload the flyer. It shows uncropped, so the whole design is visible.",
      "Include when publishing decides if visitors see it. Turn it off to keep an event private while you work on it.",
      "Event status marks it Scheduled, Sold out or Cancelled.",
      "Past events drop off the Calendar on their own. You don't need to delete them.",
    ],
    joke: "An event with no flyer is like a DJ with no headphones. Technically possible. Deeply suspicious.",
  },
  {
    tab: "bar",
    place: "Bar menu",
    title: "Drinks and happy hour",
    intro:
      "This controls the Bar section and the full drinks menu that opens from it.",
    how: [
      "Happy hour: set the hours and the specials, like $5 margaritas.",
      "Menu categories: add groups such as Cocktails or Beer, then add drinks with a price and ingredients.",
      "Turn off Available when you run out of something, instead of deleting it.",
      "Use the up and down arrows to reorder drinks and categories.",
    ],
    joke: "Update the prices here before the regulars notice. They always notice.",
  },
  {
    tab: "records",
    place: "Records",
    title: "The record shop section",
    intro:
      "The words and photo for the Records section, where people learn you sell vinyl.",
    how: [
      "Change the title, the sentence under it and the photo.",
      "The Visit the shop button on the website sends people to your address.",
    ],
    joke: "Yes, people still buy records. Yes, they will tell you about the warmth of the sound.",
  },
  {
    tab: "about",
    place: "About",
    title: "Your story",
    intro: "A few sentences about what Pixelated Records is and who it's for.",
    how: [
      "Write it the way you'd say it to someone at the bar.",
      "Change the photo to one that shows the room at its best.",
    ],
    joke: "No need for 'synergy' or 'curated experiences'. Vinyl, drinks, good nights. Done.",
  },
  {
    tab: "location",
    place: "Contact & hours",
    title: "Address, hours and links",
    intro:
      "Where you are, when you're open and how to reach you. This fills the Contact section and the map.",
    how: [
      "Check the address. Get directions on the website uses it.",
      "Weekly opening hours: set each day, then turn on These opening hours are confirmed so they show on the site.",
      "Special dates & closures: add holidays or private events so nobody shows up to a locked door.",
      "Add your Instagram, email or phone. Each one becomes a button or link.",
    ],
    joke: "Real hours beat 'check Instagram'. Nobody wants to do homework to get a margarita.",
  },
  {
    tab: "appearance",
    place: "Appearance",
    title: "Colors, fonts and sizes",
    intro:
      "Make it look like you. Everything here changes the whole website at once.",
    how: [
      "Brand & identity: your name and logos.",
      "Colors: the accent for buttons, plus text and background colors.",
      "Fonts & buttons: separate fonts for headings, text and buttons, and square or rounded corners.",
      "Sizes: sliders for text boxes, text, buttons, flyers and the logo.",
      "Went too far? Reset look to Pixelated Records defaults puts it all back.",
    ],
    joke: "With great power comes great responsibility. Please don't make everything hot pink. Or do. It's your bar.",
  },
  {
    tab: "settings",
    place: "Settings",
    title: "Booking link and button words",
    intro: "The practical bits that don't fit anywhere else.",
    how: [
      "Venue booking: the link the Book an Event button opens, such as your Google Form.",
      "Buttons & interface wording: rename buttons like Menu or Get directions.",
      "Footer links: extra links at the very bottom of the site.",
    ],
    joke: "This is the junk drawer of the Studio. Every home has one, and it's weirdly important.",
  },
  {
    tab: "dashboard",
    place: "All done",
    title: "That's the whole tour",
    intro:
      "You now know every corner of the Studio. Change something, Preview it, then Publish when you're happy.",
    how: [
      "Made a mistake? Undo it, or open Version history and restore an older version.",
      "Want this tour again? Press Guided tour at the bottom of the menu any time.",
      "Sign out when you're done, especially on a shared computer.",
    ],
    joke: "You've officially graduated. No diploma, but the first round is on the house. (Your house. You own the bar.)",
  },
];

const STORAGE_KEY = "pixelated-studio-guide";

/** Whether this browser has already been offered the tour. */
export function guideWasOffered() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return true;
  }
}
export function rememberGuide(state: "skipped" | "finished") {
  try {
    window.localStorage.setItem(STORAGE_KEY, state);
  } catch {
    /* Private browsing: the offer simply shows again next time. */
  }
}

/** First thing after signing in: offer the tour, never force it. */
export function GuideWelcome({
  onStart,
  onSkip,
}: {
  onStart: () => void;
  onSkip: () => void;
}) {
  const start = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    start.current?.focus();
  }, []);
  return (
    <div
      className="ad-modal-backdrop"
      onKeyDown={(event) => {
        if (event.key === "Escape") onSkip();
      }}
    >
      <section
        className="ad-guide-welcome"
        role="dialog"
        aria-modal="true"
        aria-labelledby="guide-welcome-title"
      >
        <span className="ad-guide-badge" aria-hidden="true">
          <PartyPopper size={22} />
        </span>
        <h2 id="guide-welcome-title">Want a quick tour?</h2>
        <p>
          We&apos;ll walk you through everything you can change on your website,
          one step at a time: photos, events, the bar menu, hours, colors and
          how to publish. About five minutes.
        </p>
        <p className="ad-guide-joke">
          No quiz at the end. No sales pitch. Just you, the Studio and a few bad
          jokes.
        </p>
        <div className="ad-guide-welcome-actions">
          <button
            ref={start}
            type="button"
            className="ad-button ad-button-red"
            onClick={onStart}
          >
            Show me around <ArrowRight size={16} />
          </button>
          <button type="button" className="ad-button" onClick={onSkip}>
            Skip, I&apos;ll figure it out
          </button>
        </div>
        <small>
          You can start it later from Guided tour at the bottom of the menu.
        </small>
      </section>
    </div>
  );
}

/** The tour itself: a small card that stays out of the way of the editor. */
export function GuidePanel({
  step,
  onStep,
  onClose,
}: {
  step: number;
  onStep: (next: number) => void;
  onClose: (finished: boolean) => void;
}) {
  const current = GUIDE_STEPS[step];
  const last = step === GUIDE_STEPS.length - 1;
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [step]);
  return (
    <aside
      className="ad-guide"
      aria-label="Guided tour"
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose(false);
      }}
    >
      <header>
        <span className="ad-guide-count">
          Step {step + 1} of {GUIDE_STEPS.length} · {current.place}
        </span>
        <button
          type="button"
          className="ad-guide-close"
          aria-label="Close the tour"
          onClick={() => onClose(false)}
        >
          <X size={18} />
        </button>
      </header>
      <div
        className="ad-guide-progress"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={GUIDE_STEPS.length}
        aria-valuenow={step + 1}
        aria-label="Tour progress"
      >
        <span
          style={{ width: `${((step + 1) / GUIDE_STEPS.length) * 100}%` }}
        />
      </div>
      <div className="ad-guide-body" aria-live="polite">
        <h2 ref={heading} tabIndex={-1}>
          {current.title}
        </h2>
        <p>{current.intro}</p>
        <ul>
          {current.how.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className="ad-guide-joke">{current.joke}</p>
      </div>
      <footer>
        <button
          type="button"
          className="ad-button"
          onClick={() => onStep(step - 1)}
          disabled={step === 0}
        >
          <ArrowLeft size={16} /> Back
        </button>
        {last ? (
          <button
            type="button"
            className="ad-button ad-button-red"
            onClick={() => onClose(true)}
          >
            <Check size={16} /> Finish
          </button>
        ) : (
          <button
            type="button"
            className="ad-button ad-button-red"
            onClick={() => onStep(step + 1)}
          >
            Next <ArrowRight size={16} />
          </button>
        )}
      </footer>
    </aside>
  );
}
