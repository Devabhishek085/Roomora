#!/usr/bin/env node
/**
 * Roomora Database Seed Script
 * ─────────────────────────────────────────────────────────────
 * Seeds the Supabase database with 20 AI-generated demo roommate profiles.
 * These profiles are clearly labeled is_demo=true and demo_label='AI-generated demo profile'.
 *
 * SAFETY:
 *   - Will NOT insert profiles if they already exist (idempotent by id)
 *   - All profiles have is_demo=true — cannot be confused with real users
 *   - Uses the SUPABASE_SERVICE_ROLE_KEY (server-only) to bypass RLS for seeding
 *   - NEVER run this in production with real user data
 *
 * Usage:
 *   node scripts/seed-demo-profiles.mjs
 *
 * Required environment variables (in sidecar/.env or .env.local):
 *   VITE_SUPABASE_URL=https://your-project.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
 */

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  console.error('   Copy .env.example to .env.local and fill in your Supabase credentials.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

/**
 * 20 AI-generated demo profiles — clearly labeled, fictional people.
 * These profiles do not represent real individuals.
 * Avatars use DiceBear (svg, no real faces) to avoid misuse of real photos.
 */
const DEMO_PROFILES = [
  {
    seed_id: 'demo-rm-1',
    display_name: 'Rohan Verma',
    age: 21, gender: 'Male',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rohan-verma-demo',
    occupation: 'Computer Science Student',
    institution: 'Delhi University (CIC)',
    city: 'New Delhi',
    budget_min: 7000, budget_max: 12000,
    move_in_date: '2026-11-01',
    accommodation_type: 'PG', sharing_preference: 'Twin Sharing',
    sleep_schedule: 'Night Owl', cleanliness: 4, food_preference: 'Vegetarian',
    smoking_drinking: 'Never', noise_tolerance: 'Moderate', guest_policy: 'Weekends Only',
    privacy_needs: 'Moderate', bio: 'Third-year CS student. Building full-stack projects, loves chai breaks.',
    target_localities: ['North Campus', 'Kamla Nagar', 'Hudson Lane'],
    hobbies: ['Web3', 'Competitive Coding', 'Chess'],
  },
  {
    seed_id: 'demo-rm-2',
    display_name: 'Ananya Deshmukh',
    age: 22, gender: 'Female',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ananya-deshmukh-demo',
    occupation: 'AI/ML Intern',
    institution: 'NSUT Delhi', city: 'New Delhi',
    budget_min: 8000, budget_max: 14000,
    move_in_date: '2026-11-05',
    accommodation_type: 'Flat', sharing_preference: 'Single Room',
    sleep_schedule: 'Flexible', cleanliness: 5, food_preference: 'Vegetarian',
    smoking_drinking: 'Never', noise_tolerance: 'Low/Quiet', guest_policy: 'Rarely',
    privacy_needs: 'High', bio: 'Final year IT student interning in AI. Need quiet study environment.',
    target_localities: ['Dwarka', 'Janakpuri', 'Rohini'],
    hobbies: ['Python', 'Painting', 'Yoga'],
  },
  {
    seed_id: 'demo-rm-3',
    display_name: 'Kabir Singhania',
    age: 23, gender: 'Male',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=kabir-singhania-demo',
    occupation: 'Frontend Developer',
    institution: 'Tech Startup (Remote)', city: 'Bengaluru',
    budget_min: 10000, budget_max: 18000,
    move_in_date: '2026-11-10',
    accommodation_type: 'Flat', sharing_preference: 'Twin Sharing',
    sleep_schedule: 'Night Owl', cleanliness: 4, food_preference: 'Eggetarian',
    smoking_drinking: 'Occasionally', noise_tolerance: 'Moderate', guest_policy: 'Weekends Only',
    privacy_needs: 'Moderate', bio: 'Remote frontend dev. Looking for a flatmate who enjoys gaming.',
    target_localities: ['Koramangala', 'HSR Layout', 'Indiranagar'],
    hobbies: ['React', 'Gaming', 'Gym'],
  },
  {
    seed_id: 'demo-rm-4',
    display_name: 'Priya Nambiar',
    age: 21, gender: 'Female',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=priya-nambiar-demo',
    occupation: 'Electronics Engineering Student',
    institution: 'NSUT Delhi', city: 'New Delhi',
    budget_min: 7000, budget_max: 12000,
    move_in_date: '2026-11-01',
    accommodation_type: 'PG', sharing_preference: 'Twin Sharing',
    sleep_schedule: 'Early Bird', cleanliness: 5, food_preference: 'Vegetarian',
    smoking_drinking: 'Never', noise_tolerance: 'Low/Quiet', guest_policy: 'Rarely',
    privacy_needs: 'Moderate', bio: 'ECE junior who loves a peaceful morning. Sleep early, up at 6 AM.',
    target_localities: ['Dwarka Sector 3', 'Janakpuri'],
    hobbies: ['Robotics', 'Classical Music', 'Reading'],
  },
  {
    seed_id: 'demo-rm-5',
    display_name: 'Devansh Tandon',
    age: 22, gender: 'Male',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=devansh-tandon-demo',
    occupation: 'Mechanical Engineering Senior',
    institution: 'DTU Delhi', city: 'New Delhi',
    budget_min: 6000, budget_max: 9500,
    move_in_date: '2026-11-15',
    accommodation_type: 'PG', sharing_preference: 'Twin Sharing',
    sleep_schedule: 'Night Owl', cleanliness: 3, food_preference: 'Non-Vegetarian',
    smoking_drinking: 'Never', noise_tolerance: 'High/Lively', guest_policy: 'Flexible',
    privacy_needs: 'Low', bio: 'Easygoing, fun to hang around, looking for budget-friendly PG near campus.',
    target_localities: ['Rohini Sector 16', 'Pitampura'],
    hobbies: ['Automotive CAD', 'Cricket', 'Guitar'],
  },
  {
    seed_id: 'demo-rm-6',
    display_name: 'Sanya Kapoor',
    age: 23, gender: 'Female',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sanya-kapoor-demo',
    occupation: 'Product Designer (UI/UX)',
    institution: 'Design Agency (Gurugram)', city: 'Delhi NCR',
    budget_min: 12000, budget_max: 22000,
    move_in_date: '2026-11-01',
    accommodation_type: 'Flat', sharing_preference: 'Single Room',
    sleep_schedule: 'Flexible', cleanliness: 5, food_preference: 'Vegan',
    smoking_drinking: 'Occasionally', noise_tolerance: 'Low/Quiet', guest_policy: 'Weekends Only',
    privacy_needs: 'High', bio: 'Product designer obsessed with sleek aesthetics and plants.',
    target_localities: ['Cyber City', 'Golf Course Road'],
    hobbies: ['Typography', 'Specialty Coffee', 'Pilates'],
  },
  {
    seed_id: 'demo-rm-7',
    display_name: 'Ayush Mehra',
    age: 20, gender: 'Male',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ayush-mehra-demo',
    occupation: 'Data Science Sophomore',
    institution: 'IP University (USICT)', city: 'New Delhi',
    budget_min: 5500, budget_max: 9000,
    move_in_date: '2026-11-01',
    accommodation_type: 'PG', sharing_preference: 'Twin Sharing',
    sleep_schedule: 'Night Owl', cleanliness: 4, food_preference: 'Vegetarian',
    smoking_drinking: 'Never', noise_tolerance: 'Moderate', guest_policy: 'Weekends Only',
    privacy_needs: 'Moderate', bio: 'Sophomore aiming for data analytics hackathons. Need a calm study buddy.',
    target_localities: ['Dwarka Sector 14', 'Janakpuri'],
    hobbies: ['Machine Learning', 'Kaggle', 'Anime'],
  },
  {
    seed_id: 'demo-rm-8',
    display_name: 'Meera Iyer',
    age: 22, gender: 'Female',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=meera-iyer-demo',
    occupation: 'Fintech Analyst',
    institution: 'Koramangala Financial Corp', city: 'Bengaluru',
    budget_min: 14000, budget_max: 24000,
    move_in_date: '2026-11-10',
    accommodation_type: 'Flat', sharing_preference: 'Single Room',
    sleep_schedule: 'Early Bird', cleanliness: 5, food_preference: 'Vegetarian',
    smoking_drinking: 'Never', noise_tolerance: 'Low/Quiet', guest_policy: 'Rarely',
    privacy_needs: 'High', bio: 'Disciplined lifestyle, early riser, love home-cooked food.',
    target_localities: ['Koramangala', 'Indiranagar', 'BTM Layout'],
    hobbies: ['Stocks', 'Morning Runs', 'Carnatic Vocals'],
  },
  {
    seed_id: 'demo-rm-9',
    display_name: 'Tanmay Bhattacharya',
    age: 21, gender: 'Male',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tanmay-bhattacharya-demo',
    occupation: 'Cybersecurity Enthusiast',
    institution: 'Null Pointer Collective', city: 'Ghaziabad',
    budget_min: 6500, budget_max: 10500,
    move_in_date: '2026-11-01',
    accommodation_type: 'PG', sharing_preference: 'Twin Sharing',
    sleep_schedule: 'Night Owl', cleanliness: 4, food_preference: 'Non-Vegetarian',
    smoking_drinking: 'Never', noise_tolerance: 'Moderate', guest_policy: 'Weekends Only',
    privacy_needs: 'Moderate', bio: 'CTF player who stays up late debugging network packets. Very hygienic.',
    target_localities: ['Muradnagar', 'Govindpuram', 'Kavi Nagar'],
    hobbies: ['CTF Challenges', 'Linux Customization', 'Sci-Fi'],
  },
  {
    seed_id: 'demo-rm-10',
    display_name: 'Ishaan Chopra',
    age: 24, gender: 'Male',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ishaan-chopra-demo',
    occupation: 'Cloud Infrastructure Engineer',
    institution: 'Cloud Native Labs', city: 'Noida',
    budget_min: 11000, budget_max: 19000,
    move_in_date: '2026-11-15',
    accommodation_type: 'Flat', sharing_preference: 'Single Room',
    sleep_schedule: 'Flexible', cleanliness: 4, food_preference: 'Eggetarian',
    smoking_drinking: 'Occasionally', noise_tolerance: 'Moderate', guest_policy: 'Weekends Only',
    privacy_needs: 'Moderate', bio: 'Working with AWS/Terraform. Looking for modern 2BHK flatmate.',
    target_localities: ['Sector 62', 'Sector 18', 'Indirapuram'],
    hobbies: ['Kubernetes', 'Biking', 'Guitar'],
  },
  {
    seed_id: 'demo-rm-11',
    display_name: 'Sneha Rastogi',
    age: 21, gender: 'Female',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sneha-rastogi-demo',
    occupation: 'Pharmacy / Biotech Researcher',
    institution: 'Banasthali Vidyapith', city: 'Noida',
    budget_min: 6000, budget_max: 10000,
    move_in_date: '2026-11-01',
    accommodation_type: 'PG', sharing_preference: 'Twin Sharing',
    sleep_schedule: 'Early Bird', cleanliness: 5, food_preference: 'Vegetarian',
    smoking_drinking: 'Never', noise_tolerance: 'Low/Quiet', guest_policy: 'Rarely',
    privacy_needs: 'Moderate', bio: 'B.Pharm student. Extremely neat, focused on research.',
    target_localities: ['Noida Sector 18', 'Vaishali', 'Indirapuram'],
    hobbies: ['Botanical Sciences', 'Baking', 'Badminton'],
  },
  {
    seed_id: 'demo-rm-12',
    display_name: 'Karthik Raman',
    age: 22, gender: 'Male',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=karthik-raman-demo',
    occupation: 'Fullstack Dev Intern',
    institution: 'Hinjewadi Tech Hub', city: 'Pune',
    budget_min: 9000, budget_max: 15000,
    move_in_date: '2026-11-01',
    accommodation_type: 'Flat', sharing_preference: 'Twin Sharing',
    sleep_schedule: 'Night Owl', cleanliness: 4, food_preference: 'Non-Vegetarian',
    smoking_drinking: 'Never', noise_tolerance: 'Moderate', guest_policy: 'Weekends Only',
    privacy_needs: 'Moderate', bio: 'Intern in Hinjewadi. Love morning treks on weekends.',
    target_localities: ['Hinjewadi Phase 1', 'Wakad', 'Baner'],
    hobbies: ['Node.js', 'Badminton', 'Trekking'],
  },
  {
    seed_id: 'demo-rm-13',
    display_name: 'Zoya Khan',
    age: 23, gender: 'Female',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zoya-khan-demo',
    occupation: 'Content Strategist',
    institution: 'Digital Media Studio', city: 'Mumbai',
    budget_min: 15000, budget_max: 26000,
    move_in_date: '2026-11-20',
    accommodation_type: 'Flat', sharing_preference: 'Single Room',
    sleep_schedule: 'Flexible', cleanliness: 4, food_preference: 'Non-Vegetarian',
    smoking_drinking: 'Occasionally', noise_tolerance: 'Moderate', guest_policy: 'Weekends Only',
    privacy_needs: 'High', bio: 'Creative copywriter in Mumbai. Friendly, clean, love baking on Sundays.',
    target_localities: ['Powai', 'Andheri East', 'Vikhroli'],
    hobbies: ['Copywriting', 'Cinema', 'Thrifting'],
  },
  {
    seed_id: 'demo-rm-14',
    display_name: 'Harsh Vardhan',
    age: 21, gender: 'Male',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=harsh-vardhan-demo',
    occupation: 'Civil Engineering Student',
    institution: 'Raj Kumar Goel Institute', city: 'Ghaziabad',
    budget_min: 5000, budget_max: 8500,
    move_in_date: '2026-11-01',
    accommodation_type: 'PG', sharing_preference: 'Twin Sharing',
    sleep_schedule: 'Early Bird', cleanliness: 4, food_preference: 'Vegetarian',
    smoking_drinking: 'Never', noise_tolerance: 'Low/Quiet', guest_policy: 'Rarely',
    privacy_needs: 'Low', bio: 'Calm and dependable roommate. Prepares for competitive exams.',
    target_localities: ['Muradnagar', 'Modinagar'],
    hobbies: ['Structural Design', 'Volleyball', 'Sketching'],
  },
  {
    seed_id: 'demo-rm-15',
    display_name: 'Ritika Sen',
    age: 22, gender: 'Female',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ritika-sen-demo',
    occupation: 'UX Research Intern',
    institution: 'Delhi University / Tech Firm', city: 'New Delhi',
    budget_min: 8000, budget_max: 13500,
    move_in_date: '2026-11-01',
    accommodation_type: 'PG', sharing_preference: 'Twin Sharing',
    sleep_schedule: 'Night Owl', cleanliness: 5, food_preference: 'Non-Vegetarian',
    smoking_drinking: 'Never', noise_tolerance: 'Moderate', guest_policy: 'Weekends Only',
    privacy_needs: 'Moderate', bio: 'DU alumna doing UX research. Great communicator, prompt with bills.',
    target_localities: ['North Campus', 'GTB Nagar', 'Kamla Nagar'],
    hobbies: ['User Psychology', 'Street Photography', 'Origami'],
  },
  {
    seed_id: 'demo-rm-16',
    display_name: 'Sameer Qureshi',
    age: 22, gender: 'Male',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sameer-qureshi-demo',
    occupation: 'Embedded Systems Engineer',
    institution: 'IoT Labs Ghaziabad', city: 'Ghaziabad',
    budget_min: 7000, budget_max: 11500,
    move_in_date: '2026-11-01',
    accommodation_type: 'PG', sharing_preference: 'Twin Sharing',
    sleep_schedule: 'Night Owl', cleanliness: 4, food_preference: 'Non-Vegetarian',
    smoking_drinking: 'Never', noise_tolerance: 'Low/Quiet', guest_policy: 'Weekends Only',
    privacy_needs: 'Moderate', bio: 'Tinkering with hardware sensors. Respects quiet hours.',
    target_localities: ['Muradnagar', 'Raj Nagar', 'Crossings Republik'],
    hobbies: ['ESP32', 'Firmware', 'Chess'],
  },
  {
    seed_id: 'demo-rm-17',
    display_name: 'Nandini Joshi',
    age: 20, gender: 'Female',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nandini-joshi-demo',
    occupation: 'Math & Computing Student',
    institution: 'Indraprastha Institute of Technology', city: 'Ghaziabad',
    budget_min: 6500, budget_max: 10000,
    move_in_date: '2026-11-05',
    accommodation_type: 'PG', sharing_preference: 'Twin Sharing',
    sleep_schedule: 'Early Bird', cleanliness: 5, food_preference: 'Vegetarian',
    smoking_drinking: 'Never', noise_tolerance: 'Low/Quiet', guest_policy: 'Rarely',
    privacy_needs: 'High', bio: 'Second year student. Very quiet, loves peace and early morning study hours.',
    target_localities: ['Muradnagar', 'Vasundhara'],
    hobbies: ['Linear Algebra', 'Meditation', 'Classical Dance'],
  },
  {
    seed_id: 'demo-rm-18',
    display_name: 'Aditya Chauhan',
    age: 23, gender: 'Male',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=aditya-chauhan-demo',
    occupation: 'Product Specialist',
    institution: 'E-commerce Brand', city: 'Gurugram',
    budget_min: 12000, budget_max: 20000,
    move_in_date: '2026-11-12',
    accommodation_type: 'Flat', sharing_preference: 'Single Room',
    sleep_schedule: 'Flexible', cleanliness: 4, food_preference: 'Eggetarian',
    smoking_drinking: 'Occasionally', noise_tolerance: 'Moderate', guest_policy: 'Weekends Only',
    privacy_needs: 'Moderate', bio: 'Working professional looking for like-minded flatmate in Noida.',
    target_localities: ['Sector 62', 'Sector 50 Noida', 'Indirapuram'],
    hobbies: ['Product Growth', 'Cycling', 'Standup Comedy'],
  },
  {
    seed_id: 'demo-rm-19',
    display_name: 'Divya Pillai',
    age: 21, gender: 'Female',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=divya-pillai-demo',
    occupation: 'Architecture Student',
    institution: 'Design College Delhi-NCR', city: 'Greater Noida',
    budget_min: 7500, budget_max: 13000,
    move_in_date: '2026-11-01',
    accommodation_type: 'Flat', sharing_preference: 'Twin Sharing',
    sleep_schedule: 'Night Owl', cleanliness: 4, food_preference: 'Vegetarian',
    smoking_drinking: 'Never', noise_tolerance: 'Moderate', guest_policy: 'Weekends Only',
    privacy_needs: 'Moderate', bio: 'Architecture student with drafting boards and plants. Love aesthetic spaces.',
    target_localities: ['Knowledge Park', 'Pari Chowk', 'Muradnagar'],
    hobbies: ['Drafting', '3D Modeling', 'Plants', 'Coffee'],
  },
  {
    seed_id: 'demo-rm-20',
    display_name: 'Varun Saxena',
    age: 22, gender: 'Male',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=varun-saxena-demo',
    occupation: 'Fintech Backend Engineer',
    institution: 'Early-stage Startup', city: 'Noida',
    budget_min: 9000, budget_max: 15000,
    move_in_date: '2026-11-01',
    accommodation_type: 'PG', sharing_preference: 'Single Room',
    sleep_schedule: 'Night Owl', cleanliness: 4, food_preference: 'Vegetarian',
    smoking_drinking: 'Never', noise_tolerance: 'Moderate', guest_policy: 'Weekends Only',
    privacy_needs: 'High', bio: 'Junior backend engineer working remotely on microservices. Quiet after 11 PM.',
    target_localities: ['Sector 62', 'Sector 18', 'Indirapuram'],
    hobbies: ['Go / Golang', 'Kafka', 'Table Tennis', 'Gym'],
  },
];

async function seed() {
  console.log('🌱 Roomora — Seeding 20 AI-generated demo profiles...\n');
  console.log('⚠️  These profiles are labeled is_demo=true and CANNOT receive real connections.\n');

  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const profile of DEMO_PROFILES) {
    const userId = randomUUID(); // Synthetic UUID for each demo user

    try {
      // First create a synthetic auth user entry isn't possible directly via client.
      // Instead, insert directly into profiles table using service role.
      // NOTE: These profiles don't have auth.users entries — they are purely display profiles.
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          age: profile.age,
          gender: profile.gender,
          occupation: profile.occupation,
          institution: profile.institution,
          city: profile.city,
          budget_min: profile.budget_min,
          budget_max: profile.budget_max,
          move_in_date: profile.move_in_date,
          accommodation_type: profile.accommodation_type,
          sharing_preference: profile.sharing_preference,
          sleep_schedule: profile.sleep_schedule,
          cleanliness: profile.cleanliness,
          food_preference: profile.food_preference,
          smoking_drinking: profile.smoking_drinking,
          noise_tolerance: profile.noise_tolerance,
          guest_policy: profile.guest_policy,
          privacy_needs: profile.privacy_needs,
          bio: profile.bio,
          target_localities: profile.target_localities,
          hobbies: profile.hobbies,
          is_demo: true,
          demo_label: 'AI-generated demo profile',
          profile_visibility: 'public',
          show_budget_publicly: true,
          show_sleep_schedule_publicly: true,
          show_contact_publicly: false,
          is_active: true,
          profile_completed_at: new Date().toISOString(),
        }, { onConflict: 'display_name' }); // Skip duplicates by name

      if (error) {
        console.error(`  ❌ ${profile.display_name}: ${error.message}`);
        errors++;
      } else {
        console.log(`  ✅ ${profile.display_name} (${profile.city})`);
        inserted++;
      }
    } catch (err) {
      console.error(`  ❌ ${profile.display_name}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\n📊 Seed Summary:`);
  console.log(`   ✅ Inserted: ${inserted}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors:  ${errors}`);

  if (inserted > 0) {
    console.log('\n✨ Demo seed complete. All profiles are labeled as AI-generated.');
    console.log('   They will appear in the Matches page with a "AI Demo" badge.');
  }
}

seed().catch(console.error);
