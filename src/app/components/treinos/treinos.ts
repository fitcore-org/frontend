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

interface CreatePrivateWorkoutRequest {
  name: string;
  description: string;
  items: CreateWorkoutItem[];
  studentIds: string[];
}

interface UpdatePrivateWorkoutRequest {
  name: string;
  description: string;
  items: CreateWorkoutItem[];
  studentIds: string[];
}

interface UpdateWorkoutRequest {
  name: string;
  description: string;
  items: CreateWorkoutItem[];
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

  // Edit private workout modal properties
  showEditPrivateWorkoutModal = false;
  editPrivateWorkout: UpdatePrivateWorkoutRequest = {
    name: '',
    description: '',
    items: [],
    studentIds: []
  };
  editingWorkoutId: string = '';
  tempEditSelectedStudentIds: string[] = []; // Lista temporária para seleção de alunos na edição
  originalStudentIds: string[] = []; // Guarde os IDs originais para preservar seleção

  // Edit public workout modal properties
  showEditPublicWorkoutModal = false;
  editPublicWorkout: UpdateWorkoutRequest = {
    name: '',
    description: '',
    items: []
  };
  editingPublicWorkoutId: string = '';

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
        console.error('Erro ao carregar estudantes:', error);
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

  moveExerciseInPrivateWorkout(index: number, direction: number): void {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= this.newPrivateWorkout.items.length) return;
    
    const items = [...this.newPrivateWorkout.items];
    [items[index], items[newIndex]] = [items[newIndex], items[index]];
    
    // Update orders
    items.forEach((item, i) => {
      item.order = i + 1;
    });
    
    this.newPrivateWorkout.items = items;
  }

  createPrivateWorkout(): void {
    // Validação completa dos campos obrigatórios
    if (!this.newPrivateWorkout.name || !this.newPrivateWorkout.name.trim()) {
      alert('Por favor, preencha o nome do treino.');
      return;
    }

    if (!this.newPrivateWorkout.description || !this.newPrivateWorkout.description.trim()) {
      alert('Por favor, preencha a descrição do treino.');
      return;
    }

    if (this.newPrivateWorkout.items.length === 0) {
      alert('Por favor, adicione pelo menos um exercício ao treino.');
      return;
    }

    if (this.tempSelectedStudentIds.length === 0) {
      alert('Por favor, selecione pelo menos um aluno para o treino privado.');
      return;
    }

    for (let i = 0; i < this.newPrivateWorkout.items.length; i++) {
      const item = this.newPrivateWorkout.items[i];
      if (!item.sets || !item.reps || !item.restSeconds) {
        alert(`Por favor, preencha todos os campos do exercício ${i + 1}.`);
        return;
      }
    }

    // Definir os studentIds a partir dos IDs selecionados temporariamente
    this.newPrivateWorkout.studentIds = [...this.tempSelectedStudentIds];

    this.http.post('/api/v1/workouts/private', this.newPrivateWorkout).subscribe({
      next: () => {
        alert('Treino privado criado com sucesso!');
        this.closeCreatePrivateWorkoutModal();
        this.loadPrivateWorkouts(); 
      },
      error: (error) => {
        console.error('Erro ao criar treino privado:', error);
        alert('Erro ao criar treino privado. Tente novamente.');
      }
    });
  }

  getSelectedStudentsForPrivateWorkout(): Student[] {
    return this.tempSelectedStudentIds
      .map(id => this.allStudents().find(student => student.id === id))
      .filter(student => student !== undefined) as Student[];
  }

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

  getStudentById(studentId: string): Student | undefined {
    return this.allStudents().find(student => student.id === studentId);
  }

  // Edit Private Workout Methods
  loadWorkoutById(workoutId: string): void {
    this.http.get<Workout>(`/api/v1/workouts/${workoutId}`).subscribe({
      next: (workout) => {
        this.editPrivateWorkout = {
          name: workout.name,
          description: workout.description,
          items: workout.items.map(item => ({
            exerciseId: item.exercise.id,
            sets: item.sets,
            reps: item.reps,
            restSeconds: item.restSeconds,
            observation: item.observation,
            order: item.order
          })),
          studentIds: workout.studentIds || []
        };
  this.originalStudentIds = workout.studentIds || [];
  this.tempEditSelectedStudentIds = [...this.originalStudentIds];
        this.editingWorkoutId = workoutId;
        this.showEditPrivateWorkoutModal = true;
      },
      error: (error) => {
        console.error('Erro ao carregar treino:', error);
        alert('Erro ao carregar treino. Tente novamente.');
      }
    });
  }

  openEditPrivateWorkoutModal(workoutId: string): void {
    this.exerciseSearchTerm.set('');
    this.studentSearchTerm.set('');
    this.loadWorkoutById(workoutId);
  }

  closeEditPrivateWorkoutModal(): void {
    this.showEditPrivateWorkoutModal = false;
    this.editPrivateWorkout = {
      name: '',
      description: '',
      items: [],
      studentIds: []
    };
  this.tempEditSelectedStudentIds = [];
  this.originalStudentIds = [];
  this.editingWorkoutId = '';
    this.exerciseSearchTerm.set('');
    this.studentSearchTerm.set('');
  }

  updatePrivateWorkout(): void {
    if (!this.editPrivateWorkout.name.trim() || this.editPrivateWorkout.items.length === 0) {
      alert('Por favor, preencha o nome do treino e adicione pelo menos um exercício.');
      return;
    }

    // Sempre usar tempEditSelectedStudentIds que já contém os IDs corretos
    this.editPrivateWorkout.studentIds = [...this.tempEditSelectedStudentIds];

    this.http.put(`/api/v1/workouts/private/${this.editingWorkoutId}`, this.editPrivateWorkout).subscribe({
      next: () => {
        alert('Treino privado atualizado com sucesso!');
        this.closeEditPrivateWorkoutModal();
        this.loadPrivateWorkouts(); 
      },
      error: (error) => {
        console.error('Erro ao atualizar treino privado:', error);
        alert('Erro ao atualizar treino privado. Tente novamente.');
      }
    });
  }

  // Edit workout helper methods
  getSelectedStudentsForEditPrivateWorkout(): Student[] {
    return this.tempEditSelectedStudentIds
      .map(id => this.allStudents().find(student => student.id === id))
      .filter(student => student !== undefined) as Student[];
  }

  getAvailableStudentsForEditPrivateWorkout(): Student[] {
    const search = this.studentSearchTerm().toLowerCase();
    let students = this.allStudents();
    
    if (search) {
      students = students.filter(student =>
        student.name.toLowerCase().includes(search) ||
        student.cpf.includes(search) ||
        student.email.toLowerCase().includes(search)
      );
    }
    
    return students.filter(student => !this.tempEditSelectedStudentIds.includes(student.id));
  }

  addStudentToEditPrivateWorkout(student: Student): void {
    if (!this.tempEditSelectedStudentIds.includes(student.id)) {
      this.tempEditSelectedStudentIds.push(student.id);
    }
  }

  removeStudentFromEditPrivateWorkout(studentId: string): void {
    this.tempEditSelectedStudentIds = this.tempEditSelectedStudentIds.filter(id => id !== studentId);
  }

  addExerciseToEditPrivateWorkout(exercise: Exercise): void {
    const newItem: CreateWorkoutItem = {
      exerciseId: exercise.id,
      sets: '3',
      reps: '12',
      restSeconds: 60,
      observation: '',
      order: this.editPrivateWorkout.items.length + 1
    };
    
    this.editPrivateWorkout.items.push(newItem);
  }

  removeExerciseFromEditPrivateWorkout(index: number): void {
    this.editPrivateWorkout.items.splice(index, 1);
    this.editPrivateWorkout.items.forEach((item, i) => {
      item.order = i + 1;
    });
  }

  moveExerciseInEditPrivateWorkout(index: number, direction: number): void {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= this.editPrivateWorkout.items.length) return;

    const temp = this.editPrivateWorkout.items[index];
    this.editPrivateWorkout.items[index] = this.editPrivateWorkout.items[newIndex];
    this.editPrivateWorkout.items[newIndex] = temp;

    this.editPrivateWorkout.items.forEach((item, i) => {
      item.order = i + 1;
    });
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

    this.newWorkout.items.forEach((item, i) => {
      item.order = i + 1;
    });
  }

  moveExercise(index: number, direction: number): void {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= this.newWorkout.items.length) return;
    
    const items = [...this.newWorkout.items];
    [items[index], items[newIndex]] = [items[newIndex], items[index]];
    
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
        this.loadPublicWorkouts(); 
      },
      error: (error) => {
        console.error('Erro ao criar treino:', error);
        alert('Erro ao criar treino. Tente novamente.');
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
      
      const sets = parseInt(item.sets) || 0;
      const executionTime = sets * 30;
      const restTime = (sets - 1) * item.restSeconds; 
      
      totalTime += executionTime + restTime;
    });
    

    totalTime += (workout.items.length - 1) * 30;
    
    return Math.ceil(totalTime / 60); 
  }

  deletePrivateWorkout(workoutId: string, workoutName: string): void {
    if (confirm(`Tem certeza que deseja deletar o treino "${workoutName}"? Esta ação não pode ser desfeita.`)) {
      this.http.delete(`/api/v1/workouts/private/${workoutId}`).subscribe({
        next: () => {
          alert('Treino privado deletado com sucesso!');
          this.loadPrivateWorkouts(); 
        },
        error: (error) => {
          console.error('Erro ao deletar treino privado:', error);
          alert('Erro ao deletar treino privado. Tente novamente.');
        }
      });
    }
  }

  deletePublicWorkout(workoutId: string, workoutName: string): void {
    if (confirm(`Tem certeza que deseja deletar o treino "${workoutName}"? Esta ação não pode ser desfeita.`)) {
      this.http.delete(`/api/v1/workouts/${workoutId}`).subscribe({
        next: () => {
          alert('Treino público deletado com sucesso!');
          this.loadPublicWorkouts(); 
        },
        error: (error) => {
          console.error('Erro ao deletar treino público:', error);
          alert('Erro ao deletar treino público. Tente novamente.');
        }
      });
    }
  }

  // Edit Public Workout Methods
  loadPublicWorkoutById(workoutId: string): void {
    this.http.get<Workout>(`/api/v1/workouts/${workoutId}`).subscribe({
      next: (workout) => {
        this.editPublicWorkout = {
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
        this.editingPublicWorkoutId = workoutId;
        this.showEditPublicWorkoutModal = true;
      },
      error: (error) => {
        console.error('Erro ao carregar treino público:', error);
        alert('Erro ao carregar treino público. Tente novamente.');
      }
    });
  }

  openEditPublicWorkoutModal(workoutId: string): void {
    this.exerciseSearchTerm.set('');
    this.loadPublicWorkoutById(workoutId);
  }

  closeEditPublicWorkoutModal(): void {
    this.showEditPublicWorkoutModal = false;
    this.editPublicWorkout = {
      name: '',
      description: '',
      items: []
    };
    this.editingPublicWorkoutId = '';
    this.exerciseSearchTerm.set('');
  }

  updatePublicWorkout(): void {
    if (!this.editPublicWorkout.name.trim() || this.editPublicWorkout.items.length === 0) {
      alert('Por favor, preencha o nome do treino e adicione pelo menos um exercício.');
      return;
    }

    this.http.put(`/api/v1/workouts/${this.editingPublicWorkoutId}`, this.editPublicWorkout).subscribe({
      next: () => {
        alert('Treino público atualizado com sucesso!');
        this.closeEditPublicWorkoutModal();
        this.loadPublicWorkouts(); 
      },
      error: (error) => {
        console.error('Erro ao atualizar treino público:', error);
        alert('Erro ao atualizar treino público. Tente novamente.');
      }
    });
  }

  // Edit public workout helper methods
  addExerciseToEditPublicWorkout(exercise: Exercise): void {
    const newItem: CreateWorkoutItem = {
      exerciseId: exercise.id,
      sets: '3',
      reps: '12',
      restSeconds: 60,
      observation: '',
      order: this.editPublicWorkout.items.length + 1
    };
    
    this.editPublicWorkout.items.push(newItem);
  }

  removeExerciseFromEditPublicWorkout(index: number): void {
    this.editPublicWorkout.items.splice(index, 1);
    this.editPublicWorkout.items.forEach((item, i) => {
      item.order = i + 1;
    });
  }

  moveExerciseInEditPublicWorkout(index: number, direction: number): void {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= this.editPublicWorkout.items.length) return;

    const temp = this.editPublicWorkout.items[index];
    this.editPublicWorkout.items[index] = this.editPublicWorkout.items[newIndex];
    this.editPublicWorkout.items[newIndex] = temp;

    this.editPublicWorkout.items.forEach((item, i) => {
      item.order = i + 1;
    });
  }


}
