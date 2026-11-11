"use client";

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Eye,
  EyeOff,
  ImagePlus,
  Trash2,
  X,
} from "lucide-react";
import type { Asset } from "@/lib/types";

export const uid = (prefix = "item") =>
  `${prefix}-${crypto.randomUUID().slice(0, 10)}`;
export const move = <T,>(items: T[], from: number, to: number): T[] => {
  if (to < 0 || to >= items.length) return items;
  const result = [...items];
  const [item] = result.splice(from, 1);
  result.splice(to, 0, item);
  return result;
};
export const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export function Panel({
  title,
  description,
  actions,
  children,
  className = "",
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`ad-panel ${className}`}>
      {(title || actions) && (
        <div className="ad-panel-heading">
          <div>
            {title && <h2>{title}</h2>}
            {description && <p>{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}
export function Field({
  label,
  value,
  onChange,
  help,
  type = "text",
  placeholder,
  disabled = false,
  required = false,
  maxLength,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  help?: string;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  maxLength?: number;
}) {
  const id = useId();
  return (
    <div className="ad-field">
      <label htmlFor={id}>
        {label}
        {required && <span className="ad-required"> *</span>}
      </label>
      <input
        id={id}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        maxLength={maxLength}
      />
      {help && <small>{help}</small>}
    </div>
  );
}
export function TextArea({
  label,
  value,
  onChange,
  help,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  help?: string;
  rows?: number;
}) {
  const id = useId();
  return (
    <div className="ad-field">
      <label htmlFor={id}>{label}</label>
      <textarea
        id={id}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
      />
      {help && <small>{help}</small>}
    </div>
  );
}
export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
}) {
  const id = useId();
  const [input, setInput] = useState(String(value));
  const [error, setError] = useState("");
  useEffect(() => {
    setInput(String(value));
  }, [value]);
  return (
    <div className="ad-field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        inputMode="decimal"
        value={input}
        onChange={(e) => {
          const raw = e.target.value;
          setInput(raw);
          const parsed = Number(raw);
          if (
            raw.trim() !== "" &&
            Number.isFinite(parsed) &&
            parsed >= min &&
            parsed <= max
          ) {
            onChange(parsed);
            setError("");
          } else setError(`Enter a number from ${min} to ${max}.`);
        }}
        onBlur={() => {
          if (error) {
            setInput(String(value));
            setError("");
          }
        }}
      />
      {error && <small className="ad-danger-text">{error}</small>}
    </div>
  );
}
export function Select({
  label,
  value,
  onChange,
  options,
  help,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  options: { value: string | number; label: string }[];
  help?: string;
}) {
  const id = useId();
  return (
    <div className="ad-field">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {help && <small>{help}</small>}
    </div>
  );
}
export function Toggle({
  label,
  checked,
  onChange,
  help,
  disabled = false,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  help?: string;
  disabled?: boolean;
}) {
  return (
    <label className="ad-toggle">
      <input
        type="checkbox"
        checked={!!checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      <span className="ad-toggle-track" aria-hidden="true" />
      <span>
        <strong>{label}</strong>
        {help && <small>{help}</small>}
      </span>
    </label>
  );
}
export function Range({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  suffix = "%",
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}) {
  const id = useId();
  return (
    <div className="ad-field ad-range">
      <label htmlFor={id}>
        {label}
        <output>
          {Math.round(value * 100) / 100}
          {suffix}
        </output>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  return (
    <div className="ad-field">
      <label htmlFor={id}>{label}</label>
      <div className="ad-color">
        <input
          aria-label={`${label} picker`}
          type="color"
          value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
        />
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={7}
        />
      </div>
    </div>
  );
}
export const MediaContext = createContext<{
  assets: Asset[];
  openPicker: (select: (src: string) => void) => void;
}>({ assets: [], openPicker: () => {} });
export function ImageField({
  label,
  value,
  onChange,
  help,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  help?: string;
}) {
  const { assets, openPicker } = useContext(MediaContext);
  const asset = assets.find((a) => a.src === value);
  return (
    <div className="ad-image-field">
      <div className="ad-image-heading">
        <strong>{label}</strong>
        {value && (
          <button
            type="button"
            className="ad-icon-button"
            aria-label={`Clear ${label}`}
            onClick={() => onChange("")}
          >
            <X size={16} />
          </button>
        )}
      </div>
      <button
        type="button"
        className={`ad-image-picker ${value ? "has-image" : ""}`}
        onClick={() => openPicker(onChange)}
      >
        {value ? (
          <img src={value} alt={asset?.alt || label} />
        ) : (
          <ImagePlus size={28} />
        )}
        <span>{value ? "Change image" : "Choose or upload image"}</span>
      </button>
      {help && <small>{help}</small>}
      <details className="ad-details">
        <summary>Image address</summary>
        <Field
          label={`${label} address`}
          value={value}
          onChange={onChange}
          help="Use the library above, or paste an image URL you own."
        />
      </details>
    </div>
  );
}
export function ItemActions({
  name,
  onUp,
  onDown,
  onDuplicate,
  onToggle,
  visible,
  onDelete,
}: {
  name: string;
  onUp?: () => void;
  onDown?: () => void;
  onDuplicate?: () => void;
  onToggle?: () => void;
  visible?: boolean;
  onDelete?: () => void;
}) {
  return (
    <div className="ad-item-actions">
      {onUp && (
        <button
          type="button"
          className="ad-icon-button"
          aria-label={`Move ${name} up`}
          onClick={onUp}
        >
          <ArrowUp size={16} />
        </button>
      )}
      {onDown && (
        <button
          type="button"
          className="ad-icon-button"
          aria-label={`Move ${name} down`}
          onClick={onDown}
        >
          <ArrowDown size={16} />
        </button>
      )}
      {onDuplicate && (
        <button
          type="button"
          className="ad-icon-button"
          aria-label={`Duplicate ${name}`}
          onClick={onDuplicate}
        >
          <Copy size={16} />
        </button>
      )}
      {onToggle && (
        <button
          type="button"
          className="ad-icon-button"
          aria-label={`${visible ? "Hide" : "Restore"} ${name}`}
          onClick={onToggle}
        >
          {visible ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          className="ad-icon-button ad-danger-text"
          aria-label={`Delete ${name}`}
          onClick={onDelete}
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
}
export function Empty({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="ad-empty">
      <span className="ad-empty-symbol" aria-hidden="true">
        ＋
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function Modal({
  title,
  description,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const titleId = useId();
  return (
    <div
      className="ad-modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
        if (e.key === "Tab") {
          const nodes = [
            ...e.currentTarget.querySelectorAll<HTMLElement>(
              'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]',
            ),
          ];
          const first = nodes[0],
            last = nodes[nodes.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }}
    >
      <section
        className={`ad-modal ${wide ? "ad-modal-wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="ad-modal-heading">
          <div>
            <h2 id={titleId}>{title}</h2>
            {description && <p>{description}</p>}
          </div>
          <button
            autoFocus
            type="button"
            className="ad-icon-button"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X size={22} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
