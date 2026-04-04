'use client';

import React, { forwardRef } from 'react';
import { format } from 'date-fns';

let QRCode: any = null;

if (typeof window !== 'undefined') {
    try {
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
                    width: '1400px',
                    height: '750px',
                    margin: '0 auto',
                    padding: '50px 70px',
                    background: '#ffffff',
                    fontFamily: 'Georgia, serif',
                    position: 'relative',
                    overflow: 'hidden',
                    boxSizing: 'border-box',
                    border: '3px solid #2c2c2c',
                }}
            >
                {/* Top border */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: '#2c2c2c',
                        zIndex: 2,
                    }}
                />

                {/* Main content */}
                <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>

                    {/* Header */}
                    <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                        <div
                            style={{
                                fontSize: '10px',
                                fontWeight: '600',
                                letterSpacing: '4px',
                                color: '#2c2c2c',
                                textTransform: 'uppercase',
                                marginBottom: '15px',
                                fontFamily: 'system-ui, sans-serif',
                            }}
                        >
                            {schoolName}
                        </div>

                        <h1
                            style={{
                                fontSize: '42px',
                                fontWeight: '400',
                                color: '#000000',
                                margin: '0 0 8px 0',
                                letterSpacing: '3px',
                                lineHeight: '1.1',
                            }}
                        >
                            CERTIFICATE OF
                        </h1>
                        <h2
                            style={{
                                fontSize: '36px',
                                fontWeight: '400',
                                color: '#000000',
                                margin: '0 0 15px 0',
                                letterSpacing: '1px',
                            }}
                        >
                            {certificateTitle}
                        </h2>

                        <div
                            style={{
                                width: '250px',
                                height: '1px',
                                background: '#2c2c2c',
                                margin: '15px auto',
                            }}
                        />
                    </div>

                    {/* Body */}
                    <div style={{ textAlign: 'center', marginBottom: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <p
                            style={{
                                fontSize: '15px',
                                color: '#2c2c2c',
                                marginBottom: '15px',
                                fontWeight: '400',
                                fontFamily: 'system-ui, sans-serif',
                            }}
                        >
                            This is to certify that
                        </p>

                        <div
                            style={{
                                fontSize: '32px',
                                fontWeight: '400',
                                color: '#000000',
                                margin: '15px 0',
                                paddingBottom: '8px',
                                borderBottom: '2px solid #2c2c2c',
                                letterSpacing: '1px',
                            }}
                        >
                            {studentName}
                        </div>

                        <p
                            style={{
                                fontSize: '14px',
                                color: '#2c2c2c',
                                marginTop: '20px',
                                marginBottom: '8px',
                                fontWeight: '400',
                                fontFamily: 'system-ui, sans-serif',
                            }}
                        >
                            has successfully completed the course
                        </p>

                        <div
                            style={{
                                fontSize: '20px',
                                fontWeight: '400',
                                color: '#000000',
                                margin: '8px 0 20px 0',
                                letterSpacing: '0.5px',
                            }}
                        >
                            {courseTitle}
                        </div>

                        <p
                            style={{
                                fontSize: '12px',
                                color: '#555555',
                                marginTop: '15px',
                                lineHeight: '1.5',
                                fontFamily: 'system-ui, sans-serif',
                            }}
                        >
                            In recognition of academic excellence and diligent effort
                        </p>
                    </div>

                    {/* Footer */}
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-end',
                            marginTop: '20px',
                            paddingTop: '15px',
                            borderTop: '1px solid #2c2c2c',
                        }}
                    >
                        {/* Left - Date */}
                        <div style={{ flex: 1, textAlign: 'center' }}>
                            <p
                                style={{
                                    fontSize: '10px',
                                    color: '#2c2c2c',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    marginBottom: '6px',
                                    fontWeight: '400',
                                    fontFamily: 'system-ui, sans-serif',
                                }}
                            >
                                Date Awarded
                            </p>
                            <p
                                style={{
                                    fontSize: '13px',
                                    fontWeight: '400',
                                    color: '#000000',
                                    marginBottom: '10px',
                                    fontFamily: 'system-ui, sans-serif',
                                }}
                            >
                                {formattedDate}
                            </p>
                            <div style={{ height: '1px', background: '#2c2c2c', width: '50%', margin: '8px auto' }} />
                            <p
                                style={{
                                    fontSize: '9px',
                                    color: '#2c2c2c',
                                    marginTop: '6px',
                                    fontWeight: '400',
                                    textTransform: 'uppercase',
                                    fontFamily: 'system-ui, sans-serif',
                                }}
                            >
                                Authorized By
                            </p>
                        </div>

                        {/* Right - QR & Verification */}
                        <div style={{ flex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            {/* QR Code - larger and more visible */}
                            <div
                                id="qr-code-container"
                                style={{
                                    padding: '6px',
                                    background: 'white',
                                    border: '2px solid #2c2c2c',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    width: '80px',
                                    height: '80px',
                                    marginBottom: '10px',
                                }}
                            >
                                {QRCode && typeof window !== 'undefined' ? (
                                    <QRCode
                                        value={verificationCode}
                                        size={80}
                                        level="H"
                                        includeMargin={false}
                                        bgColor="#ffffff"
                                        fgColor="#000000"
                                    />
                                ) : (
                                    <div
                                        style={{
                                            fontSize: '10px',
                                            color: '#2c2c2c',
                                            fontWeight: '400',
                                        }}
                                    >
                                        QR CODE
                                    </div>
                                )}
                            </div>

                            {/* Verification Code */}
                            <div style={{ textAlign: 'center' }}>
                                <p
                                    style={{
                                        fontSize: '9px',
                                        color: '#2c2c2c',
                                        textTransform: 'uppercase',
                                        letterSpacing: '1px',
                                        marginBottom: '3px',
                                        fontWeight: '400',
                                        fontFamily: 'system-ui, sans-serif',
                                    }}
                                >
                                    Verification
                                </p>
                                <p
                                    style={{
                                        fontSize: '11px',
                                        fontWeight: '400',
                                        color: '#000000',
                                        fontFamily: 'monospace',
                                        letterSpacing: '0.5px',
                                        wordBreak: 'break-all',
                                        maxWidth: '120px',
                                    }}
                                >
                                    {verificationCode}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
);

CertificateTemplate.displayName = 'CertificateTemplate';
