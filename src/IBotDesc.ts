
export interface ICommand{
  command: RegExp;
  help: string;
  usage?: string;
  exec(msg:any, reply:any): void;
}
/*
export class IItemDesc {
  tokens: string[]
  // pattern?: RegExp;
  action(convo:any, heard:string) : void 
}
*/
export interface IBotDesc {
  hearings : any[]
}

