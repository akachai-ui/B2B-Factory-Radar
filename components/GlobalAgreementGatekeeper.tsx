'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FirstTimeAgreementModal } from '@/components/FirstTimeAgreementModal';

export const GlobalAgreementGatekeeper: React.FC = () => {
  const { user, profile, loading, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!loading && user) {
      // Check if user has already accepted the official agreement
      const consent = typeof window !== 'undefined' ? localStorage.getItem('routehunter_pdpa_consent_v1') : null;
      if (consent !== 'accepted') {
        setIsOpen(true);
      }
    } else {
      setIsOpen(false);
    }
  }, [loading, user, profile]);

  if (!isOpen || !user) return null;

  return (
    <FirstTimeAgreementModal
      isOpen={isOpen}
      onAccepted={() => setIsOpen(false)}
      onDeclined={async () => {
        setIsOpen(false);
        await signOut();
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
      }}
    />
  );
};
