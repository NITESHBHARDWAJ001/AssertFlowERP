import type { SVGProps } from "react";

// One consistent line-art family: 20x20, 1.6 stroke, round joins. A couple
// (Assets, Categories) borrow the product's own tag/manifest vocabulary
// instead of generic box/label glyphs.
type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 20 20",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function DashboardIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="3" width="6.2" height="6.2" rx="1.2" />
      <rect x="10.8" y="3" width="6.2" height="6.2" rx="1.2" />
      <rect x="3" y="10.8" width="6.2" height="6.2" rx="1.2" />
      <rect x="10.8" y="10.8" width="6.2" height="6.2" rx="1.2" />
    </svg>
  );
}

export function OrganizationIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 17V4.8a.8.8 0 0 1 .8-.8h6.4a.8.8 0 0 1 .8.8V17" />
      <path d="M13 17V9.8a.8.8 0 0 1 .8-.8h1.4a.8.8 0 0 1 .8.8V17" />
      <path d="M2.5 17h15" />
      <path d="M6.5 6.8h.01M9.5 6.8h.01M6.5 9.8h.01M9.5 9.8h.01M6.5 12.8h.01M9.5 12.8h.01" />
    </svg>
  );
}

export function DepartmentIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="10" cy="4.2" r="1.7" />
      <circle cx="4.5" cy="15.8" r="1.7" />
      <circle cx="15.5" cy="15.8" r="1.7" />
      <path d="M10 5.9v3.3M10 9.2 4.5 14.1M10 9.2l5.5 4.9" />
    </svg>
  );
}

export function EmployeesIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="7.3" cy="6.5" r="2.5" />
      <path d="M2.5 17c0-3 2.1-5 4.8-5s4.8 2 4.8 5" />
      <circle cx="14.2" cy="7.2" r="2" />
      <path d="M13 12.3c2.1.2 3.7 1.9 3.7 4.7" />
    </svg>
  );
}

// A tag on a string - the product's core unit is a physically tagged asset.
export function AssetsIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M10.6 3.2 16.8 9.4a1.4 1.4 0 0 1 0 2L10.4 17.8a1.4 1.4 0 0 1-2 0L2.6 12a1.4 1.4 0 0 1-.4-1V4.6A1.4 1.4 0 0 1 3.6 3.2H10a1.4 1.4 0 0 1 .6 0Z" />
      <circle cx="6.6" cy="7.2" r="1.1" />
    </svg>
  );
}

// A blank luggage-style tag - distinct silhouette from Assets' string tag.
export function CategoriesIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3.2" y="5.5" width="13.6" height="9" rx="1.6" />
      <path d="M7 5.5V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1.5" />
      <path d="M6.5 10h7" />
    </svg>
  );
}

export function RequestsIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="4.5" y="2.8" width="11" height="14.4" rx="1.4" />
      <path d="M7.3 2.8V2a.8.8 0 0 1 .8-.8h3.8a.8.8 0 0 1 .8.8v.8" />
      <path d="M7 9.8l1.8 1.8L13 7.7" />
    </svg>
  );
}

export function BookingsIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="4" width="14" height="12.5" rx="1.4" />
      <path d="M3 7.8h14" />
      <path d="M6.3 2.5v3M13.7 2.5v3" />
      <path d="M6.5 11h2M11.5 11h2M6.5 13.8h2" />
    </svg>
  );
}

export function MaintenanceIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12.4 3.4a3.6 3.6 0 0 0-4.6 4.3L3.4 12a1.6 1.6 0 0 0 2.3 2.3l4.3-4.4a3.6 3.6 0 0 0 4.3-4.6l-2 2-1.9-.6-.6-1.9 2-2Z" />
    </svg>
  );
}

export function AuditsIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="2.5" width="10" height="14" rx="1.3" />
      <path d="M6 2.5h4.5" />
      <path d="M6 7h5M6 10h5M6 13h3" />
      <circle cx="14.8" cy="14.4" r="2.3" />
      <path d="M16.6 16.2 18 17.6" />
    </svg>
  );
}

export function ResourcesIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M2.8 6.5 10 2.5l7.2 4v7l-7.2 4-7.2-4Z" />
      <path d="M2.8 6.5 10 10.5l7.2-4" />
      <path d="M10 10.5v7" />
    </svg>
  );
}

export function ReportsIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5.5 2.8h6.2l3.3 3.3v10.4a1 1 0 0 1-1 1H5.5a1 1 0 0 1-1-1V3.8a1 1 0 0 1 1-1Z" />
      <path d="M11.5 2.8v3.5h3.3" />
      <path d="M6.8 14.5v-2M9.8 14.5V9.8M12.8 14.5v-4" />
    </svg>
  );
}

export function AnalyticsIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 17V3" />
      <path d="M3 17h14" />
      <path d="M6 14.5V10M9.5 14.5V6.5M13 14.5v-6" />
    </svg>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="10" cy="10" r="2.6" />
      <path d="M10 2.8v1.8M10 15.4v1.8M17.2 10h-1.8M4.6 10H2.8M15.1 4.9l-1.3 1.3M6.2 13.8l-1.3 1.3M15.1 15.1l-1.3-1.3M6.2 6.2 4.9 4.9" />
    </svg>
  );
}

export function ActivityIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="10" cy="10" r="7.2" />
      <path d="M10 5.8V10l3 1.8" />
    </svg>
  );
}
