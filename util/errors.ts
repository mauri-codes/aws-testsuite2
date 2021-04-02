import { TestResult } from "../";
import { Either } from "./";

function CatchTestError(id: string, errorHandler?: (error: Either<Error, TestError>) => TestResult) {
   return function(target: any, key: string, descriptor: PropertyDescriptor) {
      const originalMethod = descriptor.value

      descriptor.value = async function(...args: any[]): Promise<TestResult> {
         try {
            return await originalMethod.apply(this, args)
         } catch (error) {
            if(errorHandler) {
               return errorHandler(error)
            }
            let response: TestResult = {
               id,
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

interface ErrorPipe {
   errorChecker: (error: any) => boolean
   toError: ErrorDescriptor
   skipThrow?: boolean
}

function CatchError(errorPool?: ErrorPipe[]) {
   return function(target: any, key: string, descriptor: PropertyDescriptor) {
      const originalMethod = descriptor.value

      descriptor.value = async function(...args: any[]) {
         try {
            return await originalMethod.apply(this, args)
         } catch (error) {
            let errorFound = errorPool?.find(errorPipe => errorPipe.errorChecker(error))
            
            if (errorFound) {
               if (errorFound.skipThrow) {
                  return descriptor
               }
               throw errorFound.toError
            }
            
            throw error
         }
      }
      return descriptor
   }
}

interface ResourceError {
   errorChecker: (error: any) => boolean,
   value: any
}

const AWSError = (awsError: string) => {
   return (error: any) => error.code == awsError
}

function CatchResourceError(errorPool?: ResourceError[]) {
   return function(target: any, key: string, descriptor: PropertyDescriptor) {
      const originalMethod = descriptor.value

      descriptor.value = async function(...args: any[]) {
         try {
            return await originalMethod.apply(this, args)
         } catch (error) {            
            let errorFound = errorPool?.find(errorPipe => errorPipe.errorChecker(error))
            
            if (errorFound) {
               return errorFound.value
            }
            
            throw error
         }
      }
      return descriptor
   }
}

function CatchInferanceError() {
   return function(target: any, key: string, descriptor: PropertyDescriptor) {
      const originalMethod = descriptor.value

      descriptor.value = async function(...args: any[]) {
         try {
            return await originalMethod.apply(this, args)
         } catch (error) {
            console.log(error);
            return null
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


export {
   TestError,
   ErrorDescriptor,
   CatchError,
   CatchTestError,
   CatchInferanceError,
   ErrorPipe,
   CatchResourceError,
   ResourceError,
   AWSError
}
