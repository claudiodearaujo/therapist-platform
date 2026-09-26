import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DsFormFieldComponent } from './ds-form-field.component';

@Component({
  standalone: true,
  imports: [DsFormFieldComponent],
  template: `
    <ds-form-field label="Busca"><input class="unlinked" /></ds-form-field>
    <ds-form-field label="E-mail" forId="email"><input id="email" /></ds-form-field>
  `,
})
class TestHostComponent {}

describe('DsFormFieldComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestHostComponent] }).compileComponents();
  });

  it('provides an accessible name to an unlinked projected control', async () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    await Promise.resolve();
    const input = fixture.nativeElement.querySelector('.unlinked') as HTMLInputElement;
    expect(input.getAttribute('aria-label')).toBe('Busca');
  });

  it('keeps an explicit label association as the accessible name', async () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    await Promise.resolve();
    const input = fixture.nativeElement.querySelector('#email') as HTMLInputElement;
    expect(input.labels?.[0]?.textContent?.trim()).toBe('E-mail');
    expect(input.hasAttribute('aria-label')).toBeFalse();
  });
});
