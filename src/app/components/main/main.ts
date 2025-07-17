import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, User } from '../../services/auth.service';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface Student {
  id: string;
  name: string;
  email: string;
  cpf: string;
  birthDate: string;
  phone: string;
  planType: string;
  planDescription: string;
  weight: number;
  height: number;
  bmi: number;
  active: boolean;
  registrationDate: string;
  profileUrl?: string;
}

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
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './main.html',
  styleUrls: ['./main.scss']
})
export class Main implements OnInit {
  tab = 'Dashboard';
  students: Student[] = [];
  employees: Employee[] = [];
  filteredStudents: Student[] = [];
  filteredEmployees: Employee[] = [];
  selectedStudent: Student | null = null;
  selectedEmployee: Employee | null = null;
  isStudentModalOpen = false;
  isEmployeeModalOpen = false;
  
  studentSearch = '';
  employeeSearch = '';
  selectedRole = '';
  roles = ['MANAGER', 'INSTRUCTOR', 'RECEPTIONIST'];
  
  private authService = inject(AuthService);
  private router = inject(Router);
  private http = inject(HttpClient);
  
  public currentUser$: Observable<User | null> = this.authService.currentUser$;

  ngOnInit(): void {
    this.authService.checkSessionExpiration();
    this.loadStudents();
    this.loadEmployees();
  }

  loadStudents(): void {
    this.http.get<Student[]>('/api/students').subscribe({
      next: (data) => {
        this.students = data;
        this.filteredStudents = data;
      },
      error: (error) => {
        console.error('Erro ao carregar alunos:', error);
      }
    });
  }

  loadEmployees(): void {
    this.http.get<Employee[]>('/api/employees').subscribe({
      next: (data) => {
        this.employees = data;
        this.filteredEmployees = data;
      },
      error: (error) => {
        console.error('Erro ao carregar empregados:', error);
      }
    });
  }

  // Filtros
  filterStudents(): void {
    this.filteredStudents = this.students.filter(student =>
      student.name.toLowerCase().includes(this.studentSearch.toLowerCase())
    );
  }

  filterEmployees(): void {
    this.filteredEmployees = this.employees.filter(employee => {
      const matchesName = employee.name.toLowerCase().includes(this.employeeSearch.toLowerCase());
      const matchesRole = this.selectedRole === '' || employee.role === this.selectedRole;
      return matchesName && matchesRole;
    });
  }

  openStudentModal(student: Student): void {
    this.selectedStudent = student;
    this.isStudentModalOpen = true;
  }

  closeStudentModal(): void {
    this.isStudentModalOpen = false;
    this.selectedStudent = null;
  }

  openEmployeeModal(employee: Employee): void {
    this.selectedEmployee = employee;
    this.isEmployeeModalOpen = true;
  }

  closeEmployeeModal(): void {
    this.isEmployeeModalOpen = false;
    this.selectedEmployee = null;
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

  getSliderPosition() {
    switch (this.tab) {
      case 'alunos':
        return 'translateX(0%)';
      case 'colaboradores':
        return 'translateX(100%)';
      case 'financeiro':
        return 'translateX(200%)';
      default:
        return 'translateX(0%)';
    }
  }
}
