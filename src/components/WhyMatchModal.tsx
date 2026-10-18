import React from 'react';
import type { RoommateProfile, CompatibilityReport } from '../types';
import { RoommateProfileModal } from './RoommateProfileModal';

interface WhyMatchModalProps {
  roommate: RoommateProfile | null;
  report: CompatibilityReport | null;
  onClose: () => void;
  onConnect?: (roommate: RoommateProfile) => void;
  initialTab?: 'profile' | 'compatibility';
}

export const WhyMatchModal: React.FC<WhyMatchModalProps> = ({
  roommate,
  report,
  onClose,
  onConnect,
  initialTab = 'profile'
}) => {
  return (
    <RoommateProfileModal
      roommate={roommate}
      report={report}
      onClose={onClose}
      onConnect={onConnect}
      initialTab={initialTab}
    />
  );
};
