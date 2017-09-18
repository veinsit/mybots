

enum Enum {
  A
}
let a = Enum.A;
let nameOfA = Enum[a]; // "A"

enum Bacino { FC, RA, RN }
enum CU { Forli, Cesena, Cesenatico, Ravenna, Faenza, Rimini }
enum TL {U,S,X}

class Linea {
  public b:string
  public c:string
  public n:string
  public nome:string
  public tipo:string
  public cu:string
  constructor(b,c,n,nome,tipo,cu) {
    this.b = b
    this.c = c
    this.n = n
    this.nome = nome
    this.tipo = tipo
    this.cu = cu
  }
}
const MyRepo = {
    
    cus : [
      { cu:CU.Forli,  bacino:Bacino.FC},
      { cu:CU.Cesena, bacino:Bacino.FC},
      { cu:CU.Cesenatico, bacino:Bacino.FC},
      { cu:CU.Ravenna, bacino:Bacino.RA},
      { cu:CU.Faenza, bacino:Bacino.RA},
      { cu:CU.Rimini, bacino:Bacino.RN}
    ],
    
    linee :  [
      new Linea(Bacino.FC, "FOA1", "1A", "P.zza Saffi - Staz.FS - P.zza Saffi", TL.U, CU.Forli),
      new Linea(Bacino.FC, "FOB1", "1B", "P.zza Saffi - Staz.FS - P. Saffi", TL.U, CU.Forli),
      new Linea(Bacino.FC, "FO02", "2", "Staz. FS - Vecchiazzano", TL.U,CU.Forli),
      new Linea(Bacino.FC, "FO03", "3", "Staz. FS - Ospedale", TL.U,CU.Forli),
      new Linea(Bacino.FC, "CE02", "2", "CE CE", TL.U,CU.Cesena),
      new Linea(Bacino.FC, "CE03", "3", "CE CE", TL.U,CU.Cesena),
      new Linea(Bacino.FC, "FO04", "4", "Cava - Ronco", TL.U,CU.Forli),
      new Linea(Bacino.FC, "FO05", "5", "Iper - Z.I.Coriano - S.Martino", TL.U,CU.Forli),
      new Linea(Bacino.FC, "FOA5", "5A", "Iper - Fiera - S.Martino", TL.U,CU.Forli),
      new Linea(Bacino.FC, "FO06", "6", "Salinatore - Romiti", TL.U,CU.Forli),
      new Linea(Bacino.FC, "FO07", "7", "(Iper) - Fiera - Ronco", TL.U,CU.Forli),
      new Linea(Bacino.FC, "FO08", "8", "Via Lunga - S. Martino in Strada", TL.U,CU.Forli),
      new Linea(Bacino.FC, "FO11", "11", "Gigante - Pieve Acquedotto - Villagrappa", TL.U,CU.Forli),
      new Linea(Bacino.FC, "FO12", "12", "Villanova - Carpinello - (Rotta)", TL.U,CU.Forli),
      new Linea(Bacino.FC, "FO13", "13", "San Leonardo - Piazzale della Vittoria", TL.U,CU.Forli),
      new Linea(Bacino.FC, "S091", "91", "Forlì FS - Castrocaro T.", TL.U,CU.Forli),
      new Linea(Bacino.FC, "S092", "92", "Forlì FS - Cesena Punto Bus", TL.S,CU.Forli),
      new Linea(Bacino.FC, "S094", "94", "Cesena Punto Bus - Cesenatico Porto Canale", TL.S,CU.Forli),
      new Linea(Bacino.FC, "S095", "95", "Cesena Punto Bus - Savignano", TL.S,CU.Cesena),
      new Linea(Bacino.FC, "F112", "112", "Montiano - Cesenatico", TL.X,CU.Cesenatico),
      new Linea(Bacino.FC, "F121", "121", "Forlimpopoli - S. Pietro in Guardiano e Forlimpopoli - Bertinoro", TL.X, null),
      new Linea(Bacino.FC, "F122", "122", "Forlimpopoli - Fratta Terme - Meldola", TL.X, null),
      new Linea(Bacino.FC, "F125", "125", "Forlì - Forlimpopoli - Cesena - (Savignano)", TL.X, CU.Forli),
      new Linea(Bacino.FC, "F126", "126", "(Bcn.FC, Faenza) - Forlì - Cervia - S.Mauro Mare", TL.X, CU.Forli),
      new Linea(Bacino.FC, "F126p","126p" , "Rotta - Forlì", TL.X, CU.Forli),
      new Linea(Bacino.FC, "F127", "127", "Forlì - Rocca S.Casciano - Portico - S.Benedetto - Muraglione", TL.X, CU.Forli),
      new Linea(Bacino.FC, "F129", "129", "Forlì - Predappio - Premilcuore", TL.X, CU.Forli),
      new Linea(Bacino.FC, "F131", "131", "Forlì - S.Sofia - Bagno di Romagna", TL.X, CU.Forli),
      new Linea(Bacino.FC, "F131p", "131p", "S.Sofia - Bagno di Romagna", TL.X, null),
      new Linea(Bacino.FC, "F132", "132", "Forlì - Meldola - S.Sofia - Campigna", TL.X, CU.Forli),
      new Linea(Bacino.FC, "F132p", "132p", "Forlì - Carpena - Magliano", TL.X, CU.Forli),
      new Linea(Bacino.FC, "F133", "133", "S.Sofia - Cesena", TL.X, CU.Cesena),
      new Linea(Bacino.FC, "F134", "134", "Forlì - Forlimpopoli - Fratta Terme - Bertinoro - Polenta", TL.X, CU.Forli),
      new Linea(Bacino.FC, "F136", "136", "Mensa Matellica - Forlì", TL.X, CU.Forli),
      new Linea(Bacino.FC, "F137", "137", "Borello - Zanussi", TL.X, CU.Cesena),
      new Linea(Bacino.FC, "F138", "138", "Cesena - Bagno di Romagna - Balze", TL.X, CU.Cesena),
      new Linea(Bacino.FC, "F139", "139", "Cesena - Pieve S.Stefano", TL.X, CU.Cesena),
     new Linea(Bacino.FC, "F140","140", "Cesena - Savignano - Longiano - Sogliano - Perticara", TL.X, CU.Cesena),
     new Linea(Bacino.FC, "F141","141", "Cesena - Savignano - Longiano - Sogliano - Perticara", TL.X, CU.Cesena),
     new Linea(Bacino.FC, "F166","166", "Cesena - Savignano - Longiano - Sogliano - Perticara", TL.X, CU.Cesena),

     new Linea(Bacino.FC, "F144","144", "Ciola - Mercato Saraceno", TL.X, CU.Cesena),
     new Linea(Bacino.FC, "F145","145", "Sogliano - Mercato Saraceno", TL.X, CU.Cesena),

     new Linea(Bacino.FC, "F146","146", "Cesena - Cesenatico - Igea Marina", TL.X, CU.Cesena),
     new Linea(Bacino.FC, "F147","147", "Cesena - Cesenatico - Igea Marina", TL.X, CU.Cesena),
         
     new Linea(Bacino.FC, "F148","148", "Cesena - Sala", TL.X, CU.Cesena),
     new Linea(Bacino.FC, "F149","149", "Cesena-Ravenna", TL.X, CU.Cesena),
     new Linea(Bacino.FC, "F153","153", "Forlì - Villafranca - Prada - Russi", TL.X, CU.Forli),
     new Linea(Bacino.FC, "F155","155", "Cesena - Case Marani - Calisese - Saiano", TL.X, CU.Cesena),
     new Linea(Bacino.FC, "F156","156", "Forlì-Ravenna", TL.X, CU.Forli),
     new Linea(Bacino.FC, "F157","157", "Forlì - Roncadello - Bacino.RAnzolino - Barisano", TL.X, CU.Forli),
     new Linea(Bacino.FC, "F165","165", "Cesenatico - Gatteo - S. Mauro Pascoli - Savignano", TL.X, CU.Cesenatico),

     new Linea(Bacino.FC, "F003","203","Borello - Bora - Teodorano", TL.X, CU.Cesena),
     new Linea(Bacino.FC, "F006","206","S.Piero in Bagno - Bagno di Romagna", TL.X, CU.Cesena),
     new Linea(Bacino.FC, "F008","208","Panighina - Cesena", TL.X, CU.Cesena),

     new Linea(Bacino.FC, "F009","209", "Bagno di Romagna - Verghereto - Pieve S.Stefano", TL.X, CU.Cesena),
     new Linea(Bacino.FC, "F010","210", "Spinello - Cesena", TL.X, CU.Cesena),
     new Linea(Bacino.FC, "F016","216", "Torre del Moro - Casalecchio - Tipano - S. Domenico", TL.X, CU.Cesena),
     new Linea(Bacino.FC, "F016","216", "Cesena - Tessello - Tipano - Cesena", TL.X, CU.Cesena),
     new Linea(Bacino.FC, "F018","218", "Bagno di Romagna - S.Piero in Bagno - Acquapartita - Alfero - Riofreddo", TL.X, CU.Cesena),
     new Linea(Bacino.FC, "F021","221", "Mercato Saraceno - S.Andrea in Bagnolo", TL.X, CU.Cesena),
     new Linea(Bacino.FC, "F025","225", "Cesena - Saiano - Sorrivoli - Oriola - Cesena", TL.X, CU.Cesena),
     new Linea(Bacino.FC, "F041","241", "Cesena - Pinarella - Cervia - Milano Marittima - Savio", TL.X, CU.Cesena),
     new Linea(Bacino.FC, "F050","250", "Cesena - Savio di Ravenna", TL.X, CU.Cesena),
     new Linea(Bacino.FC, "F061","261", "Cesena - Montiano - Montenovo", TL.X, CU.Cesena),
     new Linea(Bacino.FC, "F077","277", "Cesena - Pisignano - Cervia", TL.X, CU.Cesena),
     // TODO completare linee
   
    ],    

    funs : {
      getCUs   : (bacino:string) : string[]  => 
                    MyRepo.cus.filter(it=>Enum[it.bacino]===bacino).map(it=>Enum[it.cu]),

      getLinee : (bacino:string, cu:string) : Linea[] => 
                    MyRepo.linee.filter(it=>it.b===Enum[bacino] && (!cu || it.cu===Enum[cu])),//.map(it=>it.n),
    },

    testFuns : {
        test : () => console.log(MyRepo.funs.getCUs("RA"))
    }

}
    

exports.repo = MyRepo