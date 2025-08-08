import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Facial } from './facial';

describe('Facial', () => {
  let component: Facial;
  let fixture: ComponentFixture<Facial>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Facial]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Facial);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
