import express, {Request, Response} from "express";
import {randomUUID} from "node:crypto"; // ES PARA GENERAR VALORES ALEATOREOS

const PORT= Number(process.env.PORT?? 3000);
const AGENDA_URL= process.env.AGENDA_URL ?? "http://localhost:3001";
const TIMEOUT_MS = Number(process.env.TIMEOUT_MS ?? 2000);

interface Cita {
    id: string;
    id_agenda: string;
    cantidad: number;
    creadoEn: string;
}

const citas: Cita []=[];
const app= express();
app.use(express.json());

// consulta salud del servicio
app.get ("/health",(_req: Request, res: Response) =>{

    res.json({status:"ok",servicio: "citas"});
});

/// listado de pedidos
app.get("/citas",(_req: Request, res: Response) =>{

    res.json(citas);

});


app.post("/citas",async(req: Request, res: Response )=>{
const {id_agenda, cantidad}= req.body??{};
if (typeof id_agenda !== "string" || typeof cantidad !== "number" || cantidad <=0){
     res.status(400).json ({error: " tipos de datos incorrectos o cantidad negativa"});
     return;

}
const inicio = performance.now(); 

try{
 const r= await fetch( `${AGENDA_URL}/stock/${encodeURIComponent(id_agenda)}`,{
    signal: AbortSignal.timeout(TIMEOUT_MS),
       
        } );
        if(r.status===404){
                 res.status(404).json({error: "id_agenda no existe en la agenda"});   
                return;
        };
        const cupos= ( await r.json()) as { disponible: number};
        if(cupos.disponible < cantidad){
            res.status(409).json ({error: "cupos insuficiente "+ " disponible: "+cupos.disponible});
            return;     
        }
        const citas: Cita = {id : randomUUID(), id_agenda, cantidad, creadoEn: new Date().toISOString()};
        citas.push(Cita);
        res.status(201).json(Cita);

    } catch (error) {
            const duracionMs= Math.round( performance.now() - inicio);
            const e = error as Error & { cause ?: {code?: string}};
            const motivo= e.name=== "TimeoutError" ? "Inventario no constetó en "+ TIMEOUT_MS+"ms" : " NOSE PUDO COENTAR CON iNVENTARIO "+ (e.cause?.code ?? e.message) ;
            console.error (citas + " "+motivo);
            res.status(503).json({error: "agenda no disponible "+motivo, duracionMs});      
}
});



// puerto en el que escucha
app.listen(PORT,()=>{

console.log("servivio de pedidos escuchando en el puerto: "+PORT+ " inventario: "+INVENTARIO_URL+ " timeout: "+TIMEOUT_MS+"ms");        


});







