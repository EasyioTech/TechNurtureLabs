'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { fetchApprovedSchools, registerStudent } from '@/modules/auth/register-actions';
import { toast } from 'sonner';
import { GraduationCap, ArrowLeft, User, School, Loader2, Sparkles, Check, Zap, ChevronsUpDown, Search, UserCircle2, ArrowRight, Trophy } from 'lucide-react';
import { NeumorphicButton } from '@/components/landing/NeumorphicButton';
import { ScrollReveal } from '@/components/landing/ScrollReveal';

type SchoolOption = {
  id: string;
  name: string;
  city: string;
  state: string;
  classes_available: { id: string; name: string; level: number }[];
};

export default function StudentRegistrationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [selectedSchool, setSelectedSchool] = useState<SchoolOption | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [schoolSearchOpen, setSchoolSearchOpen] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    school_id: '',
    class_id: '',
    gender: '',
  });
  const [accountSubStep, setAccountSubStep] = useState<'email' | 'pin' | 'confirm'>('email');
  const [pinFocused, setPinFocused] = useState(false);

  useEffect(() => {
    fetchSchools();
  }, []);

  async function fetchSchools() {
    setLoadingSchools(true);
    try {
      const data = await fetchApprovedSchools();
      setSchools(data as any);
    } catch (err) {
      console.error(err);
    }
    setLoadingSchools(false);
  }

  const handleSchoolChange = (schoolId: string) => {
    const school = schools.find(s => s.id === schoolId);
    setSelectedSchool(school || null);
    setFormData(prev => ({ ...prev, school_id: schoolId, class_id: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.full_name || !formData.email || !formData.password || !formData.school_id || !formData.class_id || !formData.gender) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirm_password) {
      toast.error('PINs do not match');
      return;
    }

    if (!/^\d{6}$/.test(formData.password)) {
      toast.error('PIN must be exactly 6 digits');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Creating your account...');

    try {
      const result = await registerStudent(formData);

      if (result.success) {
        toast.success('Registration successful! You can now log in.', { id: toastId });
        router.push('/login');
      } else {
        toast.error(result.error || 'Registration failed. Please try again.', { id: toastId });
      }
    } catch (err: any) {
      toast.error('Connection error. Please try again.', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const availableClasses = selectedSchool?.classes_available || [];
  const canProceedStep1 = formData.full_name && formData.gender && formData.school_id && formData.class_id;
  const canProceedStep2 = formData.email && /^\d{6}$/.test(formData.password) && formData.password === formData.confirm_password;

  return (
    <div className="h-screen overflow-hidden bg-slate-50 text-slate-900 flex font-sans selection:bg-indigo-100 selection:text-indigo-900">

      {/* Background Grid & Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-100/40 rounded-full blur-[140px]" />
      </div>

      {/* Left Sidebar: Brand & Journey Steps */}
      <div className="hidden lg:flex flex-[0.85] relative overflow-hidden bg-white border-r border-slate-200/60 z-10">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.08),transparent)]" />
          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-indigo-50/40 to-transparent" />

          {/* Animated decorative elements */}
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.5, 0.3],
              rotate: [0, 5, 0]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-20 -left-20 w-80 h-80 bg-indigo-200/20 rounded-full blur-[100px]"
          />
        </div>

        <div className="relative z-10 w-full h-full flex flex-col justify-between p-12">
          <header>
            <Link href="/" className="flex items-center gap-3 group w-fit">
              <div className="w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center transition-all group-hover:rotate-6 group-hover:scale-110 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                <Sparkles className="text-white" size={24} />
              </div>
              <div>
                <span className="text-2xl font-black tracking-tighter text-slate-950 block leading-none">TechNurture</span>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-[0.2em] ml-0.5">Labs</span>
              </div>
            </Link>
          </header>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="max-w-md"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100/50 mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest">Enrollment Open 2024-25</span>
            </div>

            <h2 className="text-[44px] font-black mb-6 text-slate-900 leading-[1.05] tracking-tight">
              Start your <span className="text-indigo-600">learning</span> adventure today.
            </h2>

            <p className="text-slate-500 text-lg font-medium leading-relaxed mb-10">
              Transform the way you learn with world-class resources designed specifically for your growth.
            </p>

            <div className="grid gap-6">
              {[
                {
                  icon: <UserCircle2 className="text-indigo-600" size={20} />,
                  title: "Smart Profile",
                  desc: "Personalized dashboard that tracks your wins."
                },
                {
                  icon: <Zap className="text-amber-500" size={20} />,
                  title: "Fast Track",
                  desc: "Learn complex topics 3x faster with AI aids."
                },
                {
                  icon: <Trophy className="text-emerald-500" size={20} />,
                  title: "Global Rank",
                  desc: "Compete and earn certificates of excellence."
                }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + (i * 0.1) }}
                  className="flex items-start gap-4 p-4 rounded-2xl bg-white/50 border border-slate-100 hover:border-indigo-100 hover:bg-white transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0 border border-slate-50">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 mb-1">{item.title}</h4>
                    <p className="text-xs font-medium text-slate-500 leading-snug">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <footer className="flex items-center justify-between pt-10 border-t border-slate-100">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-9 h-9 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center overflow-hidden">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=student${i}`} alt="Avatar" className="w-full h-full object-cover" />
                </div>
              ))}
              <div className="w-9 h-9 rounded-full border-2 border-white bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">
                12k+
              </div>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Trusted by Schools globally</p>
          </footer>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center bg-white/50 lg:bg-transparent relative z-10 overflow-y-auto">
        <div className="w-full max-w-[440px] px-6 py-12 lg:py-0 lg:px-0 lg:my-auto scroll-smooth">
          <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 mb-10 transition-all font-bold group cursor-pointer lg:absolute lg:top-12 lg:left-12">
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
            <span className="text-xs uppercase tracking-widest">Back to site</span>
          </Link>

          <div className="mb-8 lg:hidden flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center shadow-lg">
              <Sparkles className="text-white" size={20} />
            </div>
            <span className="text-xl font-black tracking-tighter text-slate-950">TechNurture</span>
          </div>

          <div className="text-center lg:text-left space-y-3 mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-600">
              <UserCircle2 size={14} className="text-indigo-600" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Student Enrollment</span>
            </div>
            <h1 className="text-4xl font-black text-slate-950 tracking-tight leading-none">Create Account</h1>
            <p className="text-slate-500 font-medium text-base">Step {step} of 2 — Getting your details</p>
          </div>

          {/* Progress Bar */}
          <div className="flex gap-2 mb-10">
            <div className={`h-1.5 rounded-full transition-all duration-700 ${step >= 1 ? 'bg-indigo-600 flex-1 shadow-[0_0_10px_rgba(79,70,229,0.3)]' : 'bg-slate-100 flex-1'}`} />
            <div className={`h-1.5 rounded-full transition-all duration-700 ${step >= 2 ? 'bg-indigo-600 flex-1 shadow-[0_0_10px_rgba(79,70,229,0.3)]' : 'bg-slate-100 flex-1'}`} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-4"
                >
                  <div className="space-y-1">
                    <Label className="text-slate-600 font-bold text-[10px] ml-1 uppercase tracking-wider">Full Name *</Label>
                    <Input
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="bg-white border-slate-200 h-12 px-5 text-slate-900 placeholder:text-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl transition-all font-medium text-base shadow-sm"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-600 font-bold text-sm ml-1 uppercase tracking-wider">Gender</Label>
                      <Select
                        value={formData.gender}
                        onValueChange={(value) => setFormData({ ...formData, gender: value })}
                      >
                        <SelectTrigger className="w-full bg-white border-slate-200 h-14 px-5 text-slate-900 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium">
                          <SelectValue placeholder="Select one" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-slate-200 rounded-xl overflow-hidden shadow-2xl">
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-600 font-bold text-sm ml-1 uppercase tracking-wider">Your Institution</Label>
                    {loadingSchools ? (
                      <div className="flex items-center gap-2 text-slate-400 p-4 bg-white border border-slate-100 rounded-2xl">
                        <Loader2 className="animate-spin" size={18} />
                        Syncing institutional catalog...
                      </div>
                    ) : (
                      <Popover open={schoolSearchOpen} onOpenChange={setSchoolSearchOpen}>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="w-full bg-white border border-slate-200 h-14 px-5 text-slate-900 rounded-2xl flex items-center justify-between text-left focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer"
                          >
                            <span className={selectedSchool ? "text-slate-900 font-bold" : "text-slate-400 font-medium"}>
                              {selectedSchool ? `${selectedSchool.name}` : "Search for your school"}
                            </span>
                            <ChevronsUpDown size={18} className="text-slate-400" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden" align="start">
                          <Command className="bg-white">
                            <div className="flex items-center border-b border-slate-100 px-3">
                              <Search className="mr-2 h-4 w-4 shrink-0 text-slate-400" />
                              <CommandInput placeholder="Type school name..." className="h-12 w-full text-slate-900 focus:ring-0 border-0" />
                            </div>
                            <CommandList className="max-h-60 scroll-smooth">
                              <CommandEmpty className="p-4 text-sm text-slate-500 font-medium">No results found.</CommandEmpty>
                              <CommandGroup>
                                {schools.map((school) => (
                                  <CommandItem
                                    key={school.id}
                                    value={`${school.name} ${school.city}`}
                                    onSelect={() => {
                                      handleSchoolChange(school.id);
                                      setSchoolSearchOpen(false);
                                    }}
                                    className="px-4 py-3 text-slate-700 hover:bg-slate-50 aria-selected:bg-slate-50 cursor-pointer flex items-center justify-between font-medium"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className={`w-2 h-2 rounded-full ${formData.school_id === school.id ? 'bg-indigo-500' : 'bg-transparent'}`} />
                                      <span>{school.name}</span>
                                    </div>
                                    <span className="text-[10px] uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-1 rounded-md">{school.city}</span>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>

                  {selectedSchool && (
                    <motion.div
                      className="space-y-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Label className="text-slate-600 font-bold text-sm ml-1 uppercase tracking-wider">Academic Class</Label>
                      <Select
                        value={formData.class_id}
                        onValueChange={(value) => setFormData({ ...formData, class_id: value })}
                      >
                        <SelectTrigger className="w-full bg-white border border-slate-200 h-14 px-5 text-slate-900 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium">
                          <SelectValue placeholder="Select your current class" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-slate-200 rounded-xl overflow-hidden shadow-2xl">
                          {availableClasses.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id}>
                              Class {cls.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </motion.div>
                  )}

                  <div className="pt-2">
                    <NeumorphicButton
                      type="button"
                      onClick={() => setStep(2)}
                      disabled={!canProceedStep1}
                      variant="primary"
                      className="w-full !h-14 !text-base !rounded-2xl !bg-slate-900 hover:!bg-slate-800 shadow-xl shadow-slate-900/10 transition-all font-black uppercase tracking-widest cursor-pointer group"
                    >
                      Continue to account
                      <ArrowRight size={18} className="ml-2 transition-transform group-hover:translate-x-1" />
                    </NeumorphicButton>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6"
                >
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-sm font-bold text-slate-400 hover:text-slate-900 flex items-center gap-1 mb-8 cursor-pointer transition-colors"
                  >
                    <ArrowLeft size={16} />
                    Back to Profile
                  </button>

                  <div className="space-y-8">
                    {/* Sub-step 1: Email */}
                    <div className="space-y-2">
                      <Label className="text-slate-600 font-bold text-xs ml-1 uppercase tracking-[0.2em]">Institutional Email</Label>
                      <div className="relative group">
                        <Input
                          type="email"
                          autoFocus
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className={`bg-white border-2 h-16 px-6 text-slate-900 placeholder:text-slate-300 focus:ring-4 transition-all font-bold text-lg rounded-2xl shadow-sm
                            ${/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) ? 'border-emerald-500/50 bg-emerald-50/10' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10'}
                          `}
                          placeholder="yourname@school.com"
                        />
                        {/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && (
                          <div className="absolute right-5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center animate-in zoom-in">
                            <Check size={14} className="text-white" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Sub-step 2: PIN (Revealed after valid Email) */}
                    <AnimatePresence>
                      {/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-4"
                        >
                          <div className="flex items-center justify-between px-1">
                            <Label className="text-slate-600 font-bold text-xs uppercase tracking-[0.2em]">Set 6-Digit PIN</Label>
                            {formData.password.length === 6 && <Check size={16} className="text-emerald-500" />}
                          </div>

                          <div className="relative">
                            <input
                              type="password"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              maxLength={6}
                              value={formData.password}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                setFormData({ ...formData, password: val });
                              }}
                              onFocus={() => setPinFocused(true)}
                              onBlur={() => setPinFocused(false)}
                              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                              autoComplete="new-password"
                            />
                            <div className="flex justify-between gap-2 sm:gap-3">
                              {[0, 1, 2, 3, 4, 5].map(i => (
                                <div
                                  key={i}
                                  className={`flex-1 h-16 rounded-2xl border-2 flex items-center justify-center transition-all duration-300
                                    ${formData.password[i]
                                      ? 'border-slate-900 bg-white shadow-md'
                                      : (i === formData.password.length && pinFocused)
                                        ? 'border-indigo-600 bg-indigo-50/50 ring-4 ring-indigo-500/10 scale-105'
                                        : 'border-slate-100 bg-slate-50/50'}
                                  `}
                                >
                                  {formData.password[i] ? (
                                    <div className="w-3.5 h-3.5 rounded-full bg-slate-900 animate-in zoom-in duration-300" />
                                  ) : (
                                    <div className={`w-1.5 h-1.5 rounded-full transition-colors ${i === formData.password.length && pinFocused ? 'bg-indigo-400 animate-pulse' : 'bg-slate-200'}`} />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Sub-step 3: Confirm PIN (Revealed after 6 digit PIN) */}
                    <AnimatePresence>
                      {formData.password.length === 6 && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-4"
                        >
                          <div className="flex items-center justify-between px-1">
                            <Label className="text-slate-600 font-bold text-xs uppercase tracking-[0.2em]">Confirm your PIN</Label>
                            {formData.confirm_password && formData.password === formData.confirm_password && (
                              <div className="flex items-center gap-1.5 text-emerald-600">
                                <span className="text-[10px] font-black uppercase tracking-widest">Match</span>
                                <Check size={14} className="stroke-[3]" />
                              </div>
                            )}
                          </div>

                          <div className="relative">
                            <input
                              type="password"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              maxLength={6}
                              value={formData.confirm_password}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                setFormData({ ...formData, confirm_password: val });
                              }}
                              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                              autoComplete="new-password"
                            />
                            <div className="flex justify-between gap-2 sm:gap-3">
                              {[0, 1, 2, 3, 4, 5].map(i => (
                                <div
                                  key={i}
                                  className={`flex-1 h-16 rounded-2xl border-2 flex items-center justify-center transition-all duration-300
                                    ${formData.confirm_password[i]
                                      ? formData.password === formData.confirm_password
                                        ? 'border-emerald-500 bg-emerald-50/30'
                                        : 'border-rose-400 bg-rose-50/30'
                                      : 'border-slate-100 bg-slate-50/50'}
                                  `}
                                >
                                  {formData.confirm_password[i] ? (
                                    <div className={`w-3.5 h-3.5 rounded-full animate-in zoom-in duration-300 ${formData.password === formData.confirm_password ? 'bg-emerald-600' : 'bg-rose-500'}`} />
                                  ) : (
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="pt-6">
                    <AnimatePresence>
                      {canProceedStep2 && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                        >
                          <NeumorphicButton
                            type="submit"
                            disabled={loading}
                            variant="primary"
                            className={`w-full !h-16 !text-base !rounded-2xl shadow-2xl transition-all font-black uppercase tracking-[0.2em] cursor-pointer
                              ${!loading ? '!bg-indigo-600 hover:!bg-indigo-700 !text-white' : '!bg-slate-200'}
                            `}
                          >
                            {loading ? (
                              <>
                                <Loader2 className="mr-2 animate-spin" size={20} />
                                Creating Adventure...
                              </>
                            ) : (
                              <>
                                <span>Complete & Start</span>
                                <GraduationCap size={20} className="ml-3" />
                              </>
                            )}
                          </NeumorphicButton>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          <div className="mt-12 pt-10 border-t border-slate-100/60 flex flex-col items-center gap-6">
            <div className="flex items-center gap-3 whitespace-nowrap">
              <p className="text-slate-500 font-medium text-sm">
                Already using TechNurture?
              </p>
              <Link href="/login" className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-black text-xs uppercase tracking-widest transition-all cursor-pointer">
                Sign in
              </Link>
            </div>

            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] text-center max-w-[280px] leading-relaxed">
              By joining, you agree to our <span className="text-slate-500 underline underline-offset-4 decoration-slate-200">Terms of Learning</span> & <span className="text-slate-500 underline underline-offset-4 decoration-slate-200">Safety Policy</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
