import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { ForgotPassword } from './pages/forgot-password/forgot-password';
import { Register } from './pages/register/register';
import { RestaurantRegister } from './restaurant/restaurant-register/restaurant-register';
import { Restaurant } from './pages/restaurant/restaurant';
import { Cart } from './pages/cart/cart';
import { Checkout } from './pages/checkout/checkout';
import { RestaurantLogin } from './restaurant/restaurant-login/restaurant-login';
import { RestaurantHome } from './restaurant/restaurant-home/restaurant-home';
import { AuthGuard } from './services/auth.restaurant.guard';
import { AuthGuard as userAuthGuard } from './services/auth.guard';
import { Orders } from './pages/orders/orders';


export const routes: Routes = [
    {path:'login',component:Login},
    { path: 'restaurant/login', component: RestaurantLogin },
    { path: 'restaurant/home', component: RestaurantHome, canActivate: [AuthGuard]  },
    {path:'forgot-password',component:ForgotPassword},
    {path:'register',component:Register},
        {path:'restaurant/register',component:RestaurantRegister},
        {path:'restaurant/:id',component:Restaurant},
        { path: 'cart', component: Cart ,canActivate: [userAuthGuard]},
        { path: 'checkout', component: Checkout ,canActivate: [userAuthGuard]},
        {path:'orders',component:Orders,canActivate: [userAuthGuard]}
];
