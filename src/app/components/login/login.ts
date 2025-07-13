import { AfterViewInit, Component, ViewChild, ElementRef, inject, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, AuthResponse } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login implements AfterViewInit {
  @ViewChild('halter1') halter1!: ElementRef;
  @ViewChild('halter2') halter2!: ElementRef;
  @ViewChild('halter3') halter3!: ElementRef;
  @ViewChild('halter4') halter4!: ElementRef;
  @ViewChild('Email') Email!: ElementRef;
  @ViewChild('Senha') Senha!: ElementRef;
  
  errorMessage: string = '';
  
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private authService = inject(AuthService);
  
  ngAfterViewInit(): void {
    this.animationHalterStart();
  }

  private animationHalterStart(): void {
    this.animationHalter();
    setInterval(() => {
      this.animationHalter();
    }, 4000);
  }

  private animationHalter(): void {
    setTimeout(() => {
      this.halter4.nativeElement.style.transform = 'scale(1) rotate(5deg)';
      this.halter4.nativeElement.style.transition = 'transform 300ms ease';
      this.halter1.nativeElement.style.transform = 'scale(1.05) rotate(5deg)';
      this.halter1.nativeElement.style.transition = 'transform 300ms ease';
    }, 500);

    setTimeout(() => {
      this.halter2.nativeElement.style.transform = 'scale(1.05) rotate(5deg)';
      this.halter2.nativeElement.style.transition = 'transform 300ms ease';
      this.halter1.nativeElement.style.transform = 'scale(1) rotate(5deg)';
      this.halter1.nativeElement.style.transition = 'transform 300ms ease';
    }, 1500);

    setTimeout(() => {
      this.halter3.nativeElement.style.transform = 'scale(1.05) rotate(5deg)';
      this.halter3.nativeElement.style.transition = 'transform 300ms ease';
      this.halter2.nativeElement.style.transform = 'scale(1) rotate(5deg)';
      this.halter2.nativeElement.style.transition = 'transform 300ms ease';
    }, 2500);

    setTimeout(() => {
      this.halter4.nativeElement.style.transform = 'scale(1.05) rotate(5deg)';
      this.halter4.nativeElement.style.transition = 'transform 300ms ease';
      this.halter3.nativeElement.style.transform = 'scale(1) rotate(5deg)';
      this.halter3.nativeElement.style.transition = 'transform 300ms ease';
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
}
