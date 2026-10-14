import { Component, input } from '@angular/core';

@Component({
  selector: 'app-button',
  standalone: true,
  host: { '[class]': '"button-host button-host--" + variant()' },
  template: `<button class="quiz-button" type="button">{{ label() }}</button>`
})
export class ButtonComponent {
  readonly label = input.required<string>();
  readonly variant = input<'red' | 'white'>('red');
}
