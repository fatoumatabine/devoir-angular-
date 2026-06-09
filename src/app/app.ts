import { DatePipe, DecimalPipe, isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';

type ActivityType = 'SPORT' | 'HYDRATATION';

interface Activity {
  id: string;
  name: string;
  type: ActivityType;
  value: number;
  createdAt: string;
}

const STORAGE_KEY = 'fit-track-pro.activities';
const CALORIE_GOAL = 2000;
const WATER_GOAL = 1500;
const MAX_ACTIVITY_VALUE = 5000;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [DatePipe, DecimalPipe],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly calorieGoal = CALORIE_GOAL;
  protected readonly waterGoal = WATER_GOAL;
  protected readonly maxActivityValue = MAX_ACTIVITY_VALUE;
  protected readonly activities = signal<Activity[]>([]);
  protected readonly errorMessage = signal('');

  protected readonly todaysActivities = computed(() =>
    this.activities().filter((activity) => this.isToday(activity.createdAt)),
  );

  protected readonly totalCalories = computed(() =>
    this.todaysActivities()
      .filter((activity) => activity.type === 'SPORT')
      .reduce((total, activity) => total + activity.value, 0),
  );

  protected readonly totalWater = computed(() =>
    this.todaysActivities()
      .filter((activity) => activity.type === 'HYDRATATION')
      .reduce((total, activity) => total + activity.value, 0),
  );

  protected readonly remainingCalories = computed(() => this.calorieGoal - this.totalCalories());
  protected readonly waterMissing = computed(() => Math.max(this.waterGoal - this.totalWater(), 0));
  protected readonly dehydrationWarning = computed(() => this.totalWater() < this.waterGoal);
  protected readonly healthGoalReached = computed(
    () => this.totalWater() >= this.waterGoal && this.totalCalories() > 500,
  );

  protected readonly activityLog = computed(() =>
    [...this.todaysActivities()].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    ),
  );

  constructor() {
    if (this.isBrowser) {
      this.activities.set(this.loadActivities());
    }

    effect(() => {
      if (this.isBrowser) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.activities()));
      }
    });
  }

  protected addActivity(
    name: string,
    type: string,
    valueText: string,
    form: HTMLFormElement,
  ): void {
    const activityName = name.trim();
    const activityValue = Number(valueText);

    if (activityName === '' || valueText.trim() === '') {
      this.errorMessage.set('Veuillez remplir tous les champs.');
      return;
    }

    if (type !== 'SPORT' && type !== 'HYDRATATION') {
      this.errorMessage.set('Type d activite invalide.');
      return;
    }

    if (!Number.isFinite(activityValue) || activityValue <= 0) {
      this.errorMessage.set('La valeur doit etre superieure a 0.');
      return;
    }

    if (activityValue > this.maxActivityValue) {
      this.errorMessage.set(`La valeur maximale acceptee est ${this.maxActivityValue}.`);
      return;
    }

    const newActivity: Activity = {
      id: `${Date.now()}-${this.activities().length + 1}`,
      name: activityName,
      type,
      value: Math.round(activityValue),
      createdAt: new Date().toISOString(),
    };

    this.activities.update((activities) => [...activities, newActivity]);
    this.errorMessage.set('');
    form.reset();
  }

  protected deleteActivity(id: string): void {
    this.activities.update((activities) => activities.filter((activity) => activity.id !== id));
  }

  private loadActivities(): Activity[] {
    const savedData = window.localStorage.getItem(STORAGE_KEY);

    if (savedData === null) {
      return [];
    }

    try {
      const activities = JSON.parse(savedData);

      if (!Array.isArray(activities)) {
        return [];
      }

      return activities.filter((activity) => this.isValidActivity(activity));
    } catch {
      return [];
    }
  }

  private isValidActivity(activity: unknown): activity is Activity {
    if (typeof activity !== 'object' || activity === null) {
      return false;
    }

    const item = activity as Partial<Activity>;

    return (
      typeof item.id === 'string' &&
      typeof item.name === 'string' &&
      (item.type === 'SPORT' || item.type === 'HYDRATATION') &&
      typeof item.value === 'number' &&
      item.value > 0 &&
      typeof item.createdAt === 'string'
    );
  }

  private isToday(dateText: string): boolean {
    const date = new Date(dateText);
    const today = new Date();

    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  }
}
