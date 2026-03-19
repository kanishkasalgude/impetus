import React from 'react';
import { X } from 'lucide-react';

interface FeatureConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm?: () => void;
    featureName: string;
    featureDescription: string;
    options?: { label: string; onClick: () => void; icon?: React.ReactNode }[];
}

export const FeatureConfirmationModal: React.FC<FeatureConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    featureName,
    featureDescription,
    options
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-4 border-b border-[#E0E6E6]">
                    <h3 className="text-lg font-bold text-[#002105]">Confirm Navigation</h3>
                    <button 
                        onClick={onClose}
                        className="p-2 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-6 text-center">
                    <h4 className="text-2xl font-black text-[#1B5E20] mb-2">{featureName}</h4>
                    <p className="text-stone-600 font-medium">{featureDescription}</p>
                </div>
                
                <div className="flex p-4 gap-3 border-t border-[#E0E6E6] bg-stone-50">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-4 rounded-xl font-bold text-stone-600 bg-white border border-stone-200 hover:bg-stone-50 transition-colors"
                    >
                        Cancel
                    </button>
                    {options && options.length > 0 ? (
                        <div className="flex-1 flex gap-2">
                            {options.map((opt, i) => (
                                <button
                                    key={i}
                                    onClick={() => { opt.onClick(); onClose(); }}
                                    className="flex-1 py-3 px-2 rounded-xl font-bold text-white bg-[#1B5E20] hover:bg-[#2E7D32] transition-colors shadow-md text-sm whitespace-nowrap"
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    ) : onConfirm ? (
                        <button
                            onClick={() => { onConfirm(); onClose(); }}
                            className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-[#1B5E20] hover:bg-[#2E7D32] transition-colors shadow-md"
                        >
                            Proceed
                        </button>
                    ) : null}
                </div>
            </div>
        </div>
    );
};
