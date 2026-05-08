const ensureToastRoot = () => {
  let root = document.querySelector(".toast-root");
  if (!root) {
    root = document.createElement("div");
    root.className = "toast-root";
    document.body.appendChild(root);
  }
  return root;
};

const showToast = (message, type = "success") => {
  if (typeof document === "undefined") return;
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message || (type === "success" ? "Done" : "Something went wrong");
  ensureToastRoot().appendChild(toast);
  window.setTimeout(() => toast.classList.add("is-leaving"), 2800);
  window.setTimeout(() => toast.remove(), 3300);
};

export const toast = {
  success: (message) => showToast(message, "success"),
  error: (message) => showToast(message, "error"),
};
