import { Routes } from '@angular/router';
import { Main } from './components/main/main'
import { Login } from './components/login/login'

export const routes: Routes = [
    {
        path: '',
        component: Main
    },
    {
        path: 'login',
        component: Login
    },

];
