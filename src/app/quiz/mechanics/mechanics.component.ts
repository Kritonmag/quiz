import { Component, input } from '@angular/core';
import { QuizContent } from '../quiz-content';

@Component({
  selector: 'app-mechanics', standalone: true,
  templateUrl: './mechanics.component.html',
  styleUrl: './mechanics.component.css'
})
export class MechanicsComponent { readonly data = input.required<QuizContent['mechanics']>(); }
