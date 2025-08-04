import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface Exercise {
  id: string;
  name: string;
  description: string;
  muscleGroup: string;
  equipment: string;
  mediaUrl?: string;
  mediaUrl2?: string;
}

interface WorkoutItem {
  id: string;
  exercise: Exercise;
  sets: string;
  reps: string;
  restSeconds: number;
  observation: string;
  order: number;
}

interface CreateWorkoutItem {
  exerciseId: string;
  sets: string;
  reps: string;
  restSeconds: number;
  observation: string;
  order: number;
}

interface CreateWorkoutRequest {
  name: string;
  description: string;
  items: CreateWorkoutItem[];
}

interface CreatePrivateWorkoutRequest {
  name: string;
  description: string;
  items: CreateWorkoutItem[];
  studentIds: string[];
}

interface UpdateWorkoutRequest {
  name: string;
  description: string;
  items: CreateWorkoutItem[];
  studentIds?: string[];
}

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

interface Workout {
  id: string;
  name: string;
  description: string;
  isPublic: boolean;
  items: WorkoutItem[];
  studentIds: string[];
}

@Component({
  selector: 'app-treinos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './treinos.html',
  styleUrl: './treinos.scss'
})
export class Treinos implements OnInit {
  private allPublicWorkouts = signal<Workout[]>([]);
  private allPrivateWorkouts = signal<Workout[]>([]);
  private searchTerm = signal<string>('');
  private allExercises = signal<Exercise[]>([]);
  private exerciseSearchTerm = signal<string>('');
  private allStudents = signal<Student[]>([]);
  private studentSearchTerm = signal<string>('');
  
  selectedWorkout: Workout | null = null;
  isWorkoutModalOpen = false;
  
  // Student management modal properties
  showStudentManagementModal = false;
  selectedWorkoutForStudents: Workout | null = null;
  tempStudentIds: string[] = []; // Lista temporária de IDs de alunos
  
  // Create workout modal properties
  showCreateWorkoutModal = false;
  newWorkout: CreateWorkoutRequest = {
    name: '',
    description: '',
    items: []
  };

  // Create private workout modal properties
  showCreatePrivateWorkoutModal = false;
  newPrivateWorkout: CreatePrivateWorkoutRequest = {
    name: '',
    description: '',
    items: [],
    studentIds: []
  };
  tempSelectedStudentIds: string[] = []; // Lista temporária para seleção de alunos na criação

  // Edit workout modal properties
  showEditWorkoutModal = false;
  editWorkout: UpdateWorkoutRequest = {
    name: '',
    description: '',
    items: []
  };
  editWorkoutId: string = '';

  get workoutSearch(): string {
    return this.searchTerm();
  }
  
  set workoutSearch(value: string) {
    this.searchTerm.set(value);
  }

  get exerciseSearch(): string {
    return this.exerciseSearchTerm();
  }
  
  set exerciseSearch(value: string) {
    this.exerciseSearchTerm.set(value);
  }

  get studentSearch(): string {
    return this.studentSearchTerm();
  }
  
  set studentSearch(value: string) {
    this.studentSearchTerm.set(value);
  }
  
  private http = inject(HttpClient);

  ngOnInit(): void {
    this.loadPublicWorkouts();
    this.loadPrivateWorkouts();
    this.loadExercises();
    this.loadStudents();
  }

  loadPublicWorkouts(): void {
    this.http.get<Workout[]>('/api/v1/workouts/public').subscribe({
      next: (data) => {
        this.allPublicWorkouts.set(data);
      },
      error: (error) => {
        console.error('Erro ao carregar treinos públicos:', error);
      }
    });
  }

  loadPrivateWorkouts(): void {
    this.http.get<Workout[]>('/api/v1/workouts/private').subscribe({
      next: (data) => {
        this.allPrivateWorkouts.set(data);
      },
      error: (error) => {
        console.error('Erro ao carregar treinos privados:', error);
      }
    });
  }

  loadExercises(): void {
    this.http.get<Exercise[]>('/api/v1/exercises').subscribe({
      next: (data) => {
        this.allExercises.set(data);
      },
      error: (error) => {
        console.error('Erro ao carregar exercícios:', error);
      }
    });
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

  getFilteredPublicWorkouts(): Workout[] {
    const search = this.searchTerm().toLowerCase();
    if (!search) return this.allPublicWorkouts();
    return this.allPublicWorkouts().filter(workout =>
      workout.name.toLowerCase().includes(search) ||
      workout.description.toLowerCase().includes(search) ||
      workout.items.some(item => 
        item.exercise.name.toLowerCase().includes(search) ||
        item.exercise.muscleGroup.toLowerCase().includes(search)
      )
    );
  }

  getFilteredPrivateWorkouts(): Workout[] {
    const search = this.searchTerm().toLowerCase();
    if (!search) return this.allPrivateWorkouts();
    return this.allPrivateWorkouts().filter(workout =>
      workout.name.toLowerCase().includes(search) ||
      workout.description.toLowerCase().includes(search) ||
      workout.items.some(item => 
        item.exercise.name.toLowerCase().includes(search) ||
        item.exercise.muscleGroup.toLowerCase().includes(search)
      )
    );
  }

  getAllWorkouts(): Workout[] {
    return [...this.allPublicWorkouts(), ...this.allPrivateWorkouts()];
  }

  openWorkoutModal(workout: Workout): void {
    this.selectedWorkout = workout;
    this.isWorkoutModalOpen = true;
  }

  closeWorkoutModal(): void {
    this.isWorkoutModalOpen = false;
    this.selectedWorkout = null;
  }

  // Create workout modal methods
  openCreateWorkoutModal(): void {
    this.showCreateWorkoutModal = true;
    this.newWorkout = {
      name: '',
      description: '',
      items: []
    };
  }

  closeCreateWorkoutModal(): void {
    this.showCreateWorkoutModal = false;
    this.newWorkout = {
      name: '',
      description: '',
      items: []
    };
    this.exerciseSearchTerm.set('');
  }

  getFilteredExercises(): Exercise[] {
    const search = this.exerciseSearchTerm().toLowerCase();
    if (!search) return this.allExercises();
    return this.allExercises().filter(exercise =>
      exercise.name.toLowerCase().includes(search) ||
      exercise.muscleGroup.toLowerCase().includes(search) ||
      exercise.equipment.toLowerCase().includes(search)
    );
  }

  addExerciseToWorkout(exercise: Exercise): void {
    const newItem: CreateWorkoutItem = {
      exerciseId: exercise.id,
      sets: '3',
      reps: '12',
      restSeconds: 60,
      observation: '',
      order: this.newWorkout.items.length + 1
    };
    
    this.newWorkout.items.push(newItem);
  }

  removeExerciseFromWorkout(index: number): void {
    this.newWorkout.items.splice(index, 1);
    // Reorder items
    this.newWorkout.items.forEach((item, i) => {
      item.order = i + 1;
    });
  }

  moveExercise(index: number, direction: number): void {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= this.newWorkout.items.length) return;
    
    const items = [...this.newWorkout.items];
    [items[index], items[newIndex]] = [items[newIndex], items[index]];
    
    // Update orders
    items.forEach((item, i) => {
      item.order = i + 1;
    });
    
    this.newWorkout.items = items;
  }

  getExerciseById(exerciseId: string): Exercise | undefined {
    return this.allExercises().find(exercise => exercise.id === exerciseId);
  }

  createWorkout(): void {
    if (!this.newWorkout.name.trim() || this.newWorkout.items.length === 0) {
      alert('Por favor, preencha o nome do treino e adicione pelo menos um exercício.');
      return;
    }

    this.http.post('/api/v1/workouts', this.newWorkout).subscribe({
      next: () => {
        alert('Treino criado com sucesso!');
        this.closeCreateWorkoutModal();
        this.loadPublicWorkouts(); // Reload workouts
      },
      error: (error) => {
        console.error('Erro ao criar treino:', error);
        alert('Erro ao criar treino. Tente novamente.');
      }
    });
  }

  // Create private workout modal methods
  openCreatePrivateWorkoutModal(): void {
    this.showCreatePrivateWorkoutModal = true;
    this.newPrivateWorkout = {
      name: '',
      description: '',
      items: [],
      studentIds: []
    };
    this.tempSelectedStudentIds = [];
  }

  closeCreatePrivateWorkoutModal(): void {
    this.showCreatePrivateWorkoutModal = false;
    this.newPrivateWorkout = {
      name: '',
      description: '',
      items: [],
      studentIds: []
    };
    this.tempSelectedStudentIds = [];
    this.exerciseSearchTerm.set('');
    this.studentSearchTerm.set('');
  }

  addStudentToPrivateWorkout(studentId: string): void {
    if (!this.tempSelectedStudentIds.includes(studentId)) {
      this.tempSelectedStudentIds.push(studentId);
    }
  }

  removeStudentFromPrivateWorkout(studentId: string): void {
    this.tempSelectedStudentIds = this.tempSelectedStudentIds.filter(id => id !== studentId);
  }

  isStudentSelectedForPrivateWorkout(studentId: string): boolean {
    return this.tempSelectedStudentIds.includes(studentId);
  }

  addExerciseToPrivateWorkout(exercise: Exercise): void {
    const newItem: CreateWorkoutItem = {
      exerciseId: exercise.id,
      sets: '3',
      reps: '10',
      restSeconds: 60,
      observation: '',
      order: this.newPrivateWorkout.items.length + 1
    };
    this.newPrivateWorkout.items.push(newItem);
  }

  removeExerciseFromPrivateWorkout(index: number): void {
    this.newPrivateWorkout.items.splice(index, 1);
    // Reorder items
    this.newPrivateWorkout.items.forEach((item, i) => {
      item.order = i + 1;
    });
  }

  createPrivateWorkout(): void {
    if (!this.newPrivateWorkout.name.trim() || this.newPrivateWorkout.items.length === 0) {
      alert('Por favor, preencha o nome do treino e adicione pelo menos um exercício.');
      return;
    }

    if (this.tempSelectedStudentIds.length === 0) {
      alert('Por favor, selecione pelo menos um aluno para o treino privado.');
      return;
    }

    // Set student IDs from temporary selection
    this.newPrivateWorkout.studentIds = [...this.tempSelectedStudentIds];

    this.http.post('/api/v1/workouts/private', this.newPrivateWorkout).subscribe({
      next: () => {
        alert('Treino privado criado com sucesso!');
        this.closeCreatePrivateWorkoutModal();
        this.loadPrivateWorkouts(); // Reload private workouts
      },
      error: (error) => {
        console.error('Erro ao criar treino privado:', error);
        alert('Erro ao criar treino privado. Tente novamente.');
      }
    });
  }

  deleteWorkout(workoutId: string, workoutName: string): void {
    if (confirm(`Tem certeza que deseja deletar o treino "${workoutName}"? Esta ação não pode ser desfeita.`)) {
      this.http.delete(`/api/v1/workouts/${workoutId}`).subscribe({
        next: () => {
          alert('Treino deletado com sucesso!');
          this.loadPublicWorkouts();
          this.loadPrivateWorkouts();
          // Fechar modal se o treino deletado estava sendo visualizado
          if (this.selectedWorkout && this.selectedWorkout.id === workoutId) {
            this.closeWorkoutModal();
          }
        },
        error: (error) => {
          console.error('Erro ao deletar treino:', error);
          alert('Erro ao deletar treino. Tente novamente.');
        }
      });
    }
  }

  // Edit workout modal methods
  openEditWorkoutModal(workout: Workout): void {
    this.editWorkoutId = workout.id;
    this.editWorkout = {
      name: workout.name,
      description: workout.description,
      items: workout.items.map(item => ({
        exerciseId: item.exercise.id,
        sets: item.sets,
        reps: item.reps,
        restSeconds: item.restSeconds,
        observation: item.observation,
        order: item.order
      }))
    };
    this.showEditWorkoutModal = true;
    this.exerciseSearchTerm.set('');
    
    // Fechar modal de detalhes se estiver aberto
    if (this.selectedWorkout) {
      this.closeWorkoutModal();
    }
  }

  closeEditWorkoutModal(): void {
    this.showEditWorkoutModal = false;
    this.editWorkout = {
      name: '',
      description: '',
      items: []
    };
    this.editWorkoutId = '';
    this.exerciseSearchTerm.set('');
  }

  addExerciseToEditWorkout(exercise: Exercise): void {
    const newItem: CreateWorkoutItem = {
      exerciseId: exercise.id,
      sets: '3',
      reps: '12',
      restSeconds: 60,
      observation: '',
      order: this.editWorkout.items.length + 1
    };
    
    this.editWorkout.items.push(newItem);
  }

  removeExerciseFromEditWorkout(index: number): void {
    this.editWorkout.items.splice(index, 1);
    // Reorder items
    this.editWorkout.items.forEach((item, i) => {
      item.order = i + 1;
    });
  }

  moveExerciseInEdit(index: number, direction: number): void {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= this.editWorkout.items.length) return;
    
    const items = [...this.editWorkout.items];
    [items[index], items[newIndex]] = [items[newIndex], items[index]];
    
    // Update orders
    items.forEach((item, i) => {
      item.order = i + 1;
    });
    
    this.editWorkout.items = items;
  }

  updateWorkout(): void {
    if (!this.editWorkout.name.trim() || this.editWorkout.items.length === 0) {
      alert('Por favor, preencha o nome do treino e adicione pelo menos um exercício.');
      return;
    }

    this.http.put(`/api/v1/workouts/${this.editWorkoutId}`, this.editWorkout).subscribe({
      next: () => {
        alert('Treino atualizado com sucesso!');
        this.closeEditWorkoutModal();
        this.loadPublicWorkouts();
        this.loadPrivateWorkouts();
        // Fechar modal de detalhes se estava aberto
        if (this.selectedWorkout && this.selectedWorkout.id === this.editWorkoutId) {
          this.closeWorkoutModal();
        }
      },
      error: (error) => {
        console.error('Erro ao atualizar treino:', error);
        alert('Erro ao atualizar treino. Tente novamente.');
      }
    });
  }

  calculateTotalSets(workout: Workout): number {
    return workout.items.reduce((total, item) => {
      const sets = parseInt(item.sets) || 0;
      return total + sets;
    }, 0);
  }

  getMainMuscleGroups(workout: Workout): string {
    const muscleGroups = new Set(
      workout.items.map(item => item.exercise.muscleGroup)
    );
    
    const groups = Array.from(muscleGroups).map(group => 
      group.charAt(0).toUpperCase() + group.slice(1)
    );
    
    if (groups.length <= 2) {
      return groups.join(', ');
    } else {
      return `${groups.slice(0, 2).join(', ')} +${groups.length - 2}`;
    }
  }

  calculateEstimatedTime(workout: Workout): number {
    let totalTime = 0;
    
    workout.items.forEach(item => {
      // Tempo estimado por série (30 segundos de execução)
      const sets = parseInt(item.sets) || 0;
      const executionTime = sets * 30; // 30 segundos por série
      const restTime = (sets - 1) * item.restSeconds; // descanso entre séries
      
      totalTime += executionTime + restTime;
    });
    
    // Adiciona tempo de transição entre exercícios (30 segundos cada)
    totalTime += (workout.items.length - 1) * 30;
    
    return Math.ceil(totalTime / 60); // Converte para minutos
  }

  // Student management methods
  openStudentManagementModal(workout: Workout): void {
    this.selectedWorkoutForStudents = workout;
    this.tempStudentIds = [...workout.studentIds]; // Copia os IDs atuais para a lista temporária
    this.showStudentManagementModal = true;
    this.studentSearchTerm.set('');
  }

  closeStudentManagementModal(): void {
    this.showStudentManagementModal = false;
    this.selectedWorkoutForStudents = null;
    this.tempStudentIds = [];
    this.studentSearchTerm.set('');
  }

  getFilteredStudents(): Student[] {
    const search = this.studentSearchTerm().toLowerCase();
    if (!search) return this.allStudents();
    return this.allStudents().filter(student =>
      student.name.toLowerCase().includes(search) ||
      student.cpf.includes(search) ||
      student.email.toLowerCase().includes(search)
    );
  }

  getStudentsFromWorkout(workout: Workout): Student[] {
    return this.allStudents().filter(student => 
      workout.studentIds.includes(student.id)
    );
  }

  getTempStudentsFromWorkout(): Student[] {
    return this.allStudents().filter(student => 
      this.tempStudentIds.includes(student.id)
    );
  }

  getAvailableStudents(workout: Workout): Student[] {
    return this.getFilteredStudents().filter(student => 
      !this.tempStudentIds.includes(student.id) // Usa a lista temporária
    );
  }

  addStudentToWorkout(studentId: string): void {
    if (!this.tempStudentIds.includes(studentId)) {
      this.tempStudentIds.push(studentId);
    }
  }

  confirmStudentChanges(): void {
    if (!this.selectedWorkoutForStudents) return;

    const updateData = {
      studentIds: this.tempStudentIds
    };

    this.http.put(`/api/v1/workouts/${this.selectedWorkoutForStudents.id}`, updateData).subscribe({
      next: () => {
        this.loadPrivateWorkouts();
        // Atualizar o workout selecionado
        if (this.selectedWorkoutForStudents) {
          this.selectedWorkoutForStudents.studentIds = this.tempStudentIds;
        }
        this.closeStudentManagementModal();
        alert('Alunos do treino atualizados com sucesso!');
      },
      error: (error) => {
        console.error('Erro ao atualizar alunos do treino:', error);
        alert('Erro ao atualizar alunos do treino. Tente novamente.');
      }
    });
  }

  removeStudentFromWorkout(studentId: string): void {
    this.tempStudentIds = this.tempStudentIds.filter(id => id !== studentId);
  }

  getStudentById(studentId: string): Student | undefined {
    return this.allStudents().find(student => student.id === studentId);
  }

  // Methods for filtering students in private workout creation
  getAvailableStudentsForPrivateWorkout(): Student[] {
    const search = this.studentSearchTerm().toLowerCase();
    let students = this.allStudents();
    
    if (search) {
      students = students.filter(student =>
        student.name.toLowerCase().includes(search) ||
        student.cpf.includes(search) ||
        student.email.toLowerCase().includes(search)
      );
    }
    
    return students.filter(student => !this.tempSelectedStudentIds.includes(student.id));
  }

  getSelectedStudentsForPrivateWorkout(): Student[] {
    return this.tempSelectedStudentIds
      .map(id => this.allStudents().find(student => student.id === id))
      .filter(student => student !== undefined) as Student[];
  }
}
