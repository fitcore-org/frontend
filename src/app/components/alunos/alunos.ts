import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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

@Component({
  selector: 'app-alunos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './alunos.html',
  styleUrl: './alunos.scss'
})
export class Alunos implements OnInit {
  private allStudents = signal<Student[]>([]);
  private searchTerm = signal<string>('');
  
  students = this.allStudents.asReadonly();
  filteredStudents = computed(() => {
    const search = this.searchTerm().toLowerCase();
    if (!search) return this.allStudents();
    return this.allStudents().filter(student =>
      student.name.toLowerCase().includes(search)
    );
  });
  
  selectedStudent: Student | null = null;
  isStudentModalOpen = false;
  
  get studentSearch(): string {
    return this.searchTerm();
  }
  
  set studentSearch(value: string) {
    this.searchTerm.set(value);
  }
  
  private http = inject(HttpClient);

  ngOnInit(): void {
    this.loadStudents();
  }

  loadStudents(): void {
    this.http.get<Student[]>('/api/students').subscribe({
      next: (data) => {
        this.allStudents.set(data);
      },
      error: (error) => {
        console.error('Erro ao carregar alunos:', error);
      }
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

  getDefaultAvatar(): string {
    return '/avatar.svg';
  }

  getProfileImage(profileUrl?: string): string {
    return profileUrl || this.getDefaultAvatar();
  }
}
