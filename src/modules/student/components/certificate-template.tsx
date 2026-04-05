'use client';

import React, { forwardRef } from 'react';
import { format } from 'date-fns';

interface Props {
  studentName: string;
  certificateTitle: string;
  courseTitle: string;
  verificationCode: string;
  issuedDate: Date | string;
  schoolName?: string;
}

export const CertificateTemplate = forwardRef<HTMLDivElement, Props>(
  (
    {
      studentName,
      certificateTitle,
      courseTitle,
      verificationCode,
      issuedDate,
      schoolName = 'TechNurture Labs',
    },
    ref
  ) => {
    const formattedDate =
      typeof issuedDate === 'string'
        ? format(new Date(issuedDate), 'MMMM d, yyyy')
        : format(issuedDate, 'MMMM d, yyyy');

    return (
      <div
        ref={ref}
        style={{
          width: '100%',
          maxWidth: '1200px',
          aspectRatio: '16 / 9',
          margin: '0 auto',
          padding: '60px 80px',
          background: '#ffffff',
          fontFamily: 'Georgia, serif',
          border: '2px solid #1a1a1a',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        {/* HEADER */}
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: '12px',
              letterSpacing: '3px',
              textTransform: 'uppercase',
              fontFamily: 'system-ui, sans-serif',
              marginBottom: '20px',
            }}
          >
            {schoolName}
          </div>

          <h1
            style={{
              fontSize: '48px',
              margin: 0,
              letterSpacing: '2px',
              fontWeight: 500,
            }}
          >
            Certificate
          </h1>

          <div
            style={{
              fontSize: '18px',
              marginTop: '8px',
              letterSpacing: '1px',
            }}
          >
            of {certificateTitle}
          </div>

          <div
            style={{
              width: '120px',
              height: '1px',
              background: '#000',
              margin: '20px auto',
            }}
          />
        </div>

        {/* BODY */}
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: '16px',
              fontFamily: 'system-ui, sans-serif',
              marginBottom: '20px',
            }}
          >
            This certifies that
          </div>

          <div
            style={{
              fontSize: '34px',
              fontWeight: 500,
              borderBottom: '1px solid #000',
              display: 'inline-block',
              paddingBottom: '6px',
              marginBottom: '20px',
              minWidth: '300px',
            }}
          >
            {studentName}
          </div>

          <div
            style={{
              fontSize: '16px',
              fontFamily: 'system-ui, sans-serif',
              marginBottom: '10px',
            }}
          >
            has successfully completed
          </div>

          <div
            style={{
              fontSize: '22px',
              fontWeight: 500,
            }}
          >
            {courseTitle}
          </div>
        </div>

        {/* FOOTER */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            alignItems: 'end',
            marginTop: '40px',
          }}
        >
          {/* LEFT: DATE */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '14px' }}>{formattedDate}</div>
            <div
              style={{
                borderTop: '1px solid #000',
                width: '60%',
                margin: '6px auto',
              }}
            />
            <div style={{ fontSize: '12px' }}>Date</div>
          </div>

          {/* CENTER: SIGNATURE */}
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                borderTop: '1px solid #000',
                width: '60%',
                margin: '20px auto 6px',
              }}
            />
            <div style={{ fontSize: '12px' }}>Authorized Signature</div>
          </div>

          {/* RIGHT: VERIFICATION */}
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: '11px',
                fontFamily: 'monospace',
                wordBreak: 'break-all',
              }}
            >
              {verificationCode}
            </div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>
              Verification ID
            </div>
          </div>
        </div>
      </div>
    );
  }
);

CertificateTemplate.displayName = 'CertificateTemplate';
