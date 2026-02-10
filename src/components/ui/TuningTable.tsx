
import React from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { SintoniaData } from '@/lib/argosEngine';

interface TuningProps {
    data: SintoniaData | null;
}

export const TuningTable: React.FC<TuningProps> = ({ data }) => {
    if (!data) return null;

    return (
        <div className="flex flex-col">
            <div className="bg-gray-50/50 px-6 py-4 border-b border-argo-border flex justify-between items-center">
                <h3 className="text-[10px] font-bold text-argo-grey uppercase tracking-widest flex items-center gap-2">
                    Estrategia de Sintonía
                </h3>
                <div className="text-[10px] font-bold text-argo-indigo uppercase tracking-widest opacity-60">
                    Protocolo: {data.situacion}
                </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white">
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-green-600 uppercase text-[10px] font-bold tracking-widest">
                        <ThumbsUp size={14} /> Acciones (Hacer)
                    </div>
                    <div className="text-sm leading-relaxed text-argo-navy font-medium bg-green-50/50 p-4 rounded-argo-md border border-green-100 italic">
                        {data.hacer}
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-red-600 uppercase text-[10px] font-bold tracking-widest">
                        <ThumbsDown size={14} /> Restricciones (Evitar)
                    </div>
                    <div className="text-sm leading-relaxed text-argo-navy font-medium bg-red-50/50 p-4 rounded-argo-md border border-red-100 italic">
                        {data.evitar}
                    </div>
                </div>
            </div>
        </div>
    );
};
