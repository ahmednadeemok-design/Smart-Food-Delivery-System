import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Copy, MapPinned, MessageCircle, Phone, PhoneCall, X } from "lucide-react";
import { toast } from "../../utils/toast.js";

const CONTACT_EVENT = "smartfood:open-contact-modal";
const CONTACT_STATE_EVENT = "smartfood:contact-modal-state";
const cleanPhone = (phone = "") => String(phone).replace(/[^\d+]/g, "");
const whatsappPhone = (phone = "") => cleanPhone(phone).replace(/^\+/, "");
const mapHref = (location, address) => {
  if (location?.lat && location?.lng) return `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`;
  if (address) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  return "";
};
const detectMobile = () => typeof navigator !== "undefined" && (/Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(navigator.userAgent || "") || (navigator.maxTouchPoints > 1 && window.matchMedia?.("(max-width: 820px)")?.matches));
const copyNumber = async (phone) => {
  if (!phone) return toast.error("Phone number not available.");
  try {
    await navigator.clipboard.writeText(phone);
    toast.success("Phone number copied");
  } catch {
    toast.error("Copy failed. Please copy the number manually.");
  }
};

export function ContactModalHost() {
  const [contact, setContact] = useState(null);
  const isMobile = useMemo(detectMobile, []);
  const normalized = cleanPhone(contact?.phone);
  const maps = mapHref(contact?.location, contact?.address);
  const whatsapp = normalized ? `https://wa.me/${whatsappPhone(normalized)}` : "";

  useEffect(() => {
    const open = (event) => setContact(event.detail);
    window.addEventListener(CONTACT_EVENT, open);
    return () => window.removeEventListener(CONTACT_EVENT, open);
  }, []);

  useEffect(() => {
    if (!contact) return undefined;
    const previous = document.body.style.overflow;
    const previousPadding = document.body.style.paddingRight;
    const scrollbarWidth = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
    window.__SMARTFOOD_CONTACT_MODAL_OPEN = true;
    window.dispatchEvent(new CustomEvent(CONTACT_STATE_EVENT, { detail: { open: true } }));
    document.body.style.overflow = "hidden";
    if (scrollbarWidth) document.body.style.paddingRight = `${scrollbarWidth}px`;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setContact(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.body.style.paddingRight = previousPadding;
      window.__SMARTFOOD_CONTACT_MODAL_OPEN = false;
      window.dispatchEvent(new CustomEvent(CONTACT_STATE_EVENT, { detail: { open: false } }));
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [contact]);

  if (!contact) return null;

  return createPortal(
    <div className="modal-backdrop contact-modal-backdrop" role="dialog" aria-modal="true" aria-label={`${contact.title} contact options`} onMouseDown={(event) => event.target === event.currentTarget && setContact(null)}>
      <div className="modal-card contact-modal" onMouseDown={(event) => event.stopPropagation()}>
        <button className="icon-btn modal-close" type="button" onClick={() => setContact(null)} title="Close contact options">
          <X size={18} />
        </button>
        <div className="contact-modal-title">
          <PhoneCall size={22} />
          <div>
            <h3>{contact.title}</h3>
            {contact.subtitle && <p className="muted">{contact.subtitle}</p>}
          </div>
        </div>
        <div className="contact-modal-details">
          <div className="detail-tile"><small>Phone</small><b>{normalized || "Phone number not available."}</b></div>
          <div className="detail-tile"><small>Address</small><b>{contact.address || (contact.location ? `${Number(contact.location.lat).toFixed(4)}, ${Number(contact.location.lng).toFixed(4)}` : "Location not available")}</b></div>
        </div>
        {!isMobile && <p className="muted contact-hint">Use WhatsApp or copy number to contact. Open Dialer is available if this desktop has a phone app configured.</p>}
        <div className="contact-modal-actions">
          {isMobile ? <a className="btn contact-action-primary" href={`tel:${normalized}`}><Phone size={18} /> Call</a> : <a className="btn contact-action-primary" href={whatsapp} target="_blank" rel="noreferrer"><MessageCircle size={18} /> WhatsApp</a>}
          <button className="btn outline" type="button" onClick={() => copyNumber(normalized)}><Copy size={18} /> Copy Number</button>
          {maps ? <a className="btn outline" href={maps} target="_blank" rel="noreferrer"><MapPinned size={18} /> Open Maps</a> : <button className="btn outline" disabled><MapPinned size={18} /> No Location</button>}
          {isMobile ? <a className="btn outline" href={whatsapp} target="_blank" rel="noreferrer"><MessageCircle size={18} /> WhatsApp</a> : <a className="btn outline contact-dialer-link" href={`tel:${normalized}`}><Phone size={18} /> Open Dialer</a>}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function ContactActions({ title = "Contact", subtitle = "", phone = "", location, address, compact = false }) {
  const normalized = cleanPhone(phone);
  const openContact = () => {
    if (!normalized) return;
    window.dispatchEvent(new CustomEvent(CONTACT_EVENT, { detail: { title, subtitle, phone: normalized, location, address } }));
  };

  return (
    <div className={`contact-actions ${compact ? "compact" : ""}`}>
      <div className="contact-actions-head">
        <div>
          <b>{title}</b>
          {subtitle && <span>{subtitle}</span>}
        </div>
        <small>{normalized || "Phone number not available."}</small>
      </div>
      <button className="btn outline contact-open-btn" type="button" onClick={openContact} disabled={!normalized} title={normalized ? "Open contact options" : "Phone number not available."}>
        <Phone size={17} /> {normalized ? "Contact" : "Phone number not available."}
      </button>
    </div>
  );
}
