'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import { fetchApprovedSchools, registerStudent, checkIdentifierExists } from '@/modules/auth/register-actions';
import { toast } from 'sonner';
import { GraduationCap, ArrowLeft, User, School, Loader2, Check, ChevronsUpDown, Search, UserCircle2, ArrowRight, Trophy, Eye, EyeOff } from 'lucide-react';
import { NeumorphicButton } from '@/components/landing/NeumorphicButton';
import { StudentRegistrationSidebar } from '@/components/registration/StudentRegistrationSidebar';
import { ManIcon, WomanIcon } from '@/components/registration/GenderIcons';

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
  const [step, setStep] = useState(1);
  const [emailVerified, setEmailVerified] = useState(false);
  const [schoolSearchOpen, setSchoolSearchOpen] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    school_id: '',
    class_id: '',
    gender: '',
  });
  const [pinFocused, setPinFocused] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.full_name.trim()) newErrors.full_name = 'Full name is required';
    if (!formData.gender) newErrors.gender = 'Gender selection is required';
    if (!formData.school_id) newErrors.school_id = 'School selection is required';
    if (!formData.class_id) newErrors.class_id = 'Class selection is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.email.trim()) newErrors.email = 'Email or Phone is required';
    else {
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
      const isPhone = /^\+?[1-9]\d{1,14}$/.test(formData.email.replace(/[-\s]/g, ''));
      if (!isEmail && !isPhone) newErrors.email = 'Invalid email or phone format';
    }

    if (formData.password.length !== 6) newErrors.password = 'PIN must be 6 digits';
    if (formData.confirm_password !== formData.password) newErrors.confirm_password = 'PINs do not match';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setErrors({});
      setStep(2);
    }
  };

  useEffect(() => {
    fetchSchools();
    import('@/components/landing/actions').then(m => m.getPlatformSettings()).then(setSettings);
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

    if (!validateStep2()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Registering your account...');

    try {
      const result = await registerStudent(formData);

      if (result.success) {
        const isExisting = 'isExisting' in result ? result.isExisting : false;
        toast.success(isExisting ? 'Welcome back! You are now logged in.' : 'Registration complete! You are now logged in.', { id: toastId });
        router.push('/student');
      } else {
        toast.error(result.error || 'Registration failed. Please verify your details.', { id: toastId });
      }
    } catch (err: any) {
      toast.error('Connection issue. Please try again.', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const availableClasses = selectedSchool?.classes_available || [];

  return (
    <div className="h-screen overflow-hidden bg-slate-50 text-slate-900 flex font-sans selection:bg-indigo-100 selection:text-indigo-900 relative">

      {/* Background Grid & Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-100/40 rounded-full blur-[140px]" />
      </div>

      <StudentRegistrationSidebar settings={settings} />

      <div className="flex-1 flex flex-col items-center bg-white/50 lg:bg-transparent relative z-10 overflow-y-auto">
        <div className="w-full max-w-[440px] px-6 py-12 lg:py-0 lg:px-0 lg:my-auto scroll-smooth">
          <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-10 transition-all font-bold group bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm hover:shadow-md w-fit lg:absolute lg:top-12 lg:left-12">
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
            <span className="text-xs uppercase tracking-widest">Back to site</span>
          </Link>

          <div className="mb-8 lg:hidden flex items-center justify-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center overflow-hidden">
              {settings?.logo_url ? (
                <img src={settings.logo_url} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center shadow-lg">
                  <School className="text-white" size={20} />
                </div>
              )}
            </div>
            <span className="text-xl font-black tracking-tighter text-slate-950">{settings?.platform_name || 'TechNurture'}</span>
          </div>

          <div className="text-center lg:text-left space-y-3 mb-10">
            <h1 className="text-4xl font-black text-slate-950 tracking-tight leading-none">Student Registration</h1>
            <p className="text-slate-500 font-medium text-base">Step {step} of 2: Create your account</p>
          </div>

          {/* Progress Bar */}
          <div className="flex gap-2 mb-10">
            <div className={`h-1.5 rounded-full transition-all duration-700 ${step >= 1 ? 'bg-slate-950 flex-1' : 'bg-slate-100 flex-1'}`} />
            <div className={`h-1.5 rounded-full transition-all duration-700 ${step >= 2 ? 'bg-slate-950 flex-1' : 'bg-slate-100 flex-1'}`} />
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
                    <Label className={`text-[10px] ml-1 uppercase tracking-wider font-bold transition-colors ${errors.full_name ? 'text-rose-500' : 'text-slate-600'}`}>Full Name *</Label>
                    <Input
                      value={formData.full_name}
                      onChange={(e) => {
                        setFormData({ ...formData, full_name: e.target.value });
                        if (errors.full_name) setErrors(prev => ({ ...prev, full_name: '' }));
                      }}
                      className={`bg-white h-14 px-5 text-slate-900 placeholder:text-slate-300 focus:ring-4 rounded-xl transition-all font-medium text-base shadow-sm border ${errors.full_name ? 'border-rose-400 ring-rose-500/10 focus:border-rose-500' : 'border-slate-200 focus:border-slate-950 focus:ring-slate-950/5'
                        }`}
                      placeholder="Enter full name"
                    />
                    {errors.full_name && <p className="text-[10px] text-rose-500 font-bold ml-1 animate-in fade-in slide-in-from-top-1">{errors.full_name}</p>}
                  </div>

                  <div className="space-y-3">
                    <Label className={`text-[10px] ml-1 uppercase tracking-wider font-bold transition-colors ${errors.gender ? 'text-rose-500' : 'text-slate-600'}`}>Gender Selection *</Label>
                    <div className={`flex bg-slate-100/50 p-1.5 rounded-2xl gap-2 relative border transition-all shadow-inner ${errors.gender ? 'border-rose-300 ring-4 ring-rose-500/5' : 'border-slate-200/50'
                      }`}>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, gender: 'male' });
                          if (errors.gender) setErrors(prev => ({ ...prev, gender: '' }));
                        }}
                        className={`relative z-10 flex-1 flex items-center justify-center gap-3 py-4 rounded-[14px] transition-all duration-300 font-bold text-sm hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${formData.gender === 'male' ? 'text-indigo-700' : 'text-slate-400 hover:text-slate-600'
                          }`}
                      >
                        <ManIcon className={`transition-all duration-500 ${formData.gender === 'male' ? 'text-indigo-500 drop-shadow-[0_0_8px_rgba(99,102,241,0.4)]' : 'text-slate-300'}`} />
                        Male
                        {formData.gender === 'male' && (
                          <motion.div
                            layoutId="genderHighlight"
                            className="absolute inset-0 bg-white rounded-[14px] shadow-sm z-[-1]"
                            transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                          />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, gender: 'female' });
                          if (errors.gender) setErrors(prev => ({ ...prev, gender: '' }));
                        }}
                        className={`relative z-10 flex-1 flex items-center justify-center gap-3 py-4 rounded-[14px] transition-all duration-300 font-bold text-sm hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${formData.gender === 'female' ? 'text-pink-600' : 'text-slate-400 hover:text-slate-600'
                          }`}
                      >
                        <WomanIcon className={`transition-all duration-500 ${formData.gender === 'female' ? 'text-pink-500 drop-shadow-[0_0_8px_rgba(244,114,182,0.4)]' : 'text-slate-300'}`} />
                        Female
                        {formData.gender === 'female' && (
                          <motion.div
                            layoutId="genderHighlight"
                            className="absolute inset-0 bg-white rounded-[14px] shadow-sm z-[-1]"
                            transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                          />
                        )}
                      </button>
                    </div>
                    {errors.gender && <p className="text-[10px] text-rose-500 font-bold ml-1 animate-in fade-in slide-in-from-top-1">{errors.gender}</p>}
                  </div>


                  <div className="space-y-2">
                    <Label className={`text-sm ml-1 uppercase tracking-wider font-bold transition-colors ${errors.school_id ? 'text-rose-500' : 'text-slate-600'}`}>Your Institution</Label>
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
                            className={`w-full bg-white border h-14 px-5 rounded-2xl flex items-center justify-between text-left focus:ring-4 transition-all cursor-pointer ${errors.school_id ? 'border-rose-400 ring-rose-500/10' : 'border-slate-200 focus:ring-slate-950/5'
                              }`}
                          >
                            <span className={selectedSchool ? "text-slate-900 font-bold" : "text-slate-400 font-medium"}>
                              {selectedSchool ? `${selectedSchool.name}` : "Search school"}
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
                                      if (errors.school_id) setErrors(prev => ({ ...prev, school_id: '' }));
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
                    {errors.school_id && <p className="text-[10px] text-rose-500 font-bold ml-1 animate-in fade-in slide-in-from-top-1">{errors.school_id}</p>}
                  </div>

                  {selectedSchool && (
                    <motion.div
                      className="space-y-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Label className={`text-sm ml-1 uppercase tracking-wider font-bold transition-colors ${errors.class_id ? 'text-rose-500' : 'text-slate-600'}`}>Academic Class</Label>
                      <Select
                        value={formData.class_id}
                        onValueChange={(value) => {
                          setFormData({ ...formData, class_id: value });
                          if (errors.class_id) setErrors(prev => ({ ...prev, class_id: '' }));
                        }}
                      >
                        <SelectTrigger className={`w-full bg-white border h-14 px-5 text-slate-900 rounded-2xl focus:ring-4 transition-all font-medium ${errors.class_id ? 'border-rose-400 ring-rose-500/10' : 'border-slate-200 focus:ring-slate-950/5'
                          }`}>
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-slate-200 rounded-xl overflow-hidden shadow-2xl">
                          {availableClasses.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id}>
                              {cls.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.class_id && <p className="text-[10px] text-rose-500 font-bold ml-1 animate-in fade-in slide-in-from-top-1">{errors.class_id}</p>}
                    </motion.div>
                  )}

                  <div className="pt-2">
                    <NeumorphicButton
                      type="button"
                      onClick={handleNextStep}
                      variant="primary"
                      className="w-full !h-14 !text-base !rounded-2xl !bg-slate-950 hover:!bg-slate-900 shadow-xl shadow-slate-950/10 transition-all font-black uppercase tracking-widest cursor-pointer group"
                    >
                      Next Step
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
                    Previous
                  </button>

                  <div className="space-y-8">
                    {/* Sub-step 1: Email */}
                  <div className="space-y-2">
                    <Label className={`text-[10px] ml-1 uppercase tracking-[0.2em] font-black transition-colors ${errors.email ? 'text-rose-500' : 'text-slate-950'}`}>Email or Phone</Label>
                    <div className="relative group">
                      <Input
                        type="text"
                        autoFocus
                        value={formData.email}
                        onChange={(e) => {
                          setFormData({ ...formData, email: e.target.value });
                          if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                          if (emailVerified) setEmailVerified(false);
                        }}
                        className={`bg-white border-2 h-16 px-6 text-slate-900 placeholder:text-slate-300 focus:ring-4 transition-all font-bold text-lg rounded-2xl shadow-sm
                          ${errors.email ? 'border-rose-400 ring-rose-500/10' : (formData.email.includes('@') || formData.email.length > 8) ? 'border-indigo-500 bg-indigo-50/10' : 'border-slate-300 focus:border-slate-950 focus:ring-slate-950/10'}
                        `}
                        placeholder="e.g. Phone or Email"
                      />
                    </div>
                      {errors.email && <p className="text-xs text-rose-500 font-bold ml-1 animate-in fade-in slide-in-from-top-1">{errors.email}</p>}
                    </div>

                    {!emailVerified ? (
                      <NeumorphicButton
                        type="button"
                        onClick={async () => {
                          const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
                          const isPhone = /^\+?[1-9]\d{1,14}$/.test(formData.email.replace(/[-\s]/g, ''));
                          
                          if (!isEmail && !isPhone) {
                            setErrors(prev => ({ ...prev, email: 'Please enter a valid email or phone number' }));
                            return;
                          }

                          setLoading(true);
                          try {
                            const res = await checkIdentifierExists(formData.email);
                            if (res.exists) {
                              if (res.role === 'student' || !res.role) {
                                  setEmailVerified(true);
                                  setErrors(prev => ({ ...prev, email: '' }));
                                  toast.info('Account found. Please enter your PIN to login.');
                              } else {
                                  setErrors(prev => ({ ...prev, email: `Identity is registered as a ${res.role.replace('_', ' ')}` }));
                                  toast.error('Identity already registered as Admin');
                              }
                            } else {
                              setEmailVerified(true);
                              setErrors(prev => ({ ...prev, email: '' }));
                            }
                          } catch (err) {
                            console.error('Email check failed:', err);
                          } finally {
                            setLoading(false);
                          }
                        }}
                        disabled={loading}
                        variant="primary"
                        className="w-full !h-14 !text-sm !rounded-2xl !bg-indigo-600 hover:!bg-indigo-700 text-white font-black uppercase tracking-widest cursor-pointer"
                      >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : "Continue to PIN"}
                      </NeumorphicButton>
                    ) : (
                      <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                        {/* Sub-step 2: PIN */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between px-1">
                            <Label className={`text-[10px] uppercase tracking-[0.2em] font-black transition-colors ${errors.password ? 'text-rose-500' : 'text-slate-900'}`}>Security PIN</Label>
                            <div className="flex items-center gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setShowPin(!showPin)}
                                    className="text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                                {formData.password.length === 6 && !errors.password && <Check size={18} className="text-indigo-600 stroke-[3px]" />}
                            </div>
                          </div>

                          <div className="relative">
                            <input
                              type={showPin ? "text" : "password"}
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
                            <div className="flex justify-between gap-2 md:gap-3">
                              {[0, 1, 2, 3, 4, 5].map(i => (
                                <div
                                  key={i}
                                  className={`flex-1 h-16 rounded-2xl border-2 flex items-center justify-center transition-all duration-300
                                    ${formData.password[i]
                                      ? errors.password ? 'border-rose-400 bg-rose-50/20' : 'border-slate-900 bg-white shadow-md'
                                      : (i === formData.password.length && pinFocused)
                                        ? 'border-indigo-600 bg-indigo-50/50 ring-4 ring-indigo-500/10 scale-110'
                                        : errors.password ? 'border-rose-200 bg-rose-50/10' : 'border-slate-400 bg-slate-100'}
                                  `}
                                >
                                  {formData.password[i] ? (
                                    <div className={`w-full h-full flex items-center justify-center animate-in zoom-in duration-300 ${errors.password ? 'text-rose-500' : 'text-slate-900'}`}>
                                        {showPin ? <span className="text-xl font-black">{formData.password[i]}</span> : <div className={`w-4 h-4 rounded-full ${errors.password ? 'bg-rose-500' : 'bg-slate-900'}`} />}
                                    </div>
                                  ) : (
                                    <div className={`w-2 h-2 rounded-full transition-colors ${i === formData.password.length && pinFocused ? 'bg-indigo-400 animate-pulse' : errors.password ? 'bg-rose-200' : 'bg-slate-200'}`} />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Sub-step 3: Confirm PIN */}
                        <AnimatePresence>
                          {formData.password.length === 6 && (
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="space-y-4"
                            >
                              <div className="flex items-center justify-between px-1">
                                <Label className="text-slate-900 font-black text-xs uppercase tracking-[0.2em]">Verify PIN</Label>
                                {formData.confirm_password && formData.password === formData.confirm_password && (
                                  <div className="flex items-center gap-1.5 text-indigo-600">
                                    <span className="text-[10px] font-black uppercase tracking-widest">Matches!</span>
                                    <Check size={16} className="stroke-[3]" />
                                  </div>
                                )}
                              </div>

                              <div className="relative">
                                <input
                                  type={showPin ? "text" : "password"}
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
                                            ? 'border-indigo-600 bg-indigo-50/30 shadow-sm transform scale-105'
                                            : 'border-rose-400 bg-rose-50/30'
                                          : 'border-slate-400 bg-slate-100'}
                                      `}
                                    >
                                      {formData.confirm_password[i] && (
                                        <div className={`w-full h-full flex items-center justify-center animate-in zoom-in duration-300 ${formData.password === formData.confirm_password ? 'text-indigo-600' : 'text-rose-500'}`}>
                                            {showPin ? <span className="text-xl font-black">{formData.confirm_password[i]}</span> : <div className={`w-3 h-3 rounded-full ${formData.password === formData.confirm_password ? 'bg-indigo-600' : 'bg-rose-500'}`} />}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                                {formData.confirm_password.length > 0 && formData.password !== formData.confirm_password && (
                                  <p className="text-[10px] text-rose-500 font-bold mt-2 ml-1 animate-in fade-in slide-in-from-top-1">PINs do not match. Please verify your entries.</p>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="pt-8">
                          <NeumorphicButton
                            type="submit"
                            disabled={loading}
                            variant="primary"
                            className={`w-full !h-16 !text-lg !rounded-2xl !bg-indigo-600 hover:!bg-indigo-700 !text-white shadow-2xl shadow-indigo-200 transition-all font-black uppercase tracking-[0.2em] cursor-pointer flex items-center justify-center gap-3 ${Object.keys(errors).length > 0 ? 'ring-4 ring-rose-500/20 border-rose-500' : ''
                              }`}
                          >
                            {loading ? (
                              <><Loader2 className="animate-spin" size={24} /> Creating...</>
                            ) : (
                              <>
                                Ready to Learn!
                                <ArrowRight size={20} className="ml-2" />
                              </>
                            )}
                          </NeumorphicButton>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          <div className="mt-12 pt-10 border-t border-slate-100/60 flex flex-col items-center gap-6">
            <div className="flex items-center gap-3 whitespace-nowrap">
              <p className="text-slate-500 font-medium text-sm">
                Already using {settings?.platform_name || 'TechNurture'}?
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
