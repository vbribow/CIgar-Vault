type AuthFailure={code?:string|null;message?:string|null};

export function isEmailNotConfirmed(error:AuthFailure){
 return error.code==="email_not_confirmed"||String(error.message||"").toLowerCase().includes("email not confirmed");
}
