const SectionDescription = ({
  description,
  color,
}: {
  description?: string;
  color?: string;
}) => {
  if (!description?.trim()) return null;
  return (
 <h1
     className={`${
          color ? `text-${color}` : "text-secondary/60"
        } text-editor tracking-tight text-base max-w-5xl`}
        dangerouslySetInnerHTML={{ __html: description }}
      />
  );
};

export default SectionDescription;
