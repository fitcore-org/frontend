import { Routes } from '@angular/router';
import { Dashboards } from './components/dashboards/dashboards'
import { Login } from './components/login/login'
import { Register } from './components/register/register'
import { PasswordReset } from './components/password-reset/password-reset-new'
import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';
import { Alunos } from './components/alunos/alunos';
import { Funcionarios } from './components/funcionarios/funcionarios'
import { Financeiro } from './components/financeiro/financeiro'
import { Treinos } from './components/treinos/treinos'

export const routes: Routes = [
    {
        path: '',
        component: Dashboards,
        canActivate: [authGuard]
    },
    {
        path: 'dashboards',
        component: Dashboards,
        canActivate: [authGuard]
    },
    {
        path: 'alunos',
        component: Alunos,
        canActivate: [authGuard]
    },
    {
        path: 'funcionarios',
        component: Funcionarios,
        canActivate: [authGuard]
    },
    {
        path: 'financeiro',
        component: Financeiro,
        canActivate: [authGuard]
    },
    {
        path: 'treinos',
        component: Treinos,
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
