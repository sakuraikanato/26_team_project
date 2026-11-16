export class MyError extends Error {
  err: { code: string, message: string, details: { field: string, message: string}[] | null }
  httpcode: number
  constructor(object: { code: string, message: string, details: { field: string, message: string }[] | null}, httpcode: number) {
    super();
    this.err = object;
    this.httpcode = httpcode;
  }

  response() {
    return [ this.err, this.httpcode ];
  }
}