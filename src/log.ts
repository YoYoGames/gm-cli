export interface Log {
  message(msg: string): void;
  error(message: string): void;
  success(message: string): void;
}
