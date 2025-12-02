import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RestaurantRegister } from './restaurant-register';

describe('RestaurantRegister', () => {
  let component: RestaurantRegister;
  let fixture: ComponentFixture<RestaurantRegister>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RestaurantRegister]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RestaurantRegister);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
