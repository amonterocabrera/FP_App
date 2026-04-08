import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ModuloListComponent } from './modulo-list.component';

describe('ModuloListComponent', () => {
  let component: ModuloListComponent;
  let fixture: ComponentFixture<ModuloListComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ModuloListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ModuloListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
