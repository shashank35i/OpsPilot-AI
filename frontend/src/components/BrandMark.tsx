import React from "react";

type BrandMarkProps = {
  className?: string;
};

export const BrandMark: React.FC<BrandMarkProps> = ({ className = "brand-mark" }) => {
  return (
    <span className={className} aria-label="OpsPilot logo">
      <img src="/favicon-opspilot.svg" alt="" />
    </span>
  );
};

