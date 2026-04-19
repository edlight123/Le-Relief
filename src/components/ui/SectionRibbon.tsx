interface SectionRibbonProps {
  label: string;
  variant?: "primary" | "dark";
}

export default function SectionRibbon({ label, variant = "primary" }: SectionRibbonProps) {
  return (
    <div
      className="section-ribbon"
      style={
        variant === "primary"
          ? { background: "var(--primary)", color: "#fff" }
          : { background: "var(--foreground)", color: "var(--background)" }
      }
    >
      {label}
    </div>
  );
}
