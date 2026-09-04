'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FirstTimeAgreementModal } from '@/components/FirstTimeAgreementModal';

export const GlobalAgreementGatekeeper: React.FC = () => {
  const { user, profile, loading, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!loading && user) {
      const consentKey = `routehunter_signed_legal_v2026_09_${user.id}`;
      const isSignedLocally = typeof window !== 'undefined' && localStorage.getItem(consentKey) === 'accepted';
      const isSignedDb = profile?.pdpa_consent === true;

      // If user has not signed this agreement version, force open the modal
      if (!isSignedLocally || !isSignedDb) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
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
