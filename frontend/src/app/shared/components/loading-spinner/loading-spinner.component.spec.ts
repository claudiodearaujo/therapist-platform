import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoadingSpinnerComponent } from './loading-spinner.component';

describe('LoadingSpinnerComponent', () => {
  let component: LoadingSpinnerComponent;
  let fixture: ComponentFixture<LoadingSpinnerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadingSpinnerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LoadingSpinnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('default values', () => {
    it('should have default size as md', () => {
      expect(component.size).toBe('md');
    });

    it('should have overlay as false by default', () => {
      expect(component.overlay).toBe(false);
    });

    it('should have empty message by default', () => {
      expect(component.message).toBe('');
    });
  });

  describe('input properties', () => {
    it('should accept sm size', () => {
      component.size = 'sm';
      fixture.detectChanges();
      expect(component.size).toBe('sm');
    });

    it('should accept lg size', () => {
      component.size = 'lg';
      fixture.detectChanges();
      expect(component.size).toBe('lg');
    });

    it('should accept overlay true', () => {
      component.overlay = true;
      fixture.detectChanges();
      expect(component.overlay).toBe(true);
    });

    it('should accept custom message', () => {
      component.message = 'Carregando...';
      fixture.detectChanges();
      expect(component.message).toBe('Carregando...');
    });
  });
});
