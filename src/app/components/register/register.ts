import { AfterViewInit, Component, ViewChild, ElementRef, inject, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class Register implements AfterViewInit {
  @ViewChild('dumbbellLeft') dumbbellLeft!: ElementRef;
  @ViewChild('dumbbellRight') dumbbellRight!: ElementRef;
  @ViewChild('Nome') Nome!: ElementRef;
  @ViewChild('Email') Email!: ElementRef;
  @ViewChild('Senha') Senha!: ElementRef;
  
  errorMessage: string = '';
  
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
    
    const name = this.Nome.nativeElement.value.trim();
    const email = this.Email.nativeElement.value.trim();
    const password = this.Senha.nativeElement.value.trim();
    
    if (!name || !email || !password) {
      this.errorMessage = 'Por favor, preencha todos os campos';
      this.cdr.detectChanges();
      return;
    }
    
    const registerData = {
      name,
      email,
      password,
      role: "MANAGER"
    };

    try {
      const response = await fetch('/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData)
      });

      if (response.ok) {
        this.router.navigate(['login']);
      } else {
        if (response.status === 409) {
          this.errorMessage = 'Este e-mail já está em uso';
        } else {
          this.errorMessage = 'Erro ao criar conta. Tente novamente.';
        }
        this.cdr.detectChanges();
      }
    } catch (error) {
      this.errorMessage = 'Erro de conexão. Verifique sua internet.';
      this.cdr.detectChanges();
    }
  }
  
  public goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
