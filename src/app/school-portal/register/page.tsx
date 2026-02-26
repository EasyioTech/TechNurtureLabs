'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { registerSchool } from '@/app/register-actions';
import { toast } from 'sonner';
import { School, ArrowLeft, Building, MapPin, Users, CheckCircle2, Loader2, Sparkles, Globe, Shield, BarChart3 } from 'lucide-react';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

const SCHOOL_TYPES = [
  { value: 'primary', label: 'Primary School (Class 1-5)' },
  { value: 'middle', label: 'Middle School (Class 6-8)' },
  { value: 'high', label: 'High School (Class 9-10)' },
  { value: 'higher_secondary', label: 'Higher Secondary (Class 11-12)' },
  { value: 'k12', label: 'K-12 School (Class 1-12)' },
];

const ALL_GRADES = Array.from({ length: 12 }, (_, i) => i + 1);

export default function SchoolRegistrationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    udise_code: '',
    address: '',
    district: '',
    state: '',
    pincode: '',
    school_type: '',
    grades_available: [] as number[],
    student_count: '',
    contact_email: '',
    contact_phone: '',
    principal_name: '',
  });

  const handleGradeToggle = (grade: number) => {
    setFormData(prev => ({
      ...prev,
      grades_available: prev.grades_available.includes(grade)
        ? prev.grades_available.filter(g => g !== grade)
        : [...prev.grades_available, grade].sort((a, b) => a - b)
    }));
  };

  const selectGradeRange = (type: string) => {
    let grades: number[] = [];
    switch (type) {
      case 'primary': grades = [1, 2, 3, 4, 5]; break;
      case 'middle': grades = [6, 7, 8]; break;
      case 'high': grades = [9, 10]; break;
      case 'higher_secondary': grades = [11, 12]; break;
      case 'k12': grades = ALL_GRADES; break;
    }
    setFormData(prev => ({ ...prev, grades_available: grades, school_type: type }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.udise_code || !formData.state || !formData.district) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.grades_available.length === 0) {
      toast.error('Please select at least one grade');
      return;
    }

    setLoading(true);

    try {
      await registerSchool(formData);
      toast.success('School registered successfully!');
      router.push('/register/school/success');
    } catch (error: any) {
      toast.error('Registration failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const canProceedStep1 = formData.name && formData.udise_code && formData.state && formData.district;
  const canProceedStep2 = formData.school_type && formData.grades_available.length > 0;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-blue-600/15 via-cyan-600/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-t from-violet-500/10 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-cyan-900/30" />
        <img
          src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1200&q=80"
          alt="School"
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 flex flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
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
              Transform your
              <br />
              school&apos;s learning
            </h2>
            <p className="text-white/60 text-lg max-w-md mb-8">
              Join hundreds of schools using EduQuest to deliver engaging, gamified education to their students.
            </p>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <Globe size={24} className="text-blue-400 mb-2" />
                <p className="font-bold text-sm">White Label</p>
                <p className="text-xs text-white/40">Custom branding</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <BarChart3 size={24} className="text-emerald-400 mb-2" />
                <p className="font-bold text-sm">Analytics</p>
                <p className="text-xs text-white/40">Track progress</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <Shield size={24} className="text-violet-400 mb-2" />
                <p className="font-bold text-sm">Secure</p>
                <p className="text-xs text-white/40">Data privacy</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center p-6 lg:p-12 relative z-10 overflow-y-auto">
        <div className="w-full max-w-lg py-8">
          <Link href="/school-portal" className="inline-flex items-center gap-2 text-white/50 hover:text-white mb-8 transition-colors text-sm">
            <ArrowLeft size={16} />
            Back to School Portal
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                <Sparkles className="text-white" size={20} />
              </div>
              <span className="text-xl font-black">EduQuest</span>
            </div>

            <h1 className="text-3xl font-black mb-2">Register Your School</h1>
            <p className="text-white/50 mb-8">Get started with EduQuest for your institution</p>

            <div className="flex gap-2 mb-8">
              <div className={`flex-1 h-1.5 rounded-full ${step >= 1 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-white/10'}`} />
              <div className={`flex-1 h-1.5 rounded-full ${step >= 2 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-white/10'}`} />
              <div className={`flex-1 h-1.5 rounded-full ${step >= 3 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-white/10'}`} />
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-5"
                >
                  <div className="flex items-center gap-2 text-blue-400 text-sm font-semibold mb-4">
                    <Building size={16} />
                    Basic Information
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white/70 text-sm">School Name *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-white/5 border-white/10 h-12 text-white placeholder:text-white/30"
                      placeholder="e.g., Delhi Public School"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white/70 text-sm">UDISE Code *</Label>
                    <Input
                      value={formData.udise_code}
                      onChange={(e) => setFormData({ ...formData, udise_code: e.target.value })}
                      className="bg-white/5 border-white/10 h-12 text-white placeholder:text-white/30"
                      placeholder="11 digit UDISE code"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white/70 text-sm">State *</Label>
                      <Select value={formData.state} onValueChange={(value) => setFormData({ ...formData, state: value })}>
                        <SelectTrigger className="bg-white/5 border-white/10 h-12 text-white">
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-white/10 max-h-60">
                          {INDIAN_STATES.map((state) => (
                            <SelectItem key={state} value={state}>{state}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/70 text-sm">District *</Label>
                      <Input
                        value={formData.district}
                        onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                        className="bg-white/5 border-white/10 h-12 text-white placeholder:text-white/30"
                        placeholder="e.g., South Delhi"
                      />
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={!canProceedStep1}
                    className="w-full h-12 text-base font-bold rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 shadow-lg shadow-blue-500/25"
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
                  <button type="button" onClick={() => setStep(1)} className="text-sm text-white/50 hover:text-white flex items-center gap-1 mb-2">
                    <ArrowLeft size={14} /> Back
                  </button>

                  <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold mb-4">
                    <Users size={16} />
                    School Details
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white/70 text-sm">School Type *</Label>
                    <Select value={formData.school_type} onValueChange={(value) => selectGradeRange(value)}>
                      <SelectTrigger className="bg-white/5 border-white/10 h-12 text-white">
                        <SelectValue placeholder="Select school type" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/10">
                        {SCHOOL_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white/70 text-sm">Grades Available *</Label>
                    <p className="text-xs text-white/40">Select all grades offered at your school</p>
                    <div className="grid grid-cols-6 gap-2 mt-2">
                      {ALL_GRADES.map((grade) => (
                        <button
                          key={grade}
                          type="button"
                          onClick={() => handleGradeToggle(grade)}
                          className={`p-3 rounded-lg border text-sm font-bold transition-all ${formData.grades_available.includes(grade)
                              ? 'bg-blue-500 border-blue-400 text-white'
                              : 'bg-white/5 border-white/10 text-white/50 hover:border-white/30'
                            }`}
                        >
                          {grade}
                        </button>
                      ))}
                    </div>
                    {formData.grades_available.length > 0 && (
                      <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        Selected: Class {formData.grades_available.join(', ')}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white/70 text-sm">Approximate Student Count</Label>
                    <Input
                      type="number"
                      value={formData.student_count}
                      onChange={(e) => setFormData({ ...formData, student_count: e.target.value })}
                      className="bg-white/5 border-white/10 h-12 text-white placeholder:text-white/30"
                      placeholder="Total number of students"
                    />
                  </div>

                  <Button
                    type="button"
                    onClick={() => setStep(3)}
                    disabled={!canProceedStep2}
                    className="w-full h-12 text-base font-bold rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 shadow-lg shadow-blue-500/25"
                  >
                    Continue
                    <ArrowLeft size={18} className="ml-2 rotate-180" />
                  </Button>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-5"
                >
                  <button type="button" onClick={() => setStep(2)} className="text-sm text-white/50 hover:text-white flex items-center gap-1 mb-2">
                    <ArrowLeft size={14} /> Back
                  </button>

                  <div className="flex items-center gap-2 text-violet-400 text-sm font-semibold mb-4">
                    <MapPin size={16} />
                    Contact Information
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white/70 text-sm">Principal Name</Label>
                    <Input
                      value={formData.principal_name}
                      onChange={(e) => setFormData({ ...formData, principal_name: e.target.value })}
                      className="bg-white/5 border-white/10 h-12 text-white placeholder:text-white/30"
                      placeholder="Full name of the principal"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white/70 text-sm">Contact Email</Label>
                    <Input
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                      className="bg-white/5 border-white/10 h-12 text-white placeholder:text-white/30"
                      placeholder="school@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white/70 text-sm">Contact Phone</Label>
                    <Input
                      value={formData.contact_phone}
                      onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                      className="bg-white/5 border-white/10 h-12 text-white placeholder:text-white/30"
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white/70 text-sm">Address (Optional)</Label>
                    <Textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 min-h-[80px]"
                      placeholder="Full school address"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 text-base font-bold rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 shadow-lg shadow-blue-500/25"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 animate-spin" size={20} />
                        Registering...
                      </>
                    ) : (
                      <>
                        <School size={18} className="mr-2" />
                        Register School
                      </>
                    )}
                  </Button>

                  <p className="text-center text-xs text-white/40">
                    Your school will be reviewed before approval. This usually takes 1-2 business days.
                  </p>
                </motion.div>
              )}
            </form>

            <div className="mt-8 pt-8 border-t border-white/10">
              <p className="text-center text-white/50 text-sm">
                Already registered?{' '}
                <Link href="/school-portal/login" className="text-blue-400 hover:text-blue-300 font-semibold">
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
