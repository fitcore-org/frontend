import { Component, inject, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
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

interface Position {
  id: number;
  name: string;
  description: string;
  base_salary: number;
}

interface CreatePositionRequest {
  name: string;
  description: string;
  base_salary: number;
}

interface UpdatePositionRequest {
  name: string;
  description: string;
  base_salary: number;
}

interface CreateEmployeeRequest {
  name: string;
  email: string;
  cpf: string;
  birthDate: string;
  phone: string;
  roleType: string;
  hireDate: string;
  password: string;
}

interface UpdateEmployeeRequest {
  name: string;
  email: string;
  phone: string;
  roleType: string;
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
  
  positions: Position[] = [];
  isPositionsModalOpen = false;
  isLoadingPositions = false;
  
  isCreatePositionModalOpen = false;
  isCreatingPosition = false;
  newPosition: CreatePositionRequest = {
    name: '',
    description: '',
    base_salary: 0
  };

  isEditPositionModalOpen = false;
  isUpdatingPosition = false;
  editingPosition: Position | null = null;
  updatedPosition: UpdatePositionRequest = {
    name: '',
    description: '',
    base_salary: 0
  };

  // Employee creation properties
  isCreateEmployeeModalOpen = false;
  isCreatingEmployee = false;
  newEmployee: CreateEmployeeRequest = {
    name: '',
    email: '',
    cpf: '',
    birthDate: '',
    phone: '',
    roleType: '',
    hireDate: '',
    password: '',
  };

  // Employee edit properties
  isEditEmployeeModalOpen = false;
  isUpdatingEmployee = false;
  editingEmployee: Employee | null = null;
  updatedEmployee: UpdateEmployeeRequest = {
    name: '',
    email: '',
    phone: '',
    roleType: ''
  };
  
  employeeSearch = '';
  selectedRole = '';
  roles = ['MANAGER', 'PERSONAL_TRAINER', 'RECEPTIONIST', 'CLEANER'];
  
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  ngOnInit(): void {
    this.loadEmployees();
    this.loadPositionsForFilter();
  }

  loadPositionsForFilter(): void {
    this.http.get<Position[]>('/positions/').subscribe({
      next: (data) => {
        this.roles = data.map(position => position.name);
      },
      error: (error) => {
        console.error('Erro ao carregar posições para filtro:', error);
        // Manter os roles padrão em caso de erro
        this.roles = ['MANAGER', 'PERSONAL_TRAINER', 'RECEPTIONIST', 'CLEANER'];
      }
    });
  }

  private forceChangeDetection(): void {
    this.ngZone.run(() => {
      this.cdr.detectChanges();
    });
  }

  loadEmployees(): void {
    this.http.get<Employee[]>('/api/employees').subscribe({
      next: (data) => {
        this.ngZone.run(() => {
          this.employees = data;
          this.filteredEmployees = data;
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        console.error('Erro ao carregar funcionários:', error);
      }
    });
  }

  loadPositions(): void {
    if (this.isLoadingPositions) return;
    
    this.isLoadingPositions = true;
    this.forceChangeDetection();
    
    this.ngZone.run(() => {
      this.http.get<Position[]>('/positions/').subscribe({
        next: (data) => {
          this.ngZone.run(() => {
            this.positions = data;
            this.isPositionsModalOpen = true;
            this.isLoadingPositions = false;
            this.cdr.detectChanges();
          });
        },
        error: (error) => {
          console.error('Erro ao carregar posições:', error);
          
          this.ngZone.run(() => {
            this.positions = [
              {
                id: 1,
                name: "MANAGER",
                description: "Gerente/Proprietário da academia",
                base_salary: 0.0
              },
              {
                id: 2,
                name: "PERSONAL_TRAINER",
                description: "Personal Trainer especializado",
                base_salary: 3500.0
              },
              {
                id: 3,
                name: "RECEPTIONIST",
                description: "Recepcionista da academia",
                base_salary: 1800.0
              },
              {
                id: 4,
                name: "CLEANER",
                description: "Funcionário de limpeza",
                base_salary: 1400.0
              }
            ];
            this.isPositionsModalOpen = true;
            this.isLoadingPositions = false;
            this.cdr.detectChanges();
          });
        }
      });
    });
  }

  // Employee Creation Methods
  openCreateEmployeeModal(): void {
    this.isCreateEmployeeModalOpen = true;
    this.resetNewEmployeeForm();
    this.forceChangeDetection();
  }

  closeCreateEmployeeModal(): void {
    this.ngZone.run(() => {
      this.isCreateEmployeeModalOpen = false;
      this.isCreatingEmployee = false;
      this.resetNewEmployeeForm();
      this.cdr.detectChanges();
    });
  }

  resetNewEmployeeForm(): void {
    this.newEmployee = {
      name: '',
      email: '',
      cpf: '',
      birthDate: '',
      phone: '',
      roleType: '',
      hireDate: '',
      password: '' 
    };
  }

  createEmployee(): void {
    if (this.isCreatingEmployee) return;
  
    const { name, email, cpf, birthDate, phone, roleType, hireDate, password } = this.newEmployee;
  
    if (!name.trim()) {
      alert('Nome é obrigatório.');
      return;
    }
    if (!email.trim() || !this.isValidEmail(email)) {
      alert('Email válido é obrigatório.');
      return;
    }
    if (!cpf.trim() || !this.isValidCPF(cpf)) {
      const cleanCPF = cpf.replace(/\D/g, '');
      if (cleanCPF.length !== 11) {
        alert('CPF deve ter 11 dígitos.');
      } else {
        alert('CPF inválido. Verifique os dígitos.');
      }
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
    if (!roleType) {
      alert('Cargo é obrigatório.');
      return;
    }
    if (!hireDate) {
      alert('Data de contratação é obrigatória.');
      return;
    }
    if (!password || password.length < 6) {
      alert('Senha é obrigatória e deve ter pelo menos 6 caracteres.');
      return;
    }
  
    // Montar objetos para as duas requisições
    const employeeData = {
      name: name.trim(),
      email: email.trim(),
      cpf: this.formatCPFForAPI(cpf),
      birthDate: this.formatDateForAPI(birthDate),
      phone: phone.trim(),
      roleType: roleType,
      hireDate: this.formatDateForAPI(hireDate),
      password: password
    };
  
    const registerData = {
      name: name.trim(),
      email: email.trim(),
      password: password,
      role: roleType,
      cpf: this.formatCPFForAPI(cpf),
      birthDate: this.formatDateForAPI(birthDate)
    };
  
    this.ngZone.run(() => {
      this.isCreatingEmployee = true;
      this.cdr.detectChanges();
  
      // Primeiro, cadastrar o funcionário (dados administrativos)
      this.http.post<Employee>('/api/employees', employeeData).subscribe({
        next: (data) => {
          this.http.post('/auth/register', registerData).subscribe({
            next: (authData) => {
              // Ambos deram certo!
              this.ngZone.run(() => {
                this.loadEmployees();
                this.closeCreateEmployeeModal();
                alert('Funcionário e usuário criados com sucesso!');
              });
            },
            error: (authError) => {
              console.error('Erro ao registrar em /auth/register:', authError);
              this.ngZone.run(() => {
                this.loadEmployees();
                this.closeCreateEmployeeModal();
                alert('Funcionário criado, mas houve erro ao criar login (auth/register)!');
              });
            }
          });
        },
        error: (error) => {
          console.error('Erro completo ao criar funcionário:', error);
          let errorMessage = 'Erro ao criar funcionário.';
          if (error.status === 400) {
            if (error.error && error.error.message) {
              errorMessage = `Dados inválidos: ${error.error.message}`;
            } else {
              errorMessage = 'Dados inválidos. Verifique se todos os campos estão preenchidos corretamente.';
            }
          } else if (error.status === 409) {
            errorMessage = 'Já existe um funcionário com esse CPF ou email.';
          } else if (error.status === 0) {
            errorMessage = 'Erro de conexão. Verifique se o servidor está rodando.';
          } else {
            errorMessage = `Erro ${error.status}: ${error.statusText || 'Erro desconhecido'}`;
          }
          alert(errorMessage);
  
          this.ngZone.run(() => {
            this.isCreatingEmployee = false;
            this.cdr.detectChanges();
          });
        }
      });
    });
  }
  

  // Employee Edit Methods
  openEditEmployeeModal(employee: Employee): void {
    this.editingEmployee = employee;
    this.updatedEmployee = {
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      roleType: employee.role
    };
    this.isEditEmployeeModalOpen = true;
    this.forceChangeDetection();
  }

  closeEditEmployeeModal(): void {
    this.ngZone.run(() => {
      this.isEditEmployeeModalOpen = false;
      this.isUpdatingEmployee = false;
      this.editingEmployee = null;
      this.updatedEmployee = {
        name: '',
        email: '',
        phone: '',
        roleType: ''
      };
      this.cdr.detectChanges();
    });
  }

  updateEmployee(): void {
    if (this.isUpdatingEmployee || !this.editingEmployee) return;
    
    const { name, email, phone, roleType } = this.updatedEmployee;
    
    // Validações mais específicas
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
    
    if (!roleType) {
      alert('Cargo é obrigatório.');
      return;
    }

    // Preparar dados conforme o Swagger do PUT - apenas campos editáveis
    const updateData = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      roleType: roleType // Usar roleType conforme o Swagger do PUT
    };

    console.log('Dados de atualização sendo enviados:', updateData);

    this.ngZone.run(() => {
      this.isUpdatingEmployee = true;
      this.cdr.detectChanges();
      
      this.http.put<Employee>(`/api/employees/${this.editingEmployee!.id}`, updateData).subscribe({
        next: (data) => {
          console.log('Funcionário atualizado com sucesso:', data);
          this.ngZone.run(() => {
            this.loadEmployees();
            this.closeEditEmployeeModal();
            alert('Funcionário atualizado com sucesso!');
          });
        },
        error: (error) => {
          console.error('Erro completo ao atualizar funcionário:', error);
          console.error('Status:', error.status);
          console.error('Mensagem:', error.message);
          console.error('Body:', error.error);
          
          this.ngZone.run(() => {
            this.isUpdatingEmployee = false;
            this.cdr.detectChanges();
          });
          
          let errorMessage = 'Erro ao atualizar funcionário.';
          
          if (error.status === 400) {
            if (error.error && error.error.message) {
              errorMessage = `Dados inválidos: ${error.error.message}`;
            } else {
              errorMessage = 'Dados inválidos. Verifique se todos os campos estão preenchidos corretamente.';
            }
          } else if (error.status === 404) {
            errorMessage = 'Funcionário não encontrado.';
          } else if (error.status === 409) {
            errorMessage = 'Já existe um funcionário com esse email.';
          } else if (error.status === 0) {
            errorMessage = 'Erro de conexão. Verifique se o servidor está rodando.';
          } else {
            errorMessage = `Erro ${error.status}: ${error.statusText || 'Erro desconhecido'}`;
          }
          
          alert(errorMessage);
        }
      });
    });
  }

  deleteEmployee(employee: Employee): void {
    if (confirm(`Tem certeza que deseja excluir o funcionário "${employee.name}"?`)) {
      this.ngZone.run(() => {
        this.http.delete(`/api/employees/${employee.id}`).subscribe({
          next: () => {
            this.ngZone.run(() => {
              this.loadEmployees();
              alert('Funcionário excluído com sucesso!');
            });
          },
          error: (error) => {
            console.error('Erro ao excluir funcionário:', error);
            
            if (error.status === 404) {
              alert('Funcionário não encontrado.');
            } else {
              alert('Erro ao excluir funcionário. Tente novamente.');
            }
          }
        });
      });
    }
  }

  reloadPositions(): void {
    this.ngZone.run(() => {
      this.http.get<Position[]>('/positions/').subscribe({
        next: (data) => {
          this.ngZone.run(() => {
            this.positions = data;
            // Atualizar também o filtro de roles
            this.roles = data.map(position => position.name);
            this.cdr.detectChanges();
          });
        },
        error: (error) => {
          console.error('Erro ao recarregar posições:', error);
        }
      });
    });
  }

  filterEmployees(): void {
    this.ngZone.run(() => {
      this.filteredEmployees = this.employees.filter(employee => {
        const matchesName = employee.name.toLowerCase().includes(this.employeeSearch.toLowerCase());
        const matchesRole = this.selectedRole === '' || employee.role === this.selectedRole;
        return matchesName && matchesRole;
      });
      this.cdr.detectChanges();
    });
  }

  openEmployeeModal(employee: Employee): void {
    this.selectedEmployee = employee;
    this.isEmployeeModalOpen = true;
    this.forceChangeDetection();
  }

  closeEmployeeModal(): void {
    this.ngZone.run(() => {
      this.isEmployeeModalOpen = false;
      this.selectedEmployee = null;
      this.cdr.detectChanges();
    });
  }

  closePositionsModal(): void {
    this.ngZone.run(() => {
      this.isPositionsModalOpen = false;
      this.isLoadingPositions = false;
      this.cdr.detectChanges();
    });
  }

  openCreatePositionModal(): void {
    this.isCreatePositionModalOpen = true;
    this.resetNewPositionForm();
    this.forceChangeDetection();
  }

  closeCreatePositionModal(): void {
    this.ngZone.run(() => {
      this.isCreatePositionModalOpen = false;
      this.isCreatingPosition = false;
      this.resetNewPositionForm();
      this.cdr.detectChanges();
    });
  }

  resetNewPositionForm(): void {
    this.newPosition = {
      name: '',
      description: '',
      base_salary: 0
    };
  }

  createPosition(): void {
    if (this.isCreatingPosition) return; 
    
    const name = this.newPosition.name?.toString().trim() || '';
    const description = this.newPosition.description?.toString().trim() || '';
    const baseSalary = this.newPosition.base_salary;
    
    if (!name || !description) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const formattedPosition = {
      name: name.toUpperCase().replace(/\s+/g, '_'),
      description: description,
      base_salary: Number(baseSalary) || 0
    };

    this.ngZone.run(() => {
      this.isCreatingPosition = true;
      this.cdr.detectChanges();
      
      this.http.post<Position>('/positions/', formattedPosition).subscribe({
        next: (data) => {
          this.ngZone.run(() => {
            this.reloadPositions();
            this.closeCreatePositionModal();
            alert('Cargo criado com sucesso!');
          });
        },
        error: (error) => {
          console.error('Erro ao criar posição:', error);
          this.ngZone.run(() => {
            this.isCreatingPosition = false;
            this.cdr.detectChanges();
          });
          
          if (error.status === 400) {
            alert('Dados inválidos. Verifique se todos os campos estão preenchidos corretamente.');
          } else if (error.status === 409) {
            alert('Já existe um cargo com esse nome.');
          } else {
            alert('Erro ao criar cargo. Tente novamente.');
          }
        }
      });
    });
  }

  openEditPositionModal(position: Position): void {
    this.editingPosition = position;
    this.updatedPosition = {
      name: position.name,
      description: position.description,
      base_salary: position.base_salary
    };
    this.isEditPositionModalOpen = true;
    this.forceChangeDetection();
  }

  closeEditPositionModal(): void {
    this.ngZone.run(() => {
      this.isEditPositionModalOpen = false;
      this.isUpdatingPosition = false;
      this.editingPosition = null;
      this.updatedPosition = {
        name: '',
        description: '',
        base_salary: 0
      };
      this.cdr.detectChanges();
    });
  }

  updatePosition(): void {
    if (this.isUpdatingPosition || !this.editingPosition) return;
    
    const name = this.updatedPosition.name?.toString().trim() || '';
    const description = this.updatedPosition.description?.toString().trim() || '';
    const baseSalary = this.updatedPosition.base_salary;
    
    if (!name || !description) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const formattedPosition = {
      name: name.toUpperCase().replace(/\s+/g, '_'),
      description: description,
      base_salary: Number(baseSalary) || 0
    };

    this.ngZone.run(() => {
      this.isUpdatingPosition = true;
      this.cdr.detectChanges();
      
      this.http.put<Position>(`/positions/${this.editingPosition!.id}`, formattedPosition).subscribe({
        next: (data) => {
          this.ngZone.run(() => {
            this.reloadPositions();
            this.closeEditPositionModal();
            alert('Cargo atualizado com sucesso!');
          });
        },
        error: (error) => {
          console.error('Erro ao atualizar posição:', error);
          this.ngZone.run(() => {
            this.isUpdatingPosition = false;
            this.cdr.detectChanges();
          });
          
          if (error.status === 400) {
            alert('Dados inválidos. Verifique se todos os campos estão preenchidos corretamente.');
          } else if (error.status === 409) {
            alert('Já existe um cargo com esse nome.');
          } else if (error.status === 404) {
            alert('Cargo não encontrado.');
          } else {
            alert('Erro ao atualizar cargo. Tente novamente.');
          }
        }
      });
    });
  }

  deletePosition(position: Position): void {
    if (confirm(`Tem certeza que deseja excluir o cargo "${position.name}"?`)) {
      this.ngZone.run(() => {
        this.http.delete(`/positions/${position.id}`).subscribe({
          next: () => {
            this.ngZone.run(() => {
              this.reloadPositions();
              alert('Cargo excluído com sucesso!');
            });
          },
          error: (error) => {
            console.error('Erro ao excluir posição:', error);
            
            if (error.status === 404) {
              alert('Cargo não encontrado.');
            } else if (error.status === 409) {
              alert('Não é possível excluir este cargo pois há funcionários associados a ele.');
            } else {
              alert('Erro ao excluir cargo. Tente novamente.');
            }
          }
        });
      });
    }
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
      case 'PERSONAL_TRAINER':
        return 'Personal Trainer';
      case 'CLEANER':
        return 'Funcionário de Limpeza';
      default:
        return role;
    }
  }

  getRoleDescription(role: string): string {
    switch (role) {
      case 'MANAGER':
        return 'Gerente/Proprietário da academia';
      case 'INSTRUCTOR':
        return 'Instrutor de musculação e exercícios';
      case 'RECEPTIONIST':
        return 'Recepcionista da academia';
      case 'PERSONAL_TRAINER':
        return 'Personal Trainer especializado';
      case 'CLEANER':
        return 'Funcionário de limpeza';
      default:
        return 'Funcionário';
    }
  }

  formatSalary(salary: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(salary);
  }

  // Métodos de validação
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidCPF(cpf: string): boolean {
    // Remove caracteres não numéricos
    const cleanCPF = cpf.replace(/\D/g, '');
    
    // Verifica se tem 11 dígitos
    if (cleanCPF.length !== 11) return false;
    
    // Verifica se não são todos números iguais
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
    
    // Validação do algoritmo do CPF
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    }
    let checkDigit = 11 - (sum % 11);
    if (checkDigit === 10 || checkDigit === 11) checkDigit = 0;
    if (checkDigit !== parseInt(cleanCPF.charAt(9))) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
    }
    checkDigit = 11 - (sum % 11);
    if (checkDigit === 10 || checkDigit === 11) checkDigit = 0;
    if (checkDigit !== parseInt(cleanCPF.charAt(10))) return false;
    
    return true;
  }

  private formatCPFForAPI(cpf: string): string {
    // Remove caracteres não numéricos
    const cleanCPF = cpf.replace(/\D/g, '');
    
    // Retorna apenas os números (muitos backends preferem assim)
    return cleanCPF;
  }

  formatCPFInput(event: any): void {
    const input = event.target;
    let value = input.value.replace(/\D/g, ''); // Remove caracteres não numéricos
    
    // Aplica a máscara
    if (value.length <= 11) {
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3');
      value = value.replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
    }
    
    // Atualiza o modelo
    this.newEmployee.cpf = value;
    input.value = value;
  }

  private formatDateForAPI(dateString: string): string {
    // Se já está no formato YYYY-MM-DD, retorna como está
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    
    // Se está no formato DD/MM/YYYY, converte para YYYY-MM-DD
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
      const [day, month, year] = dateString.split('/');
      return `${year}-${month}-${day}`;
    }
    
    // Retorna como está se não reconhecer o formato
    return dateString;
  }
}