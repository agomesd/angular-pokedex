import { TestBed } from '@angular/core/testing';
import { suggestedNickname, TeamMember, TeamService } from './team.service';

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

  it('stores the nickname and role chosen for the swap', () => {
    expect(team.add(bulbasaur)).toEqual({ ok: true });
    expect(team.add(squirtle)).toEqual({ ok: true });

    expect(
      team.replace(1, {
        id: 4,
        name: 'charmander',
        sprite: 'charmander.png',
        nickname: 'Char',
        role: 'Support',
      }),
    ).toEqual({ ok: true });

    expect(team.slots()[0]).toEqual({
      id: 4,
      name: 'charmander',
      sprite: 'charmander.png',
      nickname: 'Char',
      role: 'Support',
    });
    expect(team.slots()[1]).toEqual(squirtle);
  });

  it('refuses a Pokémon that is already on the team', () => {
    team.add(bulbasaur);
    team.add(squirtle);

    expect(
      team.replace(1, { id: 7, name: 'squirtle', sprite: null, nickname: 'Squirt', role: 'Defender' }),
    ).toEqual({
      ok: false,
      reason: 'duplicate',
    });
    expect(team.slots()[0]).toEqual(bulbasaur);
  });

  it('refuses a slot that is not on the team', () => {
    expect(
      team.replace(99, { id: 4, name: 'charmander', sprite: null, nickname: 'Char', role: 'Attacker' }),
    ).toEqual({
      ok: false,
      reason: 'missing',
    });
  });

  it('refuses a nickname that is too short', () => {
    team.add(bulbasaur);

    expect(
      team.replace(1, { id: 4, name: 'charmander', sprite: null, nickname: 'ab', role: 'Attacker' }),
    ).toEqual({ ok: false, reason: 'nickname' });
    expect(team.slots()[0]).toEqual(bulbasaur);
  });

  it('suggests a nickname from the species name when a form name is too long', () => {
    expect(suggestedNickname('charizard-mega-x')).toBe('Charizard');
  });
});

describe('TeamService.setNickname', () => {
  let team: TeamService;

  beforeEach(() => {
    localStorage.removeItem('pokemon-team');
    TestBed.configureTestingModule({});
    team = TestBed.inject(TeamService);
  });

  afterEach(() => localStorage.removeItem('pokemon-team'));

  it('updates the nickname and keeps the role', () => {
    team.add(bulbasaur);

    expect(team.setNickname(1, 'Saur')).toEqual({ ok: true });
    expect(team.members()[0]).toEqual({ ...bulbasaur, nickname: 'Saur' });
  });

  it('refuses a nickname outside 3 to 12 characters', () => {
    team.add(bulbasaur);

    expect(team.setNickname(1, 'no')).toEqual({ ok: false, reason: 'nickname' });
    expect(team.members()[0]?.nickname).toBe('Bulby');
  });
});
