import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PersonaFormComponent } from './persona-form.component';

describe('PersonaFormComponent', () => {
  let component: PersonaFormComponent;
  let fixture: ComponentFixture<PersonaFormComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [PersonaFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PersonaFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
