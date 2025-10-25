import type { Habit } from '../types/Habit';
import type { DayOfWeek } from '../types/Habit';

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

export const DAYS_DISPLAY_NAMES: Record<DayOfWeek, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

export function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export function getCompletedDaysCount(habit: Habit): number {
  return Object.values(habit.completedDays).filter(Boolean).length;
}

export function getCompletionPercentage(habit: Habit): number {
  const completedCount = getCompletedDaysCount(habit);
  return Math.round((completedCount / 7) * 100);
}

export function isHabitCompleted(habit: Habit): boolean {
  return getCompletedDaysCount(habit) === 7;
}

export function calculateStreak(habit: Habit): number {
  let maxStreak = 0;
  let currentStreak = 0;

  for (const day of DAYS_OF_WEEK) {
    if (habit.completedDays[day]) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  return maxStreak;
}

// Added helpers to convert between app Habit and API payloads
function capitalizeFrequency(freq: string) {
  return freq.charAt(0).toUpperCase() + freq.slice(1);
}

function habitToApiPayload(h: Habit) {
  return {
    name: h.name,
    frequency: capitalizeFrequency(h.frequency),
    category: h.category,
    start_date: h.startDate,
  };
}

function apiToHabit(item: any): Habit {
  return {
    id: item.id ?? generateId(),
    name: item.name ?? 'Untitled',
    color: item.color ?? '#000000',
    frequency: (typeof item.frequency === 'string' ? item.frequency.toLowerCase() : 'weekly') as any,
    category: (item.category ?? 'Personal') as any,
    startDate: item.start_date ?? item.startDate ?? new Date().toISOString().slice(0, 10),
    completedDays: item.completedDays ?? createEmptyHabitDays(),
    createdAt: item.createdAt ?? new Date().toISOString(),
    totalDays: item.totalDays,
    failureDays: item.failureDays,
  };
}

export async function saveHabitsToStorage(habits: Habit[]): Promise<void> {
  try {
    const payload = habits.map(habitToApiPayload);
    const res = await fetch('https://habit-track.up.railway.app/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      // If server returns saved items, normalise and persist to localStorage for offline use
      try {
        const serverData = await res.json();
        if (Array.isArray(serverData)) {
          localStorage.setItem('habits', JSON.stringify(serverData.map(apiToHabit)));
        } else {
          localStorage.setItem('habits', JSON.stringify(habits));
        }
      } catch {
        localStorage.setItem('habits', JSON.stringify(habits));
      }
      return;
    }

    // fallback when server responds with error
    try {
      localStorage.setItem('habits', JSON.stringify(habits));
    } catch (e) {
      console.error('Failed to save habits to localStorage after API error:', e);
    }
  } catch (error) {
    console.error('Failed to save habits via API, falling back to localStorage:', error);
    try {
      localStorage.setItem('habits', JSON.stringify(habits));
    } catch (e) {
      console.error('Failed to save habits to localStorage as fallback:', e);
    }
  }
}

export async function loadHabitsFromStorage(): Promise<Habit[]> {
  try {
    const res = await fetch('https://habit-track.up.railway.app/habits');
    if (res.ok) {
      const parsed = await res.json();
      if (Array.isArray(parsed)) return parsed.map(apiToHabit);
    }

    // Fallback: try localStorage
    const storedHabits = localStorage.getItem('habits');
    if (!storedHabits) return [];

    const parsedLocal = JSON.parse(storedHabits);
    if (!Array.isArray(parsedLocal)) return [];

    // Ensure each item conforms to Habit interface
    return parsedLocal.map((item: any) =>
      item.id && item.completedDays ? (item as Habit) : apiToHabit(item)
    );
  } catch (error) {
    console.error('Failed to load habits via API/localStorage:', error);
    return [];
  }
}

export function createEmptyHabitDays(): Record<DayOfWeek, boolean> {
  return {
    monday: false,
    tuesday: false,
    wednesday: false,
    thursday: false,
    friday: false,
    saturday: false,
    sunday: false,
  };
}
