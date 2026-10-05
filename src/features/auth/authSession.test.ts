import { beforeEach, describe, expect, it } from "vitest";
import { authSession, type AuthResponse } from "./authSession";

class MemorySessionStorage implements Storage {
  private data = new Map<string,string>();
  get length(){return this.data.size}
  clear(){this.data.clear()}
  getItem(key:string){return this.data.get(key)??null}
  key(index:number){return Array.from(this.data.keys())[index]??null}
  removeItem(key:string){this.data.delete(key)}
  setItem(key:string,value:string){this.data.set(key,value)}
}

const baseSession:AuthResponse={
  accessToken:"access",
  refreshToken:"refresh",
  accessTokenExpiresDate:"2030-01-01T00:00:00Z",
  user:{
    userId:"user",
    clinicId:"clinic",
    fullName:"Test User",
    email:"test@auran.local",
    isSuperUser:false,
    roles:["DOCTOR"],
    permissions:["Visit_View","Visit_Edit"]
  }
};

describe("authSession permissions",()=>{
  beforeEach(()=>{
    Object.defineProperty(globalThis,"sessionStorage",{value:new MemorySessionStorage(),configurable:true});
    authSession.set(null);
  });

  it("grants explicitly assigned permissions",()=>{
    authSession.set(baseSession);
    expect(authSession.hasPermission("Visit_View")).toBe(true);
    expect(authSession.hasPermission("Settings_Manage")).toBe(false);
  });

  it("grants every permission to protected super users",()=>{
    authSession.set({...baseSession,user:{...baseSession.user,isSuperUser:true,permissions:[]}});
    expect(authSession.hasPermission("Settings_Manage")).toBe(true);
    expect(authSession.hasPermission("Dashboard_View")).toBe(true);
  });

  it("denies permissions when there is no session",()=>{
    expect(authSession.hasPermission("Visit_View")).toBe(false);
  });
});
