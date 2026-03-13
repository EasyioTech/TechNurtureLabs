import { StudentSidebar } from '@/modules/student/components/sidebar';
import { getStudentDashboardData } from '@/modules/student/actions';
import { getPlatformSettings } from '@/components/landing/actions';
import { StudentLayoutShell } from '@/modules/student/components/layout-shell';

export default async function StudentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [data, settings] = await Promise.all([
        getStudentDashboardData().catch(() => null),
        getPlatformSettings().catch(() => null)
    ]);

    const sidebar = (
        <StudentSidebar
            school={data?.school}
            stats={data?.stats}
            courses={data?.courses}
            settings={settings}
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
