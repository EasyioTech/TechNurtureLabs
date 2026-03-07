import { StudentSidebar } from '@/modules/student/components/sidebar';
import { getStudentDashboardData } from '@/modules/student/actions';

export default async function StudentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const data = await getStudentDashboardData().catch(() => null);

    return (
        <div className="flex min-h-screen bg-slate-50">
            <StudentSidebar
                school={data?.school}
                stats={data?.stats}
                courses={data?.courses}
            />
            <div className="flex-1 flex flex-col min-w-0">
                {children}
            </div>
        </div>
    );
}
