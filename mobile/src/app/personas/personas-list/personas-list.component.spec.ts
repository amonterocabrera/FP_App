import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PersonasListComponent } from './personas-list.component';

describe('PersonasListComponent', () => {
  let component: PersonasListComponent;
  let fixture: ComponentFixture<PersonasListComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [PersonasListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PersonasListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
