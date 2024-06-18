import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PinchZoomComponent } from '../../projects/pinch-zoom/src/lib/pinch-zoom.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, PinchZoomComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'pinch-zoom';
}
