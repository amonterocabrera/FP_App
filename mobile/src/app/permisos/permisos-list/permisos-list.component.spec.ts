import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PermisosListComponent } from './permisos-list.component';

describe('PermisosListComponent', () => {
  let component: PermisosListComponent;
  let fixture: ComponentFixture<PermisosListComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [PermisosListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PermisosListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
