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
    const [uploading, setUploading] = useState(false);
    const [submission, setSubmission] = useState<any>(null);
    const [loadingStatus, setLoadingStatus] = useState(true);

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

        setUploading(true);
        const loadingId = toast.loading("Encrypting and uploading to vault...");

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('contextType', 'lesson');
            formData.append('contextId', lessonId);

            const res = await fetch('/api/upload', { 
                method: 'POST', 
                body: formData 
            });
            
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            // Save submission record
            await submitAssignment(lessonId, data.assetId);
            
            // Refresh status
            const newStatus = await getSubmissionStatus(lessonId);
            setSubmission(newStatus);
            
            toast.success("Assignment securely submitted", { id: loadingId });
            onComplete();
        } catch (err: any) {
            toast.error(err.message || "Failed to upload submission", { id: loadingId });
        } finally {
            setUploading(false);
        }
    };

    if (loadingStatus) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Initializing Vault</p>
                </div>
            </div>
        );
    }

    return (
        <div className={cn("max-w-4xl mx-auto space-y-12 transition-all duration-1000", className)}>
            {/* ── Main Submission Zone ── */}
            <div className={cn(
                "relative p-1 bg-slate-950 rounded-[3.5rem] overflow-hidden transition-all duration-1000",
                isFocusMode ? "shadow-[0_0_120px_-20px_rgba(79,70,229,0.3)] scale-[1.02]" : "shadow-3xl shadow-indigo-900/40"
            )}>
                <div className="relative rounded-[3.2rem] overflow-hidden bg-slate-900/50 backdrop-blur-3xl border border-white/5 p-12 lg:p-20 text-center">
                    {/* Ambient Glows */}
                    <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2" />
                    <div className="absolute bottom-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2" />

                    {!submission ? (
                        <div className="relative z-10 space-y-10">
                            <div className="w-24 h-24 bg-indigo-500/10 rounded-[2.5rem] flex items-center justify-center text-indigo-400 mx-auto border border-indigo-500/20 group hover:scale-110 transition-transform duration-500">
                                <Upload size={40} className="group-hover:-translate-y-1 transition-transform" />
                            </div>
                            
                            <div className="space-y-4">
                                <h2 className="text-4xl font-black text-white uppercase tracking-tight">Mission Portal</h2>
                                <p className="text-sm text-slate-400 font-bold max-w-md mx-auto leading-relaxed uppercase tracking-widest">
                                    Present your resolution in <span className="text-indigo-400 font-black">PDF, DOCX, or Slides</span> format to proceed to the next stage.
                                </p>
                            </div>

                            <div className="pt-6">
                                <label className="cursor-pointer group">
                                    <input 
                                        type="file" 
                                        className="hidden" 
                                        onChange={handleFileUpload} 
                                        disabled={uploading}
                                        accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                                    />
                                    <div className={cn(
                                        "inline-flex items-center gap-4 px-12 py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] transition-all duration-500 shadow-2xl relative overflow-hidden",
                                        uploading 
                                            ? "bg-slate-800 text-slate-400 cursor-not-allowed" 
                                            : "bg-white text-slate-950 hover:bg-indigo-500 hover:text-white"
                                    )}>
                                        {uploading ? (
                                            <>Encrypting... <Loader2 size={16} className="animate-spin" /></>
                                        ) : (
                                            <>Unseal & Upload <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" /></>
                                        )}
                                        {/* Shimmer effect */}
                                        {!uploading && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />}
                                    </div>
                                </label>
                            </div>

                            <div className="pt-8 flex items-center justify-center gap-3 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">
                                <ShieldCheck size={14} className="text-indigo-500/50" />
                                <span>Secured End-to-End Vault</span>
                            </div>
                        </div>
                    ) : (
                        <div className="relative z-10 space-y-12">
                            <div className="w-28 h-28 bg-emerald-500/10 rounded-[3rem] flex items-center justify-center text-emerald-400 mx-auto border border-emerald-500/20 shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)]">
                                <FileCheck size={48} />
                            </div>

                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-2">
                                    <CheckCircle2 size={12} /> Submission Verified
                                </div>
                                <h2 className="text-3xl font-black text-white uppercase tracking-tight">Stage Resolution Saved</h2>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                                    Artifact: <span className="text-slate-300">{submission.asset.original_name}</span>
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
                                <a 
                                    href={submission.asset.file_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 p-5 rounded-2xl font-bold text-[11px] uppercase tracking-wider transition-all"
                                >
                                    Review File <ArrowUpRight size={16} />
                                </a>
                                <label className="cursor-pointer">
                                    <input 
                                        type="file" 
                                        className="hidden" 
                                        onChange={handleFileUpload} 
                                        disabled={uploading}
                                        accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                                    />
                                    <div className="flex items-center justify-center gap-3 bg-transparent hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-white/5 hover:border-rose-500/20 p-5 rounded-2xl font-bold text-[11px] uppercase tracking-wider transition-all">
                                        Update Submission <X size={16} />
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Guidance Panel ── */}
            <div className={cn(
                "p-12 rounded-[4rem] border transition-all duration-1000",
                lessonComplete 
                    ? "bg-emerald-50/20 border-emerald-100" 
                    : "bg-white border-slate-100 shadow-3xl shadow-slate-200/50",
                isFocusMode && "opacity-0 blur-2xl scale-95 pointer-events-none translate-y-12"
            )}>
                <div className="flex flex-col lg:flex-row gap-12 text-left">
                    <div className="flex-1 space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                                <FileText size={24} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Strategic Guidelines</h3>
                        </div>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed">
                            Your submission will be analyzed based on structural integrity, depth of resolution, and adherence to the core patterns established in this module. Ensure all artifacts are clear and legible.
                        </p>
                    </div>

                    <div className="lg:w-px lg:h-auto bg-slate-100" />

                    <div className="flex-1 space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
                                <AlertCircle size={24} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Submission Protocol</h3>
                        </div>
                        <ul className="space-y-3">
                            {['Max artifact size: 50MB', 'High-fidelity formats preferred', 'Versioning sustained in vault'].map((rule, i) => (
                                <li key={i} className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
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
