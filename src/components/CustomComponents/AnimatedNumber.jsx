import { useEffect, useRef, useState } from "react";

const parse = (v) => {
  const str = String(v ?? "0");
  const prefix = str.startsWith("₹") ? "₹" : "";
  const suffix = str.endsWith("%") ? "%" : "";
  // Strip commas before parsing so "1,23,456" → 123456
  const numStr = str.replace(/^₹/, "").replace(/%$/, "").replace(/,/g, "").trim();
  const target = parseFloat(numStr);
  return { str, prefix, suffix, target };
};

const fmt = (n, prefix, suffix) => {
  const rounded = Math.round(n);
  if (prefix === "₹") return `₹${rounded.toLocaleString()}`;
  return `${prefix}${rounded}${suffix}`;
};

const AnimatedNumber = ({ value, duration = 1400 }) => {
  const { str, prefix, suffix, target } = parse(value);

  // Start at the actual value so it's always readable (not "0")
  const [display, setDisplay] = useState(
    isNaN(target) ? str : fmt(target, prefix, suffix)
  );

  const spanRef = useRef(null);
  const frameRef = useRef(null);
  const lastTarget = useRef(undefined);

  useEffect(() => {
    if (isNaN(target)) {
      setDisplay(str);
      return;
    }

    const el = spanRef.current;
    if (!el) return;

    let cancelled = false;

    const startAnim = () => {
      if (cancelled || lastTarget.current === target) return;

      if (frameRef.current) cancelAnimationFrame(frameRef.current);

      let start = null;
      const step = (ts) => {
        if (cancelled) return;
        if (!start) start = ts;
        const progress = Math.min((ts - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplay(fmt(eased * target, prefix, suffix));
        if (progress < 1) {
          frameRef.current = requestAnimationFrame(step);
        } else {
          lastTarget.current = target;
        }
      };

      setDisplay(fmt(0, prefix, suffix));
      frameRef.current = requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) startAnim();
      },
      { threshold: 0.1 }
    );

    observer.observe(el);

    return () => {
      cancelled = true;
      observer.disconnect();
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration]);

  return <span ref={spanRef}>{display}</span>;
};

export default AnimatedNumber;
