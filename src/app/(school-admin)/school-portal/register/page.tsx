'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import confetti from 'canvas-confetti';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { registerSchool, fetchActivePaymentPlans, fetchGlobalClasses, checkIdentifierExists } from '@/modules/auth/register-actions';
import { validatePromoCode } from '@/modules/super-admin/actions';
import { getResponseErrorMessage } from '@/lib/error-utils';
import { toast } from 'sonner';
import {
  ArrowLeft, Users, CheckCircle2, Loader2,
  CreditCard, Check, Eye, EyeOff, ArrowRight,
  Building2, BadgeCheck, X, MapPin, Map, Compass, Shield, Lock, Tag, Gift
} from 'lucide-react';
import { PrimaryButton } from '@/components/landing/PrimaryButton';
import { SchoolRegistrationSidebar } from '@/modules/auth/components/SchoolRegistrationSidebar';

const INDIAN_STATES = [
  'Jammu and Kashmir', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

const JK_DISTRICTS = [
  'Anantnag', 'Bandipora', 'Baramulla', 'Budgam', 'Doda', 'Ganderbal', 'Jammu',
  'Kathua', 'Kishtwar', 'Kulgam', 'Kupwara', 'Poonch', 'Pulwama', 'Rajouri',
  'Ramban', 'Reasi', 'Samba', 'Shopian', 'Srinagar', 'Udhampur'
];

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function SchoolRegistrationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [plansLoading, setPlansLoading] = useState(true);
  const [paymentPlans, setPaymentPlans] = useState<any[]>([]);
  const [classesData, setClassesData] = useState<any[]>([]);
  const [step, setStep] = useState(1);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutOrder, setCheckoutOrder] = useState<any>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    udise_code: '',
    address: '',
    district: '',
    state: '',
    pincode: '',
    classes_available: [] as string[],
    student_count: '',
    contact_email: '',
    contact_phone: '',
    principal_name: '',
    password: '',
    plan_id: '',
    promo_code_id: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [orderError, setOrderError] = useState<string>('');
  const [orderRetry, setOrderRetry] = useState(0);

  const validateStep = (stepNumber: number) => {
    const newErrors: Record<string, string> = {};
    if (stepNumber === 1) {
      // School name validation
      if (!formData.name.trim()) newErrors.name = 'School name is required';
      else if (formData.name.trim().length < 3) newErrors.name = 'School name must be at least 3 characters';

      // UDISE code: exactly 11 digits
      if (!formData.udise_code.trim()) newErrors.udise_code = 'UDISE code is required';
      else if (!/^\d{11}$/.test(formData.udise_code.trim())) newErrors.udise_code = 'UDISE code must be exactly 11 digits';

      // Address validation
      if (!formData.address.trim()) newErrors.address = 'Address is required';
      else if (formData.address.trim().length < 5) newErrors.address = 'Address must be at least 5 characters';

      if (!formData.state) newErrors.state = 'State is required';
      if (!formData.district) newErrors.district = 'District is required';

      // Pincode validation: 6 digits for India
      if (!formData.pincode.trim()) newErrors.pincode = 'Pincode is required';
      else if (!/^\d{6}$/.test(formData.pincode.trim())) newErrors.pincode = 'Pincode must be exactly 6 digits';
    } else if (stepNumber === 2) {
      if (formData.classes_available.length === 0) newErrors.classes_available = 'Select at least one class';

      // Student count validation
      if (!formData.student_count.trim()) newErrors.student_count = 'Student count is required';
      else {
        const count = parseInt(formData.student_count, 10);
        if (isNaN(count)) newErrors.student_count = 'Student count must be a number';
        else if (count < 10) newErrors.student_count = 'Minimum 10 students required';
        else if (count > 100000) newErrors.student_count = 'Maximum 100,000 students allowed';
      }
    } else if (stepNumber === 3) {
      if (!formData.principal_name.trim()) newErrors.principal_name = 'Principal name is required';
      else if (formData.principal_name.trim().length < 3) newErrors.principal_name = 'Principal name must be at least 3 characters';

      if (!formData.contact_email.trim()) newErrors.contact_email = 'Contact email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) newErrors.contact_email = 'Invalid email format';

      // Phone: 10-digit Indian format
      if (!formData.contact_phone.trim()) newErrors.contact_phone = 'Contact phone is required';
      else if (!/^[6-9]\d{9}$/.test(formData.contact_phone.trim())) newErrors.contact_phone = 'Phone must be 10 digits starting with 6-9 (Indian format)';

      if (!formData.password) newErrors.password = 'Password is required';
      else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = async (currentStep: number) => {
    if (!validateStep(currentStep)) {
      toast.error('Please fill in all required fields correctly');
      return;
    }

    if (currentStep === 3) {
      setLoading(true);
      try {
        const res = await checkIdentifierExists(formData.contact_email);
        if (res.exists) {
          setErrors(prev => ({ ...prev, contact_email: `This ${(res.role ?? 'account').replace('_', ' ')} is already registered` }));
          toast.error('The email address provided is already in use');
          return;
        }
        
        // If no payment plans, register school immediately after currentStep 3 check passes
        if (paymentPlans.length === 0) {
            await handleRegisterSchool(null);
            return;
        }
      } catch (err) {
        console.error('Email check failed:', err);
      } finally {
        setLoading(false);
      }
    }

    setErrors({});
    setStep(currentStep + 1);
  };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [plans, classes, s] = await Promise.all([
          fetchActivePaymentPlans(),
          fetchGlobalClasses(),
          import('@/components/landing/actions').then(m => m.getPlatformSettings())
        ]);
        setPaymentPlans(plans);
        setClassesData(classes);
        setSettings(s);
        if (plans.length > 0) {
          setFormData(prev => ({ ...prev, plan_id: plans[0].id }));
        }
      } catch (error) {
        console.error('Failed to load initial registration data', error);
      } finally {
        setPlansLoading(false);
      }
    };
    loadInitialData();
  }, []);

  // Sync checkout order when plan or promo changes in Step 4 with error handling
  useEffect(() => {
    if (step === 4 && formData.plan_id) {
      setCheckoutOrder(null);
      setOrderError('');

      createOrder(formData.plan_id, formData.promo_code_id)
        .then(data => {
          setCheckoutOrder(data);
          setOrderError('');
        })
        .catch(err => {
          console.error("Order sync failed", err);
          setCheckoutOrder(null);
          setOrderError('Failed to calculate order. Please try again.');
        });
    }
  }, [step, formData.plan_id, formData.promo_code_id, orderRetry]);

  /**
   * Razorpay is loaded via Next.js <Script> component at the bottom
   * for improved reliability and performance.
   */

  const handleClassToggle = (classId: string) => {
    setFormData(prev => ({
      ...prev,
      classes_available: prev.classes_available.includes(classId)
        ? prev.classes_available.filter(id => id !== classId)
        : [...prev.classes_available, classId]
    }));
  };

  const createOrder = async (planId: string, promoCodeId: string) => {
    const res = await fetch('/api/payment/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan_id: planId, promo_code_id: promoCodeId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(getResponseErrorMessage(data, 'Request failed'));
    return data;
  };

  const handleApplyPromo = async () => {
    if (!promoCodeInput) return;
    setPromoLoading(true);
    setPromoError('');
    try {
      const res = await validatePromoCode(promoCodeInput);
      if (res.success && res.promo) {
        const updatedOrder = await createOrder(formData.plan_id, res.promo.id);
        setAppliedPromo(res.promo);
        setFormData(prev => ({ ...prev, promo_code_id: res.promo.id }));
        setCheckoutOrder(updatedOrder);
        toast.success('Promo code applied successfully!');
      } else {
        setPromoError(getResponseErrorMessage(res, 'Invalid promo code'));
        setAppliedPromo(null);
        setFormData(prev => ({ ...prev, promo_code_id: '' }));
      }
    } catch (error: any) {
      setPromoError(error.message || 'Failed to validate promo code');
    } finally {
      setPromoLoading(false);
    }
  };

  const removePromo = async () => {
    setAppliedPromo(null);
    setPromoCodeInput('');
    setFormData(prev => ({ ...prev, promo_code_id: '' }));
    try {
      const updatedOrder = await createOrder(formData.plan_id, '');
      setCheckoutOrder(updatedOrder);
      toast.info('Promo code removed');
    } catch (err: any) {
      console.error('Failed to reset order:', err);
    }
  };



  const handleRazorpayPayment = async () => {
    if (!checkoutOrder) {
      toast.error('Order session not found. Please try again.');
      return;
    }

    // FREE plan — no payment needed
    if (checkoutOrder.free) {
      handleRegisterSchool(null);
      return;
    }

    // LIVE RAZORPAY PAYMENT
    if (!window.Razorpay) {
      toast.error('Payment gateway not loaded. Please refresh the page and try again.');
      return;
    }

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: checkoutOrder.amount,
      currency: checkoutOrder.currency || 'INR',
      name: settings?.platform_name || 'TechNurture Labs',
      description: `${checkoutOrder.plan.name} - Annual School License`,
      order_id: checkoutOrder.order_id,
      handler: async (response: any) => {
        // Verification is now handled on-server inside registerSchool to avoid 
        // session/auth issues during initial registration.
        handleRegisterSchool(response);
      },
      prefill: {
        name: formData.principal_name,
        email: formData.contact_email,
        contact: formData.contact_phone,
      },
      theme: { color: '#4F46E5' },
      modal: {
        ondismiss: () => {
          toast.info('Payment cancelled. You can try again.');
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const handleRegisterSchool = async (paymentDetails: any = null) => {
    setLoading(true);
    const toastId = toast.loading('Setting up your school portal...');
    try {
      const result = await registerSchool(
        { ...formData },
        paymentDetails ? {
          order_id: paymentDetails.razorpay_order_id,
          payment_id: paymentDetails.razorpay_payment_id,
          signature: paymentDetails.razorpay_signature
        } : undefined
      );

      if (!result.success) {
        toast.error(('error' in result ? (result as any).error : null) || 'Registration failed. Please try again.', { id: toastId });
        setLoading(false);
        return;
      }

      toast.success('School registered successfully!', { id: toastId });
      setShowCheckout(false);
      setPaymentSuccess(true);

      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#4F46E5', '#6366F1', '#10B981', '#F59E0B']
      });

      setTimeout(() => {
        router.push('/school-admin');
      }, 3500);
    } catch (error: any) {
      toast.error('Registration failed: ' + error.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-slate-50 text-slate-900 flex font-sans selection:bg-blue-100 selection:text-blue-900">

      {/* Background Grid & Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[1000px] h-[700px] bg-blue-100/40 rounded-full blur-[140px]" />
      </div>

      {/* Payment Success Overlay */}
      <AnimatePresence>
        {paymentSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center text-center px-8"
          >
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 12 }}
              className="w-28 h-28 rounded-full bg-emerald-500 flex items-center justify-center mb-8 shadow-2xl shadow-emerald-500/30"
            >
              <BadgeCheck size={56} className="text-white" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl font-black text-slate-900 mb-4"
            >
              You&apos;re all set! {'\uD83C\uDF89'}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-slate-500 text-lg font-medium max-w-sm"
            >
              Your school portal is being activated. Redirecting you to sign in...
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>



      <AnimatePresence mode="wait">
        {step < 4 && <SchoolRegistrationSidebar settings={settings} />}
      </AnimatePresence>

      <div className={`flex-1 flex flex-col items-center p-6 lg:p-12 relative z-10 overflow-y-auto transition-all duration-700 ${step === 4 ? 'w-full' : ''}`}>
        <div className={`w-full py-12 my-auto transition-all duration-700 ${step === 4 ? 'max-w-4xl' : 'max-w-xl'}`}>
          <Link href="/school-portal" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 mb-10 transition-all font-bold group cursor-pointer">
            <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
            Back to School Portal
          </Link>


          <h1 className="text-4xl font-black mb-3 text-slate-900 tracking-tight leading-tight">School Onboarding</h1>
          <p className="text-slate-500 font-medium mb-10 text-lg">Step {step} of {paymentPlans.length > 0 ? 4 : 3}: Setup your account</p>

          <div className="flex gap-2 mb-12">
            {[1, 2, 3, ...(paymentPlans.length > 0 ? [4] : [])].map((s) => (
              <div key={s} className={`h-1.5 rounded-full transition-all duration-500 flex-1 ${step >= s ? 'bg-slate-900' : 'bg-slate-200'}`} />
            ))}
          </div>

          <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-2 text-slate-900 text-xs font-black uppercase tracking-widest mb-2">
                    <Building2 size={16} />
                    Basic Information
                  </div>
                  <div className="space-y-2">
                    <Label className={`text-[10px] ml-1 uppercase tracking-wider font-bold transition-colors ${errors.name ? 'text-rose-500' : 'text-slate-600'}`}>School Name *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                      }}
                      className={`bg-white h-14 px-5 rounded-2xl transition-all font-medium text-base shadow-sm border ${errors.name ? 'border-rose-400 focus:border-rose-500 ring-rose-500/10 focus:ring-4' : 'border-slate-200 focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5'
                        }`}
                      placeholder="e.g., International Academic Square"
                    />
                    {errors.name && <p className="text-[10px] text-rose-500 font-bold ml-1 animate-in fade-in slide-in-from-top-1">{errors.name}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className={`text-[10px] ml-1 uppercase tracking-wider font-bold transition-colors ${errors.udise_code ? 'text-rose-500' : 'text-slate-600'}`}>Registration ID / UDISE *</Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={formData.udise_code}
                      onChange={(e) => {
                        setFormData({ ...formData, udise_code: e.target.value });
                        if (errors.udise_code) setErrors(prev => ({ ...prev, udise_code: '' }));
                      }}
                      className={`bg-white h-14 px-5 rounded-2xl transition-all font-medium text-base shadow-sm border ${errors.udise_code ? 'border-rose-400 focus:border-rose-500 ring-rose-500/10 focus:ring-4' : 'border-slate-200 focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5'
                        }`}
                      placeholder="11-Digit Unique Code"
                    />
                    {errors.udise_code && <p className="text-[10px] text-rose-500 font-bold ml-1 animate-in fade-in slide-in-from-top-1">{errors.udise_code}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className={`text-[10px] ml-1 uppercase tracking-wider font-bold transition-colors ${errors.address ? 'text-rose-500' : 'text-slate-600'}`}>School Address *</Label>
                    <Input
                      type="text"
                      value={formData.address}
                      onChange={(e) => {
                        setFormData({ ...formData, address: e.target.value });
                        if (errors.address) setErrors(prev => ({ ...prev, address: '' }));
                      }}
                      className={`bg-white h-14 px-5 rounded-2xl transition-all font-medium text-base shadow-sm border ${errors.address ? 'border-rose-400 focus:border-rose-500 ring-rose-500/10 focus:ring-4' : 'border-slate-200 focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5'
                        }`}
                      placeholder="Street Address, Building, Area"
                    />
                    {errors.address && <p className="text-[10px] text-rose-500 font-bold ml-1 animate-in fade-in slide-in-from-top-1">{errors.address}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className={`text-[10px] ml-1 uppercase tracking-wider font-bold transition-colors ${errors.pincode ? 'text-rose-500' : 'text-slate-600'}`}>Postal Code *</Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={formData.pincode}
                      onChange={(e) => {
                        setFormData({ ...formData, pincode: e.target.value });
                        if (errors.pincode) setErrors(prev => ({ ...prev, pincode: '' }));
                      }}
                      className={`bg-white h-14 px-5 rounded-2xl transition-all font-medium text-base shadow-sm border ${errors.pincode ? 'border-rose-400 focus:border-rose-500 ring-rose-500/10 focus:ring-4' : 'border-slate-200 focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5'
                        }`}
                      placeholder="6-Digit PIN Code"
                    />
                    {errors.pincode && <p className="text-[10px] text-rose-500 font-bold ml-1 animate-in fade-in slide-in-from-top-1">{errors.pincode}</p>}
                  </div>
                  <div className="pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-slate-900 text-xs font-black uppercase tracking-widest mb-4">
                      <MapPin size={16} />
                      Location Details
                    </div>
                    <div className="space-y-2">
                      {/* Labels and Inputs in aligned rows */}
                      <div className="flex gap-3">
                        <div className="flex-1 space-y-1.5 min-w-0">
                          <Label className={`text-[9px] ml-3 uppercase tracking-widest font-black transition-colors ${errors.state ? 'text-rose-500' : 'text-slate-500'}`}>State *</Label>
                          <Select
                            value={formData.state}
                            onValueChange={(value) => {
                              setFormData({ ...formData, state: value });
                              if (errors.state) setErrors(prev => ({ ...prev, state: '' }));
                            }}
                          >
                            <SelectTrigger className={cn(
                               "group bg-white border h-[42px] px-4 w-full transition-all relative rounded-full text-[11px] font-bold overflow-hidden",
                               errors.state ? 'border-rose-400 ring-rose-500/10' : 'border-slate-200 focus:ring-slate-950/5'
                            )}>
                              <div className="flex items-center gap-2 w-full min-w-0">
                                <Map size={13} className="text-slate-400 flex-shrink-0" />
                                <div className="flex-1 text-left truncate whitespace-nowrap overflow-hidden">
                                  <SelectValue placeholder="State" />
                                </div>
                              </div>
                            </SelectTrigger>
                            <SelectContent className="bg-white border-slate-200 max-h-60 rounded-2xl shadow-2xl">
                              {INDIAN_STATES.map((state) => (
                                <SelectItem key={state} value={state} className="py-2 rounded-lg focus:bg-slate-50 text-[11px] font-semibold">{state}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex-1 space-y-1.5 min-w-0">
                          <Label className={`text-[9px] ml-3 uppercase tracking-widest font-black transition-colors ${errors.district ? 'text-rose-500' : 'text-slate-500'}`}>District *</Label>
                          <div className="relative h-[42px]">
                            {formData.state === 'Jammu and Kashmir' ? (
                              <Select
                                value={formData.district}
                                onValueChange={(value) => {
                                  setFormData({ ...formData, district: value });
                                  if (errors.district) setErrors(prev => ({ ...prev, district: '' }));
                                }}
                              >
                                <SelectTrigger className={cn(
                                  "group bg-white border h-[42px] px-4 w-full transition-all relative rounded-full text-[11px] font-bold overflow-hidden",
                                  errors.district ? 'border-rose-400 ring-rose-500/10' : 'border-slate-200 focus:ring-slate-950/5'
                                )}>
                                  <div className="flex items-center gap-2 w-full min-w-0">
                                    <Compass size={13} className="text-slate-400 flex-shrink-0" />
                                    <div className="flex-1 text-left truncate whitespace-nowrap overflow-hidden">
                                      <SelectValue placeholder="District" />
                                    </div>
                                  </div>
                                </SelectTrigger>
                                <SelectContent className="bg-white border-slate-200 max-h-60 rounded-2xl shadow-2xl">
                                  {JK_DISTRICTS.map((district) => (
                                    <SelectItem key={district} value={district} className="py-2 rounded-lg focus:bg-slate-50 text-[11px] font-semibold">{district}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                                  <Compass size={13} className="text-slate-400" />
                                </div>
                                <Input
                                  value={formData.district}
                                  onChange={(e) => {
                                    setFormData({ ...formData, district: e.target.value });
                                    if (errors.district) setErrors(prev => ({ ...prev, district: '' }));
                                  }}
                                  className={cn(
                                     "bg-white h-[42px] pl-10 pr-4 text-[11px] font-bold shadow-sm border rounded-full transition-all",
                                     errors.district ? 'border-rose-400 focus:border-rose-500 ring-rose-500/10' : 'border-slate-200 focus:border-slate-950 focus:ring-slate-950/5'
                                  )}
                                  placeholder="District"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-3">
                         <div className="flex-1 min-w-0">
                            {errors.state && <p className="text-[9px] text-rose-500 font-bold ml-3 animate-in fade-in slide-in-from-top-1">{errors.state}</p>}
                         </div>
                         <div className="flex-1 min-w-0">
                            {errors.district && <p className="text-[9px] text-rose-500 font-bold ml-3 animate-in fade-in slide-in-from-top-1">{errors.district}</p>}
                         </div>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4">
                    <PrimaryButton
                      type="button"
                      onClick={() => handleNextStep(1)}
                      variant="primary"
                      className="w-full !h-14 !text-base !rounded-2xl !bg-slate-950 hover:!bg-slate-900 shadow-xl shadow-slate-950/10 transition-all font-black uppercase tracking-widest cursor-pointer group"
                    >
                      Continue
                      <ArrowRight size={18} className="ml-2 transition-transform group-hover:translate-x-1" />
                    </PrimaryButton>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <button type="button" onClick={() => setStep(1)} className="text-sm font-bold text-slate-400 hover:text-slate-900 flex items-center gap-1 cursor-pointer transition-colors mb-4">
                    <ArrowLeft size={16} /> Previous
                  </button>
                  <div className="flex items-center gap-2 text-slate-950 text-xs font-black uppercase tracking-widest mb-2">
                    <Users size={16} />
                    Class Coverage
                  </div>
                  <div className="space-y-4">
                    <Label className={`text-sm ml-1 uppercase tracking-wider font-bold transition-colors ${errors.classes_available ? 'text-rose-500' : 'text-slate-600'}`}>Select Available Classes *</Label>
                    <div className={`grid grid-cols-3 sm:grid-cols-6 gap-3 p-3 rounded-2xl transition-all ${errors.classes_available ? 'bg-rose-50/50 ring-2 ring-rose-500/10' : ''}`}>
                      {classesData.map((cls: any) => (
                        <button
                          key={cls.id}
                          type="button"
                          onClick={() => {
                            handleClassToggle(cls.id);
                            if (errors.classes_available) setErrors(prev => ({ ...prev, classes_available: '' }));
                          }}
                          className={`h-14 rounded-2xl border text-base font-black transition-all cursor-pointer ${formData.classes_available.includes(cls.id)
                            ? 'bg-slate-950 border-slate-950 text-white shadow-lg'
                            : 'bg-white border-slate-200 text-slate-400 hover:border-slate-400'
                            }`}
                        >
                          {cls.name}
                        </button>
                      ))}
                    </div>
                    {errors.classes_available && <p className="text-xs text-rose-500 font-bold ml-1 animate-in fade-in slide-in-from-top-1">{errors.classes_available}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className={`text-[10px] ml-1 uppercase tracking-wider font-bold transition-colors ${errors.student_count ? 'text-rose-500' : 'text-slate-600'}`}>Est. Student Enrollment *</Label>
                    <Input
                      type="number"
                      min="10"
                      max="100000"
                      value={formData.student_count}
                      onChange={(e) => {
                        setFormData({ ...formData, student_count: e.target.value });
                        if (errors.student_count) setErrors(prev => ({ ...prev, student_count: '' }));
                      }}
                      className={`bg-white h-14 px-5 rounded-2xl transition-all font-medium text-base shadow-sm border ${errors.student_count ? 'border-rose-400 focus:border-rose-500 ring-rose-500/10 focus:ring-4' : 'border-slate-200 focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5'
                        }`}
                      placeholder="e.g., 500"
                    />
                    {errors.student_count && <p className="text-[10px] text-rose-500 font-bold ml-1 animate-in fade-in slide-in-from-top-1">{errors.student_count}</p>}
                  </div>
                  <div className="pt-4">
                    <PrimaryButton
                      type="button"
                      onClick={() => handleNextStep(2)}
                      variant="primary"
                      className="w-full !h-14 !text-base !rounded-2xl !bg-slate-950 hover:!bg-slate-900 shadow-xl shadow-slate-950/10 transition-all font-black uppercase tracking-widest cursor-pointer group"
                    >
                      Continue
                      <ArrowRight size={18} className="ml-2 transition-transform group-hover:translate-x-1" />
                    </PrimaryButton>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <button type="button" onClick={() => setStep(2)} className="text-sm font-bold text-slate-400 hover:text-slate-900 flex items-center gap-1 cursor-pointer transition-colors mb-4">
                    <ArrowLeft size={16} /> Previous
                  </button>
                  <div className="flex items-center gap-2 text-slate-900 text-xs font-black uppercase tracking-widest mb-2">
                    <Shield size={16} />
                    Account Access
                  </div>
                  <div className="space-y-2">
                    <Label className={`text-[10px] ml-1 uppercase tracking-wider font-bold transition-colors ${errors.principal_name ? 'text-rose-500' : 'text-slate-600'}`}>Contact Name *</Label>
                    <Input
                      value={formData.principal_name}
                      onChange={(e) => {
                        setFormData({ ...formData, principal_name: e.target.value });
                        if (errors.principal_name) setErrors(prev => ({ ...prev, principal_name: '' }));
                      }}
                      className={`bg-white h-14 px-5 rounded-2xl transition-all font-medium text-base shadow-sm border ${errors.principal_name ? 'border-rose-400 focus:border-rose-500 ring-rose-500/10 focus:ring-4' : 'border-slate-200 focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5'
                        }`}
                      placeholder="Full Name"
                    />
                    {errors.principal_name && <p className="text-[10px] text-rose-500 font-bold ml-1 animate-in fade-in slide-in-from-top-1">{errors.principal_name}</p>}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className={`text-[10px] ml-1 uppercase tracking-wider font-bold transition-colors ${errors.contact_email ? 'text-rose-500' : 'text-slate-600'}`}>Email *</Label>
                      <Input
                        type="email"
                        value={formData.contact_email}
                        onChange={(e) => {
                          setFormData({ ...formData, contact_email: e.target.value });
                          if (errors.contact_email) setErrors(prev => ({ ...prev, contact_email: '' }));
                        }}
                        className={`bg-white h-14 px-5 rounded-2xl transition-all font-medium text-base shadow-sm border ${errors.contact_email ? 'border-rose-400 focus:border-rose-500 ring-rose-500/10 focus:ring-4' : 'border-slate-200 focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5'
                          }`}
                        placeholder="school@edu.com"
                      />
                      {errors.contact_email && <p className="text-[10px] text-rose-500 font-bold ml-1 animate-in fade-in slide-in-from-top-1">{errors.contact_email}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label className={`text-[10px] ml-1 uppercase tracking-wider font-bold transition-colors ${errors.contact_phone ? 'text-rose-500' : 'text-slate-600'}`}>Phone *</Label>
                      <Input
                        value={formData.contact_phone}
                        onChange={(e) => {
                          setFormData({ ...formData, contact_phone: e.target.value });
                          if (errors.contact_phone) setErrors(prev => ({ ...prev, contact_phone: '' }));
                        }}
                        className={`bg-white h-14 px-5 rounded-2xl transition-all font-medium text-base shadow-sm border ${errors.contact_phone ? 'border-rose-400 focus:border-rose-500 ring-rose-500/10 focus:ring-4' : 'border-slate-200 focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5'
                          }`}
                        placeholder="Contact Number"
                      />
                      {errors.contact_phone && <p className="text-[10px] text-rose-500 font-bold ml-1 animate-in fade-in slide-in-from-top-1">{errors.contact_phone}</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className={`text-[10px] ml-1 uppercase tracking-wider font-bold transition-colors ${errors.password ? 'text-rose-500' : 'text-slate-600'}`}>Set Access Password *</Label>
                    <div className="relative group">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => {
                          setFormData({ ...formData, password: e.target.value });
                          if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                        }}
                        className={`bg-white h-14 px-5 rounded-2xl transition-all font-medium text-base shadow-sm pr-14 border ${errors.password ? 'border-rose-400 focus:border-rose-500 ring-rose-500/10 focus:ring-4' : 'border-slate-200 focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5'
                          }`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 cursor-pointer z-10"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    {errors.password && <p className="text-[10px] text-rose-500 font-bold ml-1 animate-in fade-in slide-in-from-top-1">{errors.password}</p>}
                  </div>

                  <div className="pt-6">
                    {paymentPlans.length > 0 ? (
                      <PrimaryButton
                        type="button"
                        onClick={() => handleNextStep(3)}
                        variant="primary"
                        className="w-full !h-16 !text-base !rounded-2xl !bg-slate-950 hover:!bg-slate-950 shadow-xl shadow-slate-950/10 transition-all font-black uppercase tracking-widest cursor-pointer group"
                      >
                        Proceed to Selection
                        <ArrowRight size={18} className="ml-2 transition-transform group-hover:translate-x-1" />
                      </PrimaryButton>
                    ) : (
                      <PrimaryButton
                        type="button"
                        onClick={() => handleNextStep(3)}
                        variant="primary"
                        className="w-full !h-16 !text-base !rounded-2xl !bg-slate-950 hover:!bg-slate-900 shadow-xl shadow-slate-950/10 transition-all font-black uppercase tracking-widest cursor-pointer"
                      >
                        {loading ? 'Processing...' : 'Register School'}
                      </PrimaryButton>
                    )}
                  </div>
                </motion.div>
              )}

              {step === 4 && paymentPlans.length > 0 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="space-y-6 md:space-y-8"
                >
                  <button type="button" onClick={() => setStep(3)} className="text-sm font-bold text-slate-400 hover:text-slate-900 flex items-center gap-1 cursor-pointer transition-colors mb-2 md:mb-4">
                    <ArrowLeft size={16} /> Back to details
                  </button>

                  {/* Responsive Grid: mobile(1col), tablet+(2col) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 lg:gap-12">
                    {/* Plans Selection */}
                    <div className="space-y-4 md:space-y-6">
                      <div className="flex items-center gap-2 text-slate-950 text-xs font-black uppercase tracking-widest">
                        <CreditCard size={16} />
                        Select a Plan
                      </div>

                      {plansLoading ? (
                        <div className="py-16 md:py-20 flex flex-col items-center justify-center text-slate-400 gap-4">
                          <Loader2 className="animate-spin" size={32} />
                          <p className="font-bold uppercase tracking-widest text-[10px]">Loading Plans...</p>
                        </div>
                      ) : (
                        <div className="grid gap-3 md:gap-4">
                          {paymentPlans.map((plan) => (
                            <div
                              key={plan.id}
                              onClick={() => {
                                setFormData({ ...formData, plan_id: plan.id });
                                setAppliedPromo(null);
                                setPromoCodeInput('');
                                setFormData(prev => ({ ...prev, promo_code_id: '' }));
                              }}
                              className={`relative p-4 md:p-6 rounded-2xl md:rounded-[2rem] border-2 cursor-pointer transition-all ${formData.plan_id === plan.id
                                ? 'bg-white border-slate-950 shadow-xl ring-4 ring-slate-950/5 scale-[1.02]'
                                : 'bg-slate-50/50 border-slate-100 hover:border-slate-300'
                                }`}
                            >
                              {formData.plan_id === plan.id && (
                                <div className="absolute top-3 right-3 md:top-4 md:right-4 w-6 h-6 rounded-full bg-slate-950 flex items-center justify-center">
                                  <Check size={14} className="text-white" />
                                </div>
                              )}
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 pr-8 sm:pr-0">
                                <div className="flex-1">
                                  <h3 className={`font-black text-lg md:text-xl tracking-tight ${formData.plan_id === plan.id ? 'text-slate-950' : 'text-slate-900'}`}>{plan.name}</h3>
                                  <p className="text-xs text-slate-500 font-medium mt-1">{plan.description}</p>
                                </div>
                                <div className="text-right sm:shrink-0">
                                  <div className="text-xl md:text-2xl font-black text-slate-900">
                                    {plan.currency === 'INR' ? '₹' : plan.currency}{Number(plan.price).toLocaleString('en-IN')}
                                  </div>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Yearly</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Summary & Payment: Responsive sticky */}
                    <div className="bg-white rounded-2xl md:rounded-[2.5rem] border border-slate-100 shadow-xl md:shadow-2xl p-6 md:p-8 space-y-6 md:space-y-8 md:sticky md:top-6 h-fit">
                      <div>
                        <h3 className="text-lg md:text-xl font-black text-slate-900 mb-4 md:mb-6 flex items-center gap-2">
                          Order Summary
                        </h3>

                        {checkoutOrder ? (
                          <div className="space-y-3 md:space-y-4">
                            <div className="flex justify-between items-center text-sm">
                              <span className="font-bold text-slate-500 text-xs md:text-sm">Selected Plan</span>
                              <span className="font-black text-slate-900 text-xs md:text-sm">{checkoutOrder.plan.name}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="font-bold text-slate-500 text-xs md:text-sm">Base Price</span>
                              <span className="font-black text-slate-900 text-xs md:text-sm">₹{Number(checkoutOrder.original_price).toLocaleString('en-IN')}</span>
                            </div>

                            <div className="pt-3 md:pt-4 border-t border-slate-50 space-y-3 md:space-y-4">
                              <div className="space-y-2">
                                <Label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Promo Code</Label>
                                {!appliedPromo ? (
                                  <div className="flex gap-2">
                                    <div className="relative flex-1">
                                      <Tag size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                      <Input
                                        placeholder="Enter Code"
                                        value={promoCodeInput}
                                        onChange={(e) => {
                                          setPromoCodeInput(e.target.value.toUpperCase());
                                          setPromoError('');
                                        }}
                                        className="h-10 md:h-12 pl-10 bg-slate-50 border-slate-100 rounded-lg md:rounded-xl font-bold uppercase tracking-widest placeholder:normal-case text-sm"
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={handleApplyPromo}
                                      disabled={promoLoading || !promoCodeInput}
                                      className="px-3 md:px-4 bg-slate-950 text-white rounded-lg md:rounded-xl font-black text-xs uppercase tracking-widest disabled:opacity-50 h-10 md:h-12"
                                    >
                                      {promoLoading ? <Loader2 size={16} className="animate-spin" /> : 'Apply'}
                                    </button>
                                  </div>
                                ) : (
                                  <div className="bg-emerald-50 border border-emerald-100 rounded-lg md:rounded-xl p-3 md:p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-2 md:gap-3">
                                      <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                                        <Gift size={14} className="text-white" />
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-xs font-black text-emerald-900 tracking-widest truncate">{appliedPromo.code}</p>
                                        <p className="text-[9px] font-bold text-emerald-600">Applied</p>
                                      </div>
                                    </div>
                                    <button onClick={removePromo} className="text-slate-400 hover:text-rose-500 transition-colors flex-shrink-0">
                                      <X size={16} />
                                    </button>
                                  </div>
                                )}
                                {promoError && <p className="text-[9px] text-rose-500 font-bold ml-1">{promoError}</p>}
                              </div>

                              {appliedPromo && (
                                <div className="flex justify-between items-center text-emerald-600">
                                  <span className="text-xs md:text-sm font-bold flex items-center gap-1.5"><BadgeCheck size={14} /> Discount</span>
                                  <span className="font-black text-xs md:text-sm">- ₹{Number(checkoutOrder.discount_amount).toLocaleString('en-IN')}</span>
                                </div>
                              )}

                              <div className="pt-3 md:pt-4 border-t border-slate-100 flex justify-between items-center">
                                <span className="text-base md:text-lg font-black text-slate-900">Total Payable</span>
                                <div className="text-right">
                                  <span className="text-2xl md:text-3xl font-black text-slate-950">
                                    {checkoutOrder.final_amount === 0 ? 'FREE' : `₹${Number(checkoutOrder.final_amount).toLocaleString('en-IN')}`}
                                  </span>
                                  <p className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Includes all taxes</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : orderError ? (
                          <div className="py-12 md:py-16 flex flex-col items-center justify-center text-slate-400 gap-4">
                            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-rose-50 flex items-center justify-center">
                              <X size={24} className="text-rose-500" />
                            </div>
                            <div className="text-center">
                              <p className="font-bold uppercase tracking-widest text-[10px] md:text-xs text-slate-600">{orderError}</p>
                              <p className="text-[9px] text-slate-400 mt-2">Retrying may resolve the issue</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setOrderRetry(prev => prev + 1)}
                              className="mt-4 px-4 md:px-6 py-2 md:py-3 bg-slate-950 text-white rounded-lg md:rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-900 transition-colors"
                            >
                              Retry
                            </button>
                          </div>
                        ) : (
                          <div className="py-12 md:py-16 flex flex-col items-center justify-center text-slate-300 gap-4">
                            <Loader2 className="animate-spin" size={32} />
                            <p className="font-bold uppercase tracking-widest text-[10px] md:text-xs">Calculating Summary...</p>
                          </div>
                        )}

                        <div className="pt-6 md:pt-8">
                          <PrimaryButton
                            type="button"
                            onClick={handleRazorpayPayment}
                            disabled={loading || !checkoutOrder || checkoutLoading || !!orderError}
                            variant="primary"
                            className="w-full !h-12 md:!h-16 !text-sm md:!text-base !rounded-xl md:!rounded-2xl !bg-slate-950 hover:!bg-slate-900 !text-white shadow-lg md:shadow-2xl shadow-slate-950/20 transition-all font-black uppercase tracking-widest cursor-pointer group disabled:opacity-60"
                          >
                            {loading ? (
                              <><Loader2 className="mr-2 animate-spin" size={18} /> Processing...</>
                            ) : (
                              <>
                                {checkoutOrder?.final_amount === 0 ? 'Complete Registration' : 'Proceed to Payment'}
                                <ArrowRight size={16} className="ml-2 transition-transform group-hover:translate-x-1" />
                              </>
                            )}
                          </PrimaryButton>
                          <div className="mt-3 md:mt-4 flex items-center justify-center gap-2 md:gap-4">
                            <Shield size={12} className="text-slate-400 flex-shrink-0" />
                            <p className="text-[8px] md:text-[10px] text-slate-400 font-bold uppercase tracking-tight">Secure Payment • RBI Compliant</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form >

          <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col items-center gap-6">
            <p className="text-slate-500 font-medium text-center">
              Already have a portal?{' '}
              <Link href="/school-portal/login" className="text-slate-950 hover:underline font-black ml-1 cursor-pointer">
                Sign In
              </Link>
            </p>
          </div>
        </div >
      </div>

      {/* Load Razorpay Checkout SDK */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => {
          if (typeof window !== 'undefined' && window.Razorpay) {
            console.log('✓ Razorpay Checkout script loaded');
          }
        }}
        onError={() => {
          console.error('✗ Failed to load Razorpay Checkout script');
          toast.error('Payment gateway failed to load. Please refresh the page.');
        }}
      />
    </div>
  );
}
