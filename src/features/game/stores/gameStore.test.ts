import GameStore from './gameStore.js';

describe('GameStore', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test('initial state after construction', () => {
    const store = new GameStore();
    expect(store.getState()).toEqual({ moles: {}, score: 0, running: false });
  });

  test('start() initializes moles, running, timestamps and score', () => {
    const store = new GameStore();
    const now = 1_700_000_000_000;
    const endsAt = now + 30_000;
    store.start(12, now, endsAt);

    const state = store.getState();
    expect(state.running).toBe(true);
    expect(state.startedAt).toBe(now);
    expect(state.endsAt).toBe(endsAt);
    expect(state.score).toBe(0);

    // 12 moles indexed 0..11 and all holes
    expect(Object.keys(state.moles)).toHaveLength(12);
    for (let i = 0; i < 12; i++) {
      expect(state.moles[i]).toEqual({ id: i, state: 'hole' });
    }
  });

  test('nominateMole() switches mole to mole, and errors on invalid id', () => {
    const store = new GameStore();
    store.start(3, Date.now(), Date.now() + 1000);

    store.nominateMole(1);
    expect(store.getState().moles[1]?.state).toBe('mole');

    expect(() => store.nominateMole(99)).toThrow('Mole not found');
  });

  test('setMoleExpiration() sets expireAt and errors on invalid id', () => {
    const store = new GameStore();
    store.start(2, Date.now(), Date.now() + 1000);

    store.setMoleExpiration(0, 123456);
    expect(store.getState().moles[0]?.expireAt).toBe(123456);

    expect(() => store.setMoleExpiration(5, 1)).toThrow('Mole not found');
  });

  test('expireMole() flips state to hole and errors on invalid id', () => {
    const store = new GameStore();
    store.start(1, Date.now(), Date.now() + 1000);

    store.nominateMole(0);
    store.expireMole(0);
    expect(store.getState().moles[0]?.state).toBe('hole');

    expect(() => store.expireMole(5)).toThrow('Mole not found');
  });

  test('end() resets state', () => {
    const store = new GameStore();
    store.start(2, Date.now(), Date.now() + 1000);
    store.nominateMole(1);

    store.end();
    expect(store.getState()).toEqual({ moles: {}, score: 0, running: false });
  });

  describe('whackMole()', () => {
    test('throws if mole does not exist', () => {
      const store = new GameStore();
      store.start(1, Date.now(), Date.now() + 1000);
      expect(() => store.whackMole(2)).toThrow('Mole not found');
    });

    test('throws if game not started', () => {
      const store = new GameStore();
      store.start(1, Date.now(), Date.now() + 1000);
      store.end();
      expect(() => store.whackMole(0)).toThrow('Game has not been started');
    });

    test('throws if mole is not visible', () => {
      const store = new GameStore();
      store.start(1, Date.now(), Date.now() + 1000);
      // mole 0 is initially hole
      expect(() => store.whackMole(0)).toThrow('Mole is not visible');
    });

    test('awards score based on expireAt and sets mole back to hole', () => {
      const store = new GameStore();
      const now = 1_700_000_000_000;
      jest.spyOn(Date, 'now').mockReturnValue(now);

      store.start(1, now, now + 10_000);
      store.nominateMole(0);
      // expires in 450ms -> Math.round(450/100)=5 points
      store.setMoleExpiration(0, now + 450);

      const total = store.whackMole(0);
      expect(total).toBe(5);
      const state = store.getState();
      expect(state.score).toBe(5);
      expect(state.moles[0]?.state).toBe('hole');
    });

    test('cumulative score over multiple whacks', () => {
      const store = new GameStore();
      const now = 1_700_000_010_000;
      const nowSpy = jest.spyOn(Date, 'now');

      store.start(2, now, now + 10_000);

      // First mole: 1200ms -> 12 points
      nowSpy.mockReturnValue(now);
      store.nominateMole(0);
      store.setMoleExpiration(0, now + 1200);
      expect(store.whackMole(0)).toBe(12);

      // Second mole: 90ms -> rounds to 1 point
      nowSpy.mockReturnValue(now);
      store.nominateMole(1);
      store.setMoleExpiration(1, now + 90);
      expect(store.whackMole(1)).toBe(13);

      expect(store.getState().score).toBe(13);
    });
  });
});
