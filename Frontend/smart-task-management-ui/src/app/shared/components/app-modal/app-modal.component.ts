
import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output
} from '@angular/core';
import { CommonModule } from '@angular/common';

type ModalSize = 'md' | 'lg' | 'xl' | 'xxl';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app-modal.component.html',
  styleUrl: './app-modal.component.scss'
})
export class AppModalComponent {

  @Input() open = false;

  @Input() title = '';
  @Input() subtitle = '';

  // Extra-large is the default for entry/edit forms.
  @Input() size: ModalSize = 'xl';

  @Input() showCloseButton = true;
  @Input() closeOnBackdrop = true;
  @Input() closeOnEscape = true;

  @Output() closed = new EventEmitter<void>();

  onBackdropClick(event: MouseEvent): void {
    if (
      this.closeOnBackdrop &&
      event.target === event.currentTarget
    ) {
      this.close();
    }
  }

  close(): void {
    this.closed.emit();
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscape(event: KeyboardEvent): void {
    if (this.open && this.closeOnEscape) {
      event.preventDefault();
      this.close();
    }
  }
}
