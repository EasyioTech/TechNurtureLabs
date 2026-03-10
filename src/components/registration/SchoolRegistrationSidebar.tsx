'use client';

import React from 'react';
import { School, Globe, Shield, BarChart3 } from 'lucide-react';
import { AuthSidebar } from './AuthSidebar';

export const SchoolRegistrationSidebar = ({ settings }: { settings?: any }) => {
    return (
        <AuthSidebar
            settings={settings}
            portalIcon={<School className="text-white" size={18} />}
            portalLabel="School Registration"
            illustration="/illustrations/learning.svg"
            illustrationAlt="Campus Solution"
            headline={
                <>
                    A comprehensive <br />
                    <span className="text-blue-600">campus</span> solution.
                </>
            }
            subtitle="Transform your institution with an all-in-one platform designed for digital-first students."
            features={[
                { icon: <Globe size={16} />, label: "Whitelabel Infrastructure", desc: "Your brand, our engine." },
                { icon: <Shield size={16} />, label: "Data Sovereignty", desc: "Enterprise-grade protection." },
                { icon: <BarChart3 size={16} />, label: "Performance Intelligence", desc: "Real-time analytics." },
            ]}
            socialProofLabel="50+ Schools Onboarded"
            badgeLabel="Enterprise Ready"
            badgeColor="text-blue-600"
            avatarSeeds={['HS1', 'HS2', 'HS3']}
        />
    );
};
