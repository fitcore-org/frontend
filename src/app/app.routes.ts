import { Routes } from '@angular/router';
import { Main } from './components/main/main'
import { Login } from './components/login/login'
import { Register } from './components/register/register'

export const routes: Routes = [
    {
        path: '',
        component: Main
    },
    {
        path: 'main',
        component: Main
    },
    {
        path: 'login',
        component: Login
    },
    {
        path: 'register',
        component: Register
    },
];
