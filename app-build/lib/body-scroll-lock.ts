let lockCount = 0;
let originalOverflow = "";

export function lockBodyScroll() {
  if (typeof document === "undefined") return () => {};
  if (lockCount === 0) originalOverflow = document.body.style.overflow;
  lockCount += 1;
  document.body.style.overflow = "hidden";
  let released = false;
  return () => {
    if (released) return;
    released = true;
    lockCount = Math.max(0, lockCount - 1);
    if (lockCount === 0) document.body.style.overflow = originalOverflow === "hidden" ? "" : originalOverflow;
  };
}
