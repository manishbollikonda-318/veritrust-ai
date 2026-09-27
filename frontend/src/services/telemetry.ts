export interface AnalyticsEvent {
  eventName: string;
  payload?: Record<string, any>;
  timestamp: string;
}

class TelemetryService {
  private events: AnalyticsEvent[] = [];

  track(eventName: string, payload?: Record<string, any>) {
    const event: AnalyticsEvent = {
      eventName,
      payload,
      timestamp: new Date().toISOString()
    };
    this.events.push(event);
    if (this.events.length > 100) {
      this.events.shift();
    }
  }

  getRecentEvents(): AnalyticsEvent[] {
    return [...this.events];
  }
}

export const telemetry = new TelemetryService();
