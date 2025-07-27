import { Routes } from '@angular/router';
import { Main } from './components/main/main'
import { Login } from './components/login/login'
import { Register } from './components/register/register'
import { PasswordReset } from './components/password-reset/password-reset-new'
import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';

export const routes: Routes = [
    {
        path: '',
        component: Main,
        canActivate: [authGuard]
    },
    {
        path: 'main',
        component: Main,
        canActivate: [authGuard]
    },
    {
        path: 'login',
        component: Login,
        canActivate: [guestGuard]
    },
    {
        path: 'register',
        component: Register,
        canActivate: [guestGuard]
    },
    {
        path: 'password-reset',
        component: PasswordReset,
        canActivate: [guestGuard]
    },
];
