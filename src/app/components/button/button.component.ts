import { Component, input } from '@angular/core';

@Component({
  selector: 'app-button',
  standalone: true,
  host: { '[class]': '"button-host button-host--" + variant()' },
  templateUrl: './button.component.html',
  styleUrl: './button.component.css'
})
export class ButtonComponent {
  readonly label = input.required<string>();
  readonly variant = input<'red' | 'white'>('red');
}
