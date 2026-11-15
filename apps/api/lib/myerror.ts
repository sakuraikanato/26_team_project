export class MyError extends Error {
  err: { code: string, message: string, details: { field: string, message: string} | null}
  httpcode: number
  constructor(code: string, message: string, ob: { field: string, message: string } | null, httpcode: number) {
    super();
    if (ob) this.err = { 
      code: code, 
      message: message, 
      details: {
        field: ob.field,
        message: ob.message
      }}
    
    this.err = {
      code: code,
      message: message,
      details: null
    }
    this.httpcode = httpcode
  }

  response() {
    return { object: this.err, HTTPValue: this.httpcode };
  }
}