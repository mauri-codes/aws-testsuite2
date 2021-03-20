import { TestResult } from "../";
import { Either } from "./";

function CatchTestError(errorHandler?: (error: Either<Error, TestError>) => TestResult) {
   return function(target: any, key: string, descriptor: PropertyDescriptor) {
      const originalMethod = descriptor.value

      descriptor.value = async function(...args: any[]): Promise<TestResult> {
         try {
               return await originalMethod.apply(this, args)
         } catch (error) {
               console.log(JSON.stringify(error))
               if(errorHandler) {
                  return errorHandler(error)
               }
               let response: TestResult = {
                  success: false,
                  message: error.message,
                  error: error.message
               }
               if (error.code) {
                  response.error = error.code
               }
               return response
         }
      }

      return descriptor
   }
}

interface ErrorDescriptor {
   error: string
   message: string
   code: string
}

function CatchError(errorPool: ErrorDescriptor[] = []) {
   return function(target: any, key: string, descriptor: PropertyDescriptor) {
      const originalMethod = descriptor.value

      descriptor.value = async function(...args: any[]) {
         try {
               return await originalMethod.apply(this, args)
         } catch (error) {
               console.log(JSON.stringify(error))
               let errorFound = errorPool.find(errorItem => errorItem.error == error.message)
               if (errorFound) {
                  const {code, message} = errorFound
                  throw new TestError(code, message)
               }
               throw new Error(error.message)
         }
      }
      return descriptor
   }
}

class TestError extends Error {
   code: string
   constructor(code: string, message: string) {
      super(message)
      this.code = code
   }
}
