type Props = { kicker: string; title: string; copy?: string; align?: "left" | "center" };

export function SectionHeading({ kicker, title, copy, align = "left" }: Props) {
  const center = align === "center";
  return (
    <div className={center ? "mx-auto max-w-3xl text-center" : ""}>
      <p className="section-kicker">{kicker}</p>
      <h2 className="section-title">{title}</h2>
      {copy ? <p className={`section-copy ${center ? "mx-auto" : ""}`}>{copy}</p> : null}
    </div>
  );
}
