'use client';

import React from 'react';
import { GraduationCap, Zap, Trophy } from 'lucide-react';
import { AuthSidebar } from './AuthSidebar';

export const StudentLoginSidebar = ({ settings }: { settings?: any }) => {
    return (
        <AuthSidebar
            settings={settings}
            portalIcon={<GraduationCap className="text-white" size={18} />}
            portalLabel="Student Portal"
            illustration="/illustrations/hero-learning.svg"
            illustrationAlt="Learning Illustration"
            headline={
                <>
                    Continue your <br />
                    <span className="text-blue-600">learning</span> journey.
                </>
            }
            subtitle="Access your courses, track milestones, and continue building your future."
            features={[
                { icon: <Zap size={16} />, label: "Daily Streaks", desc: "Build learning habits." },
                { icon: <Trophy size={16} />, label: "Achievements", desc: "Earn badges and rewards." },
            ]}
            socialProofLabel="Join 12k+ Learners"
            badgeLabel="Secure Access"
            badgeColor="text-emerald-600"
            avatarSeeds={['student7', 'student8', 'student9']}
        />
    );
};
