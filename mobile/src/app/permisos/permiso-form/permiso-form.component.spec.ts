import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PermisoFormComponent } from './permiso-form.component';

describe('PermisoFormComponent', () => {
  let component: PermisoFormComponent;
  let fixture: ComponentFixture<PermisoFormComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [PermisoFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PermisoFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
