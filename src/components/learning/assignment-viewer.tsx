'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
    Trophy,
    FileUp,
    CheckCircle2,
    Clock,
    AlertCircle,
    Loader2,
    FileText,
    Upload,
    ChevronRight,
    ArrowDownCircle
} from 'lucide-react';
import { useUpload } from '@/hooks/use-upload';
import { toast } from 'sonner';
import { submitAssignment, getSubmissionStatus } from './actions';

interface AssignmentViewerProps {
    lessonId: string;
    onComplete: () => void;
    lessonComplete: boolean;
    isFocusMode?: boolean;
    className?: string;
}

export function AssignmentViewer({ lessonId, onComplete, lessonComplete, isFocusMode, className }: AssignmentViewerProps) {
    const [submission, setSubmission] = useState<any>(null);
    const [loadingStatus, setLoadingStatus] = useState(true);
    const [file, setFile] = useState<File | null>(null);

    const { upload, progress, isUploading } = useUpload({
        onSuccess: async (data) => {
            await submitAssignment(lessonId, data.assetId);
            const newStatus = await getSubmissionStatus(lessonId);
            setSubmission(newStatus);
            toast.success("Assignment submitted successfully");
            setFile(null);
            onComplete();
        },
        onError: (err) => {
            toast.error(err || "Transmission failed. Please check your connection.");
        }
    });

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const status = await getSubmissionStatus(lessonId);
                setSubmission(status);
            } catch (err) {
                console.error("Failed to fetch submission status:", err);
            } finally {
                setLoadingStatus(false);
            }
        };
        fetchStatus();
    }, [lessonId]);

    const handleUpload = async () => {
        if (!file) {
            toast.error("Please select a file to upload");
            return;
        }
        await upload(file, { contextType: 'lesson', contextId: lessonId });
    };

    if (loadingStatus) {
        return (
            <div className="flex flex-col items-center justify-center py-40 gap-6">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin opacity-20" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] animate-pulse">Initializing Module</p>
            </div>
        );
    }

    return (
        <div className={cn("w-full flex flex-col bg-white", className)}>
            {/* Header */}
            <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                        <Trophy size={20} />
                    </div>
                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Assignment Module</h4>
                        <p className="text-sm font-black text-slate-900 font-outfit">Project Submission</p>
                    </div>
                </div>

                {lessonComplete && (
                    <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100 font-outfit">
                        <CheckCircle2 size={14} /> Completed
                    </div>
                )}
            </div>

            <div className="flex-1 p-6 md:p-12 lg:p-16">
                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
                    
                    {/* Left: Instructions */}
                    <div className="lg:col-span-12 xl:col-span-7 space-y-10">
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <FileText className="text-indigo-600" size={20} />
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight font-outfit">Briefing & Guidelines</h3>
                            </div>
                            <div className="bg-slate-50 rounded-[2.5rem] p-8 md:p-12 border border-slate-100 shadow-sm transition-all hover:shadow-md">
                                <p className="text-xs md:text-sm text-slate-500 font-medium leading-loose font-outfit">
                                    Please ensure your assignment is comprehensive and addresses the core objectives of this module. Your work should reflect professional standards and clear analytical thinking.
                                </p>
                                <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-outfit">Max Size: 50MB</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-outfit">Format: PDF/DOCX/Slides</span>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right: Submission Port */}
                    <div className="lg:col-span-12 xl:col-span-5">
                        <div className="sticky top-[100px]">
                            <div className={cn(
                                "rounded-[3rem] p-8 md:p-12 border transition-all duration-700",
                                (lessonComplete || submission) ? "bg-emerald-50 border-emerald-100" : "bg-white border-slate-100 shadow-2xl"
                            )}>
                                <div className="flex items-center justify-between mb-10">
                                    <h3 className="text-lg font-black text-slate-900 uppercase font-outfit">Project Port</h3>
                                    {(lessonComplete || submission) ? <CheckCircle2 className="text-emerald-500" size={24} /> : <FileUp className="text-indigo-600" size={24} />}
                                </div>

                                {submission ? (
                                    <div className="space-y-8">
                                        <div className="p-6 bg-white rounded-2xl border border-emerald-100 shadow-sm group">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Stored Resource</p>
                                            <a 
                                                href={submission.asset?.file_url} 
                                                target="_blank" 
                                                className="text-indigo-600 font-black text-xs hover:underline break-all block font-outfit"
                                            >
                                                {submission.asset?.original_name || 'View Submission'}
                                            </a>
                                        </div>
                                        <div className="flex items-center gap-4 text-emerald-600 bg-white/50 p-4 rounded-xl border border-emerald-100">
                                            <CheckCircle2 size={18} />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] font-outfit">Verified & Recorded</span>
                                        </div>
                                        
                                        {!lessonComplete && (
                                             <button 
                                                onClick={() => setSubmission(null)}
                                                className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-all font-outfit"
                                            >
                                                Update Submission
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-10">
                                        <div 
                                            className={cn(
                                                "border-2 border-dashed rounded-[2rem] p-10 flex flex-col items-center justify-center transition-all cursor-pointer group",
                                                file ? "bg-indigo-50 border-indigo-200" : "bg-slate-50 border-slate-100 hover:border-indigo-100"
                                            )}
                                            onClick={() => document.getElementById('assignment-file')?.click()}
                                        >
                                            <input 
                                                type="file" 
                                                id="assignment-file" 
                                                className="hidden" 
                                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                            />
                                            <Upload className={cn("mb-5 transition-all", file ? "text-indigo-600" : "text-slate-300 group-hover:text-indigo-400")} size={32} />
                                            <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest text-center font-outfit">
                                                {file ? file.name : 'Select Project File'}
                                            </p>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-3">Ready for uplink</p>
                                        </div>

                                        {isUploading && (
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-500 font-outfit">
                                                    <span>Uplink Status</span>
                                                    <span>{Math.round(progress)}%</span>
                                                </div>
                                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <motion.div 
                                                        className="h-full bg-indigo-600" 
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <button
                                            onClick={handleUpload}
                                            disabled={!file || isUploading}
                                            className="w-full bg-slate-900 text-white h-20 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[11px] hover:bg-indigo-600 transition-all shadow-xl disabled:opacity-20 active:scale-95 flex items-center justify-center gap-4 font-outfit"
                                        >
                                            {isUploading ? <Loader2 className="animate-spin" size={20} /> : <>Commit Mission <ArrowDownCircle size={20} /></>}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&display=swap');
                .font-outfit { font-family: 'Outfit', sans-serif; }
            `}</style>
        </div>
    );
}
