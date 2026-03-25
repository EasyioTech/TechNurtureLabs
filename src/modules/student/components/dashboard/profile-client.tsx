'use client';

import React, { useState } from 'react';
import { 
    Trophy, Star, Flame, BookOpen, Clock, Target,
    Sparkles, Award, Crown, Medal, Calendar, Edit3, Check, X,
    Zap, GraduationCap, TrendingUp, Heart, Shield, Rocket, ArrowLeft, Camera,
    ArrowRight, Activity, Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { updateStudentBio, updateStudentAvatar, updateStudentProfile } from '@/modules/student/actions/profile-actions';

interface ProfileClientProps {
  initialData: {
    profile: any;
    stats: any;
    achievements: any[];
    rank: number;
    rankPercentage: number;
  }
}

const AVATAR_COLORS = [
  { id: 'indigo', code: 'bg-indigo-600', label: 'Indigo' },
  { id: 'emerald', code: 'bg-emerald-600', label: 'Emerald' },
  { id: 'amber', code: 'bg-amber-600', label: 'Amber' },
  { id: 'rose', code: 'bg-rose-600', label: 'Rose' },
  { id: 'sky', code: 'bg-sky-600', label: 'Sky' },
  { id: 'violet', code: 'bg-violet-600', label: 'Violet' },
];

const AVATAR_ICONS = [
  { id: 'rocket', icon: Rocket, label: 'Rocket' },
  { id: 'star', icon: Star, label: 'Star' },
  { id: 'crown', icon: Crown, label: 'Crown' },
  { id: 'trophy', icon: Trophy, label: 'Trophy' },
  { id: 'heart', icon: Heart, label: 'Heart' },
  { id: 'shield', icon: Shield, label: 'Shield' },
  { id: 'zap', icon: Zap, label: 'Lightning' },
  { id: 'graduation', icon: GraduationCap, label: 'Graduate' },
];

export function ProfileClient({ initialData }: ProfileClientProps) {
  // Safeguard against missing profile
  if (!initialData.profile) return null;

  const [profile, setProfile] = useState(initialData.profile);
  const [stats, setStats] = useState(initialData.stats);
  const [achievements, setAchievements] = useState(initialData.achievements);
  const [rank, setRank] = useState({ current: initialData.rank, percentage: initialData.rankPercentage });
  
  const [editingBio, setEditingBio] = useState(false);
  const [editingAvatar, setEditingAvatar] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [bioText, setBioText] = useState(profile?.bio || '');
  const [formData, setFormData] = useState({ 
    first_name: profile?.first_name || '', 
    last_name: profile?.last_name || '', 
    phone: profile?.phone || '' 
  });
  
  const [selectedColor, setSelectedColor] = useState('indigo');
  const [selectedIcon, setSelectedIcon] = useState('rocket');
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (profile?.avatar_style) {
      const [color, icon] = profile.avatar_style.split(':');
      setSelectedColor(color || 'indigo');
      setSelectedIcon(icon || 'rocket');
    }
  }, [profile]);

  const saveBio = async () => {
    setIsSaving(true);
    try {
      await updateStudentBio(bioText);
      setProfile({ ...profile, bio: bioText });
      setEditingBio(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const saveProfile = async () => {
    setIsSaving(true);
    try {
      await updateStudentProfile({
        ...formData,
        bio: bioText
      });
      setProfile({
        ...profile,
        first_name: formData.first_name,
        last_name: formData.last_name,
        full_name: `${formData.first_name} ${formData.last_name}`,
        phone: formData.phone,
        bio: bioText
      });
      setEditingProfile(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const saveAvatar = async () => {
    const avatarStyle = `${selectedColor}:${selectedIcon}`;
    setIsSaving(true);
    try {
      await updateStudentAvatar(avatarStyle);
      setProfile({ ...profile, avatar_style: avatarStyle });
      setEditingAvatar(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const AvatarIconComponent = AVATAR_ICONS.find(i => i.id === selectedIcon)?.icon || Rocket;
  const avatarBg = AVATAR_COLORS.find(c => c.id === selectedColor)?.code || 'bg-indigo-600';

  const xpProgress = (profile?.total_xp || 0) % 1000;
  const progressPercent = Math.min(100, (xpProgress / 1000) * 100);

  return (
    <div className="min-h-screen bg-slate-50/10 pb-20">
      {/* Strategic Profile Header */}
      <div className="relative bg-slate-950 overflow-hidden border-b border-white/5 py-10 md:py-16 lg:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.15)_0%,_transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(79,70,229,0.1)_0%,_transparent_50%)]" />
        
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12 relative z-10">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-8 lg:gap-12">
            <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="relative group shrink-0"
            >
              <div className={`w-28 h-28 md:w-32 md:h-32 lg:w-40 lg:h-40 rounded-2xl md:rounded-[2.25rem] lg:rounded-[2.5rem] ${avatarBg} border-2 md:border-4 border-white/20 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] flex items-center justify-center transition-all duration-700 group-hover:rotate-1`}>
                <AvatarIconComponent size={36} className="text-white drop-shadow-2xl md:hidden" />
                <AvatarIconComponent size={56} className="text-white drop-shadow-2xl hidden md:block" />
              </div>
              <button
                onClick={() => setEditingAvatar(true)}
                className="absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 w-9 h-9 md:w-12 md:h-12 bg-white rounded-xl md:rounded-2xl shadow-2xl flex items-center justify-center text-slate-950 border-2 border-slate-950 hover:scale-110 active:scale-95 transition-all group-hover:bg-indigo-600 group-hover:text-white"
              >
                <Camera size={16} className="md:hidden" />
                <Camera size={20} className="hidden md:block" />
              </button>
            </motion.div>

            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-wrap items-center gap-3 mb-6 justify-center md:justify-start">
                 <Badge className="bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.3em] shadow-2xl backdrop-blur-md">
                   {profile?.className || 'No Class Assigned'}
                 </Badge>
                 <Badge className="bg-white/5 border border-white/10 text-white/40 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.3em] backdrop-blur-md">
                   Rank #{rank.current} / Top {rank.percentage}%
                 </Badge>
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white uppercase tracking-tighter leading-none mb-3 md:mb-4">
                {profile?.full_name}
              </h1>
              <div className="flex items-center gap-2.5 justify-center md:justify-start opacity-50">
                 <div className="w-5 h-1 bg-indigo-500 rounded-full" />
                 <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.4em]">{profile?.email}</p>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-6 pb-2">
               <HeaderStat label="Total Points" value={profile?.total_xp.toLocaleString()} icon={Star} color="text-amber-400" />
               <div className="w-px h-8 bg-white/5" />
               <HeaderStat label="Best Streak" value={`${profile?.longest_streak} Days`} icon={Flame} color="text-orange-500" />
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-[1440px] mx-auto px-6 lg:px-12 -mt-6 md:-mt-8 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 lg:gap-10">
          {/* Internal Manifest */}
          <div className="lg:col-span-8 space-y-6 md:space-y-8">
            <section className="bg-white rounded-[1.75rem] md:rounded-[2.5rem] p-7 md:p-8 lg:p-10 border border-slate-100 shadow-2xl shadow-slate-200/40 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-slate-950 pointer-events-none">
                  <Activity size={160} />
               </div>

               <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-6 md:mb-8 pb-5 border-b border-slate-50">
                   <div>
                        <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tighter mb-1.5">Student Identity</h3>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] md:tracking-[0.4em]">Personal Learning Record</p>
                   </div>
                   <div className="flex items-center gap-2.5">
                        <Button variant="ghost" onClick={() => setEditingProfile(true)} className="h-9 md:h-11 px-4 md:px-5 rounded-xl md:rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 hover:text-indigo-600 transition-all">
                           Settings
                        </Button>
                        {!editingBio && (
                           <Button onClick={() => setEditingBio(true)} className="h-9 md:h-11 px-6 md:px-7 bg-slate-950 text-white rounded-xl md:rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl">
                              <Edit3 size={13} className="mr-2" /> Edit Profile
                           </Button>
                        )}
                   </div>
               </div>

               {editingBio ? (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                     <textarea
                        value={bioText}
                        onChange={(e) => setBioText(e.target.value)}
                        className="w-full h-40 p-8 rounded-3xl bg-slate-50 border-4 border-slate-100 focus:border-indigo-600 outline-none text-base font-bold transition-all resize-none shadow-inner"
                        placeholder="Tell us about yourself..."
                     />
                     <div className="flex gap-4">
                        <Button onClick={saveBio} disabled={isSaving} className="h-12 md:h-14 px-8 md:px-10 bg-slate-950 text-white font-black uppercase tracking-widest text-[10px] rounded-xl md:rounded-2xl hover:bg-indigo-600 transition-all shadow-xl">
                           {isSaving ? <Loader2 className="animate-spin" /> : 'Update Bio'}
                        </Button>
                        <Button variant="outline" onClick={() => setEditingBio(false)} disabled={isSaving} className="h-12 md:h-14 px-8 md:px-10 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[10px]">Cancel</Button>
                     </div>
                  </motion.div>
               ) : (
                  <p className="text-slate-600 text-lg md:text-xl leading-relaxed font-bold tracking-tight">
                     {profile?.bio || 'No profile bio provided yet. Tell us about your learning journey and goals.'}
                  </p>
               )}
            </section>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
               <TacticalStat label="Lessons Completed" value={profile?.total_lessons_completed} icon={BookOpen} color="text-indigo-600" bg="bg-indigo-50" />
               <TacticalStat label="Quizzes Passed" value={profile?.total_quizzes_completed} icon={Target} color="text-emerald-600" bg="bg-emerald-50" />
               <TacticalStat label="Learning Time" value={`${profile?.total_learning_time_minutes}m`} icon={Clock} color="text-sky-600" bg="bg-sky-50" />
            </div>

            <section className="bg-slate-950 rounded-[1.75rem] md:rounded-[2.5rem] p-7 md:p-8 lg:p-10 text-white border border-white/5 shadow-2xl shadow-indigo-950/20 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
               <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6 md:mb-8 lg:mb-10">
                     <div>
                        <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter mb-1.5">Level Progress</h3>
                        <p className="text-[9px] md:text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Current Level: Level {profile?.level}</p>
                     </div>
                     <div className="text-right">
                         <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 mb-1.5">
                           <Trophy size={11} />
                           <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest">Global Standings</span>
                         </div>
                         <p className="text-xl md:text-2xl font-black tracking-tighter">TOP {rank.percentage}%</p>
                     </div>
                  </div>
                  <div className="h-2.5 md:h-3 bg-white/5 rounded-full p-0.5 border border-white/5 mb-4 md:mb-6 shadow-inner overflow-hidden">
                     <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        className="h-full bg-indigo-600 rounded-full shadow-[0_0_15px_rgba(79,70,229,0.5)]" 
                        transition={{ duration: 2, ease: "easeOut" }}
                     />
                  </div>
                  <div className="flex justify-between items-center text-[7px] md:text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] md:tracking-[0.3em]">
                     <span>Progress Synced</span>
                     <span className="text-white">{Math.round(progressPercent)}% Towards Level {profile?.level + 1}</span>
                  </div>
               </div>
            </section>
          </div>

          {/* Exterior Support */}
          <div className="lg:col-span-4 space-y-6 md:space-y-8">
            <section className="bg-white border border-slate-100 rounded-[1.75rem] md:rounded-[2.5rem] p-6 md:p-8 shadow-xl shadow-slate-200/20 group">
               <h3 className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] md:tracking-[0.4em] mb-6 md:mb-8 text-center underline decoration-indigo-200 underline-offset-8 decoration-2">Earned Badges</h3>
               <div className="space-y-3.5 md:space-y-4">
                  {achievements.slice(0, 5).map((ach) => (
                    <div key={ach.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${ach.unlocked ? 'bg-slate-50 border-slate-100 group-hover:border-indigo-100' : 'bg-white border-transparent opacity-20 grayscale scale-95'}`}>
                      <div className={`w-9 h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center ${ach.unlocked ? 'bg-white text-indigo-600 shadow-sm' : 'bg-slate-50 text-slate-300'}`}>
                        <Award size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] md:text-[11px] font-black text-slate-900 uppercase tracking-tighter leading-none mb-1 truncate">{ach.name}</p>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{ach.unlocked ? 'Unlocked' : 'Locked'}</p>
                      </div>
                    </div>
                  ))}
                  <Link href="/student/achievements" className="block mt-6">
                    <Button variant="ghost" className="w-full h-11 md:h-12 rounded-xl border-2 border-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-900 hover:bg-slate-950 hover:text-white transition-all flex items-center justify-center gap-2">
                       View All Badges <ArrowRight size={14} />
                    </Button>
                  </Link>
               </div>
            </section>

            <section className="bg-indigo-600 rounded-[1.75rem] md:rounded-[2.5rem] p-7 md:p-8 lg:p-10 text-white shadow-2xl relative overflow-hidden group">
               <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
               <div className="flex flex-col items-center text-center relative z-10">
                 <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-white text-indigo-600 flex items-center justify-center mb-5 md:mb-6 shadow-2xl group-hover:scale-110 transition-all duration-500">
                    <Flame size={24} className="md:hidden" fill="currentColor" />
                    <Flame size={32} className="hidden md:block" fill="currentColor" />
                 </div>
                 <h4 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-white/50 mb-2">Current Streak</h4>
                 <p className="text-3xl md:text-4xl font-black tracking-tighter mb-3">{profile?.current_streak} <span className="text-lg opacity-60">DAYS</span></p>
                 <div className="w-8 h-1 bg-white/20 rounded-full mb-3" />
                 <p className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] opacity-60 leading-relaxed max-w-[180px]">Keep learning every day to maintain your streak!</p>
               </div>
            </section>
          </div>
        </div>
      </main>

      {/* Identity Recalibration Modals */}
      <AnimatePresence>
        {editingAvatar && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
            <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="bg-white rounded-[2rem] md:rounded-[3rem] w-full max-w-xl p-8 md:p-10 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-50 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8 md:mb-10">
                    <h2 className="text-xl md:text-2xl font-black text-slate-950 uppercase tracking-tighter">Change Avatar</h2>
                    <button onClick={() => setEditingAvatar(false)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all">
                        <X size={18} />
                    </button>
                </div>

                <div className="flex justify-center mb-8 md:mb-10">
                  <div className={`w-28 h-28 md:w-36 md:h-36 rounded-2xl md:rounded-[2.5rem] ${avatarBg} border-4 border-slate-50 shadow-2xl flex items-center justify-center transition-all duration-700`}>
                    <AvatarIconComponent size={40} className="text-white md:hidden" />
                    <AvatarIconComponent size={56} className="text-white hidden md:block" />
                  </div>
                </div>

                <div className="space-y-10">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4">Select Color</p>
                    <div className="flex flex-wrap gap-4">
                      {AVATAR_COLORS.map(c => (
                        <button key={c.id} onClick={() => setSelectedColor(c.id)} className={`w-10 h-10 rounded-xl ${c.code} transition-all ${selectedColor === c.id ? 'ring-4 ring-indigo-50 scale-110 shadow-lg' : 'opacity-40 hover:opacity-100 hover:scale-110'}`} />
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4">Select Icon</p>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                      {AVATAR_ICONS.map(i => (
                        <button
                          key={i.id}
                          onClick={() => setSelectedIcon(i.id)}
                          className={`aspect-square rounded-xl flex items-center justify-center transition-all border-2 ${selectedIcon === i.id ? 'bg-slate-950 border-slate-950 text-white shadow-xl scale-110' : 'bg-slate-50 border-transparent text-slate-300 hover:bg-slate-100 hover:scale-105'}`}
                        >
                          <i.icon size={20} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-8 md:mt-10 flex gap-4">
                  <Button onClick={saveAvatar} disabled={isSaving} className="flex-1 h-12 md:h-14 bg-slate-950 text-white font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-indigo-600 transition-all shadow-2xl">
                    {isSaving ? <Loader2 className="animate-spin" /> : 'Save Avatar'}
                  </Button>
                  <Button variant="ghost" onClick={() => setEditingAvatar(false)} disabled={isSaving} className="flex-1 h-12 md:h-14 rounded-xl font-black uppercase tracking-widest text-[10px] border-2 border-slate-100">Cancel</Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {editingProfile && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
            <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="bg-white rounded-[2rem] md:rounded-[3rem] w-full max-w-xl p-8 md:p-10 shadow-2xl relative overflow-hidden"
            >
               <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-50 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
               <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8 md:mb-10">
                      <h2 className="text-xl md:text-2xl font-black text-slate-950 uppercase tracking-tighter">Edit Profile Details</h2>
                      <button onClick={() => setEditingProfile(false)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all">
                          <X size={18} />
                      </button>
                  </div>

                  <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">First Name</label>
                           <input
                              type="text"
                              value={formData.first_name}
                              onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                              className="w-full h-14 px-6 rounded-xl bg-slate-50 border-4 border-slate-50 focus:border-indigo-600 outline-none text-base font-black transition-all shadow-inner"
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Last Name</label>
                           <input
                              type="text"
                              value={formData.last_name}
                              onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                              className="w-full h-14 px-6 rounded-xl bg-slate-50 border-4 border-slate-50 focus:border-indigo-600 outline-none text-base font-black transition-all shadow-inner"
                           />
                        </div>
                     </div>

                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Phone Number</label>
                        <input
                           type="text"
                           value={formData.phone || ''}
                           onChange={e => setFormData({ ...formData, phone: e.target.value })}
                           className="w-full h-14 px-6 rounded-xl bg-slate-50 border-4 border-slate-50 focus:border-indigo-600 outline-none text-base font-black transition-all shadow-inner"
                           placeholder="+X XXX XXX XXXX"
                        />
                     </div>

                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Bio</label>
                        <textarea
                           value={bioText}
                           onChange={e => setBioText(e.target.value)}
                           className="w-full h-32 p-6 rounded-2xl bg-slate-50 border-4 border-slate-50 focus:border-indigo-600 outline-none text-base font-bold transition-all resize-none shadow-inner"
                           placeholder="Define your academic trajectory..."
                        />
                     </div>
                  </div>

                  <div className="mt-8 md:mt-10 flex gap-4">
                     <Button onClick={saveProfile} disabled={isSaving} className="flex-1 h-12 md:h-14 bg-slate-950 text-white font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-indigo-600 transition-all shadow-2xl">
                        {isSaving ? <Loader2 className="animate-spin" /> : 'Save Changes'}
                     </Button>
                     <Button variant="ghost" onClick={() => setEditingProfile(false)} disabled={isSaving} className="flex-1 h-12 md:h-14 rounded-xl font-black uppercase tracking-widest text-[10px] border-2 border-slate-100">Cancel</Button>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function HeaderStat({ label, value, icon: Icon, color }: any) {
    return (
        <div className="text-center group">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] md:tracking-[0.3em] mb-2 group-hover:text-white transition-colors">{label}</p>
            <div className="flex items-center gap-3 justify-center">
                <Icon size={18} className={`${color} md:hidden`} fill="currentColor" />
                <Icon size={20} className={`${color} hidden md:block`} fill="currentColor" />
                <p className="text-xl md:text-2xl font-black text-white tracking-tighter shrink-0">{value}</p>
            </div>
        </div>
    );
}

function TacticalStat({ icon: Icon, label, value, color, bg }: any) {
  return (
    <div className="bg-white border border-slate-100 rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-7 transition-all hover:border-indigo-100 hover:shadow-xl hover:shadow-slate-100/50 group hover:-translate-y-1.5 duration-500">
      <div className={`w-10 h-10 md:w-11 md:h-11 rounded-xl ${bg} ${color} flex items-center justify-center mb-4 md:mb-5 group-hover:scale-110 transition-all duration-500 shadow-sm shrink-0`}>
        <Icon size={18} className="md:hidden" />
        <Icon size={22} className="hidden md:block" strokeWidth={2.5} />
      </div>
      <div>
        <p className="text-xl md:text-2xl font-black text-slate-900 leading-none mb-1.5 tracking-tighter shrink-0">{value}</p>
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</p>
      </div>
    </div>
  );
}

function Loader2(props: any) {
    return (
        <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
            <Activity {...props} />
        </motion.div>
    );
}
