import { Component, Input } from '@angular/core';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-restaurant-card',
  templateUrl: './restaurant-card.html',
  styleUrl: './restaurant-card.css',
  imports: [RouterLink]
})
export class RestaurantCard {
  @Input() restaurants: any[] = [];
  @Input() title!:string;
}
