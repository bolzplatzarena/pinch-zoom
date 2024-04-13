import {
  Component,
  contentChild,
  effect,
  ElementRef,
  HostListener,
  viewChild,
} from '@angular/core';

const config = {
  maxScale: 10,
}

@Component({
  selector: 'bpa-pinch-zoom',
  standalone: true,
  imports: [],
  template: `
    <div #container style="display: block; width: 100%; height: 100%;">
      <ng-content></ng-content>
    </div>
  `,
  styles: ``,
  host: {
    style: 'display: block; width: 100%; height: 100%;'
  },
})
export class PinchZoomComponent {
  private readonly image = contentChild.required<ElementRef<HTMLImageElement>>('img');
  private readonly container = viewChild.required<ElementRef<HTMLDivElement>>('container');

  private originalScale = 1;
  private scale = 1;
  private left = 0;
  private originalLeft = 0;
  private top = 0;
  private originalTop = 0;

  private startX : number | null = null;
  private startY : number | null = null;

  constructor() {
    effect(() => {
      this.image()!.nativeElement.addEventListener('load', () => {
        this.setup();
      });
    });
  }

  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent): void {
    const oldScale = this.scale;
    this.scale += event.deltaY * 0.01;
    this.limitScale();
    this.moveImage(event, oldScale);
    this.updateImageElement();
  }

  @HostListener('mousedown', ['$event'])
  @HostListener('touchstart', ['$event'])
  onBeginMove(event: UIEvent): void {
    const { clientX, clientY } = this.getPositionFor(event, 0);
    const elementPosition = this.container().nativeElement.getBoundingClientRect();
    this.startX = clientX - elementPosition.left;
    this.startY = clientY - elementPosition.top;

    this.originalLeft = this.left;
    this.originalTop = this.top;
  }

  // it doesn't matter where the mouse is, we just want to stop moving
  @HostListener('document:mouseup')
  @HostListener('document:touchend')
  onEndMove(): void {
    this.startX = null;
    this.startY = null;
  }

  @HostListener('mousemove', ['$event'])
  @HostListener('pan', ['$event'])
  onMove(event: UIEvent): void {
    if(this.scale === this.originalScale || this.startX === null || this.startY === null){
      return;
    }

    const { clientX, clientY } = this.getPositionFor(event, 0);
    const left = clientX - this.container().nativeElement.getBoundingClientRect().left;
    const top = clientY - this.container().nativeElement.getBoundingClientRect().top;

    this.left = this.originalLeft + (left - this.startX!);
    this.top = this.originalTop + (top - this.startY!);

    this.updateImageElement();
  }

  private setup(): void {
    this.image().nativeElement.draggable = false;

    // log the size of the container and the image to console
    const { clientHeight, clientWidth } = this.container()!.nativeElement;
    const { naturalHeight, naturalWidth } = this.image()!.nativeElement;
    // calculate the scale factor to ensure image fits in container using matrix
    this.scale = Math.min(clientWidth / naturalWidth, clientHeight / naturalHeight);
    this.originalScale = this.scale;

    this.updateImageElement();
    this.originalLeft = this.left;
    this.originalTop = this.top;
  }

  // limit the scale to a minimum of the initial scale and a maximum of 10
  // this means you can only zoom in
  private limitScale(): void {
    if(this.scale < this.originalScale){
      this.scale = this.originalScale;
    }
    if(this.scale > config.maxScale){
      this.scale = config.maxScale;
    }
  }

  private updateImageElement(): void {
    this.limitScale();
    this.limitPosition();

    this.image()!.nativeElement.style.transformOrigin = '0 0';
    this.image()!.nativeElement.style.transform = `rotate(0) translate(${this.left}px, ${this.top}px) scale(${this.scale}, ${this.scale})`;
  }

  private getPositionFor(event: UIEvent, index: number): { clientX: number; clientY: number } {
    let clientX = 0;
    let clientY = 0;

    if (isTouchEvent(event)) {
      clientX = event.touches[index].clientX;
      clientY = event.touches[index].clientY;
    } else if (isMouseEvent(event)) {
      clientX = event.clientX;
      clientY = event.clientY;
    } else if (isPositionEvent(event)) {
      clientX = event.clientX;
      clientY = event.clientY;
    }

    return {
      clientX,
      clientY,
    };
  }

  private limitPosition() {
    const { clientHeight, clientWidth } = this.container()!.nativeElement;
    const { naturalHeight, naturalWidth } = this.image()!.nativeElement;

    const scaledImgHeight = naturalHeight * this.scale;
    const scaledImgWidth = naturalWidth * this.scale;

    const maxTop = 0;
    const minTop = -(scaledImgHeight - clientHeight);
    const maxLeft = 0;
    const minLeft = -(scaledImgWidth - clientWidth);

    if(this.top > maxTop){
      this.top = maxTop;
    } else if (this.top < minTop) {
      this.top = minTop;
    }

    if(this.left > maxLeft){
      this.left = maxLeft;
    } else if (this.left < minLeft) {
      this.left = minLeft;
    }
  }

  private moveImage(event: UIEvent, oldScale: number): void {
    // we try to find the position on the original image and move this position to the same position on the image for this new scale
    const { clientX, clientY } = this.getPositionFor(event, 0);
    const elementPosition = this.container().nativeElement.getBoundingClientRect();

    const x = (clientX - elementPosition.left);
    const y = (clientY - elementPosition.top);
    const dx = x / oldScale;
    const dy = y / oldScale;

    const leftOnOriginal = -(this.left / oldScale) + dx;
    const topOnOriginal = -(this.top / oldScale) + dy;

    this.left =  -(leftOnOriginal * this.scale) + x;
    this.top = -(topOnOriginal * this.scale) + y;
  }
}

function isMouseEvent(event: UIEvent): event is MouseEvent {
  return event.type === 'mousedown' || event.type === 'mousemove';
}

function isTouchEvent(event: UIEvent): event is TouchEvent {
  return event.type === 'touchstart' || event.type === 'touchmove';
}

function isPositionEvent(event: UIEvent): event is UIEvent & { clientX: number; clientY: number } {
  return (event as any).clientX !== undefined;
}
