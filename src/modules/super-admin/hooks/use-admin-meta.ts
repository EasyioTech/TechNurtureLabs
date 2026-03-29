'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
    fetchAdminStats,
    fetchAdminMetadata,
    fetchAdminOverviewExtras,
    savePlanAdmin,
    deletePlanAdmin,
    savePromoCode as savePromoCodeAction,
    deletePromoCode as deletePromoCodeAction,
    syncPlatformMetrics,
} from '../actions';
import { Stats, PaymentPlan, PromoCode } from '../types';

const DEFAULT_STATS: Stats = {
    totalStudents: 0, activeStudents: 0,
    totalSchools: 0, activeSchools: 0,
    totalCourses: 0, publishedCourses: 0,
    totalLessons: 0, totalXp: 0, avgCompletion: 0,
    totalRevenue: 0, activeSubscriptions: 0,
    trialingSubscriptions: 0, activePlansPercentage: 0,
    activeUsers30d: 0, mrr: 0, arr: 0, pcu: 0, dau: 0, mau: 0,
};

export function useAdminMeta() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<Stats>(DEFAULT_STATS);
    const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>([]);
    const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [platformSettings, setPlatformSettings] = useState<any | null>(null);
    const [platformMetrics, setPlatformMetrics] = useState<any[]>([]);
    const [loginHeatmap, setLoginHeatmap] = useState<number[][]>(
        Array.from({ length: 7 }, () => Array(24).fill(0))
    );

    // Dialog state for plans + promos
    const [showPlanDialog, setShowPlanDialog] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Partial<PaymentPlan> | null>(null);
    const [showPromoCodeDialog, setShowPromoCodeDialog] = useState(false);
    const [editingPromoCode, setEditingPromoCode] = useState<Partial<PromoCode> | null>(null);

    async function fetchInitialData() {
        setLoading(true);
        try {
            const [statsData, metaData, extras] = await Promise.all([
                fetchAdminStats(),
                fetchAdminMetadata(),
                fetchAdminOverviewExtras(),
            ]);
            setStats(statsData);
            setPaymentPlans(metaData.plans);
            setPromoCodes(metaData.promoCodes);
            setClasses(metaData.classes);
            setPlatformSettings(metaData.platformSettings);
            setPlatformMetrics(metaData.platformMetrics);
            setLoginHeatmap(extras.loginHeatmap);
        } catch (err: any) {
            if (err?.message === 'UNAUTHORIZED') {
                window.location.href = '/admin-portal/login';
                return;
            }
            toast.error('Failed to load dashboard stats');
        } finally {
            setLoading(false);
        }
    }

    // Surgical refresh — only reloads plans + promos, not stats/metrics
    async function refreshPlansAndPromos() {
        try {
            const metaData = await fetchAdminMetadata();
            setPaymentPlans(metaData.plans);
            setPromoCodes(metaData.promoCodes);
        } catch {
            toast.error('Failed to refresh plans');
        }
    }

    async function savePlan() {
        if (!editingPlan?.name) { toast.error('Plan name is required'); return; }
        try {
            await savePlanAdmin({
                id: editingPlan.id, name: editingPlan.name,
                description: editingPlan.description || '', price: editingPlan.price || 0,
                billing_cycle: editingPlan.billing_cycle || 'monthly',
                currency: editingPlan.currency || 'INR',
                features: editingPlan.features || [], max_students: editingPlan.max_students,
                trial_days: editingPlan.trial_days || 0,
                is_active: editingPlan.is_active ?? true,
            });
            toast.success(editingPlan.id ? 'Plan updated' : 'Plan created');
        } catch (err: any) {
            if (err?.message === 'UNAUTHORIZED') { window.location.href = '/admin-portal/login'; return; }
            toast.error(err?.message || 'Failed to save plan'); return;
        }
        setShowPlanDialog(false);
        setEditingPlan(null);
        await refreshPlansAndPromos();
    }

    async function deletePlan(id: string) {
        try {
            await deletePlanAdmin(id);
            toast.success('Plan deleted');
            await refreshPlansAndPromos();
        } catch { toast.error('Failed to delete plan'); }
    }

    async function savePromoCode() {
        if (!editingPromoCode?.code) { toast.error('Promo Code is required'); return; }
        if (!editingPromoCode?.discount_type) { toast.error('Discount Type is required'); return; }
        if (editingPromoCode.discount_value == null || Number(editingPromoCode.discount_value) <= 0) {
            toast.error('Valid Discount Value is required'); return;
        }
        try {
            await savePromoCodeAction({
                id: editingPromoCode.id, code: editingPromoCode.code,
                discount_type: editingPromoCode.discount_type,
                discount_value: editingPromoCode.discount_value,
                max_uses: editingPromoCode.max_uses,
                valid_from: editingPromoCode.valid_from,
                valid_until: editingPromoCode.valid_until,
                is_active: editingPromoCode.is_active ?? true,
            });
            toast.success(editingPromoCode.id ? 'Promo Code updated' : 'Promo Code created');
        } catch (err: any) {
            if (err?.message === 'UNAUTHORIZED') { window.location.href = '/admin-portal/login'; return; }
            toast.error(err?.message || 'Failed to save promo code'); return;
        }
        setShowPromoCodeDialog(false);
        setEditingPromoCode(null);
        await refreshPlansAndPromos();
    }

    async function deletePromoCode(id: string) {
        try {
            await deletePromoCodeAction(id);
            toast.success('Promo Code deleted');
            await refreshPlansAndPromos();
        } catch { toast.error('Failed to delete promo code'); }
    }

    async function syncMetrics() {
        try {
            const res = await syncPlatformMetrics();
            if (res.success) {
                toast.success('Metrics synced');
                await fetchInitialData();
            } else throw new Error();
        } catch { toast.error('Sync failed'); }
    }

    return {
        loading, setLoading,
        stats,
        paymentPlans, promoCodes,
        classes, platformSettings, platformMetrics, loginHeatmap,
        fetchInitialData,
        showPlanDialog, setShowPlanDialog, editingPlan, setEditingPlan,
        showPromoCodeDialog, setShowPromoCodeDialog, editingPromoCode, setEditingPromoCode,
        savePlan, deletePlan, savePromoCode, deletePromoCode, syncMetrics,
    };
}
