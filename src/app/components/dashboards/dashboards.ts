import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, User } from '../../services/auth.service';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-dashboards',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboards.html',
  styleUrls: ['./dashboards.scss']
})
export class Dashboards implements OnInit {
  tab = 'Dashboard';
  
  private authService = inject(AuthService);
  private router = inject(Router);
  private http = inject(HttpClient);
  
  public currentUser$: Observable<User | null> = this.authService.currentUser$;

  ngOnInit(): void {
    this.authService.checkSessionExpiration();
  }

  getSliderPosition() {
    switch (this.tab) {
      case 'Dashboard':
        return 'translateX(0%)';
      case 'Financeiro':
        return 'translateX(100%)';
      default:
        return 'translateX(0%)';
    }
  }
}
