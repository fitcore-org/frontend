import { AfterViewInit, Component, ViewChild, ElementRef, inject, ChangeDetectorRef, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, AuthResponse } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login implements AfterViewInit {
  @ViewChild('dumbbellLeft') dumbbellLeft!: ElementRef;
  @ViewChild('dumbbellRight') dumbbellRight!: ElementRef;
  @ViewChild('Email') Email!: ElementRef;
  @ViewChild('Senha') Senha!: ElementRef;
  @ViewChild('EnterB') EnterB!: ElementRef;

  errorMessage: string = '';
  
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private authService = inject(AuthService);
  
  ngAfterViewInit(): void {
    this.animationDumbbellStart();
  }
  
  @HostListener('keydown.enter')
  onEnterPressed(): void {
    this.EnterB.nativeElement.click();
  }

  private animationDumbbellStart(): void {
    this.animateDumbbells();
    setInterval(() => {
      this.animateDumbbells();
    }, 4000);
  }

  private animateDumbbells(): void {
    // Reset dumbbells to original position
    this.dumbbellLeft.nativeElement.classList.remove('lifting');
    this.dumbbellRight.nativeElement.classList.remove('lifting');

    // Left dumbbell lifts first
    setTimeout(() => {
      this.dumbbellLeft.nativeElement.classList.add('lifting');
    }, 200);

    // Right dumbbell lifts after left
    setTimeout(() => {
      this.dumbbellRight.nativeElement.classList.add('lifting');
    }, 600);

    // Both dumbbells come down
    setTimeout(() => {
      this.dumbbellLeft.nativeElement.classList.remove('lifting');
    }, 1500);

    setTimeout(() => {
      this.dumbbellRight.nativeElement.classList.remove('lifting');
    }, 1800);

    // Alternate pattern - right first, then left
    setTimeout(() => {
      this.dumbbellRight.nativeElement.classList.add('lifting');
    }, 2400);

    setTimeout(() => {
      this.dumbbellLeft.nativeElement.classList.add('lifting');
    }, 2800);

    setTimeout(() => {
      this.dumbbellRight.nativeElement.classList.remove('lifting');
      this.dumbbellLeft.nativeElement.classList.remove('lifting');
    }, 3500);
  }
  public async handleSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.errorMessage = '';
    
    const email = this.Email.nativeElement.value.trim();
    const password = this.Senha.nativeElement.value.trim();
    
    if (!email || !password) {
      this.errorMessage = 'Por favor, preencha todos os campos';
      this.cdr.detectChanges();
      return;
    }
    
    const loginData = {
      email,
      password,
    };

    try {
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData)
      });
      
      if (response.ok) {
        const authResponse: AuthResponse = await response.json();
        this.authService.login(authResponse);
        this.router.navigate(['main']);
      } else {
        this.errorMessage = 'Email ou senha incorretos';
        this.cdr.detectChanges();
      }
    } catch (error) {
      this.errorMessage = 'Erro de conexão. Verifique sua internet.';
      this.cdr.detectChanges();
    }
  }
  
  public goToRegister(): void {
    this.router.navigate(['/register']);
  }

  public goToPasswordReset(): void {
    this.router.navigate(['/password-reset']);
  }
}
