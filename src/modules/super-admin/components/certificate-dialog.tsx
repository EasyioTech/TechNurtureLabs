'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Award, Trash2 } from 'lucide-react';
import { useAdminTheme, t } from '../theme-context';
import type { CertificateConfig } from '../actions/sub-actions/certificate-actions';

interface CertificateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingCert: Partial<CertificateConfig> | null;
    setEditingCert: (c: Partial<CertificateConfig> | null) => void;
    onSave: () => Promise<void>;
    onDelete?: () => Promise<void>;
}

export function CertificateDialog({
    open, onOpenChange, editingCert, setEditingCert, onSave, onDelete,
}: CertificateDialogProps) {
    const { isDark, accent } = useAdminTheme();
    const isEdit = !!editingCert?.id;

    const update = (patch: Partial<CertificateConfig>) =>
        setEditingCert({ ...editingCert, ...patch });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={`w-[90vw] max-w-[520px] rounded-[28px] border-0 shadow-2xl p-0 overflow-hidden gap-0 ${isDark ? 'bg-[#0f1219]' : 'bg-white'}`}>
                {/* Header */}
                <div className={`px-8 pt-8 pb-6 border-b ${t.border(isDark)} shrink-0`}>
                    <div className="flex items-center gap-4 mb-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDark ? 'bg-amber-400/10 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>
                            <Award size={22} />
                        </div>
                        <div>
                            <DialogTitle className={`text-lg font-[1000] tracking-tight ${t.textPrimary(isDark)}`}>
                                {isEdit ? 'Edit Certificate' : 'Add Certificate'}
                            </DialogTitle>
                            <DialogDescription className="sr-only">
                                Configure the certificate awarded on course completion
                            </DialogDescription>
                            <p className={`text-[11px] font-bold mt-0.5 ${t.textMuted(isDark)}`}>
                                Configure the certificate awarded on course completion
                            </p>
                        </div>
                    </div>
                </div>

                {/* Body - Scrollable on small screens */}
                <div className="max-h-[60vh] overflow-y-auto px-8 py-6 space-y-5 custom-scrollbar">
                    {/* Title */}
                    <div className="space-y-2">
                        <Label className={`text-[11px] font-black uppercase tracking-widest ${t.textMuted(isDark)}`}>
                            Certificate Title *
                        </Label>
                        <Input
                            value={editingCert?.title ?? ''}
                            onChange={e => update({ title: e.target.value })}
                            placeholder="e.g. Certificate of Completion"
                            className={`h-11 rounded-xl border text-sm font-medium ${t.inputBg(isDark)} ${t.border(isDark)}`}
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label className={`text-[11px] font-black uppercase tracking-widest ${t.textMuted(isDark)}`}>
                            Description (appears on certificate)
                        </Label>
                        <Textarea
                            value={editingCert?.description ?? ''}
                            onChange={e => update({ description: e.target.value })}
                            placeholder="This certifies that the above-named student has successfully completed..."
                            className={`rounded-xl border text-sm font-medium resize-none ${t.inputBg(isDark)} ${t.border(isDark)}`}
                            rows={3}
                        />
                    </div>

                    {/* Min progress */}
                    <div className="space-y-2">
                        <Label className={`text-[11px] font-black uppercase tracking-widest ${t.textMuted(isDark)}`}>
                            Minimum Progress Required (%)
                        </Label>
                        <div className="flex items-center gap-3">
                            <input
                                type="range"
                                min={1}
                                max={100}
                                value={Number(editingCert?.min_progress_pct ?? 100)}
                                onChange={e => update({ min_progress_pct: e.target.value as any })}
                                className="flex-1 accent-amber-400"
                            />
                            <span className={`text-sm font-black w-12 text-center ${t.textPrimary(isDark)}`}>
                                {Number(editingCert?.min_progress_pct ?? 100)}%
                            </span>
                        </div>
                        <p className={`text-[10px] font-medium ${t.textMuted(isDark)}`}>
                            Students must reach this progress level to qualify for a certificate.
                        </p>
                    </div>

                    {/* Active toggle */}
                    <div className={`flex items-center justify-between p-4 rounded-2xl border ${t.border(isDark)} ${isDark ? 'bg-white/[0.02]' : 'bg-slate-50'}`}>
                        <div>
                            <p className={`text-sm font-black ${t.textPrimary(isDark)}`}>Certificate Active</p>
                            <p className={`text-[11px] font-medium ${t.textMuted(isDark)}`}>Disable to pause certificate issuance without deleting</p>
                        </div>
                        <Switch
                            checked={editingCert?.is_active ?? true}
                            onCheckedChange={v => update({ is_active: v })}
                            className={`data-[state=checked]:bg-amber-400`}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className={`px-8 py-5 flex items-center gap-3 border-t shrink-0 ${t.border(isDark)} ${isDark ? 'bg-white/[0.02]' : 'bg-slate-50/80'}`}>
                    {isEdit && onDelete && (
                        <Button
                            variant="ghost"
                            onClick={onDelete}
                            className={`h-11 w-11 p-0 rounded-full text-rose-500 hover:bg-rose-500/10 border border-rose-400/20 flex-shrink-0`}
                        >
                            <Trash2 size={16} />
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className={`flex-1 h-11 rounded-full font-bold text-sm ${isDark ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'}`}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={onSave}
                        disabled={!editingCert?.title}
                        className={`flex-1 h-11 rounded-full font-black text-sm shadow-xl border-0 bg-amber-400 hover:bg-amber-300 text-slate-900`}
                    >
                        {isEdit ? 'Save Changes' : 'Add Certificate'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
