'use client';

import React from 'react';
import { School, Globe, Shield, BarChart3, Lock } from 'lucide-react';
import { AuthSidebar } from './AuthSidebar';

export const SchoolLoginSidebar = ({ settings }: { settings?: any }) => {
    return (
        <AuthSidebar
            settings={settings}
            portalIcon={<School className="text-white" size={18} />}
            portalLabel="School Portal"
            illustration="/illustrations/business-charts.svg"
            illustrationAlt="Management Intelligence"
            headline={
                <>
                    Manage your <br />
                    <span className="text-blue-600">institution</span> with precision.
                </>
            }
            subtitle="Access your unified command center for academic excellence and operational efficiency."
            features={[
                { icon: <Globe size={16} />, label: "Global Reach", desc: "Whitelabel ready." },
                { icon: <Shield size={16} />, label: "Secure Data", desc: "Vault-level encryption." },
                { icon: <BarChart3 size={16} />, label: "Analytics", desc: "Real-time insights." },
                { icon: <Lock size={16} />, label: "Access Control", desc: "Granular permissions." },
            ]}
            socialProofLabel="Trusted by 500+ Admins"
            badgeLabel="Verified Gateway"
            badgeColor="text-emerald-600"
            avatarSeeds={['Admin4', 'Admin5', 'Admin6']}
        />
    );
};
