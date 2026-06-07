"use client";

interface ChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

export default function Chip({ label, active, onClick }: ChipProps) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center text-[11.5px] px-[9px] py-[3px] rounded-full border transition-colors ${
        active
          ? "bg-brand text-white border-brand"
          : "bg-white text-muted border-line hover:border-brand-light"
      }`}
    >
      {label}
    </button>
  );
}
