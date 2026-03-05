'use client';

import React, { useEffect, useState } from 'react';
import { getStudentProfileData, updateStudentBio, updateStudentAvatar } from '@/modules/student/profile-actions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StudentHeader } from '../../../modules/student/components/header';
import {
  Trophy, Star, Flame, BookOpen, Clock, Target,
  Sparkles, Award, Crown, Medal, Calendar, Edit3, Check, X,
  Zap, GraduationCap, TrendingUp, Heart, Shield, Rocket
} from 'lucide-react';

type UserProfile = {
  id: string;
  full_name: string;
  email: string;
  grade: number | null;
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
  { id: 'indigo', code: 'bg-indigo-600' },
  { id: 'emerald', code: 'bg-emerald-600' },
  { id: 'amber', code: 'bg-amber-600' },
  { id: 'rose', code: 'bg-rose-600' },
  { id: 'sky', code: 'bg-sky-600' },
  { id: 'violet', code: 'bg-violet-600' },
  { id: 'cyan', code: 'bg-cyan-600' },
  { id: 'fuchsia', code: 'bg-fuchsia-600' },
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
  const [bioText, setBioText] = useState('');
  const [selectedColor, setSelectedColor] = useState('indigo');
  const [selectedIcon, setSelectedIcon] = useState('rocket');
  const [rank, setRank] = useState(0);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const data = await getStudentProfileData();
      setProfile(data.profile as any);
      setStats(data.stats);
      setAchievements(data.achievements as any);
      setRank(data.rank);
      setBioText(data.profile?.bio || '');

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

    try {
      await updateStudentBio(bioText);
      setProfile({ ...profile, bio: bioText });
    } catch (err) {
      console.error(err);
    }
    setEditingBio(false);
  };

  const saveAvatar = async () => {
    if (!profile) return;

    const avatarStyle = `${selectedColor}:${selectedIcon}`;
    try {
      await updateStudentAvatar(avatarStyle);
      setProfile({ ...profile, avatar_style: avatarStyle });
    } catch (err) {
      console.error(err);
    }
    setEditingAvatar(false);
  };

  const getAvatarColor = () => {
    return AVATAR_COLORS.find(g => g.id === selectedColor)?.code || AVATAR_COLORS[0].code;
  };

  const getAvatarIcon = () => {
    return AVATAR_ICONS.find(i => i.id === selectedIcon)?.icon || Rocket;
  };

  const getAchievementIcon = (iconName: string) => {
    const icons: Record<string, any> = {
      'trophy': Trophy,
      'star': Star,
      'flame': Flame,
      'book-open': BookOpen,
      'clock': Clock,
      'target': Target,
      'medal': Medal,
      'crown': Crown,
      'zap': Zap,
      'award': Award,
    };
    return icons[iconName] || Trophy;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      'learning': { bg: 'bg-emerald-50', text: 'text-emerald-700' },
      'streak': { bg: 'bg-orange-50', text: 'text-orange-700' },
      'quiz': { bg: 'bg-violet-50', text: 'text-violet-700' },
      'time': { bg: 'bg-sky-50', text: 'text-sky-700' },
      'special': { bg: 'bg-amber-50', text: 'text-amber-700' },
    };
    return colors[category] || colors['learning'];
  };

  const formatLearningTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const formatJoinDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Sparkles className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  const currentLevelXp = (profile?.total_xp || 0) % 1000;
  const levelProgress = (currentLevelXp / 1000) * 100;
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const AvatarIcon = getAvatarIcon();
  const avatarColor = getAvatarColor();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <StudentHeader profile={profile as any} stats={stats} />

      <main className="relative z-10 max-w-5xl mx-auto px-6 py-8">
        <section className="mb-10">
          <Card className="bg-white border-slate-200 shadow-sm overflow-hidden overflow-visible">
            <div className="h-28 bg-slate-100 relative"></div>
            <CardContent className="px-8 pb-8 -mt-14 relative">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="relative group">
                  <div
                    className={`w-28 h-28 rounded-2xl ${avatarColor} flex items-center justify-center shadow-md border-4 border-white cursor-pointer`}
                    onClick={() => setEditingAvatar(true)}
                  >
                    <AvatarIcon size={40} className="text-white" />
                  </div>
                  <button
                    onClick={() => setEditingAvatar(true)}
                    className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-slate-50 border border-slate-200"
                  >
                    <Edit3 size={14} className="text-slate-600" />
                  </button>
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center shadow-sm border-2 border-white text-white text-xs font-bold">
                    {profile?.level || 1}
                  </div>
                </div>

                <div className="flex-1 pt-16 md:pt-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">{profile?.full_name}</h2>
                      <p className="text-slate-500 text-sm mt-0.5">{profile?.email}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-3 block sm:flex">
                        {profile?.grade && (
                          <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                            Grade {profile.grade}
                          </span>
                        )}
                        <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium inline-flex items-center">
                          <Calendar size={12} className="mr-1.5 text-slate-400" />
                          Joined {formatJoinDate(profile?.created_at || '')}
                        </span>
                        <div className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-medium inline-flex items-center">
                          <Medal size={12} className="mr-1.5" />
                          Class Rank #{rank}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5">
                    {editingBio ? (
                      <div className="flex items-start gap-3">
                        <textarea
                          value={bioText}
                          onChange={(e) => setBioText(e.target.value)}
                          placeholder="Tell us about yourself..."
                          className="flex-1 p-3 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none h-20 text-sm"
                          maxLength={200}
                        />
                        <div className="flex flex-col gap-2">
                          <button onClick={saveBio} className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">
                            <Check size={16} />
                          </button>
                          <button onClick={() => { setEditingBio(false); setBioText(profile?.bio || ''); }} className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => setEditingBio(true)}
                        className="p-3.5 rounded-lg bg-slate-50 border border-slate-100 cursor-pointer hover:border-slate-200 transition-colors group"
                      >
                        <p className="text-slate-600 text-sm">
                          {profile?.bio || 'Click to add a short bio...'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mb-10">
          <h3 className="text-xl font-bold flex items-center gap-2 mb-5 text-slate-900">
            <TrendingUp className="text-slate-400" size={20} />
            Overview
          </h3>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Star} value={(profile?.total_xp || 0).toLocaleString()} label="Total XP" color="text-amber-600" bg="bg-amber-50" />
            <StatCard icon={Flame} value={profile?.current_streak || 0} label="Current Streak" color="text-orange-600" bg="bg-orange-50" suffix=" days" />
            <StatCard icon={Trophy} value={profile?.longest_streak || 0} label="Longest Streak" color="text-indigo-600" bg="bg-indigo-50" suffix=" days" />
            <StatCard icon={BookOpen} value={profile?.total_lessons_completed || 0} label="Lessons Done" color="text-emerald-600" bg="bg-emerald-50" />
            <StatCard icon={Target} value={profile?.total_quizzes_completed || 0} label="Quizzes Passed" color="text-sky-600" bg="bg-sky-50" />
            <StatCard icon={Clock} value={formatLearningTime(profile?.total_learning_time_minutes || 0)} label="Time Spent" color="text-violet-600" bg="bg-violet-50" />
            <StatCard icon={Crown} value={profile?.level || 1} label="Current Level" color="text-fuchsia-600" bg="bg-fuchsia-50" />
            <StatCard icon={Award} value={unlockedCount} label="Achievements" color="text-rose-600" bg="bg-rose-50" suffix={`/${achievements.length}`} />
          </div>

          <Card className="mt-5 bg-white border-slate-200 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-slate-800 font-semibold">Level {profile?.level || 1}</p>
                <div className="text-right">
                  <span className="text-indigo-600 font-semibold text-sm">{currentLevelXp} / 1000 XP</span>
                </div>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-[width] duration-500 ease-out"
                  style={{ width: `${levelProgress}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xl font-bold flex items-center gap-2 text-slate-900">
              <Trophy className="text-slate-400" size={20} />
              Achievements Frame
              <span className="ml-2 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                {unlockedCount} obtained
              </span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => {
              const IconComponent = getAchievementIcon(achievement.icon);
              const catColors = getCategoryColor(achievement.category);

              return (
                <Card key={achievement.id} className={`${achievement.unlocked ? 'bg-white' : 'bg-slate-50 opacity-60'} border-slate-200 shadow-sm`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${achievement.unlocked
                        ? 'bg-amber-50 text-amber-600 border border-amber-100'
                        : 'bg-slate-100 text-slate-400'
                        }`}>
                        <IconComponent size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <h4 className="font-semibold text-slate-800 text-sm truncate">{achievement.name}</h4>
                          <span className={`px-2 py-0.5 rounded flex-shrink-0 text-[10px] font-medium ${catColors.bg} ${catColors.text}`}>
                            {achievement.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mb-2 leading-snug line-clamp-2">{achievement.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-slate-600">
                            +{achievement.xp_reward} XP
                          </span>
                          {achievement.unlocked && achievement.unlocked_at && (
                            <span className="text-[10px] text-slate-400">
                              {new Date(achievement.unlocked_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      </main>

      {editingAvatar && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setEditingAvatar(false)}>
          <div className="bg-white rounded-xl shadow-lg max-w-sm w-full p-6 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 mb-5">Customize Avatar</h3>

            <div className="flex justify-center mb-6">
              <div className={`w-20 h-20 rounded-xl ${AVATAR_COLORS.find(g => g.id === selectedColor)?.code} flex items-center justify-center shadow-sm`}>
                {React.createElement(AVATAR_ICONS.find(i => i.id === selectedIcon)?.icon || Rocket, { size: 36, className: 'text-white' })}
              </div>
            </div>

            <div className="mb-5">
              <p className="text-xs font-semibold text-slate-500 mb-2">Background Color</p>
              <div className="flex flex-wrap gap-2">
                {AVATAR_COLORS.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => setSelectedColor(color.id)}
                    className={`w-8 h-8 rounded-full ${color.code} transition-all ${selectedColor === color.id ? 'ring-2 ring-offset-2 ring-indigo-600 scale-110' : 'hover:scale-105 opacity-80'}`}
                  />
                ))}
              </div>
            </div>

            <div className="mb-6">
              <p className="text-xs font-semibold text-slate-500 mb-2">Icon Overlay</p>
              <div className="grid grid-cols-4 gap-2">
                {AVATAR_ICONS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedIcon(item.id)}
                    className={`aspect-square rounded-lg flex items-center justify-center transition-colors ${selectedIcon === item.id ? 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                  >
                    <item.icon size={20} />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setEditingAvatar(false)}>Cancel</Button>
              <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={saveAvatar}>Save Changes</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, value, label, color, bg, suffix = '' }: any) {
  return (
    <Card className="bg-white border-slate-200 shadow-sm">
      <CardContent className="p-4">
        <div className={`w-8 h-8 rounded-md ${bg} ${color} flex items-center justify-center mb-3`}>
          <Icon size={16} />
        </div>
        <div>
          <p className="text-xl font-bold text-slate-800">{value}{suffix}</p>
          <p className="text-xs text-slate-500">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
