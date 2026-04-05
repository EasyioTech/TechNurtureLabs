"use client";

import { useEffect, useRef } from "react";
import { AlertCircle, MessageCircle, Phone, RefreshCcw, Home } from "lucide-react";
import { motion } from "framer-motion";
import DatabaseMaintenance from "./DatabaseMaintenance";

type ReporterProps = {
  /*  ⎯⎯ props are only provided on the global-error page ⎯⎯ */
  error?: Error & { digest?: string };
  reset?: () => void;
};

export default function ErrorReporter({ error, reset }: ReporterProps) {
  /* ─ instrumentation shared by every route ─ */
  const lastOverlayMsg = useRef("");
  const pollRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const isDbError = (err?: Error) => {
    if (!err) return false;
    const msg = err.message?.toLowerCase() || "";
    // Check for common DB connection error phrases
    return (
      msg.includes("database connection") ||
      msg.includes("econnrefused") ||
      msg.includes("connection timeout") ||
      msg.includes("failed to connect") ||
      msg.includes("postgres") ||
      msg.includes("drizzle")
    );
  };

  useEffect(() => {
    const inIframe = window.parent !== window;
    if (!inIframe) return;

    const send = (payload: unknown) => window.parent.postMessage(payload, "*");

    const onError = (e: ErrorEvent) =>
      send({
        type: "ERROR_CAPTURED",
        error: {
          message: e.message,
          stack: e.error?.stack,
          filename: e.filename,
          lineno: e.lineno,
          colno: e.colno,
          source: "window.onerror",
        },
        timestamp: Date.now(),
      });

    const onReject = (e: PromiseRejectionEvent) =>
      send({
        type: "ERROR_CAPTURED",
        error: {
          message: e.reason?.message ?? String(e.reason),
          stack: e.reason?.stack,
          source: "unhandledrejection",
        },
        timestamp: Date.now(),
      });

    const pollOverlay = () => {
      const overlay = document.querySelector("[data-nextjs-dialog-overlay]");
      const node =
        overlay?.querySelector(
          "h1, h2, .error-message, [data-nextjs-dialog-body]"
        ) ?? null;
      const txt = node?.textContent ?? node?.innerHTML ?? "";
      if (txt && txt !== lastOverlayMsg.current) {
        lastOverlayMsg.current = txt;
        send({
          type: "ERROR_CAPTURED",
          error: { message: txt, source: "nextjs-dev-overlay" },
          timestamp: Date.now(),
        });
      }
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onReject);
    pollRef.current = setInterval(pollOverlay, 1000);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onReject);
      pollRef.current && clearInterval(pollRef.current);
    };
  }, []);

  /* ─ extra postMessage when on the global-error route ─ */
  useEffect(() => {
    if (!error) return;
    window.parent.postMessage(
      {
        type: "global-error-reset",
        error: {
          message: error.message,
          stack: error.stack,
          digest: error.digest,
          name: error.name,
        },
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
      },
      "*"
    );
  }, [error]);

  /* ─ ordinary pages render nothing ─ */
  if (!error) return null;

  /* Detect Database Error */
  if (isDbError(error)) {
    return (
      <html>
        <body>
          <DatabaseMaintenance error={error} reset={reset} />
        </body>
      </html>
    );
  }

  /* ─ global-error UI ─ */
  return (
    <html>
      <body className="h-screen w-full bg-white flex flex-col items-center justify-center p-4 sm:p-12 overflow-hidden font-sans text-center relative">
        
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
                Restoring connection
            </p>
        </motion.div>

        {/* Massive GIF focal point */}
        <motion.div
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100, damping: 25 }}
            className="w-full max-w-[75vh] flex items-center justify-center mt-10 sm:mt-12"
        >
            <img 
                src="/early-man.gif" 
                alt="System recovery" 
                className="w-full h-auto select-none pointer-events-none p-4"
            />
        </motion.div>

        {/* Interaction Layer */}
        <div className="w-full max-w-5xl flex flex-col items-center gap-6 sm:gap-10 mt-4 sm:mt-6">
            
            {/* Action-Oriented Contact Capsule - Responsive */}
            <motion.div 
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-16 bg-slate-50/70 p-4 sm:p-5 px-8 sm:px-10 rounded-3xl sm:rounded-full border border-slate-100/50"
            >
                <a href="mailto:technurturelms@gmail.com" className="flex items-center gap-3 sm:gap-4 group transition-all">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white flex items-center justify-center border border-slate-100 group-hover:bg-rose-600 transition-all shadow-sm">
                        <MessageCircle size={16} className="text-rose-500 group-hover:text-white sm:w-[18px]" />
                    </div>
                    <div className="flex flex-col items-start leading-none gap-0.5 sm:gap-1 text-left">
                        <span className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest">Mail Us Now</span>
                        <span className="text-xs sm:text-sm font-bold text-slate-700 group-hover:text-rose-600 transition-colors">technurturelms@gmail.com</span>
                    </div>
                </a>
                
                <a href="tel:+919596418226" className="flex items-center gap-3 sm:gap-4 group transition-all">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white flex items-center justify-center border border-slate-100 group-hover:bg-green-600 transition-all shadow-sm">
                        <Phone size={16} className="text-green-500 group-hover:text-white sm:w-[18px]" />
                    </div>
                    <div className="flex flex-col items-start leading-none gap-0.5 sm:gap-1 text-left">
                        <span className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest">Call Now</span>
                        <span className="text-xs sm:text-sm font-bold text-slate-700 group-hover:text-green-600 transition-colors">+91 9596418226</span>
                    </div>
                </a>
            </motion.div>

            {/* Actions Row - Fixed Responsive Size */}
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

        {/* Background Support Label (Subtle) */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center opacity-10 pointer-events-none hidden md:flex">
            <span className="text-[10px] font-black uppercase tracking-[1em] text-slate-900">TechNurture Labs Restoration</span>
        </div>
      </body>
    </html>
  );
}
