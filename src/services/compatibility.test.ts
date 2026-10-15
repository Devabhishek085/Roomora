import { describe, it, expect } from 'vitest';
import { calculateCompatibility, DEMO_ROOMMATES } from './compatibility';
import type { UserOnboardingProfile } from '../types';

const mockUser: UserOnboardingProfile = {
  name: 'Test Student',
  age: 21,
  gender: 'Male',
  occupation: 'College Student',
  institution: 'Delhi University',
  city: 'New Delhi',
  budgetMin: 6000,
  budgetMax: 12000,
  moveInDate: '2026-11-01',
  accommodationType: 'PG',
  sharingPreference: 'Twin Sharing',
  sleepSchedule: 'Night Owl',
  cleanliness: 4,
  foodPreference: 'Vegetarian',
  smokingDrinking: 'Never',
  noiseTolerance: 'Moderate',
  guestPolicy: 'Weekends Only',
  privacyNeeds: 'Moderate',
  bio: 'Test user bio',
  weights: {
    sleepWeight: 5,
    cleanlinessWeight: 5,
    foodWeight: 3,
    guestWeight: 3,
    noiseWeight: 4,
    habitsWeight: 5
  },
  strictBudget: true,
  strictMoveInDate: false,
  strictGenderPolicy: true,
  showBudgetPublicly: true,
  showSleepSchedulePublicly: true,
  showContactPublicly: false
};

describe('Compatibility Engine', () => {
  it('should give high compatibility score for identical lifestyle profiles', () => {
    const rohan = DEMO_ROOMMATES.find((r) => r.id === 'rm-1')!;
    const result = calculateCompatibility(mockUser, rohan);

    expect(result.score).toBeGreaterThanOrEqual(85);
    expect(result.hardConstraintPassed).toBe(true);
    expect(result.categoryBreakdown.length).toBe(6);
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it('should flag hard constraint violation and cap score when budgets do not overlap and strictBudget is true', () => {
    const highBudgetRoommate = {
      ...DEMO_ROOMMATES[0],
      budgetMin: 25000,
      budgetMax: 35000
    };

    const result = calculateCompatibility(mockUser, highBudgetRoommate);
    expect(result.hardConstraintPassed).toBe(false);
    expect(result.hardConstraintReason).toContain('Budget mismatch');
    expect(result.score).toBeLessThanOrEqual(45);
  });

  it('should compute deterministic scores across all demo roommates without NaN', () => {
    for (const rm of DEMO_ROOMMATES) {
      const res = calculateCompatibility(mockUser, rm);
      expect(Number.isInteger(res.score)).toBe(true);
      expect(res.score).toBeGreaterThanOrEqual(0);
      expect(res.score).toBeLessThanOrEqual(100);
      expect(res.summaryText).toBeDefined();
    }
  });

  it('should properly penalize conflicting sleep habits (Night Owl vs Early Bird)', () => {
    const earlyBirdUser: UserOnboardingProfile = {
      ...mockUser,
      sleepSchedule: 'Early Bird'
    };
    const nightOwlRoommate = {
      ...DEMO_ROOMMATES[0],
      sleepSchedule: 'Night Owl' as const
    };

    const result = calculateCompatibility(earlyBirdUser, nightOwlRoommate);
    const sleepBreakdown = result.categoryBreakdown.find((c) => c.category === 'sleep');
    expect(sleepBreakdown?.matchPercentage).toBe(35);
  });
});
