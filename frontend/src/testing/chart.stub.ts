import { Component, Input } from '@angular/core';

// These component tests verify application chart data; jsdom does not implement Canvas.
@Component({ selector: 'p-chart', standalone: true, template: '' })
export class ChartStubComponent {
  @Input() type = '';
  @Input() data: unknown;
  @Input() options: unknown;
}
