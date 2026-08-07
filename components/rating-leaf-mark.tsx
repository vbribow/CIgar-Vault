import { HojaviaMark } from "@/components/hojavia-mark";
import styles from "./rating-leaf-mark.module.css";

type RatingLeafMarkProps = {
  value: string | number;
  label: string;
  detail?: string;
  compact?: boolean;
};

/** A single leaf identifies an exact numeric rating or ranking owned by Hojavía. */
export function RatingLeafMark({ value, label, detail, compact = false }: RatingLeafMarkProps) {
  return <span className={`${styles.rating} ${compact ? styles.compact : ""}`} aria-label={`${label}: ${value}`}>
    <span className={styles.seal} aria-hidden="true"><HojaviaMark className={styles.leaf}/><strong>{value}</strong></span>
    <span className={styles.copy}><b>{label}</b>{detail && <small>{detail}</small>}</span>
  </span>;
}

export function RatingLeafKey() {
  return <aside className={styles.key} aria-label="Hojavía rating identity">
    <HojaviaMark className={styles.keyLeaf}/>
    <span><strong>The Hojavía leaf seal</strong><small>Identifies a Hojavía-owned score or ranking while preserving its exact number. Published professional and Google ratings keep their source identity. Repeated one-to-three leaves are reserved for independent lounge distinctions.</small></span>
  </aside>;
}
