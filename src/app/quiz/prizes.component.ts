import { Component, input } from '@angular/core';
import { ButtonComponent } from '../components/button/button.component';
import { QuizContent } from './quiz-content';

@Component({
  selector: 'app-prizes', standalone: true, imports: [ButtonComponent],
  template: `
    <section class="prizes" id="prizes" aria-labelledby="prizes-title">
      <div class="prizes-layout container">
        <div class="prizes-copy">
          <p class="eyebrow">{{ data().eyebrow }}</p>
          <h2 id="prizes-title">{{ data().titleFirst }} <span>{{ data().titleSecond }}</span></h2>
          <p class="prizes-intro">{{ data().intro }}</p>
          <ul class="prizes-rules">
            @for (rule of data().rules; track rule.id) {
              <li><img src="assets/figma/prizes-done-round-1-315.svg" alt=""><span>{{ rule.text }}</span></li>
            }
          </ul>
          <app-button class="prizes-cta" [label]="data().cta" />
        </div>
        <div class="prize-cards">
          @for (card of data().cards; track card.id) {
            <article class="prize-card" [class.prize-card--main]="card.id === 'main'">
              @if (card.id === 'main') {
                <div class="prize-photo"><img [src]="card.illustration" [alt]="card.illustrationAlt"></div>
              }
              <div class="prize-card-copy">
                <p class="prize-label"><span class="desktop-label">{{ card.label }}</span><span class="mobile-label">{{ card.labelMobile || card.label }}</span></p>
                <div class="prize-message">
                  <h3>{{ card.titleFirst }} <span>{{ card.titleSecond }}</span></h3>
                  <p>{{ card.description }}</p>
                </div>
              </div>
              @if (card.id !== 'main') {
                <picture class="prize-illustration"><source media="(min-width: 769px)" [srcset]="card.illustrationDesktop"><img [src]="card.illustration" [alt]="card.illustrationAlt"></picture>
              }
            </article>
          }
        </div>
      </div>
    </section>
  `
})
export class PrizesComponent { readonly data = input.required<QuizContent['prizes']>(); }
