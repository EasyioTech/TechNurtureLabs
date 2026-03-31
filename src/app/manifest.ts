import type { MetadataRoute } from 'next';
import { getPlatformSettings } from '@/components/landing/actions';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
    const settings = await getPlatformSettings();
    const name = settings?.platform_name ?? 'TechNurture Labs';
    const short = name.length > 12 ? name.split(' ')[0] : name;

    return {
        name,
        short_name: short,
        description: 'Your school learning portal — courses, quests, and leaderboards.',
        start_url: '/student',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#ffffff',
        theme_color: '#4f46e5',
        categories: ['education'],
        icons: [
            {
                src: '/api/branding/favicon',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any',
            },
            {
                src: '/api/branding/favicon',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable',
            },
        ],
        shortcuts: [
            {
                name: 'My Courses',
                url: '/student/courses',
                description: 'Jump to your enrolled courses',
            },
            {
                name: 'Leaderboard',
                url: '/student/leaderboard',
                description: 'See school rankings',
            },
        ],
    };
}
