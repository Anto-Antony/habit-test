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
      style={{ '--habit-color': habit.color } as React.CSSProperties}
    >
      <div className="habit-header">
        <div className="habit-title">
          <h3 className="habit-name">
            {habit.name}
            {isCompleted && <span className="completion-badge">✓</span>}
          </h3>
          
          <div className="habit-stats">
  <span className="completion-text">{completedDaysCount}/7 days</span>

  {/* NEW: failures/total */}
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
        <ProgressBar percentage={completionPercentage} color={habit.color} />
      </div>

     {/* Single daily checkbox */}
<div className="daily-check-container">
  <label className="day-label">Done Today:</label>
  <button
    className={`day-checkbox ${habit.completedDays['monday'] ? 'checked' : ''}`}
    onClick={() => onToggleDay(habit.id, 'monday')}
    aria-label={`Mark as ${habit.completedDays['monday'] ? 'incomplete' : 'complete'}`}
  >
    {habit.completedDays['monday'] && <span className="checkmark">✓</span>}
  </button>
</div>

    </div>
  );
}

export default HabitCard;
