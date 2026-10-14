import { Component, input } from '@angular/core';
import { ButtonComponent } from '../components/button/button.component';
import { QuizContent } from './quiz-content';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [ButtonComponent],
  template: `
    <header class="site-header">
      <div class="header-inner container">
        <div class="brand">
          <span class="brand-mark"><img src="assets/figma/brand-rzd-logo-I1-1603-2813-15917.png" [alt]="data().brandAlt"></span>
          <span class="brand-text">{{ data().brandText }}</span>
        </div>
        <nav class="desktop-nav" [attr.aria-label]="data().menuLabel">
          @for (item of data().menu; track item.id) {
            <a [href]="item.href" (click)="$event.preventDefault()">{{ item.label }}</a>
          }
        </nav>
        <app-button class="header-cta" [label]="data().cta" />
        <button class="menu-icon" type="button" [attr.aria-label]="data().menuLabel">
          <img src="assets/figma/shared-menu-icon-1-1576.svg" alt="">
        </button>
      </div>
    </header>
  `
})
export class HeaderComponent {
  readonly data = input.required<QuizContent['header']>();
}
