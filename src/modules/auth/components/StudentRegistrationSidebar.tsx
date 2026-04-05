'use client';

import React from 'react';
import { GraduationCap, UserCircle2, Zap, Trophy } from 'lucide-react';
import { AuthSidebar } from './AuthSidebar';

export const StudentRegistrationSidebar = ({ settings }: { settings?: any }) => {
    return (
        <AuthSidebar
            settings={settings}
            portalIcon={<GraduationCap className="text-white" size={18} />}
            portalLabel="Student Registration"
            illustration="/illustrations/hero-learning.svg"
            illustrationAlt="Learning Illustration"
            headline={
                <>
                    A modern <br />
                    <span className="text-blue-600">learning</span> experience.
                </>
            }
            subtitle="Transform the way you learn with world-class resources designed for your academic growth."
            features={[
                { icon: <UserCircle2 size={16} />, label: "Smart Profile", desc: "Interactive dashboard." },
                { icon: <Zap size={16} />, label: "Fast Track", desc: "Adaptive learning." },
                { icon: <Trophy size={16} />, label: "Global Ranking", desc: "Compete with peers." },
            ]}
            socialProofLabel="12k+ Active Students"
            badgeLabel="Accredited"
            badgeColor="text-blue-600"
            avatarSeeds={['student1', 'student2', 'student3', 'student4']}
        />
    );
};
