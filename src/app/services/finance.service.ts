import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

export interface Expense {
  id: number;
  date: string;
  category: string;
  description: string | null;
  value: number;
  responsible: string;
  created_at: string;
}

export interface CreateExpenseRequest {
  date: string;
  category: string;
  description: string;
  value: number;
  responsible: string;
}

export interface PaymentStatus {
  employee_id: string;
  position_name: string;
  paid: boolean;
  last_payment: string | null;
  id: number;
  created_at: string;
  updated_at: string;
}

export interface PaymentCycleConfig {
  reset_day: number;
  id: number;
  last_reset_date: string | null;
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class FinanceService {
  private readonly baseUrl = ''; // Using proxy configuration

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Access-Control-Allow-Origin': '*'
    })
  };

  constructor(private http: HttpClient) {}

  getExpenses(): Observable<Expense[]> {
    return this.http.get<Expense[]>('/expenses/manual', this.httpOptions).pipe(
      catchError(this.handleError)
    );
  }

  createExpense(expense: CreateExpenseRequest): Observable<Expense> {
    return this.http.post<Expense>('/expenses/manual', expense, this.httpOptions).pipe(
      catchError(this.handleError)
    );
  }

  deleteExpense(expenseId: number): Observable<any> {
    return this.http.delete(`/expenses/manual/${expenseId}`, this.httpOptions).pipe(
      catchError(this.handleError)
    );
  }

  getPaymentStatus(): Observable<PaymentStatus[]> {
    return this.http.get<PaymentStatus[]>('/payments/status', this.httpOptions).pipe(
      catchError(this.handleError)
    );
  }

  markEmployeeAsPaid(employeeId: string): Observable<any> {
    const payload = { employee_id: employeeId };
    return this.http.patch(`/payments/${employeeId}/pay`, payload, this.httpOptions).pipe(
      catchError(this.handleError)
    );
  }

  dismissEmployee(employeeId: string): Observable<any> {
    const payload = { employee_id: employeeId };
    return this.http.post(`/payments/${employeeId}/dismiss`, payload, this.httpOptions).pipe(
      catchError(this.handleError)
    );
  }

  getPaymentCycleConfig(): Observable<PaymentCycleConfig> {
    return this.http.get<PaymentCycleConfig>('/payments/cycle/config', this.httpOptions).pipe(
      catchError((error) => {
        return this.handleError(error);
      })
    );
  }

  updatePaymentCycleConfig(resetDay: number): Observable<PaymentCycleConfig> {
    const payload = { reset_day: resetDay };
    return this.http.put<PaymentCycleConfig>('/payments/cycle/config', payload, this.httpOptions).pipe(
      catchError(this.handleError)
    );
  }

  resetPaymentCycle(): Observable<any> {
    return this.http.post('/payments/cycle/reset', {}, this.httpOptions).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Erro desconhecido';
    
    if (error.status === 0) {
      errorMessage = 'Erro de conexão - verifique se o servidor está rodando';
    } else if (error.status === 404) {
      errorMessage = 'Endpoint não encontrado';
    } else if (error.status >= 500) {
      errorMessage = 'Erro interno do servidor';
    } else {
      errorMessage = `Erro ${error.status}: ${error.statusText}`;
    }
    
    return throwError(() => new Error(errorMessage));
  }
}