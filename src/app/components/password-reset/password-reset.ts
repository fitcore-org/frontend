import { Component, ViewChild, ElementRef, inject, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-password-reset',
  imports: [],
  templateUrl: './password-reset.html',
  styleUrl: './password-reset.scss'
})
export class PasswordReset {
  @ViewChild('Email') Email!: ElementRef;
  @ViewChild('Code') Code!: ElementRef;
  @ViewChild('NewPassword') NewPassword!: ElementRef;
  @ViewChild('ConfirmPassword') ConfirmPassword!: ElementRef;
  
  currentStep: 'email' | 'code' | 'newPassword' = 'email';
  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;
  userEmail: string = '';
  
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  public async requestReset(event: Event): Promise<void> {
    event.preventDefault();
    this.errorMessage = '';
    this.successMessage = '';
    this.isLoading = true;
    
    const email = this.Email.nativeElement.value.trim();
    
    if (!email) {
      this.errorMessage = 'Por favor, digite seu email';
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    if (!this.isValidEmail(email)) {
      this.errorMessage = 'Por favor, digite um email válido';
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }
    
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
        this.currentStep = 'code';
        this.successMessage = 'Código de verificação enviado para seu email!';
      } else {
        const errorData = await response.text();
        this.errorMessage = 'Erro ao enviar código. Tente novamente.';
      }
    } catch (error) {
      this.errorMessage = 'Erro de conexão. Verifique sua internet.';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  public async verifyCode(event: Event): Promise<void> {
    event.preventDefault();
    this.errorMessage = '';
    this.successMessage = '';
    this.isLoading = true;
    
    const code = this.Code.nativeElement.value.trim();
    
    if (!code || code.length !== 6) {
      this.errorMessage = 'Por favor, digite o código de 6 dígitos';
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    if (!/^\d{6}$/.test(code)) {
      this.errorMessage = 'O código deve conter apenas números';
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }
    
    this.currentStep = 'newPassword';
    this.successMessage = 'Agora defina sua nova senha.';
    this.isLoading = false;
    this.cdr.detectChanges();
  }

  public async resetPassword(event: Event): Promise<void> {
    event.preventDefault();
    this.errorMessage = '';
    this.successMessage = '';
    this.isLoading = true;
    
    const newPassword = this.NewPassword.nativeElement.value.trim();
    const confirmPassword = this.ConfirmPassword.nativeElement.value.trim();
    const code = this.Code.nativeElement.value.replace(/[^\d]/g, '').trim(); // Limpar código também
    
    if (!newPassword || !confirmPassword) {
      this.errorMessage = 'Por favor, preencha todos os campos';
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    if (newPassword !== confirmPassword) {
      this.errorMessage = 'As senhas não coincidem';
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    if (newPassword.length < 6) {
      this.errorMessage = 'A senha deve ter pelo menos 6 caracteres';
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }
    
    try {
      const requestBody = {
        email: this.userEmail,
        code: code,
        newPassword: newPassword
      };
      
      console.log('Enviando dados:', requestBody);
      console.log('Código (length):', code.length, 'Código:', `"${code}"`);
      
      const response = await fetch('/auth/password-reset/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      if (response.ok) {
        this.successMessage = 'Senha alterada com sucesso! Redirecionando...';
        this.cdr.detectChanges();
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      } else {
        const errorText = await response.text();
        console.error('Erro do backend:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText
        });
        
        if (errorText.includes('Invalid or expired code')) {
          this.errorMessage = 'Código inválido ou expirado. Solicite um novo código.';
    
          setTimeout(() => {
            this.currentStep = 'email';
          }, 3000);
        } else if (errorText.includes('User not found')) {
          this.errorMessage = 'Usuário não encontrado.';
        } else {
          this.errorMessage = 'Erro ao alterar senha. Tente novamente.';
        }
      }
    } catch (error) {
      this.errorMessage = 'Erro de conexão. Verifique sua internet.';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  public goBack(): void {
    if (this.currentStep === 'code') {
      this.currentStep = 'email';
    } else if (this.currentStep === 'newPassword') {
      this.currentStep = 'code';
    }
    this.errorMessage = '';
    this.successMessage = '';
  }

  public goToLogin(): void {
    this.router.navigate(['/login']);
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  public formatCodeInput(event: any): void {
    // Remove qualquer coisa que não seja número e limpa espaços
    let value = event.target.value.replace(/[^\d]/g, '').trim();
    if (value.length > 6) {
      value = value.substring(0, 6);
    }
    event.target.value = value;
  }
}
