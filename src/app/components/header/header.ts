import { Component, inject, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);
  
  public modalMenu: boolean = false;
  public modalMenuAuth: boolean = false;
  public isAuthenticated$: Observable<boolean> = this.authService.isAuthenticated$;
  public currentUser$: Observable<User | null> = this.authService.currentUser$;
  public activeRoute: string = 'dashboards';
  
  ngOnInit(): void {
    
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updateActiveRoute(event.url);
      });
    
    this.updateActiveRoute(this.router.url);
  }
  
  private updateActiveRoute(url: string): void {
    if (url.includes('/dashboards')) {
      this.activeRoute = 'dashboards';
    } else if (url.includes('/alunos')) {
      this.activeRoute = 'alunos';
    } else if (url.includes('/funcionarios')) {
      this.activeRoute = 'funcionarios';
    } else if (url.includes('/financeiro')) {
      this.activeRoute = 'financeiro';
    } else if (url.includes('/treinos')) {
      this.activeRoute = 'treinos';
    } else {
      this.activeRoute = 'dashboards';
    }
  }
  
  public setModalMenu(): void {
    this.modalMenu = !this.modalMenu;
  }

  public setModalMenuAuth(): void {
    this.modalMenuAuth = !this.modalMenuAuth;
  }
  
  public toLogin(): void {
    this.router.navigate(['/login']);
  }
  
  public toHome(): void {
    this.router.navigate(['']);
  }
  
  public toDashboards(): void {
    this.activeRoute = 'dashboards';
    this.router.navigate(['/dashboards']);
    this.modalMenuAuth = false;
  }
  
  public toAlunos(): void {
    this.activeRoute = 'alunos';
    this.router.navigate(['/alunos']);
    this.modalMenuAuth = false;
  }
  
  public toFuncionarios(): void {
    this.activeRoute = 'funcionarios';
    this.router.navigate(['/funcionarios']);
    this.modalMenuAuth = false;
  }

  public toFinanceiro(): void {
    this.activeRoute = 'financeiro';
    this.router.navigate(['/financeiro']);
    this.modalMenuAuth = false;
  }

  public toTreinos(): void {
    this.activeRoute = 'treinos';
    this.router.navigate(['/treinos']);
    this.modalMenuAuth = false;
  }
  
  public logout(): void {
    this.authService.logout();
    this.modalMenuAuth = false;
  }
}
