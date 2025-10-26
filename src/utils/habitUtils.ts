// src/utils/habitUtils.ts
import axios from 'axios';
import type { DayOfWeek, Habit as FrontendHabit } from '../types/Habit';

// Base API URL
const API_BASE_URL = 'https://habit-track.up.railway.app';

// Helper: order of days starting Monday
const DAYS_ORDER: DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

// -----------------------------
// Mapping between API shape and frontend shape
// API expected shape (example): { id: number, name, frequency, category, start_date }
// Frontend shape is defined in src/types/Habit.ts (id: string, startDate, completedDays, ...)
// -----------------------------

function mapApiToFrontend(apiHabit: any): FrontendHabit {
  const id = apiHabit.id != null ? String(apiHabit.id) : `local-${Date.now()}`;
  const startDate = apiHabit.start_date ?? apiHabit.startDate ?? '';
  const completedDays = apiHabit.completedDays ?? createEmptyHabitDays();
  return {
    id,
    name: apiHabit.name || 'Untitled',
    frequency: apiHabit.frequency || 'daily',
    category: apiHabit.category || 'Personal',
    startDate,
    completedDays,
    createdAt: apiHabit.createdAt || new Date().toISOString(),
    totalDays: apiHabit.totalDays ?? 0,
    failureDays: apiHabit.failureDays ?? 0,
  } as FrontendHabit;
}

function mapFrontendToApi(habit: FrontendHabit) {
  return {
    id: habit.id && habit.id.startsWith('local-') ? undefined : Number(habit.id),
    name: habit.name,
    frequency: habit.frequency,
    category: habit.category,
    start_date: habit.startDate,
    // include completedDays if backend supports it; harmless otherwise
    completedDays: habit.completedDays,
    totalDays: habit.totalDays ?? 0,
    failureDays: habit.failureDays ?? 0,
  };
}

// -----------------------------
// API functions
// -----------------------------
export const fetchHabitsFromAPI = async (): Promise<FrontendHabit[]> => {
  try {
    const res = await axios.get(`${API_BASE_URL}/habits`);
    if (!Array.isArray(res.data)) return [];
    return res.data.map(mapApiToFrontend);
  } catch (err) {
    console.error('fetchHabitsFromAPI error:', err);
    return [];
  }
};

export const createHabitAPI = async (
  habitData: Partial<FrontendHabit>
): Promise<FrontendHabit | null> => {
  try {
    const payload = {
      name: habitData.name,
      frequency: habitData.frequency,
      category: habitData.category,
      start_date: habitData.startDate,
      completedDays: habitData.completedDays,
      totalDays: habitData.totalDays ?? 0,
      failureDays: habitData.failureDays ?? 0,
    };
    const res = await axios.post(`${API_BASE_URL}/habits`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    return mapApiToFrontend(res.data);
  } catch (err) {
    console.error('createHabitAPI error:', err);
    return null;
  }
};

export const updateHabitAPI = async (
  habitId: string,
  updates: Partial<FrontendHabit>
): Promise<FrontendHabit | null> => {
  try {
    const numericId = habitId.startsWith('local-') ? undefined : Number(habitId);
    if (numericId == null) {
      // nothing to update on remote if local-only id
      return null;
    }
    const payload = mapFrontendToApi(updates as FrontendHabit);
    const res = await axios.put(`${API_BASE_URL}/habits/${numericId}`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    return mapApiToFrontend(res.data);
  } catch (err) {
    console.error('updateHabitAPI error:', err);
    return null;
  }
};

export const deleteHabitAPI = async (habitId: string): Promise<boolean> => {
  try {
    const numericId = habitId.startsWith('local-') ? undefined : Number(habitId);
    if (numericId == null) {
      // nothing to delete on remote
      return true;
    }
    await axios.delete(`${API_BASE_URL}/habits/${numericId}`);
    return true;
  } catch (err) {
    console.error('deleteHabitAPI error:', err);
    return false;
  }
};

// -----------------------------
// Local helpers (frontend)
// -----------------------------
export const generateId = (): string => `local-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

export const createEmptyHabitDays = (): Record<DayOfWeek, boolean> => ({
  monday: false,
  tuesday: false,
  wednesday: false,
  thursday: false,
  friday: false,
  saturday: false,
  sunday: false,
});

export const getCompletedDaysCount = (habit: FrontendHabit): number => {
  return Object.values(habit.completedDays || createEmptyHabitDays()).filter(Boolean).length;
};

export const getCompletionPercentage = (habit: FrontendHabit): number => {
  const total = 7;
  const completed = getCompletedDaysCount(habit);
  return Math.round((completed / total) * 100);
};

export const isHabitCompleted = (habit: FrontendHabit): boolean => getCompletedDaysCount(habit) === 7;

// Calculate a simple streak: number of consecutive days completed up to today (checks backwards from today)
export const calculateStreak = (habit: FrontendHabit): number => {
  const todayIdx = new Date().getDay(); // 0 = Sunday
  // convert to index where 0 = monday
  const indexMap = [6, 0, 1, 2, 3, 4, 5]; // maps Date.getDay() to our DAYS_ORDER index (0=monday)
  const startIdx = indexMap[todayIdx];

  let streak = 0;
  for (let i = 0; i < 7; i++) {
    const idx = (startIdx - i + 7) % 7;
    const day = DAYS_ORDER[idx];
    if (habit.completedDays && habit.completedDays[day]) {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
};

// -----------------------------
// Storage helpers used by the app (kept for compatibility)
// loadHabitsFromStorage: attempts API first, falls back to localStorage or empty array
// saveHabitsToStorage: persists to localStorage and attempts to sync new local items to the API
// -----------------------------
export const loadHabitsFromStorage = async (): Promise<FrontendHabit[]> => {
  try {
    const apiHabits = await fetchHabitsFromAPI();
    if (apiHabits && apiHabits.length) return apiHabits;
  } catch (err) {
    // ignored - handled below
  }

  // fallback to localStorage
  try {
    const raw = localStorage.getItem('habits');
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FrontendHabit[];
    return parsed.map(h => ({ ...h, completedDays: h.completedDays ?? createEmptyHabitDays() }));
  } catch (err) {
    console.error('loadHabitsFromStorage fallback error:', err);
    return [];
  }
};

export const saveHabitsToStorage = async (habits: FrontendHabit[]): Promise<void> => {
  try {
    // save to localStorage for offline UX
    localStorage.setItem('habits', JSON.stringify(habits));

    // attempt to sync local-only items to API
    for (const h of habits) {
      if (h.id && h.id.startsWith('local-')) {
        try {
          const created = await createHabitAPI(h as FrontendHabit);
          if (created) {
            // replace local id with server id in stored list
            const idx = habits.findIndex(x => x.id === h.id);
            if (idx !== -1) {
              habits[idx] = created;
              localStorage.setItem('habits', JSON.stringify(habits));
            }
          }
        } catch (err) {
          // ignore per-item sync failures
        }
      } else {
        // try updating remote for non-local ids
        try {
          await updateHabitAPI(h.id, h as FrontendHabit);
        } catch (err) {
          // ignore
        }
      }
    }
  } catch (err) {
    console.error('saveHabitsToStorage error:', err);
  }
};

export default {
  fetchHabitsFromAPI,
  createHabitAPI,
  updateHabitAPI,
  deleteHabitAPI,
  generateId,
  createEmptyHabitDays,
  getCompletedDaysCount,
  getCompletionPercentage,
  isHabitCompleted,
  calculateStreak,
  loadHabitsFromStorage,
  saveHabitsToStorage,
};
