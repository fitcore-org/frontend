import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, User } from '../../services/auth.service';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './main.html',
  styleUrls: ['./main.scss']
})
export class Main implements OnInit {
  tab = 'alunos';
  
  private authService = inject(AuthService);
  private router = inject(Router);
  
  public currentUser$: Observable<User | null> = this.authService.currentUser$;

  ngOnInit(): void {
    // Verificar se o usuário está autenticado
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    
    // Verificar se a sessão expirou
    this.authService.checkSessionExpiration();
  }

  getSliderPosition() {
    switch (this.tab) {
      case 'alunos':
        return 'translateX(0%)';
      case 'colaboradores':
        return 'translateX(100%)';
      case 'financeiro':
        return 'translateX(200%)';
      default:
        return 'translateX(0%)';
    }
  }
}
