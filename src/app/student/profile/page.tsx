'use client';

import React, { useEffect, useState } from 'react';
import { getStudentProfileData, updateStudentBio, updateStudentAvatar, updateStudentProfile } from '@/modules/student/actions/profile-actions';
import { StudentDashboardLoader } from '@/modules/student/components/dashboard-loader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Trophy, Star, Flame, BookOpen, Clock, Target,
  Sparkles, Award, Crown, Medal, Calendar, Edit3, Check, X,
  Zap, GraduationCap, TrendingUp, Heart, Shield, Rocket, ArrowLeft, Camera
} from 'lucide-react';
import Link from 'next/link';

type UserProfile = {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  className: string | null;
  gender: string | null;
  total_xp: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  total_lessons_completed: number;
  total_quizzes_completed: number;
  total_learning_time_minutes: number;
  avatar_url: string | null;
  avatar_style: string | null;
  bio: string | null;
  phone: string | null;
  created_at: string;
};

type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  xp_reward: number;
  unlocked: boolean;
  unlocked_at?: string;
};

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

export default function StudentProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState({ xp: 0, streak: 0, level: 1 });
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBio, setEditingBio] = useState(false);
  const [editingAvatar, setEditingAvatar] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [bioText, setBioText] = useState('');
  const [formData, setFormData] = useState({ first_name: '', last_name: '', phone: '' });
  const [selectedColor, setSelectedColor] = useState('indigo');
  const [selectedIcon, setSelectedIcon] = useState('rocket');
  const [rank, setRank] = useState({ current: 0, percentage: 0 });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const data = await getStudentProfileData();
      setProfile(data.profile as any);
      setStats(data.stats);
      setAchievements(data.achievements as any);
      setRank({ current: data.rank, percentage: data.rankPercentage });
      setBioText(data.profile?.bio || '');
      setFormData({
        first_name: data.profile?.first_name || '',
        last_name: data.profile?.last_name || '',
        phone: data.profile?.phone || ''
      });

      if (data.profile?.avatar_style) {
        const [color, icon] = data.profile.avatar_style.split(':');
        setSelectedColor(color || 'indigo');
        setSelectedIcon(icon || 'rocket');
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const saveBio = async () => {
    if (!profile) return;
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
    if (!profile) return;
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
    if (!profile) return;
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

  if (loading) {
    return <StudentDashboardLoader message="Loading Profile Context..." />;
  }

  const xpProgress = (profile?.total_xp || 0) % 1000;
  const progressPercent = Math.min(100, (xpProgress / 1000) * 100);

  return (
    <div className="min-h-screen bg-slate-50/50 pb-32">
      {/* Dynamic Header */}
      <div className="relative h-64 bg-slate-950 overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.15)_0%,_transparent_70%)]" />
        <div className="max-w-[1200px] mx-auto px-6 h-full flex flex-col justify-end pb-12 relative z-10">
          <Link href="/student">
            <button className="absolute top-8 left-6 flex items-center gap-2 text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-white transition-colors">
              <ArrowLeft size={16} /> Dashboard
            </button>
          </Link>
          <div className="flex flex-col md:flex-row items-end gap-8">
            <div className="relative group">
              <div className={`w-32 h-32 rounded-[2.5rem] ${avatarBg} border-4 border-slate-950 shadow-2xl flex items-center justify-center`}>
                <AvatarIconComponent size={56} className="text-white" />
              </div>
              <button
                onClick={() => setEditingAvatar(true)}
                className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-2xl shadow-xl flex items-center justify-center text-slate-900 border border-slate-200 hover:scale-110 active:scale-95 transition-all"
              >
                <Camera size={18} />
              </button>
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-wrap items-center gap-3 mb-2 justify-center md:justify-start">
                <Badge className="bg-indigo-600 text-white border-0 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">{profile?.className || 'Class Not Set'}</Badge>
                <Badge className="bg-white/10 text-white border-white/20 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">School Rank #{rank.current}</Badge>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none mb-4">{profile?.full_name}</h1>
              <p className="text-slate-400 font-bold text-sm uppercase tracking-widest opacity-80">{profile?.email}</p>
            </div>
            <div className="hidden lg:flex items-center gap-8 pb-4">
              <div className="text-center">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total XP</p>
                <p className="text-2xl font-black text-white">{profile?.total_xp.toLocaleString()}</p>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="text-center">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Longest Streak</p>
                <p className="text-2xl font-black text-orange-500">{profile?.longest_streak} Days</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-[1200px] mx-auto px-6 -mt-8 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Bio & Stats */}
          <div className="lg:col-span-8 space-y-8">
            {/* Bio Card */}
            <section className="bg-white border border-slate-100 rounded-[3rem] p-10 shadow-xl shadow-slate-200/50">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Biography</h3>
                <div className="flex items-center gap-4">
                  <Button variant="ghost" onClick={() => setEditingProfile(true)} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-all">
                    Settings
                  </Button>
                  {!editingBio && (
                    <Button variant="ghost" onClick={() => setEditingBio(true)} className="text-[10px] font-black uppercase tracking-widest text-indigo-600">
                      <Edit3 size={14} className="mr-2" /> Edit Bio
                    </Button>
                  )}
                </div>
              </div>
              {editingBio ? (
                <div className="space-y-6">
                  <textarea
                    value={bioText}
                    onChange={(e) => setBioText(e.target.value)}
                    className="w-full h-32 p-6 rounded-[2rem] bg-slate-50 border-2 border-slate-100 focus:border-indigo-600 outline-none text-sm font-medium transition-all resize-none"
                    placeholder="Tell us about yourself..."
                  />
                  <div className="flex gap-3">
                    <Button onClick={saveBio} disabled={isSaving} className="h-12 px-8 bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-indigo-600 transition-all">
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button variant="outline" onClick={() => setEditingBio(false)} disabled={isSaving} className="h-12 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px]">Cancel</Button>
                  </div>
                </div>
              ) : (
                <p className="text-slate-600 text-base leading-relaxed font-medium">
                  {profile?.bio || 'No bio provided yet. Add a few sentences to introduce yourself to your class!'}
                </p>
              )}
            </section>

            {/* Detailed Stats Grid */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <DetailStatCard icon={BookOpen} label="Lessons Complete" value={profile?.total_lessons_completed} color="text-indigo-600" bg="bg-indigo-50" />
              <DetailStatCard icon={Target} label="Quizzes Passed" value={profile?.total_quizzes_completed} color="text-emerald-600" bg="bg-emerald-50" />
              <DetailStatCard icon={Clock} label="Learning Time" value={`${profile?.total_learning_time_minutes}m`} color="text-sky-600" bg="bg-sky-50" />
            </section>

            {/* Progress Visualization */}
            <section className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px]" />
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight mb-1">Level Progress</h3>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Level {profile?.level} Expert</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">School Rank</p>
                  <p className="text-xl font-black text-indigo-400">Top {rank.percentage}%</p>
                </div>
              </div>
              <div className="h-4 bg-white/5 rounded-full p-1 mb-6">
                <div className="h-full bg-indigo-600 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.5)]" style={{ width: `${progressPercent}%` }} />
              </div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] text-center">{Math.round(progressPercent)}% Towards Level {profile?.level ? profile.level + 1 : 2}</p>
            </section>
          </div>

          {/* Right Column: Achievements & Streaks */}
          <div className="lg:col-span-4 space-y-8">
            {/* Achievement Badge List */}
            <section className="bg-white border border-slate-100 rounded-[3rem] p-8 shadow-sm">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center justify-between">
                My Badges
                <span className="text-[10px] text-slate-400 font-bold">{achievements.filter(a => a.unlocked).length} / {achievements.length}</span>
              </h3>
              <div className="space-y-4">
                {achievements.slice(0, 5).map((ach) => (
                  <div key={ach.id} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${ach.unlocked ? 'bg-slate-50 border-slate-100' : 'bg-white border-transparent opacity-40 grayscale'}`}>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${ach.unlocked ? 'bg-white text-indigo-600 shadow-sm' : 'bg-slate-50 text-slate-300'}`}>
                      <Award size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight truncate">{ach.name}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{ach.unlocked ? 'Unlocked' : 'Locked'}</p>
                    </div>
                  </div>
                ))}
                <Link href="/student/achievements">
                  <Button variant="ghost" className="w-full mt-4 text-[10px] font-black uppercase tracking-widest text-indigo-600">View All Badges</Button>
                </Link>
              </div>
            </section>

            {/* Streak Hero */}
            <section className="bg-indigo-600 rounded-[3rem] p-10 text-white shadow-2xl shadow-indigo-200">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-[2rem] bg-white/10 flex items-center justify-center mb-6">
                  <Flame size={40} className="text-orange-400" fill="currentColor" />
                </div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">Learning Streak</h4>
                <p className="text-5xl font-black tracking-tighter mb-4">{profile?.current_streak} <span className="text-xl">DAYS</span></p>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 leading-relaxed max-w-[180px]">Keep learning every day to grow your streak!</p>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Avatar Customization Modal */}
      {editingAvatar && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 sm:p-12">
          <div className="bg-white rounded-[3.5rem] w-full max-w-xl p-10 shadow-2xl animate-in zoom-in-95 duration-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-[80px]" />
            <div className="relative z-10">
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-10">Customize Avatar</h2>

              <div className="flex justify-center mb-12">
                <div className={`w-36 h-36 rounded-[3rem] ${avatarBg} border-8 border-slate-50 shadow-2xl flex items-center justify-center transition-all duration-500`}>
                  {React.createElement(AVATAR_ICONS.find(i => i.id === selectedIcon)?.icon || Rocket, { size: 64, className: 'text-white' })}
                </div>
              </div>

              <div className="space-y-10">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Select Colors</p>
                  <div className="flex flex-wrap gap-4">
                    {AVATAR_COLORS.map(c => (
                      <button key={c.id} onClick={() => setSelectedColor(c.id)} className={`w-10 h-10 rounded-2xl ${c.code} transition-all ${selectedColor === c.id ? 'ring-4 ring-indigo-100 scale-110 shadow-lg' : 'opacity-60 hover:opacity-100 hover:scale-110'}`} />
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Select Icon</p>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                    {AVATAR_ICONS.map(i => (
                      <button
                        key={i.id}
                        onClick={() => setSelectedIcon(i.id)}
                        className={`aspect-square rounded-2xl flex items-center justify-center transition-all ${selectedIcon === i.id ? 'bg-slate-900 text-white shadow-xl scale-110' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:scale-105'}`}
                      >
                        <i.icon size={20} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-12 flex gap-4">
                <Button onClick={saveAvatar} disabled={isSaving} className="flex-1 h-14 bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-indigo-600 transition-all shadow-xl shadow-slate-900/10">
                  {isSaving ? 'Saving...' : 'Save Identity'}
                </Button>
                <Button variant="outline" onClick={() => setEditingAvatar(false)} disabled={isSaving} className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] border-2">Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {editingProfile && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-[3.5rem] w-full max-w-xl p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-[80px]" />
            <div className="relative z-10">
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-8">Edit Profile Information</h2>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">First Name</label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                      className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 focus:border-indigo-600 outline-none text-sm font-bold transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Last Name</label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                      className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 focus:border-indigo-600 outline-none text-sm font-bold transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone || ''}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 focus:border-indigo-600 outline-none text-sm font-bold transition-all"
                    placeholder="+1 234 567 890"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Bio / About Me</label>
                  <textarea
                    value={bioText}
                    onChange={e => setBioText(e.target.value)}
                    className="w-full h-32 p-6 rounded-[2rem] bg-slate-50 border border-slate-100 focus:border-indigo-600 outline-none text-sm font-medium transition-all resize-none"
                    placeholder="Tell us about yourself..."
                  />
                </div>
              </div>

              <div className="mt-10 flex gap-4">
                <Button onClick={saveProfile} disabled={isSaving} className="flex-1 h-14 bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-indigo-600 transition-all">
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button variant="outline" onClick={() => setEditingProfile(false)} disabled={isSaving} className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px]">Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailStatCard({ icon: Icon, label, value, color, bg }: any) {
  return (
    <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 transition-all hover:border-slate-200 hover:shadow-lg hover:shadow-slate-200/40 group">
      <div className={`w-12 h-12 rounded-2xl ${bg} ${color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-2xl font-black text-slate-900 leading-none mb-2">{value}</p>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      </div>
    </div>
  );
}
