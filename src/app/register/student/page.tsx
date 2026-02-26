'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
import { fetchApprovedSchools, registerStudent } from '@/app/register-actions';
import { toast } from 'sonner';
import { GraduationCap, ArrowLeft, User, School, Loader2, Sparkles, Eye, EyeOff, Check, Zap, Trophy, ChevronsUpDown, Search } from 'lucide-react';

type SchoolOption = {
  id: string;
  name: string;
  district: string;
  state: string;
  grades_available: number[];
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
    grade: '',
    gender: '',
  });

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
    setFormData(prev => ({ ...prev, school_id: schoolId, grade: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.full_name || !formData.email || !formData.password || !formData.school_id || !formData.grade || !formData.gender) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await registerStudent(formData);
      toast.success('Registration successful!');
      router.push('/login');
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const availableGrades = selectedSchool?.grades_available || [];
  const canProceedStep1 = formData.full_name && formData.gender && formData.school_id && formData.grade;
  const canProceedStep2 = formData.email && formData.password.length >= 6 && formData.confirm_password && formData.password === formData.confirm_password;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-emerald-600/15 via-teal-600/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-t from-cyan-500/10 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-teal-900/30" />
        <img
          src="https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=1200&q=80"
          alt="Students"
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 flex flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Sparkles className="text-white" size={24} />
            </div>
            <span className="text-2xl font-black">EduQuest</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-4xl font-black mb-4 leading-tight">
              Start your
              <br />
              learning journey
            </h2>
            <p className="text-white/60 text-lg max-w-md mb-8">
              Join thousands of students earning XP, unlocking achievements, and mastering new skills every day.
            </p>

            <div className="flex gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                  <Zap size={20} className="text-amber-400" />
                </div>
                <div>
                  <p className="font-bold">Earn XP</p>
                  <p className="text-xs text-white/50">Level up daily</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                  <Trophy size={20} className="text-emerald-400" />
                </div>
                <div>
                  <p className="font-bold">Achievements</p>
                  <p className="text-xs text-white/50">Unlock badges</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative z-10 overflow-y-auto">
        <div className="w-full max-w-md">
          <Link href="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white mb-8 transition-colors text-sm">
            <ArrowLeft size={16} />
            Back to home
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Sparkles className="text-white" size={20} />
              </div>
              <span className="text-xl font-black">EduQuest</span>
            </div>

            <h1 className="text-3xl font-black mb-2">Create your account</h1>
            <p className="text-white/50 mb-8">Join your school&apos;s learning platform</p>

            <div className="flex gap-2 mb-8">
              <div className={`flex-1 h-1.5 rounded-full ${step >= 1 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-white/10'}`} />
              <div className={`flex-1 h-1.5 rounded-full ${step >= 2 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-white/10'}`} />
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-5"
                >
                  <div className="space-y-2">
                    <Label className="text-white/70 text-sm">Full Name</Label>
                    <Input
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="bg-white/5 border-white/10 h-12 text-white placeholder:text-white/30 px-4 rounded-xl"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white/70 text-sm">Gender</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) => setFormData({ ...formData, gender: value })}
                    >
                      <SelectTrigger className="w-full bg-white/5 border-white/10 h-12 text-white px-4 rounded-xl">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/10">
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white/70 text-sm">Select Your School</Label>
                    {loadingSchools ? (
                      <div className="flex items-center gap-2 text-white/40 p-3 bg-white/5 rounded-xl">
                        <Loader2 className="animate-spin" size={16} />
                        Loading schools...
                      </div>
                    ) : schools.length === 0 ? (
                      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
                        No schools registered yet.{' '}
                        <Link href="/register/school" className="underline">Register your school</Link>
                      </div>
                    ) : (
                      <Popover open={schoolSearchOpen} onOpenChange={setSchoolSearchOpen}>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="w-full bg-white/5 border border-white/10 h-12 text-white px-4 rounded-xl flex items-center justify-between"
                          >
                            <span className={selectedSchool ? "text-white" : "text-white/30"}>
                              {selectedSchool ? `${selectedSchool.name} - ${selectedSchool.district}` : "Select your school"}
                            </span>
                            <ChevronsUpDown size={16} className="text-white/40" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-slate-900 border-white/10" align="start">
                          <Command className="bg-slate-900">
                            <CommandInput placeholder="Search schools..." className="text-white placeholder:text-white/40" />
                            <CommandList className="max-h-60">
                              <CommandEmpty className="text-white/50">No school found.</CommandEmpty>
                              <CommandGroup>
                                {schools.map((school) => (
                                  <CommandItem
                                    key={school.id}
                                    value={`${school.name} ${school.district}`}
                                    onSelect={() => {
                                      handleSchoolChange(school.id);
                                      setSchoolSearchOpen(false);
                                    }}
                                    className="text-white/80 hover:bg-white/10 data-[selected=true]:bg-white/10 cursor-pointer"
                                  >
                                    <Check
                                      size={16}
                                      className={formData.school_id === school.id ? "opacity-100" : "opacity-0"}
                                    />
                                    {school.name} - {school.district}
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
                    <div className="space-y-2">
                      <Label className="text-white/70 text-sm">Select Your Class</Label>
                      <Select
                        value={formData.grade}
                        onValueChange={(value) => setFormData({ ...formData, grade: value })}
                      >
                        <SelectTrigger className="w-full bg-white/5 border-white/10 h-12 text-white px-4 rounded-xl">
                          <SelectValue placeholder="Select your class" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-white/10">
                          {availableGrades.map((grade) => (
                            <SelectItem key={grade} value={grade.toString()}>
                              Class {grade}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <Button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={!canProceedStep1}
                    className="w-full h-12 text-base font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/25"
                  >
                    Continue
                    <ArrowLeft size={18} className="ml-2 rotate-180" />
                  </Button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-5"
                >
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-sm text-white/50 hover:text-white flex items-center gap-1 mb-2"
                  >
                    <ArrowLeft size={14} />
                    Back to personal info
                  </button>

                  <div className="space-y-2">
                    <Label className="text-white/70 text-sm">Email address</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="bg-white/5 border-white/10 h-12 text-white placeholder:text-white/30 px-4 rounded-xl"
                      placeholder="you@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white/70 text-sm">Password</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="bg-white/5 border-white/10 h-12 text-white placeholder:text-white/30 pr-12 px-4 rounded-xl"
                        placeholder="Minimum 6 characters"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white/70 text-sm">Confirm Password</Label>
                    <Input
                      type="password"
                      value={formData.confirm_password}
                      onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                      className="bg-white/5 border-white/10 h-12 text-white placeholder:text-white/30 px-4 rounded-xl"
                      placeholder="Re-enter your password"
                    />
                    {formData.confirm_password && formData.password === formData.confirm_password && (
                      <p className="text-xs text-emerald-400 flex items-center gap-1">
                        <Check size={12} /> Passwords match
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || !canProceedStep2}
                    className="w-full h-12 text-base font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/25"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 animate-spin" size={20} />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <GraduationCap size={18} className="mr-2" />
                        Create Account
                      </>
                    )}
                  </Button>
                </motion.div>
              )}
            </form>

            <div className="mt-8 pt-8 border-t border-white/10">
              <p className="text-center text-white/50 text-sm">
                Already have an account?{' '}
                <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-semibold">
                  Sign in
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
