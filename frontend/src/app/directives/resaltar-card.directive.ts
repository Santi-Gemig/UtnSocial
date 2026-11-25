import { Directive, ElementRef, HostListener, Input, Renderer2, inject } from '@angular/core';

@Directive({
    selector: '[appResaltarCard]',
})
export class ResaltarCardDirective {
    private el = inject(ElementRef);
    private renderer = inject(Renderer2);

    @Input() appResaltarCard = 'rgb(99 102 241 / 0.55)';

    @HostListener('mouseenter')
    onMouseEnter(): void {
        this.renderer.setStyle(
            this.el.nativeElement,
            'borderColor',
            this.appResaltarCard || 'rgb(99 102 241 / 0.55)',
        );
        this.renderer.setStyle(
            this.el.nativeElement,
            'boxShadow',
            '0 18px 40px -12px rgb(99 102 241 / 0.28)',
        );
    }

    @HostListener('mouseleave')
    onMouseLeave(): void {
        this.renderer.removeStyle(this.el.nativeElement, 'borderColor');
        this.renderer.removeStyle(this.el.nativeElement, 'boxShadow');
    }
}