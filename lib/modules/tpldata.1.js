
const bFC = "FC"
const bRA = "RA"
const bRN = "RN"

const MyRepo = {
    
    cus : [
      {cu: "Forlì",  bacino:bFC},
      {cu: "Cesena", bacino:bFC},
      {cu: "Cesenatico", bacino:bFC},
      {cu: "Ravenna", bacino:bRA},
      {cu: "Faenza", bacino:bRA},
      {cu: "Rimini", bacino:bRN}
    ],
    
    linee : [
      { b:bFC, c:"FOA1", n:"1A", nome:"P.zza Saffi - Staz.FS - P.zza Saffi", tipo:"U", cu:MyRepo.cus[0].cu},
      { b:bFC, c:"FOB1", n:"1B", nome:"P.zza Saffi - Staz.FS - P. Saffi", tipo:"U",    cu:MyRepo.cus[0].cu},
    ],    

    funs : {
      getCUs   : (bacino)     => MyRepo.cus.filter(it=>it.bacino===bacino).map(it=>it.cu),
      getLinee : (bacino, cu) => MyRepo.linee.filter(it=>it.bacino===bacino && (!cu || it.cu===cu)).map(it=>it.linea),
    },

    testFuns : {
        test : () => console.log(MyRepo.getCUs("RA"))
    }

    }
    
/*

    fun getLinee(b: Bcn) : List<DescLinea> = linee.filter{ it.bacino:==b }.toList()
    fun getLinee(b: Bcn, cu:CU) : List<DescLinea> = linee.filter{ it.bacino:==b && it.cu==cu}.toList()
    fun getLinee(cu:CU, tl:TipiLinea) : List<DescLinea> = linee.filter{it.cu==cu && it.tl==tl}.toList()

    fun getNumLinea(lineaId:String) : String = linee.filter{it.lineaId==lineaId}[0].lineaNum


    val linee = arrayOf(

           DescLinea(Bcn.FC, "FOA1", "1A", "P.zza Saffi - Staz.FS - P.zza Saffi", TipiLinea.U, CU.FO)
         , DescLinea(Bcn.FC, "FOB1", "1B", "P.zza Saffi - Staz.FS - P. Saffi", TipiLinea.U, CU.FO)
         , DescLinea(Bcn.FC, "FO02", "2", "Staz. FS - Vecchiazzano", TipiLinea.U, CU.FO)
         , DescLinea(Bcn.FC, "FO03", "3", "Staz. FS - Ospedale", TipiLinea.U, CU.FO)
         , DescLinea(Bcn.FC, "FO04", "4", "Cava - Ronco", TipiLinea.U, CU.FO)
         , DescLinea(Bcn.FC, "FO05", "5", "Iper - Z.I.Coriano - S.Martino", TipiLinea.U, CU.FO)
         , DescLinea(Bcn.FC, "FOA5", "5A", "Iper - Fiera - S.Martino", TipiLinea.U, CU.FO)
         , DescLinea(Bcn.FC, "FO06", "6", "Salinatore - Romiti", TipiLinea.U, CU.FO)
         , DescLinea(Bcn.FC, "FO07", "7", "(Iper) - Fiera - Ronco", TipiLinea.U, CU.FO)
         , DescLinea(Bcn.FC, "FO08", "8", "Via Lunga - S. Martino in Strada", TipiLinea.U, CU.FO)
         , DescLinea(Bcn.FC, "FO11", "11", "Gigante - Pieve Acquedotto - Villagrappa", TipiLinea.U, CU.FO)
         , DescLinea(Bcn.FC, "FO12", "12", "Villanova - Carpinello - (Rotta)", TipiLinea.U, CU.FO)
         , DescLinea(Bcn.FC, "FO13", "13", "San Leonardo - Piazzale della Vittoria", TipiLinea.U, CU.FO)

         , DescLinea(Bcn.FC, "S091", "91", "Forlì FS - Castrocaro T.", TipiLinea.U, CU.FO)

         , DescLinea(Bcn.FC, "S092", "92", "Forlì FS - Cesena Punto Bus", TipiLinea.S, CU.FO)
         , DescLinea(Bcn.FC, "S094", "94", "Cesena Punto Bus - Cesenatico Porto Canale", TipiLinea.S, CU.FO)
         , DescLinea(Bcn.FC, "S095", "95", "Cesena Punto Bus - Savignano", TipiLinea.S, CU.CE)

         , DescLinea(Bcn.FC, "F112", "112", "Montiano - Cesenatico", TipiLinea.X, CU.CO)
         , DescLinea(Bcn.FC, "F121", "121", "Forlimpopoli - S. Pietro in Guardiano e Forlimpopoli - Bertinoro", TipiLinea.X, null)
         , DescLinea(Bcn.FC, "F122", "122", "Forlimpopoli - Fratta Terme - Meldola", TipiLinea.X, null)
         , DescLinea(Bcn.FC, "F125", "125", "Forlì - Forlimpopoli - Cesena - (Savignano)", TipiLinea.X, CU.FO)
         , DescLinea(Bcn.FC, "F126", "126", "(Bcn.FC, Faenza) - Forlì - Cervia - S.Mauro Mare", TipiLinea.X, CU.FO)
         , DescLinea(Bcn.FC, "F126p" , "126p", "Rotta - Forlì", TipiLinea.X, CU.FO)
         , DescLinea(Bcn.FC, "F127", "127", "Forlì - Rocca S.Casciano - Portico - S.Benedetto - Muraglione", TipiLinea.X, CU.FO)
         , DescLinea(Bcn.FC, "F129", "129", "Forlì - Predappio - Premilcuore", TipiLinea.X, CU.FO)
         , DescLinea(Bcn.FC, "F131", "131", "Forlì - S.Sofia - Bagno di Romagna", TipiLinea.X, CU.FO)
         , DescLinea(Bcn.FC, "F131p", "131p", "S.Sofia - Bagno di Romagna", TipiLinea.X, null)
         , DescLinea(Bcn.FC, "F132", "132", "Forlì - Meldola - S.Sofia - Campigna", TipiLinea.X, CU.FO)
         , DescLinea(Bcn.FC, "F132p", "132p", "Forlì - Carpena - Magliano", TipiLinea.X, CU.FO)
         , DescLinea(Bcn.FC, "F133", "133", "S.Sofia - Cesena", TipiLinea.X, CU.CE)
         , DescLinea(Bcn.FC, "F134", "134", "Forlì - Forlimpopoli - Fratta Terme - Bertinoro - Polenta", TipiLinea.X, CU.FO)
         , DescLinea(Bcn.FC, "F136", "136", "Mensa Matellica - Forlì", TipiLinea.X, CU.FO)
         , DescLinea(Bcn.FC, "F137", "137", "Borello - Zanussi", TipiLinea.X, CU.CE)
         , DescLinea(Bcn.FC, "F138", "138", "Cesena - Bagno di Romagna - Balze", TipiLinea.X, CU.CE)
         , DescLinea(Bcn.FC, "F139", "139", "Cesena - Pieve S.Stefano", TipiLinea.X, CU.CE)

        , DescLinea(Bcn.FC, "F140","140", "Cesena - Savignano - Longiano - Sogliano - Perticara", TipiLinea.X, CU.CE)
        , DescLinea(Bcn.FC, "F141","141", "Cesena - Savignano - Longiano - Sogliano - Perticara", TipiLinea.X, CU.CE)
        , DescLinea(Bcn.FC, "F166","166", "Cesena - Savignano - Longiano - Sogliano - Perticara", TipiLinea.X, CU.CE)

        , DescLinea(Bcn.FC, "F144","144", "Ciola - Mercato Saraceno", TipiLinea.X, CU.CE)
        , DescLinea(Bcn.FC, "F145","145", "Sogliano - Mercato Saraceno", TipiLinea.X, CU.CE)

        , DescLinea(Bcn.FC, "F146","146", "Cesena - Cesenatico - Igea Marina", TipiLinea.X, CU.CE)
        , DescLinea(Bcn.FC, "F147","147", "Cesena - Cesenatico - Igea Marina", TipiLinea.X, CU.CE)
            
        , DescLinea(Bcn.FC, "F148","148", "Cesena - Sala", TipiLinea.X, CU.CE)
        , DescLinea(Bcn.FC, "F149","149", "Cesena-Ravenna", TipiLinea.X, CU.CE)
        , DescLinea(Bcn.FC, "F153","153", "Forlì - Villafranca - Prada - Russi", TipiLinea.X, CU.FO)
        , DescLinea(Bcn.FC, "F155","155", "Cesena - Case Marani - Calisese - Saiano", TipiLinea.X, CU.CE)
        , DescLinea(Bcn.FC, "F156","156", "Forlì-Ravenna", TipiLinea.X, CU.FO)
        , DescLinea(Bcn.FC, "F157","157", "Forlì - Roncadello - Branzolino - Barisano", TipiLinea.X, CU.FO)
        , DescLinea(Bcn.FC, "F165","165", "Cesenatico - Gatteo - S. Mauro Pascoli - Savignano", TipiLinea.X, CU.CO)

        , DescLinea(Bcn.FC, "F003","203","Borello - Bora - Teodorano", TipiLinea.X, CU.CE)
        , DescLinea(Bcn.FC, "F006","206","S.Piero in Bagno - Bagno di Romagna", TipiLinea.X, CU.CE)
        , DescLinea(Bcn.FC, "F008","208","Panighina - Cesena", TipiLinea.X, CU.CE)

        , DescLinea(Bcn.FC, "F009","209", "Bagno di Romagna - Verghereto - Pieve S.Stefano", TipiLinea.X, CU.CE)
        , DescLinea(Bcn.FC, "F010","210", "Spinello - Cesena", TipiLinea.X, CU.CE)
        , DescLinea(Bcn.FC, "F016","216", "Torre del Moro - Casalecchio - Tipano - S. Domenico", TipiLinea.X, CU.CE)
        , DescLinea(Bcn.FC, "F016","216", "Cesena - Tessello - Tipano - Cesena", TipiLinea.X, CU.CE)
        , DescLinea(Bcn.FC, "F018","218", "Bagno di Romagna - S.Piero in Bagno - Acquapartita - Alfero - Riofreddo", TipiLinea.X, CU.CE)
        , DescLinea(Bcn.FC, "F021","221", "Mercato Saraceno - S.Andrea in Bagnolo", TipiLinea.X, CU.CE)
        , DescLinea(Bcn.FC, "F025","225", "Cesena - Saiano - Sorrivoli - Oriola - Cesena", TipiLinea.X, CU.CE)
        , DescLinea(Bcn.FC, "F041","241", "Cesena - Pinarella - Cervia - Milano Marittima - Savio", TipiLinea.X, CU.CE)
        , DescLinea(Bcn.FC, "F050","250", "Cesena - Savio di Ravenna", TipiLinea.X, CU.CE)
        , DescLinea(Bcn.FC, "F061","261", "Cesena - Montiano - Montenovo", TipiLinea.X, CU.CE)
        , DescLinea(Bcn.FC, "F077","277", "Cesena - Pisignano - Cervia", TipiLinea.X, CU.CE)
        // TODO completare linee

    )
}
*/