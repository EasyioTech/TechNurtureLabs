'use client';

import React, { useRef, useEffect } from 'react';
import { MediaPlayer, MediaProvider, Poster } from '@vidstack/react';
import { defaultLayoutIcons, DefaultVideoLayout } from '@vidstack/react/player/layouts/default';
import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';
import { saveVideoProgress, markLessonComplete } from '@/modules/learning/actions';

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
    try {
      await saveVideoProgress(lessonId, position);
    } catch (err) {
      console.error(err);
    }
  };

  const onEnded = async () => {
    if (userId) {
      try {
        await markLessonComplete(lessonId);
      } catch (err) {
        console.error(err);
      }
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
