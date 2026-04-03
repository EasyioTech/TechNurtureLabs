import { z } from 'zod';

/**
 * Password validation regex (for admin/school accounts):
 * - At least one uppercase letter
 * - At least one number
 * - At least one special character
 */
export const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()\-_=+\[\]{};:'",.<>/?\\|`~])/;

export const strongPasswordSchema = z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters')
    .refine(
        (p) => PASSWORD_REGEX.test(p),
        'Password must include uppercase letter, number, and special character'
    );

/**
 * Student PIN validation: Simple 6-digit numeric PIN for easy memorization
 * Students don't need complex passwords - a 6-digit PIN is sufficient
 */
export const studentPINSchema = z
    .string()
    .regex(/^\d{6}$/, 'PIN must be exactly 6 digits');

/**
 * Student registration accepts email OR phone number
 * Password is a simple 6-digit PIN (not complex password)
 */
export const registerStudentSchema = z.object({
    email: z.string()
        .min(1, 'Email or phone number is required')
        .max(254, 'Input too long')
        // Accept email format OR phone number
        .refine(
            (val) => {
                const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
                const digitsOnly = val.replace(/\D/g, '');
                const isPhone = !isEmail && digitsOnly.length >= 7 && digitsOnly.length <= 15;
                return isEmail || isPhone;
            },
            'Please enter a valid email address or phone number (7-15 digits)'
        ),
    password: studentPINSchema, // 6-digit PIN, not complex password
    full_name: z.string().min(1, 'Name is required').max(100),
    school_id: z.string().uuid('Invalid school ID'),
    class_id: z.string().uuid('Invalid class ID').optional(),
    grade: z.string().optional(),
    gender: z.string().optional(),
});

export type RegisterStudentInput = z.infer<typeof registerStudentSchema>;
