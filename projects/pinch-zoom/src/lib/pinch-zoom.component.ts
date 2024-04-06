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
  private top = 0;

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

  private setup(): void {
    // log the size of the container and the image to console
    const { clientHeight, clientWidth } = this.container()!.nativeElement;
    const { naturalHeight, naturalWidth } = this.image()!.nativeElement;
    // calculate the scale factor to ensure image fits in container using matrix
    this.scale = Math.min(clientWidth / naturalWidth, clientHeight / naturalHeight);
    this.originalScale = this.scale;
    // apply the scale factor to the image
    this.left = (clientWidth - naturalWidth) / 2;
    this.top = (clientHeight - naturalHeight) / 2;

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

    this.image()!.nativeElement.style.transform = `rotate(0) translate(${this.left}px, ${this.top}px) scale(${this.scale}, ${this.scale})`;
  }
}
