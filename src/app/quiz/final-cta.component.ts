import { Component, input } from '@angular/core';
import { ButtonComponent } from '../components/button/button.component';
import { QuizContent } from './quiz-content';

@Component({
  selector: 'app-final-cta', standalone: true, imports: [ButtonComponent],
  template: `
    <section class="final-cta" aria-labelledby="final-title">
      <div class="final-inner container">
        <div class="final-copy">
          <h2 id="final-title">{{ data().titleFirst }} <span class="final-brand">{{ data().titleBrand }}</span><br>{{ data().titleSecond }}</h2>
          <p>{{ data().description }}</p>
          <app-button [label]="data().cta" />
        </div>
        <img class="final-pattern final-pattern--one" src="assets/figma/final-cta-group21-1-800.svg" alt="" aria-hidden="true">
        <img class="final-pattern final-pattern--two" src="assets/figma/final-cta-group18-1-806.svg" alt="" aria-hidden="true">
        <img class="final-person" src="assets/figma/final-cta-electromechanic-cutout-1-2074.png" [alt]="data().imageAlt">
      </div>
    </section>
  `
})
export class FinalCtaComponent { readonly data = input.required<QuizContent['finalCta']>(); }
