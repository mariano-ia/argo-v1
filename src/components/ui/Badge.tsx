import React from 'react';
import { AXIS_CHIP, AXIS_LABELS, MOTOR_CHIP } from '../../lib/designTokens';

/* ── Generic Badge ─────────────────────────────────────────────────────────── */

interface BadgeProps {
    children: React.ReactNode;
    className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, className = '' }) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${className}`}>
        {children}
    </span>
);

/* ── Axis Badge (D/I/S/C) ──────────────────────────────────────────────────── */

interface AxisBadgeProps {
    eje: string;
    showLabel?: boolean;
    className?: string;
}

export const AxisBadge: React.FC<AxisBadgeProps> = ({ eje, showLabel = true, className = '' }) => (
    <Badge className={`${AXIS_CHIP[eje] ?? 'bg-gray-50 text-gray-600 border-gray-200'} ${className}`}>
        {showLabel ? (AXIS_LABELS[eje] ?? eje) : eje}
    </Badge>
);

/* ── Motor Badge ───────────────────────────────────────────────────────────── */

interface MotorBadgeProps {
    motor: string;
    className?: string;
}

export const MotorBadge: React.FC<MotorBadgeProps> = ({ motor, className = '' }) => (
    <Badge className={`${MOTOR_CHIP[motor] ?? 'bg-gray-50 text-gray-600 border-gray-200'} ${className}`}>
        {motor}
    </Badge>
);
