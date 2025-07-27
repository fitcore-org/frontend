import { Component, AfterViewInit, ElementRef, ViewChild, inject, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-password-reset',
  imports: [CommonModule, FormsModule],
  templateUrl: './password-reset.html',
  styleUrl: './password-reset.scss'
})
export class PasswordReset implements AfterViewInit {
  @ViewChild('dumbbellLeft') dumbbellLeft!: ElementRef;
  @ViewChild('dumbbellRight') dumbbellRight!: ElementRef;
  @ViewChild('Email') Email!: ElementRef;
  @ViewChild('Code') Code!: ElementRef;
  @ViewChild('NewPassword') NewPassword!: ElementRef;
  @ViewChild('ConfirmPassword') ConfirmPassword!: ElementRef;
  
  currentStep: 'email' | 'code' | 'newPassword' = 'email';
  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;
  userEmail: string = '';
  verificationCode: string = '';
  
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  
  ngAfterViewInit(): void {
    this.animationDumbbellStart();
  }

  private animationDumbbellStart(): void {
    this.animateDumbbells();
    setInterval(() => {
      this.animateDumbbells();
    }, 4000);
  }

  private animateDumbbells(): void {
    
    this.dumbbellLeft.nativeElement.classList.remove('lifting');
    this.dumbbellRight.nativeElement.classList.remove('lifting');

    setTimeout(() => {
      this.dumbbellLeft.nativeElement.classList.add('lifting');
    }, 200);

    
    setTimeout(() => {
      this.dumbbellRight.nativeElement.classList.add('lifting');
    }, 600);


    setTimeout(() => {
      this.dumbbellLeft.nativeElement.classList.remove('lifting');
    }, 1500);

    setTimeout(() => {
      this.dumbbellRight.nativeElement.classList.remove('lifting');
    }, 1800);

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

  public async requestReset(event: Event): Promise<void> {
    event.preventDefault();
    this.clearMessages();
    
    const email = this.Email.nativeElement.value.trim();
    
    if (!email) {
      this.errorMessage = 'Por favor, digite seu email';
      this.cdr.detectChanges();
      return;
    }

    if (!this.isValidEmail(email)) {
      this.errorMessage = 'Por favor, digite um email válido';
      this.cdr.detectChanges();
      return;
    }
    
    this.isLoading = true;
    this.cdr.detectChanges();

    try {
      const response = await fetch('/auth/password-reset/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });
      
      if (response.ok) {
        this.userEmail = email;
        this.successMessage = 'Código enviado! Verifique seu email.';
        this.currentStep = 'code';
        this.cdr.detectChanges();
        
        setTimeout(() => {
          this.successMessage = '';
          this.cdr.detectChanges();
        }, 3000);
      } else {
        const errorText = await response.text();
        console.error('Erro do backend:', errorText);
        this.errorMessage = 'Erro ao enviar código. Tente novamente.';
        this.cdr.detectChanges();
      }
      
    } catch (error) {
      console.error('Erro de conexão:', error);
      this.errorMessage = 'Erro de conexão. Verifique sua internet.';
      this.cdr.detectChanges();
    } finally {
    
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  public async verifyCode(event: Event): Promise<void> {
    event.preventDefault();
    this.clearMessages();
    
    const code = this.Code.nativeElement.value.trim();
    
    if (!code) {
      this.errorMessage = 'Por favor, digite o código';
      this.cdr.detectChanges();
      return;
    }

    if (code.length !== 6) {
      this.errorMessage = 'O código deve ter 6 dígitos';
      this.cdr.detectChanges();
      return;
    }
    
    this.verificationCode = code;
    this.currentStep = 'newPassword';
    this.successMessage = 'Código válido! Agora defina sua nova senha.';
    this.cdr.detectChanges();
    
    setTimeout(() => {
      this.successMessage = '';
      this.cdr.detectChanges();
    }, 3000);
  }

  public async resetPassword(event: Event): Promise<void> {
    event.preventDefault();
    this.clearMessages();
    
    const newPassword = this.NewPassword.nativeElement.value.trim();
    const confirmPassword = this.ConfirmPassword.nativeElement.value.trim();
    
    if (!newPassword || !confirmPassword) {
      this.errorMessage = 'Por favor, preencha todos os campos';
      this.cdr.detectChanges();
      return;
    }

    if (newPassword.length < 6) {
      this.errorMessage = 'A senha deve ter pelo menos 6 caracteres';
      this.cdr.detectChanges();
      return;
    }

    if (newPassword !== confirmPassword) {
      this.errorMessage = 'As senhas não coincidem';
      this.cdr.detectChanges();
      return;
    }
    
    this.isLoading = true;
    this.cdr.detectChanges();

    try {

      const requestBody = {
        email: this.userEmail,
        code: this.verificationCode,
        newPassword: newPassword
      };

      const response = await fetch('/auth/password-reset/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        this.successMessage = 'Senha alterada com sucesso!';
        this.cdr.detectChanges();
        
        setTimeout(() => {
          this.goToLogin();
        }, 2000);
      } else {
        
        const errorText = await response.text();
        console.error('Erro do backend:', errorText, 'Status:', response.status);
        
        if (errorText.includes('Invalid or expired code') || 
            errorText.includes('expired') || 
            errorText.includes('Invalid') ||
            response.status === 400) {
          this.errorMessage = 'Código inválido ou expirado. Solicite um novo código.';
          
          setTimeout(() => {
            this.currentStep = 'email';
            this.clearMessages();
            this.cdr.detectChanges();
          }, 3000);
        } else if (errorText.includes('User not found')) {
          this.errorMessage = 'Usuário não encontrado.';
        } else {
          this.errorMessage = 'Erro ao alterar senha. Tente novamente.';
        }
        this.cdr.detectChanges();
      }
      
    } catch (error) {
      console.error('Erro de conexão:', error);
      this.errorMessage = 'Erro de conexão. Verifique sua internet.';
      this.cdr.detectChanges();
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  public formatCodeInput(event: any): void {
    const value = event.target.value.replace(/\D/g, '');
    event.target.value = value;
  }

  public goBack(): void {
    this.resetLoadingAndMessages();
    if (this.currentStep === 'code') {
      this.currentStep = 'email';
    } else if (this.currentStep === 'newPassword') {
      this.currentStep = 'code';
    }
    this.cdr.detectChanges();
  }
  
  public goToLogin(): void {
    this.resetLoadingAndMessages();
    this.router.navigate(['/login']);
  }

  private resetLoadingAndMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.isLoading = false;
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.isLoading = false;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
