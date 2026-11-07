import { Routes } from '@angular/router';
import { PokemonList } from './pokemon/pokemon-list/pokemon-list.component';
import { PokemonDetail } from './pokemon/pokemon-detail/pokemon-detail.component';
import { DashboardComponent } from './dashboard/dashboard.component';

export const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
  },
  {
    path: 'pokemon',
    component: PokemonList,
  },
  {
    path: 'pokemon/:id',
    component: PokemonDetail,
  },
];
