
type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };
// let v: Either<A,B>; means v is either A or B exclusively
export type Either<T, U> = (T | U) extends object ? (Without<T, U> & U) | (Without<U, T> & T) : T | U;
