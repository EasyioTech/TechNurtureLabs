'use client';

import React from 'react';
import { StudentCertificate } from '@/modules/student/actions/certificate-actions';
import { CertificateCard } from './certificate-card';
import { motion } from 'framer-motion';

interface CertificatesClientProps {
  certificates: StudentCertificate[];
}

export function CertificatesClient({ certificates }: CertificatesClientProps) {
  const containerVariants: any = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: 'easeOut' },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
    >
      {certificates.map((certificate) => (
        <motion.div key={certificate.id} variants={itemVariants}>
          <CertificateCard certificate={certificate} />
        </motion.div>
      ))}
    </motion.div>
  );
}
