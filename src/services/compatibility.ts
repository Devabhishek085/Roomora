import type { 
  UserOnboardingProfile, 
  RoommateProfile, 
  CompatibilityReport,
  SleepSchedule,
  FoodPreference,
  SmokingDrinking,
  NoiseTolerance,
  GuestPolicy
} from '../types';

/**
 * Calculates deterministic compatibility score between current user and a candidate roommate.
 * Uses explainable weighted category matching without arbitrary random numbers or discriminatory proxies.
 */
export function calculateCompatibility(
  user: UserOnboardingProfile,
  candidate: RoommateProfile
): CompatibilityReport {
  // 1. Hard Constraints Check
  let hardConstraintPassed = true;
  let hardConstraintReason: string | undefined = undefined;

  // Budget Hard Constraint Check
  const budgetOverlap = Math.max(0, Math.min(user.budgetMax, candidate.budgetMax) - Math.max(user.budgetMin, candidate.budgetMin));
  if (user.strictBudget && budgetOverlap === 0) {
    hardConstraintPassed = false;
    hardConstraintReason = `Budget mismatch: Your range (₹${user.budgetMin.toLocaleString()} - ₹${user.budgetMax.toLocaleString()}) does not overlap with ${candidate.name}'s range (₹${candidate.budgetMin.toLocaleString()} - ₹${candidate.budgetMax.toLocaleString()}).`;
  }

  // 2. Category Scoring (0 to 100)
  
  // Sleep Schedule Match
  const sleepScore = getSleepScore(user.sleepSchedule, candidate.sleepSchedule);
  const sleepExplanation = getSleepExplanation(user.sleepSchedule, candidate.sleepSchedule);

  // Cleanliness Match
  const cleanlinessDiff = Math.abs(user.cleanliness - candidate.cleanliness);
  let cleanlinessScore = 100;
  if (cleanlinessDiff === 1) cleanlinessScore = 80;
  else if (cleanlinessDiff === 2) cleanlinessScore = 55;
  else if (cleanlinessDiff >= 3) cleanlinessScore = 25;
  const cleanlinessExplanation =
    cleanlinessDiff === 0
      ? 'Identical tidiness standards (Level ' + user.cleanliness + '/5).'
      : cleanlinessDiff === 1
      ? 'Very close tidiness habits; easy to align.'
      : 'Noticeable difference in cleanliness expectations; agree on chores early.';

  // Food Preference Match
  const foodScore = getFoodScore(user.foodPreference, candidate.foodPreference);
  const foodExplanation =
    user.foodPreference === candidate.foodPreference
      ? `Both follow a ${user.foodPreference} diet; simple kitchen sharing.`
      : `${user.name} is ${user.foodPreference} while ${candidate.name} is ${candidate.foodPreference}.`;

  // Habits (Smoking / Drinking) Match
  const habitsScore = getHabitsScore(user.smokingDrinking, candidate.smokingDrinking);
  const habitsExplanation =
    user.smokingDrinking === candidate.smokingDrinking
      ? `Both share "${user.smokingDrinking}" preference for smoking/alcohol.`
      : `Substance preference: ${user.smokingDrinking} vs ${candidate.smokingDrinking}. Clarify house boundaries.`;

  // Noise Tolerance Match
  const noiseScore = getNoiseScore(user.noiseTolerance, candidate.noiseTolerance);
  const noiseExplanation =
    user.noiseTolerance === candidate.noiseTolerance
      ? `Both prefer a ${user.noiseTolerance.toLowerCase()} study environment.`
      : `Sound tolerance: ${user.noiseTolerance} vs ${candidate.noiseTolerance}.`;

  // Guest Policy Match
  const guestScore = getGuestScore(user.guestPolicy, candidate.guestPolicy);
  const guestExplanation =
    user.guestPolicy === candidate.guestPolicy
      ? `Agreed guest policy: ${user.guestPolicy}.`
      : `Guest policy difference: ${user.guestPolicy} vs ${candidate.guestPolicy}. Discuss visitor hours before moving in.`;

  // 3. Apply User Weights
  const weights = user.weights || {
    sleepWeight: 4,
    cleanlinessWeight: 5,
    foodWeight: 3,
    guestWeight: 3,
    noiseWeight: 4,
    habitsWeight: 5
  };

  const categories = [
    {
      category: 'sleep',
      label: 'Sleep Schedule',
      score: sleepScore,
      weight: weights.sleepWeight || 4,
      explanation: sleepExplanation
    },
    {
      category: 'cleanliness',
      label: 'Cleanliness & Chores',
      score: cleanlinessScore,
      weight: weights.cleanlinessWeight || 5,
      explanation: cleanlinessExplanation
    },
    {
      category: 'food',
      label: 'Diet & Kitchen',
      score: foodScore,
      weight: weights.foodWeight || 3,
      explanation: foodExplanation
    },
    {
      category: 'habits',
      label: 'Smoking & Substances',
      score: habitsScore,
      weight: weights.habitsWeight || 5,
      explanation: habitsExplanation
    },
    {
      category: 'noise',
      label: 'Noise & Focus Level',
      score: noiseScore,
      weight: weights.noiseWeight || 4,
      explanation: noiseExplanation
    },
    {
      category: 'guest',
      label: 'Visitors & Guest Policy',
      score: guestScore,
      weight: weights.guestWeight || 3,
      explanation: guestExplanation
    }
  ];

  let weightedSum = 0;
  let totalWeights = 0;

  categories.forEach((cat) => {
    weightedSum += cat.score * cat.weight;
    totalWeights += cat.weight;
  });

  let rawFinalScore = Math.round(weightedSum / (totalWeights || 1));

  // If hard constraint failed, cap score at 45 to clearly reflect mismatch
  if (!hardConstraintPassed) {
    rawFinalScore = Math.min(rawFinalScore, 42);
  }

  // Identify strengths (>= 80%) & considerations (<= 65%)
  const strengths: string[] = [];
  const considerations: string[] = [];

  categories.forEach((cat) => {
    if (cat.score >= 80) {
      strengths.push(`${cat.label}: ${cat.explanation}`);
    } else if (cat.score <= 65) {
      considerations.push(`${cat.label}: ${cat.explanation}`);
    }
  });

  const categoryBreakdown = categories.map((c) => ({
    category: c.category,
    label: c.label,
    matchPercentage: c.score,
    explanation: c.explanation
  }));

  const summaryText =
    rawFinalScore >= 85
      ? `Outstanding alignment! You and ${candidate.name} share circadian rhythms and living standards.`
      : rawFinalScore >= 70
      ? `Strong potential match with minor lifestyle nuances to discuss.`
      : rawFinalScore >= 50
      ? `Moderate match. You have differing preferences in key areas; align expectations before signing a lease.`
      : `Low compatibility. Significant lifestyle conflicts identified.`;

  return {
    score: rawFinalScore,
    hardConstraintPassed,
    hardConstraintReason,
    strengths,
    considerations,
    categoryBreakdown,
    summaryText
  };
}

function getSleepScore(a: SleepSchedule, b: SleepSchedule): number {
  if (a === b) return 100;
  if (a === 'Flexible' || b === 'Flexible') return 85;
  return 35; // Night Owl vs Early Bird
}

function getSleepExplanation(a: SleepSchedule, b: SleepSchedule): string {
  if (a === b) return `Both are ${a}s; synchronized lights-out and wake routines.`;
  if (a === 'Flexible' || b === 'Flexible') return `One is flexible; easy adaptation to study hours.`;
  return `Opposing schedules (${a} vs ${b}); discuss separate study lamps & quiet hours.`;
}

function getFoodScore(a: FoodPreference, b: FoodPreference): number {
  if (a === b) return 100;
  if ((a === 'Vegetarian' && b === 'Eggetarian') || (a === 'Eggetarian' && b === 'Vegetarian')) return 85;
  if ((a === 'Vegetarian' && b === 'Vegan') || (a === 'Vegan' && b === 'Vegetarian')) return 90;
  if (a === 'Non-Vegetarian' || b === 'Non-Vegetarian') return 65;
  return 70;
}

function getHabitsScore(a: SmokingDrinking, b: SmokingDrinking): number {
  if (a === b) return 100;
  if (a === 'Never' && b === 'Fine') return 25;
  if (a === 'Fine' && b === 'Never') return 25;
  if (a === 'Never' && b === 'Occasionally') return 65;
  if (a === 'Occasionally' && b === 'Never') return 65;
  return 85;
}

function getNoiseScore(a: NoiseTolerance, b: NoiseTolerance): number {
  if (a === b) return 100;
  if ((a === 'Low/Quiet' && b === 'High/Lively') || (a === 'High/Lively' && b === 'Low/Quiet')) return 30;
  return 75;
}

function getGuestScore(a: GuestPolicy, b: GuestPolicy): number {
  if (a === b) return 100;
  if ((a === 'Rarely' && b === 'Flexible') || (a === 'Flexible' && b === 'Rarely')) return 40;
  return 80;
}

/**
 * 20 realistic seeded demo roommate profiles across student & tech professional demographics.
 */
export const DEMO_ROOMMATES: RoommateProfile[] = [
  {
    id: 'rm-1',
    name: 'Rohan Verma',
    age: 21,
    gender: 'Male',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
    occupation: 'Computer Science Student',
    institution: 'Delhi University (CIC)',
    city: 'New Delhi',
    targetLocalities: ['North Campus', 'Kamla Nagar', 'Hudson Lane'],
    budgetMin: 7000,
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
    hobbies: ['Web3', 'Competitive Coding', 'Chess', 'Badminton'],
    bio: 'Third-year CS student. Building full-stack projects, loves chai breaks, neat and very respectful of sleep hours.',
    isVerifiedDemo: true,
    socialBadge: 'Open Source Contributor'
  },
  {
    id: 'rm-2',
    name: 'Ananya Deshmukh',
    age: 22,
    gender: 'Female',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    occupation: 'AI / ML Intern',
    institution: 'NSUT Delhi',
    city: 'New Delhi',
    targetLocalities: ['Dwarka', 'Janakpuri', 'Rohini'],
    budgetMin: 8000,
    budgetMax: 14000,
    moveInDate: '2026-11-05',
    accommodationType: 'Flat',
    sharingPreference: 'Single Room',
    sleepSchedule: 'Flexible',
    cleanliness: 5,
    foodPreference: 'Vegetarian',
    smokingDrinking: 'Never',
    noiseTolerance: 'Low/Quiet',
    guestPolicy: 'Rarely',
    privacyNeeds: 'High',
    hobbies: ['Python', 'Painting', 'Yoga', 'Podcasts'],
    bio: 'Final year IT student interning remotely in AI. Need quiet study environment, keep things spotless, and love peaceful vibes.',
    isVerifiedDemo: true,
    socialBadge: 'Dean’s Honor List'
  },
  {
    id: 'rm-3',
    name: 'Kabir Singhania',
    age: 23,
    gender: 'Male',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    occupation: 'Frontend Developer',
    institution: 'Tech Startup (Remote)',
    city: 'Bengaluru / Delhi NCR',
    targetLocalities: ['Koramangala', 'HSR Layout', 'Noida Sec 62'],
    budgetMin: 10000,
    budgetMax: 18000,
    moveInDate: '2026-11-10',
    accommodationType: 'Flat',
    sharingPreference: 'Twin Sharing',
    sleepSchedule: 'Night Owl',
    cleanliness: 4,
    foodPreference: 'Eggetarian',
    smokingDrinking: 'Occasionally',
    noiseTolerance: 'Moderate',
    guestPolicy: 'Weekends Only',
    privacyNeeds: 'Moderate',
    hobbies: ['React', 'Gaming (Valorant)', 'Gym', 'Coffee Brewing'],
    bio: 'Remote frontend dev. Looking for a flatmate who enjoys gaming and deep tech chats. Split Wi-Fi and cook healthy dinners.',
    isVerifiedDemo: true,
    socialBadge: 'GitHub Open Source Contributor'
  },
  {
    id: 'rm-4',
    name: 'Priya Nambiar',
    age: 21,
    gender: 'Female',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    occupation: 'Electronics Engineering Student',
    institution: 'NSUT Delhi',
    city: 'New Delhi',
    targetLocalities: ['Dwarka Sector 3', 'Janakpuri', 'Rajouri Garden'],
    budgetMin: 7000,
    budgetMax: 12000,
    moveInDate: '2026-11-01',
    accommodationType: 'PG',
    sharingPreference: 'Twin Sharing',
    sleepSchedule: 'Early Bird',
    cleanliness: 5,
    foodPreference: 'Vegetarian',
    smokingDrinking: 'Never',
    noiseTolerance: 'Low/Quiet',
    guestPolicy: 'Rarely',
    privacyNeeds: 'Moderate',
    hobbies: ['Robotics', 'Classical Music', 'Reading', 'Gardening'],
    bio: 'ECE junior who loves a peaceful morning. Sleep early, up at 6 AM, extremely disciplined with chores and study desk.',
    isVerifiedDemo: true,
    socialBadge: 'IEEE Student Lead'
  },
  {
    id: 'rm-5',
    name: 'Devansh Tandon',
    age: 22,
    gender: 'Male',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    occupation: 'Mechanical Engineering Senior',
    institution: 'DTU Delhi',
    city: 'New Delhi',
    targetLocalities: ['Rohini Sector 16', 'Pitampura', 'Bawana'],
    budgetMin: 6000,
    budgetMax: 9500,
    moveInDate: '2026-11-15',
    accommodationType: 'PG',
    sharingPreference: 'Twin Sharing',
    sleepSchedule: 'Night Owl',
    cleanliness: 3,
    foodPreference: 'Non-Vegetarian',
    smokingDrinking: 'Never',
    noiseTolerance: 'High/Lively',
    guestPolicy: 'Flexible',
    privacyNeeds: 'Low',
    hobbies: ['Automotive CAD', 'Formula Student', 'Cricket', 'Guitar'],
    bio: 'Spends half my day in the college workshop. Easygoing, fun to hang around with, looking for budget-friendly PG near campus.',
    isVerifiedDemo: true,
    socialBadge: 'Team Captain (BAJA SAE)'
  },
  {
    id: 'rm-6',
    name: 'Sanya Kapoor',
    age: 23,
    gender: 'Female',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    occupation: 'Product Designer (UI/UX)',
    institution: 'Design Agency (Gurugram)',
    city: 'Delhi NCR',
    targetLocalities: ['Cyber City', 'Golf Course Road', 'Sector 43'],
    budgetMin: 12000,
    budgetMax: 22000,
    moveInDate: '2026-11-01',
    accommodationType: 'Flat',
    sharingPreference: 'Single Room',
    sleepSchedule: 'Flexible',
    cleanliness: 5,
    foodPreference: 'Vegan',
    smokingDrinking: 'Occasionally',
    noiseTolerance: 'Low/Quiet',
    guestPolicy: 'Weekends Only',
    privacyNeeds: 'High',
    hobbies: ['Typography', 'Specialty Coffee', 'Pilates', 'Art Galleries'],
    bio: 'Product designer obsessed with sleek aesthetics and plants. Looking for a neat flatmate to share a sunlit 2BHK.',
    isVerifiedDemo: true,
    socialBadge: 'Awwwards Jury Member'
  },
  {
    id: 'rm-7',
    name: 'Ayush Mehra',
    age: 20,
    gender: 'Male',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
    occupation: 'Data Science Sophomore',
    institution: 'IP University (USICT)',
    city: 'New Delhi',
    targetLocalities: ['Dwarka Sector 14', 'Janakpuri', 'Uttam Nagar East'],
    budgetMin: 5500,
    budgetMax: 9000,
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
    hobbies: ['Machine Learning', 'Kaggle', 'Anime', 'Table Tennis'],
    bio: 'Sophomore aiming for data analytics hackathons. Need a calm study buddy who respects quiet night hours.',
    isVerifiedDemo: true,
    socialBadge: 'Kaggle Notebooks Master'
  },
  {
    id: 'rm-8',
    name: 'Meera Iyer',
    age: 22,
    gender: 'Female',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    occupation: 'Fintech Analyst',
    institution: 'Koramangala Financial Corp',
    city: 'Bengaluru',
    targetLocalities: ['Koramangala', 'Indiranagar', 'BTM Layout'],
    budgetMin: 14000,
    budgetMax: 24000,
    moveInDate: '2026-11-10',
    accommodationType: 'Flat',
    sharingPreference: 'Single Room',
    sleepSchedule: 'Early Bird',
    cleanliness: 5,
    foodPreference: 'Vegetarian',
    smokingDrinking: 'Never',
    noiseTolerance: 'Low/Quiet',
    guestPolicy: 'Rarely',
    privacyNeeds: 'High',
    hobbies: ['Stocks', 'Morning Runs', 'South Indian Cooking', 'Carnatic Vocals'],
    bio: 'Disciplined lifestyle, early riser, love home-cooked food. Seeking a respectful professional roommate.',
    isVerifiedDemo: true,
    socialBadge: 'Chartered Financial Candidate'
  },
  {
    id: 'rm-9',
    name: 'Tanmay Bhattacharya',
    age: 21,
    gender: 'Male',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    occupation: 'Cybersecurity Enthusiast',
    institution: 'Null Pointer Collective',
    city: 'Ghaziabad',
    targetLocalities: ['Muradnagar', 'Govindpuram', 'Kavi Nagar'],
    budgetMin: 6500,
    budgetMax: 10500,
    moveInDate: '2026-11-01',
    accommodationType: 'PG',
    sharingPreference: 'Twin Sharing',
    sleepSchedule: 'Night Owl',
    cleanliness: 4,
    foodPreference: 'Non-Vegetarian',
    smokingDrinking: 'Never',
    noiseTolerance: 'Moderate',
    guestPolicy: 'Weekends Only',
    privacyNeeds: 'Moderate',
    hobbies: ['CTF Challenges', 'Linux Customization', 'Cyber Law', 'Sci-Fi'],
    bio: 'CTF player who stays up late debugging network packets. Very hygienic, zero drama, reliable rent payer.',
    isVerifiedDemo: true,
    socialBadge: 'Bug Bounty Researcher'
  },
  {
    id: 'rm-10',
    name: 'Ishaan Chopra',
    age: 24,
    gender: 'Male',
    avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80',
    occupation: 'Cloud Infrastructure Engineer',
    institution: 'Cloud Native Labs',
    city: 'Noida / Delhi NCR',
    targetLocalities: ['Sector 62', 'Sector 18', 'Indirapuram'],
    budgetMin: 11000,
    budgetMax: 19000,
    moveInDate: '2026-11-15',
    accommodationType: 'Flat',
    sharingPreference: 'Single Room',
    sleepSchedule: 'Flexible',
    cleanliness: 4,
    foodPreference: 'Eggetarian',
    smokingDrinking: 'Occasionally',
    noiseTolerance: 'Moderate',
    guestPolicy: 'Weekends Only',
    privacyNeeds: 'Moderate',
    hobbies: ['Kubernetes', 'Biking', 'Cooking Pasta', 'Guitar'],
    bio: 'Working with AWS/Terraform. Looking for a modern 2BHK flatmate to share chores and chill on weekends.',
    isVerifiedDemo: true,
    socialBadge: 'AWS Certified Pro'
  },
  {
    id: 'rm-11',
    name: 'Sneha Rastogi',
    age: 21,
    gender: 'Female',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    occupation: 'Pharmacy / Biotech Researcher',
    institution: 'Banasthali Vidyapith',
    city: 'Jaipur / Noida',
    targetLocalities: ['Noida Sector 18', 'Vaishali', 'Indirapuram'],
    budgetMin: 6000,
    budgetMax: 10000,
    moveInDate: '2026-11-01',
    accommodationType: 'PG',
    sharingPreference: 'Twin Sharing',
    sleepSchedule: 'Early Bird',
    cleanliness: 5,
    foodPreference: 'Vegetarian',
    smokingDrinking: 'Never',
    noiseTolerance: 'Low/Quiet',
    guestPolicy: 'Rarely',
    privacyNeeds: 'Moderate',
    hobbies: ['Botanical Sciences', 'Baking', 'Badminton', 'Reading'],
    bio: 'B.Pharm student. Extremely neat, focused on research, looking for a friendly female flatmate near campus.',
    isVerifiedDemo: true,
    socialBadge: 'Research Merit Scholarship'
  },
  {
    id: 'rm-12',
    name: 'Karthik Raman',
    age: 22,
    gender: 'Male',
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80',
    occupation: 'Fullstack Dev Intern',
    institution: 'Hinjewadi Tech Hub',
    city: 'Pune',
    targetLocalities: ['Hinjewadi Phase 1', 'Wakad', 'Baner'],
    budgetMin: 9000,
    budgetMax: 15000,
    moveInDate: '2026-11-01',
    accommodationType: 'Flat',
    sharingPreference: 'Twin Sharing',
    sleepSchedule: 'Night Owl',
    cleanliness: 4,
    foodPreference: 'Non-Vegetarian',
    smokingDrinking: 'Never',
    noiseTolerance: 'Moderate',
    guestPolicy: 'Weekends Only',
    privacyNeeds: 'Moderate',
    hobbies: ['Node.js', 'Badminton', 'Trekking (Sahyadris)', 'Podcasts'],
    bio: 'Intern in Hinjewadi. Love morning treks on weekends and building side projects during the week.',
    isVerifiedDemo: true,
    socialBadge: 'Pune Tech Community Volunteer'
  },
  {
    id: 'rm-13',
    name: 'Zoya Khan',
    age: 23,
    gender: 'Female',
    avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
    occupation: 'Content Strategist',
    institution: 'Digital Media Studio',
    city: 'Mumbai',
    targetLocalities: ['Powai', 'Andheri East', 'Vikhroli'],
    budgetMin: 15000,
    budgetMax: 26000,
    moveInDate: '2026-11-20',
    accommodationType: 'Flat',
    sharingPreference: 'Single Room',
    sleepSchedule: 'Flexible',
    cleanliness: 4,
    foodPreference: 'Non-Vegetarian',
    smokingDrinking: 'Occasionally',
    noiseTolerance: 'Moderate',
    guestPolicy: 'Weekends Only',
    privacyNeeds: 'High',
    hobbies: ['Copywriting', 'Cinema', 'Filter Coffee', 'Thrifting'],
    bio: 'Creative copywriter in Mumbai. Friendly, clean, love baking banana bread on Sundays.',
    isVerifiedDemo: true,
    socialBadge: 'Verified Creator'
  },
  {
    id: 'rm-14',
    name: 'Harsh Vardhan',
    age: 21,
    gender: 'Male',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
    occupation: 'Civil Engineering Student',
    institution: 'Raj Kumar Goel Institute',
    city: 'Ghaziabad',
    targetLocalities: ['Muradnagar', 'Modinagar'],
    budgetMin: 5000,
    budgetMax: 8500,
    moveInDate: '2026-11-01',
    accommodationType: 'PG',
    sharingPreference: 'Twin Sharing',
    sleepSchedule: 'Early Bird',
    cleanliness: 4,
    foodPreference: 'Vegetarian',
    smokingDrinking: 'Never',
    noiseTolerance: 'Low/Quiet',
    guestPolicy: 'Rarely',
    privacyNeeds: 'Low',
    hobbies: ['Structural Design', 'Volleyball', 'Folk Music', 'Sketching'],
    bio: 'Calm and dependable roommate from UP. Prepares for competitive exams, keeps room organized.',
    isVerifiedDemo: true,
    socialBadge: 'College Sports Coordinator'
  },
  {
    id: 'rm-15',
    name: 'Ritika Sen',
    age: 22,
    gender: 'Female',
    avatarUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=400&q=80',
    occupation: 'UX Research Intern',
    institution: 'Delhi University / Tech Firm',
    city: 'New Delhi',
    targetLocalities: ['North Campus', 'GTB Nagar', 'Kamla Nagar'],
    budgetMin: 8000,
    budgetMax: 13500,
    moveInDate: '2026-11-01',
    accommodationType: 'PG',
    sharingPreference: 'Twin Sharing',
    sleepSchedule: 'Night Owl',
    cleanliness: 5,
    foodPreference: 'Non-Vegetarian',
    smokingDrinking: 'Never',
    noiseTolerance: 'Moderate',
    guestPolicy: 'Weekends Only',
    privacyNeeds: 'Moderate',
    hobbies: ['User Psychology', 'Specialty Teas', 'Street Photography', 'Origami'],
    bio: 'DU alumna doing UX research. Great communicator, prompt with shared bill payments.',
    isVerifiedDemo: true,
    socialBadge: 'Design Club Lead'
  },
  {
    id: 'rm-16',
    name: 'Sameer Qureshi',
    age: 22,
    gender: 'Male',
    avatarUrl: 'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?auto=format&fit=crop&w=400&q=80',
    occupation: 'Embedded Systems Engineer',
    institution: 'IoT Labs Ghaziabad',
    city: 'Ghaziabad',
    targetLocalities: ['Muradnagar', 'Raj Nagar', 'Crossings Republik'],
    budgetMin: 7000,
    budgetMax: 11500,
    moveInDate: '2026-11-01',
    accommodationType: 'PG',
    sharingPreference: 'Twin Sharing',
    sleepSchedule: 'Night Owl',
    cleanliness: 4,
    foodPreference: 'Non-Vegetarian',
    smokingDrinking: 'Never',
    noiseTolerance: 'Low/Quiet',
    guestPolicy: 'Weekends Only',
    privacyNeeds: 'Moderate',
    hobbies: ['ESP32', 'Firmware', 'Football (EPL)', 'Chess'],
    bio: 'Tinkering with hardware sensors. Respects quiet hours, keeps desk neat, friendly attitude.',
    isVerifiedDemo: true,
    socialBadge: 'Smart India Hackathon Finalist'
  },
  {
    id: 'rm-17',
    name: 'Nandini Joshi',
    age: 20,
    gender: 'Female',
    avatarUrl: 'https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&w=400&q=80',
    occupation: 'Math & Computing Student',
    institution: 'Indraprastha Institute of Technology',
    city: 'Ghaziabad',
    targetLocalities: ['Muradnagar', 'Vasundhara'],
    budgetMin: 6500,
    budgetMax: 10000,
    moveInDate: '2026-11-05',
    accommodationType: 'PG',
    sharingPreference: 'Twin Sharing',
    sleepSchedule: 'Early Bird',
    cleanliness: 5,
    foodPreference: 'Vegetarian',
    smokingDrinking: 'Never',
    noiseTolerance: 'Low/Quiet',
    guestPolicy: 'Rarely',
    privacyNeeds: 'High',
    hobbies: ['Linear Algebra', 'Meditation', 'Classical Dance', 'Sudoku'],
    bio: 'Second year student. Very quiet, loves peace and early morning study hours.',
    isVerifiedDemo: true,
    socialBadge: 'Math Olympiad Gold'
  },
  {
    id: 'rm-18',
    name: 'Aditya Chauhan',
    age: 23,
    gender: 'Male',
    avatarUrl: 'https://images.unsplash.com/photo-1492446845049-9c50ce313d00?auto=format&fit=crop&w=400&q=80',
    occupation: 'Product Specialist',
    institution: 'E-commerce Brand',
    city: 'Gurugram / Noida',
    targetLocalities: ['Sector 62', 'Sector 50 Noida', 'Indirapuram'],
    budgetMin: 12000,
    budgetMax: 20000,
    moveInDate: '2026-11-12',
    accommodationType: 'Flat',
    sharingPreference: 'Single Room',
    sleepSchedule: 'Flexible',
    cleanliness: 4,
    foodPreference: 'Eggetarian',
    smokingDrinking: 'Occasionally',
    noiseTolerance: 'Moderate',
    guestPolicy: 'Weekends Only',
    privacyNeeds: 'Moderate',
    hobbies: ['Product Growth', 'Cycling', 'Standup Comedy', 'Podcasts'],
    bio: 'Working professional looking for a like-minded flatmate to share a furnished flat in Noida.',
    isVerifiedDemo: true,
    socialBadge: 'Verified Profile'
  },
  {
    id: 'rm-19',
    name: 'Divya Pillai',
    age: 21,
    gender: 'Female',
    avatarUrl: 'https://images.unsplash.com/photo-1534751516642-a171edd2521d?auto=format&fit=crop&w=400&q=80',
    occupation: 'Architecture Student',
    institution: 'Design College Delhi-NCR',
    city: 'Greater Noida / Ghaziabad',
    targetLocalities: ['Knowledge Park', 'Pari Chowk', 'Muradnagar'],
    budgetMin: 7500,
    budgetMax: 13000,
    moveInDate: '2026-11-01',
    accommodationType: 'Flat',
    sharingPreference: 'Twin Sharing',
    sleepSchedule: 'Night Owl',
    cleanliness: 4,
    foodPreference: 'Vegetarian',
    smokingDrinking: 'Never',
    noiseTolerance: 'Moderate',
    guestPolicy: 'Weekends Only',
    privacyNeeds: 'Moderate',
    hobbies: ['Drafting', '3D Modeling (Blender)', 'Plants', 'Coffee'],
    bio: 'Architecture student with drafting boards and plants. Love aesthetic spaces and calm living vibes.',
    isVerifiedDemo: true,
    socialBadge: 'Archifest Winner'
  },
  {
    id: 'rm-20',
    name: 'Varun Saxena',
    age: 22,
    gender: 'Male',
    avatarUrl: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=400&q=80',
    occupation: 'Fintech Backend Engineer',
    institution: 'Early-stage YC Startup',
    city: 'Noida / Bengaluru',
    targetLocalities: ['Sector 62', 'Sector 18', 'Indirapuram'],
    budgetMin: 9000,
    budgetMax: 15000,
    moveInDate: '2026-11-01',
    accommodationType: 'PG',
    sharingPreference: 'Single Room',
    sleepSchedule: 'Night Owl',
    cleanliness: 4,
    foodPreference: 'Vegetarian',
    smokingDrinking: 'Never',
    noiseTolerance: 'Moderate',
    guestPolicy: 'Weekends Only',
    privacyNeeds: 'High',
    hobbies: ['Go / Golang', 'Kafka', 'Table Tennis', 'Gym'],
    bio: 'Junior backend engineer working remotely on microservices. Looking for a quiet, neat room in a friendly flat. Quiet after 11 PM.',
    isVerifiedDemo: true,
    socialBadge: 'Open Source Contributor'
  }
];
