import { Directive } from '@angular/core';
import { BrnSheetTrigger } from '@spartan-ng/brain/sheet';
import { classes } from '@spartan-ng/helm/utils';

@Directive({
	selector: 'button[hlmSheetTrigger]',
	exportAs: 'hlmSheetTrigger',
	hostDirectives: [{ directive: BrnSheetTrigger, inputs: ['id', 'side', 'type'] }],
	host: { 'data-slot': 'sheet-trigger' },
})
export class HlmSheetTrigger {
	constructor() {
		classes(() => 'cursor-pointer');
	}
}
