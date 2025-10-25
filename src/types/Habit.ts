// src/types/Habit.ts

export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export type Frequency = 'daily' | 'weekly';
export type Category  = 'Health' | 'Fitness' | 'Study' | 'Work' | 'Personal';

export type FilterType = 'all' | 'completed' | 'incomplete';
export type SortType   = 'name' | 'streak' | 'created';

export interface HabitFormData {
  name: string;
  color: string;
  // NEW:
  frequency: Frequency;
  category: Category;
  startDate: string;   // YYYY-MM-DD
}

// Your app used to have Habit with fewer fields.
// Extend it to include the new ones.
export interface Habit extends HabitFormData {
  id: string;
  completedDays: Record<DayOfWeek, boolean>;
  createdAt: string;

  // Optional stats used by mock data
  totalDays?: number;
  failureDays?: number;
}

export interface EditHabitData {
  id: string;
  name: string;
  color: string;
}
