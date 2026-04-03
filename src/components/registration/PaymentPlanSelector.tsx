'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface PaymentPlan {
  id: string;
  name: string;
  price: number;
  validity_months: number;
  max_students: number;
  max_classes: number;
  description: string;
  features: string[];
}

interface PaymentPlanSelectorProps {
  plans: PaymentPlan[];
  onPlanSelect: (planId: string, promoCodeId?: string) => void;
  loading?: boolean;
  onValidatePromo?: (code: string) => Promise<any>;
}

export function PaymentPlanSelector({
  plans,
  onPlanSelect,
  loading = false,
  onValidatePromo
}: PaymentPlanSelectorProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState('');

  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      setPromoError('Please enter a promo code');
      return;
    }

    if (!selectedPlanId) {
      setPromoError('Please select a plan first');
      return;
    }

    setPromoLoading(true);
    setPromoError('');
    try {
      if (onValidatePromo) {
        const result = await onValidatePromo(promoCode);
        if (result.success) {
          setAppliedPromo(result.promoCode);
          toast.success(`Promo code applied! ${result.discount}% off`);
          setPromoCode('');
        } else {
          setPromoError(result.message || 'Invalid promo code');
        }
      }
    } catch (err: any) {
      setPromoError(err.message || 'Failed to apply promo code');
    } finally {
      setPromoLoading(false);
    }
  };

  const removePromo = () => {
    setAppliedPromo(null);
    setPromoCode('');
  };

  const handleProceedToCheckout = () => {
    if (!selectedPlanId) {
      toast.error('Please select a payment plan');
      return;
    }
    onPlanSelect(selectedPlanId, appliedPromo?.id);
  };

  const getFinalPrice = () => {
    if (!selectedPlan) return 0;
    let price = selectedPlan.price;
    if (appliedPromo?.discount_percentage) {
      price = price * (1 - appliedPromo.discount_percentage / 100);
    }
    return Math.round(price);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-12">
        <h1 className="text-4xl font-black text-slate-900 mb-3">Choose Your Plan</h1>
        <p className="text-slate-600 text-lg">Select the perfect plan for your school and activate your portal</p>
      </div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {plans.map((plan, idx) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => setSelectedPlanId(plan.id)}
            className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
              selectedPlanId === plan.id
                ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/20'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
            }`}
          >
            {/* Selection Indicator */}
            {selectedPlanId === plan.id && (
              <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                <Check size={16} className="text-white" />
              </div>
            )}

            {/* Plan Name & Price */}
            <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
            <div className="mb-4">
              <div className="text-3xl font-black text-slate-900">₹{plan.price.toLocaleString()}</div>
              <p className="text-sm text-slate-500">for {plan.validity_months} months</p>
            </div>

            {/* Description */}
            <p className="text-sm text-slate-600 mb-4">{plan.description}</p>

            {/* Features */}
            <ul className="space-y-2">
              <li className="text-sm text-slate-700 flex items-center gap-2">
                <Check size={16} className="text-emerald-500 flex-shrink-0" />
                Up to {plan.max_students} students
              </li>
              <li className="text-sm text-slate-700 flex items-center gap-2">
                <Check size={16} className="text-emerald-500 flex-shrink-0" />
                {plan.max_classes} classes
              </li>
              {plan.features.map((feature, i) => (
                <li key={i} className="text-sm text-slate-700 flex items-center gap-2">
                  <Check size={16} className="text-emerald-500 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>

      {/* Promo Code & Checkout Section */}
      {selectedPlan && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-slate-50 to-slate-100 p-8 rounded-2xl border border-slate-200"
        >
          <div className="grid md:grid-cols-2 gap-8">
            {/* Promo Code */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4">Have a Promo Code?</h3>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-bold text-slate-700 block mb-2">Promo Code</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter promo code"
                      value={promoCode}
                      onChange={(e) => {
                        setPromoCode(e.target.value);
                        setPromoError('');
                      }}
                      disabled={!!appliedPromo || promoLoading}
                      className="flex-1 h-11 rounded-lg"
                    />
                    <Button
                      onClick={handleApplyPromo}
                      disabled={!!appliedPromo || promoLoading || !promoCode.trim()}
                      className="px-6 rounded-lg"
                    >
                      {promoLoading ? <Loader2 size={16} className="animate-spin" /> : 'Apply'}
                    </Button>
                  </div>
                </div>

                {/* Applied Promo */}
                {appliedPromo && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Check size={18} className="text-emerald-500" />
                      <div>
                        <p className="font-bold text-emerald-900">{appliedPromo.code}</p>
                        <p className="text-sm text-emerald-700">{appliedPromo.discount_percentage}% off</p>
                      </div>
                    </div>
                    <button
                      onClick={removePromo}
                      className="text-emerald-600 hover:text-emerald-700"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Error */}
                {promoError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex gap-2 text-rose-700">
                    <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                    <p className="text-sm">{promoError}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4">Order Summary</h3>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-slate-700">
                  <span>{selectedPlan.name}</span>
                  <span className="font-semibold">₹{selectedPlan.price.toLocaleString()}</span>
                </div>
                {appliedPromo && (
                  <>
                    <div className="flex justify-between text-slate-700">
                      <span>Discount ({appliedPromo.discount_percentage}%)</span>
                      <span className="font-semibold text-emerald-600">
                        -₹{Math.round(selectedPlan.price * appliedPromo.discount_percentage / 100).toLocaleString()}
                      </span>
                    </div>
                    <div className="border-t border-slate-300" />
                  </>
                )}
                <div className="flex justify-between items-center text-lg">
                  <span className="font-bold text-slate-900">Total Amount</span>
                  <span className="text-2xl font-black text-blue-600">₹{getFinalPrice().toLocaleString()}</span>
                </div>
              </div>

              <Button
                onClick={handleProceedToCheckout}
                disabled={loading}
                className="w-full h-12 text-base font-bold rounded-lg"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  'Proceed to Checkout'
                )}
              </Button>

              <p className="text-xs text-slate-500 text-center mt-3">
                You will be redirected to Razorpay to complete the payment
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
