import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { FormEvent } from 'react';
import type { HabitFormData } from '../types/Habit'; // extend with: frequency, category, startDate
import { HABIT_COLORS } from '../constants/colors';
import ColorPicker from './ColorPicker';
import '../styles/components/AddHabitForm.css';
import '../styles/components/Button.css';

const CATEGORIES = ['Health', 'Fitness', 'Study', 'Work', 'Personal'] as const;
type Frequency = 'daily' | 'weekly';

interface AddHabitFormProps {
  onAddHabit: (habitData: HabitFormData) => void;
}

function AddHabitForm({ onAddHabit }: AddHabitFormProps) {
  const [name, setName] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>(HABIT_COLORS[0]);

  // NEW modal state
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // NEW form fields
  const [frequency, setFrequency] = useState<Frequency>('daily');
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>(CATEGORIES[0]);
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().slice(0, 10)); // YYYY-MM-DD

  const resetForm = () => {
    setName('');
    setSelectedColor(HABIT_COLORS[0]);
    setFrequency('daily');
    setCategory(CATEGORIES[0]);
    setStartDate(new Date().toISOString().slice(0, 10));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload = {
      name: name.trim(),
      color: selectedColor,
      frequency,
      category,
      startDate, // string: YYYY-MM-DD
    };

    // Cast is temporary until HabitFormData includes the new fields
    onAddHabit(payload as unknown as HabitFormData);

    resetForm();
    setIsOpen(false);
  };

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  // Prevent body scroll when modal open
  useEffect(() => {
    if (isOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isOpen]);

  const modal = isOpen ? createPortal(
    <div
      className="habit-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="habit-modal-title"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="habit-modal"
        onClick={e => e.stopPropagation()} // prevent closing when clicking inside
      >
        <div className="habit-modal-header">
          <h3 id="habit-modal-title">Add New Habit</h3>
          <button
            className="habit-modal-close"
            aria-label="Close"
            onClick={() => setIsOpen(false)}
            type="button"
          >
            ×
          </button>
        </div>

        <form className="add-habit-form" onSubmit={handleSubmit}>
          {/* Habit Name */}
          <div className="form-group">
            <label htmlFor="habit-name" className="form-label">Habit Name</label>
            <input
              id="habit-name"
              type="text"
              className="form-input"
              placeholder="Enter habit name..."
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={50}
              required
            />
          </div>

          {/* Frequency (radio) */}
          <fieldset className="form-group" style={{ border: 'none', padding: 0, margin: 0 }}>
            <legend className="form-label" style={{ marginBottom: '0.5rem' }}>Frequency</legend>
            <div className="radio-group" role="radiogroup" aria-label="Frequency">
              <label className="radio-option">
                <input
                  type="radio"
                  name="habit-frequency"
                  value="daily"
                  checked={frequency === 'daily'}
                  onChange={() => setFrequency('daily')}
                />
                <span>Daily</span>
              </label>
              <label className="radio-option" style={{ marginLeft: '1rem' }}>
                <input
                  type="radio"
                  name="habit-frequency"
                  value="weekly"
                  checked={frequency === 'weekly'}
                  onChange={() => setFrequency('weekly')}
                />
                <span>Weekly</span>
              </label>
            </div>
          </fieldset>

          {/* Category (select) */}
          <div className="form-group">
            <label htmlFor="habit-category" className="form-label">Category</label>
            <select
              id="habit-category"
              className="form-input"
              value={category}
              onChange={e => setCategory(e.target.value as (typeof CATEGORIES)[number])}
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Start Date (calendar) */}
          <div className="form-group">
            <label htmlFor="habit-start-date" className="form-label">Start Date</label>
            <input
              id="habit-start-date"
              type="date"
              className="form-input"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>

          {/* Color */}
          <div className="form-group">
            <label className="form-label">Choose Color</label>
            <ColorPicker
              colors={HABIT_COLORS}
              selectedColor={selectedColor}
              onColorSelect={setSelectedColor}
            />
          </div>

          <div className="habit-modal-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                resetForm();
                setIsOpen(false);
              }}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={!name.trim()}>
              Save Habit
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div className="add-habit-section">
      <div className="add-habit-header">
        <h2>Habits</h2>
        <button
          className="btn btn-primary"
          onClick={() => setIsOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
        >
          Add Habit
        </button>
      </div>

      {/* Modal portal */}
      {modal}
    </div>
  );
}

export default AddHabitForm;
