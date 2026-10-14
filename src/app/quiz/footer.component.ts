import { Component, input } from '@angular/core';
import { QuizContent } from './quiz-content';

@Component({
  selector: 'app-footer', standalone: true,
  template: `
    <footer class="site-footer">
      <div class="footer-inner container">
        <div class="brand brand--footer"><span class="brand-mark"><img src="assets/figma/brand-rzd-logo-I1-1603-2813-15917.png" [alt]="data().brandAlt"></span><span class="brand-text">{{ data().brandText }}</span></div>
        <div class="footer-main">
          <div class="footer-about"><h2>{{ data().title }}</h2><p>{{ data().description }}</p></div>
          <div class="footer-contact"><p><strong>{{ data().organizerLabel }}</strong><br>{{ data().organizer }}</p><p><strong>{{ data().supportLabel }}</strong><br>{{ data().support }}</p></div>
        </div>
        <div class="footer-bottom">
          <p>{{ data().copyright }}</p>
          <nav [attr.aria-label]="data().linksLabel">
            @for (item of data().links; track item.id) { <a [href]="item.href" (click)="$event.preventDefault()">{{ item.label }}</a> }
          </nav>
          <div class="social-links">
            @for (item of data().socials; track item.id) { <a [href]="item.href" [attr.aria-label]="item.label" (click)="$event.preventDefault()"><img [src]="item.icon" alt=""></a> }
          </div>
        </div>
      </div>
    </footer>
  `
})
export class FooterComponent { readonly data = input.required<QuizContent['footer']>(); }
