import { Component, input } from '@angular/core';
import { ButtonComponent } from '../components/button/button.component';
import { QuizContent } from './quiz-content';

@Component({
  selector: 'app-hero', standalone: true, imports: [ButtonComponent],
  template: `
    <section class="hero" id="about" aria-labelledby="hero-title">
      <div class="hero-inner container">
        <div class="hero-copy">
          <p class="eyebrow">{{ data().eyebrow }}</p>
          <picture class="hero-title-backdrop" aria-hidden="true">
            <source media="(max-width: 768px)" srcset="assets/figma/hero-frame2131330041-1-275.svg">
            <img src="assets/figma/hero-frame2131330041-1-1596.svg" alt="">
          </picture>
          <h1 id="hero-title"><span>{{ data().titleFirst }}</span><span class="hero-title-second">{{ data().titleSecond }}</span></h1>
          <p class="hero-subtitle">{{ data().subtitle }}</p>
        </div>
        <div class="question-stack">
          <div class="question-card">
            <p class="question-text">{{ data().question.text }}</p>
            <img class="question-stripes" src="assets/figma/shared-subtract-I1-1608-2813-15833.svg" alt="">
            <div class="signalist-clip"><img [src]="data().question.image" [alt]="data().question.imageAlt"></div>
            <div class="question-answers">
              <button type="button" class="answer"><img src="assets/figma/shared-vector4558-stroke-I1-1608-2813-15839.svg" alt="">{{ data().question.yes }}</button>
              <button type="button" class="answer"><img src="assets/figma/shared-union-I1-1608-2813-15845.svg" alt="">{{ data().question.no }}</button>
            </div>
          </div>
        </div>
        <div class="hero-action">
          <p class="hero-ribbon">{{ data().ribbon }}</p>
          <app-button [label]="data().cta" variant="white" />
        </div>
      </div>
    </section>
  `
})
export class HeroComponent { readonly data = input.required<QuizContent['hero']>(); }
