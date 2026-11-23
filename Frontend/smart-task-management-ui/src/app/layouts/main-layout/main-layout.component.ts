
import { Component, ElementRef, HostListener, inject } from '@angular/core';
import {
  Router,
  RouterOutlet,
  RouterLinkActive,
  RouterLink
} from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent {

  readonly auth = inject(AuthService);

  private readonly router = inject(Router);
  private readonly elementRef = inject(ElementRef);

  userMenuOpen = false;

  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
  }

  closeUserMenu(): void {
    this.userMenuOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const clickedInside = this.elementRef.nativeElement.contains(
      event.target
    );

    if (!clickedInside) {
      this.closeUserMenu();
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.closeUserMenu();
  }

  logout(): void {
    this.closeUserMenu();

    this.auth.logout().subscribe({
      next: () => this.router.navigate(['/auth/login']),
      error: () => this.router.navigate(['/auth/login'])
    });
  }
}
