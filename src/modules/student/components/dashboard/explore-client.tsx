'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
    Compass, Search, Sparkles, Zap, Star,
    ArrowRight, LayoutGrid, Play, Filter,
    Monitor, Cpu, Globe, Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Course } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ExploreClientProps {
  initialData: {
    courses: Course[];
    categories: any[];
    topics: string[];
  }
}

const CATEGORY_STYLES: any = {
    'Programming': { icon: Cpu, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
    'Computer Science': { icon: Monitor, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
    'Networking': { icon: Globe, color: 'text-amber-600 bg-amber-50 border-amber-100' },
    'Robotics': { icon: Zap, color: 'text-rose-600 bg-rose-50 border-rose-100' },
    'General': { icon: Award, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
    'Technology': { icon: Monitor, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
};

export function ExploreClient({ initialData }: ExploreClientProps) {
    const { courses, categories: rawCategories, topics: rawTopics } = initialData;
    const [searchQuery, setSearchQuery] = useState('');

    const categories = (rawCategories || []).map((cat: any) => ({
        ...cat,
        ...(CATEGORY_STYLES[cat.name] || CATEGORY_STYLES['General'])
    }));

    const topics = rawTopics?.length > 0 ? rawTopics : ['Python', 'Web Development', 'Robotics', 'Graphic Design'];
    const filteredCourses = courses.filter(c => 
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const featuredCourses = filteredCourses.slice(0, 4);

    return (
        <div className="min-h-screen bg-slate-50/10 pb-32">
            {/* Search Section */}
            <div className="relative pt-24 pb-32 px-6 lg:px-12 bg-slate-950 overflow-hidden border-b border-white/5">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[150%] bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.15)_0%,_transparent_60%)] pointer-events-none" />
                
                <div className="max-w-[1240px] mx-auto relative z-10 text-center">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 mb-12 shadow-2xl"
                    >
                        <Sparkles size={16} fill="currentColor" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em]">Academy Discovery Protocol</span>
                    </motion.div>

                    <h1 className="text-5xl md:text-8xl font-black text-white uppercase tracking-tighter leading-[0.8] mb-12">
                        Expand Your <br />
                        <span className="text-indigo-500">Intelligence</span>
                    </h1>

                    <div className="relative max-w-3xl mx-auto group">
                        <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-all duration-500" size={28} />
                        <input
                            type="text"
                            placeholder="SEARCH STRATEGIC ROADMAPS..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-24 pl-20 pr-10 bg-white/5 border-2 border-white/10 rounded-[2.5rem] text-sm font-black text-white uppercase tracking-[0.2em] placeholder:text-slate-600 focus:border-indigo-500/50 focus:bg-white/10 transition-all outline-none shadow-2xl selection:bg-indigo-500 selection:text-white"
                        />
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-4 mt-16">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-6">Strategic Topics:</p>
                        {topics.slice(0, 6).map((tag: string) => (
                            <button key={tag} className="px-6 h-11 rounded-2xl bg-white/5 border border-white/10 text-[9px] font-black text-slate-400 uppercase tracking-widest hover:bg-white/10 hover:text-white hover:border-white/20 transition-all active:scale-95">
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <main className="max-w-[1440px] mx-auto px-6 lg:px-12 py-24">
                {/* Categories */}
                <section className="mb-32">
                    <div className="flex items-center justify-between mb-16 pb-8 border-b border-slate-100">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-[1.25rem] bg-slate-900 text-white flex items-center justify-center shadow-xl">
                                <LayoutGrid size={24} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Domain Clusters</h3>
                        </div>
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Authorized Categories</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {categories.map((cat: any, i: number) => (
                            <div key={i} className="group p-10 rounded-[3rem] bg-white border border-slate-100 hover:border-indigo-200 hover:shadow-2xl hover:shadow-slate-200/50 transition-all cursor-pointer relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
                                <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-10 border-2 transition-all group-hover:scale-110 duration-500 relative z-10", cat.color)}>
                                    <cat.icon size={30} strokeWidth={2.5} />
                                </div>
                                <div className="relative z-10">
                                    <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-3 leading-none">{cat.name}</h4>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{cat.count} Available Units</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Recommended */}
                <section>
                    <div className="flex items-center justify-between mb-16 pb-8 border-b border-slate-100">
                        <div className="flex items-center gap-4">
                             <div className="w-12 h-12 rounded-[1.25rem] bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-200">
                                <Compass size={24} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Strategic Recommendations</h3>
                        </div>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Cleared for your Tier</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                        {/* Highlights Banner */}
                        <div className="lg:col-span-4 rounded-[4rem] bg-slate-900 p-12 lg:p-16 text-white relative overflow-hidden group shadow-2xl shadow-indigo-950/20 border border-white/5">
                            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px] group-hover:scale-125 transition-transform duration-1000" />
                            <Badge className="bg-indigo-600 text-white border-0 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-12 shadow-xl shadow-indigo-600/40">PRIMARTY OBJECTIVE</Badge>
                            <h4 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter leading-[0.9] mb-10">
                                {featuredCourses[0]?.title || 'Expand Intelligence'}
                            </h4>
                            <p className="text-slate-400 font-bold text-sm uppercase tracking-widest leading-relaxed mb-16 line-clamp-4">
                                {featuredCourses[0]?.description || 'Dive into our newest interactive lessons designed to challenge and inspire your analytical capabilities.'}
                            </p>
                            {featuredCourses[0] && (
                                <Link href={`/student/course/${featuredCourses[0].id}`}>
                                    <Button className="w-full h-20 bg-white text-slate-900 font-black uppercase tracking-widest text-[11px] rounded-[2.5rem] hover:bg-slate-50 transition-all flex items-center justify-center gap-4 group/btn shadow-xl active:scale-95">
                                        Activate Source <Play size={16} fill="currentColor" className="group-hover/btn:translate-x-1 transition-transform" />
                                    </Button>
                                </Link>
                            )}
                        </div>

                        {/* Course List */}
                        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                            {featuredCourses.slice(1).length > 0 ? featuredCourses.slice(1).map((course: any) => (
                                <div key={course.id} className="bg-white border border-slate-100 rounded-[3.5rem] p-10 hover:border-indigo-100 hover:shadow-2xl hover:shadow-slate-200/50 transition-all group flex flex-col">
                                    <div className="aspect-[16/10] bg-slate-50 rounded-[3rem] mb-10 overflow-hidden border border-slate-100 flex items-center justify-center p-12 group-hover:bg-indigo-50 transition-all duration-700 relative">
                                        <Monitor size={56} className="text-slate-200 group-hover:text-indigo-200 transition-all duration-700 group-hover:scale-110" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <div className="flex-1 flex flex-col">
                                        <div className="flex items-center gap-3 mb-6">
                                            <Star size={14} className="text-amber-500" fill="currentColor" />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">New Synchronization</span>
                                        </div>
                                        <h5 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none group-hover:text-indigo-600 transition-colors mb-10">{course.title}</h5>
                                        
                                        <div className="mt-auto flex items-center justify-between pt-8 border-t border-slate-50">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{course.totalLessons ?? 0} SECTIONS</span>
                                            <Link href={`/student/course/${course.id}`}>
                                                <Button variant="ghost" className="h-10 px-0 hover:bg-transparent text-indigo-600 font-black uppercase tracking-widest text-[10px] group-hover:translate-x-2 transition-all flex items-center gap-3">
                                                    Protocol Details <ArrowRight size={16} />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="col-span-full py-32 bg-slate-50/50 rounded-[3.5rem] border-2 border-slate-100 border-dashed flex flex-col items-center justify-center text-center p-10">
                                    <div className="w-20 h-20 rounded-[2rem] bg-white flex items-center justify-center text-slate-200 shadow-sm mb-8">
                                       <Search size={40} />
                                    </div>
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] max-w-xs leading-relaxed">Adjust your search parameters to find matching strategic roadmaps.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
