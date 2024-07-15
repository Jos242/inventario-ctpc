import { Component, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { AfterViewInit, ElementRef, Renderer2 } from '@angular/core';


@Component({
  selector: 'app-activo-scan',
  standalone: true,
  imports: [],
  templateUrl: './activo-scan.component.html',
  styleUrl: './activo-scan.component.scss'
})
export class ActivoScanComponent {

  private barcode: string = '';
  private isScanning: boolean = false;
  private timeout: any;
  private readonly barcodePattern = /^\d{4}-\d{4}$/; // Regex pattern for 4 numbers, a dash, and 4 numbers

  constructor(private router: Router, private el: ElementRef, private renderer: Renderer2) {}

  ngAfterViewInit(): void {
    this.startBarcodeAnimation();
    setInterval(() => this.startBarcodeAnimation(), 2000);
  }

  startBarcodeAnimation(): void {
    const barcodeSpans = this.el.nativeElement.querySelectorAll('.animatedSpan');

    barcodeSpans.forEach((span: HTMLElement, i: number) => {
      setTimeout(() => {
        this.renderer.addClass(span, 'highlighted');
      }, 100 * i);
    });

    barcodeSpans.forEach((span: HTMLElement, i: number) => {
      setTimeout(() => {
        this.renderer.removeClass(span, 'highlighted');
      }, 100 * barcodeSpans.length + 20 * i);
    });
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    if (event.key === 'Enter') {
      if (this.barcodePattern.test(this.barcode)) {
        this.redirectToItem(this.barcode);
      }
      this.barcode = ''; // Reset the barcode after attempting to redirect
    } else {
      this.barcode += event.key;
    }

    // Restart the timer
    this.timeout = setTimeout(() => {
      this.barcode = '';
    }, 1000);
  }

  redirectToItem(barcode: string) {
    this.router.navigate(['/activos/', barcode]);
  }
}
