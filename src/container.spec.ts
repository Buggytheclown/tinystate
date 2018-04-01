import { Container } from './container';
import { toPromise, first } from 'rxjs/operators';

describe('ContainerSpec', () => {
  describe('Container work correctly', () => {
    const TEST_MOCK = {
      initialValue: 42,
      delta: 101
    };

    interface CounterState {
      count: number;
    }

    class CounterContainer extends Container<CounterState> {
      getInitialState(): CounterState {
        return {
          count: TEST_MOCK.initialValue
        };
      }

      increment(increment: number) {
        this.immerUpdate(increment);
      }

      private partialUpdate(increment: number) {
        this.setState(state => ({ count: state.count + increment }));
      }

      private immerUpdate(increment: number) {
        this.updateState(state => {
          state.count += increment;
        });
      }
    }

    let counterContainer: CounterContainer;

    beforeEach(() => {
      counterContainer = new CounterContainer(null);
    });

    it('Should have initial state', () => {
      counterContainer
        .select<number>(state => state.count)
        .pipe(first())
        .subscribe(state => expect(state).toBe(TEST_MOCK.initialValue));
    });

    it('Should increase value', () => {
      counterContainer.increment(TEST_MOCK.delta);
      counterContainer
        .select<number>(state => state.count)
        .pipe(first())
        .subscribe(state => expect(state).toBe(TEST_MOCK.initialValue + TEST_MOCK.delta));
    });

    it('State should be immutable', () => {
      let initialCounter: CounterState;
      counterContainer
        .select<CounterState>(state => state)
        .pipe(first())
        .subscribe(state => (initialCounter = state));

      counterContainer.increment(TEST_MOCK.delta);

      let newCounter: CounterState;
      counterContainer
        .select<CounterState>(state => state)
        .pipe(first())
        .subscribe(state => (newCounter = state));

      expect(initialCounter).not.toEqual(newCounter);
      expect(initialCounter).toEqual({ count: TEST_MOCK.initialValue });
      expect(newCounter).toEqual({ count: TEST_MOCK.initialValue + TEST_MOCK.delta });
    });
  });
});
