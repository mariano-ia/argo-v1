
import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface BrujulaProps {
    axesData: { subject: string; A: number; fullMark: number }[];
}

export const Brujula: React.FC<BrujulaProps> = ({ axesData }) => {
    return (
        <div className="w-full h-[300px] relative">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={axesData}>
                    <PolarGrid stroke="#06b6d4" strokeOpacity={0.3} />
                    <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                    />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="none" />
                    <Radar
                        name="Perfil"
                        dataKey="A"
                        stroke="#06b6d4"
                        fill="#06b6d4"
                        fillOpacity={0.4}
                    />
                </RadarChart>
            </ResponsiveContainer>
            <div className="absolute top-0 right-0 text-argos-cyan text-xs font-mono border border-argos-cyan/30 px-2 py-1 bg-argos-deep/80 backdrop-blur-sm">
                BRUJULA_V.1.0
            </div>
        </div>
    );
};
