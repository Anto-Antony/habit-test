// src/mock/habits.ts
import type { Habit, DayOfWeek } from '../types/Habit';




const EMPTY_WEEK: Record<DayOfWeek, boolean> = {
  monday: false,
  tuesday: false,
  wednesday: false,
  thursday: false,
  friday: false,
  saturday: false,
  sunday: false,
};

export const MOCK_HABITS: Habit[] = [
  {
    id: 'h1',
    name: 'Morning Run',
    color: '#3B82F6',
    frequency: 'daily',
    category: 'Fitness',
    startDate: '2025-10-01',
    createdAt: '2025-10-01T07:00:00.000Z',
    completedDays: { ...EMPTY_WEEK, monday: true, wednesday: true, friday: true },
    totalDays: 30,  
    failureDays: 5,
  },
  {
    id: 'h2',
    name: 'Read 20 mins',
    color: '#F59E0B',
    frequency: 'daily',
    category: 'Study',
    startDate: '2025-09-20',
    createdAt: '2025-09-20T19:30:00.000Z',
    completedDays: { ...EMPTY_WEEK, tuesday: true, thursday: true, saturday: true },
    totalDays: 25,
    failureDays: 7,
  },
  {
    id: 'h3',
    name: 'Meal Prep',
    color: '#10B981',
    frequency: 'weekly',
    category: 'Health',
    startDate: '2025-10-05',
    createdAt: '2025-10-05T12:00:00.000Z',
    completedDays: { ...EMPTY_WEEK, sunday: true },
    totalDays: 10,
    failureDays: 2,
  },
];
