'use client';

import React, { useRef, useEffect } from 'react';
import { MediaPlayer, MediaProvider, Poster, Track } from '@vidstack/react';
import { defaultLayoutIcons, DefaultVideoLayout } from '@vidstack/react/player/layouts/default';
import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';
import { supabase } from '@/lib/supabase';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  lessonId: string;
  userId?: string;
  onComplete?: () => void;
}

export function VideoPlayer({ src, poster, lessonId, userId, onComplete }: VideoPlayerProps) {
  const player = useRef<any>(null);
  const lastSavedPosition = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      if (player.current && !player.current.paused) {
        const currentTime = player.current.currentTime;
        // Save progress every 30 seconds or if moved significantly
        if (Math.abs(currentTime - lastSavedPosition.current) > 30) {
          saveProgress(currentTime);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [lessonId, userId]);

  const saveProgress = async (position: number) => {
    if (!userId) return;
    lastSavedPosition.current = position;
    await supabase.from('progress_tracking').upsert({
      user_id: userId,
      lesson_id: lessonId,
      last_position: position,
      status: 'locked' // Keep as locked until end
    }, { onConflict: 'user_id,lesson_id' });
  };

  const onEnded = async () => {
    if (userId) {
      await supabase.from('progress_tracking').upsert({
        user_id: userId,
        lesson_id: lessonId,
        status: 'completed',
        completed_at: new Error().stack ? new Date().toISOString() : null
      }, { onConflict: 'user_id,lesson_id' });
    }
    if (onComplete) onComplete();
  };

  return (
    <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/10">
      <MediaPlayer
        ref={player}
        title="Lesson Video"
        src={src}
        onEnded={onEnded}
        className="w-full h-full"
      >
        <MediaProvider>
          {poster && <Poster src={poster} alt="Lesson Poster" className="vds-poster" />}
        </MediaProvider>
        <DefaultVideoLayout icons={defaultLayoutIcons} />
      </MediaPlayer>
    </div>
  );
}
