export type Course = {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    totalLessons: number;
    completedLessons: number;
    class?: number | null;
    all_classes?: boolean;
};

export type UserProfile = {
    id: string;
    full_name: string;
    email: string;
    className: string | null;
    total_xp: number;
    level: number;
    current_streak: number;
    total_lessons_completed: number;
    total_learning_time_minutes: number;
    longest_streak: number;
};

export type DailyChallenge = {
    id: string;
    title: string;
    challenge_type: string;
    target_value: number;
    xp_reward: number;
    icon: string;
    current_progress: number;
    is_completed: boolean;
};

export type Achievement = {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    unlocked: boolean;
    unlocked_at?: string;
};

export type Lesson = {
    id: string;
    title: string;
    description: string | null;
    content_type: 'video' | 'ppt' | 'pdf' | 'quiz' | 'image' | 'assignment';
    content_url: string | null;
    content_items?: string | null;
    asset_id?: string | null;
    duration: number;
    xp_reward: number;
    course_id: string;
    sequence_index: number;
    quiz_data?: QuizData | null;
    status?: 'locked' | 'available' | 'completed';
    user_progress?: {
      last_position_secs: number;
      progress_pct: number;
      completed_at: any;
      verified_watch_seconds?: number;
    } | null;
};

export type Question = {
    id: string;
    text: string;
    question_type: string;
    options: { id: string; option_text: string; }[];
    points: number;
    time_limit_secs: number | null;
    correct_answer?: any;
    explanation?: string;
};

export type QuizData = {
    quiz: {
      id: string;
      title: string;
      time_limit_secs: number | null;
      pass_percentage: number;
      max_attempts: number;
      xp_reward: number;
      is_locked?: boolean;
      lock_reason?: string;
      question_count?: number;
    };
    questions: Question[];
};
