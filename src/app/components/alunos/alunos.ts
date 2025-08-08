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

interface CreateStudentRequest {
  name: string;
  email: string;
  cpf: string;
  birthDate: string;
  phone: string;
  planType: string;
  weight: number;
  height: number;
}

interface UpdateStudentRequest {
  name: string;
  email: string;
  phone: string;
  planType: string;
  weight: number;
  height: number;
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
  
  // Student creation properties
  isCreateStudentModalOpen = false;
  isCreatingStudent = false;
  newStudent: CreateStudentRequest = {
    name: '',
    email: '',
    cpf: '',
    birthDate: '',
    phone: '',
    planType: '',
    weight: 0,
    height: 0
  };

  // Student edit properties
  isEditStudentModalOpen = false;
  isUpdatingStudent = false;
  editingStudent: Student | null = null;
  updatedStudent: UpdateStudentRequest = {
    name: '',
    email: '',
    phone: '',
    planType: '',
    weight: 0,
    height: 0
  };
  
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

  // Student Creation Methods
  openCreateStudentModal(): void {
    this.isCreateStudentModalOpen = true;
    this.resetNewStudentForm();
  }

  closeCreateStudentModal(): void {
    this.isCreateStudentModalOpen = false;
    this.isCreatingStudent = false;
    this.resetNewStudentForm();
  }

  resetNewStudentForm(): void {
    this.newStudent = {
      name: '',
      email: '',
      cpf: '',
      birthDate: '',
      phone: '',
      planType: '',
      weight: 0,
      height: 0
    };
  }

  createStudent(): void {
    if (this.isCreatingStudent) return;

    const { name, email, cpf, birthDate, phone, planType, weight, height } = this.newStudent;
    
    // Validações
    if (!name.trim()) {
      alert('Nome é obrigatório.');
      return;
    }
    
    if (!email.trim() || !this.isValidEmail(email)) {
      alert('Email válido é obrigatório.');
      return;
    }
    
    if (!cpf.trim() || !this.isValidCPF(cpf)) {
      alert('CPF válido é obrigatório.');
      return;
    }
    
    if (!birthDate) {
      alert('Data de nascimento é obrigatória.');
      return;
    }
    
    if (!phone.trim()) {
      alert('Telefone é obrigatório.');
      return;
    }
    
    if (!planType.trim()) {
      alert('Tipo de plano é obrigatório.');
      return;
    }

    if (weight <= 0) {
      alert('Peso deve ser maior que 0.');
      return;
    }

    if (height <= 0) {
      alert('Altura deve ser maior que 0.');
      return;
    }

    // Preparar dados para a API
    const studentData = {
      name: name.trim(),
      email: email.trim(),
      cpf: this.formatCPFForAPI(cpf),
      birthDate: this.formatDateForAPI(birthDate),
      phone: phone.trim(),
      planType: planType.trim(),
      weight: Number(weight),
      height: Number(height)
    };

    this.isCreatingStudent = true;
    
    this.http.post<Student>('/api/students', studentData).subscribe({
      next: (data) => {
        console.log('Aluno criado com sucesso:', data);
        this.loadStudents();
        this.closeCreateStudentModal();
        alert('Aluno criado com sucesso!');
      },
      error: (error) => {
        console.error('Erro ao criar aluno:', error);
        this.isCreatingStudent = false;
        
        let errorMessage = 'Erro ao criar aluno.';
        
        if (error.status === 400) {
          errorMessage = 'Dados inválidos. Verifique se todos os campos estão preenchidos corretamente.';
        } else if (error.status === 409) {
          errorMessage = 'Já existe um aluno com esse CPF ou email.';
        } else if (error.status === 0) {
          errorMessage = 'Erro de conexão. Verifique se o servidor está rodando.';
        }
        
        alert(errorMessage);
      }
    });
  }

  // Student Edit Methods
  openEditStudentModal(student: Student): void {
    this.editingStudent = student;
    this.updatedStudent = {
      name: student.name,
      email: student.email,
      phone: student.phone,
      planType: student.planType,
      weight: student.weight,
      height: student.height
    };
    this.isEditStudentModalOpen = true;
  }

  closeEditStudentModal(): void {
    this.isEditStudentModalOpen = false;
    this.isUpdatingStudent = false;
    this.editingStudent = null;
    this.updatedStudent = {
      name: '',
      email: '',
      phone: '',
      planType: '',
      weight: 0,
      height: 0
    };
  }

  updateStudent(): void {
    if (this.isUpdatingStudent || !this.editingStudent) return;
    
    const { name, email, phone, planType, weight, height } = this.updatedStudent;
    
    // Validações
    if (!name.trim()) {
      alert('Nome é obrigatório.');
      return;
    }
    
    if (!email.trim() || !this.isValidEmail(email)) {
      alert('Email válido é obrigatório.');
      return;
    }
    
    if (!phone.trim()) {
      alert('Telefone é obrigatório.');
      return;
    }
    
    if (!planType.trim()) {
      alert('Tipo de plano é obrigatório.');
      return;
    }

    if (weight <= 0) {
      alert('Peso deve ser maior que 0.');
      return;
    }

    if (height <= 0) {
      alert('Altura deve ser maior que 0.');
      return;
    }

    // Preparar dados conforme a API do PUT
    const updateData = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      planType: planType.trim(),
      weight: Number(weight),
      height: Number(height)
    };

    this.isUpdatingStudent = true;
    
    this.http.put<Student>(`/api/students/${this.editingStudent!.id}`, updateData).subscribe({
      next: (data) => {
        console.log('Aluno atualizado com sucesso:', data);
        this.loadStudents();
        this.closeEditStudentModal();
        alert('Aluno atualizado com sucesso!');
      },
      error: (error) => {
        console.error('Erro ao atualizar aluno:', error);
        this.isUpdatingStudent = false;
        
        let errorMessage = 'Erro ao atualizar aluno.';
        
        if (error.status === 400) {
          errorMessage = 'Dados inválidos. Verifique se todos os campos estão preenchidos corretamente.';
        } else if (error.status === 404) {
          errorMessage = 'Aluno não encontrado.';
        } else if (error.status === 409) {
          errorMessage = 'Já existe um aluno com esse email.';
        } else if (error.status === 0) {
          errorMessage = 'Erro de conexão. Verifique se o servidor está rodando.';
        }
        
        alert(errorMessage);
      }
    });
  }

  deleteStudent(student: Student): void {
    if (confirm(`Tem certeza que deseja excluir o aluno "${student.name}"?`)) {
      this.http.delete(`/api/students/${student.id}`).subscribe({
        next: () => {
          this.loadStudents();
          alert('Aluno excluído com sucesso!');
        },
        error: (error) => {
          console.error('Erro ao excluir aluno:', error);
          
          if (error.status === 404) {
            alert('Aluno não encontrado.');
          } else {
            alert('Erro ao excluir aluno. Tente novamente.');
          }
        }
      });
    }
  }

  // Utility methods
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isValidCPF(cpf: string): boolean {
    const cleanCPF = cpf.replace(/\D/g, '');
    
    if (cleanCPF.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
    
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF[i]) * (10 - i);
    }
    let digit1 = (sum * 10) % 11;
    if (digit1 === 10) digit1 = 0;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF[i]) * (11 - i);
    }
    let digit2 = (sum * 10) % 11;
    if (digit2 === 10) digit2 = 0;
    
    return digit1 === parseInt(cleanCPF[9]) && digit2 === parseInt(cleanCPF[10]);
  }

  formatCPFForAPI(cpf: string): string {
    return cpf.replace(/\D/g, '');
  }

  formatDateForAPI(date: string): string {
    return date; // Assumindo que a data já está no formato correto YYYY-MM-DD
  }

  getDefaultAvatar(): string {
    return '/avatar.svg';
  }

  getProfileImage(profileUrl?: string): string {
    return profileUrl || this.getDefaultAvatar();
  }
}
