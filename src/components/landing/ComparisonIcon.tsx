type ComparisonIconProps = {
  label: string;
  className: string;
};

const ComparisonIcon = ({ label, className }: ComparisonIconProps) => (
  <span
    aria-label={label}
    role="img"
    className={`trust-comparison-icon block ${className}`}
    style={{
      WebkitMask: "url('/icons/comparison-mask.png') center / contain no-repeat",
      mask: "url('/icons/comparison-mask.png') center / contain no-repeat",
    }}
  />
);

export default ComparisonIcon;
