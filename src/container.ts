import { Observable } from 'rxjs/Observable';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { RootContainer } from './root_container';
import { Injectable, Optional, Inject } from '@angular/core';
import produce from 'immer';

let containerId = -1;

@Injectable()
export abstract class Container<S extends object> {
  private _state$ = new BehaviorSubject<S>(Object.assign({}, this.getInitialState()));
  private _containerId: number = ++containerId;

  constructor(
    @Optional()
    @Inject(RootContainer)
    private _rootContainer: RootContainer | null
  ) {
    if (this._rootContainer) {
      this._rootContainer.registerContainer(this);
    }
  }

  /**
   * setState updates the state of the container. The returned Observable completes when the state
   * state updated is completed.
   */
  protected setState(stateFn: (currentState: Readonly<S>) => Partial<S>) {
    this._state$.next(Object.assign({}, this._state$.value, stateFn(this._state$.value)));
  }

  protected updateState(stateFn: (currentState: S) => void) {
    this._state$.next(produce(this._state$.value, stateFn));
  }

  /**
   * Implement this method to describe the initial state of your container.
   */
  protected abstract getInitialState(): S;

  /**
   * select selects parts of current the state or the whole state.
   *
   * @final
   */
  select<K>(selectFn: (state: Readonly<S>) => K): Observable<K> {
    return this._state$.pipe(
      map(state => selectFn(state as Readonly<S>)),
      distinctUntilChanged()
    );
  }

  /**
   * When you override this method, you have to call the destroy method in your ngOnDestroy method.
   */
  protected ngOnDestroy() {
    this.destroy();
  }

  /**
   * Call this method if ngOnDestroy is overwritten.
   *
   * @final
   */
  protected destroy() {
    this._state$.complete();
    if (this._rootContainer) {
      this._rootContainer.unregisterContainer(this);
    }
  }

  /**
   * You can override this method if you want to give your container instance a custom id.
   * The returned id must be unique in the application.
   */
  getContainerInstanceId(): string {
    return `${this._getClassName()}@${this._containerId}`;
  }

  private _getClassName(): string {
    return this.constructor.name;
  }
}
