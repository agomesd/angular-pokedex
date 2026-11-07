import { Component, input } from '@angular/core';

@Component({
  selector: 'app-pokeball-spinner',
  templateUrl: './pokeball-spinner.component.html',
  host: {
    class: 'pointer-events-none inline-flex',
    'aria-hidden': 'true',
  },
})
export class PokeballSpinner {
  readonly spinning = input(true);
  readonly size = input<'md' | 'lg'>('md');
}
