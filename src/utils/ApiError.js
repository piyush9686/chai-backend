class ApiErrror extends Error {
    constructor(
        statuscode,
        message="something went wrong",
        errors=[],
        statck=""
    ){                         //constructor override
        super(message);  //Error class ka constructor call krdenge
        this.statuscode=statuscode;
        this.data=null;
        this.message=message;
        this.success=false;
        this.errors=errors;
      

        if(stack){
            this.stack=statck;
        }
        else{
            Error.captureStackTrace(this,this.constructor);
        }

    }
}   
export {ApiErrror}