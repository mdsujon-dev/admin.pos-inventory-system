import SectionDescription from "../ui/SectionDescription";
import SectionTitle from "../ui/SectionTitle";

const SectionHeader = ({
  title,
  subtitle,
  description,
  className,
  align = "center",
  extra,
  color,
}: {
  title: string;
  subtitle?: string;
  description?: string;
  className?: string;
  align?: "center" | "left" | "right";
  color?: string;
  extra?: any;
}) => {
  return (
    <div
      className={`max-w-9xl mx-auto w-full mb-8 ${
        extra ? "lg:flex justify-between items-start" : ""
      }`}
    >
      <div
        className={
          className ??
          `${
            extra
              ? ""
              : `text-${align} ${
                  align === "center"
                    ? "flex flex-col items-center"
                    : align === "right"
                    ? "ml-auto w-full lg:w-1/2"
                    : ""
                }`
          }`
        }
      >
        {subtitle?.trim() ? (
          <div className="inline-flex mb-4">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold tracking-widest ${
                color === "white"
                  ? "border-white/20 text-white/90"
                  : "border-primary-400 text-primary"
              }`}
            >
              {subtitle}
            </span>
          </div>
        ) : null}
        <SectionTitle color={color} title={title} />
        <SectionDescription color={color} description={description} />
      </div>
      {extra && <div className="mt-4 sm:mt-0">{extra}</div>}
    </div>
  );
};

export default SectionHeader;
