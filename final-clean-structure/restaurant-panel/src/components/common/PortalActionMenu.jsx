import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const MENU_EVENT = "smartfood:open-action-menu";

export function ActionMenuHost() {
  const [menu, setMenu] = useState(null);

  useEffect(() => {
    const open = (event) => setMenu(event.detail);
    const close = () => setMenu(null);
    window.addEventListener(MENU_EVENT, open);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener(MENU_EVENT, open);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, []);

  useEffect(() => {
    if (!menu) return undefined;
    const close = (event) => {
      if (event.key === "Escape") setMenu(null);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [menu]);

  if (!menu) return null;
  const width = 210;
  const height = Math.min(320, 12 + menu.actions.length * 42);
  const left = Math.min(Math.max(12, menu.rect.right - width), window.innerWidth - width - 12);
  const top = Math.max(12, Math.min(menu.rect.bottom + 8, window.innerHeight - height - 12));

  return createPortal(
    <div className="portal-menu-layer" onMouseDown={() => setMenu(null)}>
      <div className="portal-action-menu" style={{ left, top, width }} onMouseDown={(event) => event.stopPropagation()}>
        {menu.actions.map((action) => (
          <button
            key={action.label}
            className={action.danger ? "danger-text" : ""}
            type="button"
            onClick={() => {
              setMenu(null);
              action.onClick();
            }}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>,
    document.body
  );
}

export default function PortalActionMenu({ actions, label = "More Actions" }) {
  const open = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    window.dispatchEvent(new CustomEvent(MENU_EVENT, { detail: { rect, actions } }));
  };
  return <button className="more-actions-trigger" type="button" aria-haspopup="menu" onClick={open}>{label}</button>;
}
