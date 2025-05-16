
'use server';
import { getUsersCollection, getPlansCollection } from './mongodb';
import { INITIAL_MOCK_USERS, INITIAL_MOCK_PLANS } from './constants';
import type { User, Plan } from '@/types';

let dataSeeded = false;

export async function seedInitialData(): Promise<void> {
  if (dataSeeded) {
    return;
  }

  try {
    const usersCollection = await getUsersCollection();
    const plansCollection = await getPlansCollection();

    // Seed Users
    const usersCount = await usersCollection.countDocuments();
    if (usersCount === 0) {
      // Map INITIAL_MOCK_USERS to ensure 'id' field is present as we defined it
      const usersToSeed = INITIAL_MOCK_USERS.map(user => ({
        ...user,
        // id is already defined in INITIAL_MOCK_USERS
      }));
      await usersCollection.insertMany(usersToSeed as any[]); // Cast to any to avoid _id conflict with TS type
      console.log('Initial users seeded.');
    }

    // Seed Plans
    const plansCount = await plansCollection.countDocuments();
    if (plansCount === 0) {
       const plansToSeed = INITIAL_MOCK_PLANS.map(plan => ({
        ...plan,
        // id is already defined in INITIAL_MOCK_PLANS
      }));
      await plansCollection.insertMany(plansToSeed as any[]); // Cast to any
      console.log('Initial plans seeded.');
    }
    dataSeeded = true;
  } catch (error) {
    console.error('Error seeding initial data:', error);
    // Depending on the error, you might want to throw it or handle it gracefully
    // For now, we'll just log it and not set dataSeeded to true, so it might retry
  }
}
