"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Client = require('node-rest-client').Client;
const client = new Client();
client.registerMethod("getSquadra", "http://portale.fitet.org/risultati/campionati/percentuali.php?SQUADRA=${squadra}&CAM=916", "GET");
exports.onPostback = (pl, chat, data, page_id) => {
    if (pl.startsWith("...")) {
        return true;
    }
    return false;
};
const squadre = [{ cod: 7401, name: "Castrocaro PUB" }];
exports.onMessage = (chat, text, page_id) => {
    if (!text.startsWith("tt "))
        return false;
    const data = text.substring(3);
    const codSquadra = squadre[0].cod;
    const startTag = "></a>";
    const namePrefix = `SQUADRA=${codSquadra}'>`;
    const dataPrefix = "<p class=dettagli>";
    // portale.fitet.org/risultati/campionati/percentuali.php?SQUADRA=7401&CAM=916
    /*
        ></a>
        </td><td height=24><p class=dettagli><a href='dettaglio_percentuali.php?IDA=729176&CAM=916&
        SQUADRA=7401'>CANGINI MATTEO</a></p></td><td height=24><p
        class=dettagli>rank. 5866 (2796)</p></td><td height=24><center>
        <p class=dettagli>3</p></center></td><td height=24><center>
        <p class=dettagli>2</p></center></td><td height=24><center>
        <p class=dettagli>1</p></center></td><td height=24><center>
        <p class=dettagli>7</p></center></td><td height=24><center>
        <p class=dettagli>6</p></center></td><td height=24><center>
        <p class=dettagli>134</p></center></td><td height=24><center>
        <p class=dettagli>126</p></center></td><td height=24><b><center>
        <p class=dettagli>66.7</p></center></b></td></tr><tr><td><a href='../new_rank/DettaglioAtleta.php?ATLETA=717524&ZU=0&AVVERSARIO=0&ID_CLASS=150'><img src='../../images/images.jpg' width=14 height=15 border=0
    */
    client.methods.getSquadra({ path: { squadra: 7401 } }, (data, response) => {
        console.log(response);
    });
};
function onLocationReceived(chat, coords, page_id) {
}
exports.onLocationReceived = onLocationReceived;
//# sourceMappingURL=tt.js.map