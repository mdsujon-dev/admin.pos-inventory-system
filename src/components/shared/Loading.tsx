export const Loading = ({ text }: { text?: string }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[90vh] gap-4">
      {/* Dual-ring spinner: a soft track with a spinning primary arc. */}
      <span className="relative inline-flex h-12 w-12">
        <span className="absolute inset-0 rounded-full border-[3px] border-primary-100" />
        <span className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-primary animate-spin" />
      </span>
      <span className="text-secondary-500 text-sm font-medium tracking-wide">
        {text ?? "Please wait"}
      </span>
    </div>
  );
};
