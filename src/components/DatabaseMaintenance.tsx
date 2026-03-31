"use client";

import React from 'react';
import { Database, AlertCircle, RefreshCcw, Home, MessageCircle, Phone } from 'lucide-react';
import { motion } from 'framer-motion';

interface DatabaseMaintenanceProps {
    reset?: () => void;
    error?: Error;
}

export default function DatabaseMaintenance({ reset, error }: DatabaseMaintenanceProps) {
    return (
        <div className="h-screen w-full bg-white flex flex-col items-center justify-center p-4 sm:p-12 overflow-hidden font-sans border-0 shadow-none relative">
            
            {/* Contextualized Critical Header */}
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="absolute top-10 sm:top-12 left-0 right-0 px-6 text-center space-y-2 sm:space-y-3"
            >
                <h1 className="text-xl sm:text-4xl font-black text-slate-900 uppercase tracking-[0.25em] sm:tracking-[0.35em] leading-tight max-w-4xl mx-auto">
                    Oops! Early man ate the wires
                </h1>
                <p className="text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-[0.4em] sm:tracking-[0.5em] opacity-80">
                    Restoring the connection
                </p>
            </motion.div>

            {/* Core Visual - Size Preserved */}
            <motion.div
                initial={{ scale: 0.98, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 100, damping: 25 }}
                className="w-full max-w-[75vh] flex items-center justify-center mt-10 sm:mt-12"
            >
                <img 
                    src="/early-man.gif" 
                    alt="Restoring Connectivity" 
                    className="w-full h-auto select-none pointer-events-none p-4"
                />
            </motion.div>

            {/* Direct Interaction - Psychologically Actionable */}
            <div className="w-full max-w-5xl flex flex-col items-center gap-6 sm:gap-10 mt-4 sm:mt-6">
                
                {/* Action-Oriented Contact Capsule - Responsive */}
                <motion.div 
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-16 bg-slate-50/70 p-4 sm:p-5 px-8 sm:px-10 rounded-3xl sm:rounded-full border border-slate-100/50"
                >
                    <a href="mailto:technurturelms@gmail.com" className="flex items-center gap-3 sm:gap-4 group transition-all">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white flex items-center justify-center border border-slate-100 group-hover:bg-blue-600 transition-all shadow-sm">
                            <MessageCircle size={16} className="text-blue-500 group-hover:text-white sm:w-[18px]" />
                        </div>
                        <div className="flex flex-col items-start leading-none gap-0.5 sm:gap-1">
                            <span className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest">Mail Us Now</span>
                            <span className="text-xs sm:text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors">technurturelms@gmail.com</span>
                        </div>
                    </a>
                    
                    <a href="tel:+919596418226" className="flex items-center gap-3 sm:gap-4 group transition-all">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white flex items-center justify-center border border-slate-100 group-hover:bg-green-600 transition-all shadow-sm">
                            <Phone size={16} className="text-green-500 group-hover:text-white sm:w-[18px]" />
                        </div>
                        <div className="flex flex-col items-start leading-none gap-0.5 sm:gap-1">
                            <span className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest">Call Now</span>
                            <span className="text-xs sm:text-sm font-bold text-slate-700 group-hover:text-green-600 transition-colors">+91 9596418226</span>
                        </div>
                    </a>
                </motion.div>

                {/* Main Action Buttons - Fixed Responsive Size */}
                <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-row items-center gap-4 sm:gap-6"
                >
                    {reset && (
                        <button
                            onClick={() => reset()}
                            className="bg-slate-900 text-white px-7 sm:px-12 py-3 sm:py-4 rounded-full font-bold text-xs sm:text-base hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-900/10 flex items-center gap-2 sm:gap-3"
                        >
                            <RefreshCcw size={14} className="sm:w-[18px]" />
                            Reconnect
                        </button>
                    )}
                    <a
                        href="/"
                        className="bg-white text-slate-600 px-7 sm:px-12 py-3 sm:py-4 rounded-full font-bold text-xs sm:text-base hover:bg-slate-50 border border-slate-200 transition-all active:scale-95 flex items-center gap-2 sm:gap-3"
                    >
                        <Home size={14} className="sm:w-[18px]" />
                        Go Home
                    </a>
                </motion.div>
            </div>

            {/* Dev Insight */}
            {process.env.NODE_ENV === 'development' && error && (
                <div className="absolute bottom-6 right-6 opacity-0 hover:opacity-100 transition-opacity">
                    <span className="text-[10px] font-mono text-slate-400">{error.message}</span>
                </div>
            )}
        </div>
    );
}
