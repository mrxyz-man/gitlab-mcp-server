export type HealthCheckInput = {
  ping?: string;
};

export type HealthCheckOutput = {
  status: 'ok';
  echo: string;
};

export class HealthCheckUseCase {
  execute(input: HealthCheckInput): HealthCheckOutput {
    return {
      status: 'ok',
      echo: input.ping ?? 'pong'
    };
  }
}
