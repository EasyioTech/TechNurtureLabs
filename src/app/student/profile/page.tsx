'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
  ArrowLeft, Trophy, Star, Flame, BookOpen, Clock, Target, 
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

const AVATAR_GRADIENTS = [
  { id: 'violet', from: 'from-violet-500', to: 'to-purple-600', shadow: 'shadow-violet-200' },
  { id: 'emerald', from: 'from-emerald-500', to: 'to-teal-600', shadow: 'shadow-emerald-200' },
  { id: 'amber', from: 'from-amber-500', to: 'to-orange-600', shadow: 'shadow-amber-200' },
  { id: 'rose', from: 'from-rose-500', to: 'to-pink-600', shadow: 'shadow-rose-200' },
  { id: 'sky', from: 'from-sky-500', to: 'to-blue-600', shadow: 'shadow-sky-200' },
  { id: 'indigo', from: 'from-indigo-500', to: 'to-blue-600', shadow: 'shadow-indigo-200' },
  { id: 'cyan', from: 'from-cyan-500', to: 'to-teal-600', shadow: 'shadow-cyan-200' },
  { id: 'fuchsia', from: 'from-fuchsia-500', to: 'to-pink-600', shadow: 'shadow-fuchsia-200' },
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
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBio, setEditingBio] = useState(false);
  const [editingAvatar, setEditingAvatar] = useState(false);
  const [bioText, setBioText] = useState('');
  const [selectedGradient, setSelectedGradient] = useState('violet');
  const [selectedIcon, setSelectedIcon] = useState('rocket');
  const [rank, setRank] = useState(0);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileData) {
      setProfile(profileData);
      setBioText(profileData.bio || '');
      
      if (profileData.avatar_style) {
        const [gradient, icon] = profileData.avatar_style.split(':');
        setSelectedGradient(gradient || 'violet');
        setSelectedIcon(icon || 'rocket');
      }
    }

    const { data: allAchievements } = await supabase
      .from('achievements')
      .select('id, name, description, icon, category, xp_reward');

    if (allAchievements) {
      const { data: userAchievements } = await supabase
        .from('user_achievements')
        .select('achievement_id, unlocked_at')
        .eq('user_id', user.id);

      const unlockedMap = new Map(
        userAchievements?.map(ua => [ua.achievement_id, ua.unlocked_at]) || []
      );

      const formattedAchievements: Achievement[] = allAchievements.map(a => ({
        ...a,
        unlocked: unlockedMap.has(a.id),
        unlocked_at: unlockedMap.get(a.id)
      }));

      formattedAchievements.sort((a, b) => {
        if (a.unlocked && !b.unlocked) return -1;
        if (!a.unlocked && b.unlocked) return 1;
        return 0;
      });

      setAchievements(formattedAchievements);
    }

    const { count: rankCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gt('total_xp', profileData?.total_xp || 0)
      .eq('role', 'student');

    setRank((rankCount || 0) + 1);
    setLoading(false);
  };

  const saveBio = async () => {
    if (!profile) return;
    
    await supabase
      .from('profiles')
      .update({ bio: bioText })
      .eq('id', profile.id);
    
    setProfile({ ...profile, bio: bioText });
    setEditingBio(false);
  };

  const saveAvatar = async () => {
    if (!profile) return;
    
    const avatarStyle = `${selectedGradient}:${selectedIcon}`;
    await supabase
      .from('profiles')
      .update({ avatar_style: avatarStyle })
      .eq('id', profile.id);
    
    setProfile({ ...profile, avatar_style: avatarStyle });
    setEditingAvatar(false);
  };

  const getAvatarGradient = () => {
    return AVATAR_GRADIENTS.find(g => g.id === selectedGradient) || AVATAR_GRADIENTS[0];
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
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      'learning': { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
      'streak': { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
      'quiz': { bg: 'bg-violet-100', text: 'text-violet-700', border: 'border-violet-200' },
      'time': { bg: 'bg-sky-100', text: 'text-sky-700', border: 'border-sky-200' },
      'special': { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-sky-50">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
          <Sparkles className="w-8 h-8 text-violet-500" />
        </motion.div>
      </div>
    );
  }

  const currentLevelXp = (profile?.total_xp || 0) % 1000;
  const levelProgress = (currentLevelXp / 1000) * 100;
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const AvatarIcon = getAvatarIcon();
  const avatarGradient = getAvatarGradient();

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-sky-50 text-slate-900">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet-200/40 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-sky-200/40 rounded-full blur-3xl" />
      </div>

      <header className="relative z-50 border-b border-slate-200/60 bg-white/70 backdrop-blur-xl sticky top-0">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/student" className="flex items-center gap-3 text-slate-600 hover:text-violet-600 transition-colors">
              <ArrowLeft size={20} />
              <span className="font-medium">Back to Dashboard</span>
            </Link>
            <h1 className="font-bold text-lg text-slate-800">My Profile</h1>
            <div className="w-32" />
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-6 py-8">
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <Card className="bg-white/80 backdrop-blur-xl border-slate-200/60 shadow-xl overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-600 relative">
              <div 
                className="absolute inset-0 opacity-50" 
                style={{ backgroundImage: `url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')` }}
              />
            </div>
            <CardContent className="px-8 pb-8 -mt-16 relative">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="relative group">
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className={`w-32 h-32 rounded-2xl bg-gradient-to-br ${avatarGradient.from} ${avatarGradient.to} flex items-center justify-center shadow-xl ${avatarGradient.shadow} border-4 border-white cursor-pointer`}
                    onClick={() => setEditingAvatar(true)}
                  >
                    <AvatarIcon size={48} className="text-white" />
                  </motion.div>
                  <button 
                    onClick={() => setEditingAvatar(true)}
                    className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-slate-50 transition-colors border border-slate-200"
                  >
                    <Edit3 size={16} className="text-slate-600" />
                  </button>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
                    <span className="text-white text-xs font-bold">{profile?.level || 1}</span>
                  </div>
                </div>

                <div className="flex-1 pt-16 md:pt-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-3xl font-black text-slate-800">{profile?.full_name}</h2>
                      <p className="text-slate-500 mt-1">{profile?.email}</p>
                      <div className="flex items-center gap-3 mt-3">
                        {profile?.grade && (
                          <span className="px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-sm font-semibold">
                            Grade {profile.grade}
                          </span>
                        )}
                        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-sm">
                          <Calendar size={12} className="inline mr-1" />
                          Joined {formatJoinDate(profile?.created_at || '')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-100 text-amber-700 shadow-sm">
                      <Medal size={18} />
                      <span className="font-bold">Rank #{rank}</span>
                    </div>
                  </div>

                  <div className="mt-6">
                    {editingBio ? (
                      <div className="flex items-start gap-3">
                        <textarea
                          value={bioText}
                          onChange={(e) => setBioText(e.target.value)}
                          placeholder="Tell us about yourself..."
                          className="flex-1 p-3 rounded-xl border border-slate-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none resize-none h-20 text-sm"
                          maxLength={200}
                        />
                        <div className="flex flex-col gap-2">
                          <button onClick={saveBio} className="p-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors">
                            <Check size={16} />
                          </button>
                          <button onClick={() => { setEditingBio(false); setBioText(profile?.bio || ''); }} className="p-2 rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors">
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        onClick={() => setEditingBio(true)}
                        className="p-4 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:border-violet-300 transition-colors group"
                      >
                        <p className="text-slate-600 text-sm">
                          {profile?.bio || 'Click to add a bio...'}
                        </p>
                        <Edit3 size={14} className="text-slate-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-10"
        >
          <h3 className="text-xl font-bold flex items-center gap-2 mb-6 text-slate-800">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md">
              <TrendingUp className="text-white" size={16} />
            </div>
            Statistics
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={Star} value={(profile?.total_xp || 0).toLocaleString()} label="Total XP" gradient="from-amber-400 to-orange-500" bgColor="bg-amber-50" />
            <StatCard icon={Flame} value={profile?.current_streak || 0} label="Current Streak" gradient="from-orange-400 to-red-500" bgColor="bg-orange-50" suffix=" days" />
            <StatCard icon={Trophy} value={profile?.longest_streak || 0} label="Longest Streak" gradient="from-violet-400 to-purple-500" bgColor="bg-violet-50" suffix=" days" />
            <StatCard icon={BookOpen} value={profile?.total_lessons_completed || 0} label="Lessons Done" gradient="from-emerald-400 to-teal-500" bgColor="bg-emerald-50" />
            <StatCard icon={Target} value={profile?.total_quizzes_completed || 0} label="Quizzes Passed" gradient="from-sky-400 to-blue-500" bgColor="bg-sky-50" />
            <StatCard icon={Clock} value={formatLearningTime(profile?.total_learning_time_minutes || 0)} label="Learning Time" gradient="from-indigo-400 to-blue-500" bgColor="bg-indigo-50" />
            <StatCard icon={Crown} value={profile?.level || 1} label="Current Level" gradient="from-fuchsia-400 to-pink-500" bgColor="bg-fuchsia-50" />
            <StatCard icon={Award} value={unlockedCount} label="Achievements" gradient="from-rose-400 to-pink-500" bgColor="bg-rose-50" suffix={`/${achievements.length}`} />
          </div>

          <Card className="mt-6 bg-white/80 backdrop-blur-xl border-slate-200/60 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-slate-500 text-sm font-medium">Level Progress</p>
                  <p className="text-2xl font-black text-slate-800">Level {profile?.level || 1}</p>
                </div>
                <div className="text-right">
                  <p className="text-violet-600 font-bold">{currentLevelXp} / 1000 XP</p>
                  <p className="text-slate-500 text-sm">{1000 - currentLevelXp} XP to next level</p>
                </div>
              </div>
              <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${levelProgress}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
                />
              </div>
            </CardContent>
          </Card>
        </motion.section>

        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
                <Trophy className="text-white" size={16} />
              </div>
              Achievements
              <span className="ml-2 px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 text-sm font-semibold">
                {unlockedCount}/{achievements.length}
              </span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => {
              const IconComponent = getAchievementIcon(achievement.icon);
              const catColors = getCategoryColor(achievement.category);
              
              return (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: achievement.unlocked ? 1.02 : 1 }}
                >
                  <Card className={`${achievement.unlocked ? 'bg-white' : 'bg-slate-50 opacity-60'} border-slate-200 shadow-lg overflow-hidden transition-all`}>
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-md ${
                          achievement.unlocked 
                            ? 'bg-gradient-to-br from-amber-400 to-orange-500' 
                            : 'bg-slate-200'
                        }`}>
                          <IconComponent size={24} className={achievement.unlocked ? 'text-white' : 'text-slate-400'} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-slate-800">{achievement.name}</h4>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${catColors.bg} ${catColors.text}`}>
                              {achievement.category}
                            </span>
                          </div>
                          <p className="text-sm text-slate-500 mt-1">{achievement.description}</p>
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-1.5 text-amber-600">
                              <Star size={14} fill="currentColor" />
                              <span className="text-sm font-bold">+{achievement.xp_reward} XP</span>
                            </div>
                            {achievement.unlocked && achievement.unlocked_at && (
                              <span className="text-xs text-slate-400">
                                {new Date(achievement.unlocked_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.section>
      </main>

      <AnimatePresence>
        {editingAvatar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setEditingAvatar(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              <h3 className="text-xl font-bold text-slate-800 mb-6">Customize Your Avatar</h3>

              <div className="flex justify-center mb-8">
                <motion.div 
                  key={`${selectedGradient}-${selectedIcon}`}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${AVATAR_GRADIENTS.find(g => g.id === selectedGradient)?.from} ${AVATAR_GRADIENTS.find(g => g.id === selectedGradient)?.to} flex items-center justify-center shadow-xl`}
                >
                  {React.createElement(AVATAR_ICONS.find(i => i.id === selectedIcon)?.icon || Rocket, { size: 40, className: 'text-white' })}
                </motion.div>
              </div>

              <div className="mb-6">
                <p className="text-sm font-semibold text-slate-600 mb-3">Choose Color</p>
                <div className="grid grid-cols-4 gap-3">
                  {AVATAR_GRADIENTS.map((gradient) => (
                    <button
                      key={gradient.id}
                      onClick={() => setSelectedGradient(gradient.id)}
                      className={`w-full aspect-square rounded-xl bg-gradient-to-br ${gradient.from} ${gradient.to} transition-all ${
                        selectedGradient === gradient.id 
                          ? 'ring-4 ring-violet-400 ring-offset-2 scale-110' 
                          : 'hover:scale-105'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="mb-8">
                <p className="text-sm font-semibold text-slate-600 mb-3">Choose Icon</p>
                <div className="grid grid-cols-4 gap-3">
                  {AVATAR_ICONS.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedIcon(item.id)}
                      className={`w-full aspect-square rounded-xl bg-slate-100 flex items-center justify-center transition-all ${
                        selectedIcon === item.id 
                          ? 'ring-4 ring-violet-400 ring-offset-2 bg-violet-100 scale-110' 
                          : 'hover:bg-slate-200 hover:scale-105'
                      }`}
                    >
                      <item.icon size={24} className={selectedIcon === item.id ? 'text-violet-600' : 'text-slate-600'} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setEditingAvatar(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white"
                  onClick={saveAvatar}
                >
                  Save Avatar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ icon: Icon, value, label, gradient, bgColor, suffix = '' }: any) {
  return (
    <Card className={`${bgColor} border-0 shadow-lg hover:shadow-xl transition-all`}>
      <CardContent className="p-4">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md mb-3`}>
          <Icon size={18} className="text-white" />
        </div>
        <p className="text-2xl font-black text-slate-800">{value}{suffix}</p>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
      </CardContent>
    </Card>
  );
}
