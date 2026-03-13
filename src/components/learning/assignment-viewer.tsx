'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { 
    Upload, 
    FileText, 
    CheckCircle2, 
    ChevronRight, 
    AlertCircle,
    X,
    Loader2,
    ShieldCheck,
    ArrowUpRight,
    FileCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { submitAssignment, getSubmissionStatus } from './actions';
import { useUpload } from '@/hooks/use-upload';
import { uploadStore } from '@/lib/upload-store';

interface AssignmentViewerProps {
    lessonId: string;
    onComplete: () => void;
    lessonComplete: boolean;
    isFocusMode?: boolean;
    className?: string;
}

export function AssignmentViewer({ 
    lessonId, 
    onComplete, 
    lessonComplete, 
    isFocusMode, 
    className 
}: AssignmentViewerProps) {
    const [submission, setSubmission] = useState<any>(null);
    const [loadingStatus, setLoadingStatus] = useState(true);
    const [uploadFile, setUploadFile] = useState<File | null>(null);

    const { upload, progress, isUploading, error: uploadError, reset: resetUpload, abort, uploadId } = useUpload({
        onSuccess: async (data) => {
            await submitAssignment(lessonId, data.assetId);
            const newStatus = await getSubmissionStatus(lessonId);
            setSubmission(newStatus);
            toast.success("Assignment submitted successfully");
            setUploadFile(null);
            onComplete();
        },
        onError: (err) => {
            toast.error(err || "Failed to upload assignment");
        }
    });

    useEffect(() => {
        if (isUploading) {
            uploadStore.updateTask(uploadId, { isLocalVisible: true });
        }
        return () => {
            uploadStore.updateTask(uploadId, { isLocalVisible: false });
        };
    }, [uploadId, isUploading]);

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

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadFile(file);
        try {
            await upload(file, {
                contextType: 'lesson',
                contextId: lessonId
            });
        } catch (err: any) {
            console.error("Upload failed:", err);
        }
    };

    if (loadingStatus) {
        return (
            <div className="h-[50vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loading Assignment...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={cn("max-w-4xl mx-auto space-y-4 md:space-y-12 px-2 md:px-0 transition-all duration-1000", className)}>
            
            {/* Main Submission Zone */}
            <div className={cn(
                "relative p-0.5 md:p-1 bg-slate-900 rounded-3xl md:rounded-[3.5rem] overflow-hidden transition-all duration-1000",
                isFocusMode ? "shadow-2xl scale-[1.01]" : "shadow-xl"
            )}>
                <div className="relative rounded-[1.7rem] md:rounded-[3.2rem] overflow-hidden bg-slate-950/40 backdrop-blur-3xl border border-white/5 p-6 md:p-16 lg:p-20 text-center">
                    
                    {!submission ? (
                        <div className="relative z-10 space-y-8 md:space-y-10">
                            <div className="w-16 h-16 md:w-24 md:h-24 bg-white/5 rounded-2xl md:rounded-[2.5rem] flex items-center justify-center text-white mx-auto border border-white/10 group hover:scale-110 transition-transform duration-500">
                                <Upload className="w-8 h-8 md:w-10 md:h-10 group-hover:-translate-y-1 transition-transform" />
                            </div>
                            
                            <div className="space-y-3">
                                <h2 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tight">Submit Assignment</h2>
                                <p className="text-xs md:text-sm text-slate-400 font-bold max-w-md mx-auto leading-relaxed uppercase tracking-widest">
                                    Upload your work in <span className="text-indigo-400">PDF, DOCX, or Slides</span> format to complete this lesson.
                                </p>
                            </div>

                            <div className="pt-4">
                                <label className="cursor-pointer group block">
                                    <input 
                                        type="file" 
                                        className="hidden" 
                                        onChange={handleFileUpload}
                                        disabled={isUploading}
                                        accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                                    />
                                    <div className={cn(
                                        "inline-flex flex-col items-center gap-4 w-full sm:w-auto px-8 md:px-12 py-5 md:py-6 rounded-2xl md:rounded-[2rem] font-black uppercase tracking-widest text-[10px] md:text-[11px] transition-all duration-500 shadow-2xl relative overflow-hidden",
                                        isUploading 
                                            ? "bg-slate-800 text-slate-400" 
                                            : "bg-white text-slate-950 hover:bg-slate-100"
                                    )}>
                                        <div className="flex items-center gap-3">
                                            {isUploading ? (
                                                <>Uploading {progress}% <Loader2 className="w-4 h-4 animate-spin" /></>
                                            ) : (
                                                <>Select File & Upload <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                                            )}
                                        </div>
                                        
                                        {isUploading && (
                                            <div className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                                                <div 
                                                    className="h-full bg-indigo-500 transition-all duration-300"
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </label>
                            </div>

                            <div className="pt-6 flex items-center justify-center gap-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>Encrypted Transmission</span>
                            </div>
                        </div>
                    ) : (
                        <div className="relative z-10 space-y-10">
                            <div className="w-20 h-20 md:w-28 md:h-28 bg-emerald-500/10 rounded-[2rem] md:rounded-[3rem] flex items-center justify-center text-emerald-400 mx-auto border border-emerald-500/20 shadow-lg">
                                <FileCheck className="w-10 h-10 md:w-12 md:h-12" />
                            </div>

                            <div className="space-y-3">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[9px] font-black uppercase tracking-widest mb-1">
                                    <CheckCircle2 className="w-3 h-3" /> Submitted
                                </div>
                                <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">Assignment Received</h2>
                                <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-widest">
                                    File: <span className="text-slate-300">{submission.asset.original_name}</span>
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
                                <a 
                                    href={submission.asset.file_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex-1 flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 p-5 rounded-2xl font-bold text-[10px] md:text-[11px] uppercase tracking-wider transition-all"
                                >
                                    View File <ArrowUpRight className="w-4 h-4" />
                                </a>
                                <label className="flex-1 cursor-pointer">
                                    <input 
                                        type="file" 
                                        className="hidden" 
                                        onChange={handleFileUpload} 
                                        disabled={isUploading}
                                        accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                                    />
                                    <div className="flex items-center justify-center gap-3 bg-transparent hover:bg-white/5 text-slate-400 hover:text-white border border-white/5 hover:border-white/10 p-5 rounded-2xl font-bold text-[10px] md:text-[11px] uppercase tracking-wider transition-all">
                                        {isUploading ? `Uploading ${progress}%` : <>Replace File <X className="w-4 h-4" /></>}
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Guidance Panel */}
            <div className={cn(
                "p-6 md:p-12 rounded-3xl md:rounded-[4rem] border transition-all duration-1000",
                lessonComplete 
                    ? "bg-emerald-50 border-emerald-100" 
                    : "bg-white border-slate-100 shadow-sm",
                isFocusMode && "opacity-0 blur-xl translate-y-8"
            )}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
                    <div className="space-y-4 md:space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-700 border border-slate-100">
                                <FileText className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <h3 className="text-lg md:text-xl font-black text-slate-900 uppercase">Guidelines</h3>
                        </div>
                        <p className="text-xs md:text-sm text-slate-500 font-medium leading-relaxed">
                            Please ensure your assignment is clear and addresses all the points discussed in this lesson. Check for formatting and clarity before submitting.
                        </p>
                    </div>

                    <div className="space-y-4 md:space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-700 border border-slate-100">
                                <AlertCircle className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <h3 className="text-lg md:text-xl font-black text-slate-900 uppercase">Requirements</h3>
                        </div>
                        <ul className="space-y-3">
                            {['Maximum file size: 50MB', 'Accepted: PDF, Word, PowerPoint', 'Can be updated anytime before grading'].map((rule, i) => (
                                <li key={i} className="flex items-center gap-3 text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                                    <div className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-slate-200" />
                                    {rule}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
