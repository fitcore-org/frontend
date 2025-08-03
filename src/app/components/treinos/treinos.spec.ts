import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Treinos } from './treinos';

describe('Treinos', () => {
  let component: Treinos;
  let fixture: ComponentFixture<Treinos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Treinos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Treinos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
