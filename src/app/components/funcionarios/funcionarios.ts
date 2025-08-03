import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface Employee {
  id: string;
  name: string;
  email: string;
  cpf: string;
  birthDate: string;
  phone: string;
  role: string;
  roleDescription: string;
  active: boolean;
  hireDate: string;
  terminationDate?: string;
  registrationDate: string;
  profileUrl?: string;
}

@Component({
  selector: 'app-funcionarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './funcionarios.html',
  styleUrl: './funcionarios.scss'
})
export class Funcionarios implements OnInit {
  employees: Employee[] = [];
  filteredEmployees: Employee[] = [];
  selectedEmployee: Employee | null = null;
  isEmployeeModalOpen = false;
  
  employeeSearch = '';
  selectedRole = '';
  roles = ['MANAGER', 'INSTRUCTOR', 'RECEPTIONIST'];
  
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.http.get<Employee[]>('/api/employees').subscribe({
      next: (data) => {
        this.employees = data;
        this.filteredEmployees = data;
        this.cdr.detectChanges(); // Força detecção de mudanças para zoneless
      },
      error: (error) => {
        console.error('Erro ao carregar funcionários:', error);
      }
    });
  }

  // Filtros
  filterEmployees(): void {
    this.filteredEmployees = this.employees.filter(employee => {
      const matchesName = employee.name.toLowerCase().includes(this.employeeSearch.toLowerCase());
      const matchesRole = this.selectedRole === '' || employee.role === this.selectedRole;
      return matchesName && matchesRole;
    });
    this.cdr.detectChanges(); // Força detecção de mudanças para zoneless
  }

  openEmployeeModal(employee: Employee): void {
    this.selectedEmployee = employee;
    this.isEmployeeModalOpen = true;
    this.cdr.detectChanges(); // Força detecção de mudanças para zoneless
  }

  closeEmployeeModal(): void {
    this.isEmployeeModalOpen = false;
    this.selectedEmployee = null;
    this.cdr.detectChanges(); // Força detecção de mudanças para zoneless
  }

  getDefaultAvatar(): string {
    return '/avatar.svg';
  }

  getProfileImage(profileUrl?: string): string {
    return profileUrl || this.getDefaultAvatar();
  }

  getRoleDisplayName(role: string): string {
    switch (role) {
      case 'MANAGER':
        return 'Gerente';
      case 'INSTRUCTOR':
        return 'Instrutor';
      case 'RECEPTIONIST':
        return 'Recepcionista';
      default:
        return role;
    }
  }
}
