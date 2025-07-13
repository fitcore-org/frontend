import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-header',
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header {
  private router = inject(Router);
  private authService = inject(AuthService);
  
  public modalMenu: boolean = false;
  public isAuthenticated$: Observable<boolean> = this.authService.isAuthenticated$;
  public currentUser$: Observable<User | null> = this.authService.currentUser$;
  public setModalMenu(): void {
    this.modalMenu = !this.modalMenu;
  }
  
  public toLogin(): void {
    this.router.navigate(['/login']);
  }
  
  public toHome(): void {
    this.router.navigate(['']);
  }
  
  public logout(): void {
    this.authService.logout();
  }
}
