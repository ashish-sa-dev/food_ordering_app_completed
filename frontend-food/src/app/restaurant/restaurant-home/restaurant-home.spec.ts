import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RestaurantHome } from './restaurant-home';

describe('RestaurantHome', () => {
  let component: RestaurantHome;
  let fixture: ComponentFixture<RestaurantHome>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RestaurantHome]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RestaurantHome);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
