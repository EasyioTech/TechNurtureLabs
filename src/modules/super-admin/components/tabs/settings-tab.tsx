import React, { useState, useEffect, useImperativeHandle, forwardRef, useRef } from 'react';
import { useAdminTheme, t } from '../../theme-context';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { generate2FASecret, enable2FA, disable2FA } from '@/actions/2fa';
import { 
    fetchAllClasses, 
    createClass, 
    deleteClass, 
    ensureDefaultClasses, 
    syncPlatformMetrics, 
    runDatabaseDiagnostics 
} from '@/modules/super-admin/actions';
import { DiagnosticsResult } from '@/modules/super-admin/types';
import { getSystemHealth } from '@/modules/super-admin/actions/redis-monitoring';

// Modular Sections
import { BrandingSection } from './settings/branding-section';
import { AcademicClassesSection } from './settings/classes-section';
import { HeroVideoSection } from './settings/hero-video-section';
import { SecuritySection } from './settings/security-section';
import { MaintenanceSection } from './settings/maintenance-section';
import { StorageSection } from './settings/storage-section';

// ─── Utility: Format bytes to human-readable size ──────────────────────────────
function formatBytes(bytes: number, decimals = 1): string {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

interface SettingsTabProps {
    // any props?
}

export interface SettingsTabRef {
    handleSave: () => void;
}

export const SettingsTab = forwardRef<SettingsTabRef, SettingsTabProps>(function SettingsTab(props, ref) {
    const { isDark, accent } = useAdminTheme();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Platform Identity States
    const [platformName, setPlatformName] = useState('TechNurture');
    const [logoUrl, setLogoUrl] = useState('');
    const [faviconUrl, setFaviconUrl] = useState('');
    const [logoUploading, setLogoUploading] = useState(false);
    const [faviconUploading, setFaviconUploading] = useState(false);
    const [logoLayout, setLogoLayout] = useState('landscape');
    const [showPlatformName, setShowPlatformName] = useState(true);
    const [logoHeight, setLogoHeight] = useState(40);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const faviconInputRef = useRef<HTMLInputElement>(null);

    // Hero Video States
    const [showHeroVideo, setShowHeroVideo] = useState(true);
    const [videoType, setVideoType] = useState<'youtube' | 'upload' | 'vimeo' | 'link' | 'stream'>('youtube');
    const [videoUrl, setVideoUrl] = useState('');

    // Security & 2FA States
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [show2FASetup, setShow2FASetup] = useState(false);
    const [qrCode, setQrCode] = useState('');
    const [tempSecret, setTempSecret] = useState('');
    const [otpToken, setOtpToken] = useState('');
    const [show2FADisable, setShow2FADisable] = useState(false);
    const [disableToken, setDisableToken] = useState('');
    const [disabling2FA, setDisabling2FA] = useState(false);
    const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

    // Password States
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);

    // Class Management States
    const [classesList, setClassesList] = useState<any[]>([]);
    const [classesLoading, setClassesLoading] = useState(true);
    const [newClassName, setNewClassName] = useState('');
    const [newClassLevel, setNewClassLevel] = useState('');
    const [classCreating, setClassCreating] = useState(false);
    const [deletingClassId, setDeletingClassId] = useState<string | null>(null);

    // System Maintenance States
    const [syncing, setSyncing] = useState(false);
    const [diagnosing, setDiagnosing] = useState(false);
    const [diagResults, setDiagResults] = useState<DiagnosticsResult | null>(null);

    // Storage Usage States
    const [storageData, setStorageData] = useState<any>(null);
    const [systemHealth, setSystemHealth] = useState<any>(null);
    const [storageLoading, setStorageLoading] = useState(false);
    const [storageError, setStorageError] = useState<string | null>(null);
    const [r2Scanning, setR2Scanning] = useState(false);

    // ─── Data Loading ───────────────────────────────────────────────────────────
    
    const loadClasses = async () => {
        setClassesLoading(true);
        try {
            await ensureDefaultClasses();
            const data = await fetchAllClasses();
            setClassesList(data);
        } catch (err) {
            console.error(err);
        } finally {
            setClassesLoading(false);
        }
    };

    const fetchStorageData = async () => {
        setStorageLoading(true);
        setStorageError(null);
        try {
            const [storageRes, healthData] = await Promise.all([
                fetch('/api/admin/storage-usage').then(r => {
                    if (!r.ok) throw new Error(`HTTP ${r.status}`);
                    return r.json();
                }),
                getSystemHealth(),
            ]);
            setStorageData(storageRes);
            setSystemHealth(healthData);
        } catch (e: any) {
            setStorageError(e.message || 'Failed to load storage data');
        } finally {
            setStorageLoading(false);
        }
    };

    useEffect(() => {
        // Fetch current settings
        fetch('/api/admin/settings')
            .then(res => res.json())
            .then(data => {
                if (data.settings) {
                    setVideoType(data.settings.hero_video_type || 'youtube');
                    setVideoUrl(data.settings.hero_video_url || '');
                    setLogoUrl(data.settings.logo_url || '');
                    setFaviconUrl(data.settings.favicon_url || '');
                    setPlatformName(data.settings.platform_name || 'TechNurture');
                    setLogoLayout(data.settings.logo_layout || 'landscape');
                    setShowPlatformName(data.settings.show_platform_name ?? true);
                    setLogoHeight(data.settings.logo_height || 40);
                    setShowHeroVideo(data.settings.show_hero_video ?? true);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                toast.error('Failed to load platform settings');
                setLoading(false);
            });

        // Check 2FA status
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => {
                setTwoFactorEnabled(data.user?.two_factor_enabled || false);
            });

        loadClasses();
        fetchStorageData();
    }, []);

    // ─── Event Handlers ─────────────────────────────────────────────────────────

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    hero_video_type: videoType,
                    hero_video_url: videoUrl,
                    logo_url: logoUrl,
                    favicon_url: faviconUrl,
                    platform_name: platformName,
                    logo_layout: logoLayout,
                    show_platform_name: showPlatformName,
                    logo_height: logoHeight,
                    show_hero_video: showHeroVideo,
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Settings updated successfully');
            } else {
                toast.error(data.error || 'Failed to update settings');
            }
        } catch (error) {
            console.error(error);
            toast.error('Network error while saving');
        } finally {
            setSaving(false);
        }
    };

    useImperativeHandle(ref, () => ({
        handleSave
    }));

    const handleBrandingUpload = async (file: File, type: 'logo' | 'favicon') => {
        const setUploading = type === 'logo' ? setLogoUploading : setFaviconUploading;
        const setUrl = type === 'logo' ? setLogoUrl : setFaviconUrl;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', type);

            const csrfToken = document.cookie
                .split('; ')
                .find(row => row.startsWith('csrf_token='))
                ?.split('=')[1];

            const res = await fetch('/api/branding/upload', {
                method: 'POST',
                body: formData,
                headers: csrfToken ? { 'x-csrf-token': csrfToken } : {}
            });
            const data = await res.json();
            if (data.success) {
                setUrl(data.url + '?v=' + Date.now());
                toast.success(`${type === 'logo' ? 'Logo' : 'Favicon'} uploaded successfully`);
            } else {
                toast.error(data.error || 'Upload failed');
            }
        } catch {
            toast.error('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleBrandingRemove = async (type: 'logo' | 'favicon') => {
        const setUrl = type === 'logo' ? setLogoUrl : setFaviconUrl;
        try {
            const csrfToken = document.cookie
                .split('; ')
                .find(row => row.startsWith('csrf_token='))
                ?.split('=')[1];

            const res = await fetch('/api/branding/upload', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    ...(csrfToken ? { 'x-csrf-token': csrfToken } : {})
                },
                body: JSON.stringify({ type }),
            });
            const data = await res.json();
            if (data.success) {
                setUrl('');
                toast.success(`${type === 'logo' ? 'Logo' : 'Favicon'} removed`);
            } else {
                toast.error(data.error || 'Remove failed');
            }
        } catch {
            toast.error('Remove failed');
        }
    };

    const handleCreateClass = async () => {
        if (!newClassName.trim() || !newClassLevel) {
            toast.error('Both class name and level are required');
            return;
        }
        setClassCreating(true);
        try {
            const result = await createClass(newClassName, parseInt(newClassLevel));
            if (result.success) {
                toast.success(`"${newClassName}" created successfully`);
                setNewClassName('');
                setNewClassLevel('');
                await loadClasses();
            } else {
                toast.error(result.error || 'Failed to create class');
            }
        } catch (err: any) {
            toast.error(err.message || 'Error creating class');
        } finally {
            setClassCreating(false);
        }
    };

    const handleDeleteClass = async (classId: string, className: string) => {
        if (!confirm(`Are you sure you want to delete "${className}"? This action cannot be undone.`)) return;
        setDeletingClassId(classId);
        try {
            const result = await deleteClass(classId);
            if (result.success) {
                toast.success(`"${className}" deleted`);
                await loadClasses();
            } else {
                toast.error(result.error || 'Failed to delete class');
            }
        } catch (err: any) {
            toast.error(err.message || 'Error deleting class');
        } finally {
            setDeletingClassId(null);
        }
    };

    const handleSetup2FA = async () => {
        try {
            const data = await generate2FASecret();
            setQrCode(data.qrCodeUrl);
            setTempSecret(data.secret);
            setShow2FASetup(true);
        } catch (error) {
            toast.error('Failed to initialize 2FA');
        }
    };

    const handleVerifyAndEnable2FA = async () => {
        if (otpToken.length !== 6) return;
        try {
            const result = await enable2FA(tempSecret, otpToken);
            if (result.success) {
                setTwoFactorEnabled(true);
                setShow2FASetup(false);
                setRecoveryCodes(result.recoveryCodes || []);
                toast.success('Two-factor authentication enabled');
            } else {
                toast.error(result.error || 'Identity verification failed');
            }
        } catch (error) {
            toast.error('Failed to enable 2FA');
        }
    };

    const handleDisable2FA = async () => {
        if (disableToken.length !== 6) return;
        setDisabling2FA(true);
        try {
            const result = await disable2FA(disableToken);
            if (result.success) {
                setTwoFactorEnabled(false);
                setShow2FADisable(false);
                setDisableToken('');
                setRecoveryCodes([]);
                toast.success('Two-factor authentication disabled');
            } else {
                toast.error(result.error || 'Verification failed');
            }
        } catch (error) {
            toast.error('Failed to disable 2FA');
        } finally {
            setDisabling2FA(false);
        }
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword) return;
        setChangingPassword(true);
        try {
            const res = await fetch('/api/auth/password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword })
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Password updated successfully');
                setCurrentPassword('');
                setNewPassword('');
            } else {
                toast.error(data.error || 'Failed to update password');
            }
        } catch (error) {
            toast.error('Network error');
        } finally {
            setChangingPassword(false);
        }
    };

    const handleScanR2 = async () => {
        setR2Scanning(true);
        try {
            const res = await fetch('/api/admin/storage-usage?scanR2=true');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setStorageData(data);
        } catch (e: any) {
            toast.error('R2 scan failed: ' + (e.message || 'Unknown error'));
        } finally {
            setR2Scanning(false);
        }
    };

    const handleSyncMetrics = async () => {
        setSyncing(true);
        try {
            const res = await syncPlatformMetrics();
            if (res.success) toast.success("Metrics synchronized");
            else toast.error("Sync failed");
        } catch { toast.error("Network error"); }
        finally { setSyncing(false); }
    };

    const handleRunDiagnostics = async () => {
        setDiagnosing(true);
        try {
            const res = await runDatabaseDiagnostics();
            setDiagResults(res);
            if (res.status === 'ok') {
                toast.success('Database diagnostics: All clear');
            } else {
                toast.error(`Found ${res.issues.length} issue${res.issues.length > 1 ? 's' : ''}`);
            }
        } catch (err: any) {
            toast.error('Diagnostics failed: ' + err.message);
            console.error(err);
        } finally {
            setDiagnosing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className={`animate-spin ${accent.text}`} size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <BrandingSection 
                platformName={platformName}
                setPlatformName={setPlatformName}
                logoUrl={logoUrl}
                logoUploading={logoUploading}
                onLogoUpload={(file) => handleBrandingUpload(file, 'logo')}
                onLogoRemove={() => handleBrandingRemove('logo')}
                faviconUrl={faviconUrl}
                faviconUploading={faviconUploading}
                onFaviconUpload={(file) => handleBrandingUpload(file, 'favicon')}
                onFaviconRemove={() => handleBrandingRemove('favicon')}
                logoLayout={logoLayout}
                setLogoLayout={setLogoLayout}
                logoHeight={logoHeight}
                setLogoHeight={setLogoHeight}
                showPlatformName={showPlatformName}
                setShowPlatformName={setShowPlatformName}
                logoInputRef={logoInputRef}
                faviconInputRef={faviconInputRef}
            />

            <AcademicClassesSection 
                classesList={classesList}
                classesLoading={classesLoading}
                newClassName={newClassName}
                setNewClassName={setNewClassName}
                newClassLevel={newClassLevel}
                setNewClassLevel={setNewClassLevel}
                classCreating={classCreating}
                deletingClassId={deletingClassId}
                onCreateClass={handleCreateClass}
                onDeleteClass={handleDeleteClass}
            />

            <HeroVideoSection 
                showHeroVideo={showHeroVideo}
                setShowHeroVideo={setShowHeroVideo}
                videoType={videoType}
                setVideoType={setVideoType}
                videoUrl={videoUrl}
                setVideoUrl={setVideoUrl}
                saving={saving}
                onSave={handleSave}
            />

            <SecuritySection 
                twoFactorEnabled={twoFactorEnabled}
                show2FASetup={show2FASetup}
                qrCode={qrCode}
                otpToken={otpToken}
                setOtpToken={setOtpToken}
                onSetup2FA={handleSetup2FA}
                onVerify2FA={handleVerifyAndEnable2FA}
                show2FADisable={show2FADisable}
                setShow2FADisable={setShow2FADisable}
                disableToken={disableToken}
                setDisableToken={setDisableToken}
                disabling2FA={disabling2FA}
                onDisable2FA={handleDisable2FA}
                recoveryCodes={recoveryCodes}
                currentPassword={currentPassword}
                setCurrentPassword={setCurrentPassword}
                newPassword={newPassword}
                setNewPassword={setNewPassword}
                changingPassword={changingPassword}
                onChangePassword={handleChangePassword}
            />

            <MaintenanceSection 
                syncing={syncing}
                onSyncMetrics={handleSyncMetrics}
                diagnosing={diagnosing}
                diagResults={diagResults}
                onRunDiagnostics={handleRunDiagnostics}
            />

            <StorageSection 
                storageLoading={storageLoading}
                storageError={storageError}
                storageData={storageData}
                systemHealth={systemHealth}
                onRefreshStorage={fetchStorageData}
                r2Scanning={r2Scanning}
                onScanR2={handleScanR2}
                formatBytes={formatBytes}
            />
        </div>
    );
});
