import { StudentSidebar } from '@/modules/student/components/sidebar';
import { getStudentProfileAndStats, getStudentDashboardCourses } from '@/modules/student/actions';
import { getPlatformSettings } from '@/components/landing/actions';
import { StudentLayoutShell } from '@/modules/student/components/layout-shell';

export default async function StudentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [profileStats, coursesData, settings] = await Promise.all([
        getStudentProfileAndStats().catch(() => null),
        getStudentDashboardCourses().catch(() => null),
        getPlatformSettings().catch(() => null)
    ]);

    const data = profileStats ? {
        ...profileStats,
        courses: coursesData?.courses || []
    } : null;

    const sidebar = (
        <StudentSidebar
            school={data?.school}
            stats={data?.stats}
            courses={data?.courses}
            settings={settings}
            profile={data?.profile}
        />
    );

    return (
        <StudentLayoutShell 
            sidebar={sidebar}
            profile={data?.profile}
            school={data?.school}
            stats={data?.stats}
            settings={settings}
        >
            {children}
        </StudentLayoutShell>
    );
}
