import { HojaviaMark } from "@/components/hojavia-mark";
import { certificationDisplayLabels, loungeLeafCount, type PlaceCertification } from "@/lib/places";
import styles from "./lounge-leaf-rating.module.css";

export function LoungeLeafRating({ level, compact = false }: { level: PlaceCertification["level"]; compact?: boolean }) {
  const count = loungeLeafCount(level);
  const label = certificationDisplayLabels[level];
  if (!count) return <span className={styles.unrated}>Not yet independently assessed</span>;
  return <div className={`${styles.rating} ${compact ? styles.compact : ""}`} role="img" aria-label={`${label}, Hojavía independent lounge distinction`}>
    <span className={styles.leaves} aria-hidden="true">{Array.from({ length: count }, (_, index) => <HojaviaMark className={styles.leaf} key={index}/>)}</span>
    <span><strong>{label}</strong>{!compact && <small>Hojavía independent lounge distinction</small>}</span>
  </div>;
}

const distinctions = [
  { level: "Cedriva Certified" as const, summary: "A lounge worth seeking out", detail: "A strong, reliable cigar experience with thoughtful hospitality and sound humidor stewardship." },
  { level: "Cedriva Distinguished" as const, summary: "A distinguished lounge experience", detail: "Exceptional care, service, knowledge, comfort, and cultural contribution sustained beyond one strong visit." },
  { level: "Cedriva Destination" as const, summary: "A destination for cigar culture", detail: "An extraordinary, consistent room whose stewardship, hospitality, and collector experience justify a dedicated journey." },
];

export function LoungeLeafStandard() {
  return <section className={styles.standard} aria-labelledby="leaf-standard-title"><header><div className="eyebrow">Hojavía independent distinction</div><h2 id="leaf-standard-title">The Three-Leaf Lounge Standard</h2><p>Leaves recognize the complete lounge experience—not popularity alone. They are awarded through an independent, dated assessment and remain separate from Google and collector-community ratings.</p></header><div className={styles.distinctions}>{distinctions.map((item) => <article key={item.level}><LoungeLeafRating level={item.level}/><h3>{item.summary}</h3><p>{item.detail}</p></article>)}</div><footer><strong>Cannot be purchased.</strong><span>Advertising, partnerships, complimentary items, and commercial relationships never determine a leaf distinction. Every assessment is revisitable and carries its own visit date, evidence, disclosure, and next-review date.</span><small>Hojavía’s leaf system is an original cigar-lounge standard and is not affiliated with any restaurant, hotel, or travel-rating organization.</small></footer></section>;
}
