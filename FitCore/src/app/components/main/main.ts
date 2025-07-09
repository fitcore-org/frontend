import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './main.html',
  styleUrls: ['./main.scss']
})
export class Main {
  tab = 'alunos';

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
