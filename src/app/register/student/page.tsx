'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
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
import { fetchApprovedSchools, registerStudent, checkIdentifierExists } from '@/modules/auth/register-actions';
import { toast } from 'sonner';
import {
  ArrowLeft, ArrowRight, Loader2, Check, ChevronsUpDown, Search,
  Eye, EyeOff, User, School, Lock, Phone, Mail, GraduationCap, AlertCircle, CheckCircle2,
} from 'lucide-react';
import { StudentRegistrationSidebar } from '@/modules/auth/components/StudentRegistrationSidebar';
import { ManIcon, WomanIcon } from '@/modules/auth/components/GenderIcons';

type SchoolOption = {
  id: string;
  name: string;
  city: string;
  state: string;
  classes_available: { id: string; name: string; level: number }[];
};

const STEPS = [
  { num: 1, label: 'About You',   icon: User },
  { num: 2, label: 'Your School', icon: School },
  { num: 3, label: 'Sign-in Info', icon: Lock },
];

export default function StudentRegistrationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [selectedSchool, setSelectedSchool] = useState<SchoolOption | null>(null);
  const [step, setStep] = useState(1);
  const [schoolSearchOpen, setSchoolSearchOpen] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [pinFocused, setPinFocused] = useState(false);
  const [pinConfirmFocused, setPinConfirmFocused] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [contactCheckLoading, setContactCheckLoading] = useState(false);
  const [contactVerified, setContactVerified] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',           // holds email OR phone number
    password: '',
    confirm_password: '',
    school_id: '',
    class_id: '',
    gender: '',
  });

  useEffect(() => {
    fetchSchools();
    import('@/components/landing/actions').then(m => m.getPlatformSettings()).then(setSettings);
  }, []);

  async function fetchSchools() {
    setLoadingSchools(true);
    try {
      const data = await fetchApprovedSchools();
      setSchools(data as any);
    } catch { }
    setLoadingSchools(false);
  }

  const [studentLimitInfo, setStudentLimitInfo] = useState<any>(null);
  const [checkingLimit, setCheckingLimit] = useState(false);

  const checkStudentLimit = async (schoolId: string) => {
    setCheckingLimit(true);
    try {
      const res = await fetch(`/api/admin/check-student-limit?school_id=${schoolId}`);
      const data = await res.json();
      setStudentLimitInfo(data);
    } catch (err) {
      console.error('Failed to check student limit:', err);
      setStudentLimitInfo(null);
    } finally {
      setCheckingLimit(false);
    }
  };

  const handleSchoolChange = (schoolId: string) => {
    const school = schools.find(s => s.id === schoolId);
    setSelectedSchool(school || null);
    setFormData(prev => ({ ...prev, school_id: schoolId, class_id: '' }));
    setErrors(prev => ({ ...prev, school_id: '' }));
    checkStudentLimit(schoolId);
  };

  // ── Validation per step ───────────────────────────────────────
  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!formData.full_name.trim()) e.full_name = 'Please enter your full name';
    if (!formData.gender) e.gender = 'Please choose your gender';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e: Record<string, string> = {};
    if (!formData.school_id) e.school_id = 'Please select your school';
    if (!formData.class_id) e.class_id = 'Please select your class';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep3 = () => {
    const e: Record<string, string> = {};
    if (!formData.email.trim()) {
      e.email = 'Please enter your phone number or email';
    } else {
      const isEmailFmt = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
      const digits = formData.email.replace(/\D/g, '');
      const isPhoneFmt = !isEmailFmt && digits.length >= 7 && digits.length <= 15;
      if (!isEmailFmt && !isPhoneFmt) e.email = 'Enter a valid phone number (e.g. 9876543210) or email address';
    }
    if (formData.password.length !== 6) e.password = 'Your PIN must be exactly 6 digits';
    if (formData.confirm_password !== formData.password) e.confirm_password = 'PINs don\'t match — please try again';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goNext = () => {
    if (step === 1 && validateStep1()) { setErrors({}); setStep(2); }
    else if (step === 2 && validateStep2()) { setErrors({}); setStep(3); setContactVerified(false); }
  };

  const goBack = () => {
    setErrors({});
    setStep(s => Math.max(s - 1, 1));
  };

  // ── Contact check (step 3) ──────────────────────────────────
  const handleContactCheck = async () => {
    const isEmailFmt = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
    const digits = formData.email.replace(/\D/g, '');
    const isPhoneFmt = !isEmailFmt && digits.length >= 7 && digits.length <= 15;

    if (!isEmailFmt && !isPhoneFmt) {
      setErrors(prev => ({ ...prev, email: 'Enter a valid phone number or email address' }));
      return;
    }

    setContactCheckLoading(true);
    try {
      const res = await checkIdentifierExists(formData.email);
      if (res.exists && res.role !== 'student') {
        setErrors(prev => ({ ...prev, email: 'This contact is registered as a school admin, not a student' }));
        toast.error('Admin account detected');
      } else {
        setContactVerified(true);
        setErrors(prev => ({ ...prev, email: '' }));
        if (res.exists) {
          toast.info('Account found! Enter your PIN to sign in.');
        }
      }
    } catch {
      toast.error('Could not verify. Please try again.');
    } finally {
      setContactCheckLoading(false);
    }
  };

  // ── Final submit ──────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep3()) {
      toast.error('Please fix the highlighted errors before continuing');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Creating your account…');
    try {
      // CRITICAL FIX: Recheck student limit before submission to catch race conditions
      // Another student might have registered between school selection and form submission
      if (formData.school_id && studentLimitInfo && !studentLimitInfo.can_add) {
        toast.error('Student registration limit has been reached for this school. Please contact your school administrator.', { id: toastId });
        setLoading(false);
        return;
      }

      // If we don't have limit info, fetch it fresh
      if (formData.school_id && !studentLimitInfo) {
        await checkStudentLimit(formData.school_id);
      }

      const result = await registerStudent(formData);
      if (result.success) {
        const isExisting = 'isExisting' in result && (result as any).isExisting;
        const isNew = 'isNew' in result && (result as any).isNew;
        if (isExisting) {
          toast.success('Welcome back! You are now signed in.', { id: toastId });
          router.push('/student');
        } else if (isNew) {
          toast.success('Registration complete! Your school will verify you soon.', { id: toastId });
          router.push('/register/student/success');
        } else {
          toast.success('All done! You are now signed in.', { id: toastId });
          router.push('/student');
        }
      } else {
        // Handle limit exceeded error from backend (race condition case)
        const errorMsg = result.error || 'Something went wrong. Please try again.';
        if ((result as any).errorCode === 'STUDENT_LIMIT_EXCEEDED') {
          toast.error('Your school has reached its student limit. Please contact your school administrator to upgrade the plan.', { id: toastId });
        } else {
          toast.error(errorMsg, { id: toastId });
        }
      }
    } catch {
      toast.error('Connection problem. Please check your internet and try again.', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const availableClasses = selectedSchool?.classes_available || [];

  // ── Shared input class helper ────────────────────────────────
  const inputCls = (hasError?: boolean) =>
    `bg-white h-14 px-5 text-slate-900 placeholder:text-slate-300 focus:ring-4 rounded-2xl transition-all font-medium text-base shadow-sm border-2 ${
      hasError
        ? 'border-rose-400 ring-rose-500/10 focus:border-rose-500'
        : 'border-slate-200 focus:border-slate-900 focus:ring-slate-900/5'
    }`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans selection:bg-indigo-100 selection:text-indigo-900 relative">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-100/50 rounded-full blur-[120px]" />
      </div>

      <StudentRegistrationSidebar settings={settings} />

      <div className="flex-1 flex flex-col items-center bg-white/60 lg:bg-transparent relative z-10 overflow-y-auto">
        <div className="w-full max-w-[460px] px-5 sm:px-8 pt-8 pb-16 lg:py-0 lg:my-auto">

          {/* Back to site */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-8 transition-all font-bold group bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm hover:shadow-md w-fit lg:absolute lg:top-12 lg:left-12 text-sm"
          >
            <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-1" />
            Back to site
          </Link>

          {/* Mobile logo */}
          <div className="mb-6 lg:hidden flex items-center gap-3">
            <div className="w-9 h-9 flex items-center justify-center overflow-hidden rounded-lg">
              <img
                src={settings?.logo_url || '/assets/logo.jpg'}
                alt="Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  // Fallback to gradient icon if logo fails
                  const img = e.target as HTMLImageElement;
                  img.style.display = 'none';
                  const parent = img.parentElement;
                  if (parent) {
                    parent.classList.add('bg-slate-950');
                    if (!parent.querySelector('svg')) {
                      const div = document.createElement('div');
                      div.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M22 10v6m0 0v2c0 1.1-.9 2-2 2h-4l-6 4v-4H4c-1.1 0-2-.9-2-2v-2m0 0V4c0-1.1.9-2 2-2h16c1.1 0 2 .9 2 2v6"></path></svg>';
                      parent.appendChild(div.firstElementChild!);
                    }
                  }
                }}
              />
            </div>
            <span className="text-lg font-black tracking-tighter text-slate-950">
              {settings?.platform_name || 'TechNurture'}
            </span>
          </div>

          {/* Step indicator */}
          <div className="mb-8">
            {/* Step dots + labels */}
            <div className="flex items-center justify-between mb-4">
              {STEPS.map((s, i) => {
                const done = step > s.num;
                const active = step === s.num;
                return (
                  <React.Fragment key={s.num}>
                    <div className="flex flex-col items-center gap-1.5">
                      <div className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                        done
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
                          : active
                          ? 'bg-slate-950 text-white shadow-md shadow-slate-200'
                          : 'bg-slate-100 text-slate-300'
                      }`}>
                        {done
                          ? <Check size={16} strokeWidth={3} />
                          : <s.icon size={16} />
                        }
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-wider hidden sm:block ${
                        active ? 'text-slate-900' : done ? 'text-emerald-600' : 'text-slate-300'
                      }`}>{s.label}</span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-2 rounded-full transition-all duration-500 ${done ? 'bg-emerald-400' : 'bg-slate-100'}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-slate-950 rounded-full transition-all duration-700"
                style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100 + 16}%` }}
              />
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <AnimatePresence mode="wait">

              {/* ── STEP 1: About You ──────────────────────── */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 28 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -28 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight leading-tight">
                      Tell us about yourself
                    </h1>
                    <p className="text-slate-500 font-medium text-sm mt-2">
                      This is how your teachers and classmates will know you
                    </p>
                  </div>

                  {/* Full name */}
                  <div className="space-y-2">
                    <label className={`text-xs font-black uppercase tracking-widest ml-1 ${errors.full_name ? 'text-rose-500' : 'text-slate-500'}`}>
                      Your full name *
                    </label>
                    <Input
                      autoFocus
                      value={formData.full_name}
                      onChange={e => {
                        setFormData(d => ({ ...d, full_name: e.target.value }));
                        if (errors.full_name) setErrors(p => ({ ...p, full_name: '' }));
                      }}
                      className={inputCls(!!errors.full_name)}
                      placeholder="e.g. Priya Sharma"
                    />
                    {errors.full_name && (
                      <p className="text-xs text-rose-500 font-semibold ml-1">{errors.full_name}</p>
                    )}
                  </div>

                  {/* Gender */}
                  <div className="space-y-2">
                    <label className={`text-xs font-black uppercase tracking-widest ml-1 ${errors.gender ? 'text-rose-500' : 'text-slate-500'}`}>
                      I am a *
                    </label>
                    <div className={`flex bg-slate-100 p-1.5 rounded-2xl gap-2 border-2 transition-all ${errors.gender ? 'border-rose-300' : 'border-transparent'}`}>
                      {[
                        { value: 'male', label: 'Boy', Icon: ManIcon, active: 'text-indigo-700', dot: 'bg-indigo-500' },
                        { value: 'female', label: 'Girl', Icon: WomanIcon, active: 'text-pink-600', dot: 'bg-pink-500' },
                      ].map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setFormData(d => ({ ...d, gender: opt.value }));
                            if (errors.gender) setErrors(p => ({ ...p, gender: '' }));
                          }}
                          className={`relative flex-1 flex items-center justify-center gap-2.5 py-4 rounded-[14px] transition-all duration-300 font-bold text-base cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                            formData.gender === opt.value ? opt.active : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          <opt.Icon className={`transition-all duration-300 ${formData.gender === opt.value ? 'opacity-100' : 'opacity-30'}`} />
                          {opt.label}
                          {formData.gender === opt.value && (
                            <motion.div
                              layoutId="genderPill"
                              className="absolute inset-0 bg-white rounded-[14px] shadow-sm z-[-1]"
                              transition={{ type: 'spring', bounce: 0.15, duration: 0.45 }}
                            />
                          )}
                        </button>
                      ))}
                    </div>
                    {errors.gender && <p className="text-xs text-rose-500 font-semibold ml-1">{errors.gender}</p>}
                  </div>

                  <button
                    type="button"
                    onClick={goNext}
                    className="w-full h-14 bg-slate-950 hover:bg-slate-800 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-slate-950/10 flex items-center justify-center gap-3 group"
                  >
                    Continue
                    <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                  </button>

                  <p className="text-center text-sm text-slate-500">
                    Already registered?{' '}
                    <Link href="/login" className="text-indigo-600 font-bold hover:underline">Sign in</Link>
                  </p>
                </motion.div>
              )}

              {/* ── STEP 2: Your School ────────────────────── */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 28 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -28 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight leading-tight">
                      Find your school
                    </h1>
                    <p className="text-slate-500 font-medium text-sm mt-2">
                      Select your school and the class you're currently in
                    </p>
                  </div>

                  {/* School search */}
                  <div className="space-y-2">
                    <label className={`text-xs font-black uppercase tracking-widest ml-1 ${errors.school_id ? 'text-rose-500' : 'text-slate-500'}`}>
                      Your school *
                    </label>
                    {loadingSchools ? (
                      <div className="flex items-center gap-3 text-slate-400 px-5 h-14 bg-white border-2 border-slate-200 rounded-2xl">
                        <Loader2 className="animate-spin shrink-0" size={18} />
                        <span className="text-sm font-medium">Loading schools…</span>
                      </div>
                    ) : (
                      <Popover open={schoolSearchOpen} onOpenChange={setSchoolSearchOpen}>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className={`w-full bg-white border-2 h-14 px-5 rounded-2xl flex items-center justify-between text-left focus:ring-4 transition-all cursor-pointer ${
                              errors.school_id
                                ? 'border-rose-400 ring-rose-500/10'
                                : 'border-slate-200 focus:ring-slate-900/5 hover:border-slate-300'
                            }`}
                          >
                            <span className={selectedSchool ? 'text-slate-900 font-bold text-base' : 'text-slate-400 font-medium text-base'}>
                              {selectedSchool ? selectedSchool.name : 'Search for your school'}
                            </span>
                            <ChevronsUpDown size={18} className="text-slate-400 shrink-0" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden" align="start">
                          <Command className="bg-white">
                            <div className="flex items-center border-b border-slate-100 px-3">
                              <Search className="mr-2 h-4 w-4 shrink-0 text-slate-400" />
                              <CommandInput placeholder="Type school name…" className="h-12 w-full text-slate-900 focus:ring-0 border-0 text-base" />
                            </div>
                            <CommandList className="max-h-64">
                              <CommandEmpty className="p-4 text-sm text-slate-500 font-medium text-center">
                                No schools found. Ask your teacher to add your school.
                              </CommandEmpty>
                              <CommandGroup>
                                {schools.map(school => (
                                  <CommandItem
                                    key={school.id}
                                    value={`${school.name} ${school.city}`}
                                    onSelect={() => {
                                      handleSchoolChange(school.id);
                                      setSchoolSearchOpen(false);
                                    }}
                                    className="px-4 py-3 text-slate-700 hover:bg-slate-50 aria-selected:bg-slate-50 cursor-pointer flex items-center justify-between"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className={`w-2 h-2 rounded-full shrink-0 ${formData.school_id === school.id ? 'bg-indigo-500' : 'bg-slate-200'}`} />
                                      <span className="font-semibold text-sm">{school.name}</span>
                                    </div>
                                    <span className="text-[10px] uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-1 rounded-md shrink-0">{school.city}</span>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    )}
                    {errors.school_id && <p className="text-xs text-rose-500 font-semibold ml-1">{errors.school_id}</p>}
                  </div>

                  {/* Student Limit Warning */}
                  <AnimatePresence>
                    {selectedSchool && studentLimitInfo && !studentLimitInfo.can_add && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-4"
                      >
                        <div className="flex items-start gap-3">
                          <AlertCircle className="text-rose-500 mt-0.5 shrink-0" size={20} />
                          <div>
                            <p className="text-sm font-bold text-rose-900 mb-1">
                              Registration Not Available
                            </p>
                            <p className="text-xs text-rose-700 leading-relaxed">
                              {studentLimitInfo.message}
                            </p>
                            <p className="text-xs text-rose-600 mt-2 font-semibold">
                              ℹ️ The registration button below will be disabled. Please contact your school administrator to upgrade the plan.
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Student Limit Info (Success) */}
                  <AnimatePresence>
                    {selectedSchool && studentLimitInfo && studentLimitInfo.can_add && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4"
                      >
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="text-emerald-600 mt-0.5 shrink-0" size={20} />
                          <div>
                            <p className="text-sm font-bold text-emerald-900 mb-1">
                              {studentLimitInfo.plan_name}{studentLimitInfo.max_students ? ` (${studentLimitInfo.available_slots} slot${studentLimitInfo.available_slots !== 1 ? 's' : ''} available)` : ' (Unlimited)'}
                            </p>
                            <p className="text-xs text-emerald-700 font-medium">
                              ✓ You can register for this school
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Class selection */}
                  <AnimatePresence>
                    {selectedSchool && (
                      <motion.div
                        className="space-y-2"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                      >
                        <label className={`text-xs font-black uppercase tracking-widest ml-1 ${errors.class_id ? 'text-rose-500' : 'text-slate-500'}`}>
                          Your class *
                        </label>
                        <Select
                          value={formData.class_id}
                          onValueChange={value => {
                            setFormData(d => ({ ...d, class_id: value }));
                            if (errors.class_id) setErrors(p => ({ ...p, class_id: '' }));
                          }}
                        >
                          <SelectTrigger className={`w-full bg-white border-2 h-14 px-5 text-slate-900 rounded-2xl focus:ring-4 transition-all font-medium text-base ${
                            errors.class_id ? 'border-rose-400 ring-rose-500/10' : 'border-slate-200 focus:ring-slate-900/5'
                          }`}>
                            <SelectValue placeholder="Which class are you in?" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-slate-200 rounded-2xl overflow-hidden shadow-2xl">
                            {availableClasses.length === 0 ? (
                              <div className="p-4 text-sm text-slate-400 text-center">No classes listed for this school yet</div>
                            ) : (
                              availableClasses.map(cls => (
                                <SelectItem key={cls.id} value={cls.id} className="text-base py-3">
                                  {cls.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        {errors.class_id && <p className="text-xs text-rose-500 font-semibold ml-1">{errors.class_id}</p>}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={goBack}
                      className="h-14 px-6 bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-600 rounded-2xl font-bold text-sm uppercase tracking-wider transition-all flex items-center gap-2"
                    >
                      <ArrowLeft size={16} /> Back
                    </button>
                    <button
                      type="button"
                      onClick={goNext}
                      className="flex-1 h-14 bg-slate-950 hover:bg-slate-800 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-slate-950/10 flex items-center justify-center gap-3 group"
                    >
                      Continue
                      <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── STEP 3: Sign-in Info ───────────────────── */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 28 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -28 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight leading-tight">
                      Set up your account
                    </h1>
                    <p className="text-slate-500 font-medium text-sm mt-2">
                      You'll use this to sign in every time
                    </p>
                  </div>

                  {/* Phone / Email */}
                  <div className="space-y-2">
                    <label className={`text-xs font-black uppercase tracking-widest ml-1 ${errors.email ? 'text-rose-500' : 'text-slate-500'}`}>
                      Phone number or email *
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-slate-300 pointer-events-none">
                        {formData.email.includes('@') ? <Mail size={18} /> : <Phone size={18} />}
                      </div>
                      <Input
                        type="text"
                        inputMode="text"
                        autoFocus
                        value={formData.email}
                        onChange={e => {
                          setFormData(d => ({ ...d, email: e.target.value }));
                          setContactVerified(false);
                          if (errors.email) setErrors(p => ({ ...p, email: '' }));
                        }}
                        className={`bg-white h-14 pl-11 pr-5 text-slate-900 placeholder:text-slate-300 focus:ring-4 rounded-2xl transition-all font-medium text-base shadow-sm border-2 ${
                          errors.email
                            ? 'border-rose-400 ring-rose-500/10'
                            : contactVerified
                            ? 'border-emerald-400 bg-emerald-50/30'
                            : 'border-slate-200 focus:border-slate-900 focus:ring-slate-900/5'
                        }`}
                        placeholder="e.g. 9876543210 or name@email.com"
                      />
                      {contactVerified && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <Check size={18} className="text-emerald-500" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    {errors.email && <p className="text-xs text-rose-500 font-semibold ml-1">{errors.email}</p>}
                    {!contactVerified && (
                      <p className="text-xs text-slate-400 ml-1">
                        This is how you'll sign in later. Phone numbers work best.
                      </p>
                    )}

                    {/* Verify button */}
                    {!contactVerified && (
                      <button
                        type="button"
                        onClick={handleContactCheck}
                        disabled={contactCheckLoading || !formData.email.trim()}
                        className="w-full h-12 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-2 border-indigo-100 rounded-2xl font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {contactCheckLoading
                          ? <><Loader2 className="animate-spin" size={16} /> Checking…</>
                          : 'Verify & Continue to PIN'
                        }
                      </button>
                    )}
                  </div>

                  {/* PIN setup — shown after contact verified */}
                  <AnimatePresence>
                    {contactVerified && (
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                      >
                        {/* Create PIN */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between px-1">
                            <label className={`text-xs font-black uppercase tracking-widest ${errors.password ? 'text-rose-500' : 'text-slate-500'}`}>
                              Create a 6-digit PIN *
                            </label>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => setShowPin(v => !v)}
                                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                              >
                                {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                              {formData.password.length === 6 && !errors.password && (
                                <Check size={18} className="text-emerald-500 stroke-[3]" />
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-slate-400 ml-1 -mt-1">
                            Choose any 6 numbers you can remember easily
                          </p>

                          <PinInput
                            value={formData.password}
                            onChange={v => setFormData(d => ({ ...d, password: v, confirm_password: d.confirm_password.slice(0, v.length) }))}
                            show={showPin}
                            focused={pinFocused}
                            onFocus={() => setPinFocused(true)}
                            onBlur={() => setPinFocused(false)}
                            hasError={!!errors.password}
                          />
                          {errors.password && <p className="text-xs text-rose-500 font-semibold ml-1">{errors.password}</p>}
                        </div>

                        {/* Confirm PIN */}
                        <AnimatePresence>
                          {formData.password.length === 6 && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="space-y-3"
                            >
                              <div className="flex items-center justify-between px-1">
                                <label className={`text-xs font-black uppercase tracking-widest ${errors.confirm_password ? 'text-rose-500' : 'text-slate-500'}`}>
                                  Confirm your PIN *
                                </label>
                                {formData.confirm_password.length === 6 && formData.password === formData.confirm_password && (
                                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                                    <Check size={13} strokeWidth={3} /> Matches!
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400 ml-1 -mt-1">
                                Enter the same 6 digits again to confirm
                              </p>

                              <PinInput
                                value={formData.confirm_password}
                                onChange={v => {
                                  setFormData(d => ({ ...d, confirm_password: v }));
                                  if (errors.confirm_password) setErrors(p => ({ ...p, confirm_password: '' }));
                                }}
                                show={showPin}
                                focused={pinConfirmFocused}
                                onFocus={() => setPinConfirmFocused(true)}
                                onBlur={() => setPinConfirmFocused(false)}
                                hasError={!!errors.confirm_password || (formData.confirm_password.length === 6 && formData.confirm_password !== formData.password)}
                                isConfirm
                                matchValue={formData.password}
                              />
                              {errors.confirm_password && (
                                <p className="text-xs text-rose-500 font-semibold ml-1">{errors.confirm_password}</p>
                              )}
                              {!errors.confirm_password && formData.confirm_password.length === 6 && formData.confirm_password !== formData.password && (
                                <p className="text-xs text-rose-500 font-semibold ml-1">PINs don't match — please try again</p>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit + back buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={goBack}
                      className="h-14 px-6 bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-600 rounded-2xl font-bold text-sm uppercase tracking-wider transition-all flex items-center gap-2 shrink-0"
                    >
                      <ArrowLeft size={16} /> Back
                    </button>
                    {contactVerified && (
                      <button
                        type="submit"
                        disabled={
                          loading ||
                          formData.password.length !== 6 ||
                          formData.confirm_password !== formData.password ||
                          (studentLimitInfo && !studentLimitInfo.can_add)
                        }
                        className="flex-1 h-14 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-indigo-200 flex items-center justify-center gap-3 group"
                        title={studentLimitInfo && !studentLimitInfo.can_add ? 'Student registration limit reached for this school' : ''}
                      >
                        {loading
                          ? <><Loader2 className="animate-spin" size={18} /> Creating…</>
                          : <>Start Learning! <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" /></>
                        }
                      </button>
                    )}
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </form>

          {/* Bottom links */}
          <div className="mt-10 pt-8 border-t border-slate-100 flex flex-col items-center gap-4">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] text-center max-w-[280px] leading-relaxed">
              By joining, you agree to our{' '}
              <span className="text-slate-500 underline underline-offset-4 decoration-slate-300">Terms of Learning</span>{' '}
              &amp;{' '}
              <span className="text-slate-500 underline underline-offset-4 decoration-slate-300">Safety Policy</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Reusable PIN dot input ─────────────────────────────────────
function PinInput({
  value,
  onChange,
  show,
  focused,
  onFocus,
  onBlur,
  hasError,
  isConfirm,
  matchValue,
}: {
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  hasError?: boolean;
  isConfirm?: boolean;
  matchValue?: string;
}) {
  const isMatch = isConfirm && value.length === 6 && matchValue !== undefined && value === matchValue;
  const isMismatch = isConfirm && value.length === 6 && matchValue !== undefined && value !== matchValue;

  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={6}
        value={value}
        onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
        onFocus={onFocus}
        onBlur={onBlur}
        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
        autoComplete="new-password"
      />
      <div className="grid grid-cols-6 gap-2">
        {[0, 1, 2, 3, 4, 5].map(i => {
          const filled = !!value[i];
          const isCurrent = i === value.length && focused;
          let dotClass = 'border-slate-200 bg-slate-100';
          if (filled) {
            dotClass = isMatch
              ? 'border-emerald-500 bg-emerald-50 shadow-sm scale-105'
              : isMismatch
              ? 'border-rose-400 bg-rose-50'
              : hasError
              ? 'border-rose-400 bg-rose-50'
              : 'border-slate-900 bg-white shadow-md';
          } else if (isCurrent) {
            dotClass = 'border-indigo-500 bg-indigo-50 ring-4 ring-indigo-100 scale-110';
          } else if (hasError) {
            dotClass = 'border-rose-200 bg-rose-50/50';
          }

          return (
            <div
              key={i}
              className={`h-14 sm:h-16 rounded-2xl border-2 flex items-center justify-center transition-all duration-200 ${dotClass}`}
            >
              {filled ? (
                show ? (
                  <span className={`text-xl font-black ${isMatch ? 'text-emerald-600' : isMismatch || hasError ? 'text-rose-500' : 'text-slate-900'}`}>
                    {value[i]}
                  </span>
                ) : (
                  <div className={`w-3 h-3 rounded-full ${isMatch ? 'bg-emerald-500' : isMismatch || hasError ? 'bg-rose-500' : 'bg-slate-900'}`} />
                )
              ) : (
                <div className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-indigo-400 animate-pulse' : hasError ? 'bg-rose-200' : 'bg-slate-200'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
