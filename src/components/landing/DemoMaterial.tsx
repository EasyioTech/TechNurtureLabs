'use client';

import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform, useMotionValue } from 'framer-motion';
import { Play, Pause, Youtube, Video } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { CloudflareStreamPlayer } from '../video/cloudflare-stream-player';

const CustomVideoPlayer = ({ src, type }: { src: string, type: string }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const togglePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    if (type === 'stream') {
        const uid = src.replace('cf-stream://', '');
        return (
            <div className="absolute inset-0">
                <CloudflareStreamPlayer uid={uid} />
            </div>
        );
    }

    if (type === 'youtube') {
        let videoId = src;
        if (src.includes('v=')) {
            videoId = src.split('v=')[1].split('&')[0];
        } else if (src.includes('youtu.be/')) {
            videoId = src.split('youtu.be/')[1].split('?')[0];
        }
        return (
            <iframe
                src={`https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1`}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
            />
        );
    }

    if (type === 'vimeo') {
        const videoId = src.split('/').pop();
        return (
            <iframe
                src={`https://player.vimeo.com/video/${videoId}`}
                className="absolute inset-0 w-full h-full"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
            />
        );
    }

    return (
        <div className="absolute inset-0 group bg-black cursor-pointer overflow-hidden" onClick={togglePlay}>
            <video
                ref={videoRef}
                src={src}
                className={`w-full h-full object-cover absolute top-0 left-0 transition-all duration-700 ${!isPlaying ? 'blur-md scale-105 brightness-90' : 'blur-none scale-100 brightness-100'}`}
                playsInline
                loop
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
            />

            {/* Play/Pause Overlay */}
            <div className={`absolute inset-0 bg-black/10 flex items-center justify-center transition-all duration-300 ${isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
                <div className={`bg-white/20 backdrop-blur-xl rounded-full p-0 text-white transform transition-all hover:scale-110 hover:bg-white/30 border border-white/20 shadow-2xl flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20`}>
                    {isPlaying ? <Pause className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 opacity-90 fill-current" /> : <Play className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 opacity-90 ml-1 sm:ml-1.5 md:ml-2 fill-current" />}
                </div>
            </div>
        </div>
    );
};

export const DemoMaterial = () => {
    const isMobile = useIsMobile();
    const containerRef = useRef<HTMLDivElement>(null);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    // Transforms for desktop only - Animating through the 200vh height
    const scaleTransform = useTransform(scrollYProgress, [0, 0.8], [0.8, 1.2]);
    const glowOpacityTransform = useTransform(scrollYProgress, [0, 0.5], [0, 0.4]);
    const textOpacityTransform = useTransform(scrollYProgress, [0, 0.4], [1, 0]);
    const textYTransform = useTransform(scrollYProgress, [0, 0.4], [0, -40]);

    // Apply values based on device
    const scale = isMobile ? 1 : scaleTransform;
    const glowOpacity = isMobile ? 0.2 : glowOpacityTransform;
    const textOpacity = isMobile ? 1 : textOpacityTransform;
    const textY = isMobile ? 0 : textYTransform;

    const [videoUrl, setVideoUrl] = React.useState('');
    const [videoType, setVideoType] = React.useState('youtube');
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        fetch('/api/admin/settings')
            .then(res => res.json())
            .then(data => {
                if (data.settings?.hero_video_url) {
                    setVideoUrl(data.settings.hero_video_url);
                    setVideoType(data.settings.hero_video_type || 'youtube');
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    return (
        <section ref={containerRef} id="demo" className={`relative z-10 bg-slate-50 ${isMobile ? 'h-auto py-20 overflow-hidden' : 'h-[250vh]'}`}>
            <div className={`${isMobile ? 'relative w-full flex flex-col items-center' : 'sticky top-0 h-screen w-full flex flex-col items-center justify-center overflow-hidden'} px-6`}>

                {/* Subdued Grid Background */}
                <div className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #000 1px, transparent 0)', backgroundSize: '40px 40px' }}
                />

                <motion.div
                    style={{ opacity: textOpacity, y: textY }}
                    className="text-center absolute top-[5%] md:top-[8%] left-0 right-0 z-20 px-4"
                >
                    <span className="text-sm font-bold text-blue-600 uppercase tracking-widest bg-blue-50 py-2.5 px-6 rounded-full inline-block mb-8">
                        Video Demonstration
                    </span>
                    <h2 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-tight">
                        Experience the <span className="text-blue-600">Future</span>
                    </h2>
                </motion.div>

                <motion.div
                    style={isMobile ? {} : { scale }}
                    className="relative w-full max-w-5xl mx-auto origin-center z-10 mt-8 md:mt-24 group cursor-pointer"
                >
                    {/* Dynamic Halo Glow behind the video */}
                    <motion.div
                        style={{ opacity: glowOpacity }}
                        className="absolute -inset-20 bg-blue-300/15 rounded-full blur-[120px] pointer-events-none"
                    />

                    {/* Premium Apple-style Glass Border (Fade White) */}
                    <div className="relative bg-white/40 p-1 md:p-2 rounded-[2.5rem] md:rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] ring-1 ring-white/60 backdrop-blur-xl z-20">
                        {/* Inner Video Container */}
                        <div className="relative rounded-[2.2rem] md:rounded-[3.2rem] overflow-hidden aspect-video bg-black shadow-2xl">
                            {videoUrl ? (
                                <CustomVideoPlayer src={videoUrl} type={videoType} />
                            ) : (
                                <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-slate-500 gap-4">
                                     <Video className="w-12 h-12 opacity-20 animate-pulse" />
                                     <span className="text-xs font-bold uppercase tracking-widest opacity-40">Loading Platform Hero Video</span>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};
