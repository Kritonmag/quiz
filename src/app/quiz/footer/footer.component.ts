import { Component, input } from '@angular/core';
import { QuizContent } from '../quiz-content';

@Component({
  selector: 'app-footer', standalone: true,
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {
  readonly data = input.required<QuizContent['footer']>();
}
