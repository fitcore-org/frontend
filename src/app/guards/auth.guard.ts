import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { isPlatformBrowser } from '@angular/common';
import { map, filter, take } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  // Aguardar a inicialização do AuthService
  return authService.isInitialized$.pipe(
    filter(initialized => initialized), // Aguardar até estar inicializado
    take(1), // Pegar apenas o primeiro valor
    map(() => {
      if (authService.isAuthenticated()) {
        return true;
      } else {
        router.navigate(['/login']);
        return false;
      }
    })
  );
};
