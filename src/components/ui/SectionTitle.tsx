const SectionTitle = ({
  title,
  color,
  secondaryColor = "primary",
}: {
  title: string;
  color?: string;
  secondaryColor?: string;
}) => {
  const words = title?.trim().split(" ");
  const lastTwoWords = words?.splice(-1).join(" ");
  const firstPart = words?.join(" ");
  const appliedColor = color ? `text-${color}` : "text-secondary";

  const finalTitle = `<span class="${appliedColor}">${
    firstPart ?? ""
  }</span> <span class="text-${secondaryColor}">${
    lastTwoWords ?? ""
  }</span>`;
  return (
    <div>
      <h1
        className={`font-bold text-3xl md:text-4xl tracking-tight !leading-[1.2] mb-5 max-w-4xl capitalize`}
        dangerouslySetInnerHTML={{ __html: finalTitle }}
      />
    </div>
  );
};

export default SectionTitle;
