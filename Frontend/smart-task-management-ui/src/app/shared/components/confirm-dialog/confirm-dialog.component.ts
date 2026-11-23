
import {
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { AppModalComponent } from '../app-modal/app-modal.component';

type ConfirmVariant = 'danger' | 'primary' | 'warning';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [
    CommonModule,
    AppModalComponent
  ],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss'
})
export class ConfirmDialogComponent {

  @Input() open = false;

  @Input() title = 'Are you sure?';
  @Input() message = 'Please confirm that you want to continue.';

  @Input() confirmText = 'Confirm';
  @Input() cancelText = 'Cancel';

  @Input() confirmVariant: ConfirmVariant = 'danger';

  @Input() loading = false;

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  cancel(): void {
    if (this.loading) {
      return;
    }

    this.open = false;
    this.cancelled.emit();
  }

  confirm(): void {
    if (this.loading) {
      return;
    }

    // The parent closes the dialog after the operation succeeds.
    this.confirmed.emit();
  }
}
