import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input, OnChanges } from '@angular/core';

@Component({
  selector: 'ds-form-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ds-form-field" [class.ds-form-field--error]="!!error">
      <label class="ds-form-field__label" [attr.for]="forId || null">
        {{ label }}
        @if (required) {
          <span class="ds-form-field__required" aria-hidden="true">*</span>
        }
      </label>

      <div class="ds-form-field__control">
        <ng-content />
      </div>

      @if (error) {
        <p class="ds-form-field__message ds-form-field__message--error" role="alert">
          <i class="pi pi-exclamation-circle" aria-hidden="true"></i>
          {{ error }}
        </p>
      } @else if (hint) {
        <p class="ds-form-field__message">{{ hint }}</p>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }

    .ds-form-field {
      display: grid;
      gap: 6px;
    }

    .ds-form-field__label {
      color: var(--text-primary);
      font-size: 13px;
      font-weight: 600;
      line-height: 18px;
    }

    .ds-form-field__required {
      margin-left: 2px;
      color: var(--error);
    }

    .ds-form-field__control {
      display: block;
    }

    .ds-form-field__control ::ng-deep input,
    .ds-form-field__control ::ng-deep textarea,
    .ds-form-field__control ::ng-deep select {
      width: 100%;
      min-height: 40px;
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-sm);
      color: var(--text-primary);
      background: var(--surface);
      transition:
        border-color var(--motion-fast) var(--ease-standard),
        box-shadow var(--motion-fast) var(--ease-standard);
    }

    .ds-form-field__control ::ng-deep input:focus,
    .ds-form-field__control ::ng-deep textarea:focus,
    .ds-form-field__control ::ng-deep select:focus {
      outline: none;
      border-color: var(--focus);
      box-shadow: 0 0 0 3px rgba(71, 119, 98, 0.15);
    }

    .ds-form-field--error .ds-form-field__control ::ng-deep input,
    .ds-form-field--error .ds-form-field__control ::ng-deep textarea,
    .ds-form-field--error .ds-form-field__control ::ng-deep select {
      border-color: var(--error);
    }

    .ds-form-field__message {
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 0;
      color: var(--text-muted);
      font-size: 12px;
      line-height: 16px;
    }

    .ds-form-field__message--error { color: var(--error); }
  `]
})
export class DsFormFieldComponent implements AfterViewInit, OnChanges {
  @Input({ required: true }) label = '';
  @Input() forId = '';
  @Input() hint = '';
  @Input() error = '';
  @Input() required = false;

  private viewReady = false;

  constructor(private readonly host: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    this.viewReady = true;
    queueMicrotask(() => this.syncAccessibleName());
  }

  ngOnChanges(): void {
    if (this.viewReady) {
      queueMicrotask(() => this.syncAccessibleName());
    }
  }

  private syncAccessibleName(): void {
    const control = this.host.nativeElement.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      'input:not([type="hidden"]), textarea, select'
    );

    if (!control || control.labels?.length || control.hasAttribute('aria-label') || control.hasAttribute('aria-labelledby')) {
      return;
    }

    control.setAttribute('aria-label', this.label);
  }
}
