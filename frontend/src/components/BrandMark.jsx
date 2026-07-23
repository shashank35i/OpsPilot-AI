export const BrandMark = ({ className = "brand-mark" }) => {
  return (
    <span className={className} aria-label="OpsPilot logo">
      <span className="brand-mark-line">OP</span>
      <span className="brand-mark-line brand-mark-accent">AI</span>
    </span>
  );
};

