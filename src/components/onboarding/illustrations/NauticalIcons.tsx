import React from 'react';

export type NauticalIconName =
    | 'anchor' | 'compass' | 'flag' | 'helm' | 'knot'
    | 'lightning' | 'lighthouse' | 'map' | 'oar' | 'parrot'
    | 'rope' | 'spyglass' | 'star' | 'wave' | 'horn';

interface IconProps {
    size?: number;
    color?: string;
    className?: string;
}

const Anchor: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="5" r="3" />
        <line x1="12" y1="8" x2="12" y2="22" />
        <path d="M5 12H2a10 10 0 0 0 20 0h-3" />
    </svg>
);

const Compass: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88" fill={color} opacity="0.3" stroke={color} />
    </svg>
);

const Flag: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" fill={color} opacity="0.15" />
        <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
);

const Helm: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="2" />
        <line x1="12" y1="4" x2="12" y2="2" />
        <line x1="12" y1="22" x2="12" y2="20" />
        <line x1="4" y1="12" x2="2" y2="12" />
        <line x1="22" y1="12" x2="20" y2="12" />
        <line x1="6.34" y1="6.34" x2="4.93" y2="4.93" />
        <line x1="19.07" y1="19.07" x2="17.66" y2="17.66" />
        <line x1="6.34" y1="17.66" x2="4.93" y2="19.07" />
        <line x1="19.07" y1="4.93" x2="17.66" y2="6.34" />
    </svg>
);

const Knot: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M4 12c0-3 2-5 4-5s4 2 4 5-2 5-4 5" />
        <path d="M20 12c0 3-2 5-4 5s-4-2-4-5 2-5 4-5" />
        <line x1="1" y1="12" x2="4" y2="12" />
        <line x1="20" y1="12" x2="23" y2="12" />
    </svg>
);

const Lightning: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" fill={color} opacity="0.15" />
    </svg>
);

const Lighthouse: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M9 22h6" />
        <path d="M10 22V10l-2 1V8l4-6 4 6v3l-2-1v12" />
        <circle cx="12" cy="9" r="1" fill={color} />
        <path d="M6 6h-2" />
        <path d="M20 6h-2" />
        <path d="M7 3.5 5.5 2" />
        <path d="M18.5 2 17 3.5" />
    </svg>
);

const MapIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polygon points="1,6 1,22 8,18 16,22 23,18 23,2 16,6 8,2" fill={color} opacity="0.1" />
        <line x1="8" y1="2" x2="8" y2="18" />
        <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
);

const Oar: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="4" y1="20" x2="16" y2="8" />
        <path d="M16 8c0 0 2-1 4-3s2-4 2-4-2 0-4 2-3 4-3 4z" fill={color} opacity="0.2" />
        <circle cx="3" cy="21" r="1" fill={color} />
    </svg>
);

const Parrot: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M14 4c3 0 6 3 6 7s-2 6-4 8l-2 3h-2l1-3c-3-1-5-4-5-7 0-5 3-8 6-8z" fill={color} opacity="0.1" />
        <circle cx="16" cy="8" r="1" fill={color} />
        <path d="M12 10l-2 1" />
        <path d="M10 18v3" />
        <path d="M14 18v2" />
    </svg>
);

const Rope: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" className={className}>
        <path d="M4 20C4 20 6 16 8 14S12 12 12 12S16 10 18 8S20 4 20 4" />
        <circle cx="4" cy="20" r="2" strokeWidth="2" />
    </svg>
);

const Spyglass: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M21 4L10 12" />
        <path d="M10 12L3 20" />
        <circle cx="19" cy="5.5" r="3" fill={color} opacity="0.15" />
        <line x1="7" y1="15" x2="5" y2="17" strokeWidth="3" />
    </svg>
);

const Star: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill={color} opacity="0.2" />
    </svg>
);

const Wave: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" className={className}>
        <path d="M2 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0" />
        <path d="M2 17c2-3 4-3 6 0s4 3 6 0 4-3 6 0" opacity="0.5" />
    </svg>
);

const Horn: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M6 9v6l10 4V5L6 9z" fill={color} opacity="0.15" />
        <rect x="2" y="9" width="4" height="6" rx="1" fill={color} opacity="0.1" />
        <line x1="19" y1="9" x2="22" y2="8" />
        <line x1="19" y1="12" x2="22" y2="12" />
        <line x1="19" y1="15" x2="22" y2="16" />
    </svg>
);

const ICON_MAP: Record<NauticalIconName, React.FC<IconProps>> = {
    anchor: Anchor,
    compass: Compass,
    flag: Flag,
    helm: Helm,
    knot: Knot,
    lightning: Lightning,
    lighthouse: Lighthouse,
    map: MapIcon,
    oar: Oar,
    parrot: Parrot,
    rope: Rope,
    spyglass: Spyglass,
    star: Star,
    wave: Wave,
    horn: Horn,
};

interface NauticalIconProps extends IconProps {
    name: NauticalIconName;
}

export const NauticalIcon: React.FC<NauticalIconProps> = ({ name, ...props }) => {
    const Icon = ICON_MAP[name];
    return <Icon {...props} />;
};
