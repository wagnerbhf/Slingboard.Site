import { Injectable, inject, signal } from '@angular/core';
import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import { Observable, Subject } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { REALTIME_EVENT_NAMES, RealtimeEvent } from './realtime.models';

@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private readonly authService = inject(AuthService);

  private connection: HubConnection | null = null;
  private connectionStart: Promise<void> | null = null;
  private readonly joinedBoardIds = new Set<string>();

  private readonly eventsSubject = new Subject<RealtimeEvent>();
  readonly events$: Observable<RealtimeEvent> = this.eventsSubject.asObservable();

  readonly connectionState = signal<HubConnectionState>(HubConnectionState.Disconnected);

  async joinBoard(boardId: string): Promise<void> {
    const connection = await this.ensureConnected();
    await connection.invoke('JoinBoard', boardId);
    this.joinedBoardIds.add(boardId);
  }

  async leaveBoard(boardId: string): Promise<void> {
    this.joinedBoardIds.delete(boardId);
    if (this.connection?.state !== HubConnectionState.Connected) {
      return;
    }
    await this.connection.invoke('LeaveBoard', boardId);
  }

  private async ensureConnected(): Promise<HubConnection> {
    if (!this.connection) {
      this.connection = this.buildConnection();
    }

    if (this.connection.state === HubConnectionState.Connected) {
      return this.connection;
    }

    this.connectionStart ??= this.connection
      .start()
      .then(() => this.connectionState.set(this.connection!.state));

    await this.connectionStart;
    return this.connection;
  }

  private buildConnection(): HubConnection {
    const connection = new HubConnectionBuilder()
      .withUrl(`${environment.apiOrigin}/hubs/kanban`, {
        accessTokenFactory: () => this.authService.accessToken() ?? '',
      })
      .withAutomaticReconnect()
      .build();

    for (const eventName of REALTIME_EVENT_NAMES) {
      connection.on(eventName, (payload: unknown) => {
        this.eventsSubject.next({ type: eventName, payload } as RealtimeEvent);
      });
    }

    connection.onreconnected(() => {
      this.connectionState.set(connection.state);
      for (const boardId of this.joinedBoardIds) {
        void connection.invoke('JoinBoard', boardId);
      }
    });
    connection.onreconnecting(() => this.connectionState.set(connection.state));
    connection.onclose(() => {
      this.connectionState.set(connection.state);
      this.connectionStart = null;
    });

    return connection;
  }
}
