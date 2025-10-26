import { useState } from 'react';
import type { Habit, DayOfWeek } from '../types/Habit';
import {
  getCompletedDaysCount,
  getCompletionPercentage,
  isHabitCompleted,
  calculateStreak,
} from '../utils/habitUtils';
import ProgressBar from './ProgressBar';
import '../styles/components/HabitCard.css';
import '../styles/components/Button.css';


interface HabitCardProps {
  habit: Habit;
  onToggleDay: (habitId: string, day: DayOfWeek) => void;
  onEdit: (habit: Habit) => void;
  onDelete: (habitId: string) => void;
}

const DAYS: DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

function HabitCard({ habit, onToggleDay, onEdit, onDelete }: HabitCardProps) {
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const completedDaysCount = getCompletedDaysCount(habit);
  const completionPercentage = getCompletionPercentage(habit);
  const isCompleted = isHabitCompleted(habit);
  const streak = calculateStreak(habit);
  const failures = habit.failureDays ?? 0;
  const total = habit.totalDays ?? 0;

  return (
    <div
      className="habit-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="habit-header">
        <div className="habit-title">
          <h3 className="habit-name">
            {habit.name}
            {isCompleted && <span className="completion-badge">✓</span>}
          </h3>

          <div className="habit-stats">
            <span className="completion-text">{completedDaysCount}/7 days</span>

            <span className="failure-text">
              {failures}/{total} failed
            </span>

            {streak > 0 && (
              <span className="streak-badge">{streak} day streak</span>
            )}
          </div>

        </div>

        <div className="habit-actions">
          <button
            className="btn btn-small btn-secondary"
            onClick={() => onEdit(habit)}
          >
            Edit
          </button>
          {isHovered && (
            <button
              className="btn btn-small btn-danger"
              onClick={() => onDelete(habit.id)}
            >
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="progress-section">
        <ProgressBar percentage={completionPercentage} />
      </div>

      <div className="daily-check-grid">
        {DAYS.map(day => (
          <button
            key={day}
            className={`day-checkbox ${habit.completedDays?.[day] ? 'checked' : ''}`}
            onClick={() => onToggleDay(habit.id, day)}
            aria-label={`Toggle ${day}`}
            title={day}
          >
            {habit.completedDays?.[day] ? '✓' : day.charAt(0).toUpperCase()}
          </button>
        ))}
      </div>

    </div>
  );
}

export default HabitCard;
