import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RestaurantLogin } from './restaurant-login';

describe('RestaurantLogin', () => {
  let component: RestaurantLogin;
  let fixture: ComponentFixture<RestaurantLogin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RestaurantLogin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RestaurantLogin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
