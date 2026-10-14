import { Component, input } from '@angular/core';
import { ButtonComponent } from '../../components/button/button.component';
import { QuizContent } from '../quiz-content';

@Component({
  selector: 'app-final-cta', standalone: true, imports: [ButtonComponent],
  templateUrl: './final-cta.component.html',
  styleUrl: './final-cta.component.css'
})
export class FinalCtaComponent { readonly data = input.required<QuizContent['finalCta']>(); }
