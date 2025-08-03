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
  
  selectedWorkout: Workout | null = null;
  isWorkoutModalOpen = false;
  
  // Create workout modal properties
  showCreateWorkoutModal = false;
  newWorkout: CreateWorkoutRequest = {
    name: '',
    description: '',
    items: []
  };

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
  
  private http = inject(HttpClient);

  ngOnInit(): void {
    this.loadPublicWorkouts();
    this.loadPrivateWorkouts();
    this.loadExercises();
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
}
