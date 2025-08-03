import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Funcionarios } from './funcionarios';

describe('Funcionarios', () => {
  let component: Funcionarios;
  let fixture: ComponentFixture<Funcionarios>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Funcionarios]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Funcionarios);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
