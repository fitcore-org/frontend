import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  id: number;
  name: string;
  email: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.checkStoredAuth();
      this.startSessionCheck();
    }
  }

  private checkStoredAuth(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');
    
    if (token && userData && this.isTokenValid(token)) {
      const user = JSON.parse(userData);
      this.currentUserSubject.next(user);
      this.isAuthenticatedSubject.next(true);
    } else {
      // Limpar dados inválidos sem redirecionar
      this.clearAuthData();
    }
  }

  private isTokenValid(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp > currentTime;
    } catch {
      return false;
    }
  }

  public login(authResponse: AuthResponse): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const user: User = {
      id: authResponse.id,
      name: authResponse.name,
      email: authResponse.email,
      role: authResponse.role
    };

    localStorage.setItem('auth_token', authResponse.token);
    localStorage.setItem('user_data', JSON.stringify(user));
    
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 6);
    localStorage.setItem('auth_expiration', expirationDate.toISOString());

    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
  }

  private clearAuthData(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      localStorage.removeItem('auth_expiration');
    }
    
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  public logout(): void {
    this.clearAuthData();
    this.router.navigate(['/login']);
  }

  public getToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    return localStorage.getItem('auth_token');
  }

  public getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  public isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  public forceSetAuthState(user: User): void {
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
  }

  private startSessionCheck(): void {

    if (isPlatformBrowser(this.platformId)) {
      setInterval(() => {
        this.checkSessionExpiration();
      }, 5 * 60 * 1000);
    }
  }

  public checkSessionExpiration(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    
    const expirationDate = localStorage.getItem('auth_expiration');
    if (expirationDate && new Date() > new Date(expirationDate)) {
      this.logout();
    }
  }
}
