import { Component, ChangeDetectorRef, OnInit, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { FinanceService, Expense, PaymentStatus, PaymentCycleConfig, CreateExpenseRequest } from '../../services/finance.service';

@Component({
  selector: 'app-financeiro',
  imports: [CommonModule, FormsModule],
  templateUrl: './financeiro.html',
  styleUrl: './financeiro.scss'
})
export class Financeiro implements OnInit {
  // Despesas
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

  // Planos
  plans: any[] = [];
  loadingPlans: boolean = false;
  errorPlans: string | null = null;
  showCreatePlan: boolean = false;
  editingPlan: any = null;
  newPlan: any = this.getEmptyPlan();

  constructor(
    private financeService: FinanceService,
    private cdr: ChangeDetectorRef,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.cdr.detectChanges();
    this.testApi();
    this.loadPlans();
  }

  // -------------------- DESPESAS E PAGAMENTOS --------------------

  private testApi(): void {
    this.financeService.getExpenses().subscribe({
      next: () => {},
      error: () => {
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
      error: () => {
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
      error: () => {
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
      next: () => this.loadPaymentStatus(),
      error: () => {
        this.errorPayments.set('Erro ao marcar funcionário como pago');
        setTimeout(() => this.cdr.detectChanges(), 0);
      }
    });
  }

  dismissEmployee(employeeId: string): void {
    if (confirm('Tem certeza que deseja demitir este funcionário?')) {
      this.financeService.dismissEmployee(employeeId).subscribe({
        next: () => this.loadPaymentStatus(),
        error: () => {
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
        next: () => this.loadPaymentStatus(),
        error: () => {
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
      next: () => {
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
        next: () => this.loadExpenses(),
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

  // ---------------------- PLANOS ----------------------

  loadPlans(): void {
    this.loadingPlans = true;
    this.errorPlans = null;
    this.http.get<any[]>('/payment/api/plans').subscribe({
      next: (plans) => { this.plans = plans; this.loadingPlans = false; this.cdr.detectChanges(); },
      error: (err) => { this.errorPlans = 'Erro ao carregar planos: ' + (err.error?.message || err.message || err); this.loadingPlans = false; this.cdr.detectChanges(); }
    });
    
  }

  openCreatePlan(): void {
    this.editingPlan = null;
    this.newPlan = this.getEmptyPlan();
    this.showCreatePlan = true;
    this.cdr.detectChanges();
  }

  editPlan(plan: any): void {
    this.editingPlan = plan;
    this.newPlan = JSON.parse(JSON.stringify(plan));
    this.showCreatePlan = true;
    this.cdr.detectChanges();
  }

  deletePlan(planId: string | number): void {
    if (confirm('Tem certeza que deseja excluir este plano?')) {
      this.http.delete(`/payment/api/plans/${planId}`).subscribe({
        next: () => this.loadPlans(),
        error: (err: any) => {
          alert('Erro ao excluir plano: ' + (err.error?.message || err.message || err));
        }
      });
    }
  }

  savePlan(): void {
    let planToSend = { ...this.newPlan };

    // Os nomes aqui precisam bater exatamente!
    planToSend.paymentMethods =
      typeof planToSend.paymentMethods === 'string'
        ? planToSend.paymentMethods.split(',').map((m: string) => m.trim())
        : planToSend.paymentMethods;
  
    planToSend.installments =
      typeof planToSend.installments === 'string'
        ? planToSend.installments.split(',').map((i: string) => Number(i.trim()))
        : planToSend.installments;
  
    if (typeof planToSend.metadata === 'string' && planToSend.metadata.trim().length > 0) {
      try {
        planToSend.metadata = JSON.parse(planToSend.metadata);
      } catch {
        alert('Metadata deve ser um JSON válido');
        return;
      }
    }

    if (this.editingPlan && this.editingPlan.id) {
      // EDIT
      this.http.put(`/payment/api/plans/${this.editingPlan.id}`, planToSend).subscribe({
        next: () => {
          alert('Plano atualizado com sucesso!');
          this.showCreatePlan = false;
          this.editingPlan = null;
          this.loadPlans();
        },
        error: (err: any) => {
          alert('Erro ao atualizar plano: ' + (err.error?.message || err.message || err));
        }
      });
    } else {
      // CREATE
      this.http.post('/payment/api/plans', planToSend).subscribe({
        next: () => {
          alert('Plano criado com sucesso!');
          this.showCreatePlan = false;
          this.editingPlan = null;
          this.loadPlans();
        },
        error: (err: any) => {
          alert('Erro ao criar plano: ' + (err.error?.message || err.message || err));
        }
      });
    }
  }
  getEmptyPlan() {
    return {
      name: '',
      currency: 'BRL',
      interval: 'month',
      intervalCount: 1,
      billingType: 'prepaid',
      minimumPrice: 0,
      installments: [],
      paymentMethods: [],
      status: 'active',
      items: [
        {
          name: '',
          quantity: 1,
          pricingScheme: { price: 0, schemeType: 'Unit' },
          cycles: null
        }
      ],
      metadata: {},
      pricingScheme: { price: 0, schemeType: 'Unit' }, 
      cycles: null,
      quantity: null,
    };
  }
  
  

  toggleCreatePlan(): void {
    this.showCreatePlan = false;
    this.editingPlan = null;
    this.cdr.detectChanges();
  }

  addPlanItem(): void {
    this.newPlan.items.push({ name: '', quantity: 1, pricingScheme: { price: 0 }, cycles: null });
    this.cdr.detectChanges();
  }

  removePlanItem(index: number): void {
    this.newPlan.items.splice(index, 1);
    this.cdr.detectChanges();
  }
  
}

