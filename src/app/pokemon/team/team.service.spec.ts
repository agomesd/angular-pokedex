import { TestBed } from '@angular/core/testing';
import { TeamMember, TeamService } from './team.service';

const bulbasaur: TeamMember = {
  id: 1,
  name: 'bulbasaur',
  sprite: null,
  nickname: 'Bulby',
  role: 'Attacker',
};

const squirtle: TeamMember = {
  id: 7,
  name: 'squirtle',
  sprite: null,
  nickname: 'Squirt',
  role: 'Defender',
};

describe('TeamService.replace', () => {
  let team: TeamService;

  beforeEach(() => {
    localStorage.removeItem('pokemon-team');
    TestBed.configureTestingModule({});
    team = TestBed.inject(TeamService);
  });

  afterEach(() => localStorage.removeItem('pokemon-team'));

  it('replaces the compared slot and keeps its role', () => {
    expect(team.add(bulbasaur)).toEqual({ ok: true });
    expect(team.add(squirtle)).toEqual({ ok: true });

    expect(team.replace(1, { id: 4, name: 'charmander', sprite: 'charmander.png' })).toEqual({ ok: true });

    expect(team.slots()[0]).toEqual({
      id: 4,
      name: 'charmander',
      sprite: 'charmander.png',
      nickname: 'Charmander',
      role: 'Attacker',
    });
    expect(team.slots()[1]).toEqual(squirtle);
  });

  it('refuses a Pokémon that is already on the team', () => {
    team.add(bulbasaur);
    team.add(squirtle);

    expect(team.replace(1, { id: 7, name: 'squirtle', sprite: null })).toEqual({
      ok: false,
      reason: 'duplicate',
    });
    expect(team.slots()[0]).toEqual(bulbasaur);
  });

  it('refuses a slot that is not on the team', () => {
    expect(team.replace(99, { id: 4, name: 'charmander', sprite: null })).toEqual({
      ok: false,
      reason: 'missing',
    });
  });

  it('uses the species name when a form name is too long for a nickname', () => {
    team.add(bulbasaur);

    expect(team.replace(1, { id: 10034, name: 'charizard-mega-x', sprite: null })).toEqual({ ok: true });
    expect(team.members()[0]?.nickname).toBe('Charizard');
  });
});
