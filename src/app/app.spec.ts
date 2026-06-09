import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    window.localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the Fit Track Pro dashboard', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Tableau de bord quotidien');
    expect(compiled.querySelector('.health-message')?.textContent).toContain('deshydratation');
  });

  it('should add activities and update computed indicators', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    await fixture.whenStable();

    addActivity(fixture.nativeElement as HTMLElement, 'Course', 'SPORT', '620');
    fixture.detectChanges();

    addActivity(fixture.nativeElement as HTMLElement, 'Eau', 'HYDRATATION', '1600');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.metric-sport strong')?.textContent?.trim()).toBe('620');
    expect(compiled.querySelector('.metric-water strong')?.textContent?.trim()).toBe('1600');
    expect(compiled.querySelector('.metric-balance strong')?.textContent?.trim()).toBe('1380');
    expect(compiled.querySelector('.health-message')?.textContent).toContain('Objectif Santé Atteint');
    expect(compiled.querySelectorAll('.activity-entry')).toHaveLength(2);
  });
});

function addActivity(
  element: HTMLElement,
  name: string,
  type: 'SPORT' | 'HYDRATATION',
  value: string,
): void {
  const nameInput = element.querySelector<HTMLInputElement>('#activity-name');
  const typeSelect = element.querySelector<HTMLSelectElement>('#activity-type');
  const valueInput = element.querySelector<HTMLInputElement>('#activity-value');
  const form = element.querySelector<HTMLFormElement>('.activity-form');

  if (nameInput === null || typeSelect === null || valueInput === null || form === null) {
    throw new Error('Formulaire introuvable.');
  }

  nameInput.value = name;
  typeSelect.value = type;
  valueInput.value = value;
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}
