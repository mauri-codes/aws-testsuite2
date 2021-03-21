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
                  error: error.code || "500"
               }
               return response
         }
      }
      return descriptor
   }
}

interface ErrorDescriptor {
   message: string
   code: string
}

function CatchError(errorPool?: ErrorDescriptor[]) {
   return function(target: any, key: string, descriptor: PropertyDescriptor) {
      const originalMethod = descriptor.value

      descriptor.value = async function(...args: any[]) {
         try {
               return await originalMethod.apply(this, args)
         } catch (error) {
            console.log("---");
            console.log(error);

            throw error
         }
      }
      return descriptor
   }
}

class TestError extends Error {
   info: ErrorDescriptor
   code: string
   constructor(error: ErrorDescriptor) {
      super(error.message)
      this.info = error
      this.code = error.code
   }
}


export { TestError, ErrorDescriptor, CatchError, CatchTestError }
