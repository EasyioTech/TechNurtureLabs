'use client';

import React, { forwardRef, useEffect, useState } from 'react';
import { format } from 'date-fns';

let QRCode: any = null;

// Dynamically import QRCode only on client side
if (typeof window !== 'undefined') {
    try {
        // @ts-ignore
        QRCode = require('qrcode.react').default;
    } catch (e) {
        QRCode = null;
    }
}

interface CertificateTemplateProps {
    studentName: string;
    certificateTitle: string;
    courseTitle: string;
    verificationCode: string;
    issuedDate: Date | string;
    schoolName?: string;
}

export const CertificateTemplate = forwardRef<HTMLDivElement, CertificateTemplateProps>(
    ({ studentName, certificateTitle, courseTitle, verificationCode, issuedDate, schoolName = 'TechNurture Labs' }, ref) => {
        const formattedDate = typeof issuedDate === 'string'
            ? format(new Date(issuedDate), 'MMMM d, yyyy')
            : format(issuedDate, 'MMMM d, yyyy');

        return (
            <div
                ref={ref}
                style={{
                    width: '1200px',
                    height: '800px',
                    margin: '0 auto',
                    padding: '60px 80px',
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 50%, #f0f4ff 100%)',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    position: 'relative',
                    overflow: 'hidden',
                    boxSizing: 'border-box',
                }}
            >
                {/* Decorative background elements */}
                <div
                    style={{
                        position: 'absolute',
                        top: '-200px',
                        right: '-200px',
                        width: '600px',
                        height: '600px',
                        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)',
                        borderRadius: '50%',
                        zIndex: 0,
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        bottom: '-100px',
                        left: '-100px',
                        width: '400px',
                        height: '400px',
                        background: 'radial-gradient(circle, rgba(34, 197, 94, 0.08) 0%, transparent 70%)',
                        borderRadius: '50%',
                        zIndex: 0,
                    }}
                />

                {/* Top decorative border */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '6px',
                        background: 'linear-gradient(90deg, #6366f1 0%, #ec4899 50%, #f59e0b 100%)',
                        zIndex: 2,
                    }}
                />

                {/* Main content container */}
                <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    {/* Header section */}
                    <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                        {/* School/Organization name */}
                        <div
                            style={{
                                fontSize: '14px',
                                fontWeight: '700',
                                letterSpacing: '2px',
                                color: '#64748b',
                                textTransform: 'uppercase',
                                marginBottom: '8px',
                                textDecoration: 'underline',
                                textDecorationColor: '#6366f1',
                                textDecorationThickness: '3px',
                                textUnderlineOffset: '6px',
                            }}
                        >
                            {schoolName}
                        </div>

                        {/* Certificate title */}
                        <h1
                            style={{
                                fontSize: '56px',
                                fontWeight: '900',
                                color: '#1e293b',
                                margin: '16px 0',
                                letterSpacing: '-1px',
                                lineHeight: '1.1',
                            }}
                        >
                            Certificate of
                        </h1>
                        <h2
                            style={{
                                fontSize: '48px',
                                fontWeight: '900',
                                background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                margin: '0 0 8px 0',
                                letterSpacing: '-0.5px',
                            }}
                        >
                            {certificateTitle}
                        </h2>

                        {/* Decorative line */}
                        <div
                            style={{
                                width: '200px',
                                height: '3px',
                                background: 'linear-gradient(90deg, transparent, #6366f1, transparent)',
                                margin: '24px auto',
                            }}
                        />
                    </div>

                    {/* Main certificate content */}
                    <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                        <p
                            style={{
                                fontSize: '18px',
                                color: '#64748b',
                                marginBottom: '24px',
                                fontWeight: '500',
                            }}
                        >
                            This certificate is proudly presented to
                        </p>

                        {/* Student name */}
                        <div
                            style={{
                                fontSize: '44px',
                                fontWeight: '900',
                                color: '#1e293b',
                                margin: '24px 0',
                                paddingBottom: '12px',
                                borderBottom: '3px solid #6366f1',
                                letterSpacing: '-0.5px',
                            }}
                        >
                            {studentName}
                        </div>

                        {/* Achievement description */}
                        <p
                            style={{
                                fontSize: '18px',
                                color: '#64748b',
                                marginTop: '32px',
                                marginBottom: '12px',
                                fontWeight: '500',
                            }}
                        >
                            For successfully completing the course
                        </p>

                        {/* Course title */}
                        <div
                            style={{
                                fontSize: '24px',
                                fontWeight: '800',
                                color: '#6366f1',
                                margin: '12px 0 32px 0',
                                letterSpacing: '0.5px',
                            }}
                        >
                            {courseTitle}
                        </div>

                        <p
                            style={{
                                fontSize: '14px',
                                color: '#94a3b8',
                                marginTop: '24px',
                                lineHeight: '1.6',
                            }}
                        >
                            This certificate recognizes achievement and commitment to continuous learning
                        </p>
                    </div>

                    {/* Bottom section with date, verification code, and QR code */}
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-end',
                            marginTop: '40px',
                            paddingTop: '20px',
                            borderTop: '1px dashed #cbd5e1',
                        }}
                    >
                        {/* Left side - Date and signature area */}
                        <div style={{ flex: 1, textAlign: 'center' }}>
                            <p
                                style={{
                                    fontSize: '12px',
                                    color: '#94a3b8',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    marginBottom: '8px',
                                }}
                            >
                                Date Awarded
                            </p>
                            <p
                                style={{
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    color: '#1e293b',
                                    marginBottom: '12px',
                                }}
                            >
                                {formattedDate}
                            </p>
                            <div style={{ height: '2px', background: '#cbd5e1', width: '80%', margin: '12px auto' }} />
                            <p
                                style={{
                                    fontSize: '11px',
                                    color: '#94a3b8',
                                    marginTop: '8px',
                                    fontWeight: '600',
                                    textTransform: 'uppercase',
                                }}
                            >
                                Administrator
                            </p>
                        </div>

                        {/* Right side - Verification code and QR code */}
                        <div style={{ flex: 1, textAlign: 'center' }}>
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    gap: '20px',
                                }}
                            >
                                {/* QR Code Placeholder - will render on client side */}
                                <div
                                    id="qr-code-container"
                                    style={{
                                        padding: '8px',
                                        background: 'white',
                                        border: '2px solid #6366f1',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        width: '80px',
                                        height: '80px',
                                    }}
                                >
                                    {QRCode ? (
                                        <QRCode
                                            value={verificationCode}
                                            size={80}
                                            level="M"
                                            includeMargin={false}
                                            bgColor="#ffffff"
                                            fgColor="#6366f1"
                                        />
                                    ) : (
                                        <div
                                            style={{
                                                fontSize: '10px',
                                                color: '#6366f1',
                                                fontWeight: 'bold',
                                                textAlign: 'center',
                                            }}
                                        >
                                            QR CODE
                                        </div>
                                    )}
                                </div>

                                {/* Verification info */}
                                <div style={{ textAlign: 'left' }}>
                                    <p
                                        style={{
                                            fontSize: '11px',
                                            color: '#94a3b8',
                                            textTransform: 'uppercase',
                                            letterSpacing: '1px',
                                            marginBottom: '4px',
                                            fontWeight: '600',
                                        }}
                                    >
                                        Verification Code
                                    </p>
                                    <p
                                        style={{
                                            fontSize: '14px',
                                            fontWeight: '800',
                                            color: '#1e293b',
                                            fontFamily: 'monospace',
                                            letterSpacing: '1px',
                                        }}
                                    >
                                        {verificationCode}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
);

CertificateTemplate.displayName = 'CertificateTemplate';
