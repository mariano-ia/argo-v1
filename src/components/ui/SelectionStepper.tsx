
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Check, ChevronRight } from 'lucide-react';

interface Option {
    id: string;
    label: string;
    value: string;
}

interface StepperProps {
    title: string;
    options: Option[];
    selectedValue: string;
    onSelect: (value: string) => void;
    className?: string;
}

export const SelectionStepper: React.FC<StepperProps> = ({
    title,
    options,
    selectedValue,
    onSelect,
    className
}) => {
    return (
        <div className={cn("flex flex-col gap-4", className)}>
            <h3 className="text-argo-navy text-[10px] uppercase tracking-[0.2em] font-bold mb-1 flex items-center gap-2 px-1">
                <span className="w-1.5 h-1.5 bg-argo-indigo rounded-full"></span>
                {title}
            </h3>

            <div className="grid grid-cols-1 gap-3">
                {options.map((option) => {
                    const isSelected = selectedValue === option.value;
                    return (
                        <motion.button
                            key={option.id}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => onSelect(option.value)}
                            className={cn(
                                "group relative flex items-center justify-between p-4 rounded-argo-md border transition-all duration-200 text-left",
                                isSelected
                                    ? "bg-white border-argo-indigo ring-1 ring-argo-indigo text-argo-navy shadow-sm"
                                    : "bg-white border-argo-border text-argo-grey hover:border-argo-grey hover:bg-gray-50"
                            )}
                        >
                            <span className={cn(
                                "text-sm font-bold tracking-tight",
                                isSelected ? "text-argo-indigo" : "text-argo-navy"
                            )}>
                                {option.label}
                            </span>

                            {isSelected && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-argo-indigo text-white rounded-full p-1 shadow-sm"
                                >
                                    <Check size={14} strokeWidth={3} />
                                </motion.div>
                            )}

                            {!isSelected && <ChevronRight size={14} className="text-argo-border group-hover:text-argo-grey transition-colors" />}
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
};
