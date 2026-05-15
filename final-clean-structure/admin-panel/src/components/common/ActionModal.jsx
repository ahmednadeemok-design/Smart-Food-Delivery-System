import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function ActionModal({
  title,
  message,
  value,
  onValueChange,
  inputLabel,
  inputPlaceholder,
  secondaryLabel,
  secondaryValue,
  onSecondaryValueChange,
  secondaryPlaceholder,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  onConfirm,
  onCancel,
  inputType = "textarea",
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onCancel?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  return createPortal(
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="action-modal-title">
      <div className="modal-card action-modal" onMouseDown={(event) => event.stopPropagation()}>
        <h3 id="action-modal-title">{title}</h3>
        {message && <p className="muted">{message}</p>}
        {onValueChange && (
          <label className="form-field">
            <span>{inputLabel}</span>
            {inputType === "number" ? (
              <input className="input" type="number" placeholder={inputPlaceholder} value={value} onChange={(e) => onValueChange(e.target.value)} />
            ) : (
              <textarea rows="3" placeholder={inputPlaceholder} value={value} onChange={(e) => onValueChange(e.target.value)} />
            )}
          </label>
        )}
        {onSecondaryValueChange && (
          <label className="form-field">
            <span>{secondaryLabel}</span>
            <textarea rows="3" placeholder={secondaryPlaceholder} value={secondaryValue} onChange={(e) => onSecondaryValueChange(e.target.value)} />
          </label>
        )}
        <div className="action-row modal-actions">
          <button className="btn outline" type="button" onClick={onCancel}>{cancelLabel}</button>
          <button className={danger ? "btn danger" : "btn"} type="button" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
