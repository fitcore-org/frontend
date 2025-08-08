import { Component, ChangeDetectorRef, OnInit, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService, Expense, PaymentStatus, PaymentCycleConfig, CreateExpenseRequest } from '../../services/finance.service';

@Component({
  selector: 'app-financeiro',
  imports: [CommonModule, FormsModule],
  templateUrl: './financeiro.html',
  styleUrl: './financeiro.scss'
})
export class Financeiro implements OnInit {
  expenses: Expense[] = [];
  paymentStatus: PaymentStatus[] = [];
  paymentCycleConfig: PaymentCycleConfig | null = null;
  newResetDay: number = 1;
  
  showExpenses: WritableSignal<boolean> = signal(false);
  showPayments: WritableSignal<boolean> = signal(false);
  showCycleConfig: WritableSignal<boolean> = signal(false);
  showCreateExpense: WritableSignal<boolean> = signal(false);
  loadingExpenses: WritableSignal<boolean> = signal(false);
  loadingPayments: WritableSignal<boolean> = signal(false);
  loadingCycleConfig: WritableSignal<boolean> = signal(false);
  errorExpenses: WritableSignal<string | null> = signal(null);
  errorPayments: WritableSignal<string | null> = signal(null);
  errorCycleConfig: WritableSignal<string | null> = signal(null);
  showHelp = false;

  newExpense: CreateExpenseRequest = {
    date: new Date().toISOString().split('T')[0],
    category: '',
    description: '',
    value: 0,
    responsible: ''
  };

  constructor(
    private financeService: FinanceService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cdr.detectChanges();
    this.testApi();
  }

  private testApi(): void {
    this.financeService.getExpenses().subscribe({
      next: (data) => {
      },
      error: (err) => {
        this.errorExpenses.set('Backend não está rodando na porta 8004. Inicie o finance-service.');
        setTimeout(() => this.cdr.detectChanges(), 0);
      }
    });
  }

  loadExpenses(): void {
    this.loadingExpenses.set(true);
    this.errorExpenses.set(null);
    
    setTimeout(() => this.cdr.detectChanges(), 0);
    
    this.financeService.getExpenses().subscribe({
      next: (data) => {
        this.expenses = data;
        this.showExpenses.set(true);
        this.loadingExpenses.set(false);
        
        setTimeout(() => this.cdr.detectChanges(), 0);
      },
      error: (err) => {
        this.errorExpenses.set('Erro ao carregar gastos');
        this.loadingExpenses.set(false);
        
        setTimeout(() => this.cdr.detectChanges(), 0);
      }
    });
  }

  loadPaymentStatus(): void {
    this.loadingPayments.set(true);
    this.errorPayments.set(null);
    
    setTimeout(() => this.cdr.detectChanges(), 0);
    
    this.financeService.getPaymentStatus().subscribe({
      next: (data) => {
        this.paymentStatus = data;
        this.showPayments.set(true);
        this.loadingPayments.set(false);
        
        setTimeout(() => this.cdr.detectChanges(), 0);
      },
      error: (err) => {
        this.errorPayments.set('Erro ao carregar status de pagamentos');
        this.loadingPayments.set(false);
        
        setTimeout(() => this.cdr.detectChanges(), 0);
      }
    });
  }

  toggleExpenses(): void {
    if (this.showExpenses()) {
      this.showExpenses.set(false);
      this.cdr.markForCheck();
    } else {
      this.loadExpenses();
    }
  }

  togglePayments(): void {
    if (this.showPayments()) {
      this.showPayments.set(false);
      this.cdr.markForCheck();
    } else {
      this.loadPaymentStatus();
    }
  }

  getPositionDisplayName(position: string): string {
    const positions: { [key: string]: string } = {
      'MANAGER': 'Gerente',
      'RECEPTIONIST': 'Recepcionista',
      'PERSONAL_TRAINER': 'Personal Trainer',
      'CLEANER': 'Limpeza'
    };
    return positions[position] || position;
  }

  getExpenseTypeDisplayName(type: string): string {
    const types: { [key: string]: string } = {
      'manual': 'Gasto Manual',
      'employee_payment': 'Pagamento de Funcionário'
    };
    return types[type] || type;
  }

  getTotalExpenses(): number {
    return this.expenses.reduce((total, expense) => total + expense.value, 0);
  }

  getManualExpensesCount(): number {
    return this.expenses.length;
  }

  getEmployeePaymentsCount(): number {
    return 0;
  }

  getUnpaidCount(): number {
    return this.paymentStatus.filter(payment => !payment.paid).length;
  }

  getPaidPaymentsCount(): number {
    return this.paymentStatus.filter(payment => payment.paid).length;
  }

  getUnpaidPaymentsCount(): number {
    return this.paymentStatus.filter(payment => !payment.paid).length;
  }

  getStatusDisplayName(paid: boolean): string {
    return paid ? 'Pago' : 'Pendente';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  }

  getCategoryDisplayName(category: string): string {
    const categories: { [key: string]: string } = {
      'equipment': 'Equipamentos',
      'maintenance': 'Manutenção',
      'utilities': 'Utilidades',
      'supplies': 'Suprimentos',
      'marketing': 'Marketing',
      'other': 'Outros'
    };
    return categories[category] || category;
  }

  markAsPaid(employeeId: string): void {
    this.financeService.markEmployeeAsPaid(employeeId).subscribe({
      next: (result) => {
        this.loadPaymentStatus();
      },
      error: (err) => {
        this.errorPayments.set('Erro ao marcar funcionário como pago');
        setTimeout(() => this.cdr.detectChanges(), 0);
      }
    });
  }

  dismissEmployee(employeeId: string): void {
    if (confirm('Tem certeza que deseja demitir este funcionário?')) {
      this.financeService.dismissEmployee(employeeId).subscribe({
        next: (result) => {
          this.loadPaymentStatus();
        },
        error: (err) => {
          this.errorPayments.set('Erro ao demitir funcionário');
          setTimeout(() => this.cdr.detectChanges(), 0);
        }
      });
    }
  }

  loadPaymentCycleConfig(): void {
    this.loadingCycleConfig.set(true);
    this.errorCycleConfig.set(null);
    
    setTimeout(() => this.cdr.detectChanges(), 0);
    
    this.financeService.getPaymentCycleConfig().subscribe({
      next: (data) => {
        this.paymentCycleConfig = data;
        this.newResetDay = data.reset_day;
        this.showCycleConfig.set(true);
        this.loadingCycleConfig.set(false);
        
        setTimeout(() => this.cdr.detectChanges(), 0);
      },
      error: (err) => {
        this.errorCycleConfig.set(`Erro ao carregar configuração do ciclo de pagamento: ${err.message}`);
        this.loadingCycleConfig.set(false);
        
        setTimeout(() => this.cdr.detectChanges(), 0);
      }
    });
  }

  toggleCycleConfig(): void {
    if (this.showCycleConfig()) {
      this.showCycleConfig.set(false);
      this.cdr.markForCheck();
    } else {
      this.loadPaymentCycleConfig();
    }
  }

  updateCycleConfig(): void {
    if (this.newResetDay < 1 || this.newResetDay > 31) {
      this.errorCycleConfig.set('Dia deve estar entre 1 e 31');
      setTimeout(() => this.cdr.detectChanges(), 0);
      return;
    }

    this.financeService.updatePaymentCycleConfig(this.newResetDay).subscribe({
      next: (result) => {
        this.paymentCycleConfig = result;
        this.errorCycleConfig.set(null);
        setTimeout(() => this.cdr.detectChanges(), 0);
      },
      error: (err) => {
        this.errorCycleConfig.set(`Erro ao atualizar configuração do ciclo: ${err.message}`);
        setTimeout(() => this.cdr.detectChanges(), 0);
      }
    });
  }

  resetPaymentCycle(): void {
    if (confirm('Tem certeza que deseja resetar todos os pagamentos? Todos os funcionários ficarão como "não pagos".')) {
      this.financeService.resetPaymentCycle().subscribe({
        next: (result) => {
          this.loadPaymentStatus();
        },
        error: (err) => {
          this.errorCycleConfig.set('Erro ao resetar ciclo de pagamento');
          setTimeout(() => this.cdr.detectChanges(), 0);
        }
      });
    }
  }

  toggleCreateExpense(): void {
    this.showCreateExpense.set(!this.showCreateExpense());
    this.cdr.detectChanges();
  }

  createExpense(): void {
    if (!this.newExpense.category || !this.newExpense.responsible || this.newExpense.value <= 0) {
      this.errorExpenses.set('Preencha todos os campos obrigatórios');
      setTimeout(() => this.cdr.detectChanges(), 0);
      return;
    }

    this.financeService.createExpense(this.newExpense).subscribe({
      next: (result) => {
        this.loadExpenses();
        this.resetNewExpenseForm();
        this.showCreateExpense.set(false);
        this.errorExpenses.set(null);
        setTimeout(() => this.cdr.detectChanges(), 0);
      },
      error: (err) => {
        this.errorExpenses.set(`Erro ao criar gasto: ${err.message}`);
        setTimeout(() => this.cdr.detectChanges(), 0);
      }
    });
  }

  deleteExpense(expenseId: number): void {
    if (confirm('Tem certeza que deseja deletar este gasto?')) {
      this.financeService.deleteExpense(expenseId).subscribe({
        next: (result) => {
          this.loadExpenses();
        },
        error: (err) => {
          this.errorExpenses.set(`Erro ao deletar gasto: ${err.message}`);
          setTimeout(() => this.cdr.detectChanges(), 0);
        }
      });
    }
  }

  resetNewExpenseForm(): void {
    this.newExpense = {
      date: new Date().toISOString().split('T')[0],
      category: '',
      description: '',
      value: 0,
      responsible: ''
    };
  }

  getExpenseCategories(): string[] {
    return ['equipment', 'maintenance', 'utilities', 'supplies', 'marketing', 'other'];
  }
}
