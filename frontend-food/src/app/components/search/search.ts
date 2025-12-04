import { Component, EventEmitter, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RestaurantService } from '../../services/restaurant.service';

@Component({
  selector: 'app-search',
  imports: [FormsModule],
  templateUrl: './search.html',
  styleUrl: './search.css',
})
export class Search {
  private restaurantService = inject(RestaurantService);
  searchText: string = '';

  @Output() searchedRestaurant = new EventEmitter<any[] | null>();

  onSearch() {
    if (!this.searchText.trim()) {
      this.searchedRestaurant.emit(null); // send empty event
      return;
    }
    this.restaurantService.searchRestaurants(this.searchText).subscribe((res: any) => {
      this.searchedRestaurant.emit(res);
    });
  }
}
