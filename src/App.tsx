// src/App.tsx
import { useState, useEffect } from 'react';
import type {
  Habit,
  HabitFormData,
  EditHabitData,
  FilterType,
  SortType,
  DayOfWeek,
} from './types/Habit';
import type { Theme } from './types/Theme';
import {
  generateId,
  saveHabitsToStorage,
  loadHabitsFromStorage,
  createEmptyHabitDays,
  calculateStreak,
  fetchHabitsFromAPI,
  createHabitAPI,
  updateHabitAPI,
  deleteHabitAPI,
} from './utils/habitUtils';
import { saveThemeToStorage, loadThemeFromStorage } from './utils/themeUtils';
import Header from './components/Header';
import AddHabitForm from './components/AddHabitForm';
import HabitsFilter from './components/HabitsFilter';
import HabitsList from './components/HabitsList';
import EditHabitModal from './components/EditHabitModal';
import './App.css';
import './styles/components/Button.css';
import './styles/components/Modal.css';

// ✅ Correct relative path (App.tsx is in src/, mock/ is also in src/)
import { MOCK_HABITS } from './mock/habits';

function App() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitsLoaded, setHabitsLoaded] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('created');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [theme, setTheme] = useState<Theme>('light');
  const [themeLoaded, setThemeLoaded] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Load habits (tries API first then localStorage then mock)
  useEffect(() => {
    (async () => {
      const apiHabits = await fetchHabitsFromAPI();
      if (apiHabits && apiHabits.length) {
        setHabits(apiHabits as Habit[]);
      } else {
        const savedHabits = await loadHabitsFromStorage();
        setHabits(savedHabits.length ? savedHabits : MOCK_HABITS);
      }
      setHabitsLoaded(true);
    })();
  }, []);

  // Load theme
  useEffect(() => {
    (async () => {
      const savedTheme = await loadThemeFromStorage();
      setTheme(savedTheme);
      setThemeLoaded(true);
    })();
  }, []);

  // Persist habits (local + API sync handled inside saveHabitsToStorage)
  useEffect(() => {
    if (habitsLoaded) {
      (async () => {
        await saveHabitsToStorage(habits);
      })();
    }
  }, [habits, habitsLoaded]);

  // Apply + persist theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (themeLoaded) {
      (async () => {
        await saveThemeToStorage(theme);
      })();
    }
  }, [theme, themeLoaded]);

  // ✅ Add with new form fields
  const addHabit = async (habitData: HabitFormData): Promise<void> => {
    const newHabit: Habit = {
      id: generateId(),
      name: habitData.name,
      frequency: habitData.frequency,
      category: habitData.category,
      startDate: habitData.startDate,
      completedDays: createEmptyHabitDays(),
      createdAt: new Date().toISOString(),
      totalDays: 0,
      failureDays: 0,
    };

    // Try to create on API; if success, use returned value
    const created = await createHabitAPI(newHabit as any);
    if (created) {
      setHabits(prev => [...prev, created as Habit]);
    } else {
      setHabits(prev => [...prev, newHabit]);
    }
  };

  const updateHabit = async (editData: EditHabitData): Promise<void> => {
    setHabits(prev =>
      prev.map(habit => (habit.id === editData.id ? { ...habit, name: editData.name } : habit))
    );

    // attempt API update
    await updateHabitAPI(editData.id, { name: editData.name } as any);

    setEditingHabit(null);
  };

  const deleteHabit = async (habitId: string): Promise<void> => {
    setHabits(prev => prev.filter(habit => habit.id !== habitId));
    setShowDeleteConfirm(null);

    // attempt remote delete
    await deleteHabitAPI(habitId);
  };

  const toggleHabitDay = async (habitId: string, day: DayOfWeek): Promise<void> => {
    setHabits(prev =>
      prev.map(habit =>
        habit.id === habitId
          ? {
              ...habit,
              completedDays: {
                ...habit.completedDays,
                [day]: !habit.completedDays[day],
              },
            }
          : habit
      )
    );

    // attempt to patch the habit remotely with completedDays
    const habit = habits.find(h => h.id === habitId);
    if (habit) {
      const updated = {
        ...habit,
        completedDays: {
          ...habit.completedDays,
          [day]: !habit.completedDays[day],
        },
      } as any;
      await updateHabitAPI(habitId, updated);
    }
  };

  const resetAllProgress = (): void => {
    setHabits(prev =>
      prev.map(habit => ({
        ...habit,
        completedDays: createEmptyHabitDays(),
      }))
    );
  };

  const toggleTheme = (): void => {
    setTheme((prev: Theme) => (prev === 'light' ? 'dark' : 'light'));
  };

  const filteredAndSortedHabits = habits
    .filter(habit => {
      const matchesSearch = habit.name.toLowerCase().includes(searchTerm.toLowerCase());
      const completedDaysCount = Object.values(habit.completedDays).filter(Boolean).length;

      switch (filter) {
        case 'completed':
          return matchesSearch && completedDaysCount === 7;
        case 'incomplete':
          return matchesSearch && completedDaysCount < 7;
        default:
          return matchesSearch;
      }
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'streak':
          return calculateStreak(b) - calculateStreak(a);
        case 'created':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  return (
    <div className="app">
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        onResetProgress={resetAllProgress}
        totalHabits={habits.length}
        completedHabits={
          habits.filter(h => Object.values(h.completedDays).filter(Boolean).length === 7).length
        }
      />

      <main className="main-content">
        <AddHabitForm onAddHabit={addHabit} />

        <HabitsFilter
          filter={filter}
          onFilterChange={setFilter}
          sortBy={sortBy}
          onSortChange={setSortBy}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />

        <HabitsList
          habits={filteredAndSortedHabits}
          onToggleDay={toggleHabitDay}
          onEditHabit={setEditingHabit}
          onDeleteHabit={setShowDeleteConfirm}
        />
      </main>

      {editingHabit && (
        <EditHabitModal
          habit={editingHabit}
          onSave={updateHabit}
          onClose={() => setEditingHabit(null)}
        />
      )}

      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="delete-confirm-modal">
            <h3>Delete Habit</h3>
            <p>Are you sure you want to delete this habit? This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(null)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={() => deleteHabit(showDeleteConfirm)}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
