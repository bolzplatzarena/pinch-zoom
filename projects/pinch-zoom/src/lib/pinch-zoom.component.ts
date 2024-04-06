import {
  Component,
  contentChild,
  effect,
  ElementRef,
  HostListener,
  OnDestroy,
  viewChild,
} from '@angular/core';
import { PinchZoomService } from './pinch-zoom.service';

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
  providers: [PinchZoomService]
})
export class PinchZoomComponent implements OnDestroy {
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

  constructor(private readonly pinchZoomService: PinchZoomService) {
    effect(() => {
      this.image()!.nativeElement.addEventListener('load', () => {
        this.setup();
      });
    });
  }

  ngOnDestroy(): void {
    this.pinchZoomService.destroy();
  }

  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent): void {
    this.scale += event.deltaY * 0.01;
    this.limitScale();
    this.moveTopLeft();
    this.update();
  }

  @HostListener('mousedown', ['$event'])
  @HostListener('touchstart', ['$event'])
  onBeginMove(event: UIEvent): void {
    const { clientX, clientY } = this.getPositionFor(event, 0);
    const elementPosition = this.container().nativeElement.getBoundingClientRect()
    this.startX = clientX - elementPosition.left;
    this.startY = clientY - elementPosition.top;

    this.originalLeft = this.left;
    this.originalTop = this.top;
  }

  @HostListener('mouseup')
  @HostListener('touchend')
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
    console.log('moving');
    const { clientX, clientY } = this.getPositionFor(event, 0);
    const left = clientX - this.container().nativeElement.getBoundingClientRect().left;
    const top = clientY - this.container().nativeElement.getBoundingClientRect().top;

    this.left = this.originalLeft + (left - this.startX!);
    this.top = this.originalTop + (top - this.startY!);

    this.update();
  }

  private setup(): void {
    this.image().nativeElement.draggable = false;

    // log the size of the container and the image to console
    const { clientHeight, clientWidth } = this.container()!.nativeElement;
    const { naturalHeight, naturalWidth } = this.image()!.nativeElement;
    // calculate the scale factor to ensure image fits in container using matrix
    this.scale = Math.min(clientWidth / naturalWidth, clientHeight / naturalHeight);
    this.originalScale = this.scale;
    // apply the scale factor to the image
    this.left = (clientWidth - naturalWidth) / 2;
    this.originalLeft = this.left;
    this.top = (clientHeight - naturalHeight) / 2;
    this.originalTop = this.top;

    this.update();
  }

  private moveTopLeft(): void {
    const { clientHeight, clientWidth } = this.container()!.nativeElement;
    const { naturalHeight, naturalWidth } = this.image()!.nativeElement;

    // bind to top left
    this.left = (clientWidth * (this.scale / this.originalScale) - naturalWidth) / 2;
    this.top = (clientHeight * (this.scale / this.originalScale) - naturalHeight) / 2;
  }


  private limitScale(): void {
    if(this.scale < this.originalScale){
      this.scale = this.originalScale;
    }
    if(this.scale > config.maxScale){
      this.scale = config.maxScale;
    }
  }

  private update(): void {
    this.limitScale();
    this.limitPosition();

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

    const imgOffsetTop = (clientHeight * (this.scale / this.originalScale) - naturalHeight) / 2;
    const imgOffsetLeft = (clientWidth * (this.scale / this.originalScale) - naturalWidth) / 2;

    if(this.top > imgOffsetTop){
      this.top = imgOffsetTop;
    } else if (scaledImgHeight + Math.abs(imgOffsetTop) - clientHeight + this.top < 0) {
      this.top = -(scaledImgHeight + Math.abs(imgOffsetTop) - clientHeight);
    }

    if(this.left > imgOffsetLeft){
      this.left = imgOffsetLeft;
    } else if (naturalWidth * this.scale + Math.abs(imgOffsetLeft) - clientWidth + this.left < 0) {
      this.left = -(naturalWidth * this.scale + Math.abs(imgOffsetLeft) - clientWidth);
    }
  }
}

function isMouseEvent(event: UIEvent): event is MouseEvent {
  return event.type === 'mousedown' || event.type === 'mousemove';
}

function isTouchEvent(event: UIEvent): event is TouchEvent {
  return event.type === 'touchstart' || event.type === 'touchmove';
}
