'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Compass, Search, Sparkles, Zap, Star,
    ArrowRight, LayoutGrid, Play, Filter,
    Monitor, Cpu, Globe, Award
} from 'lucide-react';
import { getStudentDashboardData } from '@/modules/student/actions';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export default function ExplorePage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        async function load() {
            try {
                const result = await getStudentDashboardData();
                setData(result);
            } catch (err) {
                console.error(err);
            }
            setLoading(false);
        }
        load();
    }, []);

    if (loading) {
        return <div className="p-12"><Skeleton className="h-96 w-full rounded-[3rem]" /></div>;
    }

    const categoryStyles: any = {
        'Programming': { icon: Cpu, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
        'Computer Science': { icon: Monitor, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
        'Networking': { icon: Globe, color: 'text-amber-600 bg-amber-50 border-amber-100' },
        'Robotics': { icon: Zap, color: 'text-rose-600 bg-rose-50 border-rose-100' },
        'General': { icon: Award, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
        'Technology': { icon: Monitor, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
    };

    const categories = (data?.categories || []).map((cat: any) => ({
        ...cat,
        ...(categoryStyles[cat.name] || categoryStyles['General'])
    }));

    const topics = data?.topics?.length > 0 ? data.topics : ['Python', 'Web Development', 'Robotics', 'Graphic Design'];

    const featuredCourses = data?.courses?.slice(0, 4) || [];

    return (
        <div className="min-h-screen bg-white pb-32">
            {/* Search Section */}
            <div className="relative pt-20 pb-20 px-6 lg:px-12 bg-slate-950 overflow-hidden border-b border-white/5">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[120%] bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.1)_0%,_transparent_70%)] pointer-events-none" />

                <div className="max-w-[1200px] mx-auto relative z-10 text-center">
                    <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-emerald-400 mb-10">
                        <Sparkles size={16} fill="currentColor" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Discover New Skills</span>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tight leading-none mb-10">
                        Find Your Next <br />
                        <span className="text-indigo-500">Learning Adventure</span>
                    </h1>

                    <div className="relative max-w-2xl mx-auto group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={24} />
                        <input
                            type="text"
                            placeholder="WHAT WOULD YOU LIKE TO LEARN?"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-20 pl-16 pr-8 bg-white/5 border-2 border-white/10 rounded-3xl text-sm font-black text-white uppercase tracking-widest placeholder:text-slate-600 focus:border-indigo-500/50 focus:bg-white/10 transition-all outline-none shadow-2xl"
                        />
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-4 mt-12">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-4">Popular Topics:</p>
                        {topics.slice(0, 5).map((tag: string) => (
                            <button key={tag} className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all">
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <main className="max-w-[1400px] mx-auto px-6 lg:px-12 py-20">
                {/* Categories */}
                <section className="mb-24">
                    <div className="flex items-center justify-between mb-12">
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">Course Categories</h3>
                        <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50">
                            See All <ArrowRight size={14} className="ml-2" />
                        </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {categories.map((cat: any, i: number) => (
                            <div key={i} className="group relative p-8 rounded-[3rem] bg-slate-50 border border-slate-100 hover:bg-white hover:border-indigo-100 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all cursor-pointer">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 border transition-all group-hover:scale-110 ${cat.color}`}>
                                    <cat.icon size={28} />
                                </div>
                                <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2 leading-none">{cat.name}</h4>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{cat.count} Courses</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Featured / Recommended */}
                <section>
                    <div className="mb-12">
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none mb-4">Recommended Courses</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selected for your learning level</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        {/* Highlights Banner */}
                        <div className="lg:col-span-4 rounded-[4rem] bg-indigo-600 p-12 text-white relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[100px] group-hover:scale-125 transition-transform duration-700" />
                            <Badge className="bg-white/20 text-white border-0 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] mb-8">Featured Course</Badge>
                            <h4 className="text-3xl font-black uppercase tracking-tight leading-none mb-8">
                                {featuredCourses[0]?.title || 'Expand Your Knowledge'}
                            </h4>
                            <p className="text-indigo-100 font-bold text-xs uppercase tracking-widest leading-relaxed mb-12 line-clamp-3">
                                {featuredCourses[0]?.description || 'Dive into our newest interactive lessons designed to challenge and inspire you.'}
                            </p>
                            {featuredCourses[0] && (
                                <Link href={`/student/course/${featuredCourses[0].id}`}>
                                    <Button className="w-full h-16 bg-white text-indigo-600 font-black uppercase tracking-widest text-[10px] rounded-[2rem] hover:bg-slate-100 transition-all flex items-center justify-center gap-3 group">
                                        Start Learning <Play size={14} fill="currentColor" className="group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </Link>
                            )}
                        </div>

                        {/* Course List */}
                        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                            {featuredCourses.length > 0 ? featuredCourses.map((course: any) => (
                                <div key={course.id} className="bg-white border border-slate-100 rounded-[3rem] p-8 hover:shadow-2xl hover:shadow-slate-200/50 transition-all group">
                                    <div className="aspect-[16/10] bg-slate-50 rounded-[2.5rem] mb-6 overflow-hidden border border-slate-100 flex items-center justify-center p-8 group-hover:bg-slate-100 transition-colors">
                                        <Monitor size={48} className="text-slate-200 group-hover:text-indigo-200 transition-colors" />
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <Star size={12} className="text-amber-500" fill="currentColor" />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">New Arrival</span>
                                        </div>
                                        <h5 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-tight group-hover:text-indigo-600 transition-colors">{course.title}</h5>
                                        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{course.totalLessons} Lessons</span>
                                            <Link href={`/student/course/${course.id}`}>
                                                <Button variant="ghost" className="h-10 px-0 hover:bg-transparent text-indigo-600 font-black uppercase tracking-widest text-[10px] group-hover:translate-x-1 transition-all">
                                                    Details <ArrowRight size={14} className="ml-2" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="col-span-full py-20 bg-slate-50 rounded-[3rem] border border-slate-100 border-dashed flex items-center justify-center text-center">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No featured courses available at the moment.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
